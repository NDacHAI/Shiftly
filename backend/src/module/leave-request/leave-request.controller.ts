import {
    Body,
    Controller,
    Get,
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
import { UserService } from '@/module/user/user.service';
import { CancelLeaveRequestDto } from './dto/cancel-leave-request.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequest } from './entities/leave-request.entity';
import {
    LeaveRequestService,
    PaginatedLeaveRequests,
} from './leave-request.service';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class LeaveRequestController {
    constructor(
        private readonly leaveRequestService: LeaveRequestService,
        private readonly userService: UserService,
    ) {}

    @Get('my')
    @Roles(UserRole.User)
    findMyRequests(
        @Query() query: LeaveRequestQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedLeaveRequests> {
        return this.leaveRequestService.findMyRequests(request.user, query);
    }

    @Post()
    async create(
        @Body() payload: CreateLeaveRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        if (request.user.role === UserRole.User) {
            return this.leaveRequestService.createForEmployee(
                request.user,
                payload,
            );
        }

        return this.leaveRequestService.create(
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: LeaveRequestQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedLeaveRequests> {
        return this.leaveRequestService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        return this.leaveRequestService.findOne(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Put(':id')
    async updatePending(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateLeaveRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        return this.leaveRequestService.updatePending(
            id,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/approve')
    @Roles(UserRole.Admin, UserRole.Manager)
    async approve(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: ReviewLeaveRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        return this.leaveRequestService.approve(
            id,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/reject')
    @Roles(UserRole.Admin, UserRole.Manager)
    async reject(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: ReviewLeaveRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        return this.leaveRequestService.reject(
            id,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/cancel')
    async cancel(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: CancelLeaveRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<LeaveRequest> {
        return this.leaveRequestService.cancel(
            id,
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
