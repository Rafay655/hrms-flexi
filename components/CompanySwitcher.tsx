"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { companyService } from "@/services/company.service";
import { useAppSelector } from "@/store/hooks";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const COMPANY_KEY = "companyId";

// The companies API returns the identifier as `id` (a UUID string); there is
// no separate `uuid` key. That id is what the backend expects as X-Company-ID.
type CompanyRow = { id: string; company_name?: string; name?: string };

/**
 * CompanySwitcher (M-2)
 *
 * A super-admin has no company of their own, so company-scoped endpoints
 * (employees, onboarding form, time-sync, …) reject their requests with
 * 422 "X-Company-ID header is required". This switcher lets them pick which
 * company to operate on; the choice is stored in localStorage under
 * `companyId`, which lib/api.ts sends as the X-Company-ID header on every
 * request.
 *
 * Hidden for regular users — they are already pinned to their own company.
 */
export default function CompanySwitcher() {
  const user = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = user?.user_type === "super_admin";

  const { data, isLoading } = useQuery({
    queryKey: ["companies", "switcher"],
    queryFn: () => companyService.getAll({ per_page: 100 }),
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const companies = React.useMemo(() => {
    const rows = (data as { data?: CompanyRow[] } | undefined)?.data ?? [];
    return rows.map((c) => ({
      uuid: c.id,
      name: c.company_name ?? c.name ?? "Company",
    }));
  }, [data]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  React.useEffect(() => {
    // localStorage is unavailable during SSR, so the persisted company can only
    // be read after mount — the intended use of an effect (sync with an external
    // store), not a render cascade.
    if (typeof window === "undefined") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(localStorage.getItem(COMPANY_KEY));
  }, []);

  // Default: a super-admin with nothing selected gets the first company, then a
  // reload so every in-flight query re-issues with the X-Company-ID header.
  React.useEffect(() => {
    if (!isSuperAdmin || typeof window === "undefined") return;
    if (!localStorage.getItem(COMPANY_KEY) && companies.length > 0) {
      localStorage.setItem(COMPANY_KEY, companies[0].uuid);
      window.location.reload();
    }
  }, [isSuperAdmin, companies]);

  if (!isSuperAdmin) return null;

  const active = companies.find((c) => c.uuid === activeId);

  const switchTo = (uuid: string) => {
    if (uuid === activeId || typeof window === "undefined") return;
    localStorage.setItem(COMPANY_KEY, uuid);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Switch active company"
          className="hidden md:flex items-center gap-2 h-10 max-w-[200px] rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm hover:text-[#1E1B4B]"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {active?.name ?? (isLoading ? "Loading…" : "Select company")}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-white">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
          Active company
        </div>
        <DropdownMenuSeparator />
        {companies.length === 0 ? (
          <DropdownMenuItem disabled>
            {isLoading ? "Loading…" : "No companies found"}
          </DropdownMenuItem>
        ) : (
          companies.map((c) => (
            <DropdownMenuItem
              key={c.uuid}
              onClick={() => switchTo(c.uuid)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{c.name}</span>
              {c.uuid === activeId && (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
