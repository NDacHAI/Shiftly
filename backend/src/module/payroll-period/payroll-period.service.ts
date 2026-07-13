import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { PayrollPeriodQueryDto } from './dto/payroll-period-query.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { PayrollPeriodStatus } from './entities/payroll-period-status.enum';
import { PayrollPeriod } from './entities/payroll-period.entity';

export type PaginatedPayrollPeriods = {
    data: PayrollPeriod[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class PayrollPeriodService {
    constructor(
        @InjectRepository(PayrollPeriod)
        private readonly payrollPeriodRepository: Repository<PayrollPeriod>,
    ) {}

    async create(
        payload: CreatePayrollPeriodDto,
        createdById: number,
    ): Promise<PayrollPeriod> {
        this.ensureDateRange(payload.startDate, payload.endDate);
        await this.ensureMonthYearUnique(
            payload.payrollMonth,
            payload.payrollYear,
        );
        await this.ensureDateRangeNotOverlapping(
            payload.startDate,
            payload.endDate,
        );

        const period = this.payrollPeriodRepository.create({
            ...this.buildGeneratedFields(
                payload.payrollMonth,
                payload.payrollYear,
            ),
            payrollMonth: payload.payrollMonth,
            payrollYear: payload.payrollYear,
            startDate: payload.startDate,
            endDate: payload.endDate,
            status: PayrollPeriodStatus.Draft,
            openedAt: null,
            closedAt: null,
            createdById,
        });

        try {
            return await this.payrollPeriodRepository.save(period);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(
        query: PayrollPeriodQueryDto,
    ): Promise<PaginatedPayrollPeriods> {
        const queryBuilder = this.payrollPeriodRepository
            .createQueryBuilder('period')
            .orderBy(`period.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.status !== undefined) {
            queryBuilder.andWhere('period.status = :status', {
                status: query.status,
            });
        }

        if (query.payrollMonth !== undefined) {
            queryBuilder.andWhere('period.payrollMonth = :payrollMonth', {
                payrollMonth: query.payrollMonth,
            });
        }

        if (query.payrollYear !== undefined) {
            queryBuilder.andWhere('period.payrollYear = :payrollYear', {
                payrollYear: query.payrollYear,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(period.code) LIKE :search')
                        .orWhere('LOWER(period.name) LIKE :search');
                }),
                { search: `%${search}%` },
            );
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async findOne(id: string): Promise<PayrollPeriod> {
        return this.findEntityById(id);
    }

    async update(
        id: string,
        payload: UpdatePayrollPeriodDto,
    ): Promise<PayrollPeriod> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const period = await this.findEntityById(id);
        this.ensureDraft(period);

        const nextPayrollMonth = payload.payrollMonth ?? period.payrollMonth;
        const nextPayrollYear = payload.payrollYear ?? period.payrollYear;
        const nextStartDate = payload.startDate ?? period.startDate;
        const nextEndDate = payload.endDate ?? period.endDate;

        this.ensureDateRange(nextStartDate, nextEndDate);
        await this.ensureMonthYearUnique(
            nextPayrollMonth,
            nextPayrollYear,
            period.id,
        );
        await this.ensureDateRangeNotOverlapping(
            nextStartDate,
            nextEndDate,
            period.id,
        );

        period.payrollMonth = nextPayrollMonth;
        period.payrollYear = nextPayrollYear;
        period.startDate = nextStartDate;
        period.endDate = nextEndDate;
        Object.assign(
            period,
            this.buildGeneratedFields(nextPayrollMonth, nextPayrollYear),
        );

        try {
            return await this.payrollPeriodRepository.save(period);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async open(id: string): Promise<PayrollPeriod> {
        const period = await this.findEntityById(id);

        if (period.status !== PayrollPeriodStatus.Draft) {
            throw new BadRequestException('Only draft payroll periods can be opened');
        }

        period.status = PayrollPeriodStatus.Open;
        period.openedAt = new Date();
        period.closedAt = null;

        return this.payrollPeriodRepository.save(period);
    }

    async close(id: string): Promise<PayrollPeriod> {
        const period = await this.findEntityById(id);

        if (period.status !== PayrollPeriodStatus.Open) {
            throw new BadRequestException('Only open payroll periods can be closed');
        }

        await this.ensureCanClosePeriod(period);
        period.status = PayrollPeriodStatus.Closed;
        period.closedAt = new Date();

        return this.payrollPeriodRepository.save(period);
    }

    async remove(id: string): Promise<void> {
        const period = await this.findEntityById(id);
        this.ensureDraft(period);

        try {
            await this.payrollPeriodRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async findEntityById(id: string): Promise<PayrollPeriod> {
        const period = await this.payrollPeriodRepository.findOne({
            where: { id },
        });

        if (!period) {
            throw new NotFoundException('Payroll period not found');
        }

        return period;
    }

    private ensureDraft(period: PayrollPeriod): void {
        if (period.status !== PayrollPeriodStatus.Draft) {
            throw new BadRequestException(
                'Only draft payroll periods can be changed',
            );
        }
    }

    private ensureDateRange(startDate: string, endDate: string): void {
        if (startDate >= endDate) {
            throw new BadRequestException('Start date must be before end date');
        }
    }

    private async ensureMonthYearUnique(
        payrollMonth: number,
        payrollYear: number,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder = this.payrollPeriodRepository
            .createQueryBuilder('period')
            .where('period.payrollMonth = :payrollMonth', { payrollMonth })
            .andWhere('period.payrollYear = :payrollYear', { payrollYear });

        if (excludedId) {
            queryBuilder.andWhere('period.id != :excludedId', { excludedId });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Payroll period already exists for this month');
        }
    }

    private async ensureDateRangeNotOverlapping(
        startDate: string,
        endDate: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder = this.payrollPeriodRepository
            .createQueryBuilder('period')
            .where('period.startDate <= :endDate', { endDate })
            .andWhere('period.endDate >= :startDate', { startDate });

        if (excludedId) {
            queryBuilder.andWhere('period.id != :excludedId', { excludedId });
        }

        const overlap = await queryBuilder.getOne();

        if (overlap) {
            throw new ConflictException('Payroll period date range overlaps another period');
        }
    }

    private async ensureCanClosePeriod(_period: PayrollPeriod): Promise<void> {
        // Payroll Processing will add finalized employee payroll checks here.
    }

    private buildGeneratedFields(
        payrollMonth: number,
        payrollYear: number,
    ): Pick<PayrollPeriod, 'code' | 'name'> {
        const month = payrollMonth.toString().padStart(2, '0');

        return {
            code: `PAYROLL-${payrollYear}-${month}`,
            name: `Kỳ lương tháng ${month}/${payrollYear}`,
        };
    }

    private handleDuplicateError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('Payroll period already exists');
        }
    }

    private handleDeleteError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (
            driverError.code === 'ER_ROW_IS_REFERENCED' ||
            driverError.code === 'ER_ROW_IS_REFERENCED_2'
        ) {
            throw new ConflictException(
                'Payroll period cannot be deleted because related data exists',
            );
        }
    }
}
