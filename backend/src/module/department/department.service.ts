import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

export type PaginatedDepartments = {
    data: Department[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    async create(payload: CreateDepartmentDto): Promise<Department> {
        const code = payload.code.trim().toUpperCase();
        const name = payload.name.trim();

        await this.ensureUnique(code, name);

        const department = this.departmentRepository.create({
            code,
            name,
            description: this.normalizeDescription(payload.description),
            status: payload.status ?? true,
        });

        try {
            return await this.departmentRepository.save(department);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(query: DepartmentQueryDto): Promise<PaginatedDepartments> {
        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .orderBy(`department.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.search) {
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('department.code LIKE :search')
                        .orWhere('department.name LIKE :search');
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

    async findOne(id: string): Promise<Department> {
        return this.findEntityById(id);
    }

    async update(
        id: string,
        payload: UpdateDepartmentDto,
    ): Promise<Department> {
        if (
            payload.name === undefined &&
            payload.description === undefined &&
            payload.status === undefined
        ) {
            throw new BadRequestException('At least one field must be provided');
        }

        const department = await this.findEntityById(id);

        if (payload.name !== undefined) {
            const name = payload.name.trim();
            await this.ensureUnique(undefined, name, id);
            department.name = name;
        }

        if (payload.description !== undefined) {
            department.description = this.normalizeDescription(
                payload.description,
            );
        }

        if (payload.status !== undefined) {
            department.status = payload.status;
        }

        try {
            return await this.departmentRepository.save(department);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        await this.findEntityById(id);
        await this.departmentRepository.softDelete(id);
    }

    private async findEntityById(id: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id },
        });

        if (!department) {
            throw new NotFoundException('Department not found');
        }

        return department;
    }

    private async ensureUnique(
        code?: string,
        name?: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder =
            this.departmentRepository.createQueryBuilder('department');

        queryBuilder.withDeleted().where(
            new Brackets((builder) => {
                if (code) {
                    builder.where('department.code = :code', { code });
                }

                if (name) {
                    const method = code ? 'orWhere' : 'where';
                    builder[method]('department.name = :name', { name });
                }
            }),
        );

        if (excludedId) {
            queryBuilder.andWhere('department.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate?.code === code) {
            throw new ConflictException('Department code already exists');
        }

        if (duplicate?.name === name) {
            throw new ConflictException('Department name already exists');
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
            throw new ConflictException('Department code already exists');
        }

        throw new ConflictException('Department name already exists');
    }
}
