// components/people-hub/exit-case-form.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogOut,
  FileCheck,
  Wallet,
  Loader2,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const EXIT_TYPES = [
  "Resignation",
  "Termination",
  "Retirement",
  "Contract-End",
  "Death",
  "Absconding",
] as const;

export const EXIT_INITIATED_BY = ["Employee", "Manager", "HR", "System"] as const;

export const EXIT_REASONS = [
  "Better Opportunity",
  "Personal",
  "Health",
  "Performance",
  "Misconduct",
  "Restructuring",
  "Retirement",
  "Other",
] as const;

export const CLEARANCE_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Waived",
] as const;

export const FNF_STATUSES = [
  "Pending",
  "Calculated",
  "Approved",
  "Paid",
  "Disputed",
] as const;

export const PROCESS_STAGES = ["Notice Period", "Clearance", "FnF", "Completed"] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ExitType = (typeof EXIT_TYPES)[number];
export type ExitInitiatedBy = (typeof EXIT_INITIATED_BY)[number];
export type ExitReason = (typeof EXIT_REASONS)[number];
export type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];
export type FnFStatus = (typeof FNF_STATUSES)[number];
export type ProcessStage = (typeof PROCESS_STAGES)[number];

type ApiEmployee = {
  id: number;
  uuid: string;
  employee_code: string;
  employment_status: string;
  name: string;
  avatar_initials?: string | null;
  manager?: {
    id: number;
    uuid: string;
    name: string;
    employee_code: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  designation?: {
    id: number;
    name: string;
  } | null;
  location?: {
    id: number;
    name: string;
  } | null;
  probation?: {
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

export type ExitCaseFormValues = {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  location: string;
  manager: string;

  exit_type: ExitType;
  exit_initiated_by: ExitInitiatedBy;
  exit_reason_primary: ExitReason;

  resignation_date: string;
  last_working_date: string;
  notice_period_days: number;
  notice_period_waived: boolean;
  notice_waiver_reason: string;

  process_stage: ProcessStage;
  clearance_status: ClearanceStatus;
  clearance_progress: number;

  fnf_status: FnFStatus;
  fnf_progress: number;

  rehire_eligible: boolean;
  blacklist_flag: boolean;
  blacklist_reason: string;
  experience_letter_issued: boolean;
  exit_interview_conducted: boolean;

  notes: string;
};

type ExitCaseFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<ExitCaseFormValues>;
  exitId?: string;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateString: string, days: number) {
  if (!dateString) return "";
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function toApiValue(value: string) {
  return value.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function getExitTypeClass(type: ExitType) {
  switch (type) {
    case "Resignation":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Termination":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    case "Retirement":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Contract-End":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Death":
      return "bg-brand-900 text-white border-transparent hover:bg-brand-900";
    case "Absconding":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getStageClass(stage: ProcessStage) {
  switch (stage) {
    case "Notice Period":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Clearance":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "FnF":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Completed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getClearanceClass(status: ClearanceStatus) {
  switch (status) {
    case "Not Started":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "In Progress":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Completed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Waived":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getFnFClass(status: FnFStatus) {
  switch (status) {
    case "Pending":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Calculated":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Approved":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Paid":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Disputed":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getDefaultValues(): ExitCaseFormValues {
  return {
    employee_id: "",
    employee_name: "",
    employee_code: "",
    designation: "",
    department: "",
    location: "",
    manager: "",

    exit_type: "Resignation",
    exit_initiated_by: "Employee",
    exit_reason_primary: "Better Opportunity",

    resignation_date: todayInputValue(),
    last_working_date: addDays(todayInputValue(), 30),
    notice_period_days: 30,
    notice_period_waived: false,
    notice_waiver_reason: "",

    process_stage: "Notice Period",
    clearance_status: "Not Started",
    clearance_progress: 0,

    fnf_status: "Pending",
    fnf_progress: 0,

    rehire_eligible: true,
    blacklist_flag: false,
    blacklist_reason: "",
    experience_letter_issued: false,
    exit_interview_conducted: false,

    notes: "",
  };
}

function normalizeEmployeesResponse(response: unknown): ApiEmployee[] {
  const res = response as {
    data?: {
      data?: ApiEmployee[] | { items?: ApiEmployee[] };
    };
  };

  const payload = res?.data?.data;

  if (Array.isArray(payload)) return payload;
  if (payload && "items" in payload && Array.isArray(payload.items)) return payload.items;

  return [];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const ExitCaseForm = ({ mode, initialValues, exitId }: ExitCaseFormProps) => {
  const router = useRouter();

  const employeeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<ExitCaseFormValues>({
    ...getDefaultValues(),
    ...initialValues,
  });

  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.uuid === form.employee_id),
    [employees, form.employee_id]
  );

  const filteredEmployees = useMemo(() => {
    const keyword = employeeSearch.trim().toLowerCase();

    if (!keyword) return employees;

    return employees.filter((employee) => {
      const searchText = [
        employee.name,
        employee.employee_code,
        employee.department?.name,
        employee.designation?.name,
        employee.location?.name,
        employee.manager?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(keyword);
    });
  }, [employees, employeeSearch]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!employeeDropdownRef.current) return;

      if (!employeeDropdownRef.current.contains(event.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesLoading(true);

      try {
        const response = await api.get("/probation/employees");
        const list = normalizeEmployeesResponse(response);

        setEmployees(list);
      } catch (error) {
        console.error(error);
        showApiError(error, { ...({
          description: "Please check probation employees API.",
        }), fallbackMessage: "Unable to load employees" });
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;

    setForm((prev) => ({
      ...prev,
      employee_id: selectedEmployee.uuid,
      employee_name: selectedEmployee.name || "",
      employee_code: selectedEmployee.employee_code || "",
      designation: selectedEmployee.designation?.name || "",
      department: selectedEmployee.department?.name || "",
      location: selectedEmployee.location?.name || "",
      manager: selectedEmployee.manager
        ? `${selectedEmployee.manager.name} (${selectedEmployee.manager.employee_code})`
        : "",
    }));
  }, [selectedEmployee]);

  useEffect(() => {
    const forcedZeroNotice =
      form.exit_type === "Termination" ||
      form.exit_type === "Absconding" ||
      form.exit_type === "Death";

    if (forcedZeroNotice && form.notice_period_days !== 0) {
      setForm((prev) => ({
        ...prev,
        notice_period_days: 0,
        last_working_date: addDays(prev.resignation_date, 0),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      last_working_date: addDays(prev.resignation_date, prev.notice_period_days),
    }));
  }, [form.exit_type, form.resignation_date, form.notice_period_days]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };

      if (prev.process_stage === "Notice Period") {
        next.clearance_status = "Not Started";
        next.clearance_progress = 0;
        next.fnf_status = "Pending";
        next.fnf_progress = 0;
      }

      if (prev.process_stage === "Clearance") {
        if (next.clearance_status === "Not Started") next.clearance_status = "In Progress";
        if (next.clearance_progress === 0) next.clearance_progress = 45;
        next.fnf_status = "Pending";
        next.fnf_progress = 0;
      }

      if (prev.process_stage === "FnF") {
        next.clearance_status = "Completed";
        next.clearance_progress = 100;
        if (next.fnf_status === "Pending") next.fnf_status = "Calculated";
        if (next.fnf_progress === 0) next.fnf_progress = 55;
      }

      if (prev.process_stage === "Completed") {
        next.clearance_status = "Completed";
        next.clearance_progress = 100;
        next.fnf_status = "Paid";
        next.fnf_progress = 100;
      }

      return next;
    });
  }, [form.process_stage]);

  const handleChange = <K extends keyof ExitCaseFormValues>(
    key: K,
    value: ExitCaseFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmployeeSelect = (employee: ApiEmployee) => {
    setForm((prev) => ({
      ...prev,
      employee_id: employee.uuid,
      employee_name: employee.name || "",
      employee_code: employee.employee_code || "",
      designation: employee.designation?.name || "",
      department: employee.department?.name || "",
      location: employee.location?.name || "",
      manager: employee.manager
        ? `${employee.manager.name} (${employee.manager.employee_code})`
        : "",
    }));

    setEmployeeSearch("");
    setEmployeeDropdownOpen(false);
  };

  const validateForm = () => {
    if (!form.employee_id) {
      toast.error("Employee is required", {
        description: "Please select an employee first.",
      });
      return false;
    }

    if (!form.exit_type) {
      toast.error("Exit type is required", {
        description: "Please select the exit type.",
      });
      return false;
    }

    if (!form.exit_initiated_by) {
      toast.error("Initiated by is required", {
        description: "Please select who initiated this exit.",
      });
      return false;
    }

    if (!form.resignation_date) {
      toast.error("Exit date is required", {
        description: "Please select the initiation / resignation date.",
      });
      return false;
    }

    if (!form.last_working_date) {
      toast.error("Last working date is required", {
        description: "Please select the last working date.",
      });
      return false;
    }

    if (!form.exit_reason_primary) {
      toast.error("Reason is required", {
        description: "Please select the primary reason.",
      });
      return false;
    }

    if (!form.notes.trim()) {
      toast.error("Reason detail is required", {
        description: "Please add brief reason detail / HR remarks.",
      });
      return false;
    }

    if (form.notice_period_waived && !form.notice_waiver_reason.trim()) {
      toast.error("Waiver reason is required", {
        description: "Please enter notice waiver reason.",
      });
      return false;
    }

    if (form.blacklist_flag && !form.blacklist_reason.trim()) {
      toast.error("Blacklist reason is required", {
        description: "Please enter blacklist reason.",
      });
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      employee_id: form.employee_id,
      exit_type: toApiValue(form.exit_type),
      initiated_by: toApiValue(form.exit_initiated_by),
      resignation_date: form.resignation_date || null,
      notice_period_days: Number(form.notice_period_days || 0),
      notice_period_waived: Boolean(form.notice_period_waived),
      notice_waiver_reason: form.notice_period_waived
        ? form.notice_waiver_reason.trim()
        : null,
      last_working_date: form.last_working_date || null,
      exit_reason: toApiValue(form.exit_reason_primary),
      exit_reason_detail: form.notes.trim(),
      rehire_eligible: Boolean(form.rehire_eligible),
      blacklisted: Boolean(form.blacklist_flag),
      blacklist_reason: form.blacklist_flag ? form.blacklist_reason.trim() : null,
    };
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = buildPayload();

      if (mode === "edit" && exitId) {
        await api.put(`/people-hub/exits/${exitId}`, payload);
      } else {
        await api.post("/people-hub/exits", payload);
      }

      toast.success(mode === "create" ? "Exit case created" : "Exit case updated", {
        description:
          mode === "create"
            ? "Employee exit case has been submitted."
            : "Employee exit case has been updated.",
      });

      router.push("/people-hub/exits");
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Something went wrong while saving exit case.";

      showApiError(error, { ...({
        description: message,
      }), fallbackMessage: "Unable to save exit case" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroTitle = mode === "create" ? "Create Exit Case" : "Edit Exit Case";
  const heroDesc =
    mode === "create"
      ? "Create a new employee exit case and start the separation process."
      : "Update the selected employee exit case.";

  const rehireLabel = form.rehire_eligible ? "Rehire Eligible" : "Rehire Blocked";

  return (
    <div className="p-3 bg-white min-h-screen">
      <div className="space-y-4">
        <Card className="bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <LogOut className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">{heroTitle}</h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      People hub
                    </Badge>
                    {exitId ? (
                      <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                        ID: {exitId}
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
                  onClick={() => router.push("/people-hub/exits")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  className="bg-white text-brand-900 hover:bg-white/90 gap-2 disabled:opacity-70"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : mode === "create" ? (
                    "Submit Exit Case"
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
                  Employee & Exit Information
                </CardTitle>
                <CardDescription className="text-brand-700">
                  Select employee, exit type, and core separation details.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2" ref={employeeDropdownRef}>
                  <label className="text-sm font-medium text-brand-800">Employee</label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmployeeDropdownOpen((prev) => !prev)}
                      className="flex min-h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-brand-900 outline-none transition-colors hover:bg-gray-50"
                    >
                      {form.employee_id ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {form.employee_name} • {form.employee_code}
                          </span>
                          <span className="text-xs text-brand-700">
                            {form.designation || "No designation"} •{" "}
                            {form.department || "No department"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-brand-500">Search and select employee</span>
                      )}

                      <ChevronsUpDown className="h-4 w-4 text-brand-600" />
                    </button>

                    {employeeDropdownOpen ? (
                      <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                          <Search className="h-4 w-4 text-brand-600" />
                          <input
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            placeholder="Search by name, code, department..."
                            className="h-9 w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-brand-500"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-72 overflow-y-auto p-1">
                          {employeesLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-brand-700">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading employees...
                            </div>
                          ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee) => {
                              const isSelected = form.employee_id === employee.uuid;

                              return (
                                <button
                                  type="button"
                                  key={employee.uuid}
                                  onClick={() => handleEmployeeSelect(employee)}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-brand-100/60"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-semibold text-white">
                                      {employee.avatar_initials || employee.name?.slice(0, 2)}
                                    </div>

                                    <div>
                                      <div className="text-sm font-semibold text-brand-900">
                                        {employee.name}
                                      </div>
                                      <div className="text-xs text-brand-700">
                                        {employee.employee_code} •{" "}
                                        {employee.designation?.name || "No designation"} •{" "}
                                        {employee.department?.name || "No department"}
                                      </div>
                                    </div>
                                  </div>

                                  {isSelected ? (
                                    <Check className="h-4 w-4 text-brand-800" />
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-8 text-center text-sm text-brand-700">
                              No employee found.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Employee Code</label>
                  <Input
                    value={form.employee_code}
                    readOnly
                    placeholder="Auto-filled"
                    className="border-gray-200 text-brand-900 bg-brand-100/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Manager</label>
                  <Input
                    value={form.manager}
                    readOnly
                    placeholder="Auto-filled"
                    className="border-gray-200 text-brand-900 bg-brand-100/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Department</label>
                  <Input
                    value={form.department}
                    readOnly
                    placeholder="Auto-filled"
                    className="border-gray-200 text-brand-900 bg-brand-100/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Designation</label>
                  <Input
                    value={form.designation}
                    readOnly
                    placeholder="Auto-filled"
                    className="border-gray-200 text-brand-900 bg-brand-100/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Location</label>
                  <Input
                    value={form.location}
                    readOnly
                    placeholder="Auto-filled"
                    className="border-gray-200 text-brand-900 bg-brand-100/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Exit Type</label>
                  <Select
                    value={form.exit_type}
                    onValueChange={(v) => handleChange("exit_type", v as ExitType)}
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {EXIT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Initiated By</label>
                  <Select
                    value={form.exit_initiated_by}
                    onValueChange={(v) =>
                      handleChange("exit_initiated_by", v as ExitInitiatedBy)
                    }
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {EXIT_INITIATED_BY.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Primary Reason</label>
                  <Select
                    value={form.exit_reason_primary}
                    onValueChange={(v) =>
                      handleChange("exit_reason_primary", v as ExitReason)
                    }
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {EXIT_REASONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Resignation / Initiation Date
                  </label>
                  <Input
                    type="date"
                    value={form.resignation_date}
                    onChange={(e) => handleChange("resignation_date", e.target.value)}
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">Last Working Date</label>
                  <Input
                    type="date"
                    value={form.last_working_date}
                    onChange={(e) => handleChange("last_working_date", e.target.value)}
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Notice Period (Days)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.notice_period_days}
                    onChange={(e) =>
                      handleChange("notice_period_days", Number(e.target.value))
                    }
                    className="border-gray-200 text-brand-900"
                    disabled={
                      form.exit_type === "Termination" ||
                      form.exit_type === "Absconding" ||
                      form.exit_type === "Death"
                    }
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notice_period_waived}
                    onChange={(e) =>
                      handleChange("notice_period_waived", e.target.checked)
                    }
                    className="h-4 w-4 accent-[#443763]"
                  />
                  <div>
                    <div className="text-sm font-medium text-brand-900">
                      Notice Period Waived
                    </div>
                    <div className="text-xs text-brand-700">
                      Mark if notice period is waived.
                    </div>
                  </div>
                </label>

                {form.notice_period_waived ? (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Notice Waiver Reason
                    </label>
                    <textarea
                      value={form.notice_waiver_reason}
                      onChange={(e) =>
                        handleChange("notice_waiver_reason", e.target.value)
                      }
                      rows={3}
                      placeholder="Write notice waiver reason..."
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-500 focus:border-brand-800"
                    />
                  </div>
                ) : null}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-brand-800">
                    Exit Reason Detail / Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={5}
                    placeholder="Write exit reason detail, summary, or HR remarks..."
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-500 focus:border-brand-800"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-brand-800" />
                    Clearance & Process
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Process Stage
                    </label>
                    <Select
                      value={form.process_stage}
                      onValueChange={(v) =>
                        handleChange("process_stage", v as ProcessStage)
                      }
                    >
                      <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {PROCESS_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Clearance Status
                    </label>
                    <Select
                      value={form.clearance_status}
                      onValueChange={(v) =>
                        handleChange("clearance_status", v as ClearanceStatus)
                      }
                    >
                      <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {CLEARANCE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Clearance Progress (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.clearance_progress}
                      onChange={(e) =>
                        handleChange("clearance_progress", Number(e.target.value))
                      }
                      className="border-gray-200 text-brand-900"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-brand-700">Current Progress</span>
                      <span className="font-semibold text-brand-900">
                        {form.clearance_progress}%
                      </span>
                    </div>
                    <Progress value={form.clearance_progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand-800" />
                    FnF & Flags
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">FnF Status</label>
                    <Select
                      value={form.fnf_status}
                      onValueChange={(v) => handleChange("fnf_status", v as FnFStatus)}
                    >
                      <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {FNF_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      FnF Progress (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.fnf_progress}
                      onChange={(e) =>
                        handleChange("fnf_progress", Number(e.target.value))
                      }
                      className="border-gray-200 text-brand-900"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-brand-700">Current Progress</span>
                      <span className="font-semibold text-brand-900">
                        {form.fnf_progress}%
                      </span>
                    </div>
                    <Progress value={form.fnf_progress} className="h-2" />
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.rehire_eligible}
                      onChange={(e) =>
                        handleChange("rehire_eligible", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#443763]"
                    />
                    <div>
                      <div className="text-sm font-medium text-brand-900">
                        Rehire Eligible
                      </div>
                      <div className="text-xs text-brand-700">
                        Allow future rehire for this employee.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.blacklist_flag}
                      onChange={(e) =>
                        handleChange("blacklist_flag", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#443763]"
                    />
                    <div>
                      <div className="text-sm font-medium text-brand-900">
                        Blacklist Employee
                      </div>
                      <div className="text-xs text-brand-700">
                        Block rehire and flag this record.
                      </div>
                    </div>
                  </label>

                  {form.blacklist_flag ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">
                        Blacklist Reason
                      </label>
                      <textarea
                        value={form.blacklist_reason}
                        onChange={(e) =>
                          handleChange("blacklist_reason", e.target.value)
                        }
                        rows={3}
                        placeholder="Write blacklist reason..."
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-500 focus:border-brand-800"
                      />
                    </div>
                  ) : null}

                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.experience_letter_issued}
                      onChange={(e) =>
                        handleChange("experience_letter_issued", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#443763]"
                    />
                    <div>
                      <div className="text-sm font-medium text-brand-900">
                        Experience Letter Issued
                      </div>
                      <div className="text-xs text-brand-700">
                        Track whether the letter has been issued.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.exit_interview_conducted}
                      onChange={(e) =>
                        handleChange("exit_interview_conducted", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#443763]"
                    />
                    <div>
                      <div className="text-sm font-medium text-brand-900">
                        Exit Interview Conducted
                      </div>
                      <div className="text-xs text-brand-700">
                        Mark once HR completes the interview.
                      </div>
                    </div>
                  </label>
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
                  Quick preview of the exit case being created.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getExitTypeClass(form.exit_type)}>
                    {form.exit_type}
                  </Badge>
                  <Badge className={getStageClass(form.process_stage)}>
                    {form.process_stage}
                  </Badge>
                  <Badge className={getClearanceClass(form.clearance_status)}>
                    {form.clearance_status}
                  </Badge>
                  <Badge className={getFnFClass(form.fnf_status)}>
                    {form.fnf_status}
                  </Badge>
                </div>

                <div className="rounded-xl bg-brand-100/50 p-4 space-y-2">
                  <div className="text-xs text-brand-700">Employee</div>
                  <div className="font-semibold text-brand-900">
                    {form.employee_name || "No employee selected"}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    {form.employee_code || "Employee code will appear here"}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    {form.designation || "Designation"} •{" "}
                    {form.department || "Department"}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    {form.location || "Location"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">Exit Window</div>
                    <div className="mt-1 text-sm font-medium text-brand-900">
                      {form.resignation_date || "—"} → {form.last_working_date || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">Reason</div>
                    <div className="mt-1 text-sm font-medium text-brand-900">
                      {form.exit_reason_primary}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 px-3 py-3">
                    <div className="text-xs text-brand-700">Flags</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge className="bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100">
                        {rehireLabel}
                      </Badge>

                      {form.notice_period_waived ? (
                        <Badge className="bg-brand-500 text-white border-transparent hover:bg-brand-500">
                          Notice Waived
                        </Badge>
                      ) : null}

                      {form.blacklist_flag ? (
                        <Badge className="bg-brand-600 text-white border-transparent hover:bg-brand-600">
                          Blacklisted
                        </Badge>
                      ) : null}

                      {form.experience_letter_issued ? (
                        <Badge className="bg-brand-700 text-white border-transparent hover:bg-brand-700">
                          Letter Issued
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100">
                          Letter Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {selectedEmployee?.probation ? (
                    <div className="rounded-lg border border-gray-200 px-3 py-3">
                      <div className="text-xs text-brand-700">Probation Info</div>
                      <div className="mt-1 space-y-1 text-xs text-brand-800">
                        <div>Status: {selectedEmployee.probation.status}</div>
                        <div>Start: {selectedEmployee.probation.probation_start || "—"}</div>
                        <div>
                          Current End: {selectedEmployee.probation.current_end_date || "—"}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitCaseForm;