import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const scrypt = promisify(scryptCallback);

export type CreateUserPayload = {
    email: string;
    password: string;
    role?: UserRole;
};

export type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<UserResponse[]> {
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' },
        });

        return users.map((user) => this.toResponse(user));
    }

    async findOne(id: number): Promise<UserResponse> {
        const user = await this.findUserById(id);

        return this.toResponse(user);
    }

    async create(payload: CreateUserPayload): Promise<UserResponse> {
        const email = payload.email.trim().toLowerCase();
        const existedUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existedUser) {
            throw new ConflictException('Email already exists');
        }

        const user = this.userRepository.create({
            email,
            password: await this.hashPassword(payload.password),
            role: payload.role ?? UserRole.User,
        });

        const savedUser = await this.userRepository.save(user);
        return this.toResponse(savedUser);
    }

    async update(id: number, payload: UpdateUserDto): Promise<UserResponse> {
        if (
            payload.role === undefined &&
            payload.isActive === undefined &&
            payload.password === undefined
        ) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        const user = await this.findUserById(id);

        if (payload.role !== undefined) {
            user.role = payload.role;
        }

        if (payload.isActive !== undefined) {
            user.isActive = payload.isActive;
        }

        if (payload.password !== undefined) {
            user.password = await this.hashPassword(payload.password);
        }

        const savedUser = await this.userRepository.save(user);
        return this.toResponse(savedUser);
    }

    async remove(id: number): Promise<void> {
        const user = await this.findUserById(id);

        try {
            await this.userRepository.remove(user);
        } catch (error) {
            if (this.isForeignKeyConstraintError(error)) {
                throw new ConflictException(
                    'Cannot delete user because it is referenced by other data',
                );
            }

            throw error;
        }
    }

    private async findUserById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const hash = (await scrypt(password, salt, 64)) as Buffer;

        return `${salt}:${hash.toString('hex')}`;
    }

    private toResponse(user: User): UserResponse {
        const { password, ...response } = user;

        void password;

        return response;
    }

    private isForeignKeyConstraintError(error: unknown): boolean {
        if (!(error instanceof QueryFailedError)) {
            return false;
        }

        const driverError = error.driverError as { code?: string; errno?: number };

        return (
            driverError.code === 'ER_ROW_IS_REFERENCED_2' ||
            driverError.errno === 1451
        );
    }
}
