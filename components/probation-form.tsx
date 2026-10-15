// components/people-hub/probation-form.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock3,
  CheckCircle2,
  ShieldCheck,
  CalendarDays,
  FileText,
  UserCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { api } from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const PROBATION_STATUSES = [
  "Active",
  "Review Due",
  "Extended",
  "Confirmed",
  "Terminated",
] as const;

export const MANAGER_RECOMMENDATIONS = [
  "Confirm",
  "Extend",
  "Terminate",
] as const;

export const HR_DECISIONS = [
  "Pending",
  "Confirmed",
  "Extended",
  "Terminated",
] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProbationStatus = (typeof PROBATION_STATUSES)[number];
export type ManagerRecommendation = (typeof MANAGER_RECOMMENDATIONS)[number];
export type HrDecision = (typeof HR_DECISIONS)[number];

export type ProbationFormValues = {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  manager: string;

  probation_start: string;
  original_end_date: string;
  current_end_date: string;

  extension_count: number;
  review_scheduled_date: string;
  review_conducted_date: string;

  manager_recommendation: ManagerRecommendation | "";
  hr_decision: HrDecision;

  decision_date: string;
  extension_reason: string;
  extension_days: number;

  confirmation_letter_id: string;
  termination_reason: string;

  status: ProbationStatus;
};

type ProbationFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<ProbationFormValues>;
  probationId?: string;
};

type ApiProbationEmployee = {
  id: number;
  uuid: string;
  employee_code: string;
  name: string;
  avatar_initials: string;
  manager: {
    id: number;
    uuid: string;
    name: string;
    employee_code: string;
  } | null;
  department: {
    id: number;
    name: string;
  } | null;
  designation: {
    id: number;
    name: string;
  } | null;
  probation: {
    id: string;
    probation_start: string | null;
    original_end_date: string | null;
    current_end_date: string | null;
    review_scheduled_date: string | null;
    review_conducted_date: string | null;
    extension_count: number;
    extension_days: number;
    extension_reason: string | null;
    status: string;
  } | null;
};

type ProbationEmployeesResponse = {
  success: boolean;
  message: string;
  data: ApiProbationEmployee[];
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getCompanyUuid() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("company_uuid") ||
    localStorage.getItem("companyUuid") ||
    "6eca7723-dee6-411b-918a-830915d8605a"
  );
}

