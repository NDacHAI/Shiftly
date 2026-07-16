import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type AdjustAttendancePayload,
    type Attendance,
    type AttendanceListResponse,
    type AttendanceStatus,
    type ManualAttendancePayload,
    type MarkAbsentPayload,
} from '../types';

const baseAttendanceApi = '/attendances';

export type ListAttendancesParams = {
    page: number;
    limit: number;
    fromDate?: string;
    toDate?: string;
    branchId?: string;
    positionId?: string;
    employeeId?: string;
    workShiftId?: string;
    status?: AttendanceStatus;
    isLate?: boolean;
    isEarlyLeave?: boolean;
    isOvertime?: boolean;
    search?: string;
    sortBy?: 'scheduleDate' | 'scheduledStartAt' | 'createdAt' | 'status';
    sortOrder?: 'ASC' | 'DESC';
};

export async function listAttendances(
    params: ListAttendancesParams,
): Promise<AttendanceListResponse> {
    const response = await api.get<AttendanceListResponse>(baseAttendanceApi, {
        params,
    });
    return response.data;
}

export async function listMyAttendanceSchedules(
    params: ListAttendancesParams,
): Promise<AttendanceListResponse> {
    const response = await api.get<AttendanceListResponse>(
        `${baseAttendanceApi}/my-schedules`,
        { params },
    );
    return response.data;
}

export async function checkIn(workScheduleId: string): Promise<Attendance> {
    const response = await api.post<Attendance>(
        `${baseAttendanceApi}/work-schedules/${workScheduleId}/check-in`,
    );
    return response.data;
}

export async function checkOut(attendanceId: string): Promise<Attendance> {
    const response = await api.post<Attendance>(
        `${baseAttendanceApi}/${attendanceId}/check-out`,
    );
    return response.data;
}

export async function confirmAttendance(
    attendanceId: string,
): Promise<Attendance> {
    const response = await api.patch<Attendance>(
        `${baseAttendanceApi}/${attendanceId}/confirm`,
    );
    return response.data;
}

export async function adjustAttendance(
    attendanceId: string,
    payload: AdjustAttendancePayload,
): Promise<Attendance> {
    const response = await api.patch<Attendance>(
        `${baseAttendanceApi}/${attendanceId}/adjust`,
        payload,
    );
    return response.data;
}

export async function manualCreateAttendance(
    workScheduleId: string,
    payload: ManualAttendancePayload,
): Promise<Attendance> {
    const response = await api.post<Attendance>(
        `${baseAttendanceApi}/work-schedules/${workScheduleId}/manual`,
        payload,
    );
    return response.data;
}

export async function markAbsent(
    workScheduleId: string,
    payload: MarkAbsentPayload,
): Promise<Attendance> {
    const response = await api.post<Attendance>(
        `${baseAttendanceApi}/work-schedules/${workScheduleId}/mark-absent`,
        payload,
    );
    return response.data;
}

export function getAttendanceErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Could not process attendance. Please try again.',
    );
}

export function getAttendanceErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
