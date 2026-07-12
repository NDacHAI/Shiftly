import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreateRewardPenaltyCatalogDto } from './dto/create-reward-penalty-catalog.dto';
import { RewardPenaltyCatalogQueryDto } from './dto/reward-penalty-catalog-query.dto';
import { UpdateRewardPenaltyCatalogDto } from './dto/update-reward-penalty-catalog.dto';
import { RewardPenaltyCatalog } from './entities/reward-penalty-catalog.entity';
import { RewardPenaltyStatus } from './entities/reward-penalty-status.enum';

export type PaginatedRewardPenaltyCatalogs = {
    data: RewardPenaltyCatalog[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class RewardPenaltyCatalogService {
    constructor(
        @InjectRepository(RewardPenaltyCatalog)
        private readonly catalogRepository: Repository<RewardPenaltyCatalog>,
    ) {}

    async create(
        payload: CreateRewardPenaltyCatalogDto,
    ): Promise<RewardPenaltyCatalog> {
        const code = this.normalizeCode(payload.code);

        await this.ensureCodeUnique(code);

        const catalog = this.catalogRepository.create({
            code,
            name: this.normalizeName(payload.name),
            category: payload.category,
            amount: this.normalizeAmount(payload.amount),
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? RewardPenaltyStatus.Active,
        });

        try {
            return await this.catalogRepository.save(catalog);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(
        query: RewardPenaltyCatalogQueryDto,
    ): Promise<PaginatedRewardPenaltyCatalogs> {
        const queryBuilder = this.catalogRepository
            .createQueryBuilder('catalog')
            .orderBy(`catalog.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.category !== undefined) {
            queryBuilder.andWhere('catalog.category = :category', {
                category: query.category,
            });
        }

        if (query.status !== undefined) {
            queryBuilder.andWhere('catalog.status = :status', {
                status: query.status,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(catalog.code) LIKE :search')
                        .orWhere('LOWER(catalog.name) LIKE :search');
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

    async findOne(id: string): Promise<RewardPenaltyCatalog> {
        return this.findEntityById(id);
    }

    async update(
        id: string,
        payload: UpdateRewardPenaltyCatalogDto,
    ): Promise<RewardPenaltyCatalog> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const catalog = await this.findEntityById(id);

        if (payload.name !== undefined) {
            catalog.name = this.normalizeName(payload.name);
        }

        if (payload.category !== undefined) {
            catalog.category = payload.category;
        }

        if (payload.amount !== undefined) {
            catalog.amount = this.normalizeAmount(payload.amount);
        }

        if (payload.description !== undefined) {
            catalog.description = this.normalizeDescription(payload.description);
        }

        if (payload.status !== undefined) {
            catalog.status = payload.status;
        }

        try {
            return await this.catalogRepository.save(catalog);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        await this.findEntityById(id);

        try {
            await this.catalogRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async findEntityById(id: string): Promise<RewardPenaltyCatalog> {
        const catalog = await this.catalogRepository.findOne({ where: { id } });

        if (!catalog) {
            throw new NotFoundException('Reward penalty catalog not found');
        }

        return catalog;
    }

    private async ensureCodeUnique(
        code: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder = this.catalogRepository
            .createQueryBuilder('catalog')
            .where('catalog.code = :code', { code });

        if (excludedId) {
            queryBuilder.andWhere('catalog.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Reward penalty catalog code already exists');
        }
    }

    private normalizeCode(value: string): string {
        return value.trim().toUpperCase();
    }

    private normalizeName(value: string): string {
        return value.trim();
    }

    private normalizeAmount(value: number): string {
        return value.toFixed(2);
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
            throw new ConflictException('Reward penalty catalog already exists');
        }
    }

    private handleDeleteError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (
            driverError.code === 'ER_ROW_IS_REFERENCED' ||
            driverError.code === 'ER_ROW_IS_REFERENCED_2'
        ) {
            throw new ConflictException(
                'Reward penalty catalog cannot be deleted because related data exists',
            );
        }
    }
}
