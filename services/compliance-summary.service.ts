import { api } from "@/lib/api";

export interface ComplianceSummary {
  compliance_seal: number;
  metrics: {
    pending_remittances: number;
    min_wage_violations: number;
    missing_profiles: number;
    certificates_pending: number;
  };
  active_tax_year: { label: string; closes_on: string } | null;
  pending_by_fund: Record<string, number>;
  upcoming_deadlines: { name: string; date: string; status: string }[];
  area_status: { area: string; status: string; pending: number; amount: number; updated: string | null }[];
}

export async function getComplianceSummary(signal?: AbortSignal): Promise<ComplianceSummary> {
  const { data } = await api.get<{ success: boolean; message: string; data: ComplianceSummary }>(
    "/compliance/dashboard/summary",
    { signal },
  );
  return data.data;
}
