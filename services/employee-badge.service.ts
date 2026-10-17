import { api } from "@/lib/api";
import { validateBadge, MAX_BADGE_ASSIGNMENTS } from "@/lib/employee-badges";
import type {
  BadgeAssignment,
  BadgeEnvelope,
  EmployeeBadgeFilters,
  EmployeeBadgeList,
} from "@/types/employee-badge";
const ROOT = "/time-sync/employee-badges";
// The supplied bulk endpoint is outside the time-sync namespace.
export const BULK_BADGE_PATH = "/time-sync/employee-badges/bulk";
function checked<T extends { success: boolean; message: string }>(value: T): T {
  if (!value.success) throw new Error(value.message || "Badge request failed.");
  return value;
}
export const employeeBadgeService = {
  async list(filters: EmployeeBadgeFilters, signal?: AbortSignal) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    );
    const result = checked(
      (await api.get<EmployeeBadgeList>(ROOT, { params, signal })).data,
    );
    if (!Array.isArray(result.data))
      throw new Error(
        "Expected an employee badge list. The server returned a different response shape.",
      );
    return result;
  },
  async assign(uuid: string, badge: string) {
    const error = validateBadge(badge);
    if (error) throw new Error(error);
    return checked(
      (
        await api.put<BadgeEnvelope<unknown>>(`${ROOT}/${uuid}`, {
          device_badge_id: badge.trim(),
        })
      ).data,
    );
  },
  async remove(uuid: string) {
    const { data } = await api.delete<BadgeEnvelope<unknown> | undefined>(
      `${ROOT}/${uuid}`,
    );
    if (data) checked(data);
    return data;
  },
  async bulk(assignments: BadgeAssignment[]) {
    if (!assignments.length || assignments.length > MAX_BADGE_ASSIGNMENTS)
      throw new Error("A request must contain 1 to 1000 assignments.");
    return checked(
      (await api.post<BadgeEnvelope<unknown>>(BULK_BADGE_PATH, { assignments }))
        .data,
    );
  },
};
