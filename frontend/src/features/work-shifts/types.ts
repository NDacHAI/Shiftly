export enum WorkShiftStatus {
    Inactive = 0,
    Active = 1,
}

export type WorkShift = {
    id: string;
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    isOvernight: boolean;
    workingDurationMinutes: number;
    description: string | null;
    status: WorkShiftStatus;
    createdAt: string;
    updatedAt: string;
};

export type WorkShiftPayload = {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    description?: string;
    status?: WorkShiftStatus;
};

export type UpdateWorkShiftPayload = Partial<WorkShiftPayload>;

export type WorkShiftListResponse = {
    data: WorkShift[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type WorkShiftStatusFilter = 'all' | 'active' | 'inactive';
