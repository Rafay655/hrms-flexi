"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GitBranch,
  ArrowRightLeft,
  TrendingUp,
  Briefcase,
  Users,
  Target,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Loader2,
  Building2,
  MapPin,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*  Types & Helpers                                                            */
/* -------------------------------------------------------------------------- */

// Re‑use the employee type from the probation endpoint (same as first component)
type ApiProbationEmployee = {
  id: number;
  uuid: string;
  employee_code: string;
  employment_status: string;
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
  location: {
    id?: number | string;
    name?: string;
    title?: string;
  } | null;
  probation: any; // not needed
};

type MetaItem = {
  id: number | string;
  uuid?: string;
  name?: string;
  title?: string;
  code?: string;
};

type ApiListResponse<T> = {
  data?: T[];
  records?: T[];
  items?: T[];
};

type FormState = {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  employment_status: string;
  manager: string;

  event_type: string; // new field

  requested_department_id: string;
  requested_designation_id: string;
  requested_location_id: string;

  effective_date: string;
  reason: string;
  remarks: string;
};

const EVENT_TYPES = [
  { value: "promotion", label: "Promotion" },
  { value: "transfer_dept", label: "Transfer (Department)" },
  { value: "redesignation", label: "Redesignation" },
] as const;

const initialForm: FormState = {
  employee_id: "",
  employee_name: "",
  employee_code: "",
  employment_status: "",
  manager: "",
  event_type: "",
  requested_department_id: "",
  requested_designation_id: "",
  requested_location_id: "",
  effective_date: new Date().toISOString().split("T")[0],
  reason: "",
  remarks: "",
};

function getList<T>(response: ApiListResponse<T> | T[]): T[] {
  if (Array.isArray(response)) return response;
  return response?.data ?? response?.records ?? response?.items ?? [];
}

function getEmployeeName(employee: ApiProbationEmployee) {
  return employee.name || `Employee #${employee.id}`;
}

function makeEmployeeOption(employee: ApiProbationEmployee): Option {
  return {
    value: employee.uuid, // use UUID because the first UI relied on uuid
    label: `${employee.employee_code} - ${getEmployeeName(employee)}`,
  };
}

function makeMetaOption(item: MetaItem): Option {
  const label = item.code
    ? `${item.code} - ${item.name ?? item.title ?? item.id}`
    : item.name ?? item.title ?? `#${item.id}`;

  return {
    value: String(item.id),
    label,
  };
}

