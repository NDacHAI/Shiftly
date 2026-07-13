import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
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
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { PayrollPeriodQueryDto } from './dto/payroll-period-query.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { PayrollPeriod } from './entities/payroll-period.entity';
import {
    PaginatedPayrollPeriods,
    PayrollPeriodService,
} from './payroll-period.service';

@Controller('payroll-periods')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class PayrollPeriodController {
    constructor(private readonly payrollPeriodService: PayrollPeriodService) {}

    @Post()
    @Roles(UserRole.Admin)
    create(
        @Body() payload: CreatePayrollPeriodDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollPeriod> {
        return this.payrollPeriodService.create(payload, request.user.sub);
    }

    @Get()
    findAll(
        @Query() query: PayrollPeriodQueryDto,
    ): Promise<PaginatedPayrollPeriods> {
        return this.payrollPeriodService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<PayrollPeriod> {
        return this.payrollPeriodService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdatePayrollPeriodDto,
    ): Promise<PayrollPeriod> {
        return this.payrollPeriodService.update(id, payload);
    }

    @Patch(':id/open')
    @Roles(UserRole.Admin)
    open(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<PayrollPeriod> {
        return this.payrollPeriodService.open(id);
    }

    @Patch(':id/close')
    @Roles(UserRole.Admin)
    close(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<PayrollPeriod> {
        return this.payrollPeriodService.close(id);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.payrollPeriodService.remove(id);
    }
}
