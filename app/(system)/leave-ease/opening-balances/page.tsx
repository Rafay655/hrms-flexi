"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  RefreshCw,
  Search,
  Table,
  Upload,
  UserRound,
  XCircle,
  ShieldCheck,
  CalendarDays,
  FolderUp,
} from "lucide-react";

type ImportStatus = "idle" | "success";
type ActiveTab = "manual" | "csv";

interface ImportRow {
  row: number;
  empId: string;
  name: string;
  annual: number;
  casual: number;
  sick: number;
  status: "Valid" | "Error";
  message?: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  avatar: string;
  department: string;
  designation: string;
}

const EMPLOYEES: EmployeeOption[] = [
  { id: "EMP-101", name: "Ahmed Khan", avatar: "AK", department: "Finance", designation: "Account Officer" },
  { id: "EMP-102", name: "Sara Miller", avatar: "SM", department: "HR", designation: "HR Executive" },
  { id: "EMP-103", name: "Tom Chen", avatar: "TC", department: "Operations", designation: "Coordinator" },
  { id: "EMP-104", name: "Anna Bell", avatar: "AB", department: "Admin", designation: "Officer" },
  { id: "EMP-105", name: "Zoya Malik", avatar: "ZM", department: "Payroll", designation: "Analyst" },
];

const MOCK_VALIDATION: ImportRow[] = [
  { row: 1, empId: "EMP-101", name: "Ahmed Khan", annual: 12, casual: 5, sick: 10, status: "Valid" },
  { row: 2, empId: "EMP-102", name: "Sara Miller", annual: 14, casual: 8, sick: 12, status: "Valid" },
  { row: 3, empId: "EMP-999", name: "Unknown User", annual: 10, casual: 2, sick: 5, status: "Error", message: "Employee not found" },
  { row: 4, empId: "EMP-103", name: "Tom Chen", annual: -2, casual: 0, sick: 4, status: "Error", message: "Negative value not allowed" },
  { row: 5, empId: "EMP-104", name: "Anna Bell", annual: 18, casual: 4, sick: 6, status: "Error", message: "Exceeds maximum cap (14)" },
  { row: 6, empId: "EMP-105", name: "Zoya Malik", annual: 10, casual: 5, sick: 10, status: "Valid" },
];

const LEAVE_TYPES = [
  { key: "annual", label: "Annual Leave", current: 0, cap: 14 },
  { key: "casual", label: "Casual Leave", current: 0, cap: 10 },
  { key: "sick", label: "Sick Leave", current: 0, cap: 12 },
] as const;

type BalanceKey = (typeof LEAVE_TYPES)[number]["key"];

type ManualBalances = Record<BalanceKey, number | "">;

function formatDateInput(date = new Date()) {
  return date.toISOString().split("T")[0];
}

