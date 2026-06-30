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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { EmployeeService, PaginatedEmployees } from './employee.service';
import { CreateEmployeeAccountDto } from './dto/create_account_dto';
import { ResetEmployeePasswordDto } from './dto/reset_employee_password.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Get()
    @Roles(UserRole.Admin, UserRole.Manager)
    async findAll(
        @Query() query: EmployeeQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedEmployees> {
        return this.employeeService.findAll(
            query,
            await this.resolveAllowedBranchIds(request),
        );
    }

    @Get('me')
    findMe(@Req() request: AuthenticatedRequest): Promise<Employee> {
        return this.employeeService.findByEmail(request.user.email);
    }

    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<Employee> {
        const employee = await this.employeeService.findOne(id);

        if (
            request.user.role === UserRole.User &&
            employee.email !== request.user.email
        ) {
            throw new ForbiddenException(
                'You can only view your own employee profile',
            );
        }

        if (request.user.role === UserRole.Manager) {
            const allowedBranchIds = await this.resolveAllowedBranchIds(request);
            const canView = employee.branches.some((branch) =>
                allowedBranchIds?.includes(branch.id),
            );

            if (!canView) {
                throw new ForbiddenException(
                    'You can only view employees in your branches',
                );
            }
        }

        return employee;
    }

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreateEmployeeDto): Promise<Employee> {
        return this.employeeService.create(payload);
    }

    @Post(':id/account')
    @Roles(UserRole.Admin)
    createAccount(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: CreateEmployeeAccountDto,
    ) {
        return this.employeeService.createAccount(id, payload);
    }

    @Get(':id/account')
    @Roles(UserRole.Admin)
    findAccount(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.employeeService.findAccount(id);
    }

    @Post(':id/account/reset-password')
    @Roles(UserRole.Admin)
    resetAccountPassword(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: ResetEmployeePasswordDto,
    ) {
        return this.employeeService.resetAccountPassword(id, payload);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateEmployeeDto,
    ): Promise<Employee> {
        return this.employeeService.update(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.employeeService.remove(id);
    }

    private resolveAllowedBranchIds(
        request: AuthenticatedRequest,
    ): Promise<string[] | undefined> {
        if (request.user.role !== UserRole.Manager) {
            return Promise.resolve(undefined);
        }

        return this.employeeService.findManagedBranchIds(request.user.sub);
    }
}
