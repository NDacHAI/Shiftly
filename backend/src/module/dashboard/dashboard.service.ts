import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { AttendanceStatus } from '@/module/attendance/entities/attendance-status.enum';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { EmployeeStatus } from '@/module/employee/entities/employee-status.enum';
import { Holiday } from '@/module/holiday/entities/holiday.entity';
import { HolidayStatus } from '@/module/holiday/entities/holiday-status.enum';
import { LeaveRequestAssignment } from '@/module/leave-request/entities/leave-request-assignment.entity';
import { LeaveRequest } from '@/module/leave-request/entities/leave-request.entity';
import { LeaveRequestStatus } from '@/module/leave-request/entities/leave-request-status.enum';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { PayrollPeriodStatus } from '@/module/payroll-period/entities/payroll-period-status.enum';
import { EmployeePayroll } from '@/module/payroll-processing/entities/employee-payroll.entity';
import { EmployeePayrollStatus } from '@/module/payroll-processing/entities/employee-payroll-status.enum';
import { PayrollProcessing } from '@/module/payroll-processing/entities/payroll-processing.entity';
import { PayrollProcessingStatus } from '@/module/payroll-processing/entities/payroll-processing-status.enum';
import { ShiftRequest } from '@/module/shift-request/entities/shift-request.entity';
import { ShiftRequestStatus } from '@/module/shift-request/entities/shift-request-status.enum';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import {
    addDaysToDateString,
    buildDateRange,
    daysBetween,
    monthRangeOf,
    toNumber,
    toVietnamDateTime,
    vietnamToday,
} from './dashboard.utils';
import {
    DashboardBranchOption,
    DashboardBranchStats,
    DashboardCurrentPayrollPeriod,
    DashboardDailyStats,
    DashboardEmployeeRanking,
    DashboardMine,
    DashboardMissingCheckIn,
    DashboardMyPayslip,
    DashboardMyRequest,
    DashboardMySchedule,
    DashboardPayrollTrend,
    DashboardPendingAttendance,
    DashboardPendingLeaveRequest,
    DashboardPendingShiftRequest,
    DashboardSummary,
    DashboardTodayShift,
} from './types/dashboard.types';

const ACTION_ITEM_LIMIT = 5;
const MISSING_CHECK_IN_LIMIT = 10;
const MISSING_CHECK_IN_AFTER_MINUTES = 5;
const RANKING_LIMIT = 5;
const PAYROLL_TREND_LIMIT = 6;
const UPCOMING_HOLIDAY_DAYS = 30;
const UPCOMING_SCHEDULE_DAYS = 7;

// Raw SQL: aliases inside the subquery are not TypeORM aliases, so real column names are used.
const APPROVED_LEAVE_EXISTS = `EXISTS (
    SELECT 1
    FROM leave_request_assignments leave_assignment
    INNER JOIN leave_requests leave_request
        ON leave_request.id = leave_assignment.leave_request_id
    WHERE leave_assignment.work_schedule_id = schedule.id
        AND leave_request.status = :approvedLeaveStatus
)`;

const EMPLOYEE_NAME_SQL = "CONCAT(employee.firstName, ' ', employee.lastName)";

