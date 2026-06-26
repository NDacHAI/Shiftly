import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@/common/enum/role.enum";
import { PaginatedWorkShifts, WorkShiftResponse, WorkShiftService } from "./work-shift.service";
import { WorkShiftQueryDto } from "./dto/work-shift-query.dto";
import { CreateWorkShiftDto } from "./dto/create-work-shift.dto";
import { UpdateWorkShiftDto } from "./dto/update-work-shift.dto";

@Controller('work-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class WorkShiftController {
    constructor(private readonly workShiftService: WorkShiftService) { }

    @Get()
    findAll(@Query() query: WorkShiftQueryDto): Promise<PaginatedWorkShifts> {
        return this.workShiftService.findAll(query)
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<WorkShiftResponse> {
        return this.workShiftService.findOne(id)
    }

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreateWorkShiftDto): Promise<WorkShiftResponse> {
        return this.workShiftService.create(payload)
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(@Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateWorkShiftDto): Promise<WorkShiftResponse> {
        return this.workShiftService.update(id, payload)
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.workShiftService.remove(id)
    }

}