function addDays(dateString: string, days: number) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function diffDays(start: string, end: string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();

  if (Number.isNaN(a) || Number.isNaN(b)) return 0;

  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function subtractDays(dateString: string, days: number) {
  return addDays(dateString, -days);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normalizeProbationStatus(status?: string | null): ProbationStatus {
  switch (status) {
    case "review_due":
      return "Review Due";
    case "extended":
      return "Extended";
    case "confirmed":
      return "Confirmed";
    case "terminated":
      return "Terminated";
    case "active":
    default:
      return "Active";
  }
}

function normalizeStatusForPayload(status: ProbationStatus) {
  switch (status) {
    case "Review Due":
      return "review_due";
    case "Extended":
      return "extended";
    case "Confirmed":
      return "confirmed";
    case "Terminated":
      return "terminated";
    case "Active":
    default:
      return "active";
  }
}

function normalizeDecisionForPayload(decision: HrDecision) {
  switch (decision) {
    case "Confirmed":
      return "confirmed";
    case "Extended":
      return "extended";
    case "Terminated":
      return "terminated";
    case "Pending":
    default:
      return "pending";
  }
}

function getDefaultValues(): ProbationFormValues {
  const today = getTodayDate();
  const originalEnd = addDays(today, 90);

  return {
    employee_id: "",
    employee_name: "",
    employee_code: "",
    designation: "",
    department: "",
    manager: "",

    probation_start: today,
    original_end_date: originalEnd,
    current_end_date: originalEnd,

    extension_count: 0,
    review_scheduled_date: subtractDays(originalEnd, 30),
    review_conducted_date: "",

    manager_recommendation: "",
    hr_decision: "Pending",

    decision_date: "",
    extension_reason: "",
    extension_days: 0,

    confirmation_letter_id: "",
    termination_reason: "",

    status: "Active",
  };
}

function getStatusClass(status: ProbationStatus) {
  switch (status) {
    case "Active":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Review Due":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Extended":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Confirmed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Terminated":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-800 text-white border-transparent";
  }
}

function getDecisionClass(status: HrDecision) {
  switch (status) {
    case "Pending":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Confirmed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Extended":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Terminated":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-800 text-white border-transparent";
  }
}
function getResolvedStatus(form: ProbationFormValues): ProbationStatus {
  if (form.hr_decision === "Confirmed") return "Confirmed";
  if (form.hr_decision === "Extended") return "Extended";
  if (form.hr_decision === "Terminated") return "Terminated";

  return form.status;
}

function getDecisionSummary(decision: HrDecision) {
  switch (decision) {
    case "Confirmed":
      return {
        title: "Employee will be confirmed",
        description:
          "Status will move to Active, LetterForge will generate the confirmation letter, and PerformPro will be notified for regular appraisal enrollment.",
      };
    case "Extended":
      return {
        title: "Probation will be extended",
        description:
          "Extension reason and days are required. The new current end date and review date will be calculated automatically.",
      };
    case "Terminated":
      return {
        title: "Probation will be terminated",
        description:
          "Termination reason is required. Exit Horizon, LetterForge, and NotifyPro downstream actions will be triggered.",
      };
    case "Pending":
    default:
      return {
        title: "No HR decision selected",
        description:
          "Select Confirmed, Extended, or Terminated to show the required conditional fields.",
      };
  }
}


function getEmployeeValue(employee: ApiProbationEmployee) {
  return employee.uuid || String(employee.id);
}

function findEmployeeByValue(
  employees: ApiProbationEmployee[],
  value: string
) {
  return employees.find(
    (employee) =>
      employee.uuid === value ||
      String(employee.id) === value ||
      employee.probation?.id === value
  );
}

/* -------------------------------------------------------------------------- */
/*  Service                                                                    */
/* -------------------------------------------------------------------------- */

const probationFormService = {
  employees: async () => {
    const companyUuid = getCompanyUuid();

    const response = await api.get<ProbationEmployeesResponse>(
      "/probation/employees",
      {
        headers: {
          Accept: "application/json",
          "X-Company-ID": companyUuid,
        },
      }
    );

    return response.data;
  },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const ProbationForm: React.FC<ProbationFormProps> = ({
  mode,
  initialValues,
  probationId,
}) => {
  const router = useRouter();

  const [form, setForm] = useState<ProbationFormValues>({
    ...getDefaultValues(),
    ...initialValues,
  });

  const [employees, setEmployees] = useState<ApiProbationEmployee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(
    () => findEmployeeByValue(employees, form.employee_id),
    [employees, form.employee_id]
  );

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsEmployeesLoading(true);

        const response = await probationFormService.employees();

        if (!response.success) {
          throw new Error(response.message || "Failed to load employees.");
        }

        setEmployees(response.data || []);
      } catch (error: any) {
        showApiError(error, { ...({
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load probation employees.",
        }), fallbackMessage: "Unable to load employees" });
      } finally {
        setIsEmployeesLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  const effectiveCurrentEndDate = useMemo(() => {
    if (form.hr_decision === "Extended" && form.extension_days > 0) {
      return addDays(form.current_end_date, form.extension_days);
    }

    return form.current_end_date;
  }, [form.current_end_date, form.hr_decision, form.extension_days]);

  const effectiveReviewDate = useMemo(() => {
    if (!effectiveCurrentEndDate) return "";
    return subtractDays(effectiveCurrentEndDate, 30);
  }, [effectiveCurrentEndDate]);

  const projectedExtensionCount = useMemo(() => {
    return form.hr_decision === "Extended"
      ? form.extension_count + 1
      : form.extension_count;
  }, [form.hr_decision, form.extension_count]);

  const totalProbationDays = useMemo(() => {
    return diffDays(form.probation_start, effectiveCurrentEndDate);
  }, [form.probation_start, effectiveCurrentEndDate]);

  const timelineProgress = useMemo(() => {
    const total = Math.max(
      diffDays(form.probation_start, effectiveCurrentEndDate),
      1
    );

    const elapsed = Math.max(
      diffDays(form.probation_start, getTodayDate()),
      0
    );

    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [form.probation_start, effectiveCurrentEndDate]);

  const handleEmployeeChange = (employeeValue: string) => {
    const employee = findEmployeeByValue(employees, employeeValue);

    if (!employee) return;

    const probationStart =
      employee.probation?.probation_start || getTodayDate();

    const originalEnd =
      employee.probation?.original_end_date || addDays(probationStart, 90);

    const currentEnd =
      employee.probation?.current_end_date || originalEnd;

    const reviewScheduledDate =
      employee.probation?.review_scheduled_date ||
      subtractDays(currentEnd, 30);

    setForm((prev) => ({
      ...prev,

      employee_id: getEmployeeValue(employee),
      employee_name: employee.name || "",
      employee_code: employee.employee_code || "",

      designation: employee.designation?.name || "",
      department: employee.department?.name || "",
      manager: employee.manager
        ? `${employee.manager.name} • ${employee.manager.employee_code}`
        : "",

      probation_start: probationStart,
      original_end_date: originalEnd,
      current_end_date: currentEnd,

      extension_count: employee.probation?.extension_count || 0,
      extension_days: 0,
      extension_reason: "",

      review_scheduled_date: reviewScheduledDate,
      review_conducted_date:
        employee.probation?.review_conducted_date || "",

      manager_recommendation: "",
      hr_decision: "Pending",
      decision_date: "",

      confirmation_letter_id: "",
      termination_reason: "",

      status: normalizeProbationStatus(employee.probation?.status),
    }));
  };

  const handleChange = <K extends keyof ProbationFormValues>(
    key: K,
    value: ProbationFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };


  const handleHrDecisionChange = (decision: HrDecision) => {
    setForm((prev) => ({
      ...prev,
      hr_decision: decision,
      decision_date:
        decision === "Pending" ? "" : prev.decision_date || getTodayDate(),
      extension_reason: decision === "Extended" ? prev.extension_reason : "",
      extension_days: decision === "Extended" ? prev.extension_days : 0,
      confirmation_letter_id:
        decision === "Confirmed" ? prev.confirmation_letter_id : "",
      termination_reason: decision === "Terminated" ? prev.termination_reason : "",
    }));
  };

  const validateForm = () => {
    if (!form.employee_id) {
      toast.error("Employee is required", {
        description: "Please select an employee first.",
      });
      return false;
    }

    if (
      !form.probation_start ||
      !form.original_end_date ||
      !form.current_end_date
    ) {
      toast.error("Probation dates are required", {
        description: "Please fill the probation timeline fields.",
      });
      return false;
    }

    if (form.hr_decision !== "Pending" && !form.decision_date) {
      toast.error("Decision date is required", {
        description: "Please select the HR decision date before submitting.",
      });
      return false;
    }

    if (form.hr_decision === "Extended") {
      if (!form.extension_reason.trim()) {
        toast.error("Extension reason is required", {
          description: "Please add a reason for extending probation.",
        });
        return false;
      }

      if (!form.extension_days || form.extension_days <= 0) {
        toast.error("Extension days are required", {
          description: "Please enter valid extension days.",
        });
        return false;
      }

      if (form.extension_count >= 2) {
        toast.error("Maximum extensions reached", {
          description:
            "A third probation extension is blocked. Please Confirm or Terminate.",
        });
        return false;
      }

      if (totalProbationDays > 365) {
        toast.error("Maximum probation duration exceeded", {
          description: "Total probation period cannot exceed 12 months.",
        });
        return false;
      }
    }

    if (form.hr_decision === "Terminated" && !form.termination_reason.trim()) {
      toast.error("Termination reason is required", {
        description: "Please provide the probation termination reason.",
      });
      return false;
    }

    return true;
  };

  const handleSave = async (submit: boolean) => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    const finalStatus: ProbationStatus =
      form.hr_decision === "Confirmed"
        ? "Confirmed"
        : form.hr_decision === "Extended"
          ? "Extended"
          : form.hr_decision === "Terminated"
            ? "Terminated"
            : "Active";

    const payload = {
      ...form,
      employee_uuid: form.employee_id,
      probation_id: selectedEmployee?.probation?.id || probationId || null,
      current_end_date: effectiveCurrentEndDate,
      review_scheduled_date: effectiveReviewDate,
      extension_count: projectedExtensionCount,
      status: finalStatus,
      status_key: normalizeStatusForPayload(finalStatus),
      hr_decision_key: normalizeDecisionForPayload(form.hr_decision),
      submit,
    };

    setIsSubmitting(true);

    try {
      // TODO: Replace this with real create/update API once you share endpoint.
      await new Promise((resolve) => setTimeout(resolve, 900));

      console.log("probation payload:", payload);

      if (!submit) {
        toast.success(mode === "create" ? "Draft saved" : "Changes saved", {
          description:
            mode === "create"
              ? "Probation record draft saved successfully."
              : "Probation record changes saved successfully.",
        });

        setIsSubmitting(false);
        return;
      }

      toast.success(
        mode === "create"
          ? "Probation record created"
          : "Probation record updated",
        {
          description:
            payload.hr_decision === "Confirmed"
              ? "Employee confirmed successfully and ready for regular appraisal enrollment."
              : payload.hr_decision === "Extended"
                ? "Probation extended and new review date scheduled."
                : payload.hr_decision === "Terminated"
                  ? "Probation terminated and ready for exit workflow."
                  : "Probation record submitted successfully.",
        }
      );

      router.push("/people-hub/probation");
    } catch (error: any) {
      showApiError(error, { ...({
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while saving probation record.",
      }), fallbackMessage: "Unable to save probation record" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroTitle =
    mode === "create" ? "Create Probation Record" : "Edit Probation Record";

  const heroDesc =
    mode === "create"
      ? "Create and manage probation workflow, review, extension, and confirmation logic."
      : "Update the selected probation case and decision flow.";


  const resolvedStatus = getResolvedStatus(form);
  const decisionSummary = getDecisionSummary(form.hr_decision);
  const isExtensionBlocked =
    form.hr_decision === "Extended" &&
    (form.extension_count >= 2 || totalProbationDays > 365);

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-200 bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] shadow-sm">
          <div className="p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Clock3 className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {heroTitle}
                    </h1>

                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      PeopleHub
                    </Badge>

                    {probationId ? (
                      <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                        ID: {probationId}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-white/80">{heroDesc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => router.push("/people-hub/probation")}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  className="gap-2 bg-white text-brand-900 hover:bg-white/90 disabled:opacity-70"
                  onClick={() => handleSave(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : mode === "create" ? (
                    "Submit Probation Case"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-brand-900">
                  Employee & Probation Information
                </CardTitle>

                <CardDescription className="text-brand-700">
                  Select an employee to auto-fill probation and employee details.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Employee
                  </label>

                  <Select
                    value={form.employee_id}
                    onValueChange={handleEmployeeChange}
                    disabled={isEmployeesLoading}
                  >
                    <SelectTrigger className="w-full border-gray-200 text-brand-800">
                      <SelectValue
                        placeholder={
                          isEmployeesLoading
                            ? "Loading employees..."
                            : "Select employee"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="bg-white">
                      {isEmployeesLoading ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-brand-700">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading employees...
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-brand-700">
                          No probation employees found.
                        </div>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem
                            key={employee.uuid}
                            value={getEmployeeValue(employee)}
                          >
                            {employee.name || "Unnamed Employee"} •{" "}
                            {employee.employee_code}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Manager
                  </label>

                  <Input
                    value={form.manager}
                    readOnly
                    placeholder="Manager will auto-fill"
                    className="border-gray-200 bg-brand-100/50 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Employee Code
                  </label>

                  <Input
                    value={form.employee_code}
                    readOnly
                    placeholder="Employee code will auto-fill"
                    className="border-gray-200 bg-brand-100/50 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Department / Designation
                  </label>

                  <Input
                    value={
                      form.department && form.designation
                        ? `${form.department} • ${form.designation}`
                        : form.department || form.designation || ""
                    }
                    readOnly
                    placeholder="Department and designation will auto-fill"
                    className="border-gray-200 bg-brand-100/50 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Probation Start
                  </label>

                  <Input
                    type="date"
                    value={form.probation_start}
                    onChange={(e) =>
                      handleChange("probation_start", e.target.value)
                    }
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Original End Date
                  </label>

                  <Input
                    type="date"
                    value={form.original_end_date}
                    onChange={(e) =>
                      handleChange("original_end_date", e.target.value)
                    }
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Current End Date
                  </label>

                  <Input
                    type="date"
                    value={form.current_end_date}
                    onChange={(e) =>
                      handleChange("current_end_date", e.target.value)
                    }
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Review Scheduled Date
                  </label>

                  <Input
                    type="date"
                    value={form.review_scheduled_date || effectiveReviewDate}
                    readOnly
                    className="border-gray-200 bg-brand-100/50 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Review Conducted Date
                  </label>

                  <Input
                    type="date"
                    value={form.review_conducted_date}
                    onChange={(e) =>
                      handleChange("review_conducted_date", e.target.value)
                    }
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Extension Count
                  </label>

                  <Input
                    value={String(form.extension_count)}
                    readOnly
                    className="border-gray-200 bg-brand-100/50 text-brand-900"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-900">
                    <UserCircle2 className="h-4 w-4 text-brand-800" />
                    Review & Recommendation
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Manager Recommendation
                    </label>

                    <Select
                      value={form.manager_recommendation || ""}
                      onValueChange={(v) =>
                        handleChange(
                          "manager_recommendation",
                          v as ManagerRecommendation
                        )
                      }
                    >
                      <SelectTrigger className="w-full border-gray-200 text-brand-800">
                        <SelectValue placeholder="Select recommendation" />
                      </SelectTrigger>

                      <SelectContent className="bg-white">
                        {MANAGER_RECOMMENDATIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      HR Decision
                    </label>

                    <Select
                      value={form.hr_decision}
                      onValueChange={(v) => handleHrDecisionChange(v as HrDecision)}
                    >
                      <SelectTrigger className="w-full border-gray-200 text-brand-800">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="bg-white">
                        {HR_DECISIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Decision Date
                    </label>

                    <Input
                      type="date"
                      value={form.decision_date}
                      onChange={(e) =>
                        handleChange("decision_date", e.target.value)
                      }
                      className="border-gray-200 text-brand-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Status
                    </label>

                    <Input
                      value={resolvedStatus}
                      readOnly
                      className="border-gray-200 bg-brand-100/50 text-brand-900"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-900">
                    <FileText className="h-4 w-4 text-brand-800" />
                    Conditional Details
                  </CardTitle>

                  <CardDescription className="text-brand-700">
                    Dynamic fields appear based on the selected HR decision.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                  <div className="rounded-xl border border-gray-200 bg-brand-100/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-800 shadow-sm">
                        {form.hr_decision === "Confirmed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : form.hr_decision === "Extended" ? (
                          <CalendarDays className="h-4 w-4" />
                        ) : form.hr_decision === "Terminated" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-brand-900">
                          {decisionSummary.title}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-brand-700">
                          {decisionSummary.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {form.hr_decision === "Pending" ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100/70">
                        <FileText className="h-5 w-5 text-brand-700" />
                      </div>

                      <h3 className="mt-3 text-sm font-semibold text-brand-900">
                        Waiting for HR decision
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-brand-700">
                        No static fields are shown here. Select an HR decision to
                        load the required compliance fields.
                      </p>
                    </div>
                  ) : null}

                  {form.hr_decision === "Extended" ? (
                    <div className="space-y-4">
                      {form.extension_count >= 2 ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                          <div className="flex items-center gap-2 font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            Extension limit reached
                          </div>

                          <p className="mt-1 text-xs leading-5">
                            This employee already has 2 extensions. A third
                            extension is blocked. HR must select Confirmed or
                            Terminated.
                          </p>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-800">
                          Extension Reason <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          value={form.extension_reason}
                          onChange={(e) =>
                            handleChange("extension_reason", e.target.value)
                          }
                          placeholder="Document why the probation period is being extended"
                          rows={4}
                          className="min-h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-xs outline-none transition placeholder:text-brand-700/60 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={form.extension_count >= 2}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-brand-800">
                            Extension Days <span className="text-red-500">*</span>
                          </label>

                          <Input
                            type="number"
                            min={1}
                            value={form.extension_days || ""}
                            onChange={(e) =>
                              handleChange(
                                "extension_days",
                                Number(e.target.value || 0)
                              )
                            }
                            placeholder="e.g. 30"
                            className="border-gray-200 text-brand-900"
                            disabled={form.extension_count >= 2}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-brand-800">
                            New Current End Date
                          </label>

                          <Input
                            type="date"
                            value={effectiveCurrentEndDate}
                            readOnly
                            className="border-gray-200 bg-brand-100/50 text-brand-900"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 text-xs md:grid-cols-3">
                        <div>
                          <div className="text-brand-700">New Review Date</div>
                          <div className="mt-1 font-semibold text-brand-900">
                            {effectiveReviewDate || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-brand-700">Projected Extensions</div>
                          <div className="mt-1 font-semibold text-brand-900">
                            {projectedExtensionCount} / 2
                          </div>
                        </div>

                        <div>
                          <div className="text-brand-700">Total Duration</div>
                          <div className="mt-1 font-semibold text-brand-900">
                            {totalProbationDays} days
                          </div>
                        </div>
                      </div>

                      {totalProbationDays > 365 ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                          <div className="flex items-center gap-2 font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            12-month policy exceeded
                          </div>

                          <p className="mt-1 text-xs leading-5">
                            The total probation period cannot exceed 12 months.
                            Reduce extension days or choose another HR decision.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {form.hr_decision === "Terminated" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-800">
                          Termination Reason <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          value={form.termination_reason}
                          onChange={(e) =>
                            handleChange("termination_reason", e.target.value)
                          }
                          placeholder="Document the basis for terminating probation"
                          rows={5}
                          className="min-h-28 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-xs outline-none transition placeholder:text-brand-700/60 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15"
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-semibold text-brand-900">
                          Downstream Actions
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-brand-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            Exit Horizon process will be triggered
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            Termination letter will be generated via LetterForge
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            Employee status will be updated to Exited
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            ProbationTerminated event will notify NotifyPro
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {form.hr_decision === "Confirmed" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-800">
                          Confirmation Date <span className="text-red-500">*</span>
                        </label>

                        <Input
                          type="date"
                          value={form.decision_date}
                          onChange={(e) =>
                            handleChange("decision_date", e.target.value)
                          }
                          className="border-gray-200 text-brand-900"
                        />

                        <p className="text-[11px] text-brand-700">
                          Auto-set to the decision date, but HR can edit it.
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-semibold text-brand-900">
                          Confirmation Letter
                        </div>

                        <p className="mt-1 text-xs leading-5 text-brand-700">
                          LetterForge will generate the confirmation letter when
                          this probation case is submitted.
                        </p>

                        <Input
                          value={form.confirmation_letter_id}
                          onChange={(e) =>
                            handleChange("confirmation_letter_id", e.target.value)
                          }
                          placeholder="Optional letter reference, if already generated"
                          className="mt-3 border-gray-200 text-brand-900"
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-semibold text-brand-900">
                          Downstream Actions
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-brand-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            Employee status will be updated to Active
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            PerformPro will be notified for appraisal enrollment
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                            ProbationConfirmed event will notify NotifyPro
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-brand-900">
                  Live Summary
                </CardTitle>

                <CardDescription className="text-brand-700">
                  Real-time preview of the probation decision.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={getStatusClass(resolvedStatus)}
                  >
                    {resolvedStatus}
                  </Badge>

                  <Badge className={getDecisionClass(form.hr_decision)}>
                    {form.hr_decision}
                  </Badge>
                </div>

                {form.hr_decision !== "Pending" ? (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                    <div className="text-xs text-brand-700">Selected Decision</div>
                    <div className="mt-1 text-sm font-semibold text-brand-900">
                      {decisionSummary.title}
                    </div>
                    <div className="mt-1 text-[11px] leading-5 text-brand-700">
                      {decisionSummary.description}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-xl bg-brand-100/50 p-4">
                  <div className="text-xs text-brand-700">Employee</div>

                  <div className="font-semibold text-brand-900">
                    {form.employee_name || "No employee selected"}
                  </div>

                  <div className="text-[11px] text-brand-700">
                    {form.employee_code || "Employee code will appear here"}
                  </div>

                  {form.department || form.designation ? (
                    <div className="text-[11px] text-brand-700">
                      {[form.department, form.designation]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  ) : null}

                  {form.manager ? (
                    <div className="text-[11px] text-brand-700">
                      Manager: {form.manager}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">
                      Probation Timeline
                    </div>

                    <div className="mt-1 text-sm font-medium text-brand-900">
                      {form.probation_start || "—"} →{" "}
                      {effectiveCurrentEndDate || "—"}
                    </div>

                    <div className="mt-2">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-brand-700">
                          Elapsed Progress
                        </span>

                        <span className="font-semibold text-brand-900">
                          {timelineProgress}%
                        </span>
                      </div>

                      <Progress value={timelineProgress} className="h-2" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">
                      Review Schedule
                    </div>

                    <div className="mt-1 text-sm font-medium text-brand-900">
                      Review Due:{" "}
                      {effectiveReviewDate || form.review_scheduled_date || "—"}
                    </div>

                    <div className="mt-1 text-[11px] text-brand-700">
                      Current extensions: {projectedExtensionCount}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">Policy Check</div>

                    <div className="mt-1 text-sm font-medium text-brand-900">
                      Total duration: {totalProbationDays} days
                    </div>

                    <div className="mt-1 text-[11px] text-brand-700">
                      Max 2 extensions • Max 12 months total
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-gray-200 shadow-sm">
              <div className="bg-linear-to-br from-brand-800 via-[#4D446E] to-brand-900 p-5 text-white">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {mode === "create"
                        ? "Ready to Submit?"
                        : "Ready to Update?"}
                    </h3>

                    <p className="mt-1 text-sm text-white/80">
                      Review policy checks and submit the probation case.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Button
                    type="button"
                    className="w-full bg-white text-brand-900 hover:bg-white/90 disabled:opacity-70"
                    onClick={() => handleSave(false)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Draft...
                      </>
                    ) : (
                      <>
                        <Clock3 className="mr-2 h-4 w-4" />
                        {mode === "create"
                          ? "Save Draft"
                          : "Save Without Leaving"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-70"
                    onClick={() => handleSave(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {mode === "create"
                          ? "Submit Probation Case"
                          : "Save Changes"}
                      </>
                    )}
                  </Button>
                </div>

                {isExtensionBlocked && (
                    <div className="mt-4 rounded-lg border border-white/20 bg-white/10 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Policy Block
                      </div>

                      <div className="mt-1 text-xs text-white/80">
                        Third extension or total duration above 12 months is not
                        allowed.
                      </div>
                    </div>
                  )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProbationForm;