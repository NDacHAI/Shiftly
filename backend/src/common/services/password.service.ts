import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

// Excludes look-alike characters (0/O, 1/l/I) so the password is easy to type from an email.
const TEMPORARY_PASSWORD_ALPHABET =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const TEMPORARY_PASSWORD_LENGTH = 10;

@Injectable()
export class PasswordService {
    generateTemporaryPassword(): string {
        const bytes = randomBytes(TEMPORARY_PASSWORD_LENGTH);
        let randomPart = '';

        for (const byte of bytes) {
            randomPart +=
                TEMPORARY_PASSWORD_ALPHABET[
                    byte % TEMPORARY_PASSWORD_ALPHABET.length
                ];
        }

        return `Shiftly@${randomPart}`;
    }

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
