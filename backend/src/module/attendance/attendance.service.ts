import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Brackets,
    DataSource,
    EntityManager,
    QueryFailedError,
    Repository,
} from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { AdjustAttendanceDto } from './dto/adjust-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';
import { AttendanceAdjustmentAction } from './entities/attendance-adjustment-action.enum';
import { AttendanceAdjustment } from './entities/attendance-adjustment.entity';
import { AttendanceSource } from './entities/attendance-source.enum';
import { AttendanceStatus } from './entities/attendance-status.enum';
import { Attendance } from './entities/attendance.entity';

const EARLY_CHECK_IN_MINUTES = 30;
const LATE_CHECK_IN_LIMIT_MINUTES = 15;
const GRACE_MINUTES = 5;
const MAX_CHECK_OUT_AFTER_SCHEDULED_END_HOURS = 12;

type ScheduleWithAttendance = WorkSchedule & {
    attendance?: Attendance | null;
};

export type AttendanceListItem = {
    workScheduleId: string;
    attendanceId: string | null;
    employeeId: string;
    branchId: string;
    positionId: string;
    workShiftId: string;
    scheduleDate: string;
    scheduledStartAt: Date;
    scheduledEndAt: Date;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    workedMinutes: number;
    status: AttendanceStatus | null;
    displayStatus: AttendanceStatus | 'NOT_CHECKED_IN';
    source: AttendanceSource | null;
    isLate: boolean;
    isEarlyLeave: boolean;
    isOvertime: boolean;
    hasAdjustment: boolean;
    workSchedule: WorkSchedule;
};

