import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import dataSource from '../data-source';

async function main() {
    const args = process.argv.slice(2);

    if (
        args.length === 0 ||
        args.some((arg) => arg === '-h' || arg === '--help')
    ) {
        console.log(
            'Usage: npm run migration:generate -- src/database/migrations/MigrationName',
        );
        process.exit(args.length === 0 ? 1 : 0);
    }

    await dataSource.initialize();

    try {
        const hasPendingMigrations = await dataSource.showMigrations();

        if (hasPendingMigrations) {
            console.error(
                [
                    'Cannot generate a new migration while existing migrations are pending.',
                    '',
                    'Run pending migrations first:',
                    '  npm run migration:run',
                    '',
                    'If this database was created manually and already matches the migrations, baseline it with:',
                    '  npm run migration:run:fake',
                    '',
                    'This guard prevents TypeORM from generating the whole schema again.',
                ].join('\n'),
            );
            process.exit(1);
        }
    } finally {
        await dataSource.destroy();
    }

    const cliPath = join(
        process.cwd(),
        'node_modules',
        'typeorm',
        'cli-ts-node-commonjs.js',
    );
    const result = spawnSync(
        process.execPath,
        [
            '-r',
            'tsconfig-paths/register',
            cliPath,
            'migration:generate',
            ...args,
            '-d',
            'src/database/data-source.ts',
        ],
        { stdio: 'inherit' },
    );

    process.exit(result.status ?? 1);
}

main().catch(async (error: unknown) => {
    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    console.error(error);
    process.exit(1);
});
