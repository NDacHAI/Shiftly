import { type Department } from '@/features/departments/types';
import { type Position } from '@/features/positions/types';

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
    departments: Department[];
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
    departmentIds: string[];
    positionIds: string[];
    hireDate: string;
    address?: string;
    status: EmployeeStatus;
};

export type UpdateEmployeePayload = Omit<EmployeePayload, 'employeeCode'>;
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
