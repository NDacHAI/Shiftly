import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PasswordService } from '@/common/services/password.service';
import { UserModule } from '@/module/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
    imports: [
        UserModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService): JwtModuleOptions => {
                const expiresIn = configService.get<string>('JWT_EXPIRES') ?? '7d';
                const signOptions: JwtModuleOptions['signOptions'] = {
                    expiresIn:
                        expiresIn as NonNullable<
                            JwtModuleOptions['signOptions']
                        >['expiresIn'],
                };

                return {
                    secret: configService.getOrThrow<string>('JWT_SECRET'),
                    signOptions,
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard, RolesGuard, PasswordService],
    exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
