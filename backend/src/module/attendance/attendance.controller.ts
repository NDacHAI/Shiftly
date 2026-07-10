import {
    Body,
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
import { AuthenticatedRequest } from '@/module/auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserService } from '@/module/user/user.service';
import { AttendanceService } from './attendance.service';
import { AdjustAttendanceDto } from './dto/adjust-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly userService: UserService,
    ) {}

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: AttendanceQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('my-schedules')
    findMySchedules(
        @Query() query: AttendanceQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.findMySchedules(request.user, query);
    }

    @Get('my-history')
    findMyHistory(
        @Query() query: AttendanceQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.findMyHistory(request.user, query);
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.findOne(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id/adjustments')
    async findAdjustments(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.findAdjustments(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Post('work-schedules/:workScheduleId/check-in')
    checkIn(
        @Param('workScheduleId', new ParseUUIDPipe()) workScheduleId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.checkIn(workScheduleId, request.user);
    }

    @Post(':id/check-out')
    checkOut(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.checkOut(id, request.user);
    }

    @Patch(':id/confirm')
    @Roles(UserRole.Admin, UserRole.Manager)
    async confirm(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.confirm(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/adjust')
    @Roles(UserRole.Admin, UserRole.Manager)
    async adjust(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: AdjustAttendanceDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.adjust(
            id,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Post('work-schedules/:workScheduleId/manual')
    @Roles(UserRole.Admin, UserRole.Manager)
    async manualCreate(
        @Param('workScheduleId', new ParseUUIDPipe()) workScheduleId: string,
        @Body() payload: ManualAttendanceDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.manualCreate(
            workScheduleId,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Post('work-schedules/:workScheduleId/mark-absent')
    @Roles(UserRole.Admin, UserRole.Manager)
    async markAbsent(
        @Param('workScheduleId', new ParseUUIDPipe()) workScheduleId: string,
        @Body() payload: MarkAbsentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.attendanceService.markAbsent(
            workScheduleId,
            request.user,
            payload,
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
