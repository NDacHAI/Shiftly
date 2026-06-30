import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { Branch } from '../branch/entities/branch.entity';
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
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
    ) {}

    async create(payload: CreatePositionDto): Promise<Position> {
        const code = payload.code.trim().toUpperCase();
        await this.ensureCodeUnique(code);
        await this.ensureBranchExists(payload.branchId);

        const position = this.positionRepository.create({
            code,
            name: payload.name.trim(),
            branchId: payload.branchId,
            description: this.normalizeDescription(payload.description),
            hourlyRate: this.normalizeHourlyRate(payload.hourlyRate),
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

    async findAll(
        query: PositionQueryDto,
        allowedBranchIds?: string[],
    ): Promise<PaginatedPositions> {
        const queryBuilder = this.positionRepository
            .createQueryBuilder('position')
            .leftJoinAndSelect('position.branch', 'Branch')
            .orderBy(`position.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (allowedBranchIds) {
            if (allowedBranchIds.length === 0) {
                queryBuilder.andWhere('1 = 0');
            } else {
                queryBuilder.andWhere(
                    'position.branchId IN (:...allowedBranchIds)',
                    { allowedBranchIds },
                );
            }
        }

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

        if (query.branchId) {
            queryBuilder.andWhere(
                'position.branchId = :branchId',
                { branchId: query.branchId },
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

    async findOne(
        id: string,
        allowedBranchIds?: string[],
    ): Promise<Position> {
        const position = await this.positionRepository.findOne({
            where: { id },
            relations: { branch: true },
        });

        if (
            !position ||
            (allowedBranchIds && !allowedBranchIds.includes(position.branchId))
        ) {
            throw new NotFoundException('Position not found');
        }

        return position;
    }

    async update(id: string, payload: UpdatePositionDto): Promise<Position> {
        if (
            payload.name === undefined &&
            payload.branchId === undefined &&
            payload.description === undefined &&
            payload.hourlyRate === undefined &&
            payload.status === undefined
        ) {
            throw new BadRequestException('At least one field must be provided');
        }

        const position = await this.findOne(id);

        if (payload.branchId !== undefined) {
            await this.ensureBranchExists(payload.branchId);
            position.branchId = payload.branchId;
        }

        if (payload.name !== undefined) {
            position.name = payload.name.trim();
        }

        if (payload.description !== undefined) {
            position.description = this.normalizeDescription(
                payload.description,
            );
        }

        if (payload.hourlyRate !== undefined) {
            position.hourlyRate = this.normalizeHourlyRate(payload.hourlyRate);
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

    private async ensureBranchExists(id: string): Promise<void> {
        const branch = await this.branchRepository.findOne({
            where: { id },
        });

        if (!branch) {
            throw new BadRequestException('Branch does not exist');
        }
    }

    private normalizeDescription(value?: string | null): string | null {
        const description = value?.trim();
        return description ? description : null;
    }

    private normalizeHourlyRate(value?: number): string {
        return Number(value ?? 0).toFixed(2);
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
