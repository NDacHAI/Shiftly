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
import { CreateRewardPenaltyCatalogDto } from './dto/create-reward-penalty-catalog.dto';
import { RewardPenaltyCatalogQueryDto } from './dto/reward-penalty-catalog-query.dto';
import { UpdateRewardPenaltyCatalogDto } from './dto/update-reward-penalty-catalog.dto';
import { RewardPenaltyCatalog } from './entities/reward-penalty-catalog.entity';
import {
    PaginatedRewardPenaltyCatalogs,
    RewardPenaltyCatalogService,
} from './reward-penalty-catalog.service';

@Controller('reward-penalty-catalogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class RewardPenaltyCatalogController {
    constructor(
        private readonly catalogService: RewardPenaltyCatalogService,
    ) {}

    @Post()
    @Roles(UserRole.Admin)
    create(
        @Body() payload: CreateRewardPenaltyCatalogDto,
    ): Promise<RewardPenaltyCatalog> {
        return this.catalogService.create(payload);
    }

    @Get()
    findAll(
        @Query() query: RewardPenaltyCatalogQueryDto,
    ): Promise<PaginatedRewardPenaltyCatalogs> {
        return this.catalogService.findAll(query);
    }

    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<RewardPenaltyCatalog> {
        return this.catalogService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.Admin)
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() payload: UpdateRewardPenaltyCatalogDto,
    ): Promise<RewardPenaltyCatalog> {
        return this.catalogService.update(id, payload);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        return this.catalogService.remove(id);
    }
}
