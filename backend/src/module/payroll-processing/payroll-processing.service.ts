import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { AttendanceStatus } from '@/module/attendance/entities/attendance-status.enum';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { Employee } from '@/module/employee/entities/employee.entity';
import { HolidayStatus } from '@/module/holiday/entities/holiday-status.enum';
import { Holiday } from '@/module/holiday/entities/holiday.entity';
import { PayrollAdjustment } from '@/module/payroll-adjustment/entities/payroll-adjustment.entity';
import { PayrollPeriodStatus } from '@/module/payroll-period/entities/payroll-period-status.enum';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { RewardPenaltyCategory } from '@/module/reward-penalty-catalog/entities/reward-penalty-category.enum';
import { SalaryRuleStatus } from '@/module/salary-rule/entities/salary-rule-status.enum';
import { SalaryRuleVersion } from '@/module/salary-rule/entities/salary-rule-version.entity';
import { SalaryRule } from '@/module/salary-rule/entities/salary-rule.entity';
import { EmployeePayrollQueryDto } from './dto/employee-payroll-query.dto';
import { PayrollProcessingQueryDto } from './dto/payroll-processing-query.dto';
import { EmployeePayrollStatus } from './entities/employee-payroll-status.enum';
import { EmployeePayroll } from './entities/employee-payroll.entity';
import { PayrollProcessingStatus } from './entities/payroll-processing-status.enum';
import { PayrollProcessing } from './entities/payroll-processing.entity';

type SalaryMultipliers = {
    regular: number;
    overtime: number;
    holiday: number;
    holidayOvertime: number;
};

type PayrollWorkSummary = {
    employeeId: string;
    branchId: string;
    positionId: string;
    employeeCode: string;
    employeeName: string;
    branchName: string;
    positionName: string;
    hourlyRate: number;
    workedMinutes: number;
    overtimeMinutes: number;
    holidayMinutes: number;
    holidayOvertimeMinutes: number;
};

type PayrollAdjustmentSummary = {
    rewardTotal: number;
    penaltyTotal: number;
};

