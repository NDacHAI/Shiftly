import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { Department } from '../department/entities/department.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { PositionQueryDto } from './dto/position-query.dto';
import { UpdatePositionStatusDto } from './dto/update-position-status.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';

export type PaginatedPositions = {
    data: Position[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class PositionService {
    constructor(
        @InjectRepository(Position)
        private readonly positionRepository: Repository<Position>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    async create(payload: CreatePositionDto): Promise<Position> {
        const code = payload.code.trim().toUpperCase();
        await this.ensureCodeUnique(code);
        await this.ensureDepartmentExists(payload.departmentId);

        const position = this.positionRepository.create({
            code,
            name: payload.name.trim(),
            departmentId: payload.departmentId,
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? true,
        });

        try {
            const savedPosition = await this.positionRepository.save(position);
            return this.findOne(savedPosition.id);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(query: PositionQueryDto): Promise<PaginatedPositions> {
        const queryBuilder = this.positionRepository
            .createQueryBuilder('position')
            .leftJoinAndSelect('position.department', 'department')
            .orderBy(`position.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.search) {
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('position.code LIKE :search')
                        .orWhere('position.name LIKE :search');
                }),
                { search: `%${query.search}%` },
            );
        }

        if (query.departmentId) {
            queryBuilder.andWhere(
                'position.departmentId = :departmentId',
                { departmentId: query.departmentId },
            );
        }

        if (query.status !== undefined) {
            queryBuilder.andWhere('position.status = :status', {
                status: query.status,
            });
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

    async findOne(id: string): Promise<Position> {
        const position = await this.positionRepository.findOne({
            where: { id },
            relations: { department: true },
        });

        if (!position) {
            throw new NotFoundException('Position not found');
        }

        return position;
    }

    async update(id: string, payload: UpdatePositionDto): Promise<Position> {
        if (
            payload.name === undefined &&
            payload.departmentId === undefined &&
            payload.description === undefined &&
            payload.status === undefined
        ) {
            throw new BadRequestException('At least one field must be provided');
        }

        const position = await this.findOne(id);

        if (payload.departmentId !== undefined) {
            await this.ensureDepartmentExists(payload.departmentId);
            position.departmentId = payload.departmentId;
        }

        if (payload.name !== undefined) {
            position.name = payload.name.trim();
        }

        if (payload.description !== undefined) {
            position.description = this.normalizeDescription(
                payload.description,
            );
        }

        if (payload.status !== undefined) {
            position.status = payload.status;
        }

        await this.positionRepository.save(position);
        return this.findOne(id);
    }

    async updateStatus(
        id: string,
        payload: UpdatePositionStatusDto,
    ): Promise<Position> {
        const position = await this.findOne(id);
        position.status = payload.status;
        await this.positionRepository.save(position);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const position = await this.findOne(id);

        try {
            await this.positionRepository.delete(id);
        } catch (error) {
            if (this.isForeignKeyReferenceError(error)) {
                position.status = false;
                await this.positionRepository.save(position);
                return;
            }

            throw error;
        }
    }

    private async ensureCodeUnique(code: string): Promise<void> {
        const duplicate = await this.positionRepository
            .createQueryBuilder('position')
            .withDeleted()
            .where('position.code = :code', { code })
            .getOne();

        if (duplicate) {
            throw new ConflictException('Position code already exists');
        }
    }

    private async ensureDepartmentExists(id: string): Promise<void> {
        const department = await this.departmentRepository.findOne({
            where: { id },
        });

        if (!department) {
            throw new BadRequestException('Department does not exist');
        }
    }

    private normalizeDescription(value?: string | null): string | null {
        const description = value?.trim();
        return description ? description : null;
    }

    private handleDuplicateError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('Position code already exists');
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
}
