/**
 * Shared employee search for LetterForge pickers (single generate + bulk generate).
 *
 * PeopleHub exposes employees at /people-hub/onboarding — there is no dedicated
 * /people-hub/employees route. The picker identifies employees by uuid (PeopleHub
 * never exposes the numeric PK); the letter generate/bulk endpoints accept the uuid.
 * Display names are reconstructed from the OnboardX step-wise fields (keys vary by
 * company form config).
 */

import { api } from "@/lib/api";

export interface LetterEmployeeOption {
  uuid: string;
  name: string;
  employee_code: string;
  designation: string | null;
  department: string | null;
}

interface OnboardingEmployeeRow {
  id: string; // uuid
  employee_code?: string;
  profile?: {
    steps?: Array<{ fields?: Record<string, { value?: unknown; label?: string }> }>;
  };
}

function flattenFields(row: OnboardingEmployeeRow): Record<string, { value?: unknown; label?: string }> {
  const out: Record<string, { value?: unknown; label?: string }> = {};
  row.profile?.steps?.forEach((step) => Object.assign(out, step.fields ?? {}));
  return out;
}

function fieldValue(fields: Record<string, { value?: unknown; label?: string }>, key: string): string {
  const v = fields[key]?.value;
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { label?: unknown; value?: unknown };
    return String(o.label ?? o.value ?? "");
  }
  return String(v);
}

function buildName(row: OnboardingEmployeeRow): string {
  const fields = flattenFields(row);
  const single = fieldValue(fields, "emp_name");
  if (single) return single;
  const composed = `${fieldValue(fields, "field_fn1")} ${fieldValue(fields, "field_ln1")}`.trim();
  if (composed) return composed;
  const byLabel = Object.values(fields).find((f) =>
    String(f.label ?? "").toLowerCase().includes("name")
  );
  if (byLabel?.value) return String(byLabel.value);
  return row.employee_code || "Unnamed Employee";
}

export async function searchLetterEmployees(q: string, perPage = 10): Promise<LetterEmployeeOption[]> {
  if (q.trim().length < 2) return [];
  const { data } = await api.get("/people-hub/onboarding", {
    params: { search: q, per_page: perPage },
  });
  const rows: OnboardingEmployeeRow[] = data.data?.data ?? data.data ?? [];
  return rows.map((row) => {
    const fields = flattenFields(row);
    return {
      uuid: row.id,
      name: buildName(row),
      employee_code: row.employee_code ?? "",
      designation: fieldValue(fields, "field_dsg") || null,
      department: fieldValue(fields, "field_dp1") || null,
    };
  });
}