export type PaginatedAttendances = {
    data: AttendanceListItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(AttendanceAdjustment)
        private readonly adjustmentRepository: Repository<AttendanceAdjustment>,
        @InjectRepository(WorkSchedule)
        private readonly workScheduleRepository: Repository<WorkSchedule>,
        private readonly dataSource: DataSource,
    ) {}

    async findMySchedules(
        authUser: JwtPayload,
        query: AttendanceQueryDto,
    ): Promise<PaginatedAttendances> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        return this.findAll({ ...query, employeeId: authUser.employeeId }, authUser);
    }

    async findMyHistory(
        authUser: JwtPayload,
        query: AttendanceQueryDto,
    ): Promise<PaginatedAttendances> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const today = this.today();
        const fromDate = query.fromDate ?? this.addDays(today, -30);

        return this.findAll(
            {
                ...query,
                employeeId: authUser.employeeId,
                fromDate,
                toDate: query.toDate ?? today,
            },
            authUser,
        );
    }

    async findAll(
        query: AttendanceQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedAttendances> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('workSchedule')
            .leftJoinAndSelect('workSchedule.employee', 'employee')
            .leftJoinAndSelect('workSchedule.branch', 'branch')
            .leftJoinAndSelect('workSchedule.position', 'position')
            .leftJoinAndSelect('workSchedule.workShift', 'workShift')
            .leftJoinAndMapOne(
                'workSchedule.attendance',
                Attendance,
                'attendance',
                'attendance.workScheduleId = workSchedule.id',
            )
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        this.applyBranchScope(queryBuilder, allowedBranchIds);
        this.applyFilters(queryBuilder, query);
        this.applySort(queryBuilder, query);

        const [data, total] = await queryBuilder.getManyAndCount();
        const adjustmentCounts = await this.countAdjustments(
            data
                .map((schedule) => (schedule as ScheduleWithAttendance).attendance?.id)
                .filter((id): id is string => Boolean(id)),
        );

        return {
            data: data.map((schedule) =>
                this.toListItem(
                    schedule as ScheduleWithAttendance,
                    adjustmentCounts,
                ),
            ),
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
    ): Promise<Attendance> {
        const attendance = await this.findEntityById(id);
        this.ensureCanViewAttendance(attendance, authUser, allowedBranchIds);

        return attendance;
    }

    async checkIn(
        workScheduleId: string,
        authUser: JwtPayload,
    ): Promise<Attendance> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const schedule = await this.findLockedScheduleById(
                manager,
                workScheduleId,
            );

            if (schedule.employeeId !== authUser.employeeId) {
                throw new ForbiddenException(
                    'You can only check in your own work schedule',
                );
            }

            await this.ensureAttendanceDoesNotExist(manager, schedule.id);

            const now = new Date();
            const snapshot = this.buildScheduleSnapshot(schedule);
            this.ensureWithinCheckInWindow(now, snapshot.scheduledStartAt);

            const attendance = manager.getRepository(Attendance).create({
                workScheduleId: schedule.id,
                employeeId: schedule.employeeId,
                branchId: schedule.branchId,
                positionId: schedule.positionId,
                workShiftId: schedule.workShiftId,
                scheduleDate: schedule.workDate,
                scheduledStartAt: snapshot.scheduledStartAt,
                scheduledEndAt: snapshot.scheduledEndAt,
                breakMinutes: schedule.breakMinutesSnapshot,
                graceMinutes: GRACE_MINUTES,
                checkInAt: now,
                lateMinutes: this.calculateLateMinutes(
                    now,
                    snapshot.scheduledStartAt,
                    GRACE_MINUTES,
                ),
                status: AttendanceStatus.CheckedIn,
                source: AttendanceSource.EmployeeCheckIn,
            });

            try {
                const saved = await manager.getRepository(Attendance).save(attendance);
                return saved.id;
            } catch (error) {
                this.handleDuplicateAttendanceError(error);
                throw error;
            }
        });

        return this.findEntityById(attendanceId);
    }

    async checkOut(id: string, authUser: JwtPayload): Promise<Attendance> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const attendance = await this.findLockedAttendanceById(manager, id);

            if (attendance.employeeId !== authUser.employeeId) {
                throw new ForbiddenException(
                    'You can only check out your own attendance',
                );
            }

            this.ensureCheckedInForCheckout(attendance);

            const now = new Date();
            this.ensureCheckoutTimeAllowed(attendance, now);
            this.applyCheckout(attendance, now);

            await manager.getRepository(Attendance).save(attendance);
            return attendance.id;
        });

        return this.findEntityById(attendanceId);
    }

    async confirm(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<Attendance> {
        this.ensureCanManageAttendance(authUser);

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const attendance = await this.findLockedAttendanceById(manager, id);
            this.ensureBranchAllowed(attendance.branchId, authUser, allowedBranchIds);

            if (attendance.status !== AttendanceStatus.PendingConfirmation) {
                throw new BadRequestException(
                    'Only pending attendance can be confirmed',
                );
            }

            if (!attendance.checkInAt || !attendance.checkOutAt) {
                throw new BadRequestException(
                    'Attendance must have check-in and check-out before confirmation',
                );
            }

            attendance.status = AttendanceStatus.Confirmed;
            attendance.confirmedById = authUser.sub;
            attendance.confirmedAt = new Date();

            await manager.getRepository(Attendance).save(attendance);
            return attendance.id;
        });

        return this.findEntityById(attendanceId);
    }

    async adjust(
        id: string,
        authUser: JwtPayload,
        payload: AdjustAttendanceDto,
        allowedBranchIds?: string[],
    ): Promise<Attendance> {
        this.ensureCanManageAttendance(authUser);
        this.ensureReason(payload.reason);

        if (!payload.checkInAt && !payload.checkOutAt) {
            throw new BadRequestException(
                'At least check-in or check-out time must be provided',
            );
        }

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const attendance = await this.findLockedAttendanceById(manager, id);
            this.ensureBranchAllowed(attendance.branchId, authUser, allowedBranchIds);

            const oldSnapshot = this.snapshotAdjustmentValues(attendance);
            const nextCheckInAt = payload.checkInAt
                ? this.parseDate(payload.checkInAt)
                : attendance.checkInAt;
            const nextCheckOutAt = payload.checkOutAt
                ? this.parseDate(payload.checkOutAt)
                : attendance.checkOutAt;

            this.ensureTimeChanged(attendance, nextCheckInAt, nextCheckOutAt);
            this.ensureValidAttendanceTimes(nextCheckInAt, nextCheckOutAt);

            attendance.checkInAt = nextCheckInAt;
            attendance.checkOutAt = nextCheckOutAt;
            this.recalculateAttendance(attendance);

            if (
                attendance.status === AttendanceStatus.Confirmed &&
                attendance.checkOutAt
            ) {
                attendance.status = AttendanceStatus.PendingConfirmation;
                attendance.confirmedById = null;
                attendance.confirmedAt = null;
            }

            await manager.getRepository(Attendance).save(attendance);
            await this.createAdjustment(
                manager,
                attendance,
                oldSnapshot,
                AttendanceAdjustmentAction.AdjustTime,
                authUser.sub,
                payload.reason,
                payload.note,
            );

            return attendance.id;
        });

        return this.findEntityById(attendanceId);
    }

    async manualCreate(
        workScheduleId: string,
        authUser: JwtPayload,
        payload: ManualAttendanceDto,
        allowedBranchIds?: string[],
    ): Promise<Attendance> {
        this.ensureCanManageAttendance(authUser);
        this.ensureReason(payload.reason);

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const schedule = await this.findLockedScheduleById(
                manager,
                workScheduleId,
            );
            this.ensureBranchAllowed(schedule.branchId, authUser, allowedBranchIds);
            await this.ensureAttendanceDoesNotExist(manager, schedule.id);

            const checkInAt = this.parseDate(payload.checkInAt);
            const checkOutAt = payload.checkOutAt
                ? this.parseDate(payload.checkOutAt)
                : null;
            this.ensureValidAttendanceTimes(checkInAt, checkOutAt);

            const snapshot = this.buildScheduleSnapshot(schedule);
            const attendance = manager.getRepository(Attendance).create({
                workScheduleId: schedule.id,
                employeeId: schedule.employeeId,
                branchId: schedule.branchId,
                positionId: schedule.positionId,
                workShiftId: schedule.workShiftId,
                scheduleDate: schedule.workDate,
                scheduledStartAt: snapshot.scheduledStartAt,
                scheduledEndAt: snapshot.scheduledEndAt,
                breakMinutes: schedule.breakMinutesSnapshot,
                graceMinutes: GRACE_MINUTES,
                checkInAt,
                checkOutAt,
                status: checkOutAt
                    ? AttendanceStatus.PendingConfirmation
                    : AttendanceStatus.CheckedIn,
                source: AttendanceSource.Manual,
                note: this.normalizeNote(payload.note),
            });

            this.recalculateAttendance(attendance);

            try {
                const saved = await manager
                    .getRepository(Attendance)
                    .save(attendance);
                await this.createAdjustment(
                    manager,
                    saved,
                    null,
                    AttendanceAdjustmentAction.ManualCreate,
                    authUser.sub,
                    payload.reason,
                    payload.note,
                );

                return saved.id;
            } catch (error) {
                this.handleDuplicateAttendanceError(error);
                throw error;
            }
        });

        return this.findEntityById(attendanceId);
    }

    async markAbsent(
        workScheduleId: string,
        authUser: JwtPayload,
        payload: MarkAbsentDto,
        allowedBranchIds?: string[],
    ): Promise<Attendance> {
        this.ensureCanManageAttendance(authUser);
        this.ensureReason(payload.reason);

        const attendanceId = await this.dataSource.transaction(async (manager) => {
            const schedule = await this.findLockedScheduleById(
                manager,
                workScheduleId,
            );
            this.ensureBranchAllowed(schedule.branchId, authUser, allowedBranchIds);
            await this.ensureAttendanceDoesNotExist(manager, schedule.id);

            const snapshot = this.buildScheduleSnapshot(schedule);
            if (new Date() < snapshot.scheduledStartAt) {
                throw new BadRequestException(
                    'Cannot mark absent before the shift starts',
                );
            }

            const attendance = manager.getRepository(Attendance).create({
                workScheduleId: schedule.id,
                employeeId: schedule.employeeId,
                branchId: schedule.branchId,
                positionId: schedule.positionId,
                workShiftId: schedule.workShiftId,
                scheduleDate: schedule.workDate,
                scheduledStartAt: snapshot.scheduledStartAt,
                scheduledEndAt: snapshot.scheduledEndAt,
                breakMinutes: schedule.breakMinutesSnapshot,
                graceMinutes: GRACE_MINUTES,
                status: AttendanceStatus.Absent,
                source: AttendanceSource.MarkAbsent,
                absenceReason: payload.reason,
                note: this.normalizeNote(payload.note),
            });

            try {
                const saved = await manager
                    .getRepository(Attendance)
                    .save(attendance);
                return saved.id;
            } catch (error) {
                this.handleDuplicateAttendanceError(error);
                throw error;
            }
        });

        return this.findEntityById(attendanceId);
    }

    async findAdjustments(
        attendanceId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<AttendanceAdjustment[]> {
        const attendance = await this.findEntityById(attendanceId);
        this.ensureCanViewAttendance(attendance, authUser, allowedBranchIds);

        return this.adjustmentRepository.find({
            where: { attendanceId },
            relations: { adjustedBy: true },
            order: { createdAt: 'DESC' },
        });
    }

    private async findEntityById(id: string): Promise<Attendance> {
        const attendance = await this.attendanceRepository.findOne({
            where: { id },
            relations: {
                workSchedule: true,
                employee: true,
                branch: true,
                position: true,
                workShift: true,
                confirmedBy: true,
            },
        });

        if (!attendance) {
            throw new NotFoundException('Attendance not found');
        }

        return attendance;
    }

    private async findLockedAttendanceById(
        manager: EntityManager,
        id: string,
    ): Promise<Attendance> {
        const attendance = await manager.getRepository(Attendance).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!attendance) {
            throw new NotFoundException('Attendance not found');
        }

        return attendance;
    }

    private async findLockedScheduleById(
        manager: EntityManager,
        id: string,
    ): Promise<WorkSchedule> {
        const schedule = await manager.getRepository(WorkSchedule).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!schedule) {
            throw new NotFoundException('Work schedule not found');
        }

        return schedule;
    }

    private async ensureAttendanceDoesNotExist(
        manager: EntityManager,
        workScheduleId: string,
    ): Promise<void> {
        const attendance = await manager.getRepository(Attendance).findOne({
            where: { workScheduleId },
        });

        if (attendance) {
            throw new ConflictException(
                'Attendance already exists for this work schedule',
            );
        }
    }

    private ensureWithinCheckInWindow(now: Date, scheduledStartAt: Date): void {
        const earliest = this.addMinutes(
            scheduledStartAt,
            -EARLY_CHECK_IN_MINUTES,
        );
        const latest = this.addMinutes(
            scheduledStartAt,
            LATE_CHECK_IN_LIMIT_MINUTES,
        );

        if (now < earliest) {
            throw new BadRequestException(
                'It is too early to check in for this shift',
            );
        }

        if (now > latest) {
            throw new BadRequestException(
                'It is too late to check in for this shift',
            );
        }
    }

    private ensureCheckedInForCheckout(attendance: Attendance): void {
        if (attendance.status !== AttendanceStatus.CheckedIn) {
            throw new BadRequestException(
                'Only checked-in attendance can be checked out',
            );
        }

        if (!attendance.checkInAt) {
            throw new BadRequestException('Attendance has no check-in time');
        }

        if (attendance.checkOutAt) {
            throw new ConflictException('Attendance has already been checked out');
        }
    }

    private ensureCheckoutTimeAllowed(attendance: Attendance, checkOutAt: Date): void {
        if (!attendance.checkInAt) {
            throw new BadRequestException('Attendance has no check-in time');
        }

        if (checkOutAt <= attendance.checkInAt) {
            throw new BadRequestException(
                'Check-out time must be after check-in time',
            );
        }

        const latestCheckout = this.addHours(
            attendance.scheduledEndAt,
            MAX_CHECK_OUT_AFTER_SCHEDULED_END_HOURS,
        );

        if (checkOutAt > latestCheckout) {
            throw new BadRequestException(
                'Check-out time is too late. Please ask a manager to adjust attendance manually',
            );
        }
    }

    private applyCheckout(attendance: Attendance, checkOutAt: Date): void {
        attendance.checkOutAt = checkOutAt;
        attendance.status = AttendanceStatus.PendingConfirmation;
        this.recalculateAttendance(attendance);
    }

    private recalculateAttendance(attendance: Attendance): void {
        attendance.lateMinutes = attendance.checkInAt
            ? this.calculateLateMinutes(
                  attendance.checkInAt,
                  attendance.scheduledStartAt,
                  attendance.graceMinutes,
              )
            : 0;

        if (!attendance.checkInAt || !attendance.checkOutAt) {
            attendance.workedMinutes = 0;
            attendance.earlyLeaveMinutes = 0;
            attendance.overtimeMinutes = 0;
            return;
        }

        attendance.workedMinutes = Math.max(
            0,
            this.diffInCompleteMinutes(attendance.checkOutAt, attendance.checkInAt) -
                attendance.breakMinutes,
        );
        attendance.earlyLeaveMinutes = Math.max(
            0,
            this.diffInCompleteMinutes(
                attendance.scheduledEndAt,
                attendance.checkOutAt,
            ),
        );
        attendance.overtimeMinutes = Math.max(
            0,
            this.diffInCompleteMinutes(
                attendance.checkOutAt,
                attendance.scheduledEndAt,
            ),
        );
    }

    private async createAdjustment(
        manager: EntityManager,
        attendance: Attendance,
        oldSnapshot: ReturnType<typeof this.snapshotAdjustmentValues> | null,
        actionType: AttendanceAdjustmentAction,
        adjustedById: number,
        reason: string,
        note?: string | null,
    ): Promise<void> {
        const adjustment = manager.getRepository(AttendanceAdjustment).create({
            attendanceId: attendance.id,
            adjustedById,
            actionType,
            oldStatus: oldSnapshot?.status ?? null,
            newStatus: attendance.status,
            oldCheckInAt: oldSnapshot?.checkInAt ?? null,
            newCheckInAt: attendance.checkInAt,
            oldCheckOutAt: oldSnapshot?.checkOutAt ?? null,
            newCheckOutAt: attendance.checkOutAt,
            oldWorkedMinutes: oldSnapshot?.workedMinutes ?? null,
            newWorkedMinutes: attendance.workedMinutes,
            oldLateMinutes: oldSnapshot?.lateMinutes ?? null,
            newLateMinutes: attendance.lateMinutes,
            oldEarlyLeaveMinutes: oldSnapshot?.earlyLeaveMinutes ?? null,
            newEarlyLeaveMinutes: attendance.earlyLeaveMinutes,
            oldOvertimeMinutes: oldSnapshot?.overtimeMinutes ?? null,
            newOvertimeMinutes: attendance.overtimeMinutes,
            reason,
            note: this.normalizeNote(note),
        });

        await manager.getRepository(AttendanceAdjustment).save(adjustment);
    }

    private snapshotAdjustmentValues(attendance: Attendance) {
        return {
            status: attendance.status,
            checkInAt: attendance.checkInAt,
            checkOutAt: attendance.checkOutAt,
            workedMinutes: attendance.workedMinutes,
            lateMinutes: attendance.lateMinutes,
            earlyLeaveMinutes: attendance.earlyLeaveMinutes,
            overtimeMinutes: attendance.overtimeMinutes,
        };
    }

    private ensureTimeChanged(
        attendance: Attendance,
        nextCheckInAt: Date | null,
        nextCheckOutAt: Date | null,
    ): void {
        if (
            this.isSameDate(attendance.checkInAt, nextCheckInAt) &&
            this.isSameDate(attendance.checkOutAt, nextCheckOutAt)
        ) {
            throw new BadRequestException('Attendance time was not changed');
        }
    }

    private ensureValidAttendanceTimes(
        checkInAt: Date | null,
        checkOutAt: Date | null,
    ): void {
        if (!checkInAt) {
            throw new BadRequestException('Check-in time is required');
        }

        if (checkOutAt && checkOutAt <= checkInAt) {
            throw new BadRequestException(
                'Check-out time must be after check-in time',
            );
        }
    }

    private ensureCanViewAttendance(
        attendance: Attendance,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager) {
            this.ensureBranchAllowed(attendance.branchId, authUser, allowedBranchIds);
            return;
        }

        if (attendance.employeeId !== authUser.employeeId) {
            throw new ForbiddenException(
                'You can only view your own attendance',
            );
        }
    }

    private ensureCanManageAttendance(authUser: JwtPayload): void {
        if (
            authUser.role !== UserRole.Admin &&
            authUser.role !== UserRole.Manager
        ) {
            throw new ForbiddenException(
                'You do not have permission to manage attendance',
            );
        }
    }

    private ensureBranchAllowed(
        branchId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        if (allowedBranchIds && !allowedBranchIds.includes(branchId)) {
            throw new ForbiddenException(
                'You can only manage attendance in your branches',
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

    private ensureReason(reason: string): void {
        if (!reason?.trim()) {
            throw new BadRequestException('Reason is required');
        }
    }

    private buildScheduleSnapshot(schedule: WorkSchedule): {
        scheduledStartAt: Date;
        scheduledEndAt: Date;
    } {
        const scheduledStartAt = this.toVietnamDateTime(
            schedule.workDate,
            schedule.startTimeSnapshot,
        );
        let scheduledEndAt = this.toVietnamDateTime(
            schedule.workDate,
            schedule.endTimeSnapshot,
        );

        if (scheduledEndAt <= scheduledStartAt) {
            scheduledEndAt = this.addDaysToDate(scheduledEndAt, 1);
        }

        return { scheduledStartAt, scheduledEndAt };
    }

    private async countAdjustments(
        attendanceIds: string[],
    ): Promise<Map<string, number>> {
        if (!attendanceIds.length) {
            return new Map();
        }

        const rows = await this.adjustmentRepository
            .createQueryBuilder('adjustment')
            .select('adjustment.attendanceId', 'attendanceId')
            .addSelect('COUNT(adjustment.id)', 'count')
            .where('adjustment.attendanceId IN (:...attendanceIds)', {
                attendanceIds,
            })
            .groupBy('adjustment.attendanceId')
            .getRawMany<{ attendanceId: string; count: string }>();

        return new Map(
            rows.map((row) => [row.attendanceId, Number(row.count)]),
        );
    }

    private toListItem(
        schedule: ScheduleWithAttendance,
        adjustmentCounts: Map<string, number>,
    ): AttendanceListItem {
        const attendance = schedule.attendance ?? null;
        const snapshot = this.buildScheduleSnapshot(schedule);
        const displayStatus = attendance?.status ?? 'NOT_CHECKED_IN';
        const adjustmentsCount = attendance
            ? adjustmentCounts.get(attendance.id) ?? 0
            : 0;

        return {
            workScheduleId: schedule.id,
            attendanceId: attendance?.id ?? null,
            employeeId: schedule.employeeId,
            branchId: schedule.branchId,
            positionId: schedule.positionId,
            workShiftId: schedule.workShiftId,
            scheduleDate: schedule.workDate,
            scheduledStartAt: attendance?.scheduledStartAt ?? snapshot.scheduledStartAt,
            scheduledEndAt: attendance?.scheduledEndAt ?? snapshot.scheduledEndAt,
            checkInAt: attendance?.checkInAt ?? null,
            checkOutAt: attendance?.checkOutAt ?? null,
            lateMinutes: attendance?.lateMinutes ?? 0,
            earlyLeaveMinutes: attendance?.earlyLeaveMinutes ?? 0,
            overtimeMinutes: attendance?.overtimeMinutes ?? 0,
            workedMinutes: attendance?.workedMinutes ?? 0,
            status: attendance?.status ?? null,
            displayStatus,
            source: attendance?.source ?? null,
            isLate: (attendance?.lateMinutes ?? 0) > 0,
            isEarlyLeave: (attendance?.earlyLeaveMinutes ?? 0) > 0,
            isOvertime: (attendance?.overtimeMinutes ?? 0) > 0,
            hasAdjustment: adjustmentsCount > 0,
            workSchedule: schedule,
        };
    }

    private applyBranchScope(
        queryBuilder: ReturnType<Repository<WorkSchedule>['createQueryBuilder']>,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('workSchedule.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private applyFilters(
        queryBuilder: ReturnType<Repository<WorkSchedule>['createQueryBuilder']>,
        query: AttendanceQueryDto,
    ): void {
        if (query.fromDate) {
            queryBuilder.andWhere('workSchedule.workDate >= :fromDate', {
                fromDate: query.fromDate,
            });
        }

        if (query.toDate) {
            queryBuilder.andWhere('workSchedule.workDate <= :toDate', {
                toDate: query.toDate,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('workSchedule.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.positionId) {
            queryBuilder.andWhere('workSchedule.positionId = :positionId', {
                positionId: query.positionId,
            });
        }

        if (query.employeeId) {
            queryBuilder.andWhere('workSchedule.employeeId = :employeeId', {
                employeeId: query.employeeId,
            });
        }

        if (query.workShiftId) {
            queryBuilder.andWhere('workSchedule.workShiftId = :workShiftId', {
                workShiftId: query.workShiftId,
            });
        }

        if (query.status) {
            queryBuilder.andWhere('attendance.status = :status', {
                status: query.status,
            });
        }

        if (query.isLate !== undefined) {
            queryBuilder.andWhere(
                query.isLate
                    ? 'attendance.lateMinutes > 0'
                    : '(attendance.lateMinutes = 0 OR attendance.id IS NULL)',
            );
        }

        if (query.isEarlyLeave !== undefined) {
            queryBuilder.andWhere(
                query.isEarlyLeave
                    ? 'attendance.earlyLeaveMinutes > 0'
                    : '(attendance.earlyLeaveMinutes = 0 OR attendance.id IS NULL)',
            );
        }

        if (query.isOvertime !== undefined) {
            queryBuilder.andWhere(
                query.isOvertime
                    ? 'attendance.overtimeMinutes > 0'
                    : '(attendance.overtimeMinutes = 0 OR attendance.id IS NULL)',
            );
        }

        if (query.search) {
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('employee.employeeCode LIKE :search')
                        .orWhere('employee.firstName LIKE :search')
                        .orWhere('employee.lastName LIKE :search')
                        .orWhere(
                            "CONCAT(employee.firstName, ' ', employee.lastName) LIKE :search",
                        );
                }),
                { search: `%${query.search}%` },
            );
        }
    }

    private applySort(
        queryBuilder: ReturnType<Repository<WorkSchedule>['createQueryBuilder']>,
        query: AttendanceQueryDto,
    ): void {
        if (query.sortBy === 'status') {
            queryBuilder
                .orderBy('attendance.status', query.sortOrder)
                .addOrderBy('workSchedule.workDate', 'DESC');
            return;
        }

        if (query.sortBy === 'scheduledStartAt') {
            queryBuilder
                .orderBy('workSchedule.workDate', query.sortOrder)
                .addOrderBy('workSchedule.startTimeSnapshot', query.sortOrder);
            return;
        }

        if (query.sortBy === 'scheduleDate') {
            queryBuilder
                .orderBy('workSchedule.workDate', query.sortOrder)
                .addOrderBy('workSchedule.startTimeSnapshot', 'ASC');
            return;
        }

        queryBuilder
            .orderBy('workSchedule.createdAt', query.sortOrder)
            .addOrderBy('workSchedule.workDate', 'DESC');
    }

    private calculateLateMinutes(
        checkInAt: Date,
        scheduledStartAt: Date,
        graceMinutes: number,
    ): number {
        return Math.max(
            0,
            this.diffInCompleteMinutes(checkInAt, scheduledStartAt) -
                graceMinutes,
        );
    }

    private diffInCompleteMinutes(later: Date, earlier: Date): number {
        return Math.floor((later.getTime() - earlier.getTime()) / 60000);
    }

    private parseDate(value: string): Date {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException('Invalid datetime value');
        }

        return date;
    }

    private toVietnamDateTime(date: string, time: string): Date {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute, second = 0] = time.split(':').map(Number);

        return new Date(
            Date.UTC(year, month - 1, day, hour - 7, minute, second, 0),
        );
    }

    private today(): string {
        return new Date(Date.now() + 7 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
    }

    private addDays(date: string, days: number): string {
        const [year, month, day] = date.split('-').map(Number);
        const value = new Date(Date.UTC(year, month - 1, day));
        value.setUTCDate(value.getUTCDate() + days);

        return value.toISOString().slice(0, 10);
    }

    private addMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60000);
    }

    private addHours(date: Date, hours: number): Date {
        return this.addMinutes(date, hours * 60);
    }

    private addDaysToDate(date: Date, days: number): Date {
        return new Date(date.getTime() + days * 24 * 60 * 60000);
    }

    private isSameDate(first: Date | null, second: Date | null): boolean {
        if (!first && !second) {
            return true;
        }

        if (!first || !second) {
            return false;
        }

        return first.getTime() === second.getTime();
    }

    private normalizeNote(value?: string | null): string | null {
        const note = value?.trim();
        return note ? note : null;
    }

    private handleDuplicateAttendanceError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException(
                'Attendance already exists for this work schedule',
            );
        }
    }
}
