import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreatePositionDto } from './dto/create-position.dto';
import { PositionQueryDto } from './dto/position-query.dto';
import { UpdatePositionStatusDto } from './dto/update-position-status.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';
import { PaginatedPositions, PositionService } from './position.service';

@Controller('positions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class PositionController {
    constructor(private readonly positionService: PositionService) {}

    @Get()
    findAll(@Query() query: PositionQueryDto): Promise<PaginatedPositions> {
        return this.positionService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Position> {
        return this.positionService.findOne(id);
    }

    @Post()
    @Roles(UserRole.Admin)
    create(@Body() payload: CreatePositionDto): Promise<Position> {
        return this.positionService.create(payload);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdatePositionDto,
    ): Promise<Position> {
        return this.positionService.update(id, payload);
    }

    @Patch(':id/status')
    @Roles(UserRole.Admin)
    updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdatePositionStatusDto,
    ): Promise<Position> {
        return this.positionService.updateStatus(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.positionService.remove(id);
    }
}
