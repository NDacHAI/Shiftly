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
import { DepartmentService, PaginatedDepartments } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    @Post()
    create(@Body() payload: CreateDepartmentDto): Promise<Department> {
        return this.departmentService.create(payload);
    }

    @Get()
    findAll(
        @Query() query: DepartmentQueryDto,
    ): Promise<PaginatedDepartments> {
        return this.departmentService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<Department> {
        return this.departmentService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateDepartmentDto,
    ): Promise<Department> {
        return this.departmentService.update(id, payload);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.departmentService.remove(id);
    }
}
