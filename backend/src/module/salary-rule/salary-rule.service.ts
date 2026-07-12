import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Brackets,
    DataSource,
    EntityManager,
    QueryFailedError,
    Repository,
} from 'typeorm';
import { seedDefaultSalaryRules } from '@/database/seeders/salary-rules.seeder';
import { CreateSalaryRuleDto } from './dto/create-salary-rule.dto';
import { SalaryRuleQueryDto } from './dto/salary-rule-query.dto';
import { UpdateSalaryRuleDto } from './dto/update-salary-rule.dto';
import { SalaryRuleStatus } from './entities/salary-rule-status.enum';
import { SalaryRuleVersion } from './entities/salary-rule-version.entity';
import { SalaryRule } from './entities/salary-rule.entity';
import { isDefaultSalaryRuleCode } from './salary-rule.constants';

export type SalaryRuleResponse = {
    id: string;
    code: string;
    name: string;
    status: SalaryRuleStatus;
    isDefault: boolean;
    currentMultiplier: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type PaginatedSalaryRules = {
    data: SalaryRuleResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class SalaryRuleService implements OnModuleInit {
    private readonly logger = new Logger(SalaryRuleService.name);

    constructor(
        @InjectRepository(SalaryRule)
        private readonly salaryRuleRepository: Repository<SalaryRule>,
        @InjectRepository(SalaryRuleVersion)
        private readonly versionRepository: Repository<SalaryRuleVersion>,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.seedDefaultRules();
    }

    async seedDefaultRules(): Promise<void> {
        await this.dataSource.transaction(seedDefaultSalaryRules);
        this.logger.log('Default salary rules are ready');
    }

    async create(payload: CreateSalaryRuleDto): Promise<SalaryRuleResponse> {
        const code = this.normalizeCode(payload.code);
        const name = this.normalizeName(payload.name);

        if (isDefaultSalaryRuleCode(code)) {
            throw new ConflictException('Default salary rule code already exists');
        }

        await this.ensureCodeUnique(code);
        const effectiveFrom = this.today();

        const salaryRule = await this.dataSource.transaction(async (manager) => {
            const ruleRepository = manager.getRepository(SalaryRule);
            const versionRepository = manager.getRepository(SalaryRuleVersion);

            const rule = await ruleRepository.save(
                ruleRepository.create({
                    code,
                    name,
                    status: payload.status ?? SalaryRuleStatus.Active,
                }),
            );

            await versionRepository.save(
                versionRepository.create({
                    salaryRuleId: rule.id,
                    multiplier: this.normalizeMultiplier(payload.multiplier),
                    effectiveFrom,
                    effectiveTo: null,
                    note: this.normalizeNote(payload.note),
                }),
            );

            return rule;
        });

        return this.findOne(salaryRule.id);
    }

    async findAll(query: SalaryRuleQueryDto): Promise<PaginatedSalaryRules> {
        const queryBuilder = this.salaryRuleRepository
            .createQueryBuilder('salaryRule')
            .orderBy(`salaryRule.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.status !== undefined) {
            queryBuilder.andWhere('salaryRule.status = :status', {
                status: query.status,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(salaryRule.code) LIKE :search')
                        .orWhere('LOWER(salaryRule.name) LIKE :search');
                }),
                { search: `%${search}%` },
            );
        }

        const [data, total] = await queryBuilder.getManyAndCount();
        const responses = await Promise.all(
            data.map((salaryRule) => this.toResponse(salaryRule)),
        );

        return {
            data: responses,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async findOne(id: string): Promise<SalaryRuleResponse> {
        const salaryRule = await this.findEntityById(id);
        return this.toResponse(salaryRule);
    }

    async update(
        id: string,
        payload: UpdateSalaryRuleDto,
    ): Promise<SalaryRuleResponse> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        await this.dataSource.transaction(async (manager) => {
            const salaryRule = await this.findEntityById(id, manager);

            if (payload.name !== undefined) {
                salaryRule.name = this.normalizeName(payload.name);
            }

            if (payload.status !== undefined) {
                salaryRule.status = payload.status;
            }

            try {
                await manager.getRepository(SalaryRule).save(salaryRule);
            } catch (error) {
                this.handleDuplicateError(error);
                throw error;
            }

            if (payload.multiplier !== undefined || payload.note !== undefined) {
                const currentVersion = await this.findCurrentVersionByRuleId(
                    id,
                    manager,
                );

                if (payload.multiplier !== undefined) {
                    currentVersion.multiplier = this.normalizeMultiplier(
                        payload.multiplier,
                    );
                }

                if (payload.note !== undefined) {
                    currentVersion.note = this.normalizeNote(payload.note);
                }

                await manager
                    .getRepository(SalaryRuleVersion)
                    .save(currentVersion);
            }
        });

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const salaryRule = await this.findEntityById(id);

        if (isDefaultSalaryRuleCode(salaryRule.code)) {
            throw new ConflictException('Default salary rules cannot be deleted');
        }

        try {
            await this.salaryRuleRepository.delete(id);
        } catch (error) {
            this.handleDeleteError(error);
            throw error;
        }
    }

    private async findEntityById(
        id: string,
        manager?: EntityManager,
    ): Promise<SalaryRule> {
        const repository = manager
            ? manager.getRepository(SalaryRule)
            : this.salaryRuleRepository;
        const salaryRule = await repository.findOne({ where: { id } });

        if (!salaryRule) {
            throw new NotFoundException('Salary rule not found');
        }

        return salaryRule;
    }

    private async findVersionById(
        salaryRuleId: string,
        versionId: string,
        manager: EntityManager,
    ): Promise<SalaryRuleVersion> {
        const version = await manager.getRepository(SalaryRuleVersion).findOne({
            where: { id: versionId, salaryRuleId },
        });

        if (!version) {
            throw new NotFoundException('Salary rule version not found');
        }

        return version;
    }

    private async findVersionsByRuleId(
        salaryRuleId: string,
        manager?: EntityManager,
    ): Promise<SalaryRuleVersion[]> {
        const repository = manager
            ? manager.getRepository(SalaryRuleVersion)
            : this.versionRepository;

        return repository.find({
            where: { salaryRuleId },
            order: { effectiveFrom: 'ASC' },
        });
    }

    private async findCurrentVersionByRuleId(
        salaryRuleId: string,
        manager: EntityManager,
    ): Promise<SalaryRuleVersion> {
        const today = this.today();
        const currentVersion = await manager
            .getRepository(SalaryRuleVersion)
            .createQueryBuilder('version')
            .where('version.salaryRuleId = :salaryRuleId', { salaryRuleId })
            .andWhere('version.effectiveFrom <= :today', { today })
            .andWhere('(version.effectiveTo IS NULL OR version.effectiveTo >= :today)', {
                today,
            })
            .orderBy('version.effectiveFrom', 'DESC')
            .getOne();

        if (!currentVersion) {
            throw new NotFoundException('Current salary rule version not found');
        }

        return currentVersion;
    }

    private async ensureCodeUnique(
        code: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder = this.salaryRuleRepository
            .createQueryBuilder('salaryRule')
            .where('salaryRule.code = :code', { code });

        if (excludedId) {
            queryBuilder.andWhere('salaryRule.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Salary rule code already exists');
        }
    }

    private async ensureNoVersionOverlap(
        salaryRuleId: string,
        effectiveFrom: string,
        effectiveTo: string | null,
        excludedVersionId: string | undefined,
        manager: EntityManager,
    ): Promise<void> {
        const queryBuilder = manager
            .getRepository(SalaryRuleVersion)
            .createQueryBuilder('version')
            .where('version.salaryRuleId = :salaryRuleId', { salaryRuleId })
            .andWhere('version.effectiveFrom <= :effectiveToBoundary', {
                effectiveToBoundary: effectiveTo ?? '9999-12-31',
            })
            .andWhere(
                '(version.effectiveTo IS NULL OR version.effectiveTo >= :effectiveFrom)',
                { effectiveFrom },
            );

        if (excludedVersionId) {
            queryBuilder.andWhere('version.id != :excludedVersionId', {
                excludedVersionId,
            });
        }

        const overlap = await queryBuilder.getOne();

        if (overlap) {
            throw new ConflictException(
                'Salary rule version effective period overlaps with an existing version',
            );
        }
    }

    private async prepareDefaultRuleForNewVersion(
        salaryRule: SalaryRule,
        versions: SalaryRuleVersion[],
        newEffectiveFrom: string,
        manager: EntityManager,
    ): Promise<void> {
        if (versions.length === 0) {
            return;
        }

        const previousVersion = [...versions]
            .reverse()
            .find((version) => version.effectiveFrom < newEffectiveFrom);

        if (!previousVersion) {
            throw new BadRequestException(
                'New effective date must be after the current default rule version',
            );
        }

        if (
            previousVersion.effectiveTo &&
            previousVersion.effectiveTo < this.addDays(newEffectiveFrom, -1)
        ) {
            throw new ConflictException(
                'Default salary rule versions must be continuous',
            );
        }

        if (
            previousVersion.effectiveTo === null ||
            previousVersion.effectiveTo >= newEffectiveFrom
        ) {
            previousVersion.effectiveTo = this.addDays(newEffectiveFrom, -1);
            await manager
                .getRepository(SalaryRuleVersion)
                .save(previousVersion);
        }

        if (salaryRule.status === SalaryRuleStatus.Active) {
            await this.ensureDefaultRuleContinuity(salaryRule.id, manager);
        }
    }

    private async reopenPreviousDefaultVersionIfNeeded(
        salaryRuleId: string,
        deletedVersion: SalaryRuleVersion,
        manager: EntityManager,
    ): Promise<void> {
        const versions = await this.findVersionsByRuleId(salaryRuleId, manager);
        const previousVersion = [...versions]
            .reverse()
            .find((version) => version.effectiveFrom < deletedVersion.effectiveFrom);
        const nextVersion = versions.find(
            (version) => version.effectiveFrom > deletedVersion.effectiveFrom,
        );

        if (previousVersion && !nextVersion) {
            previousVersion.effectiveTo = null;
            await manager
                .getRepository(SalaryRuleVersion)
                .save(previousVersion);
        }
    }

    private async ensureDefaultRuleContinuity(
        salaryRuleId: string,
        manager: EntityManager,
    ): Promise<void> {
        const versions = await this.findVersionsByRuleId(salaryRuleId, manager);

        for (let index = 0; index < versions.length - 1; index += 1) {
            const current = versions[index];
            const next = versions[index + 1];
            const expectedEffectiveTo = this.addDays(next.effectiveFrom, -1);

            if (current.effectiveTo !== expectedEffectiveTo) {
                throw new ConflictException(
                    'Default salary rule versions must be continuous',
                );
            }
        }
    }

    private ensureScheduledVersion(version: SalaryRuleVersion): void {
        if (version.effectiveFrom <= this.today()) {
            throw new ConflictException(
                'Only scheduled salary rule versions can be changed',
            );
        }
    }

    private validateDateRange(
        effectiveFrom: string,
        effectiveTo?: string | null,
    ): void {
        if (effectiveTo && effectiveTo < effectiveFrom) {
            throw new BadRequestException(
                'Effective end date must be greater than or equal to effective start date',
            );
        }
    }

    private normalizeCode(value: string): string {
        return value.trim().toUpperCase();
    }

    private normalizeName(value: string): string {
        return value.trim();
    }

    private normalizeMultiplier(value: number): string {
        return value.toFixed(2);
    }

    private normalizeNullableDate(value?: string | null): string | null {
        const date = value?.trim();
        return date ? date : null;
    }

    private normalizeNote(value?: string | null): string | null {
        const note = value?.trim();
        return note ? note : null;
    }

    private async toResponse(
        salaryRule: SalaryRule,
    ): Promise<SalaryRuleResponse> {
        const versions = await this.findVersionsByRuleId(salaryRule.id);
        const today = this.today();
        const currentVersion =
            versions.find(
                (version) =>
                    version.effectiveFrom <= today &&
                    (!version.effectiveTo || version.effectiveTo >= today),
            ) ?? null;

        return {
            id: salaryRule.id,
            code: salaryRule.code,
            name: salaryRule.name,
            status: salaryRule.status,
            isDefault: isDefaultSalaryRuleCode(salaryRule.code),
            currentMultiplier: currentVersion?.multiplier ?? null,
            note: currentVersion?.note ?? null,
            createdAt: salaryRule.createdAt,
            updatedAt: salaryRule.updatedAt,
        };
    }

    private today(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private addDays(value: string, days: number): string {
        const date = new Date(`${value}T00:00:00`);
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private handleDuplicateError(error: unknown): void {
        if (!(error instanceof QueryFailedError)) {
            return;
        }

        const driverError = error.driverError as { code?: string };

        if (driverError.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('Salary rule already exists');
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
                'Salary rule cannot be deleted because related data exists',
            );
        }
    }
}