type DailyStatsRow = Record<keyof DashboardDailyStats, string>;

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(WorkSchedule)
        private readonly workScheduleRepository: Repository<WorkSchedule>,
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(LeaveRequest)
        private readonly leaveRequestRepository: Repository<LeaveRequest>,
        @InjectRepository(LeaveRequestAssignment)
        private readonly leaveAssignmentRepository: Repository<LeaveRequestAssignment>,
        @InjectRepository(ShiftRequest)
        private readonly shiftRequestRepository: Repository<ShiftRequest>,
        @InjectRepository(Holiday)
        private readonly holidayRepository: Repository<Holiday>,
        @InjectRepository(PayrollPeriod)
        private readonly periodRepository: Repository<PayrollPeriod>,
        @InjectRepository(PayrollProcessing)
        private readonly processingRepository: Repository<PayrollProcessing>,
        @InjectRepository(EmployeePayroll)
        private readonly employeePayrollRepository: Repository<EmployeePayroll>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
    ) {}

    async getSummary(
        query: DashboardQueryDto,
        allowedBranchIds?: string[],
    ): Promise<DashboardSummary> {
        const branchIds = this.resolveBranchScope(query.branchId, allowedBranchIds);
        const now = new Date();
        const today = vietnamToday(now);
        const days = query.days ?? 7;
        const fromDate = addDaysToDateString(today, -(days - 1));

        const [
            branches,
            dailyStats,
            pendingLeave,
            pendingShift,
            pendingAttendance,
            missingCheckIns,
            todayShifts,
            branchStats,
            payrollTrend,
            currentPayrollPeriod,
            upcomingHolidays,
            topLateEmployees,
            topOvertimeEmployees,
        ] = await Promise.all([
            this.findBranchOptions(allowedBranchIds),
            this.aggregateDailyStats(fromDate, today, branchIds),
            this.findPendingLeaveRequests(branchIds),
            this.findPendingShiftRequests(branchIds),
            this.findPendingAttendances(branchIds),
            this.findMissingCheckIns(today, now, branchIds),
            this.aggregateTodayShifts(today, branchIds),
            this.aggregateBranchStats(fromDate, today, branchIds),
            this.aggregatePayrollTrend(branchIds),
            this.findCurrentPayrollPeriod(today),
            this.findUpcomingHolidays(today),
            this.rankEmployees('late', fromDate, today, branchIds),
            this.rankEmployees('overtime', fromDate, today, branchIds),
        ]);

        const todayStats =
            dailyStats.find((stats) => stats.date === today) ??
            this.createEmptyDailyStats(today);

        return {
            generatedAt: now.toISOString(),
            date: today,
            range: { fromDate, toDate: today, days },
            branchId: query.branchId ?? null,
            branches,
            todayStats,
            todayShifts,
            missingCheckInTotal: missingCheckIns.total,
            pending: {
                leaveRequests: pendingLeave.total,
                shiftRequests: pendingShift.total,
                attendanceConfirmations: pendingAttendance.total,
                total:
                    pendingLeave.total +
                    pendingShift.total +
                    pendingAttendance.total,
            },
            actionItems: {
                missingCheckIns: missingCheckIns.items,
                pendingLeaveRequests: pendingLeave.items,
                pendingShiftRequests: pendingShift.items,
                pendingAttendances: pendingAttendance.items,
            },
            attendanceTrend: dailyStats,
            branchStats,
            payrollTrend,
            currentPayrollPeriod,
            upcomingHolidays,
            topLateEmployees,
            topOvertimeEmployees,
        };
    }

    async getMine(authUser: JwtPayload): Promise<DashboardMine> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const employee = await this.employeeRepository.findOne({
            where: { id: authUser.employeeId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        const now = new Date();
        const today = vietnamToday(now);
        const month = monthRangeOf(today);

        const [
            todaySchedules,
            upcomingSchedules,
            monthStats,
            pendingRequests,
            recentRequests,
            latestPayslip,
        ] = await Promise.all([
            this.findMyTodaySchedules(employee.id, today),
            this.findMySchedules(
                employee.id,
                addDaysToDateString(today, 1),
                addDaysToDateString(today, UPCOMING_SCHEDULE_DAYS),
            ),
            this.aggregateMyMonth(employee.id, month.startDate, month.endDate),
            this.countMyPendingRequests(employee.id),
            this.findMyRecentRequests(employee.id),
            this.findMyLatestPayslip(employee.id),
        ]);

        return {
            generatedAt: now.toISOString(),
            date: today,
            employee: {
                id: employee.id,
                employeeCode: employee.employeeCode,
                fullName: `${employee.firstName} ${employee.lastName}`.trim(),
            },
            todaySchedules,
            upcomingSchedules,
            monthStats,
            pendingRequests,
            recentRequests,
            latestPayslip,
        };
    }

    private resolveBranchScope(
        branchId: string | undefined,
        allowedBranchIds?: string[],
    ): string[] | undefined {
        if (!branchId) {
            return allowedBranchIds;
        }

        if (allowedBranchIds && !allowedBranchIds.includes(branchId)) {
            throw new ForbiddenException(
                'You can only view dashboard data in your branches',
            );
        }

        return [branchId];
    }

    private applyBranchScope<T extends object>(
        queryBuilder: SelectQueryBuilder<T>,
        column: string,
        branchIds?: string[],
    ): void {
        if (!branchIds) {
            return;
        }

        if (branchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere(`${column} IN (:...scopeBranchIds)`, {
            scopeBranchIds: branchIds,
        });
    }

    private async findBranchOptions(
        allowedBranchIds?: string[],
    ): Promise<DashboardBranchOption[]> {
        if (allowedBranchIds && allowedBranchIds.length === 0) {
            return [];
        }

        const branches = await this.branchRepository.find({
            where: allowedBranchIds
                ? { id: In(allowedBranchIds) }
                : { status: true },
            order: { name: 'ASC' },
        });

        return branches.map((branch) => ({
            id: branch.id,
            code: branch.code,
            name: branch.name,
        }));
    }

    private async aggregateDailyStats(
        fromDate: string,
        toDate: string,
        branchIds?: string[],
    ): Promise<DashboardDailyStats[]> {
        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('schedule')
            .leftJoin(
                Attendance,
                'attendance',
                'attendance.workScheduleId = schedule.id',
            )
            .select("DATE_FORMAT(schedule.workDate, '%Y-%m-%d')", 'date')
            .addSelect('COUNT(schedule.id)', 'scheduled')
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL AND attendance.lateMinutes = 0 THEN 1 ELSE 0 END)',
                'onTime',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL AND attendance.lateMinutes > 0 THEN 1 ELSE 0 END)',
                'late',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.status = :checkedInStatus THEN 1 ELSE 0 END)',
                'working',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.status = :absentStatus THEN 1 ELSE 0 END)',
                'absent',
            )
            .addSelect(
                `SUM(CASE WHEN attendance.id IS NULL AND ${APPROVED_LEAVE_EXISTS} THEN 1 ELSE 0 END)`,
                'onLeave',
            )
            .addSelect(
                `SUM(CASE WHEN attendance.id IS NULL AND NOT ${APPROVED_LEAVE_EXISTS} THEN 1 ELSE 0 END)`,
                'notRecorded',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL THEN attendance.lateMinutes ELSE 0 END)',
                'lateMinutes',
            )
            .where('schedule.workDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            })
            .setParameters({
                checkedInStatus: AttendanceStatus.CheckedIn,
                absentStatus: AttendanceStatus.Absent,
                approvedLeaveStatus: LeaveRequestStatus.Approved,
            })
            .groupBy('schedule.workDate');

        this.applyBranchScope(queryBuilder, 'schedule.branchId', branchIds);

        const rows = await queryBuilder.getRawMany<DailyStatsRow>();
        const rowByDate = new Map(rows.map((row) => [row.date, row]));

        return buildDateRange(fromDate, toDate).map((date) => {
            const row = rowByDate.get(date);

            if (!row) {
                return this.createEmptyDailyStats(date);
            }

            return {
                date,
                scheduled: toNumber(row.scheduled),
                onTime: toNumber(row.onTime),
                late: toNumber(row.late),
                working: toNumber(row.working),
                absent: toNumber(row.absent),
                onLeave: toNumber(row.onLeave),
                notRecorded: toNumber(row.notRecorded),
                lateMinutes: toNumber(row.lateMinutes),
            };
        });
    }

    private createEmptyDailyStats(date: string): DashboardDailyStats {
        return {
            date,
            scheduled: 0,
            onTime: 0,
            late: 0,
            working: 0,
            absent: 0,
            onLeave: 0,
            notRecorded: 0,
            lateMinutes: 0,
        };
    }

    private async findMissingCheckIns(
        today: string,
        now: Date,
        branchIds?: string[],
    ): Promise<{ items: DashboardMissingCheckIn[]; total: number }> {
        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('schedule')
            .leftJoin(
                Attendance,
                'attendance',
                'attendance.workScheduleId = schedule.id',
            )
            .innerJoinAndSelect('schedule.employee', 'employee')
            .innerJoinAndSelect('schedule.branch', 'branch')
            .where('schedule.workDate = :today', { today })
            .andWhere('attendance.id IS NULL')
            .andWhere(`NOT ${APPROVED_LEAVE_EXISTS}`, {
                approvedLeaveStatus: LeaveRequestStatus.Approved,
            })
            .orderBy('schedule.startTimeSnapshot', 'ASC');

        this.applyBranchScope(queryBuilder, 'schedule.branchId', branchIds);

        const schedules = await queryBuilder.getMany();

        const overdue = schedules
            .map((schedule) => {
                const scheduledStartAt = toVietnamDateTime(
                    schedule.workDate,
                    schedule.startTimeSnapshot,
                );
                const minutesOverdue = Math.floor(
                    (now.getTime() - scheduledStartAt.getTime()) / 60000,
                );

                return {
                    workScheduleId: schedule.id,
                    employeeId: schedule.employeeId,
                    employeeCode: schedule.employee.employeeCode,
                    employeeName:
                        `${schedule.employee.firstName} ${schedule.employee.lastName}`.trim(),
                    branchName: schedule.branch.name,
                    shiftName: schedule.shiftNameSnapshot,
                    scheduledStartAt: scheduledStartAt.toISOString(),
                    minutesOverdue,
                };
            })
            .filter((item) => item.minutesOverdue > MISSING_CHECK_IN_AFTER_MINUTES);

        return {
            total: overdue.length,
            items: overdue.slice(0, MISSING_CHECK_IN_LIMIT),
        };
    }

    private async findPendingLeaveRequests(
        branchIds?: string[],
    ): Promise<{ items: DashboardPendingLeaveRequest[]; total: number }> {
        const queryBuilder = this.leaveRequestRepository
            .createQueryBuilder('leaveRequest')
            .innerJoinAndSelect('leaveRequest.employee', 'employee')
            .innerJoinAndSelect('leaveRequest.branch', 'branch')
            .where('leaveRequest.status = :status', {
                status: LeaveRequestStatus.Pending,
            })
            .orderBy('leaveRequest.createdAt', 'ASC')
            .take(ACTION_ITEM_LIMIT);

        this.applyBranchScope(queryBuilder, 'leaveRequest.branchId', branchIds);

        const [requests, total] = await queryBuilder.getManyAndCount();

        return {
            total,
            items: requests.map((request) => ({
                id: request.id,
                code: request.code,
                employeeName:
                    `${request.employee.firstName} ${request.employee.lastName}`.trim(),
                branchName: request.branch.name,
                requestMode: request.requestMode,
                startDate: request.startDate,
                endDate: request.endDate,
                isFullDay: request.isFullDay,
                startTime: request.startTime,
                endTime: request.endTime,
                createdAt: request.createdAt,
            })),
        };
    }

    private async findPendingShiftRequests(
        branchIds?: string[],
    ): Promise<{ items: DashboardPendingShiftRequest[]; total: number }> {
        const queryBuilder = this.shiftRequestRepository
            .createQueryBuilder('shiftRequest')
            .innerJoinAndSelect('shiftRequest.employee', 'employee')
            .innerJoinAndSelect('shiftRequest.branch', 'branch')
            .innerJoinAndSelect('shiftRequest.workShift', 'workShift')
            .where('shiftRequest.status = :status', {
                status: ShiftRequestStatus.Pending,
            })
            .orderBy('shiftRequest.createdAt', 'ASC')
            .take(ACTION_ITEM_LIMIT);

        this.applyBranchScope(queryBuilder, 'shiftRequest.branchId', branchIds);

        const [requests, total] = await queryBuilder.getManyAndCount();

        return {
            total,
            items: requests.map((request) => ({
                id: request.id,
                employeeName:
                    `${request.employee.firstName} ${request.employee.lastName}`.trim(),
                branchName: request.branch.name,
                shiftName: request.workShift.name,
                workDate: request.workDate,
                createdAt: request.createdAt,
            })),
        };
    }

    private async findPendingAttendances(
        branchIds?: string[],
    ): Promise<{ items: DashboardPendingAttendance[]; total: number }> {
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .innerJoinAndSelect('attendance.employee', 'employee')
            .innerJoinAndSelect('attendance.branch', 'branch')
            .where('attendance.status = :status', {
                status: AttendanceStatus.PendingConfirmation,
            })
            .orderBy('attendance.scheduleDate', 'ASC')
            .addOrderBy('attendance.scheduledStartAt', 'ASC')
            .take(ACTION_ITEM_LIMIT);

        this.applyBranchScope(queryBuilder, 'attendance.branchId', branchIds);

        const [attendances, total] = await queryBuilder.getManyAndCount();

        return {
            total,
            items: attendances.map((attendance) => ({
                id: attendance.id,
                employeeName:
                    `${attendance.employee.firstName} ${attendance.employee.lastName}`.trim(),
                branchName: attendance.branch.name,
                scheduleDate: attendance.scheduleDate,
                checkInAt: attendance.checkInAt,
                checkOutAt: attendance.checkOutAt,
                workedMinutes: attendance.workedMinutes,
                lateMinutes: attendance.lateMinutes,
            })),
        };
    }

    // One row per branch + shift slot today, so the dashboard can draw a staffing timeline.
    private async aggregateTodayShifts(
        today: string,
        branchIds?: string[],
    ): Promise<DashboardTodayShift[]> {
        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.branch', 'branch')
            .leftJoin(
                Attendance,
                'attendance',
                'attendance.workScheduleId = schedule.id',
            )
            .select('branch.id', 'branchId')
            .addSelect('branch.name', 'branchName')
            .addSelect('schedule.shiftNameSnapshot', 'shiftName')
            .addSelect('schedule.startTimeSnapshot', 'startTime')
            .addSelect('schedule.endTimeSnapshot', 'endTime')
            .addSelect('COUNT(schedule.id)', 'scheduled')
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL THEN 1 ELSE 0 END)',
                'checkedIn',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL AND attendance.lateMinutes > 0 THEN 1 ELSE 0 END)',
                'late',
            )
            .addSelect(
                `SUM(CASE WHEN attendance.id IS NULL AND ${APPROVED_LEAVE_EXISTS} THEN 1 ELSE 0 END)`,
                'onLeave',
            )
            .where('schedule.workDate = :today', { today })
            .setParameters({ approvedLeaveStatus: LeaveRequestStatus.Approved })
            .groupBy('branch.id')
            .addGroupBy('branch.name')
            .addGroupBy('schedule.shiftNameSnapshot')
            .addGroupBy('schedule.startTimeSnapshot')
            .addGroupBy('schedule.endTimeSnapshot')
            .orderBy('schedule.startTimeSnapshot', 'ASC')
            .addOrderBy('branch.name', 'ASC');

        this.applyBranchScope(queryBuilder, 'schedule.branchId', branchIds);

        const rows = await queryBuilder.getRawMany<Record<string, string>>();

        return rows.map((row) => {
            const scheduledStartAt = toVietnamDateTime(today, row.startTime);
            let scheduledEndAt = toVietnamDateTime(today, row.endTime);

            if (scheduledEndAt <= scheduledStartAt) {
                scheduledEndAt = new Date(
                    scheduledEndAt.getTime() + 24 * 60 * 60 * 1000,
                );
            }

            return {
                branchId: row.branchId,
                branchName: row.branchName,
                shiftName: row.shiftName,
                scheduledStartAt: scheduledStartAt.toISOString(),
                scheduledEndAt: scheduledEndAt.toISOString(),
                scheduled: toNumber(row.scheduled),
                checkedIn: toNumber(row.checkedIn),
                late: toNumber(row.late),
                onLeave: toNumber(row.onLeave),
            };
        });
    }

    private async aggregateBranchStats(
        fromDate: string,
        toDate: string,
        branchIds?: string[],
    ): Promise<DashboardBranchStats[]> {
        if (branchIds && branchIds.length === 0) {
            return [];
        }

        const attendanceQuery = this.attendanceRepository
            .createQueryBuilder('attendance')
            .select('attendance.branchId', 'branchId')
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL THEN 1 ELSE 0 END)',
                'attended',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL AND attendance.lateMinutes = 0 THEN 1 ELSE 0 END)',
                'onTime',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.checkInAt IS NOT NULL AND attendance.lateMinutes > 0 THEN 1 ELSE 0 END)',
                'late',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.status IN (:...workedStatuses) THEN attendance.workedMinutes ELSE 0 END)',
                'workedMinutes',
            )
            .addSelect(
                'SUM(CASE WHEN attendance.status IN (:...workedStatuses) THEN attendance.overtimeMinutes ELSE 0 END)',
                'overtimeMinutes',
            )
            .where('attendance.scheduleDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            })
            .setParameters({
                workedStatuses: [
                    AttendanceStatus.PendingConfirmation,
                    AttendanceStatus.Confirmed,
                ],
            })
            .groupBy('attendance.branchId');

        this.applyBranchScope(attendanceQuery, 'attendance.branchId', branchIds);

        const employeeQuery = this.employeeRepository
            .createQueryBuilder('employee')
            .innerJoin('employee.branches', 'branch')
            .select('branch.id', 'branchId')
            .addSelect('COUNT(DISTINCT employee.id)', 'employees')
            .where('employee.status = :employeeStatus', {
                employeeStatus: EmployeeStatus.Active,
            })
            .groupBy('branch.id');

        this.applyBranchScope(employeeQuery, 'branch.id', branchIds);

        const [branches, attendanceRows, employeeRows] = await Promise.all([
            this.branchRepository.find({
                where: branchIds ? { id: In(branchIds) } : { status: true },
                order: { name: 'ASC' },
            }),
            attendanceQuery.getRawMany<Record<string, string>>(),
            employeeQuery.getRawMany<Record<string, string>>(),
        ]);
        const attendanceByBranch = new Map(
            attendanceRows.map((row) => [row.branchId, row]),
        );
        const employeesByBranch = new Map(
            employeeRows.map((row) => [row.branchId, toNumber(row.employees)]),
        );

        return branches.map((branch) => {
            const row = attendanceByBranch.get(branch.id);

            return {
                branchId: branch.id,
                branchName: branch.name,
                employees: employeesByBranch.get(branch.id) ?? 0,
                attended: toNumber(row?.attended),
                onTime: toNumber(row?.onTime),
                late: toNumber(row?.late),
                workedMinutes: toNumber(row?.workedMinutes),
                overtimeMinutes: toNumber(row?.overtimeMinutes),
            };
        });
    }

    private async aggregatePayrollTrend(
        branchIds?: string[],
    ): Promise<DashboardPayrollTrend[]> {
        const queryBuilder = this.employeePayrollRepository
            .createQueryBuilder('payroll')
            .innerJoin('payroll.payrollPeriod', 'period')
            .select('period.id', 'payrollPeriodId')
            .addSelect('period.name', 'name')
            .addSelect('period.payrollMonth', 'month')
            .addSelect('period.payrollYear', 'year')
            .addSelect('COUNT(payroll.id)', 'employees')
            .addSelect('SUM(payroll.regularPay)', 'regularPay')
            .addSelect('SUM(payroll.overtimePay)', 'overtimePay')
            .addSelect(
                'SUM(payroll.holidayPay + payroll.holidayOvertimePay)',
                'holidayPay',
            )
            .addSelect('SUM(payroll.rewardTotal)', 'rewardTotal')
            .addSelect('SUM(payroll.penaltyTotal)', 'penaltyTotal')
            .addSelect('SUM(payroll.grossPay)', 'grossPay')
            .addSelect('SUM(payroll.netPay)', 'netPay')
            .where('payroll.status IN (:...statuses)', {
                statuses: [
                    EmployeePayrollStatus.Success,
                    EmployeePayrollStatus.Finalized,
                ],
            })
            .groupBy('period.id')
            .addGroupBy('period.name')
            .addGroupBy('period.payrollMonth')
            .addGroupBy('period.payrollYear')
            .orderBy('year', 'DESC')
            .addOrderBy('month', 'DESC')
            .limit(PAYROLL_TREND_LIMIT);

        this.applyBranchScope(queryBuilder, 'payroll.branchId', branchIds);

        const rows = await queryBuilder.getRawMany<
            Record<keyof DashboardPayrollTrend, string>
        >();

        return rows
            .map((row) => ({
                payrollPeriodId: row.payrollPeriodId,
                name: row.name,
                month: toNumber(row.month),
                year: toNumber(row.year),
                employees: toNumber(row.employees),
                regularPay: toNumber(row.regularPay),
                overtimePay: toNumber(row.overtimePay),
                holidayPay: toNumber(row.holidayPay),
                rewardTotal: toNumber(row.rewardTotal),
                penaltyTotal: toNumber(row.penaltyTotal),
                grossPay: toNumber(row.grossPay),
                netPay: toNumber(row.netPay),
            }))
            .reverse();
    }

    private async findCurrentPayrollPeriod(
        today: string,
    ): Promise<DashboardCurrentPayrollPeriod | null> {
        const period = await this.periodRepository.findOne({
            where: { status: PayrollPeriodStatus.Open },
            order: { startDate: 'DESC' },
        });

        if (!period) {
            return null;
        }

        const processing = await this.processingRepository.findOne({
            where: { payrollPeriodId: period.id },
        });

        return {
            id: period.id,
            code: period.code,
            name: period.name,
            startDate: period.startDate,
            endDate: period.endDate,
            status: period.status,
            daysRemaining: daysBetween(today, period.endDate),
            processingStatus: processing?.status ?? null,
        };
    }

    private async findUpcomingHolidays(today: string) {
        const holidays = await this.holidayRepository.find({
            where: {
                status: HolidayStatus.Active,
                holidayDate: Between(
                    today,
                    addDaysToDateString(today, UPCOMING_HOLIDAY_DAYS),
                ),
            },
            order: { holidayDate: 'ASC' },
            take: ACTION_ITEM_LIMIT,
        });

        return holidays.map((holiday) => ({
            id: holiday.id,
            name: holiday.name,
            holidayDate: holiday.holidayDate,
        }));
    }

    private async rankEmployees(
        metric: 'late' | 'overtime',
        fromDate: string,
        toDate: string,
        branchIds?: string[],
    ): Promise<DashboardEmployeeRanking[]> {
        const column =
            metric === 'late'
                ? 'attendance.lateMinutes'
                : 'attendance.overtimeMinutes';
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .innerJoin('attendance.employee', 'employee')
            .select('employee.id', 'employeeId')
            .addSelect('employee.employeeCode', 'employeeCode')
            .addSelect(EMPLOYEE_NAME_SQL, 'employeeName')
            .addSelect('COUNT(attendance.id)', 'count')
            .addSelect(`SUM(${column})`, 'minutes')
            .where('attendance.scheduleDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            })
            .andWhere(`${column} > 0`)
            .groupBy('employee.id')
            .addGroupBy('employee.employeeCode')
            .addGroupBy('employee.firstName')
            .addGroupBy('employee.lastName')
            .orderBy('minutes', 'DESC')
            .limit(RANKING_LIMIT);

        this.applyBranchScope(queryBuilder, 'attendance.branchId', branchIds);

        const rows = await queryBuilder.getRawMany<
            Record<keyof DashboardEmployeeRanking, string>
        >();

        return rows.map((row) => ({
            employeeId: row.employeeId,
            employeeCode: row.employeeCode,
            employeeName: row.employeeName.trim(),
            count: toNumber(row.count),
            minutes: toNumber(row.minutes),
        }));
    }

    private async findMyTodaySchedules(
        employeeId: string,
        today: string,
    ): Promise<DashboardMySchedule[]> {
        const yesterday = addDaysToDateString(today, -1);
        const schedules = await this.findMySchedules(employeeId, yesterday, today);

        // Keep yesterday's overnight shift only while it still needs a check-out.
        return schedules.filter(
            (schedule) =>
                schedule.workDate === today ||
                schedule.attendanceStatus === AttendanceStatus.CheckedIn,
        );
    }

    private async findMySchedules(
        employeeId: string,
        fromDate: string,
        toDate: string,
    ): Promise<DashboardMySchedule[]> {
        const schedules = await this.workScheduleRepository.find({
            where: {
                employeeId,
                workDate: Between(fromDate, toDate),
            },
            relations: { branch: true, position: true },
            order: { workDate: 'ASC', startTimeSnapshot: 'ASC' },
        });

        if (schedules.length === 0) {
            return [];
        }

        const scheduleIds = schedules.map((schedule) => schedule.id);
        const [attendances, leaveAssignments] = await Promise.all([
            this.attendanceRepository.find({
                where: { workScheduleId: In(scheduleIds) },
            }),
            this.leaveAssignmentRepository.find({
                where: {
                    workScheduleId: In(scheduleIds),
                    leaveRequest: { status: LeaveRequestStatus.Approved },
                },
                relations: { leaveRequest: true },
            }),
        ]);
        const attendanceBySchedule = new Map(
            attendances.map((attendance) => [attendance.workScheduleId, attendance]),
        );
        const leaveScheduleIds = new Set(
            leaveAssignments.map((assignment) => assignment.workScheduleId),
        );

        return schedules.map((schedule) => {
            const attendance = attendanceBySchedule.get(schedule.id);
            const scheduledStartAt = toVietnamDateTime(
                schedule.workDate,
                schedule.startTimeSnapshot,
            );
            let scheduledEndAt = toVietnamDateTime(
                schedule.workDate,
                schedule.endTimeSnapshot,
            );

            if (scheduledEndAt <= scheduledStartAt) {
                scheduledEndAt = new Date(
                    scheduledEndAt.getTime() + 24 * 60 * 60 * 1000,
                );
            }

            return {
                workScheduleId: schedule.id,
                attendanceId: attendance?.id ?? null,
                workDate: schedule.workDate,
                shiftName: schedule.shiftNameSnapshot,
                branchName: schedule.branch.name,
                positionName: schedule.position.name,
                scheduledStartAt: scheduledStartAt.toISOString(),
                scheduledEndAt: scheduledEndAt.toISOString(),
                checkInAt: attendance?.checkInAt ?? null,
                checkOutAt: attendance?.checkOutAt ?? null,
                attendanceStatus: attendance?.status ?? null,
                isOnLeave: leaveScheduleIds.has(schedule.id),
            };
        });
    }

    private async aggregateMyMonth(
        employeeId: string,
        fromDate: string,
        toDate: string,
    ): Promise<DashboardMine['monthStats']> {
        const [scheduledShifts, row] = await Promise.all([
            this.workScheduleRepository.count({
                where: { employeeId, workDate: Between(fromDate, toDate) },
            }),
            this.attendanceRepository
                .createQueryBuilder('attendance')
                .select(
                    'SUM(CASE WHEN attendance.checkInAt IS NOT NULL THEN 1 ELSE 0 END)',
                    'attendedShifts',
                )
                .addSelect(
                    'SUM(CASE WHEN attendance.status IN (:...workedStatuses) THEN attendance.workedMinutes ELSE 0 END)',
                    'workedMinutes',
                )
                .addSelect(
                    'SUM(CASE WHEN attendance.status IN (:...workedStatuses) THEN attendance.overtimeMinutes ELSE 0 END)',
                    'overtimeMinutes',
                )
                .addSelect(
                    'SUM(CASE WHEN attendance.lateMinutes > 0 THEN 1 ELSE 0 END)',
                    'lateCount',
                )
                .addSelect('SUM(attendance.lateMinutes)', 'lateMinutes')
                .addSelect(
                    'SUM(CASE WHEN attendance.status = :absentStatus THEN 1 ELSE 0 END)',
                    'absentCount',
                )
                .where('attendance.employeeId = :employeeId', { employeeId })
                .andWhere(
                    'attendance.scheduleDate BETWEEN :fromDate AND :toDate',
                    { fromDate, toDate },
                )
                .setParameters({
                    workedStatuses: [
                        AttendanceStatus.PendingConfirmation,
                        AttendanceStatus.Confirmed,
                    ],
                    absentStatus: AttendanceStatus.Absent,
                })
                .getRawOne<Record<string, string | null>>(),
        ]);

        return {
            fromDate,
            toDate,
            scheduledShifts,
            attendedShifts: toNumber(row?.attendedShifts),
            workedMinutes: toNumber(row?.workedMinutes),
            overtimeMinutes: toNumber(row?.overtimeMinutes),
            lateCount: toNumber(row?.lateCount),
            lateMinutes: toNumber(row?.lateMinutes),
            absentCount: toNumber(row?.absentCount),
        };
    }

    private async countMyPendingRequests(
        employeeId: string,
    ): Promise<DashboardMine['pendingRequests']> {
        const [leaveRequests, shiftRequests] = await Promise.all([
            this.leaveRequestRepository.count({
                where: { employeeId, status: LeaveRequestStatus.Pending },
            }),
            this.shiftRequestRepository.count({
                where: { employeeId, status: ShiftRequestStatus.Pending },
            }),
        ]);

        return { leaveRequests, shiftRequests };
    }

    private async findMyRecentRequests(
        employeeId: string,
    ): Promise<DashboardMyRequest[]> {
        const [leaveRequests, shiftRequests] = await Promise.all([
            this.leaveRequestRepository.find({
                where: { employeeId },
                order: { createdAt: 'DESC' },
                take: ACTION_ITEM_LIMIT,
            }),
            this.shiftRequestRepository.find({
                where: { employeeId },
                relations: { workShift: true },
                order: { createdAt: 'DESC' },
                take: ACTION_ITEM_LIMIT,
            }),
        ]);

        const requests: DashboardMyRequest[] = [
            ...leaveRequests.map((request) => ({
                id: request.id,
                type: 'LEAVE' as const,
                label: request.code,
                date: request.startDate,
                status: request.status,
                createdAt: request.createdAt,
            })),
            ...shiftRequests.map((request) => ({
                id: request.id,
                type: 'SHIFT' as const,
                label: request.workShift.name,
                date: request.workDate,
                status: request.status,
                createdAt: request.createdAt,
            })),
        ];

        return requests
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .slice(0, ACTION_ITEM_LIMIT);
    }

    private async findMyLatestPayslip(
        employeeId: string,
    ): Promise<DashboardMyPayslip | null> {
        const payslip = await this.employeePayrollRepository
            .createQueryBuilder('payslip')
            .innerJoinAndSelect('payslip.payrollProcessing', 'payrollProcessing')
            .innerJoinAndSelect('payslip.payrollPeriod', 'payrollPeriod')
            .where('payslip.employeeId = :employeeId', { employeeId })
            .andWhere('payslip.status = :payslipStatus', {
                payslipStatus: EmployeePayrollStatus.Finalized,
            })
            .andWhere('payrollProcessing.status = :processingStatus', {
                processingStatus: PayrollProcessingStatus.Closed,
            })
            .orderBy('payrollPeriod.payrollYear', 'DESC')
            .addOrderBy('payrollPeriod.payrollMonth', 'DESC')
            .getOne();

        if (!payslip) {
            return null;
        }

        return {
            id: payslip.id,
            payrollPeriodName: payslip.payrollPeriod.name,
            grossPay: toNumber(payslip.grossPay),
            netPay: toNumber(payslip.netPay),
            createdAt: payslip.createdAt,
        };
    }
}
