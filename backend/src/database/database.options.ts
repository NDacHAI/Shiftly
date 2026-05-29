type DatabaseEnvGetter = (key: string, required?: boolean) => string | undefined;

export const createDatabaseOptions = (getEnv: DatabaseEnvGetter) => {
    const sslEnabled = getEnv('DB_SSL', false) === 'true';
    const sslCa = getEnv('DB_SSL_CA', false);

    return {
        type: 'mysql' as const,
        host: getEnv('DB_HOST'),
        port: Number(getEnv('DB_PORT')),
        username: getEnv('DB_USER'),
        password: getEnv('DB_PASSWORD'),
        database: getEnv('DB_NAME'),
        synchronize: false,
        timezone: '+07:00',
        ...(sslEnabled && {
            ssl: {
                ...(sslCa && { ca: sslCa.replace(/\\n/g, '\n') }),
                rejectUnauthorized:
                    getEnv('DB_SSL_REJECT_UNAUTHORIZED', false) !== 'false',
            },
        }),
    };
};
