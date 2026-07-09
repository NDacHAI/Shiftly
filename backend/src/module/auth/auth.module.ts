import { Module } from '@nestjs/common';
import { PasswordService } from '@/common/services/password.service';
import { UserModule } from '@/module/user/user.module';
import { AuthJwtModule } from './auth-jwt.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
    imports: [
        UserModule,
        AuthJwtModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard, RolesGuard, PasswordService],
    exports: [AuthJwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
