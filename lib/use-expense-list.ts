"use client";



import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Paginated } from "@/types/expense-hub";

/** Debounce a value (setState runs inside an async timeout — no cascading-render lint). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface UseExpenseListOptions {
  perPage?: number;
  /** Extra filter params merged into every request. Changing these resets to page 1. */
  filters?: Record<string, unknown>;
}

export function useExpenseList<T>(
  baseKey: unknown[],
  fetcher: (params: Record<string, unknown>) => Promise<Paginated<T>>,
  opts: UseExpenseListOptions = {},
) {
  const { perPage = 15, filters = {} } = opts;
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const filterKey = JSON.stringify(filters);

  const query = useQuery({
    queryKey: [...baseKey, page, debouncedSearch, filterKey],
    queryFn: () =>
      fetcher({ page, per_page: perPage, ...(debouncedSearch ? { search: debouncedSearch } : {}), ...filters }),
    placeholderData: keepPreviousData,
  });

  // Searching or changing a filter resets to page 1 (callers use these setters).
  const setSearch = (v: string) => {
    setSearchRaw(v);
    setPage(1);
  };
  const resetPage = () => setPage(1);

  return {
    items: query.data?.items ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    page,
    setPage,
    resetPage,
    search,
    setSearch,
  };
}
