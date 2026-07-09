import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { PasswordService } from '@/common/services/password.service';
import { AuthJwtModule } from '@/module/auth/auth-jwt.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User]), AuthJwtModule],
    controllers: [UserController],
    providers: [UserService, PasswordService],
    exports: [UserService, PasswordService],
})
export class UserModule {}
