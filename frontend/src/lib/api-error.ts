import { AxiosError } from 'axios';

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
