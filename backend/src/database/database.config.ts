// src/database/database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database.options';

export const databaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    ...createDatabaseOptions((key) => configService.getOrThrow<string>(key)),
    autoLoadEntities: true,
});
