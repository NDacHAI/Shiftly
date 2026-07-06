import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { Branch } from '@/module/branch/entities/branch.entity';
import { EmployeeStatus } from '@/module/employee/entities/employee-status.enum';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { Status } from '@/module/work-shift/enum/status.enum';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import {
    BulkCreateWorkSchedulesDto,
    WorkScheduleConflictStrategy,
} from './dto/bulk-create-work-schedules.dto';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDto } from './dto/work-schedule-query.dto';
import { WorkSchedule } from './entities/work-schedule.entity';

type ShiftSnapshot = {
    shiftCodeSnapshot: string;
    shiftNameSnapshot: string;
    startTimeSnapshot: string;
    endTimeSnapshot: string;
    breakMinutesSnapshot: number;
};

type ScheduleInterval = {
    start: number;
    end: number;
};

export type WorkScheduleResponse = WorkSchedule & {
    workingDurationMinutes: number;
    isOvernight: boolean;
};

export type PaginatedWorkSchedules = {
    data: WorkScheduleResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type BulkWorkScheduleResult = {
    createdCount: number;
    skippedCount: number;
    failedCount: number;
    replacedCount: number;
    items: Array<{
        employeeId: string;
        workDate: string;
        status: 'CREATED' | 'SKIPPED' | 'FAILED' | 'REPLACED';
        reason?: string;
        scheduleId?: string;
    }>;
};

@Injectable()
export class WorkScheduleService {
    constructor(
        @InjectRepository(WorkSchedule)
        private readonly workScheduleRepository: Repository<WorkSchedule>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
        @InjectRepository(Position)
        private readonly positionRepository: Repository<Position>,
        @InjectRepository(WorkShift)
        private readonly workShiftRepository: Repository<WorkShift>,
    ) {}

    async create(
        payload: CreateWorkScheduleDto,
        allowedBranchIds?: string[],
    ): Promise<WorkScheduleResponse> {
        await this.ensureBranchAllowed(payload.branchId, allowedBranchIds);

        const { employee, branch, position, workShift, snapshot } =
            await this.validateScheduleInput(payload);

        await this.ensureNoSameDaySchedule(
            employee.id,
            payload.workDate,
        );
        await this.ensureNoOverlap(employee.id, payload.workDate, snapshot);

        const schedule = this.workScheduleRepository.create({
            employeeId: employee.id,
            branchId: branch.id,
            positionId: position.id,
            workShiftId: workShift.id,
            workDate: payload.workDate,
            ...snapshot,
            note: this.normalizeNote(payload.note),
        });

        try {
            const savedSchedule =
                await this.workScheduleRepository.save(schedule);
            return this.findOne(savedSchedule.id, allowedBranchIds);
        } catch (error) {
            this.handleDuplicateScheduleError(error);
            throw error;
        }
    }

    async findAll(
        query: WorkScheduleQueryDto,
        allowedBranchIds?: string[],
    ): Promise<PaginatedWorkSchedules> {
        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('workSchedule')
            .leftJoinAndSelect('workSchedule.employee', 'employee')
            .leftJoinAndSelect('workSchedule.branch', 'branch')
            .leftJoinAndSelect('workSchedule.position', 'position')
            .leftJoinAndSelect('workSchedule.workShift', 'workShift')
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        this.applyBranchScope(queryBuilder, allowedBranchIds);
        this.applyFilters(queryBuilder, query);
        this.applySort(queryBuilder, query);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data: data.map((schedule) => this.toResponse(schedule)),
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
        allowedBranchIds?: string[],
    ): Promise<WorkScheduleResponse> {
        const schedule = await this.workScheduleRepository.findOne({
            where: { id },
            relations: {
                employee: true,
                branch: true,
                position: true,
                workShift: true,
            },
        });

        if (!schedule) {
            throw new NotFoundException('Work schedule not found');
        }

        await this.ensureBranchAllowed(schedule.branchId, allowedBranchIds);

        return this.toResponse(schedule);
    }

    async findMySchedules(
        employeeId: string | null,
        query: WorkScheduleQueryDto,
    ): Promise<PaginatedWorkSchedules> {
        if (!employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        return this.findAll({ ...query, employeeId });
    }

    async update(
        id: string,
        payload: UpdateWorkScheduleDto,
        allowedBranchIds?: string[],
    ): Promise<WorkScheduleResponse> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const schedule = await this.findEntityById(id);
        await this.ensureBranchAllowed(schedule.branchId, allowedBranchIds);
        await this.ensureScheduleHasNoLockedRelatedData(schedule.id);

        const nextBranchId = payload.branchId ?? schedule.branchId;
        await this.ensureBranchAllowed(nextBranchId, allowedBranchIds);

        const nextPayload: CreateWorkScheduleDto = {
            employeeId: schedule.employeeId,
            branchId: nextBranchId,
            positionId: payload.positionId ?? schedule.positionId,
            workShiftId: payload.workShiftId ?? schedule.workShiftId,
            workDate: payload.workDate ?? schedule.workDate,
            note: payload.note ?? schedule.note ?? undefined,
        };

        const { employee, branch, position, workShift, snapshot } =
            await this.validateScheduleInput(nextPayload);
        const nextSnapshot =
            payload.workShiftId !== undefined
                ? snapshot
                : {
                      shiftCodeSnapshot: schedule.shiftCodeSnapshot,
                      shiftNameSnapshot: schedule.shiftNameSnapshot,
                      startTimeSnapshot: schedule.startTimeSnapshot,
                      endTimeSnapshot: schedule.endTimeSnapshot,
                      breakMinutesSnapshot: schedule.breakMinutesSnapshot,
                  };

        await this.ensureNoSameDaySchedule(
            employee.id,
            nextPayload.workDate,
            schedule.id,
        );
        await this.ensureNoOverlap(
            employee.id,
            nextPayload.workDate,
            nextSnapshot,
            schedule.id,
        );

        schedule.branchId = branch.id;
        schedule.positionId = position.id;
        schedule.workShiftId = workShift.id;
        schedule.workDate = nextPayload.workDate;
        schedule.shiftCodeSnapshot = nextSnapshot.shiftCodeSnapshot;
        schedule.shiftNameSnapshot = nextSnapshot.shiftNameSnapshot;
        schedule.startTimeSnapshot = nextSnapshot.startTimeSnapshot;
        schedule.endTimeSnapshot = nextSnapshot.endTimeSnapshot;
        schedule.breakMinutesSnapshot = nextSnapshot.breakMinutesSnapshot;

        if (payload.note !== undefined) {
            schedule.note = this.normalizeNote(payload.note);
        }

        try {
            await this.workScheduleRepository.save(schedule);
            return this.findOne(schedule.id, allowedBranchIds);
        } catch (error) {
            this.handleDuplicateScheduleError(error);
            throw error;
        }
    }

    async remove(id: string, allowedBranchIds?: string[]): Promise<void> {
        const schedule = await this.findEntityById(id);
        await this.ensureBranchAllowed(schedule.branchId, allowedBranchIds);
        await this.ensureScheduleHasNoLockedRelatedData(schedule.id);

        await this.workScheduleRepository.delete(schedule.id);
    }

    async bulkCreate(
        payload: BulkCreateWorkSchedulesDto,
        allowedBranchIds?: string[],
    ): Promise<BulkWorkScheduleResult> {
        await this.ensureBranchAllowed(payload.branchId, allowedBranchIds);

        const dates = this.expandDateRange(
            payload.startDate,
            payload.endDate,
            payload.weekdays,
        );

        const result: BulkWorkScheduleResult = {
            createdCount: 0,
            skippedCount: 0,
            failedCount: 0,
            replacedCount: 0,
            items: [],
        };

        for (const employeeId of [...new Set(payload.employeeIds)]) {
            for (const workDate of dates) {
                const existing = await this.workScheduleRepository.findOne({
                    where: { employeeId, workDate },
                });

                if (
                    existing &&
                    payload.conflictStrategy ===
                        WorkScheduleConflictStrategy.SKIP
                ) {
                    result.skippedCount += 1;
                    result.items.push({
                        employeeId,
                        workDate,
                        status: 'SKIPPED',
                        reason: 'Schedule already exists',
                        scheduleId: existing.id,
                    });
                    continue;
                }

                try {
                    let status: 'CREATED' | 'REPLACED' = 'CREATED';

                    const schedulePayload = {
                        employeeId,
                        branchId: payload.branchId,
                        positionId: payload.positionId,
                        workShiftId: payload.workShiftId,
                        workDate,
                        note: payload.note,
                    };
                    const created = existing
                        ? await this.update(
                              existing.id,
                              {
                                  branchId: schedulePayload.branchId,
                                  positionId: schedulePayload.positionId,
                                  workShiftId: schedulePayload.workShiftId,
                                  workDate: schedulePayload.workDate,
                                  note: schedulePayload.note,
                              },
                              allowedBranchIds,
                          )
                        : await this.create(
                              {
                            employeeId,
                            branchId: schedulePayload.branchId,
                            positionId: schedulePayload.positionId,
                            workShiftId: schedulePayload.workShiftId,
                            workDate,
                            note: schedulePayload.note,
                              },
                              allowedBranchIds,
                          );

                    if (existing) {
                        status = 'REPLACED';
                    }

                    if (status === 'REPLACED') {
                        result.replacedCount += 1;
                    } else {
                        result.createdCount += 1;
                    }

                    result.items.push({
                        employeeId,
                        workDate,
                        status,
                        scheduleId: created.id,
                    });
                } catch (error) {
                    result.failedCount += 1;
                    result.items.push({
                        employeeId,
                        workDate,
                        status: 'FAILED',
                        reason: this.getErrorMessage(error),
                    });
                }
            }
        }

        return result;
    }

    private async validateScheduleInput(payload: CreateWorkScheduleDto) {
        const [employee, branch, position, workShift] = await Promise.all([
            this.findActiveEmployee(payload.employeeId),
            this.findActiveBranch(payload.branchId),
            this.findActivePosition(payload.positionId),
            this.findActiveWorkShift(payload.workShiftId),
        ]);

        this.ensureEmployeeCanUseBranch(employee, branch.id);
        this.ensureEmployeeCanUsePosition(employee, position.id);
        this.ensurePositionBelongsToBranch(position, branch.id);
        this.ensureWorkDateAfterHireDate(employee, payload.workDate);

        return {
            employee,
            branch,
            position,
            workShift,
            snapshot: this.buildShiftSnapshot(workShift),
        };
    }

    private async findActiveEmployee(id: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: { branches: true, positions: true },
        });

        if (!employee || employee.status !== EmployeeStatus.Active) {
            throw new BadRequestException('Employee is not active');
        }

        return employee;
    }

    private async findActiveBranch(id: string): Promise<Branch> {
        const branch = await this.branchRepository.findOne({ where: { id } });

        if (!branch || !branch.status) {
            throw new BadRequestException('Branch is not active');
        }

        return branch;
    }

    private async findActivePosition(id: string): Promise<Position> {
        const position = await this.positionRepository.findOne({
            where: { id },
            relations: { branch: true },
        });

        if (!position || !position.status) {
            throw new BadRequestException('Position is not active');
        }

        return position;
    }

    private async findActiveWorkShift(id: string): Promise<WorkShift> {
        const workShift = await this.workShiftRepository.findOne({
            where: { id },
        });

        if (!workShift || workShift.status !== Status.ACTIVE) {
            throw new BadRequestException('Work shift is not active');
        }

        return workShift;
    }

    private async findEntityById(id: string): Promise<WorkSchedule> {
        const schedule = await this.workScheduleRepository.findOne({
            where: { id },
        });

        if (!schedule) {
            throw new NotFoundException('Work schedule not found');
        }

        return schedule;
    }

    private ensureEmployeeCanUseBranch(
        employee: Employee,
        branchId: string,
    ): void {
        const canUseBranch = employee.branches.some(
            (branch) => branch.id === branchId,
        );

        if (!canUseBranch) {
            throw new BadRequestException(
                'Employee is not assigned to this branch',
            );
        }
    }

    private ensureEmployeeCanUsePosition(
        employee: Employee,
        positionId: string,
    ): void {
        const canUsePosition = employee.positions.some(
            (position) => position.id === positionId,
        );

        if (!canUsePosition) {
            throw new BadRequestException(
                'Employee is not assigned to this position',
            );
        }
    }

    private ensurePositionBelongsToBranch(
        position: Position,
        branchId: string,
    ): void {
        if (position.branchId !== branchId) {
            throw new BadRequestException(
                'Position does not belong to this branch',
            );
        }
    }

    private ensureWorkDateAfterHireDate(
        employee: Employee,
        workDate: string,
    ): void {
        if (workDate < employee.hireDate) {
            throw new BadRequestException(
                'Work date cannot be before employee hire date',
            );
        }
    }

    private async ensureBranchAllowed(
        branchId: string,
        allowedBranchIds?: string[],
    ): Promise<void> {
        if (allowedBranchIds && !allowedBranchIds.includes(branchId)) {
            throw new ForbiddenException(
                'You can only manage schedules in your branches',
            );
        }
    }

    private async ensureNoSameDaySchedule(
        employeeId: string,
        workDate: string,
        excludeId?: string,
    ): Promise<void> {
        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('workSchedule')
            .where('workSchedule.employeeId = :employeeId', { employeeId })
            .andWhere('workSchedule.workDate = :workDate', { workDate });

        if (excludeId) {
            queryBuilder.andWhere('workSchedule.id != :excludeId', {
                excludeId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException(
                'Employee already has a schedule on this work date',
            );
        }
    }

    private async ensureNoOverlap(
        employeeId: string,
        workDate: string,
        snapshot: ShiftSnapshot,
        excludeId?: string,
    ): Promise<void> {
        const candidate = this.toInterval(
            workDate,
            snapshot.startTimeSnapshot,
            snapshot.endTimeSnapshot,
        );
        const fromDate = this.addDays(workDate, -1);
        const toDate = this.addDays(workDate, 1);

        const queryBuilder = this.workScheduleRepository
            .createQueryBuilder('workSchedule')
            .where('workSchedule.employeeId = :employeeId', { employeeId })
            .andWhere('workSchedule.workDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            });

        if (excludeId) {
            queryBuilder.andWhere('workSchedule.id != :excludeId', {
                excludeId,
            });
        }

        const nearbySchedules = await queryBuilder.getMany();
        const hasOverlap = nearbySchedules.some((schedule) => {
            const existing = this.toInterval(
                schedule.workDate,
                schedule.startTimeSnapshot,
                schedule.endTimeSnapshot,
            );

            return existing.start < candidate.end && candidate.start < existing.end;
        });

        if (hasOverlap) {
            throw new ConflictException(
                'Work schedule overlaps with another schedule',
            );
        }
    }

    private async ensureScheduleHasNoLockedRelatedData(
        _scheduleId: string,
    ): Promise<void> {
        // Attendance and Leave Request modules will extend this guard later.
    }

    private buildShiftSnapshot(workShift: WorkShift): ShiftSnapshot {
        return {
            shiftCodeSnapshot: workShift.code,
            shiftNameSnapshot: workShift.name,
            startTimeSnapshot: workShift.startTime,
            endTimeSnapshot: workShift.endTime,
            breakMinutesSnapshot: workShift.breakMinutes,
        };
    }

    private toResponse(schedule: WorkSchedule): WorkScheduleResponse {
        return {
            ...schedule,
            workingDurationMinutes: this.calculateWorkingDurationMinutes(
                schedule.startTimeSnapshot,
                schedule.endTimeSnapshot,
                schedule.breakMinutesSnapshot,
            ),
            isOvernight: this.isOvernight(
                schedule.startTimeSnapshot,
                schedule.endTimeSnapshot,
            ),
        };
    }

    private calculateWorkingDurationMinutes(
        startTime: string,
        endTime: string,
        breakMinutes: number,
    ): number {
        return (
            this.calculateTotalShiftMinutes(startTime, endTime) - breakMinutes
        );
    }

    private calculateTotalShiftMinutes(
        startTime: string,
        endTime: string,
    ): number {
        const startMinutes = this.toMinutes(startTime);
        const endMinutes = this.toMinutes(endTime);

        return endMinutes > startMinutes
            ? endMinutes - startMinutes
            : 24 * 60 - startMinutes + endMinutes;
    }

    private isOvernight(startTime: string, endTime: string): boolean {
        return this.toMinutes(startTime) > this.toMinutes(endTime);
    }

    private toMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private toInterval(
        workDate: string,
        startTime: string,
        endTime: string,
    ): ScheduleInterval {
        const start = this.toTimestamp(workDate, startTime);
        let end = this.toTimestamp(workDate, endTime);

        if (end <= start) {
            end += 24 * 60 * 60 * 1000;
        }

        return { start, end };
    }

    private toTimestamp(date: string, time: string): number {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes, seconds = 0] = time.split(':').map(Number);

        return Date.UTC(year, month - 1, day, hours, minutes, seconds);
    }

    private addDays(date: string, days: number): string {
        const [year, month, day] = date.split('-').map(Number);
        const value = new Date(Date.UTC(year, month - 1, day));
        value.setUTCDate(value.getUTCDate() + days);

        return value.toISOString().slice(0, 10);
    }

    private expandDateRange(
        startDate: string,
        endDate: string,
        weekdays?: number[],
    ): string[] {
        if (endDate < startDate) {
            throw new BadRequestException('End date cannot be before start date');
        }

        const dates: string[] = [];
        let currentDate = startDate;

        while (currentDate <= endDate) {
            const weekday = this.getIsoWeekday(currentDate);

            if (!weekdays?.length || weekdays.includes(weekday)) {
                dates.push(currentDate);
            }

            currentDate = this.addDays(currentDate, 1);
        }

        return dates;
    }

    private getIsoWeekday(date: string): number {
        const [year, month, day] = date.split('-').map(Number);
        const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

        return weekday === 0 ? 7 : weekday;
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
        query: WorkScheduleQueryDto,
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
        query: WorkScheduleQueryDto,
    ): void {
        if (query.sortBy === 'employeeCode') {
            queryBuilder
                .orderBy('employee.employeeCode', query.sortOrder)
                .addOrderBy('workSchedule.workDate', 'DESC');
            return;
        }

        queryBuilder
            .orderBy(`workSchedule.${query.sortBy}`, query.sortOrder)
            .addOrderBy('employee.employeeCode', 'ASC');
    }

    private normalizeNote(value?: string | null): string | null {
        const note = value?.trim();
        return note ? note : null;
    }

    private handleDuplicateScheduleError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException(
                'Employee already has a schedule on this work date',
            );
        }
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return 'Could not create work schedule';
    }
}
