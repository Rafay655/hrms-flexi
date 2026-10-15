import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/letter-forge";
import type { DmsDashboard } from "@/types/dms-dashboard";
export async function getDmsDashboard(month: string | undefined, signal?: AbortSignal) {
  const { data } = await api.get<ApiEnvelope<DmsDashboard>>("/dms/dashboard", { params: month ? { month } : undefined, signal });
  if (!data.success || !data.data) throw new Error(data.message || "Dashboard data is unavailable.");
  return data.data;
}
