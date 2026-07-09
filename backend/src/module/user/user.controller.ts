import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse, UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
        return this.userService.create(createUserDto);
    }

    @Get()
    findAll(): Promise<UserResponse[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponse> {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponse> {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.userService.remove(id);
    }
}
