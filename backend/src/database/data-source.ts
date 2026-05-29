import 'dotenv/config';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from './database.options';

export default new DataSource({
    ...createDatabaseOptions((key, required = true) => {
        const value = process.env[key];

        if (required && !value) {
            throw new Error(`Missing environment variable: ${key}`);
        }

        return value;
    }),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
