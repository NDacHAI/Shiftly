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
import {
    AuthenticatedRequest,
    JwtAuthGuard,
} from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayCheckQueryDto } from './dto/holiday-check-query.dto';
import { HolidayQueryDto } from './dto/holiday-query.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import {
    HolidayCheckResponse,
    HolidayService,
    PaginatedHolidays,
} from './holiday.service';
import { Holiday } from './entities/holiday.entity';

@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) {}

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreateHolidayDto): Promise<Holiday> {
        return this.holidayService.create(payload);
    }

    @Get()
    findAll(
        @Query() query: HolidayQueryDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<PaginatedHolidays> {
        return this.holidayService.findAll(query, request.user.role);
    }

    @Get('check')
    checkActiveHoliday(
        @Query() query: HolidayCheckQueryDto,
    ): Promise<HolidayCheckResponse> {
        return this.holidayService.checkActiveHoliday(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<Holiday> {
        return this.holidayService.findOne(id, request.user.role);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateHolidayDto,
    ): Promise<Holiday> {
        return this.holidayService.update(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.holidayService.remove(id);
    }
}
