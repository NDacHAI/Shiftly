import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@/common/enum/role.enum';
import { Roles } from './decorators/roles.decorator';
import {
    AuthenticatedRequest,
    JwtAuthGuard,
} from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthResponse, AuthUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.Admin)
    register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
    ): Promise<AuthResponse> {
        return this.authService.refresh(refreshTokenDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Req() request: AuthenticatedRequest): Promise<void> {
        return this.authService.logout(request.user);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    changePassword(
        @Req() request: AuthenticatedRequest,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        return this.authService.changePassword(
            request.user,
            changePasswordDto,
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() request: AuthenticatedRequest): Promise<AuthUser> {
        return this.authService.me(request.user);
    }
}
