"use client";

import { useEffect, useState } from "react";
import { companyService } from "@/services/company.service";
import type {
  Company,
  PaginationMeta,
} from "@/types/company";

type UseCompaniesParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

export function useCompanies(params: UseCompaniesParams) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      try {
        setError(null);

        if (companies.length === 0) {
          setIsLoading(true);
        } else {
          setIsFetching(true);
        }

        const response = await companyService.getAll(params);

        if (cancelled) return;

        setCompanies(response.data);
        setMeta(response.meta);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Failed to fetch companies"
        );
      } finally {
        if (cancelled) return;

        setIsLoading(false);
        setIsFetching(false);
      }
    };

    fetchCompanies();

    return () => {
      cancelled = true;
    };
  }, [params.page, params.per_page, params.search]);

  return {
    companies,
    meta,
    isLoading,
    isFetching,
    error,
  };
}