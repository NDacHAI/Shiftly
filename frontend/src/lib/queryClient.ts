export const queryClientConfig = {
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30_000,
        },
    },
};
