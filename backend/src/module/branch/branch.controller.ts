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
    UseGuards,
} from '@nestjs/common';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { BranchService, PaginatedBranches } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchQueryDto } from './dto/branch-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class BranchController {
    constructor(private readonly branchService: BranchService) {}

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreateBranchDto): Promise<Branch> {
        return this.branchService.create(payload);
    }

    @Get()
    findAll(
        @Query() query: BranchQueryDto,
    ): Promise<PaginatedBranches> {
        return this.branchService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<Branch> {
        return this.branchService.findOne(id);
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
}
