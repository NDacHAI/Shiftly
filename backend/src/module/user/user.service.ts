import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { PasswordService } from '@/common/services/password.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type CreateUserPayload = {
    email: string;
    password: string;
    role?: UserRole;
    employeeId?: string | null;
    mustChangePassword?: boolean;
    isMaster?: boolean;
};

export type UserResponse = Omit<User, 'password' | 'refreshTokenHash'>;

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
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

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email: email.trim().toLowerCase() },
        });
    }

    async findEntityById(id: number): Promise<User> {
        return this.findUserById(id);
    }

    async updateRefreshTokenHash(
        id: number,
        refreshToken: string,
    ): Promise<void> {
        await this.userRepository.update(id, {
            refreshTokenHash: await this.passwordService.hash(refreshToken),
        });
    }

    async clearRefreshTokenHash(id: number): Promise<void> {
        await this.userRepository.update(id, {
            refreshTokenHash: null,
        });
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
            password: await this.passwordService.hash(payload.password),
            role: payload.role ?? UserRole.User,
            employeeId: payload.employeeId ?? null,
            mustChangePassword: payload.mustChangePassword ?? false,
            isMaster: payload.isMaster ?? false,
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
            user.password = await this.passwordService.hash(payload.password);
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

    async findByEmployeeId(employeeId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { employeeId },
        });
    }

    async ensureEmployeeHasNoAccount(employeeId: string): Promise<void> {
        const hasAccount = await this.findByEmployeeId(employeeId);

        if (hasAccount) {
            throw new ConflictException('Employee already has an account');
        }
    }

    async findAccountByEmployeeId(
        employeeId: string,
    ): Promise<UserResponse | null> {
        const user = await this.findByEmployeeId(employeeId);

        return user ? this.toResponse(user) : null;
    }

    async resetEmployeePassword(
        employeeId: string,
        temporaryPassword: string,
    ): Promise<UserResponse> {
        const user = await this.findByEmployeeId(employeeId);

        if (!user) {
            throw new NotFoundException('Employee account not found');
        }

        user.password = await this.passwordService.hash(temporaryPassword);
        user.mustChangePassword = true;
        user.refreshTokenHash = null;

        const savedUser = await this.userRepository.save(user);
        return this.toResponse(savedUser);
    }

    async changePassword(id: number, newPassword: string): Promise<UserResponse> {
        const user = await this.findUserById(id);

        user.password = await this.passwordService.hash(newPassword);
        user.mustChangePassword = false;
        user.refreshTokenHash = null;

        const savedUser = await this.userRepository.save(user);
        return this.toResponse(savedUser);
    }

    private async findUserById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    private toResponse(user: User): UserResponse {
        const { password, refreshTokenHash, ...response } = user;

        void password;
        void refreshTokenHash;

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