function formatStatus(value?: string | null) {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLocationName(location: ApiProbationEmployee["location"]) {
  if (!location) return "—";
  return location.name || location.title || "—";
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function CareerEventForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [employees, setEmployees] = useState<ApiProbationEmployee[]>([]);
  const [departments, setDepartments] = useState<MetaItem[]>([]);
  const [designations, setDesignations] = useState<MetaItem[]>([]);
  const [locations, setLocations] = useState<MetaItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived: selected employee object
  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.uuid === form.employee_id),
    [employees, form.employee_id]
  );

  // Options for SearchableSelect
  const employeeOptions = useMemo(() => employees.map(makeEmployeeOption), [employees]);
  const departmentOptions = useMemo(() => departments.map(makeMetaOption), [departments]);
  const designationOptions = useMemo(() => designations.map(makeMetaOption), [designations]);
  const locationOptions = useMemo(() => locations.map(makeMetaOption), [locations]);

  // Set form fields from selected employee
  useEffect(() => {
    if (!selectedEmployee) return;

    setForm((prev) => ({
      ...prev,
      employee_name: getEmployeeName(selectedEmployee),
      employee_code: selectedEmployee.employee_code || "",
      employment_status: selectedEmployee.employment_status || "",
      manager: selectedEmployee.manager
        ? `${selectedEmployee.manager.name} • ${selectedEmployee.manager.employee_code}`
        : "—",
    }));
  }, [selectedEmployee]);

  // Load dropdown data
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setIsLoading(true);

        const [
          empRes,
          deptRes,
          desigRes,
          locRes,
        ] = await Promise.all([
          api.get("/probation/employees?per_page=100"),
          api.get("/flexi-meta/company/departments?per_page=100"),
          api.get("/flexi-meta/company/designations?per_page=100"),
          api.get("/flexi-meta/company/locations?per_page=100"),
        ]);

        if (ignore) return;

        setEmployees(getList<ApiProbationEmployee>(empRes.data));
        setDepartments(getList<MetaItem>(deptRes.data));
        setDesignations(getList<MetaItem>(desigRes.data));
        setLocations(getList<MetaItem>(locRes.data));
      } catch (error: any) {
        if (ignore) return;
        showApiError(error, { ...({
          description:
            error?.response?.data?.message || "Something went wrong while loading dropdowns.",
        }), fallbackMessage: "Unable to load form data" });
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Change summary for the right panel
  const changeSummary = useMemo(() => {
    if (!selectedEmployee) return [];

    const changes: string[] = [];

    const currentDept = selectedEmployee.department?.name;
    const reqDept = departments.find((d) => String(d.id) === form.requested_department_id)?.name;
    if (reqDept && currentDept !== reqDept) {
      changes.push(`Department: ${currentDept || "—"} → ${reqDept}`);
    }

    const currentDesig = selectedEmployee.designation?.name;
    const reqDesig = designations.find((d) => String(d.id) === form.requested_designation_id)?.name;
    if (reqDesig && currentDesig !== reqDesig) {
      changes.push(`Designation: ${currentDesig || "—"} → ${reqDesig}`);
    }

    const currentLoc = getLocationName(selectedEmployee.location);
    const reqLoc = locations.find((l) => String(l.id) === form.requested_location_id)?.name;
    if (reqLoc && currentLoc !== reqLoc) {
      changes.push(`Location: ${currentLoc || "—"} → ${reqLoc}`);
    }

    return changes;
  }, [selectedEmployee, departments, designations, locations, form]);

  // Handlers
  const handleEmployeeChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      employee_id: value,
      // Reset requested fields when employee changes? Keep for now.
    }));
  };

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(initialForm);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employee_id) {
      toast.error("Employee required", { description: "Please select an employee." });
      return;
    }
    if (!form.event_type) {
      toast.error("Event type required", { description: "Please select an event type." });
      return;
    }
    if (!form.requested_department_id || !form.requested_designation_id || !form.requested_location_id) {
      toast.error("Assignment required", {
        description: "Please choose requested department, designation, and location.",
      });
      return;
    }

    const payload = {
      employee_id: form.employee_id,
      event_type: form.event_type,
      requested_department_id: Number(form.requested_department_id),
      requested_designation_id: Number(form.requested_designation_id),
      requested_location_id: Number(form.requested_location_id),
      effective_date: form.effective_date || null,
      reason: form.reason || null,
      remarks: form.remarks || null,
      salary_impact: false,
    };

    try {
      setIsSubmitting(true);
      await api.post("/career-events", payload);
      toast.success("Career event submitted", {
        description: "Transfer / promotion request has been sent for approval.",
      });
      resetForm();
      router.push("/people-hub/transfer-promotion");
    } catch (error: any) {
      showApiError(error, { ...({
        description:
          error?.response?.data?.message || "Unable to submit career event. Please check required fields.",
      }), fallbackMessage: "Submission failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Hero Card */}
          <Card className="overflow-hidden border border-gray-200 bg-gradient-to-r from-brand-900 via-[#3D355D] to-[#8379ad] shadow-sm">
            <div className="p-6">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                    <ArrowRightLeft className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-white">
                        Transfer / Promotion
                      </h1>
                      <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                        PeopleHub
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-white/80">
                      Select an employee and define the requested assignment.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => router.push("/people-hub/transfer-promotion")}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="gap-2 bg-white text-brand-900 hover:bg-white/90 disabled:opacity-70"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Employee Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-brand-900">
                    Employee Information
                  </CardTitle>
                  <CardDescription className="text-brand-700">
                    Search and select an employee. Current details will be shown below.
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">Employee</label>
                    <SearchableSelect
                      options={employeeOptions}
                      value={form.employee_id}
                      onChange={handleEmployeeChange}
                      placeholder="Select employee"
                      searchPlaceholder="Search employee..."
                      emptyText="No employee found."
                      groupLabel="Employees"
                      allowAll={false}
                      icon={UserRound}
                      widthClass="w-full"
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Event Type Dropdown (new) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.event_type}
                      onValueChange={(value) => updateForm("event_type", value)}
                    >
                      <SelectTrigger className="w-full border-gray-200 text-brand-800">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">Employee Code</label>
                    <Input
                      value={form.employee_code}
                      readOnly
                      placeholder="Auto‑filled"
                      className="border-gray-200 bg-brand-100/50 text-brand-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">Employment Status</label>
                    <Input
                      value={formatStatus(form.employment_status)}
                      readOnly
                      placeholder="Auto‑filled"
                      className="border-gray-200 bg-brand-100/50 text-brand-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">Reporting Manager</label>
                    <Input
                      value={form.manager}
                      readOnly
                      placeholder="Auto‑filled"
                      className="border-gray-200 bg-brand-100/50 text-brand-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current & Requested Assignment cards side by side */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Current Assignment */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-900">
                      <Briefcase className="h-4 w-4 text-brand-800" />
                      Current Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <ReadOnlyField
                      label="Department"
                      value={selectedEmployee?.department?.name}
                      icon={Building2}
                    />
                    <ReadOnlyField
                      label="Designation"
                      value={selectedEmployee?.designation?.name}
                      icon={Briefcase}
                    />
                    <ReadOnlyField
                      label="Location"
                      value={getLocationName(selectedEmployee?.location || {})}
                      icon={MapPin}
                    />
                  </CardContent>
                </Card>

                {/* Requested Assignment */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-900">
                      <Target className="h-4 w-4 text-brand-800" />
                      Requested Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">
                        Requested Department
                      </label>
                      <SearchableSelect
                        options={departmentOptions}
                        value={form.requested_department_id}
                        onChange={(v) => updateForm("requested_department_id", v)}
                        placeholder="Select department"
                        searchPlaceholder="Search department..."
                        emptyText="No department found."
                        groupLabel="Departments"
                        allowAll={false}
                        icon={Building2}
                        widthClass="w-full"
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">
                        Requested Designation
                      </label>
                      <SearchableSelect
                        options={designationOptions}
                        value={form.requested_designation_id}
                        onChange={(v) => updateForm("requested_designation_id", v)}
                        placeholder="Select designation"
                        searchPlaceholder="Search designation..."
                        emptyText="No designation found."
                        groupLabel="Designations"
                        allowAll={false}
                        icon={Briefcase}
                        widthClass="w-full"
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">
                        Requested Location
                      </label>
                      <SearchableSelect
                        options={locationOptions}
                        value={form.requested_location_id}
                        onChange={(v) => updateForm("requested_location_id", v)}
                        placeholder="Select location"
                        searchPlaceholder="Search location..."
                        emptyText="No location found."
                        groupLabel="Locations"
                        allowAll={false}
                        icon={MapPin}
                        widthClass="w-full"
                        isLoading={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reason & Date Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900">
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">
                        Effective Date
                      </label>
                      <Input
                        type="date"
                        value={form.effective_date}
                        onChange={(e) => updateForm("effective_date", e.target.value)}
                        className="border-gray-200 text-brand-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Reason / Justification
                    </label>
                    <textarea
                      value={form.reason}
                      onChange={(e) => updateForm("reason", e.target.value)}
                      rows={4}
                      placeholder="Write the business reason for this transfer / promotion..."
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-500 focus:border-brand-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-800">
                      Remarks (optional)
                    </label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => updateForm("remarks", e.target.value)}
                      rows={3}
                      placeholder="Any additional notes..."
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-500 focus:border-brand-800"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column – Summary & Actions */}
            <div className="space-y-4">
              {/* Live Summary */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900">
                    Live Summary
                  </CardTitle>
                  <CardDescription className="text-brand-700">
                    Preview of the request being created.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-brand-800 text-white border-transparent hover:bg-brand-800">
                      {EVENT_TYPES.find(e => e.value === form.event_type)?.label || "Event"}
                    </Badge>
                    <Badge className="border-gray-200 bg-brand-100 text-brand-800 hover:bg-brand-100">
                      Pending Approval
                    </Badge>
                  </div>

                  <div className="space-y-2 rounded-xl bg-brand-100/50 p-4">
                    <div className="text-xs text-brand-700">Employee</div>
                    <div className="font-semibold text-brand-900">
                      {form.employee_name || "No employee selected"}
                    </div>
                    {form.employee_code && (
                      <div className="text-[11px] text-brand-700">
                        {form.employee_code}
                      </div>
                    )}
                    {form.employment_status && (
                      <div className="text-[11px] text-brand-700">
                        Status: {formatStatus(form.employment_status)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-brand-900">
                      Change Summary
                    </div>
                    {changeSummary.length > 0 ? (
                      <div className="space-y-2">
                        {changeSummary.map((item) => (
                          <div
                            key={item}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-800"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-brand-700">
                        No change detected yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Approval Chain Preview (static) */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900">
                    Approval Chain Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {[
                    { label: "Reporting Manager", icon: Users },
                    { label: "HR Manager", icon: ShieldCheck },
                    { label: "GM / Director", icon: CheckCircle2 },
                  ].map(({ label, icon: Icon }, index) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-brand-100 p-2">
                          <Icon className="h-4 w-4 text-brand-800" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-brand-900">
                            {label}
                          </div>
                          <div className="text-[11px] text-brand-700">
                            Step {index + 1}
                          </div>
                        </div>
                      </div>
                      <Badge className="border-gray-200 bg-brand-100 text-brand-800 hover:bg-brand-100">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Action Card */}
              <Card className="overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-br from-brand-800 via-[#4D446E] to-brand-900 p-5 text-white">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                      {form.event_type === "promotion" ? (
                        <TrendingUp className="h-5 w-5 text-white" />
                      ) : form.event_type === "redesignation" ? (
                        <GitBranch className="h-5 w-5 text-white" />
                      ) : (
                        <ArrowRightLeft className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Ready to Submit?</h3>
                      <p className="mt-1 text-sm text-white/80">
                        Review the change summary and submit the request for approval.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <Button
                      type="submit"
                      className="w-full bg-white text-brand-900 hover:bg-white/90 disabled:opacity-70"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Submit Event
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-70"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      <Clock3 className="mr-2 h-4 w-4" />
                      Reset Form
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Read‑only Field Helper                                                     */
/* -------------------------------------------------------------------------- */
type ReadOnlyFieldProps = {
  label: string;
  value?: string | null;
  icon: React.ComponentType<{ className?: string }>;
};

function ReadOnlyField({ label, value, icon: Icon }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="rounded-md border border-gray-200 bg-brand-100/50 px-3 py-2 text-sm font-medium text-brand-900">
        {value || "—"}
      </div>
    </div>
  );
}