export default function OpeningBalancesImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("manual");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(formatDateInput());
  const [manualBalances, setManualBalances] = useState<ManualBalances>({
    annual: "",
    casual: "",
    sick: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [selectedFileName, setSelectedFileName] = useState("");

  const selectedEmp = useMemo(
    () => EMPLOYEES.find((emp) => emp.id === selectedEmpId) ?? null,
    [selectedEmpId]
  );

  const errorRows = useMemo(
    () => MOCK_VALIDATION.filter((r) => r.status === "Error"),
    []
  );

  const validRows = useMemo(
    () => MOCK_VALIDATION.filter((r) => r.status === "Valid"),
    []
  );

  const validCount = validRows.length;
  const errorCount = errorRows.length;

  const totalManualDays = useMemo(() => {
  return Object.values(manualBalances).reduce<number>((sum, value) => {
    const num = typeof value === "number" ? value : 0;
    return sum + num;
  }, 0);
}, [manualBalances]);

  const handleBalanceChange = (key: BalanceKey, value: string) => {
    if (value === "") {
      setManualBalances((prev) => ({ ...prev, [key]: "" }));
      return;
    }

    const parsed = Number(value);
    setManualBalances((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? "" : parsed,
    }));
  };

  const resetManualForm = () => {
    setSelectedEmpId("");
    setEffectiveDate(formatDateInput());
    setManualBalances({
      annual: "",
      casual: "",
      sick: "",
    });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsUploading(true);
    setShowPreview(false);
    setImportStatus("idle");

    setTimeout(() => {
      setIsUploading(false);
      setShowPreview(true);
    }, 1200);
  };

  const handleImport = () => {
    setImportStatus("success");
  };

  const handleManualSave = () => {
    // Hook your API here later
    alert("Manual opening balances saved successfully.");
  };

  const templateHeaders = ["emp_id", "employee_name", "annual_leave", "casual_leave", "sick_leave", "effective_date"];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">Opening Balances Import</h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Initialize or reset employee leave entitlements for the fiscal period.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <FileText className="h-4 w-4" />
                Import History
              </button>
            </div>
          </div>

          {/* Top summary */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Import Mode</div>
              <div className="mt-2 text-sm font-semibold text-brand-900">
                {activeTab === "manual" ? "Manual Entry" : "CSV / Excel Import"}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Effective Date</div>
              <div className="mt-2 text-sm font-semibold text-brand-900">{effectiveDate}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Valid Rows</div>
              <div className="mt-2 text-sm font-semibold text-brand-900">{validCount}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Error Rows</div>
              <div className="mt-2 text-sm font-semibold text-brand-900">{errorCount}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "manual"
                ? "bg-brand-800 text-white"
                : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("csv")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "csv"
                ? "bg-brand-800 text-white"
                : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
            }`}
          >
            CSV Import
          </button>
        </div>

        {activeTab === "manual" ? (
          <div className="grid gap-6 xl:grid-cols-12">
            {/* Left */}
            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                    Employee Selection
                  </h3>
                </div>
                <div className="space-y-5 p-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">Employee</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <select
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      >
                        <option value="">Select employee</option>
                        {EMPLOYEES.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedEmp ? (
                    <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-800 text-sm font-semibold text-white">
                          {selectedEmp.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-brand-900">{selectedEmp.name}</div>
                          <div className="text-[11px] text-brand-700">{selectedEmp.id}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Department
                          </div>
                          <div className="mt-1 text-sm font-semibold text-brand-900">
                            {selectedEmp.department}
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Designation
                          </div>
                          <div className="mt-1 text-sm font-semibold text-brand-900">
                            {selectedEmp.designation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-5 text-center">
                      <UserRound className="mx-auto h-8 w-8 text-brand-300" />
                      <p className="mt-2 text-sm font-medium text-brand-800">No employee selected</p>
                      <p className="mt-1 text-xs text-brand-700">
                        Choose an employee to configure opening balances.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">Effective Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                      Opening Balance Rules
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-brand-100">
                      Opening balances overwrite existing accrual values and should only be used for fiscal initialization,
                      migration, or correction scenarios.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-brand-100">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>All changes should be audit logged as opening adjustments.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Negative values should not be accepted.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Policy caps should be validated before save.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="xl:col-span-8">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                      Configure Balances
                    </h3>
                    <p className="mt-1 text-sm text-brand-700">
                      Set opening balances by leave type for the selected employee.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-800">
                    Total Opening Days: <span className="font-semibold text-brand-900">{totalManualDays}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Leave Type
                        </th>
                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Current
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          New Opening
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Max Cap
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Effective Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-300/40 bg-white">
                      {LEAVE_TYPES.map((leave) => (
                        <tr key={leave.key} className="hover:bg-brand-100 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-brand-900">{leave.label}</div>
                            <div className="text-[11px] text-brand-700">Balance will overwrite current opening value</div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-sm font-semibold text-brand-900">{leave.current} d</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="relative max-w-[150px]">
                              <input
                                type="number"
                                min={0}
                                value={manualBalances[leave.key]}
                                onChange={(e) => handleBalanceChange(leave.key, e.target.value)}
                                placeholder="0"
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                                Days
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                              {leave.cap} Days
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="date"
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-brand-700">
                    {selectedEmp ? (
                      <>
                        Ready to save balances for{" "}
                        <span className="font-semibold text-brand-900">{selectedEmp.name}</span>.
                      </>
                    ) : (
                      "Select an employee before saving balances."
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetManualForm}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={!selectedEmp}
                      className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save Balances
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-12">
            {/* Left side */}
            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                    Import Workflow
                  </h3>
                </div>

                <div className="space-y-5 p-5">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-brand-900">Download Template</div>
                        <p className="mt-1 text-sm text-brand-700">
                          Use the standard file format with required columns.
                        </p>
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                        >
                          <Download className="h-4 w-4" />
                          Download CSV Template
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-brand-900">Upload File</div>
                        <p className="mt-1 text-sm text-brand-700">
                          Upload CSV or Excel file to validate balances before import.
                        </p>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleFileSelected}
                        />

                        <button
                          type="button"
                          onClick={openFilePicker}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Validating file...
                            </>
                          ) : (
                            <>
                              <FolderUp className="h-4 w-4" />
                              Choose File
                            </>
                          )}
                        </button>

                        {selectedFileName && (
                          <div className="mt-3 rounded-lg border border-gray-200 bg-brand-100 px-3 py-2 text-sm text-brand-800">
                            Selected file: <span className="font-semibold text-brand-900">{selectedFileName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2">
                        <FileSpreadsheet className="h-5 w-5 text-brand-800" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900">Expected Template Columns</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {templateHeaders.map((header) => (
                            <span
                              key={header}
                              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-800"
                            >
                              {header}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {showPreview && errorCount > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-sm font-semibold text-red-700">Validation Issues Found</div>
                          <p className="mt-1 text-sm text-red-700/90">
                            {errorCount} row(s) contain errors and will be skipped unless corrected.
                          </p>
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            <FileText className="h-4 w-4" />
                            Download Error Report
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="xl:col-span-8">
              {importStatus === "success" ? (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
                      <CheckCircle2 className="h-10 w-10 text-brand-800" />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-brand-900">Import Complete</h3>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-700">
                      145 employees were updated successfully. {errorCount} row(s) were skipped due to validation issues.
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Imported</div>
                        <div className="mt-2 text-lg font-bold text-brand-900">145</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Skipped</div>
                        <div className="mt-2 text-lg font-bold text-brand-900">{errorCount}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Imported By</div>
                        <div className="mt-2 text-lg font-bold text-brand-900">Admin User</div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setImportStatus("idle");
                          setShowPreview(false);
                          setSelectedFileName("");
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                      >
                        Download Import Log
                      </button>
                    </div>
                  </div>
                </div>
              ) : showPreview ? (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                        <Table className="h-4 w-4" />
                        Validation Preview
                      </h3>
                      <p className="mt-1 text-sm text-brand-700">
                        Review validated rows before importing data into the system.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-800">
                        Valid: <span className="font-semibold text-brand-900">{validCount}</span>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-800">
                        Errors: <span className="font-semibold text-brand-900">{errorCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Row</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Employee</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Annual</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Casual</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Sick</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-brand-300/40 bg-white">
                        {MOCK_VALIDATION.map((row) => (
                          <tr
                            key={row.row}
                            className={row.status === "Error" ? "bg-red-50/40" : "hover:bg-brand-100"}
                          >
                            <td className="px-5 py-4 text-sm font-semibold text-brand-900">{row.row}</td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-semibold text-brand-900">{row.name}</div>
                              <div className="text-[11px] text-brand-700">{row.empId}</div>
                            </td>
                            <td className="px-5 py-4 text-sm text-brand-900">{row.annual} d</td>
                            <td className="px-5 py-4 text-sm text-brand-900">{row.casual} d</td>
                            <td className="px-5 py-4 text-sm text-brand-900">{row.sick} d</td>
                            <td className="px-5 py-4">
                              {row.status === "Valid" ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Valid
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                    <XCircle className="h-3.5 w-3.5" />
                                    Error
                                  </span>
                                  <div className="text-[11px] text-red-700">{row.message}</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-brand-700">
                      Validation complete. <span className="font-semibold text-brand-900">{validCount}</span> row(s) are ready for import.
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPreview(false);
                          setSelectedFileName("");
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleImport}
                        className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                      >
                        Import {validCount} Valid Rows
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[460px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                    <Upload className="h-10 w-10" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-brand-900">Upload Preview Required</h3>
                  <p className="mt-2 max-w-xl text-sm text-brand-700">
                    Follow the workflow on the left to upload and validate your opening balances file before importing.
                  </p>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="mt-6 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                  >
                    Select File
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}