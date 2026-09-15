import { useCallback, useState } from "react";
import type { ListParams, SortField, SortOrder } from "../api/transactions";

export const PAGE_SIZES = [10, 25, 50, 100] as const;
const SORTS: SortField[] = ["date", "amount", "description"];
const DEFAULTS: ListParams = { page: 1, pageSize: 25, sort: "date", order: "desc" };

export function readListParams(search: string): ListParams {
  const q = new URLSearchParams(search);
  const page = Number(q.get("page"));
  const pageSize = Number(q.get("pageSize"));
  const sort = q.get("sort") as SortField | null;
  const order = q.get("order") as SortOrder | null;
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULTS.page,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULTS.pageSize,
    sort: sort && SORTS.includes(sort) ? sort : DEFAULTS.sort,
    order: order === "asc" || order === "desc" ? order : DEFAULTS.order,
  };
}

/** Sort + pagination state mirrored into the URL query string. */
export function useListParams() {
  const [params, setParams] = useState<ListParams>(() => readListParams(window.location.search));

  const update = useCallback((patch: Partial<ListParams>) => {
    setParams((prev) => {
      const next = { ...prev, ...patch };
      const q = new URLSearchParams(window.location.search);
      q.set("page", String(next.page));
      q.set("pageSize", String(next.pageSize));
      q.set("sort", next.sort);
      q.set("order", next.order);
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}${window.location.hash}`);
      return next;
    });
  }, []);

  return [params, update] as const;
}
