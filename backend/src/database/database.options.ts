type DatabaseEnvGetter = (key: string) => string;

export const createDatabaseOptions = (getEnv: DatabaseEnvGetter) => ({
    type: 'mysql' as const,
    host: getEnv('DB_HOST'),
    port: Number(getEnv('DB_PORT')),
    username: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
    database: getEnv('DB_NAME'),
    synchronize: false,
    timezone: '+07:00',
});
