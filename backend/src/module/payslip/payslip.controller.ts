import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
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
import { PayslipQueryDto } from './dto/payslip-query.dto';
import { PaginatedPayslips, PayslipService } from './payslip.service';
import { EmployeePayroll } from '@/module/payroll-processing/entities/employee-payroll.entity';

@Controller('payslips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipController {
    constructor(
        private readonly payslipService: PayslipService,
        private readonly userService: UserService,
    ) {}

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: PayslipQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedPayslips> {
        return this.payslipService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('me')
    @Roles(UserRole.User, UserRole.Manager, UserRole.Admin)
    async findMine(
        @Query() query: PayslipQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedPayslips> {
        return this.payslipService.findMine(query, request.user);
    }

    @Get(':id')
    @Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<EmployeePayroll> {
        return this.payslipService.findOne(
            id,
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
