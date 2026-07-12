import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayCheckQueryDto } from './dto/holiday-check-query.dto';
import { HolidayQueryDto } from './dto/holiday-query.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { HolidayStatus } from './entities/holiday-status.enum';
import { Holiday } from './entities/holiday.entity';

export type PaginatedHolidays = {
    data: Holiday[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type HolidayCheckResponse = {
    isHoliday: boolean;
    holiday: Holiday | null;
};

@Injectable()
export class HolidayService {
    constructor(
        @InjectRepository(Holiday)
        private readonly holidayRepository: Repository<Holiday>,
    ) {}

    async create(payload: CreateHolidayDto): Promise<Holiday> {
        const name = this.normalizeName(payload.name);
        const holidayDate = this.normalizeHolidayDate(payload.holidayDate);

        await this.ensureDateUnique(holidayDate);

        const holiday = this.holidayRepository.create({
            name,
            holidayDate,
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? HolidayStatus.Active,
        });

        try {
            return await this.holidayRepository.save(holiday);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(
        query: HolidayQueryDto,
        userRole: UserRole,
    ): Promise<PaginatedHolidays> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .orderBy(`holiday.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (userRole !== UserRole.Admin) {
            queryBuilder.andWhere('holiday.status = :activeStatus', {
                activeStatus: HolidayStatus.Active,
            });
        } else if (query.status !== undefined) {
            queryBuilder.andWhere('holiday.status = :status', {
                status: query.status,
            });
        }

        if (query.year !== undefined) {
            queryBuilder.andWhere('YEAR(holiday.holidayDate) = :year', {
                year: query.year,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder.where('LOWER(holiday.name) LIKE :search');
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

    async findOne(id: string, userRole: UserRole): Promise<Holiday> {
        const holiday = await this.findEntityById(id);

        if (userRole !== UserRole.Admin && holiday.status !== HolidayStatus.Active) {
            throw new NotFoundException('Holiday not found');
        }

        return holiday;
    }

    async checkActiveHoliday(
        query: HolidayCheckQueryDto,
    ): Promise<HolidayCheckResponse> {
        const holiday = await this.holidayRepository.findOne({
            where: {
                holidayDate: this.normalizeHolidayDate(query.date),
                status: HolidayStatus.Active,
            },
        });

        return {
            isHoliday: Boolean(holiday),
            holiday,
        };
    }

    async update(id: string, payload: UpdateHolidayDto): Promise<Holiday> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const holiday = await this.findEntityById(id);

        if (payload.name !== undefined) {
            holiday.name = this.normalizeName(payload.name);
        }

        if (payload.holidayDate !== undefined) {
            const holidayDate = this.normalizeHolidayDate(payload.holidayDate);

            if (holidayDate !== holiday.holidayDate) {
                await this.ensureDateUnique(holidayDate, id);
                holiday.holidayDate = holidayDate;
            }
        }

        if (payload.description !== undefined) {
            holiday.description = this.normalizeDescription(payload.description);
        }

        if (payload.status !== undefined) {
            holiday.status = payload.status;
        }

        try {
            return await this.holidayRepository.save(holiday);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        await this.findEntityById(id);

        try {
            await this.holidayRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async findEntityById(id: string): Promise<Holiday> {
        const holiday = await this.holidayRepository.findOne({
            where: { id },
        });

        if (!holiday) {
            throw new NotFoundException('Holiday not found');
        }

        return holiday;
    }

    private async ensureDateUnique(
        holidayDate: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.holidayDate = :holidayDate', { holidayDate });

        if (excludedId) {
            queryBuilder.andWhere('holiday.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Holiday date already exists');
        }
    }

    private normalizeName(value: string): string {
        return value.trim();
    }

    private normalizeHolidayDate(value: string): string {
        return value.trim();
    }

    private normalizeDescription(value?: string | null): string | null {
        const description = value?.trim();
        return description ? description : null;
    }

    private handleDuplicateError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as {
            code?: string;
        };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('Holiday date already exists');
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
                'Holiday cannot be deleted because related data exists',
            );
        }
    }
}
