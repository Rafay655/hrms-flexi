import { api } from "@/lib/api";

export interface FlexiHqDashboardStats {
  total_companies: number;
  active_branches: number;
  total_departments: number;
  total_positions: number;
  total_divisions: number;
}

export interface FlexiHqOrgSnapshotEntry {
  company: { id: number; company_name: string; company_code: string; logo_path: string | null };
  divisions_count: number;
  dept_count: number;
  desig_count: number;
  branches_count: number;
}

export interface FlexiHqHeadcountByGrade {
  grade_id: number | null;
  grade_name: string;
  grade_code: string;
  level: string | number | null;
  headcount: number;
}

export interface FlexiHqBranchDistribution {
  type: string;
  label: string;
  count: number;
}

export interface FlexiHqDashboardData {
  stats: FlexiHqDashboardStats;
  org_snapshot: FlexiHqOrgSnapshotEntry[];
  headcount_by_grade: FlexiHqHeadcountByGrade[];
  branch_distribution: FlexiHqBranchDistribution[];
  forms?: { total_fields: number; breakdown: { key: string; label: string; count: number }[] };
  workflows?: { active: number; items: { name: string; steps: number; status: "Active" | "Draft" }[] };
  attention?: { key: string; label: string; note: string; href: string; available: boolean; count: number | null }[];
}

export async function getFlexiHqDashboard(signal?: AbortSignal): Promise<FlexiHqDashboardData> {
  const { data } = await api.get("/flexi-hq/dashboard", { signal });
  if (data.success === false) throw data;
  if (!data.data?.stats || !Array.isArray(data.data.org_snapshot)) throw new Error("Dashboard data is unavailable.");
  return data.data as FlexiHqDashboardData;
}
