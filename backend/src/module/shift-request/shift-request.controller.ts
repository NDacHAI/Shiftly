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
import { CancelShiftRequestDto } from './dto/cancel-shift-request.dto';
import { CreateShiftRequestDto } from './dto/create-shift-request.dto';
import { ReviewShiftRequestDto } from './dto/review-shift-request.dto';
import { ShiftRequestQueryDto } from './dto/shift-request-query.dto';
import { ShiftRequest } from './entities/shift-request.entity';
import {
    PaginatedShiftRequests,
    ShiftRequestService,
} from './shift-request.service';

@Controller('shift-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class ShiftRequestController {
    constructor(
        private readonly shiftRequestService: ShiftRequestService,
        private readonly userService: UserService,
    ) {}

    @Get('my')
    @Roles(UserRole.User)
    findMyRequests(
        @Query() query: ShiftRequestQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedShiftRequests> {
        return this.shiftRequestService.findMyRequests(request.user, query);
    }

    @Post()
    @Roles(UserRole.User)
    create(
        @Body() payload: CreateShiftRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<ShiftRequest> {
        return this.shiftRequestService.createForEmployee(
            request.user,
            payload,
        );
    }

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: ShiftRequestQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedShiftRequests> {
        return this.shiftRequestService.findAll(
            query,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<ShiftRequest> {
        return this.shiftRequestService.findOne(
            id,
            request.user,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/approve')
    @Roles(UserRole.Admin, UserRole.Manager)
    async approve(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: ReviewShiftRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<ShiftRequest> {
        return this.shiftRequestService.approve(
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
        @Body() payload: ReviewShiftRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<ShiftRequest> {
        return this.shiftRequestService.reject(
            id,
            request.user,
            payload,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Patch(':id/cancel')
    @Roles(UserRole.User)
    cancel(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: CancelShiftRequestDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<ShiftRequest> {
        return this.shiftRequestService.cancel(id, request.user, payload);
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
