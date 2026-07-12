export enum HolidayStatus {
    Inactive = 0,
    Active = 1,
}

export type Holiday = {
    id: string;
    name: string;
    holidayDate: string;
    description: string | null;
    status: HolidayStatus;
    createdAt: string;
    updatedAt: string;
};

export type HolidayPayload = {
    name: string;
    holidayDate: string;
    description?: string;
    status?: HolidayStatus;
};

export type UpdateHolidayPayload = Partial<HolidayPayload>;

export type HolidaySortField =
    | 'name'
    | 'holidayDate'
    | 'status'
    | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';

export type HolidayListResponse = {
    data: Holiday[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type HolidayCheckResponse = {
    isHoliday: boolean;
    holiday: Holiday | null;
};

export type HolidayStatusFilter = 'all' | 'active' | 'inactive';
