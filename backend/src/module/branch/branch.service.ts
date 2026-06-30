import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchQueryDto } from './dto/branch-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';

export type PaginatedBranches = {
    data: Branch[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class BranchService {
    constructor(
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
    ) {}

    async create(payload: CreateBranchDto): Promise<Branch> {
        const code = payload.code.trim().toUpperCase();
        const name = payload.name.trim();

        await this.ensureUnique(code, name);

        const branch = this.branchRepository.create({
            code,
            name,
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? true,
        });

        try {
            return await this.branchRepository.save(branch);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(
        query: BranchQueryDto,
        allowedBranchIds?: string[],
    ): Promise<PaginatedBranches> {
        const queryBuilder = this.branchRepository
            .createQueryBuilder('branch')
            .orderBy(`branch.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (allowedBranchIds) {
            if (allowedBranchIds.length === 0) {
                queryBuilder.andWhere('1 = 0');
            } else {
                queryBuilder.andWhere('branch.id IN (:...allowedBranchIds)', {
                    allowedBranchIds,
                });
            }
        }

        if (query.search) {
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('branch.code LIKE :search')
                        .orWhere('branch.name LIKE :search');
                }),
                { search: `%${query.search}%` },
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

    async findOne(id: string, allowedBranchIds?: string[]): Promise<Branch> {
        if (allowedBranchIds && !allowedBranchIds.includes(id)) {
            throw new NotFoundException('Branch not found');
        }

        return this.findEntityById(id);
    }

    async update(
        id: string,
        payload: UpdateBranchDto,
    ): Promise<Branch> {
        if (
            payload.code === undefined &&
            payload.name === undefined &&
            payload.description === undefined &&
            payload.status === undefined
        ) {
            throw new BadRequestException('At least one field must be provided');
        }

        const branch = await this.findEntityById(id);
        const code = payload.code?.trim().toUpperCase();
        const name = payload.name?.trim();
        const changedCode =
            code !== undefined && code !== branch.code ? code : undefined;
        const changedName =
            name !== undefined && name !== branch.name ? name : undefined;

        if (changedCode || changedName) {
            await this.ensureUnique(changedCode, changedName, id);
        }

        if (code !== undefined) {
            branch.code = code;
        }

        if (name !== undefined) {
            branch.name = name;
        }

        if (payload.description !== undefined) {
            branch.description = this.normalizeDescription(
                payload.description,
            );
        }

        if (payload.status !== undefined) {
            branch.status = payload.status;
        }

        try {
            return await this.branchRepository.save(branch);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        await this.findEntityById(id);

        try {
            await this.branchRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async findEntityById(id: string): Promise<Branch> {
        const branch = await this.branchRepository.findOne({
            where: { id },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    private async ensureUnique(
        code?: string,
        name?: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder =
            this.branchRepository.createQueryBuilder('branch');

        queryBuilder.withDeleted().where(
            new Brackets((builder) => {
                if (code) {
                    builder.where('branch.code = :code', { code });
                }

                if (name) {
                    const method = code ? 'orWhere' : 'where';
                    builder[method]('branch.name = :name', { name });
                }
            }),
        );

        if (excludedId) {
            queryBuilder.andWhere('branch.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (!duplicate) {
            return;
        }

        if (code && duplicate.code === code) {
            throw new ConflictException('Branch code already exists');
        }

        if (name && duplicate.name === name) {
            throw new ConflictException('Branch name already exists');
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

        const driverError = error.driverError as {
            code?: string;
            sqlMessage?: string;
        };

        if (driverError.code !== 'ER_DUP_ENTRY') {
            return;
        }

        if (driverError.sqlMessage?.includes('code')) {
            throw new ConflictException('Branch code already exists');
        }

        throw new ConflictException('Branch name already exists');
    }

    private handleDeleteError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as {
            code?: string;
        };

        if (
            driverError.code === 'ER_ROW_IS_REFERENCED' ||
            driverError.code === 'ER_ROW_IS_REFERENCED_2'
        ) {
            throw new ConflictException(
                'Branch cannot be deleted because related data exists',
            );
        }
    }
}
