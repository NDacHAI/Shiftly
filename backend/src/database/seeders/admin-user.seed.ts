import 'dotenv/config';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { UserRole } from '@/common/enum/role.enum';
import { User } from '@/module/user/entities/user.entity';
import dataSource from '../data-source';

const scrypt = promisify(scryptCallback);
const adminEmail = 'admin@admin.com';
const adminPassword = 'admin123';

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
}

async function seedAdminUser(): Promise<void> {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        existingAdmin.role = UserRole.Admin;
        existingAdmin.isActive = true;
        existingAdmin.password = await hashPassword(adminPassword);

        await userRepository.save(existingAdmin);
        return;
    }

    await userRepository.save(
        userRepository.create({
            email: adminEmail,
            password: await hashPassword(adminPassword),
            role: UserRole.Admin,
            isActive: true,
        }),
    );
}

seedAdminUser()
    .then(async () => {
        await dataSource.destroy();
        console.log(`Seeded admin user: ${adminEmail}`);
    })
    .catch(async (error) => {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }

        console.error(error);
        process.exit(1);
    });
