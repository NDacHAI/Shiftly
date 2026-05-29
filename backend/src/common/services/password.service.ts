import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
    async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const hash = (await scrypt(password, salt, 64)) as Buffer;

        return `${salt}:${hash.toString('hex')}`;
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        const [salt, storedHash] = hashedPassword.split(':');

        if (!salt || !storedHash) {
            return false;
        }

        const hash = (await scrypt(password, salt, 64)) as Buffer;
        const storedHashBuffer = Buffer.from(storedHash, 'hex');

        if (hash.length !== storedHashBuffer.length) {
            return false;
        }

        return timingSafeEqual(hash, storedHashBuffer);
    }
}
