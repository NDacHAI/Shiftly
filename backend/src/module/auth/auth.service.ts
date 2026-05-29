import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { UserRole } from '@/common/enum/role.enum';
import { PasswordService } from '@/common/services/password.service';
import { UserResponse, UserService } from '@/module/user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, AuthUser, JwtPayload } from './types/auth-user.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async register(payload: RegisterDto): Promise<AuthResponse> {
        const user = await this.userService.create({
            email: payload.email,
            password: payload.password,
            role: UserRole.User,
        });

        return this.createAuthResponse(user);
    }

    async login(payload: LoginDto): Promise<AuthResponse> {
        const user = await this.userService.findByEmail(payload.email);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Email or password is invalid');
        }

        const isPasswordValid = await this.passwordService.compare(
            payload.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email or password is invalid');
        }

        return this.createAuthResponse(user);
    }

    async me(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.userService.findOne(payload.sub);

        return this.toAuthUser(user);
    }

    async refresh(payload: RefreshTokenDto): Promise<AuthResponse> {
        const decodedPayload = await this.verifyRefreshToken(
            payload.refreshToken,
        );
        const user = await this.userService.findEntityById(decodedPayload.sub);

        if (!user.isActive || !user.refreshTokenHash) {
            throw new UnauthorizedException('Refresh token is invalid');
        }

        const isRefreshTokenValid = await this.passwordService.compare(
            payload.refreshToken,
            user.refreshTokenHash,
        );

        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Refresh token is invalid');
        }

        return this.createAuthResponse(user);
    }

    async logout(payload: JwtPayload): Promise<void> {
        await this.userService.clearRefreshTokenHash(payload.sub);
    }

    private async createAuthResponse(user: UserResponse): Promise<AuthResponse> {
        const tokenPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(tokenPayload);
        const refreshToken = await this.signRefreshToken(tokenPayload);

        await this.userService.updateRefreshTokenHash(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: this.toAuthUser(user),
        };
    }

    private async signRefreshToken(payload: JwtPayload): Promise<string> {
        const expiresIn =
            this.configService.get<string>('JWT_REFRESH_EXPIRES') ?? '30d';

        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn:
                expiresIn as NonNullable<
                    JwtModuleOptions['signOptions']
                >['expiresIn'],
        });
    }

    private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
        try {
            return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
            });
        } catch {
            throw new UnauthorizedException('Refresh token is invalid');
        }
    }

    private toAuthUser(user: UserResponse): AuthUser {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        };
    }
}
