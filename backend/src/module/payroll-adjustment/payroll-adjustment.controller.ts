import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
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
import { UserService } from '@/module/user/user.service';
import { CreatePayrollAdjustmentDto } from './dto/create-payroll-adjustment.dto';
import { PayrollAdjustmentQueryDto } from './dto/payroll-adjustment-query.dto';
import { UpdatePayrollAdjustmentDto } from './dto/update-payroll-adjustment.dto';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity';
import {
    PaginatedPayrollAdjustments,
    PayrollAdjustmentService,
} from './payroll-adjustment.service';

@Controller('payroll-adjustments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class PayrollAdjustmentController {
    constructor(
        private readonly adjustmentService: PayrollAdjustmentService,
        private readonly userService: UserService,
    ) {}

    @Post()
    async create(
        @Body() payload: CreatePayrollAdjustmentDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollAdjustment> {
        return this.adjustmentService.create(
            payload,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get()
    async findAll(
        @Query() query: PayrollAdjustmentQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedPayrollAdjustments> {
        return this.adjustmentService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollAdjustment> {
        return this.adjustmentService.findOne(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Put(':id')
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdatePayrollAdjustmentDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PayrollAdjustment> {
        return this.adjustmentService.update(
            id,
            payload,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<void> {
        return this.adjustmentService.remove(
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
