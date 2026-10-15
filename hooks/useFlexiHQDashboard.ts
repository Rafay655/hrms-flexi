// hooks/useFlexiHQDashboard.ts
import { useState, useEffect } from "react";
import {api} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*                               TYPES                                        */
/* -------------------------------------------------------------------------- */

export interface ApiStats {
  total_companies:  number;
  active_branches:  number;
  total_departments: number;
  total_positions:  number;
  total_divisions:  number;
}

export interface Division    { id: number; name: string; code: string }
export interface Department  { id: number; name: string; code: string; division_id: number }
export interface Designation { id: number; title: string; code: string; department_id: number }
export interface Branch      { id: number; name: string; branch_type: "head_office" | "branch" }

export interface OrgSnapshot {
  company: {
    id:           number;
    company_name: string;
    company_code: string;
    logo_path:    string;
  };
  divisions_count:  number;
  dept_count:       number;
  desig_count:      number;
  branches_count:   number;
  divisions:        Division[];
  departments:      Department[];
  designations:     Designation[];
  branches:         Branch[];
}

export interface GradeHeadcount {
  grade_id:   number;
  grade_name: string;
  grade_code: string;
  level:      string;
  headcount:  number;
}

export interface BranchDistribution {
  type:  string;
  label: string;
  count: number;
}

export interface DashboardData {
  stats:               ApiStats;
  org_snapshot:        OrgSnapshot[];
  headcount_by_grade:  GradeHeadcount[];
  branch_distribution: BranchDistribution[];
}

interface UseDashboardReturn {
  data:      DashboardData | null;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

/* -------------------------------------------------------------------------- */
/*                               HOOK                                         */
/* -------------------------------------------------------------------------- */

export function useFlexiHQDashboard(): UseDashboardReturn {
  const [data,      setData]      = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [trigger,   setTrigger]   = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: json } = await api.get<{ success: boolean; data: DashboardData }>(
          "/flexi-hq/dashboard"
        );

        if (!cancelled) {
          if (json.success) setData(json.data);
          else throw new Error("API returned success: false");
        }
      } catch (err: any) {
        if (!cancelled) {
          const message =
            err?.response?.data?.message ?? err?.message ?? "Failed to load dashboard";
          setError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true };
  }, [trigger]);

  const refetch = () => setTrigger((n) => n + 1);

  return { data, isLoading, error, refetch };
}