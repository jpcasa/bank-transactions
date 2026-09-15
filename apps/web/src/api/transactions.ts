import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { paths } from "./schema";

type ListQuery = NonNullable<paths["/transactions"]["get"]["parameters"]["query"]>;
export type TransactionInput = paths["/transactions"]["post"]["requestBody"]["content"]["application/json"];
export type Transaction = paths["/transactions/{transactionId}"]["get"]["responses"][200]["content"]["application/json"];
export type SortField = NonNullable<ListQuery["sort"]>;
export type SortOrder = NonNullable<ListQuery["order"]>;

export interface ListParams {
  page: number;
  pageSize: number;
  sort: SortField;
  order: SortOrder;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function toError(error: unknown, response: Response): ApiError {
  const body = error as { error?: { code?: string; message?: string } } | undefined;
  return new ApiError(
    body?.error?.message ?? `Request failed (${response.status})`,
    response.status,
    body?.error?.code,
  );
}

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: ListParams) => ["transactions", "list", params] as const,
};

export function useTransactions(params: ListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/transactions", {
        params: { query: params },
        signal,
      });
      if (error !== undefined || data === undefined) throw toError(error, response);
      return data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransactionInput): Promise<Transaction> => {
      const { data, error, response } = await api.POST("/transactions", { body });
      if (error !== undefined || data === undefined) throw toError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId, body }: { transactionId: string; body: TransactionInput }): Promise<Transaction> => {
      const { data, error, response } = await api.PUT("/transactions/{transactionId}", {
        params: { path: { transactionId } },
        body,
      });
      if (error !== undefined || data === undefined) throw toError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: string): Promise<void> => {
      const { error, response } = await api.DELETE("/transactions/{transactionId}", {
        params: { path: { transactionId } },
      });
      if (error !== undefined || !response.ok) throw toError(error, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
