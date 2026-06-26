import { InjectRepository } from "@nestjs/typeorm";
import { WorkShift } from "./entities/work-shift.entity";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Brackets, Repository, QueryFailedError } from "typeorm";
import { CreateWorkShiftDto } from "./dto/create-work-shift.dto";
import { Status } from "./enum/status.enum";
import { UpdateWorkShiftDto } from "./dto/update-work-shift.dto";
import { WorkShiftQueryDto } from "./dto/work-shift-query.dto";


export type WorkShiftResponse = WorkShift & {
    workingDurationMinutes: number;
}

export type PaginatedWorkShifts = {
    data: WorkShiftResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}

@Injectable()
export class WorkShiftService {
    constructor(
        @InjectRepository(WorkShift)
        private readonly workShiftRepository: Repository<WorkShift>,
    ) { }

    async create(payload: CreateWorkShiftDto): Promise<WorkShiftResponse> {
        const code = this.normalizeCode(payload.code)
        const name = this.normalizeName(payload.name)

        await this.ensureCodeUnique(code);
        await this.ensureNameUnique(name);

        this.validateShiftTime(payload.startTime, payload.endTime, payload.breakMinutes);

        const isOvernight = this.calculateIsOvernight(payload.startTime, payload.endTime);

        const workShift = this.workShiftRepository.create({
            code,
            name,
            startTime: payload.startTime,
            endTime: payload.endTime,
            breakMinutes: payload.breakMinutes,
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? Status.ACTIVE,
            isOvernight
        })

        const saveWorkShift = await this.workShiftRepository.save(workShift);
        return this.toResponse(saveWorkShift);

    }

    async update(id: string, payload: UpdateWorkShiftDto): Promise<WorkShiftResponse> {
        if (Object.keys(payload).length === 0) throw new BadRequestException("At least one field must be provided for update")

        const workShift = await this.findEntityById(id)
        if (payload.code !== undefined) {
            const code = this.normalizeCode(payload.code)

            if (code !== workShift.code) {
                await this.ensureCodeUnique(code, id)
                workShift.code = code
            }
        }

        if (payload.name !== undefined) {
            const name = this.normalizeName(payload.name)

            if (name !== workShift.name) {
                await this.ensureNameUnique(name, id)
                workShift.name = name
            }
        }

        if (payload.startTime !== undefined) workShift.startTime = payload.startTime
        if (payload.endTime !== undefined) workShift.endTime = payload.endTime
        if (payload.breakMinutes !== undefined) workShift.breakMinutes = payload.breakMinutes
        if (payload.description !== undefined) workShift.description = this.normalizeDescription(payload.description)
        if (payload.status !== undefined) workShift.status = payload.status

        this.validateShiftTime(workShift.startTime, workShift.endTime, workShift.breakMinutes)

        workShift.isOvernight = this.calculateIsOvernight(workShift.startTime, workShift.endTime)

        const saveWorkShift = await this.workShiftRepository.save(workShift)

        return this.toResponse(saveWorkShift)

    }

    async findOne(id: string): Promise<WorkShiftResponse> {
        const workShift = await this.findEntityById(id)

        return this.toResponse(workShift)

    }

    async findAll(query: WorkShiftQueryDto): Promise<PaginatedWorkShifts> {

        const page = query.page ?? 1
        const limit = query.limit ?? 10

        const queryBuilder = this.workShiftRepository
            .createQueryBuilder('workShift')
            .orderBy('workShift.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        const search = query.search?.trim().toLowerCase();
        if (search) {
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(workShift.code) LIKE :search')
                        .orWhere('LOWER(workShift.name) LIKE :search');
                }),
                { search: `%${search}%` },
            )
        }

        if (query.status !== undefined) {
            queryBuilder.andWhere('workShift.status = :status', {
                status: query.status
            })
        }

        const [data, total] = await queryBuilder.getManyAndCount()
        return {
            data: data.map((workShift) => this.toResponse(workShift)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async remove(id: string): Promise<void> {
        await this.findEntityById(id)
        try {
            await this.workShiftRepository.delete(id)
        } catch (error) {
            if (this.isForeignKeyReferenceError(error)) {
                throw new ConflictException(
                    'Work shift cannot be deleted because related data exists',
                );
            }

            throw error;
        }
    }

    private isForeignKeyReferenceError(error: unknown): boolean {
        if (!(error instanceof QueryFailedError)) {
            return false;
        }

        const driverError = error.driverError as { code?: string };

        return (
            driverError.code === 'ER_ROW_IS_REFERENCED' ||
            driverError.code === 'ER_ROW_IS_REFERENCED_2'
        );
    }

    private async findEntityById(id: string): Promise<WorkShift> {
        const workShift = await this.workShiftRepository.findOne({ where: { id } })

        if (!workShift) throw new NotFoundException('Work shift not found');

        return workShift;

    }

    private async ensureCodeUnique(
        code: string,
        excludeId?: string
    ): Promise<void> {
        const queryBuilder = this.workShiftRepository
            .createQueryBuilder('workShift')
            .where('workShift.code = :code', { code });

        if (excludeId) {
            queryBuilder.andWhere('workShift.id != :excludeId', { excludeId });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Work shift code already exists')
        }
    }

    private async ensureNameUnique(
        name: string,
        excludeId?: string
    ): Promise<void> {
        const queryBuilder = this.workShiftRepository
            .createQueryBuilder('workShift')
            .where('workShift.name = :name', { name });

        if (excludeId) {
            queryBuilder.andWhere('workShift.id != :excludeId', { excludeId });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Work shift name already exists')
        }
    }

    private toMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private calculateTotalShiftMinutes(startTime: string, endTime: string): number {
        const startTimeMinutes = this.toMinutes(startTime);
        const endTimeMinutes = this.toMinutes(endTime);

        if (startTimeMinutes === endTimeMinutes) throw new BadRequestException('The start time must be different from the end time');

        return endTimeMinutes > startTimeMinutes ? endTimeMinutes - startTimeMinutes : 24 * 60 - startTimeMinutes + endTimeMinutes
    }

    private calculateIsOvernight(startTime: string, endTime: string): boolean {
        const startTimeMinutes = this.toMinutes(startTime);
        const endTimeMinutes = this.toMinutes(endTime);

        if (startTimeMinutes === endTimeMinutes) throw new BadRequestException('The start time must be different from the end time');
        return startTimeMinutes > endTimeMinutes
    }

    private calculateWorkingDurationMinutes(
        startTime: string,
        endTime: string,
        breakTime: number,
    ): number {
        const totalShiftMinutes = this.calculateTotalShiftMinutes(
            startTime,
            endTime,
        );

        return totalShiftMinutes - breakTime;
    }

    private validateShiftTime(startTime: string, endTime: string, breakTime: number): void {

        const totalShiftMinutes = this.calculateTotalShiftMinutes(startTime, endTime);

        if (breakTime < 0) throw new BadRequestException('Break time cannot be negative')
        if (breakTime >= totalShiftMinutes) throw new BadRequestException('Break time must be less than the total shift duration')
    }

    private normalizeCode(code: string): string {
        return code.trim().toUpperCase()
    }

    private normalizeName(name: string): string {
        return name.trim()
    }

    private normalizeDescription(description?: string | null): string | null {
        return description?.trim() || null
    }

    private toResponse(workShift: WorkShift): WorkShiftResponse {
        return {
            ...workShift,
            workingDurationMinutes: this.calculateWorkingDurationMinutes(
                workShift.startTime,
                workShift.endTime,
                workShift.breakMinutes,
            )
        }
    }
}
