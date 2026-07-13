import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { PayrollPeriodStatus } from '@/module/payroll-period/entities/payroll-period-status.enum';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { RewardPenaltyCatalog } from '@/module/reward-penalty-catalog/entities/reward-penalty-catalog.entity';
import { RewardPenaltyStatus } from '@/module/reward-penalty-catalog/entities/reward-penalty-status.enum';
import { CreatePayrollAdjustmentDto } from './dto/create-payroll-adjustment.dto';
import { PayrollAdjustmentQueryDto } from './dto/payroll-adjustment-query.dto';
import { UpdatePayrollAdjustmentDto } from './dto/update-payroll-adjustment.dto';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity';

type AdjustmentContext = {
    period: PayrollPeriod;
    employee: Employee;
    branch: Branch;
    catalog: RewardPenaltyCatalog;
    amount: string;
    reason: string;
    adjustmentDate: string;
};

export type PaginatedPayrollAdjustments = {
    data: PayrollAdjustment[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class PayrollAdjustmentService {
    constructor(
        @InjectRepository(PayrollAdjustment)
        private readonly adjustmentRepository: Repository<PayrollAdjustment>,
        @InjectRepository(PayrollPeriod)
        private readonly periodRepository: Repository<PayrollPeriod>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
        @InjectRepository(RewardPenaltyCatalog)
        private readonly catalogRepository: Repository<RewardPenaltyCatalog>,
    ) {}

    async create(
        payload: CreatePayrollAdjustmentDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollAdjustment> {
        const context = await this.buildAdjustmentContext(
            payload,
            authUser,
            allowedBranchIds,
        );

        const adjustment = this.adjustmentRepository.create({
            payrollPeriodId: context.period.id,
            employeeId: context.employee.id,
            branchId: context.branch.id,
            catalogId: context.catalog.id,
            catalogCode: context.catalog.code,
            catalogName: context.catalog.name,
            category: context.catalog.category,
            amount: context.amount,
            reason: context.reason,
            adjustmentDate: context.adjustmentDate,
            createdByUserId: authUser.sub,
        });

        try {
            const saved = await this.adjustmentRepository.save(adjustment);
            return this.findOne(saved.id, authUser, allowedBranchIds);
        } catch (error) {
            this.handleSaveError(error);
            throw error;
        }
    }

    async findAll(
        query: PayrollAdjustmentQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedPayrollAdjustments> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const queryBuilder = this.adjustmentRepository
            .createQueryBuilder('adjustment')
            .leftJoinAndSelect('adjustment.payrollPeriod', 'payrollPeriod')
            .leftJoinAndSelect('adjustment.employee', 'employee')
            .leftJoinAndSelect('adjustment.branch', 'branch')
            .leftJoinAndSelect('adjustment.catalog', 'catalog')
            .leftJoinAndSelect('adjustment.createdByUser', 'createdByUser')
            .orderBy(`adjustment.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        this.applyBranchScope(queryBuilder, allowedBranchIds);
        this.applyFilters(queryBuilder, query);

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

    async findOne(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollAdjustment> {
        const adjustment = await this.findEntityById(id);
        this.ensureCanAccessBranch(adjustment.branchId, authUser, allowedBranchIds);

        return adjustment;
    }

    async update(
        id: string,
        payload: UpdatePayrollAdjustmentDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollAdjustment> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const adjustment = await this.findEntityById(id);
        this.ensureCanAccessBranch(adjustment.branchId, authUser, allowedBranchIds);

        const context = await this.buildAdjustmentContext(
            {
                payrollPeriodId:
                    payload.payrollPeriodId ?? adjustment.payrollPeriodId,
                employeeId: payload.employeeId ?? adjustment.employeeId,
                branchId: payload.branchId ?? adjustment.branchId,
                catalogId: payload.catalogId ?? adjustment.catalogId,
                amount: payload.amount ?? Number(adjustment.amount),
                reason: payload.reason ?? adjustment.reason,
                adjustmentDate:
                    payload.adjustmentDate ?? adjustment.adjustmentDate,
            },
            authUser,
            allowedBranchIds,
        );

        adjustment.payrollPeriodId = context.period.id;
        adjustment.employeeId = context.employee.id;
        adjustment.branchId = context.branch.id;
        adjustment.catalogId = context.catalog.id;
        adjustment.catalogCode = context.catalog.code;
        adjustment.catalogName = context.catalog.name;
        adjustment.category = context.catalog.category;
        adjustment.amount = context.amount;
        adjustment.reason = context.reason;
        adjustment.adjustmentDate = context.adjustmentDate;

        try {
            const saved = await this.adjustmentRepository.save(adjustment);
            return this.findOne(saved.id, authUser, allowedBranchIds);
        } catch (error) {
            this.handleSaveError(error);
            throw error;
        }
    }

    async remove(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<void> {
        const adjustment = await this.findEntityById(id);
        this.ensureCanAccessBranch(adjustment.branchId, authUser, allowedBranchIds);
        this.ensurePeriodOpen(adjustment.payrollPeriod);

        try {
            await this.adjustmentRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async buildAdjustmentContext(
        payload: CreatePayrollAdjustmentDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<AdjustmentContext> {
        const [period, employee, branch, catalog] = await Promise.all([
            this.findPeriod(payload.payrollPeriodId),
            this.findEmployee(payload.employeeId),
            this.findBranch(payload.branchId),
            this.findCatalog(payload.catalogId),
        ]);

        this.ensurePeriodOpen(period);
        this.ensureActiveCatalog(catalog);
        this.ensureCanAccessBranch(branch.id, authUser, allowedBranchIds);
        this.ensureEmployeeInBranch(employee, branch.id);
        this.ensureAdjustmentDateInPeriod(
            payload.adjustmentDate,
            period.startDate,
            period.endDate,
        );

        return {
            period,
            employee,
            branch,
            catalog,
            amount: this.normalizeAmount(payload.amount),
            reason: this.normalizeReason(payload.reason),
            adjustmentDate: payload.adjustmentDate,
        };
    }

    private async findEntityById(id: string): Promise<PayrollAdjustment> {
        const adjustment = await this.adjustmentRepository.findOne({
            where: { id },
            relations: {
                payrollPeriod: true,
                employee: true,
                branch: true,
                catalog: true,
                createdByUser: true,
            },
        });

        if (!adjustment) {
            throw new NotFoundException('Payroll adjustment not found');
        }

        return adjustment;
    }

    private async findPeriod(id: string): Promise<PayrollPeriod> {
        const period = await this.periodRepository.findOne({ where: { id } });

        if (!period) {
            throw new NotFoundException('Payroll period not found');
        }

        return period;
    }

    private async findEmployee(id: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: { branches: true },
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        return employee;
    }

    private async findBranch(id: string): Promise<Branch> {
        const branch = await this.branchRepository.findOne({ where: { id } });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    private async findCatalog(id: string): Promise<RewardPenaltyCatalog> {
        const catalog = await this.catalogRepository.findOne({ where: { id } });

        if (!catalog) {
            throw new NotFoundException('Reward penalty catalog not found');
        }

        return catalog;
    }

    private ensurePeriodOpen(period: PayrollPeriod): void {
        if (period.status !== PayrollPeriodStatus.Open) {
            throw new BadRequestException(
                'Payroll period must be open to change adjustments',
            );
        }
    }

    private ensureActiveCatalog(catalog: RewardPenaltyCatalog): void {
        if (catalog.status !== RewardPenaltyStatus.Active) {
            throw new BadRequestException('Reward penalty catalog must be active');
        }
    }

    private ensureEmployeeInBranch(employee: Employee, branchId: string): void {
        if (!employee.branches.some((branch) => branch.id === branchId)) {
            throw new BadRequestException(
                'Employee does not belong to the selected branch',
            );
        }
    }

    private ensureAdjustmentDateInPeriod(
        adjustmentDate: string,
        startDate: string,
        endDate: string,
    ): void {
        if (adjustmentDate < startDate || adjustmentDate > endDate) {
            throw new BadRequestException(
                'Adjustment date must be within the payroll period',
            );
        }
    }

    private ensureCanAccessBranch(
        branchId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        if (allowedBranchIds && !allowedBranchIds.includes(branchId)) {
            throw new ForbiddenException(
                'You can only manage payroll adjustments in your branches',
            );
        }
    }

    private ensureBranchScopeForRole(
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Manager && !allowedBranchIds) {
            throw new ForbiddenException(
                'Managed branch scope is required for managers',
            );
        }
    }

    private applyBranchScope(
        queryBuilder: ReturnType<Repository<PayrollAdjustment>['createQueryBuilder']>,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('adjustment.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private applyFilters(
        queryBuilder: ReturnType<Repository<PayrollAdjustment>['createQueryBuilder']>,
        query: PayrollAdjustmentQueryDto,
    ): void {
        if (query.payrollPeriodId) {
            queryBuilder.andWhere('adjustment.payrollPeriodId = :payrollPeriodId', {
                payrollPeriodId: query.payrollPeriodId,
            });
        }

        if (query.employeeId) {
            queryBuilder.andWhere('adjustment.employeeId = :employeeId', {
                employeeId: query.employeeId,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('adjustment.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.category !== undefined) {
            queryBuilder.andWhere('adjustment.category = :category', {
                category: query.category,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(adjustment.catalogCode) LIKE :search')
                        .orWhere('LOWER(adjustment.catalogName) LIKE :search')
                        .orWhere('LOWER(adjustment.reason) LIKE :search')
                        .orWhere('LOWER(employee.employeeCode) LIKE :search')
                        .orWhere('LOWER(employee.firstName) LIKE :search')
                        .orWhere('LOWER(employee.lastName) LIKE :search');
                }),
                { search: `%${search}%` },
            );
        }
    }

    private normalizeAmount(value: number): string {
        return value.toFixed(2);
    }

    private normalizeReason(value: string): string {
        const reason = value.trim();

        if (!reason) {
            throw new BadRequestException('Reason is required');
        }

        return reason;
    }

    private handleSaveError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('Payroll adjustment already exists');
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
                'Payroll adjustment cannot be deleted because related data exists',
            );
        }
    }
}
