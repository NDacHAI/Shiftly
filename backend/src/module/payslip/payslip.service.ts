import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { JwtPayload } from '@/module/auth/types/auth-user.type';
import { EmployeePayrollStatus } from '@/module/payroll-processing/entities/employee-payroll-status.enum';
import { EmployeePayroll } from '@/module/payroll-processing/entities/employee-payroll.entity';
import { PayrollProcessingStatus } from '@/module/payroll-processing/entities/payroll-processing-status.enum';
import { PayslipQueryDto } from './dto/payslip-query.dto';

export type PaginatedPayslips = {
    data: EmployeePayroll[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

@Injectable()
export class PayslipService {
    constructor(
        @InjectRepository(EmployeePayroll)
        private readonly employeePayrollRepository: Repository<EmployeePayroll>,
    ) {}

    async findAll(
        query: PayslipQueryDto,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<PaginatedPayslips> {
        this.ensureCanManagePayslips(authUser, allowedBranchIds);

        const queryBuilder = this.createPayslipQueryBuilder(query);
        this.applyBranchScope(queryBuilder, allowedBranchIds);
        this.applyFilters(queryBuilder, query);

        const [data, total] = await queryBuilder.getManyAndCount();

        return this.toPaginatedResponse(data, total, query);
    }

    async findMine(
        query: PayslipQueryDto,
        authUser: JwtPayload,
    ): Promise<PaginatedPayslips> {
        if (!authUser.employeeId) {
            throw new ForbiddenException('Employee account is not linked');
        }

        const queryBuilder = this.createPayslipQueryBuilder(query)
            .andWhere('payslip.employeeId = :employeeId', {
                employeeId: authUser.employeeId,
            });
        this.applyFilters(queryBuilder, {
            ...query,
            employeeId: undefined,
            branchId: undefined,
        });

        const [data, total] = await queryBuilder.getManyAndCount();

        return this.toPaginatedResponse(data, total, query);
    }

    async findOne(
        id: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): Promise<EmployeePayroll> {
        const payslip = await this.findPayslipById(id);

        if (authUser.role === UserRole.User) {
            if (!authUser.employeeId || payslip.employeeId !== authUser.employeeId) {
                throw new ForbiddenException('You can only view your own payslips');
            }

            return payslip;
        }

        this.ensureCanAccessBranch(payslip.branchId, authUser, allowedBranchIds);

        return payslip;
    }

    private createPayslipQueryBuilder(query: PayslipQueryDto) {
        return this.employeePayrollRepository
            .createQueryBuilder('payslip')
            .leftJoinAndSelect('payslip.payrollProcessing', 'payrollProcessing')
            .leftJoinAndSelect('payslip.payrollPeriod', 'payrollPeriod')
            .leftJoinAndSelect('payslip.employee', 'employee')
            .leftJoinAndSelect('payslip.branch', 'branch')
            .leftJoinAndSelect('payslip.position', 'position')
            .where('payslip.status = :payslipStatus', {
                payslipStatus: EmployeePayrollStatus.Finalized,
            })
            .andWhere('payrollProcessing.status = :processingStatus', {
                processingStatus: PayrollProcessingStatus.Closed,
            })
            .orderBy(`payslip.${query.sortBy}`, query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit);
    }

    private applyFilters(
        queryBuilder: ReturnType<
            Repository<EmployeePayroll>['createQueryBuilder']
        >,
        query: PayslipQueryDto,
    ): void {
        if (query.payrollPeriodId) {
            queryBuilder.andWhere('payslip.payrollPeriodId = :payrollPeriodId', {
                payrollPeriodId: query.payrollPeriodId,
            });
        }

        if (query.branchId) {
            queryBuilder.andWhere('payslip.branchId = :branchId', {
                branchId: query.branchId,
            });
        }

        if (query.employeeId) {
            queryBuilder.andWhere('payslip.employeeId = :employeeId', {
                employeeId: query.employeeId,
            });
        }

        if (query.search) {
            const search = query.search.toLowerCase();
            queryBuilder.andWhere(
                new Brackets((builder) => {
                    builder
                        .where('LOWER(payslip.employeeCode) LIKE :search')
                        .orWhere('LOWER(payslip.employeeName) LIKE :search')
                        .orWhere('LOWER(payslip.branchName) LIKE :search')
                        .orWhere('LOWER(payslip.positionName) LIKE :search')
                        .orWhere('LOWER(payrollPeriod.code) LIKE :search')
                        .orWhere('LOWER(payrollPeriod.name) LIKE :search');
                }),
                { search: `%${search}%` },
            );
        }
    }

    private applyBranchScope(
        queryBuilder: ReturnType<
            Repository<EmployeePayroll>['createQueryBuilder']
        >,
        allowedBranchIds?: string[],
    ): void {
        if (!allowedBranchIds) {
            return;
        }

        if (allowedBranchIds.length === 0) {
            queryBuilder.andWhere('1 = 0');
            return;
        }

        queryBuilder.andWhere('payslip.branchId IN (:...allowedBranchIds)', {
            allowedBranchIds,
        });
    }

    private async findPayslipById(id: string): Promise<EmployeePayroll> {
        const payslip = await this.employeePayrollRepository
            .createQueryBuilder('payslip')
            .leftJoinAndSelect('payslip.payrollProcessing', 'payrollProcessing')
            .leftJoinAndSelect('payslip.payrollPeriod', 'payrollPeriod')
            .leftJoinAndSelect('payslip.employee', 'employee')
            .leftJoinAndSelect('payslip.branch', 'branch')
            .leftJoinAndSelect('payslip.position', 'position')
            .where('payslip.id = :id', { id })
            .andWhere('payslip.status = :payslipStatus', {
                payslipStatus: EmployeePayrollStatus.Finalized,
            })
            .andWhere('payrollProcessing.status = :processingStatus', {
                processingStatus: PayrollProcessingStatus.Closed,
            })
            .getOne();

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        return payslip;
    }

    private ensureCanManagePayslips(
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager && allowedBranchIds) {
            return;
        }

        throw new ForbiddenException('You do not have permission to view payslips');
    }

    private ensureCanAccessBranch(
        branchId: string,
        authUser: JwtPayload,
        allowedBranchIds?: string[],
    ): void {
        if (authUser.role === UserRole.Admin) {
            return;
        }

        if (authUser.role === UserRole.Manager && allowedBranchIds?.includes(branchId)) {
            return;
        }

        throw new ForbiddenException('You can only view payslips in your branches');
    }

    private toPaginatedResponse(
        data: EmployeePayroll[],
        total: number,
        query: PayslipQueryDto,
    ): PaginatedPayslips {
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
}
