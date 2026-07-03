import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      successMessage?: string;
      errorMessage?: string;
      silent?: boolean;
      silentSuccess?: boolean;
    };
    queryMeta: {
      silent?: boolean;
      errorMessage?: string;
    };
  }
}
