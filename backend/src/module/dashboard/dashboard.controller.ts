import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import {
    AuthenticatedRequest,
    JwtAuthGuard,
} from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserService } from '@/module/user/user.service';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardMine, DashboardSummary } from './types/dashboard.types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly userService: UserService,
    ) {}

    @Get('summary')
    @Roles(UserRole.Admin, UserRole.Manager)
    async getSummary(
        @Query() query: DashboardQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<DashboardSummary> {
        return this.dashboardService.getSummary(
            query,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('me')
    getMine(@Req() request: AuthenticatedRequest): Promise<DashboardMine> {
        return this.dashboardService.getMine(request.user);
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