export type PaginatedPayrollProcessings = {
    data: PayrollProcessing[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type PaginatedEmployeePayrolls = {
    data: EmployeePayroll[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class PayrollProcessingService {
    constructor(
        @InjectRepository(PayrollProcessing)
        private readonly processingRepository: Repository<PayrollProcessing>,
        @InjectRepository(EmployeePayroll)
        private readonly employeePayrollRepository: Repository<EmployeePayroll>,
        @InjectRepository(PayrollPeriod)
        private readonly periodRepository: Repository<PayrollPeriod>,
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(PayrollAdjustment)
        private readonly adjustmentRepository: Repository<PayrollAdjustment>,
        @InjectRepository(SalaryRule)
        private readonly salaryRuleRepository: Repository<SalaryRule>,
        @InjectRepository(SalaryRuleVersion)
        private readonly salaryRuleVersionRepository: Repository<SalaryRuleVersion>,
        @InjectRepository(Holiday)
        private readonly holidayRepository: Repository<Holiday>,
        private readonly dataSource: DataSource,
    ) {}

    async generate(
        payrollPeriodId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollProcessing> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const processingId = await this.dataSource.transaction(async (manager) => {
            const period = await this.findLockedPeriod(manager, payrollPeriodId);
            this.ensurePeriodOpen(period);
            await this.ensureProcessingDoesNotExist(manager, period.id);

            const processing = await manager
                .getRepository(PayrollProcessing)
                .save(
                    manager.getRepository(PayrollProcessing).create({
                        payrollPeriodId: period.id,
                        status: PayrollProcessingStatus.Processing,
                        generatedAt: new Date(),
                        generatedByUserId: authUser.sub,
                        closedAt: null,
                        closedByUserId: null,
                        errorMessage: null,
                    }),
                );

            await this.generateEmployeePayrolls(
                manager,
                processing,
                period,
                allowedBranchIds,
            );

            return processing.id;
        });

        return this.findOne(processingId, authUser, allowedBranchIds);
    }

    async findAll(
        query: PayrollProcessingQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedPayrollProcessings> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const queryBuilder = this.processingRepository
            .createQueryBuilder('processing')
            .leftJoinAndSelect('processing.payrollPeriod', 'payrollPeriod')
            .leftJoinAndSelect('processing.generatedByUser', 'generatedByUser')
            .leftJoinAndSelect('processing.closedByUser', 'closedByUser')
            .orderBy(`processing.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (allowedBranchIds) {
            queryBuilder
                .innerJoin('processing.employeePayrolls', 'employeePayrollScope')
                .andWhere('employeePayrollScope.branchId IN (:...allowedBranchIds)', {
                    allowedBranchIds: allowedBranchIds.length
                        ? allowedBranchIds
                        : ['__none__'],
                });
        }

        if (query.status) {
            queryBuilder.andWhere('processing.status = :status', {
                status: query.status,
            });
        }

        if (query.payrollPeriodId) {
            queryBuilder.andWhere(
                'processing.payrollPeriodId = :payrollPeriodId',
                { payrollPeriodId: query.payrollPeriodId },
            );
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(payrollPeriod.code) LIKE :search')
                        .orWhere('LOWER(payrollPeriod.name) LIKE :search');
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

    async findOne(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollProcessing> {
        const processing = await this.findEntityById(id);
        await this.ensureCanAccessProcessing(processing.id, authUser, allowedBranchIds);

        return processing;
    }

    async findEmployeePayrolls(
        processingId: string,
        query: EmployeePayrollQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedEmployeePayrolls> {
        const processing = await this.findEntityById(processingId);
        await this.ensureCanAccessProcessing(processing.id, authUser, allowedBranchIds);

        const queryBuilder = this.employeePayrollRepository
            .createQueryBuilder('employeePayroll')
            .leftJoinAndSelect('employeePayroll.payrollProcessing', 'processing')
            .leftJoinAndSelect('employeePayroll.payrollPeriod', 'payrollPeriod')
            .leftJoinAndSelect('employeePayroll.employee', 'employee')
            .leftJoinAndSelect('employeePayroll.branch', 'branch')
            .leftJoinAndSelect('employeePayroll.position', 'position')
            .where('employeePayroll.payrollProcessingId = :processingId', {
                processingId,
            })
            .orderBy(`employeePayroll.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        this.applyEmployeePayrollScope(queryBuilder, allowedBranchIds);
        this.applyEmployeePayrollFilters(queryBuilder, query);

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

    async findEmployeePayroll(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<EmployeePayroll> {
        const employeePayroll = await this.findEmployeePayrollById(id);
        this.ensureCanAccessBranch(employeePayroll.branchId, authUser, allowedBranchIds);

        return employeePayroll;
    }

    async recalculate(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollProcessing> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const processingId = await this.dataSource.transaction(async (manager) => {
            const processing = await this.findLockedProcessing(manager, id);
            this.ensureProcessingNotClosed(processing);
            const period = await this.findLockedPeriod(
                manager,
                processing.payrollPeriodId,
            );
            this.ensurePeriodOpen(period);
            this.ensureCanAccessBranchList(allowedBranchIds);

            await manager
                .getRepository(EmployeePayroll)
                .delete({ payrollProcessingId: processing.id });

            processing.status = PayrollProcessingStatus.Processing;
            processing.generatedAt = new Date();
            processing.generatedByUserId = authUser.sub;
            processing.closedAt = null;
            processing.closedByUserId = null;
            processing.errorMessage = null;
            await manager.getRepository(PayrollProcessing).save(processing);

            await this.generateEmployeePayrolls(
                manager,
                processing,
                period,
                allowedBranchIds,
            );

            return processing.id;
        });

        return this.findOne(processingId, authUser, allowedBranchIds);
    }

    async retryEmployeePayroll(
        employeePayrollId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<EmployeePayroll> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const retryId = await this.dataSource.transaction(async (manager) => {
            const employeePayroll = await this.findLockedEmployeePayroll(
                manager,
                employeePayrollId,
            );
            this.ensureCanAccessBranch(
                employeePayroll.branchId,
                authUser,
                allowedBranchIds,
            );
            this.ensureEmployeePayrollFailed(employeePayroll);

            const processing = await this.findLockedProcessing(
                manager,
                employeePayroll.payrollProcessingId,
            );
            this.ensureProcessingNotClosed(processing);
            const period = await this.findLockedPeriod(
                manager,
                employeePayroll.payrollPeriodId,
            );
            this.ensurePeriodOpen(period);

            const replacement = await this.buildEmployeePayroll(
                manager,
                processing,
                period,
                employeePayroll.employeeId,
                allowedBranchIds,
            );

            Object.assign(employeePayroll, replacement, {
                id: employeePayroll.id,
                payrollProcessingId: processing.id,
                payrollPeriodId: period.id,
            });

            await manager.getRepository(EmployeePayroll).save(employeePayroll);
            await this.refreshProcessingCounters(manager, processing.id);

            return employeePayroll.id;
        });

        return this.findEmployeePayroll(retryId, authUser, allowedBranchIds);
    }

    async close(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PayrollProcessing> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const processingId = await this.dataSource.transaction(async (manager) => {
            const processing = await this.findLockedProcessing(manager, id);
            this.ensureProcessingCompleted(processing);
            await this.ensureNoFailedEmployeePayrolls(manager, processing.id);

            processing.status = PayrollProcessingStatus.Closed;
            processing.closedAt = new Date();
            processing.closedByUserId = authUser.sub;
            await manager.getRepository(PayrollProcessing).save(processing);

            await manager.getRepository(EmployeePayroll).update(
                { payrollProcessingId: processing.id },
                { status: EmployeePayrollStatus.Finalized },
            );

            return processing.id;
        });

        return this.findOne(processingId, authUser, allowedBranchIds);
    }

    private async generateEmployeePayrolls(
        manager: EntityManager,
        processing: PayrollProcessing,
        period: PayrollPeriod,
        allowedBranchIds?: string[],
    ): Promise<void> {
        const [summaries, multipliers, adjustmentMap] = await Promise.all([
            this.buildWorkSummaries(manager, period, allowedBranchIds),
            this.findSalaryMultipliers(manager, period.endDate),
            this.buildAdjustmentMap(manager, period.id, allowedBranchIds),
        ]);

        if (summaries.length === 0) {
            throw new BadRequestException(
                'No employees found for this payroll period',
            );
        }

        const employeePayrolls = summaries.map((summary) =>
            this.createEmployeePayroll(
                manager,
                processing,
                period,
                summary,
                multipliers,
                adjustmentMap.get(summary.employeeId) ?? {
                    rewardTotal: 0,
                    penaltyTotal: 0,
                },
            ),
        );

        await manager.getRepository(EmployeePayroll).save(employeePayrolls);
        await this.refreshProcessingCounters(manager, processing.id);
    }

    private async buildEmployeePayroll(
        manager: EntityManager,
        processing: PayrollProcessing,
        period: PayrollPeriod,
        employeeId: string,
        allowedBranchIds?: string[],
    ): Promise<EmployeePayroll> {
        const [summaries, multipliers, adjustmentMap] = await Promise.all([
            this.buildWorkSummaries(manager, period, allowedBranchIds, employeeId),
            this.findSalaryMultipliers(manager, period.endDate),
            this.buildAdjustmentMap(manager, period.id, allowedBranchIds, employeeId),
        ]);

        const summary = summaries[0];

        if (!summary) {
            throw new BadRequestException(
                'No attendance found for this employee in the payroll period',
            );
        }

        return this.createEmployeePayroll(
            manager,
            processing,
            period,
            summary,
            multipliers,
            adjustmentMap.get(summary.employeeId) ?? {
                rewardTotal: 0,
                penaltyTotal: 0,
            },
        );
    }

    private async buildWorkSummaries(
        manager: EntityManager,
        period: PayrollPeriod,
        allowedBranchIds?: string[],
        employeeId?: string,
    ): Promise<PayrollWorkSummary[]> {
        const queryBuilder = manager
            .getRepository(Attendance)
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.employee', 'employee')
            .leftJoinAndSelect('attendance.branch', 'branch')
            .leftJoinAndSelect('attendance.position', 'position')
            .where('attendance.scheduleDate >= :startDate', {
                startDate: period.startDate,
            })
            .andWhere('attendance.scheduleDate <= :endDate', {
                endDate: period.endDate,
            })
            .andWhere('attendance.status = :status', {
                status: AttendanceStatus.Confirmed,
            });

        if (allowedBranchIds) {
            if (allowedBranchIds.length === 0) {
                queryBuilder.andWhere('1 = 0');
            } else {
                queryBuilder.andWhere('attendance.branchId IN (:...branchIds)', {
                    branchIds: allowedBranchIds,
                });
            }
        }

        if (employeeId) {
            queryBuilder.andWhere('attendance.employeeId = :employeeId', {
                employeeId,
            });
        }

        const [attendances, holidays] = await Promise.all([
            queryBuilder.getMany(),
            this.findActiveHolidayDates(manager, period.startDate, period.endDate),
        ]);
        const holidayDates = new Set(holidays);
        const summaryMap = new Map<string, PayrollWorkSummary>();

        for (const attendance of attendances) {
            const key = attendance.employeeId;
            const current =
                summaryMap.get(key) ??
                this.createEmptyWorkSummary(attendance);
            const overtimeMinutes = Math.max(0, attendance.overtimeMinutes);
            const regularMinutes = Math.max(
                0,
                attendance.workedMinutes - overtimeMinutes,
            );

            if (holidayDates.has(attendance.scheduleDate)) {
                current.holidayMinutes += regularMinutes;
                current.holidayOvertimeMinutes += overtimeMinutes;
            } else {
                current.workedMinutes += regularMinutes;
                current.overtimeMinutes += overtimeMinutes;
            }

            summaryMap.set(key, current);
        }

        return [...summaryMap.values()];
    }

    private async buildAdjustmentMap(
        manager: EntityManager,
        payrollPeriodId: string,
        allowedBranchIds?: string[],
        employeeId?: string,
    ): Promise<Map<string, PayrollAdjustmentSummary>> {
        const queryBuilder = manager
            .getRepository(PayrollAdjustment)
            .createQueryBuilder('adjustment')
            .where('adjustment.payrollPeriodId = :payrollPeriodId', {
                payrollPeriodId,
            });

        if (allowedBranchIds) {
            if (allowedBranchIds.length === 0) {
                queryBuilder.andWhere('1 = 0');
            } else {
                queryBuilder.andWhere('adjustment.branchId IN (:...branchIds)', {
                    branchIds: allowedBranchIds,
                });
            }
        }

        if (employeeId) {
            queryBuilder.andWhere('adjustment.employeeId = :employeeId', {
                employeeId,
            });
        }

        const adjustments = await queryBuilder.getMany();
        const adjustmentMap = new Map<string, PayrollAdjustmentSummary>();

        for (const adjustment of adjustments) {
            const current =
                adjustmentMap.get(adjustment.employeeId) ??
                { rewardTotal: 0, penaltyTotal: 0 };
            const amount = Number(adjustment.amount);

            if (adjustment.category === RewardPenaltyCategory.Reward) {
                current.rewardTotal += amount;
            } else {
                current.penaltyTotal += amount;
            }

            adjustmentMap.set(adjustment.employeeId, current);
        }

        return adjustmentMap;
    }

    private async findSalaryMultipliers(
        manager: EntityManager,
        effectiveDate: string,
    ): Promise<SalaryMultipliers> {
        const rules = await manager.getRepository(SalaryRule).find({
            where: { status: SalaryRuleStatus.Active },
        });
        const ruleByCode = new Map(rules.map((rule) => [rule.code, rule]));
        const requiredCodes = [
            'NORMAL',
            'OVERTIME',
            'HOLIDAY',
            'HOLIDAY_OVERTIME',
        ];
        const missingCode = requiredCodes.find((code) => !ruleByCode.has(code));

        if (missingCode) {
            throw new BadRequestException(
                'Payroll Rule is required before generating payroll',
            );
        }

        const [regular, overtime, holiday, holidayOvertime] =
            await Promise.all(
                requiredCodes.map((code) =>
                    this.findRuleMultiplier(
                        manager,
                        ruleByCode.get(code)!.id,
                        effectiveDate,
                    ),
                ),
            );

        return { regular, overtime, holiday, holidayOvertime };
    }

    private async findRuleMultiplier(
        manager: EntityManager,
        salaryRuleId: string,
        effectiveDate: string,
    ): Promise<number> {
        const version = await manager
            .getRepository(SalaryRuleVersion)
            .createQueryBuilder('version')
            .where('version.salaryRuleId = :salaryRuleId', { salaryRuleId })
            .andWhere('version.effectiveFrom <= :effectiveDate', {
                effectiveDate,
            })
            .andWhere(
                '(version.effectiveTo IS NULL OR version.effectiveTo >= :effectiveDate)',
                { effectiveDate },
            )
            .orderBy('version.effectiveFrom', 'DESC')
            .getOne();

        if (!version) {
            throw new BadRequestException(
                'Payroll Rule is required before generating payroll',
            );
        }

        return Number(version.multiplier);
    }

    private createEmployeePayroll(
        manager: EntityManager,
        processing: PayrollProcessing,
        period: PayrollPeriod,
        summary: PayrollWorkSummary,
        multipliers: SalaryMultipliers,
        adjustment: PayrollAdjustmentSummary,
    ): EmployeePayroll {
        const regularPay = this.calculatePay(
            summary.hourlyRate,
            summary.workedMinutes,
            multipliers.regular,
        );
        const overtimePay = this.calculatePay(
            summary.hourlyRate,
            summary.overtimeMinutes,
            multipliers.overtime,
        );
        const holidayPay = this.calculatePay(
            summary.hourlyRate,
            summary.holidayMinutes,
            multipliers.holiday,
        );
        const holidayOvertimePay = this.calculatePay(
            summary.hourlyRate,
            summary.holidayOvertimeMinutes,
            multipliers.holidayOvertime,
        );
        const grossPay =
            regularPay +
            overtimePay +
            holidayPay +
            holidayOvertimePay +
            adjustment.rewardTotal;
        const netPay = grossPay - adjustment.penaltyTotal;

        return manager.getRepository(EmployeePayroll).create({
            payrollProcessingId: processing.id,
            payrollPeriodId: period.id,
            employeeId: summary.employeeId,
            branchId: summary.branchId,
            positionId: summary.positionId,
            employeeCode: summary.employeeCode,
            employeeName: summary.employeeName,
            branchName: summary.branchName,
            positionName: summary.positionName,
            hourlyRate: this.toMoney(summary.hourlyRate),
            regularMultiplier: this.toMultiplier(multipliers.regular),
            overtimeMultiplier: this.toMultiplier(multipliers.overtime),
            holidayMultiplier: this.toMultiplier(multipliers.holiday),
            holidayOvertimeMultiplier: this.toMultiplier(
                multipliers.holidayOvertime,
            ),
            workedMinutes: summary.workedMinutes,
            overtimeMinutes: summary.overtimeMinutes,
            holidayMinutes: summary.holidayMinutes,
            holidayOvertimeMinutes: summary.holidayOvertimeMinutes,
            rewardTotal: this.toMoney(adjustment.rewardTotal),
            penaltyTotal: this.toMoney(adjustment.penaltyTotal),
            regularPay: this.toMoney(regularPay),
            overtimePay: this.toMoney(overtimePay),
            holidayPay: this.toMoney(holidayPay),
            holidayOvertimePay: this.toMoney(holidayOvertimePay),
            grossPay: this.toMoney(grossPay),
            netPay: this.toMoney(netPay),
            status: EmployeePayrollStatus.Success,
            errorMessage: null,
        });
    }

    private createEmptyWorkSummary(attendance: Attendance): PayrollWorkSummary {
        return {
            employeeId: attendance.employeeId,
            branchId: attendance.branchId,
            positionId: attendance.positionId,
            employeeCode: attendance.employee.employeeCode,
            employeeName:
                `${attendance.employee.firstName} ${attendance.employee.lastName}`.trim(),
            branchName: attendance.branch.name,
            positionName: attendance.position.name,
            hourlyRate: Number(attendance.position.hourlyRate),
            workedMinutes: 0,
            overtimeMinutes: 0,
            holidayMinutes: 0,
            holidayOvertimeMinutes: 0,
        };
    }

    private async refreshProcessingCounters(
        manager: EntityManager,
        processingId: string,
    ): Promise<void> {
        const employeePayrolls = await manager.getRepository(EmployeePayroll).find({
            where: { payrollProcessingId: processingId },
        });
        const successCount = employeePayrolls.filter(
            (employeePayroll) =>
                employeePayroll.status === EmployeePayrollStatus.Success ||
                employeePayroll.status === EmployeePayrollStatus.Finalized,
        ).length;
        const failedCount = employeePayrolls.filter(
            (employeePayroll) =>
                employeePayroll.status === EmployeePayrollStatus.Failed,
        ).length;
        const processing = await this.findLockedProcessing(manager, processingId);

        processing.totalEmployees = employeePayrolls.length;
        processing.processedEmployees = employeePayrolls.length;
        processing.successCount = successCount;
        processing.failedCount = failedCount;
        processing.status =
            failedCount > 0
                ? PayrollProcessingStatus.Failed
                : PayrollProcessingStatus.Completed;
        processing.errorMessage =
            failedCount > 0 ? 'Some employee payrolls failed' : null;

        await manager.getRepository(PayrollProcessing).save(processing);
    }

    private async findEntityById(id: string): Promise<PayrollProcessing> {
        const processing = await this.processingRepository.findOne({
            where: { id },
            relations: {
                payrollPeriod: true,
                generatedByUser: true,
                closedByUser: true,
            },
        });

        if (!processing) {
            throw new NotFoundException('Payroll Processing not found');
        }

        return processing;
    }

    private async findEmployeePayrollById(id: string): Promise<EmployeePayroll> {
        const employeePayroll = await this.employeePayrollRepository.findOne({
            where: { id },
            relations: {
                payrollProcessing: true,
                payrollPeriod: true,
                employee: true,
                branch: true,
                position: true,
            },
        });

        if (!employeePayroll) {
            throw new NotFoundException('Employee Payroll not found');
        }

        return employeePayroll;
    }

    private async findLockedPeriod(
        manager: EntityManager,
        id: string,
    ): Promise<PayrollPeriod> {
        const period = await manager.getRepository(PayrollPeriod).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!period) {
            throw new NotFoundException('Payroll period not found');
        }

        return period;
    }

    private async findLockedProcessing(
        manager: EntityManager,
        id: string,
    ): Promise<PayrollProcessing> {
        const processing = await manager.getRepository(PayrollProcessing).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!processing) {
            throw new NotFoundException('Payroll Processing not found');
        }

        return processing;
    }

    private async findLockedEmployeePayroll(
        manager: EntityManager,
        id: string,
    ): Promise<EmployeePayroll> {
        const employeePayroll = await manager.getRepository(EmployeePayroll).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!employeePayroll) {
            throw new NotFoundException('Employee Payroll not found');
        }

        return employeePayroll;
    }

    private async ensureProcessingDoesNotExist(
        manager: EntityManager,
        payrollPeriodId: string,
    ): Promise<void> {
        const processing = await manager.getRepository(PayrollProcessing).findOne({
            where: { payrollPeriodId },
        });

        if (processing) {
            throw new ConflictException(
                'Payroll Processing already exists for this payroll period',
            );
        }
    }

    private async ensureCanAccessProcessing(
        processingId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<void> {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        if (!allowedBranchIds?.length) {
            throw new ForbiddenException(
                'You can only access payroll processing in your branches',
            );
        }

        const count = await this.employeePayrollRepository.count({
            where: allowedBranchIds.map((branchId) => ({
                payrollProcessingId: processingId,
                branchId,
            })),
        });

        if (count === 0) {
            throw new ForbiddenException(
                'You can only access payroll processing in your branches',
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

        if (!allowedBranchIds?.includes(branchId)) {
            throw new ForbiddenException(
                'You can only access payroll processing in your branches',
            );
        }
    }

    private ensureCanAccessBranchList(allowedBranchIds?: string[]): void {
        if (allowedBranchIds && allowedBranchIds.length === 0) {
            throw new ForbiddenException(
                'You can only access payroll processing in your branches',
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

    private ensurePeriodOpen(period: PayrollPeriod): void {
        if (period.status !== PayrollPeriodStatus.Open) {
            throw new BadRequestException('Payroll Period is not active');
        }
    }

    private ensureProcessingNotClosed(processing: PayrollProcessing): void {
        if (processing.status === PayrollProcessingStatus.Closed) {
            throw new BadRequestException('Payroll has been closed');
        }
    }

    private ensureProcessingCompleted(processing: PayrollProcessing): void {
        if (processing.status !== PayrollProcessingStatus.Completed) {
            throw new BadRequestException(
                'Only completed payroll processing can be closed',
            );
        }
    }

    private ensureEmployeePayrollFailed(employeePayroll: EmployeePayroll): void {
        if (employeePayroll.status !== EmployeePayrollStatus.Failed) {
            throw new BadRequestException(
                'Only failed employee payroll can be retried',
            );
        }
    }

    private async ensureNoFailedEmployeePayrolls(
        manager: EntityManager,
        processingId: string,
    ): Promise<void> {
        const failedCount = await manager.getRepository(EmployeePayroll).count({
            where: {
                payrollProcessingId: processingId,
                status: EmployeePayrollStatus.Failed,
            },
        });

        if (failedCount > 0) {
            throw new BadRequestException(
                'Failed employee payrolls must be resolved before closing',
            );
        }
    }

    private applyEmployeePayrollScope(
        queryBuilder: ReturnType<Repository<EmployeePayroll>['createQueryBuilder']>,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('employeePayroll.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private applyEmployeePayrollFilters(
        queryBuilder: ReturnType<Repository<EmployeePayroll>['createQueryBuilder']>,
        query: EmployeePayrollQueryDto,
    ): void {
        if (query.status) {
            queryBuilder.andWhere('employeePayroll.status = :status', {
                status: query.status,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('employeePayroll.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(employeePayroll.employeeCode) LIKE :search')
                        .orWhere('LOWER(employeePayroll.employeeName) LIKE :search')
                        .orWhere('LOWER(employeePayroll.branchName) LIKE :search')
                        .orWhere('LOWER(employeePayroll.positionName) LIKE :search');
                }),
                { search: `%${search}%` },
            );
        }
    }

    private async findActiveHolidayDates(
        manager: EntityManager,
        startDate: string,
        endDate: string,
    ): Promise<string[]> {
        const holidays = await manager.getRepository(Holiday).find({
            where: {
                status: HolidayStatus.Active,
            },
        });

        return holidays
            .filter(
                (holiday) =>
                    holiday.holidayDate >= startDate &&
                    holiday.holidayDate <= endDate,
            )
            .map((holiday) => holiday.holidayDate);
    }

    private calculatePay(
        hourlyRate: number,
        minutes: number,
        multiplier: number,
    ): number {
        return (hourlyRate / 60) * minutes * multiplier;
    }

    private toMoney(value: number): string {
        return value.toFixed(2);
    }

    private toMultiplier(value: number): string {
        return value.toFixed(2);
    }
}
