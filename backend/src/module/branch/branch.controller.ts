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
import { AuthenticatedRequest } from '@/module/auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserService } from '@/module/user/user.service';
import { BranchService, PaginatedBranches } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchQueryDto } from './dto/branch-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class BranchController {
    constructor(
        private readonly branchService: BranchService,
        private readonly userService: UserService,
    ) {}

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreateBranchDto): Promise<Branch> {
        return this.branchService.create(payload);
    }

    @Get()
    async findAll(
        @Query() query: BranchQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedBranches> {
        return this.branchService.findAll(
            query,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<Branch> {
        return this.branchService.findOne(
            id,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateBranchDto,
    ): Promise<Branch> {
        return this.branchService.update(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.branchService.remove(id);
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
