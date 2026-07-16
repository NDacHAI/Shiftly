import { AxiosError } from 'axios';
import { type I18nKey } from '@/i18n';

type ApiErrorResponse = {
    message?: string | string[];
};

const defaultFallbackMessage =
    'Không thể xử lý yêu cầu. Vui lòng thử lại.';

export function getApiErrorMessage(
    error: unknown,
    fallbackMessage = defaultFallbackMessage,
): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorResponse | undefined;
        const message = data?.message;

        if (Array.isArray(message)) {
            return message.join(', ');
        }

        if (message) {
            return message;
        }
    }

    return fallbackMessage;
}

const apiErrorKeys: Record<string, I18nKey> = {
    'At least one field must be provided': 'common.apiErrors.emptyPayload',
    'At least one field must be provided for update':
        'common.apiErrors.emptyPayload',
    'Branch code already exists': 'common.apiErrors.branchCodeExists',
    'Branch name already exists': 'common.apiErrors.branchNameExists',
    'Branch cannot be deleted because related data exists':
        'common.apiErrors.branchDeleteRelated',
    'Branch not found': 'common.apiErrors.branchNotFound',
    'Branch does not exist': 'common.apiErrors.branchNotFound',
    'Branch is not active': 'common.apiErrors.branchInactive',
    'Position code already exists': 'common.apiErrors.positionCodeExists',
    'Position not found': 'common.apiErrors.positionNotFound',
    'Position does not exist': 'common.apiErrors.positionNotFound',
    'Position is not active': 'common.apiErrors.positionInactive',
    'Employee not found': 'common.apiErrors.employeeNotFound',
    'Employee profile not found': 'common.apiErrors.employeeNotFound',
    'Employee code already exists': 'common.apiErrors.employeeCodeExists',
    'Employee email already exists': 'common.apiErrors.employeeEmailExists',
    'Employee is required': 'common.apiErrors.employeeRequired',
    'Employee is not active': 'common.apiErrors.employeeInactive',
    'Employee account is not linked': 'common.apiErrors.employeeNotLinked',
    'Employee already has an account': 'common.apiErrors.employeeAccountExists',
    'Employee account not found': 'common.apiErrors.employeeAccountNotFound',
    'Email already exists': 'common.apiErrors.emailExists',
    'User not found': 'common.apiErrors.userNotFound',
    'Work shift not found': 'common.apiErrors.workShiftNotFound',
    'Work shift code already exists': 'common.apiErrors.workShiftCodeExists',
    'Work shift name already exists': 'common.apiErrors.workShiftNameExists',
    'Work shift cannot be deleted because related data exists':
        'common.apiErrors.workShiftDeleteRelated',
    'Work shift is not active': 'common.apiErrors.workShiftInactive',
    'The start time must be different from the end time':
        'common.apiErrors.shiftTimeDifferent',
    'Break time cannot be negative': 'common.apiErrors.breakNegative',
    'Break time must be less than the total shift duration':
        'common.apiErrors.breakTooLong',
    'Work schedule not found': 'common.apiErrors.workScheduleNotFound',
    'End date cannot be before start date': 'common.apiErrors.endDateBeforeStart',
    'Start date and end date are required': 'common.apiErrors.dateRangeRequired',
    'Holiday not found': 'common.apiErrors.holidayNotFound',
    'Holiday date already exists': 'common.apiErrors.holidayDateExists',
    'Holiday cannot be deleted because related data exists':
        'common.apiErrors.holidayDeleteRelated',
    'Salary rule not found': 'common.apiErrors.salaryRuleNotFound',
    'Salary rule version not found': 'common.apiErrors.salaryRuleVersionNotFound',
    'Current salary rule version not found':
        'common.apiErrors.salaryRuleVersionNotFound',
    'Salary rule code already exists': 'common.apiErrors.salaryRuleCodeExists',
    'Default salary rule code already exists':
        'common.apiErrors.salaryRuleCodeExists',
    'Default salary rules cannot be deleted':
        'common.apiErrors.defaultSalaryRuleDelete',
    'Salary rule already exists': 'common.apiErrors.salaryRuleExists',
    'Salary rule cannot be deleted because related data exists':
        'common.apiErrors.salaryRuleDeleteRelated',
    'Reward penalty catalog not found': 'common.apiErrors.rewardCatalogNotFound',
    'Reward penalty catalog code already exists':
        'common.apiErrors.rewardCatalogCodeExists',
    'Reward penalty catalog already exists':
        'common.apiErrors.rewardCatalogExists',
    'Reward penalty catalog cannot be deleted because related data exists':
        'common.apiErrors.rewardCatalogDeleteRelated',
    'Leave request not found': 'common.apiErrors.leaveRequestNotFound',
    'At least one work schedule is required':
        'common.apiErrors.workScheduleRequired',
    'Some work schedules were not found':
        'common.apiErrors.someWorkSchedulesNotFound',
    'Leave time range is required': 'common.apiErrors.leaveTimeRangeRequired',
    'End time must be after start time': 'common.apiErrors.endTimeAfterStart',
    'Reason is required': 'common.apiErrors.reasonRequired',
    'Time is required': 'common.apiErrors.timeRequired',
    'Shift request not found': 'common.apiErrors.shiftRequestNotFound',
    'Insufficient permissions': 'common.apiErrors.forbidden',
    'Missing access token': 'common.apiErrors.unauthorized',
    'Invalid access token': 'common.apiErrors.unauthorized',
    'Email or password is invalid': 'common.apiErrors.invalidCredentials',
    'Current password is invalid': 'common.apiErrors.currentPasswordInvalid',
};

export function getApiErrorKey(
    error: unknown,
    fallback: I18nKey = 'common.apiErrors.generic',
): I18nKey {
    const message = getApiErrorMessage(error, '');

    if (apiErrorKeys[message]) return apiErrorKeys[message];

    if (message.includes('cannot be deleted because related data exists')) {
        return 'common.apiErrors.deleteRelated';
    }

    return fallback;
}
