import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
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
import { AuthenticatedRequest } from '@/module/auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserService } from '@/module/user/user.service';
import {
    BulkWorkScheduleResult,
    PaginatedWorkSchedules,
    WorkScheduleResponse,
    WorkScheduleService,
} from './work-schedule.service';
import { BulkCreateWorkSchedulesDto } from './dto/bulk-create-work-schedules.dto';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDto } from './dto/work-schedule-query.dto';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class WorkScheduleController {
    constructor(
        private readonly workScheduleService: WorkScheduleService,
        private readonly userService: UserService,
    ) {}

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: WorkScheduleQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedWorkSchedules> {
        return this.workScheduleService.findAll(
            query,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('calendar')
    @Roles(UserRole.Admin, UserRole.Manager)
    async calendar(
        @Query() query: WorkScheduleQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedWorkSchedules> {
        return this.workScheduleService.findAll(
            query,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('my-schedules')
    findMySchedules(
        @Query() query: WorkScheduleQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedWorkSchedules> {
        return this.workScheduleService.findMySchedules(
            request.user.employeeId,
            query,
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<WorkScheduleResponse> {
        const schedule = await this.workScheduleService.findOne(
            id,
            await this.resolveAllowedBranchIds(request),
        );

        if (
            request.user.role === UserRole.User &&
            schedule.employeeId !== request.user.employeeId
        ) {
            throw new ForbiddenException(
                'You can only view your own work schedule',
            );
        }

        return schedule;
    }

    @Post()
    @Roles(UserRole.Admin, UserRole.Manager)
    async create(
        @Body() payload: CreateWorkScheduleDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<WorkScheduleResponse> {
        return this.workScheduleService.create(
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Post('bulk')
    @Roles(UserRole.Admin, UserRole.Manager)
    async bulkCreate(
        @Body() payload: BulkCreateWorkSchedulesDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<BulkWorkScheduleResult> {
        return this.workScheduleService.bulkCreate(
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Put(':id')
    @Roles(UserRole.Admin, UserRole.Manager)
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateWorkScheduleDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<WorkScheduleResponse> {
        return this.workScheduleService.update(
            id,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Delete(':id')
    @Roles(UserRole.Admin, UserRole.Manager)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<void> {
        return this.workScheduleService.remove(
            id,
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
