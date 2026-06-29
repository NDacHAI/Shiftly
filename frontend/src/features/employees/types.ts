import { type Branch } from '@/features/branches/types';
import { type Position } from '@/features/positions/types';
import { type Role } from '@/constants/roles';

export type EmployeeStatus = 'Active' | 'Inactive';

export type Employee = {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    hireDate: string;
    address: string | null;
    status: EmployeeStatus;
    branches: Branch[];
    positions: Position[];
    createdAt: string;
    updatedAt: string;
};

export type EmployeePayload = {
    employeeCode?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    branchIds?: string[];
    positionIds?: string[];
    hireDate?: string;
    address?: string;
    status?: EmployeeStatus;
};

export type UpdateEmployeePayload = EmployeePayload;
export type EmployeeSortField = 'fullName' | 'createdAt' | 'employeeCode';
export type SortOrder = 'ASC' | 'DESC';

export type EmployeeListResponse = {
    data: Employee[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type EmployeeAccount = {
    id: number;
    email: string;
    role: Role;
    isActive: boolean;
    isMaster: boolean;
    mustChangePassword: boolean;
    employeeId: string | null;
};

export type CreateEmployeeAccountPayload = {
    role?: Role;
    temporaryPassword: string;
};

export type ResetEmployeePasswordPayload = {
    temporaryPassword: string;
};
