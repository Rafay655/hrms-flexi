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
  grade_id: number;
  grade_name: string;
  grade_code: string;
  level: number | null;
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
}

export async function getFlexiHqDashboard(): Promise<FlexiHqDashboardData> {
  const { data } = await api.get("/flexi-hq/dashboard");
  return data.data as FlexiHqDashboardData;
}
