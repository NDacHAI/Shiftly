import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { Branch } from '@/module/branch/entities/branch.entity';
import { EmployeeStatus } from '@/module/employee/entities/employee-status.enum';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { WorkScheduleSource } from '@/module/work-schedule/entities/work-schedule-source.enum';
import { Status } from '@/module/work-shift/enum/status.enum';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { CancelShiftRequestDto } from './dto/cancel-shift-request.dto';
import { CreateShiftRequestDto } from './dto/create-shift-request.dto';
import { ReviewShiftRequestDto } from './dto/review-shift-request.dto';
import { ShiftRequestQueryDto } from './dto/shift-request-query.dto';
import { ShiftRequestStatus } from './entities/shift-request-status.enum';
import { ShiftRequest } from './entities/shift-request.entity';

type ShiftSnapshot = {
    shiftCodeSnapshot: string;
    shiftNameSnapshot: string;
    startTimeSnapshot: string;
    endTimeSnapshot: string;
    breakMinutesSnapshot: number;
};

type ValidatedShiftRequestInput = {
    employee: Employee;
    branch: Branch;
    position: Position;
    workShift: WorkShift;
    snapshot: ShiftSnapshot;
};

export type PaginatedShiftRequests = {
    data: ShiftRequest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class ShiftRequestService {
    constructor(
        @InjectRepository(ShiftRequest)
        private readonly shiftRequestRepository: Repository<ShiftRequest>,
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
        private readonly dataSource: DataSource,
    ) {}

    async createForEmployee(
        authUser: JwtPayload,
        payload: CreateShiftRequestDto,
    ): Promise<ShiftRequest> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const { employee, branch, position, workShift } =
            await this.validateRequestInput(authUser.employeeId, payload);

        await this.ensureNoSameDaySchedule(employee.id, payload.workDate);
        await this.ensureNoDuplicateActiveRequest(
            employee.id,
            branch.id,
            position.id,
            workShift.id,
            payload.workDate,
        );

        const request = this.shiftRequestRepository.create({
            employeeId: employee.id,
            branchId: branch.id,
            positionId: position.id,
            workShiftId: workShift.id,
            workDate: payload.workDate,
            status: ShiftRequestStatus.Pending,
            employeeNote: this.normalizeNote(payload.employeeNote),
        });

        try {
            const savedRequest = await this.shiftRequestRepository.save(request);
            return this.findOne(savedRequest.id, authUser);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findMyRequests(
        authUser: JwtPayload,
        query: ShiftRequestQueryDto,
    ): Promise<PaginatedShiftRequests> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        return this.findAll({ ...query, employeeId: authUser.employeeId }, authUser);
    }

    async findAll(
        query: ShiftRequestQueryDto,
        authUser?: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedShiftRequests> {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        const queryBuilder = this.shiftRequestRepository
            .createQueryBuilder('shiftRequest')
            .leftJoinAndSelect('shiftRequest.employee', 'employee')
            .leftJoinAndSelect('shiftRequest.branch', 'branch')
            .leftJoinAndSelect('shiftRequest.position', 'position')
            .leftJoinAndSelect('shiftRequest.workShift', 'workShift')
            .leftJoinAndSelect('shiftRequest.reviewedBy', 'reviewedBy')
            .leftJoinAndSelect('shiftRequest.cancelledBy', 'cancelledBy')
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
    ): Promise<ShiftRequest> {
        const request = await this.findEntityById(id);
        this.ensureCanViewRequest(request, authUser, allowedBranchIds);

        return request;
    }

    async approve(
        id: string,
        authUser: JwtPayload,
        payload: ReviewShiftRequestDto,
        allowedBranchIds?: string[],
    ): Promise<ShiftRequest> {
        this.ensureCanProcessAsManagerOrAdmin(authUser);

        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            this.ensurePending(request);

            const { employee, branch, position, workShift, snapshot } =
                await this.validateRequestInput(
                    request.employeeId,
                    {
                        branchId: request.branchId,
                        positionId: request.positionId,
                        workShiftId: request.workShiftId,
                        workDate: request.workDate,
                    },
                    manager,
                );

            await this.ensureNoSameDaySchedule(
                employee.id,
                request.workDate,
                manager,
            );

            const schedule = manager.getRepository(WorkSchedule).create({
                employeeId: employee.id,
                branchId: branch.id,
                positionId: position.id,
                workShiftId: workShift.id,
                workDate: request.workDate,
                ...snapshot,
                note: request.employeeNote,
                source: WorkScheduleSource.Request,
                shiftRequestId: request.id,
            });

            try {
                await manager.getRepository(WorkSchedule).save(schedule);
            } catch (error) {
                this.handleDuplicateError(error);
                throw error;
            }

            request.status = ShiftRequestStatus.Approved;
            request.reviewedById = authUser.sub;
            request.reviewedAt = new Date();
            request.managerNote = this.normalizeNote(payload.managerNote);

            await manager.getRepository(ShiftRequest).save(request);
            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async reject(
        id: string,
        authUser: JwtPayload,
        payload: ReviewShiftRequestDto,
        allowedBranchIds?: string[],
    ): Promise<ShiftRequest> {
        this.ensureCanProcessAsManagerOrAdmin(authUser);

        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);
            this.ensureBranchAllowed(request.branchId, authUser, allowedBranchIds);
            this.ensurePending(request);

            request.status = ShiftRequestStatus.Rejected;
            request.reviewedById = authUser.sub;
            request.reviewedAt = new Date();
            request.managerNote = this.normalizeNote(payload.managerNote);

            await manager.getRepository(ShiftRequest).save(request);
            return request.id;
        });

        return this.findOne(requestId, authUser, allowedBranchIds);
    }

    async cancel(
        id: string,
        authUser: JwtPayload,
        payload: CancelShiftRequestDto,
    ): Promise<ShiftRequest> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const requestId = await this.dataSource.transaction(async (manager) => {
            const request = await this.findLockedEntityById(manager, id);

            if (request.employeeId !== authUser.employeeId) {
                throw new ForbiddenException(
                    'You can only cancel your own shift request',
                );
            }

            this.ensurePending(request);

            request.status = ShiftRequestStatus.Cancelled;
            request.cancelledById = authUser.sub;
            request.cancelledAt = new Date();

            await manager.getRepository(ShiftRequest).save(request);
            return request.id;
        });

        void payload;

        return this.findOne(requestId, authUser);
    }

    private async validateRequestInput(
        employeeId: string,
        payload: Pick<
            CreateShiftRequestDto,
            'branchId' | 'positionId' | 'workShiftId' | 'workDate'
        >,
        manager?: EntityManager,
    ): Promise<ValidatedShiftRequestInput> {
        this.ensureWorkDateIsNotPast(payload.workDate);

        const [
            employee,
            branch,
            position,
            workShift,
        ] = await Promise.all([
            this.findActiveEmployee(employeeId, manager),
            this.findActiveBranch(payload.branchId, manager),
            this.findActivePosition(payload.positionId, manager),
            this.findActiveWorkShift(payload.workShiftId, manager),
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

    private async findActiveEmployee(
        id: string,
        manager?: EntityManager,
    ): Promise<Employee> {
        const repository = this.getRepository(Employee, manager);
        const employee = await repository.findOne({
            where: { id },
            relations: { branches: true, positions: true },
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

    private async findActivePosition(
        id: string,
        manager?: EntityManager,
    ): Promise<Position> {
        const position = await this.getRepository(Position, manager).findOne({
            where: { id },
            relations: { branch: true },
        });

        if (!position || !position.status) {
            throw new BadRequestException('Position is not active');
        }

        return position;
    }

    private async findActiveWorkShift(
        id: string,
        manager?: EntityManager,
    ): Promise<WorkShift> {
        const workShift = await this.getRepository(WorkShift, manager).findOne({
            where: { id },
        });

        if (!workShift || workShift.status !== Status.ACTIVE) {
            throw new BadRequestException('Work shift is not active');
        }

        return workShift;
    }

    private async findEntityById(id: string): Promise<ShiftRequest> {
        const request = await this.shiftRequestRepository.findOne({
            where: { id },
            relations: {
                employee: true,
                branch: true,
                position: true,
                workShift: true,
                reviewedBy: true,
                cancelledBy: true,
            },
        });

        if (!request) {
            throw new NotFoundException('Shift request not found');
        }

        return request;
    }

    private async findLockedEntityById(
        manager: EntityManager,
        id: string,
    ): Promise<ShiftRequest> {
        const request = await manager.getRepository(ShiftRequest).findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
        });

        if (!request) {
            throw new NotFoundException('Shift request not found');
        }

        return request;
    }

    private ensureCanViewRequest(
        request: ShiftRequest,
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
                'You can only view your own shift request',
            );
        }
    }

    private ensureCanProcessAsManagerOrAdmin(
        authUser: JwtPayload,
    ): void {
        if (
            authUser.role !== UserRole.Admin &&
            authUser.role !== UserRole.Manager
        ) {
            throw new ForbiddenException(
                'You do not have permission to process shift requests',
            );
        }
    }

    private ensureBranchAllowed(
        branchId: string,
        authUser?: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        this.ensureBranchScopeForRole(authUser, allowedBranchIds);

        if (allowedBranchIds && !allowedBranchIds.includes(branchId)) {
            throw new ForbiddenException(
                'You can only manage shift requests in your branches',
            );
        }
    }

    private ensureBranchScopeForRole(
        authUser?: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser?.role === UserRole.Manager && !allowedBranchIds) {
            throw new ForbiddenException(
                'Managed branch scope is required for managers',
            );
        }
    }

    private ensurePending(request: ShiftRequest): void {
        if (request.status !== ShiftRequestStatus.Pending) {
            throw new BadRequestException(
                'Only pending shift requests can be processed',
            );
        }
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

    private ensureWorkDateIsNotPast(workDate: string): void {
        if (workDate < this.today()) {
            throw new BadRequestException('Work date cannot be in the past');
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

    private async ensureNoSameDaySchedule(
        employeeId: string,
        workDate: string,
        manager?: EntityManager,
    ): Promise<void> {
        const repository = this.getRepository(WorkSchedule, manager);
        const duplicate = await repository.findOne({
            where: { employeeId, workDate },
        });

        if (duplicate) {
            throw new ConflictException(
                'Employee already has a schedule on this work date',
            );
        }
    }

    private async ensureNoDuplicateActiveRequest(
        employeeId: string,
        branchId: string,
        positionId: string,
        workShiftId: string,
        workDate: string,
        manager?: EntityManager,
    ): Promise<void> {
        const repository = this.getRepository(ShiftRequest, manager);
        const duplicate = await repository
            .createQueryBuilder('shiftRequest')
            .where('shiftRequest.employeeId = :employeeId', { employeeId })
            .andWhere('shiftRequest.branchId = :branchId', { branchId })
            .andWhere('shiftRequest.positionId = :positionId', { positionId })
            .andWhere('shiftRequest.workShiftId = :workShiftId', {
                workShiftId,
            })
            .andWhere('shiftRequest.workDate = :workDate', { workDate })
            .andWhere('shiftRequest.status IN (:...statuses)', {
                statuses: [
                    ShiftRequestStatus.Pending,
                    ShiftRequestStatus.Approved,
                ],
            })
            .getOne();

        if (duplicate) {
            throw new ConflictException(
                'Employee already has an active request for this shift',
            );
        }
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

    private applyBranchScope(
        queryBuilder: ReturnType<Repository<ShiftRequest>['createQueryBuilder']>,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('shiftRequest.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private applyFilters(
        queryBuilder: ReturnType<Repository<ShiftRequest>['createQueryBuilder']>,
        query: ShiftRequestQueryDto,
    ): void {
        if (query.status !== undefined) {
            queryBuilder.andWhere('shiftRequest.status = :status', {
                status: query.status,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('shiftRequest.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.employeeId) {
            queryBuilder.andWhere('shiftRequest.employeeId = :employeeId', {
                employeeId: query.employeeId,
            });
        }

        if (query.positionId) {
            queryBuilder.andWhere('shiftRequest.positionId = :positionId', {
                positionId: query.positionId,
            });
        }

        if (query.workShiftId) {
            queryBuilder.andWhere('shiftRequest.workShiftId = :workShiftId', {
                workShiftId: query.workShiftId,
            });
        }

        if (query.workDate) {
            queryBuilder.andWhere('shiftRequest.workDate = :workDate', {
                workDate: query.workDate,
            });
        }

        if (query.fromDate) {
            queryBuilder.andWhere('shiftRequest.workDate >= :fromDate', {
                fromDate: query.fromDate,
            });
        }

        if (query.toDate) {
            queryBuilder.andWhere('shiftRequest.workDate <= :toDate', {
                toDate: query.toDate,
            });
        }
    }

    private applySort(
        queryBuilder: ReturnType<Repository<ShiftRequest>['createQueryBuilder']>,
        query: ShiftRequestQueryDto,
    ): void {
        queryBuilder
            .orderBy(`shiftRequest.${query.sortBy}`, query.sortOrder)
            .addOrderBy('shiftRequest.createdAt', 'DESC');
    }

    private getRepository<Entity extends object>(
        entity: new () => Entity,
        manager?: EntityManager,
    ): Repository<Entity> {
        if (manager) {
            return manager.getRepository(entity);
        }

        if (entity === ShiftRequest) {
            return this.shiftRequestRepository as unknown as Repository<Entity>;
        }

        if (entity === WorkSchedule) {
            return this.workScheduleRepository as unknown as Repository<Entity>;
        }

        if (entity === Employee) {
            return this.employeeRepository as unknown as Repository<Entity>;
        }

        if (entity === Branch) {
            return this.branchRepository as unknown as Repository<Entity>;
        }

        if (entity === Position) {
            return this.positionRepository as unknown as Repository<Entity>;
        }

        if (entity === WorkShift) {
            return this.workShiftRepository as unknown as Repository<Entity>;
        }

        throw new Error('Unsupported repository entity');
    }

    private normalizeNote(value?: string | null): string | null {
        const note = value?.trim();
        return note ? note : null;
    }

    private today(): string {
        return new Date(Date.now() + 7 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
    }

    private handleDuplicateError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException(
                'Employee already has a schedule or request on this work date',
            );
        }
    }
}
