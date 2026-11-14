type ApiFieldValueObject = {
  id?: string | number | null;
  value?: string | number | null;
  label?: string | null;
};

type ApiProfileField = {
  label: string;
  type: string;
  tags?: string[];
  is_required?: boolean;
  is_login_email?: boolean;
  value?:
    | string
    | number
    | null
    | ApiFieldValueObject
    | ApiFieldValueObject[];
};

type ApiProfileStep = {
  step_id: number;
  step_name: string;
  icon: string | null;
  order: number;
  fields: Record<string, ApiProfileField>;
};

export type ApiOnboardingEmployee = {
  id: string;
  employee_code: string | null;
  name?: string | null;
  company_id: number;
  employment_status: string;
  joining_date: string | null;
  form_mode: "quick" | "detailed" | string;
  user: { id?: string; name?: string | null; email?: string | null; roles?: string[] } | null;
  profile?: {
    steps?: ApiProfileStep[];
    orphaned?: unknown;
  };
  created_at: string;
  updated_at: string;
};

type EmployeeStatus =
  | "draft"
  | "active"
  | "probation"
  | "inactive"
  | "suspended"
  | "exited"
  | string;

export type EmployeeRow = {
  sr: number;
  id: string;
  name: string;
  emp_code: string;
  manager: string;
  designation: string;
  department: string;
  work_mode: string;
  join_date: string | null;
  email: string;
  phone: string;
  employment_type: string;
  type_description: string;
  status: EmployeeStatus;
  form_mode: string;
  created_at: string;
  updated_at: string;
  raw: ApiOnboardingEmployee;
};

export function getInitials(name: string) {
  if (!name || name === "—") return "EM";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeApiValue(value: ApiProfileField["value"]) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return String(item.label ?? item.value ?? item.id ?? "");
        }
        return String(item ?? "");
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return String(value.label ?? value.value ?? value.id ?? "");
  }
  return String(value);
}

function getAllFields(employee: ApiOnboardingEmployee) {
  const fields: Record<string, ApiProfileField> = {};
  employee.profile?.steps?.forEach((step) => {
    Object.entries(step.fields || {}).forEach(([key, value]) => {
      fields[key] = value;
    });
  });
  return fields;
}

function getFieldValue(
  employee: ApiOnboardingEmployee,
  systemKey: string,
  fallback = "—"
) {
  const fields = getAllFields(employee);
  const value = normalizeApiValue(fields[systemKey]?.value);
  return value || fallback;
}

function getFieldValueByLabel(
  employee: ApiOnboardingEmployee,
  labels: string[],
  fallback = "—"
) {
  const fields = getAllFields(employee);
  const normalizedLabels = labels.map((item) => item.toLowerCase());
  const found = Object.values(fields).find((field) =>
    normalizedLabels.includes(String(field.label || "").toLowerCase())
  );
  const value = normalizeApiValue(found?.value);
  return value || fallback;
}

function buildEmployeeName(employee: ApiOnboardingEmployee) {
  if (employee.name?.trim()) return employee.name.trim();
  const firstName = getFieldValueByLabel(employee, ["First Name"], "") || getFieldValue(employee, "field_fn1", "");
  const lastName = getFieldValueByLabel(employee, ["Last Name"], "") || getFieldValue(employee, "field_ln1", "");
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || employee.user?.name || "Unnamed Employee";
}

export function mapEmployeeToRow(
  employee: ApiOnboardingEmployee,
  sr: number
): EmployeeRow {
  const designation =
    getFieldValue(employee, "field_dsg", "") ||
    getFieldValueByLabel(employee, ["Designation"], "");
  const department =
    getFieldValue(employee, "field_dp1", "") ||
    getFieldValueByLabel(employee, ["Department"], "");
  const manager =
    getFieldValue(employee, "field_rm1", "") ||
    getFieldValueByLabel(employee, ["Reporting Manager"], "");
  const joiningDate =
    employee.joining_date ||
    getFieldValue(employee, "field_jd1", "") ||
    getFieldValueByLabel(employee, ["Joining Date", "Company Date Of Joining", "Date of Joining"], "");
  const employmentType =
    getFieldValue(employee, "field_et1", "") ||
    getFieldValueByLabel(employee, ["Employment Type", "Employee Type"], "");

  return {
    sr,
    id: employee.id,
    name: buildEmployeeName(employee),
    emp_code: employee.employee_code || "Draft",
    manager: manager || "—",
    designation: designation || "—",
    department: department || "—",
    work_mode:
      getFieldValue(employee, "field_wm1", "") ||
      getFieldValueByLabel(employee, ["Work Mode"], "—"),
    join_date: joiningDate || null,
    email:
      normalizeApiValue(Object.values(getAllFields(employee)).find(field => field.is_login_email)?.value) ||
      employee.user?.email ||
      getFieldValueByLabel(employee, ["Email", "Personal Email"], "") ||
      getFieldValue(employee, "field_em1", "—"),
    phone:
      getFieldValue(employee, "field_mb1", "") ||
      getFieldValueByLabel(employee, ["Mobile#", "Mobile Number", "Mobile", "Phone"], "—"),
    employment_type: employmentType || "—",
    type_description:
      employmentType && employmentType !== "—"
        ? `${employmentType} employee record.`
        : "Employee onboarding record.",
    status: employee.employment_status || "draft",
    form_mode: employee.form_mode || "—",
    created_at: employee.created_at,
    updated_at: employee.updated_at,
    raw: employee,
  };
}

export const STATUS_CONFIG: Record<string, { classes: string; dot: string; label: string }> = {
  active:    { classes: "bg-emerald-50 text-emerald-700 border-emerald-200",     dot: "bg-emerald-500", label: "Active" },
  draft:     { classes: "bg-amber-50 text-amber-700 border-amber-200",           dot: "bg-amber-400",   label: "Draft" },
  probation: { classes: "bg-blue-50 text-blue-700 border-blue-200",              dot: "bg-blue-500",    label: "Probation" },
  inactive:  { classes: "bg-slate-100 text-slate-600 border-slate-200",          dot: "bg-slate-400",   label: "Inactive" },
  suspended: { classes: "bg-orange-50 text-orange-700 border-orange-200",        dot: "bg-orange-500",  label: "Suspended" },
  exited:    { classes: "bg-red-50 text-red-600 border-red-200",                 dot: "bg-red-400",     label: "Exited" },
};

export function getStatusConfig(status: EmployeeStatus) {
  return STATUS_CONFIG[String(status).toLowerCase()] ?? {
    classes: "bg-brand-50 text-brand-700 border-brand-200",
    dot: "bg-brand-400",
    label: String(status),
  };
}


