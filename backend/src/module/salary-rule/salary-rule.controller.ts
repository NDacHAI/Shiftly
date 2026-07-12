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
import { CreateSalaryRuleDto } from './dto/create-salary-rule.dto';
import { SalaryRuleQueryDto } from './dto/salary-rule-query.dto';
import { UpdateSalaryRuleDto } from './dto/update-salary-rule.dto';
import {
    PaginatedSalaryRules,
    SalaryRuleResponse,
    SalaryRuleService,
} from './salary-rule.service';

@Controller('salary-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class SalaryRuleController {
    constructor(private readonly salaryRuleService: SalaryRuleService) {}

    @Post()
    @Roles(UserRole.Admin)
    create(
        @Body() payload: CreateSalaryRuleDto,
    ): Promise<SalaryRuleResponse> {
        return this.salaryRuleService.create(payload);
    }

    @Get()
    findAll(@Query() query: SalaryRuleQueryDto): Promise<PaginatedSalaryRules> {
        return this.salaryRuleService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<SalaryRuleResponse> {
        return this.salaryRuleService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateSalaryRuleDto,
    ): Promise<SalaryRuleResponse> {
        return this.salaryRuleService.update(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.salaryRuleService.remove(id);
    }

}
