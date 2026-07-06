export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};

type PaginationParams = {
    page?: number;
    limit?: number;
};

type MaybePaginatedPayload<T> = {
    data?: T[] | MaybePaginatedPayload<T>;
    items?: T[];
    meta?: Partial<PaginationMeta>;
    total?: number;
    totalPages?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getData<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (!isRecord(payload)) return [];

    const typedPayload = payload as MaybePaginatedPayload<T>;

    if (Array.isArray(typedPayload.data)) return typedPayload.data;
    if (Array.isArray(typedPayload.items)) return typedPayload.items;

    return getData<T>(typedPayload.data);
}

function getMetaSource<T>(payload: unknown): MaybePaginatedPayload<T> {
    if (!isRecord(payload)) return {};

    const typedPayload = payload as MaybePaginatedPayload<T>;
    if (typedPayload.meta) return typedPayload;

    if (isRecord(typedPayload.data)) {
        return getMetaSource<T>(typedPayload.data);
    }

    return typedPayload;
}

export function normalizePaginatedResponse<T>(
    payload: unknown,
    params: PaginationParams = {},
): PaginatedResponse<T> {
    const data = getData<T>(payload);
    const metaSource = getMetaSource<T>(payload);
    const page = metaSource.meta?.page ?? params.page ?? 1;
    const limit = metaSource.meta?.limit ?? params.limit ?? data.length;
    const total = metaSource.meta?.total ?? metaSource.total ?? data.length;
    const totalPages =
        metaSource.meta?.totalPages ??
        metaSource.totalPages ??
        (limit > 0 ? Math.ceil(total / limit) : 0);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}
