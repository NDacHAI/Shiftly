import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { AttendanceStatus } from '@/module/attendance/entities/attendance-status.enum';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { Branch } from '@/module/branch/entities/branch.entity';
import { EmployeeStatus } from '@/module/employee/entities/employee-status.enum';
import { Employee } from '@/module/employee/entities/employee.entity';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { CancelLeaveRequestDto } from './dto/cancel-leave-request.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestAssignment } from './entities/leave-request-assignment.entity';
import { LeaveRequestMode } from './entities/leave-request-mode.enum';
import { LeaveRequestStatus } from './entities/leave-request-status.enum';
import { LeaveRequest } from './entities/leave-request.entity';

type LeaveInterval = {
    start: number;
    end: number;
};

type ValidatedLeaveInput = {
    employee: Employee;
    branch: Branch;
    interval: LeaveInterval | null;
    schedules: WorkSchedule[];
    normalized: {
        startDate: string | null;
        endDate: string | null;
        isFullDay: boolean | null;
        startTime: string | null;
        endTime: string | null;
    };
};

export type PaginatedLeaveRequests = {
    data: LeaveRequest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const ACTIVE_LEAVE_STATUSES = [
    LeaveRequestStatus.Pending,
    LeaveRequestStatus.Approved,
];

@Injectable()
export class LeaveRequestService {
    constructor(
        @InjectRepository(LeaveRequest)
        private readonly leaveRequestRepository: Repository<LeaveRequest>,
        @InjectRepository(LeaveRequestAssignment)
        private readonly leaveRequestAssignmentRepository: Repository<LeaveRequestAssignment>,
        @InjectRepository(WorkSchedule)
        private readonly workScheduleRepository: Repository<WorkSchedule>,
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
        private readonly dataSource: DataSource,
    ) {}

    async createForEmployee(
        authUser: JwtPayload,
        payload: CreateLeaveRequestDto,
    ): Promise<LeaveRequest> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        return this.create(authUser, {
            ...payload,
            employeeId: authUser.employeeId,
        });
    }

    async create(
        authUser: JwtPayload,
        payload: CreateLeaveRequestDto,
        allowedBranchIds?: string[],
    ): Promise<LeaveRequest> {
        const employeeId = this.resolveTargetEmployeeId(authUser, payload);

        const requestId = await this.dataSource.transaction(async (manager) => {
            const input = await this.validateLeaveInput(
                employeeId,
                payload,
                authUser,
                allowedBranchIds,
                manager,
            );

            await this.ensureNoActiveOverlap(
                employeeId,
                input.interval,
                input.schedules,
                manager,
            );

            const request = manager.getRepository(LeaveRequest).create({
                code: await this.generateCode(manager),
                employeeId: input.employee.id,
                branchId: input.branch.id,
                requestMode: payload.requestMode,
                ...input.normalized,
                reason: this.requireReason(payload.reason),
                status: LeaveRequestStatus.Pending,
                createdByUserId: authUser.sub,
            });
            const savedRequest = await manager
                .getRepository(LeaveRequest)
                .save(request);

            await this.replaceAssignments(
                manager,
                savedRequest.id,
                input.schedules,
            );

            return savedRequest.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async findMyRequests(
        authUser: JwtPayload,
        query: LeaveRequestQueryDto,
    ): Promise<PaginatedLeaveRequests> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        return this.findAll({ ...query, employeeId: authUser.employeeId }, authUser);
    }

    async findAll(
        query: LeaveRequestQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedLeaveRequests> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const queryBuilder = this.leaveRequestRepository
            .createQueryBuilder('leaveRequest')
            .leftJoinAndSelect('leaveRequest.employee', 'employee')
            .leftJoinAndSelect('leaveRequest.branch', 'branch')
            .leftJoinAndSelect('leaveRequest.createdByUser', 'createdByUser')
            .leftJoinAndSelect('leaveRequest.reviewedByUser', 'reviewedByUser')
            .leftJoinAndSelect('leaveRequest.cancelledByUser', 'cancelledByUser')
            .leftJoinAndSelect('leaveRequest.assignments', 'assignments')
            .leftJoinAndSelect('assignments.workSchedule', 'workSchedule')
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        this.applyBranchScope(queryBuilder, allowedBranchIds);
        this.applyFilters(queryBuilder, query);
        this.applySort(queryBuilder, query);

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
    ): Promise<LeaveRequest> {
        const request = await this.findEntityById(id);
        this.ensureCanViewRequest(request, authUser, allowedBranchIds);

        return request;
    }

    async updatePending(
        id: string,
        authUser: JwtPayload,
        payload: UpdateLeaveRequestDto,
        allowedBranchIds?: string[],
    ): Promise<LeaveRequest> {
        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureCanModifyPendingRequest(request, authUser, allowedBranchIds);
            this.ensurePending(request);

            const nextPayload = this.mergeUpdatePayload(request, payload);
            const input = await this.validateLeaveInput(
                request.employeeId,
                nextPayload,
                authUser,
                allowedBranchIds,
                manager,
            );

            await this.ensureNoActiveOverlap(
                request.employeeId,
                input.interval,
                input.schedules,
                manager,
                request.id,
            );

            request.branchId = input.branch.id;
            request.requestMode = nextPayload.requestMode;
            request.startDate = input.normalized.startDate;
            request.endDate = input.normalized.endDate;
            request.isFullDay = input.normalized.isFullDay;
            request.startTime = input.normalized.startTime;
            request.endTime = input.normalized.endTime;
            request.reason = this.requireReason(nextPayload.reason);

            await manager.getRepository(LeaveRequest).save(request);
            await this.replaceAssignments(manager, request.id, input.schedules);

            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async approve(
        id: string,
        authUser: JwtPayload,
        payload: ReviewLeaveRequestDto,
        allowedBranchIds?: string[],
    ): Promise<LeaveRequest> {
        this.ensureCanProcessAsManagerOrAdmin(authUser);

        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            this.ensurePending(request);
            this.ensureNotOwnEmployeeRequest(request, authUser);
            this.requireReason(payload.reviewNote);

            const schedules = await this.findSchedulesForRequest(
                manager,
                request.id,
            );
            await this.ensureNoConfirmedAttendance(manager, schedules);

            request.status = LeaveRequestStatus.Approved;
            request.reviewedByUserId = authUser.sub;
            request.reviewedAt = new Date();
            request.reviewNote = payload.reviewNote.trim();

            await manager.getRepository(LeaveRequest).save(request);
            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async reject(
        id: string,
        authUser: JwtPayload,
        payload: ReviewLeaveRequestDto,
        allowedBranchIds?: string[],
    ): Promise<LeaveRequest> {
        this.ensureCanProcessAsManagerOrAdmin(authUser);

        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            this.ensurePending(request);
            this.ensureNotOwnEmployeeRequest(request, authUser);
            this.requireReason(payload.reviewNote);

            request.status = LeaveRequestStatus.Rejected;
            request.reviewedByUserId = authUser.sub;
            request.reviewedAt = new Date();
            request.reviewNote = payload.reviewNote.trim();

            await manager.getRepository(LeaveRequest).save(request);
            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async cancel(
        id: string,
        authUser: JwtPayload,
        payload: CancelLeaveRequestDto,
        allowedBranchIds?: string[],
    ): Promise<LeaveRequest> {
        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureCanCancelRequest(request, authUser, allowedBranchIds);
            this.ensureCancellable(request, authUser);
            this.requireReason(payload.cancelReason);

            request.status = LeaveRequestStatus.Cancelled;
            request.cancelledByUserId = authUser.sub;
            request.cancelledAt = new Date();
            request.cancelReason = payload.cancelReason.trim();

            await manager.getRepository(LeaveRequest).save(request);
            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    private resolveTargetEmployeeId(
        authUser: JwtPayload,
        payload: CreateLeaveRequestDto,
    ): string {
        if (authUser.role === UserRole.User) {
            if (!authUser.employeeId) {
                throw new ForbiddenException('Employee account is not linked');
            }

            return authUser.employeeId;
        }

        if (!payload.employeeId) {
            throw new BadRequestException('Employee is required');
        }

        return payload.employeeId;
    }

    private async validateLeaveInput(
        employeeId: string,
        payload: CreateLeaveRequestDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
        manager?: EntityManager,
    ): Promise<ValidatedLeaveInput> {
        this.requireReason(payload.reason);

        const [employee, branch] = await Promise.all([
            this.findActiveEmployee(employeeId, manager),
            this.findActiveBranch(payload.branchId, manager),
        ]);

        this.ensureEmployeeCanUseBranch(employee, branch.id);
        this.ensureBranchAllowed(branch.id, authUser, allowedBranchIds);

        if (payload.requestMode === LeaveRequestMode.Shift) {
            const schedules = await this.findSelectedSchedules(
                employee.id,
                branch.id,
                payload.workScheduleIds ?? [],
                manager,
            );
            this.ensureAdminForPastLeave(authUser, this.buildSchedulesInterval(schedules));

            return {
                employee,
                branch,
                interval: null,
                schedules,
                normalized: {
                    startDate: null,
                    endDate: null,
                    isFullDay: null,
                    startTime: null,
                    endTime: null,
                },
            };
        }

        const normalized = this.normalizeDateTimePayload(payload);
        const interval = this.buildDateTimeInterval(normalized);
        this.ensureAdminForPastLeave(authUser, interval);

        const schedules = await this.findAffectedSchedules(
            employee.id,
            branch.id,
            interval,
            manager,
        );

        return { employee, branch, interval, schedules, normalized };
    }

    private async findActiveEmployee(
        id: string,
        manager?: EntityManager,
    ): Promise<Employee> {
        const employee = await this.getRepository(Employee, manager).findOne({
            where: { id },
            relations: { branches: true },
        });

        if (!employee || employee.status !== EmployeeStatus.Active) {
            throw new BadRequestException('Employee is not active');
        }

        return employee;
    }

    private async findActiveBranch(
        id: string,
        manager?: EntityManager,
    ): Promise<Branch> {
        const branch = await this.getRepository(Branch, manager).findOne({
            where: { id },
        });

        if (!branch || !branch.status) {
            throw new BadRequestException('Branch is not active');
        }

        return branch;
    }

    private async findSelectedSchedules(
        employeeId: string,
        branchId: string,
        workScheduleIds: string[],
        manager?: EntityManager,
    ): Promise<WorkSchedule[]> {
        const uniqueIds = [...new Set(workScheduleIds)];

        if (uniqueIds.length === 0) {
            throw new BadRequestException('At least one work schedule is required');
        }

        const schedules = await this.getRepository(WorkSchedule, manager).find({
            where: { id: In(uniqueIds) },
        });

        if (schedules.length !== uniqueIds.length) {
            throw new BadRequestException('Some work schedules were not found');
        }

        for (const schedule of schedules) {
            if (schedule.employeeId !== employeeId) {
                throw new BadRequestException(
                    'Work schedule does not belong to this employee',
                );
            }

            if (schedule.branchId !== branchId) {
                throw new BadRequestException(
                    'Work schedule does not belong to this branch',
                );
            }
        }

        return schedules;
    }

    private async findAffectedSchedules(
        employeeId: string,
        branchId: string,
        interval: LeaveInterval,
        manager?: EntityManager,
    ): Promise<WorkSchedule[]> {
        const fromDate = this.formatDate(new Date(interval.start - 24 * 60 * 60000));
        const toDate = this.formatDate(new Date(interval.end + 24 * 60 * 60000));

        const schedules = await this.getRepository(WorkSchedule, manager)
            .createQueryBuilder('workSchedule')
            .where('workSchedule.employeeId = :employeeId', { employeeId })
            .andWhere('workSchedule.branchId = :branchId', { branchId })
            .andWhere('workSchedule.workDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            })
            .getMany();

        return schedules.filter((schedule) =>
            this.intervalsOverlap(interval, this.buildScheduleInterval(schedule)),
        );
    }

    private async ensureNoActiveOverlap(
        employeeId: string,
        interval: LeaveInterval | null,
        schedules: WorkSchedule[],
        manager: EntityManager,
        excludeRequestId?: string,
    ): Promise<void> {
        const activeRequests = await manager
            .getRepository(LeaveRequest)
            .createQueryBuilder('leaveRequest')
            .leftJoinAndSelect('leaveRequest.assignments', 'assignments')
            .leftJoinAndSelect('assignments.workSchedule', 'workSchedule')
            .where('leaveRequest.employeeId = :employeeId', { employeeId })
            .andWhere('leaveRequest.status IN (:...statuses)', {
                statuses: ACTIVE_LEAVE_STATUSES,
            })
            .getMany();
        const scheduleIds = new Set(schedules.map((schedule) => schedule.id));
        const candidateIntervals =
            interval ? [interval] : schedules.map((schedule) => this.buildScheduleInterval(schedule));

        for (const request of activeRequests) {
            if (request.id === excludeRequestId) {
                continue;
            }

            if (
                request.assignments.some((assignment) =>
                    scheduleIds.has(assignment.workScheduleId),
                )
            ) {
                throw new ConflictException(
                    'Employee already has an active leave request for this shift',
                );
            }

            const existingIntervals = this.buildExistingRequestIntervals(request);
            const hasOverlap = candidateIntervals.some((candidate) =>
                existingIntervals.some((existing) =>
                    this.intervalsOverlap(candidate, existing),
                ),
            );

            if (hasOverlap) {
                throw new ConflictException(
                    'Employee already has an active leave request in this time range',
                );
            }
        }
    }

    private buildExistingRequestIntervals(request: LeaveRequest): LeaveInterval[] {
        if (request.requestMode === LeaveRequestMode.DateTime) {
            return [this.buildDateTimeInterval({
                startDate: request.startDate,
                endDate: request.endDate,
                isFullDay: request.isFullDay,
                startTime: request.startTime,
                endTime: request.endTime,
            })];
        }

        return request.assignments
            .map((assignment) => assignment.workSchedule)
            .filter((schedule): schedule is WorkSchedule => Boolean(schedule))
            .map((schedule) => this.buildScheduleInterval(schedule));
    }

    private async ensureNoConfirmedAttendance(
        manager: EntityManager,
        schedules: WorkSchedule[],
    ): Promise<void> {
        if (schedules.length === 0) {
            return;
        }

        const confirmed = await manager.getRepository(Attendance).findOne({
            where: {
                workScheduleId: In(schedules.map((schedule) => schedule.id)),
                status: AttendanceStatus.Confirmed,
            },
        });

        if (confirmed) {
            throw new ConflictException(
                'Cannot approve leave request because attendance has been confirmed',
            );
        }
    }

    private async replaceAssignments(
        manager: EntityManager,
        leaveRequestId: string,
        schedules: WorkSchedule[],
    ): Promise<void> {
        await manager.getRepository(LeaveRequestAssignment).delete({
            leaveRequestId,
        });

        if (schedules.length === 0) {
            return;
        }

        const assignments = schedules.map((schedule) =>
            manager.getRepository(LeaveRequestAssignment).create({
                leaveRequestId,
                workScheduleId: schedule.id,
            }),
        );

        await manager.getRepository(LeaveRequestAssignment).save(assignments);
    }

    private async findSchedulesForRequest(
        manager: EntityManager,
        leaveRequestId: string,
    ): Promise<WorkSchedule[]> {
        const assignments = await manager
            .getRepository(LeaveRequestAssignment)
            .find({
                where: { leaveRequestId },
                relations: { workSchedule: true },
            });

        return assignments.map((assignment) => assignment.workSchedule);
    }

    private async findEntityById(id: string): Promise<LeaveRequest> {
        const request = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: {
                employee: true,
                branch: true,
                createdByUser: true,
                reviewedByUser: true,
                cancelledByUser: true,
                assignments: { workSchedule: true },
            },
        });

        if (!request) {
            throw new NotFoundException('Leave request not found');
        }

        return request;
    }

    private async findLockedEntityById(
        manager: EntityManager,
        id: string,
    ): Promise<LeaveRequest> {
        const request = await manager.getRepository(LeaveRequest).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!request) {
            throw new NotFoundException('Leave request not found');
        }

        return request;
    }

    private ensureCanViewRequest(
        request: LeaveRequest,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager) {
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            return;
        }

        if (request.employeeId !== authUser.employeeId) {
            throw new ForbiddenException(
                'You can only view your own leave request',
            );
        }
    }

    private ensureCanModifyPendingRequest(
        request: LeaveRequest,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager) {
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            return;
        }

        if (request.employeeId !== authUser.employeeId) {
            throw new ForbiddenException(
                'You can only update your own leave request',
            );
        }
    }

    private ensureCanCancelRequest(
        request: LeaveRequest,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager) {
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            return;
        }

        if (request.employeeId !== authUser.employeeId) {
            throw new ForbiddenException(
                'You can only cancel your own leave request',
            );
        }
    }

    private ensureCanProcessAsManagerOrAdmin(authUser: JwtPayload): void {
        if (
            authUser.role !== UserRole.Admin &&
            authUser.role !== UserRole.Manager
        ) {
            throw new ForbiddenException(
                'You do not have permission to process leave requests',
            );
        }
    }

    private ensureNotOwnEmployeeRequest(
        request: LeaveRequest,
        authUser: JwtPayload,
    ): void {
        if (authUser.employeeId && request.employeeId === authUser.employeeId) {
            throw new ForbiddenException(
                'You cannot process your own leave request',
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
                'You can only manage leave requests in your branches',
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

    private ensurePending(request: LeaveRequest): void {
        if (request.status !== LeaveRequestStatus.Pending) {
            throw new BadRequestException(
                'Only pending leave requests can be changed',
            );
        }
    }

    private ensureCancellable(
        request: LeaveRequest,
        authUser: JwtPayload,
    ): void {
        if (authUser.role === UserRole.User) {
            this.ensurePending(request);
            return;
        }

        if (
            request.status !== LeaveRequestStatus.Pending &&
            request.status !== LeaveRequestStatus.Approved
        ) {
            throw new BadRequestException(
                'Only pending or approved leave requests can be cancelled',
            );
        }
    }

    private ensureEmployeeCanUseBranch(employee: Employee, branchId: string): void {
        const canUseBranch = employee.branches.some(
            (branch) => branch.id === branchId,
        );

        if (!canUseBranch) {
            throw new BadRequestException(
                'Employee is not assigned to this branch',
            );
        }
    }

    private ensureAdminForPastLeave(
        authUser: JwtPayload,
        interval: LeaveInterval,
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (interval.start < Date.now()) {
            throw new BadRequestException(
                'Only admin can create leave requests in the past',
            );
        }
    }

    private normalizeDateTimePayload(
        payload: CreateLeaveRequestDto,
    ): ValidatedLeaveInput['normalized'] {
        if (!payload.startDate || !payload.endDate) {
            throw new BadRequestException('Start date and end date are required');
        }

        if (payload.endDate < payload.startDate) {
            throw new BadRequestException('End date cannot be before start date');
        }

        const isFullDay = payload.isFullDay ?? true;

        if (!isFullDay && payload.startDate !== payload.endDate) {
            throw new BadRequestException(
                'Hourly leave must be in the same date',
            );
        }

        if (!isFullDay && (!payload.startTime || !payload.endTime)) {
            throw new BadRequestException(
                'Start time and end time are required for hourly leave',
            );
        }

        return {
            startDate: payload.startDate,
            endDate: payload.endDate,
            isFullDay,
            startTime: isFullDay ? null : this.normalizeTime(payload.startTime),
            endTime: isFullDay ? null : this.normalizeTime(payload.endTime),
        };
    }

    private buildDateTimeInterval(
        payload: ValidatedLeaveInput['normalized'],
    ): LeaveInterval {
        if (!payload.startDate || !payload.endDate) {
            throw new BadRequestException('Leave time range is required');
        }

        if (payload.isFullDay) {
            return {
                start: this.toTimestamp(payload.startDate, '00:00:00'),
                end: this.toTimestamp(this.addDays(payload.endDate, 1), '00:00:00'),
            };
        }

        if (!payload.startTime || !payload.endTime) {
            throw new BadRequestException('Leave time range is required');
        }

        const start = this.toTimestamp(payload.startDate, payload.startTime);
        const end = this.toTimestamp(payload.endDate, payload.endTime);

        if (end <= start) {
            throw new BadRequestException('End time must be after start time');
        }

        return { start, end };
    }

    private buildSchedulesInterval(schedules: WorkSchedule[]): LeaveInterval {
        const intervals = schedules.map((schedule) =>
            this.buildScheduleInterval(schedule),
        );

        return {
            start: Math.min(...intervals.map((interval) => interval.start)),
            end: Math.max(...intervals.map((interval) => interval.end)),
        };
    }

    private buildScheduleInterval(schedule: WorkSchedule): LeaveInterval {
        const start = this.toTimestamp(
            schedule.workDate,
            schedule.startTimeSnapshot,
        );
        let end = this.toTimestamp(schedule.workDate, schedule.endTimeSnapshot);

        if (end <= start) {
            end += 24 * 60 * 60 * 1000;
        }

        return { start, end };
    }

    private intervalsOverlap(first: LeaveInterval, second: LeaveInterval): boolean {
        return first.start < second.end && second.start < first.end;
    }

    private mergeUpdatePayload(
        request: LeaveRequest,
        payload: UpdateLeaveRequestDto,
    ): CreateLeaveRequestDto {
        return {
            employeeId: request.employeeId,
            branchId: payload.branchId ?? request.branchId,
            requestMode: payload.requestMode ?? request.requestMode,
            startDate: payload.startDate ?? request.startDate ?? undefined,
            endDate: payload.endDate ?? request.endDate ?? undefined,
            isFullDay: payload.isFullDay ?? request.isFullDay ?? undefined,
            startTime: payload.startTime ?? request.startTime ?? undefined,
            endTime: payload.endTime ?? request.endTime ?? undefined,
            workScheduleIds: payload.workScheduleIds,
            reason: payload.reason ?? request.reason,
        };
    }

    private applyBranchScope(
        queryBuilder: ReturnType<Repository<LeaveRequest>['createQueryBuilder']>,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('leaveRequest.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private applyFilters(
        queryBuilder: ReturnType<Repository<LeaveRequest>['createQueryBuilder']>,
        query: LeaveRequestQueryDto,
    ): void {
        if (query.status) {
            queryBuilder.andWhere('leaveRequest.status = :status', {
                status: query.status,
            });
        }

        if (query.requestMode) {
            queryBuilder.andWhere('leaveRequest.requestMode = :requestMode', {
                requestMode: query.requestMode,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('leaveRequest.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.employeeId) {
            queryBuilder.andWhere('leaveRequest.employeeId = :employeeId', {
                employeeId: query.employeeId,
            });
        }

        if (query.fromDate) {
            queryBuilder.andWhere(
                '(leaveRequest.endDate IS NULL OR leaveRequest.endDate >= :fromDate)',
                { fromDate: query.fromDate },
            );
        }

        if (query.toDate) {
            queryBuilder.andWhere(
                '(leaveRequest.startDate IS NULL OR leaveRequest.startDate <= :toDate)',
                { toDate: query.toDate },
            );
        }
    }

    private applySort(
        queryBuilder: ReturnType<Repository<LeaveRequest>['createQueryBuilder']>,
        query: LeaveRequestQueryDto,
    ): void {
        queryBuilder
            .orderBy(`leaveRequest.${query.sortBy}`, query.sortOrder)
            .addOrderBy('leaveRequest.createdAt', 'DESC');
    }

    private async generateCode(manager: EntityManager): Promise<string> {
        const prefix = `LR-${this.today().replace(/-/g, '')}`;
        const count = await manager
            .getRepository(LeaveRequest)
            .createQueryBuilder('leaveRequest')
            .where('leaveRequest.code LIKE :prefix', { prefix: `${prefix}%` })
            .getCount();

        return `${prefix}-${String(count + 1).padStart(4, '0')}`;
    }

    private getRepository<Entity extends object>(
        entity: new () => Entity,
        manager?: EntityManager,
    ): Repository<Entity> {
        if (manager) {
            return manager.getRepository(entity);
        }

        if (entity === LeaveRequest) {
            return this.leaveRequestRepository as unknown as Repository<Entity>;
        }

        if (entity === LeaveRequestAssignment) {
            return this.leaveRequestAssignmentRepository as unknown as Repository<Entity>;
        }

        if (entity === WorkSchedule) {
            return this.workScheduleRepository as unknown as Repository<Entity>;
        }

        if (entity === Attendance) {
            return this.attendanceRepository as unknown as Repository<Entity>;
        }

        if (entity === Employee) {
            return this.employeeRepository as unknown as Repository<Entity>;
        }

        if (entity === Branch) {
            return this.branchRepository as unknown as Repository<Entity>;
        }

        throw new Error('Unsupported repository entity');
    }

    private requireReason(reason?: string | null): string {
        const normalized = reason?.trim();

        if (!normalized) {
            throw new BadRequestException('Reason is required');
        }

        return normalized;
    }

    private normalizeTime(value?: string | null): string {
        if (!value) {
            throw new BadRequestException('Time is required');
        }

        return value.length === 5 ? `${value}:00` : value;
    }

    private toTimestamp(date: string, time: string): number {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute, second = 0] = time.split(':').map(Number);

        return Date.UTC(year, month - 1, day, hour - 7, minute, second, 0);
    }

    private addDays(date: string, days: number): string {
        const [year, month, day] = date.split('-').map(Number);
        const value = new Date(Date.UTC(year, month - 1, day));
        value.setUTCDate(value.getUTCDate() + days);

        return value.toISOString().slice(0, 10);
    }

    private formatDate(date: Date): string {
        return new Date(date.getTime() + 7 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
    }

    private today(): string {
        return this.formatDate(new Date());
    }
}
