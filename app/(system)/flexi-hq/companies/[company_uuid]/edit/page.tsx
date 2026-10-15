"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";

import CompanyStepper from "../../new/page";
import { companyService } from "@/services/company.service";
import type { Company } from "@/types/company";

export default function EditCompanyPage() {
  const params = useParams();

  const companyUuid = params.company_uuid as string;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!companyUuid) return;

    let cancelled = false;

    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await companyService.getById(companyUuid);

        if (cancelled) return;

        setCompany(response);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Failed to fetch company detail"
        );
      } finally {
        if (cancelled) return;

        setIsLoading(false);
      }
    };

    fetchCompany();

    return () => {
      cancelled = true;
    };
  }, [companyUuid]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-800" />
          <p className="text-sm font-medium text-brand-800">
            Loading company...
          </p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Building2 className="h-10 w-10 text-brand-300" />
          <p className="text-sm font-semibold text-red-600">
            {error ?? "Company not found"}
          </p>
          <p className="text-xs text-brand-600">
            Please check the company UUID or API response.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CompanyStepper
      initialCompanyUuid={companyUuid}
      initialData={company}
    />
  );
}