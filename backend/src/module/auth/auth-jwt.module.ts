import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

@Module({
    imports: [
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
    exports: [JwtModule],
})
export class AuthJwtModule {}
