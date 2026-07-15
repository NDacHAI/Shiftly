import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import {
    AuthenticatedRequest,
    JwtAuthGuard,
} from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserService } from '@/module/user/user.service';
import { EmployeePayrollQueryDto } from './dto/employee-payroll-query.dto';
import { PayrollProcessingQueryDto } from './dto/payroll-processing-query.dto';
import { EmployeePayroll } from './entities/employee-payroll.entity';
import { PayrollProcessing } from './entities/payroll-processing.entity';
import {
    PaginatedEmployeePayrolls,
    PaginatedPayrollProcessings,
    PayrollProcessingService,
} from './payroll-processing.service';

@Controller('payroll-processings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class PayrollProcessingController {
    constructor(
        private readonly processingService: PayrollProcessingService,
        private readonly userService: UserService,
    ) {}

    @Post('periods/:periodId/generate')
    async generate(
        @Param('periodId', new ParseUUIDPipe()) periodId: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollProcessing> {
        return this.processingService.generate(
            periodId,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get()
    async findAll(
        @Query() query: PayrollProcessingQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedPayrollProcessings> {
        return this.processingService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('employee-payrolls/:employeePayrollId')
    async findEmployeePayroll(
        @Param('employeePayrollId', new ParseUUIDPipe()) employeePayrollId: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<EmployeePayroll> {
        return this.processingService.findEmployeePayroll(
            employeePayrollId,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollProcessing> {
        return this.processingService.findOne(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id/employee-payrolls')
    async findEmployeePayrolls(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query() query: EmployeePayrollQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedEmployeePayrolls> {
        return this.processingService.findEmployeePayrolls(
            id,
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/recalculate')
    async recalculate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollProcessing> {
        return this.processingService.recalculate(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/close')
    async close(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollProcessing> {
        return this.processingService.close(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch('employee-payrolls/:employeePayrollId/retry')
    async retryEmployeePayroll(
        @Param('employeePayrollId', new ParseUUIDPipe()) employeePayrollId: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<EmployeePayroll> {
        return this.processingService.retryEmployeePayroll(
            employeePayrollId,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    private resolveAllowedBranchIds(
        request: AuthenticatedRequest,
    ): Promise<string[] | undefined> {
        if (request.user.role !== UserRole.Manager) {
            return Promise.resolve(undefined);
        }

        return this.userService.findManagedBranchIds(request.user.sub);
    }
}
