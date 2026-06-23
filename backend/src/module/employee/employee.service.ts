import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, QueryFailedError, Repository } from 'typeorm';
import { Department } from '@/module/department/entities/department.entity';
import { Position } from '@/module/position/entities/position.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeStatus } from './entities/employee-status.enum';
import { Employee } from './entities/employee.entity';
import { UserRole } from '@/common/enum/role.enum';
import { UserService, UserResponse } from '@/module/user/user.service';
import { CreateEmployeeAccountDto } from './dto/create_account_dto';
import { ResetEmployeePasswordDto } from './dto/reset_employee_password.dto';
export type PaginatedEmployees = {
    data: Employee[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
        @InjectRepository(Position)
        private readonly positionRepository: Repository<Position>,
        private readonly userService: UserService,
    ) { }

    async create(payload: CreateEmployeeDto): Promise<Employee> {
        const employeeCode =
            payload.employeeCode?.trim().toUpperCase() ??
            (await this.generateEmployeeCode());
        const email = payload.email.trim().toLowerCase();

        await this.ensureEmployeeCodeUnique(employeeCode);
        await this.ensureEmailUnique(email);

        const [departments, positions] = await Promise.all([
            this.findDepartments(payload.departmentIds ?? []),
            this.findPositions(payload.positionIds ?? []),
        ]);

        const employee = this.employeeRepository.create({
            employeeCode,
            firstName: payload.firstName.trim(),
            lastName: payload.lastName.trim(),
            email,
            phoneNumber: this.normalizeNullable(payload.phoneNumber),
            dateOfBirth: this.normalizeNullable(payload.dateOfBirth),
            gender: this.normalizeNullable(payload.gender),
            hireDate: payload.hireDate ?? this.today(),
            address: this.normalizeNullable(payload.address),
            status: payload.status ?? EmployeeStatus.Active,
            departments,
            positions,
        });

        try {
            const savedEmployee = await this.employeeRepository.save(employee);
            return this.findOne(savedEmployee.id);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async findAll(query: EmployeeQueryDto): Promise<PaginatedEmployees> {
        const queryBuilder = this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.departments', 'department')
            .leftJoinAndSelect('employee.positions', 'position')
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        if (query.sortBy === 'fullName') {
            queryBuilder
                .orderBy('employee.lastName', query.sortOrder)
                .addOrderBy('employee.firstName', query.sortOrder);
        } else {
            queryBuilder.orderBy(`employee.${query.sortBy}`, query.sortOrder);
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
                        )
                        .orWhere('employee.email LIKE :search');
                }),
                { search: `%${query.search}%` },
            );
        }

        if (query.departmentId) {
            queryBuilder
                .innerJoin('employee.departments', 'filterDepartment')
                .andWhere('filterDepartment.id = :departmentId', {
                    departmentId: query.departmentId,
                });
        }

        if (query.positionId) {
            queryBuilder
                .innerJoin('employee.positions', 'filterPosition')
                .andWhere('filterPosition.id = :positionId', {
                    positionId: query.positionId,
                });
        }

        if (query.status) {
            queryBuilder.andWhere('employee.status = :status', {
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

    async findOne(id: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: { departments: true, positions: true },
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        return employee;
    }

    async findByEmail(email: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({
            where: { email },
            relations: { departments: true, positions: true },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        return employee;
    }

    async update(id: string, payload: UpdateEmployeeDto): Promise<Employee> {
        if (Object.keys(payload).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const employee = await this.findOne(id);

        if (payload.employeeCode !== undefined) {
            const employeeCode = payload.employeeCode.trim().toUpperCase();
            if (employeeCode !== employee.employeeCode) {
                await this.ensureEmployeeCodeUnique(employeeCode);
            }
            employee.employeeCode = employeeCode;
        }

        if (payload.email !== undefined) {
            const email = payload.email.trim().toLowerCase();
            if (email !== employee.email) {
                await this.ensureEmailUnique(email, id);
            }
            employee.email = email;
        }

        if (payload.firstName !== undefined) {
            employee.firstName = payload.firstName.trim();
        }
        if (payload.lastName !== undefined) {
            employee.lastName = payload.lastName.trim();
        }
        if (payload.phoneNumber !== undefined) {
            employee.phoneNumber = this.normalizeNullable(payload.phoneNumber);
        }
        if (payload.dateOfBirth !== undefined) {
            employee.dateOfBirth = this.normalizeNullable(payload.dateOfBirth);
        }
        if (payload.gender !== undefined) {
            employee.gender = this.normalizeNullable(payload.gender);
        }
        if (payload.hireDate !== undefined) {
            employee.hireDate = payload.hireDate;
        }
        if (payload.address !== undefined) {
            employee.address = this.normalizeNullable(payload.address);
        }
        if (payload.status !== undefined) {
            employee.status = payload.status;
        }
        if (payload.departmentIds !== undefined) {
            employee.departments = await this.findDepartments(
                payload.departmentIds,
            );
        }
        if (payload.positionIds !== undefined) {
            employee.positions = await this.findPositions(payload.positionIds);
        }

        try {
            await this.employeeRepository.save(employee);
            return this.findOne(id);
        } catch (error) {
            this.handleDuplicateError(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const employee = await this.findOne(id);

        try {
            await this.employeeRepository.delete(id);
        } catch (error) {
            if (this.isForeignKeyReferenceError(error)) {
                employee.status = EmployeeStatus.Inactive;
                await this.employeeRepository.save(employee);
                return;
            }

            throw error;
        }
    }

    async findAccount(employeeId: string): Promise<UserResponse | null> {
        const employee = await this.findOne(employeeId);

        return this.userService.findAccountByEmployeeId(employee.id);
    }

    async createAccount(
        employeeId: string,
        payload: CreateEmployeeAccountDto,
    ): Promise<UserResponse> {
        const employee = await this.findOne(employeeId);

        if (employee.status !== EmployeeStatus.Active) {
            throw new BadRequestException(
                'Cannot create account for inactive employee',
            );
        }

        await this.userService.ensureEmployeeHasNoAccount(employee.id);
        return this.userService.create({
            email: employee.email,
            password: payload.temporaryPassword,
            role: payload.role ?? UserRole.User,
            employeeId: employee.id,
            mustChangePassword: true,
            isMaster: false,
        });
    }

    async resetAccountPassword(
        employeeId: string,
        payload: ResetEmployeePasswordDto,
    ): Promise<UserResponse> {
        const employee = await this.findOne(employeeId);

        return this.userService.resetEmployeePassword(
            employee.id,
            payload.temporaryPassword,
        );
    }

    //tách ra file riêng
    private async generateEmployeeCode(): Promise<string> {
        const latest = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.employeeCode', 'employeeCode')
            .where('employee.employeeCode REGEXP :pattern', {
                pattern: '^NV[0-9]+$',
            })
            .orderBy(
                'CAST(SUBSTRING(employee.employeeCode, 3) AS UNSIGNED)',
                'DESC',
            )
            .getRawOne<{ employeeCode?: string }>();
        const nextNumber = latest?.employeeCode
            ? Number(latest.employeeCode.slice(2)) + 1
            : 1;

        return `NV${nextNumber.toString().padStart(4, '0')}`;
    }

    private async findDepartments(ids: string[]): Promise<Department[]> {
        const uniqueIds = [...new Set(ids)];
        const departments = await this.departmentRepository.find({
            where: { id: In(uniqueIds) },
        });

        if (departments.length !== uniqueIds.length) {
            throw new BadRequestException('Department does not exist');
        }

        return departments;
    }

    private async findPositions(ids: string[]): Promise<Position[]> {
        const uniqueIds = [...new Set(ids)];
        const positions = await this.positionRepository.find({
            where: { id: In(uniqueIds) },
        });

        if (positions.length !== uniqueIds.length) {
            throw new BadRequestException('Position does not exist');
        }

        return positions;
    }

    private async ensureEmployeeCodeUnique(code: string): Promise<void> {
        const duplicate = await this.employeeRepository.findOne({
            where: { employeeCode: code },
        });

        if (duplicate) {
            throw new ConflictException('Employee code already exists');
        }
    }

    private async ensureEmailUnique(
        email: string,
        excludedId?: string,
    ): Promise<void> {
        const queryBuilder =
            this.employeeRepository.createQueryBuilder('employee');
        queryBuilder.where('employee.email = :email', { email });

        if (excludedId) {
            queryBuilder.andWhere('employee.id != :excludedId', {
                excludedId,
            });
        }

        const duplicate = await queryBuilder.getOne();

        if (duplicate) {
            throw new ConflictException('Employee email already exists');
        }
    }

    private normalizeNullable(value?: string | null): string | null {
        const normalized = value?.trim();
        return normalized ? normalized : null;
    }

    private today(): string {
        return new Date().toISOString().slice(0, 10);
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

        if (driverError.sqlMessage?.includes('employee_code')) {
            throw new ConflictException('Employee code already exists');
        }

        throw new ConflictException('Employee email already exists');
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
