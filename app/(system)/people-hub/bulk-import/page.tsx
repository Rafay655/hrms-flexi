"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  History,
  SearchIcon,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Users,
  FileUp,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PER_PAGE = 10;

const ENTITIES = [
  "Bata Pakistan Ltd",
  "Bata Retail Ltd",
  "Bata Services Pvt Ltd",
  "Nexus Ventures",
  "Systems Limited",
];

const IMPORT_MODES = [
  "Create Only",
  "Update Existing",
  "Create + Update",
] as const;

const HISTORY_STATUSES = [
  "Completed",
  "Processing",
  "Failed",
  "Validated",
] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ImportMode = (typeof IMPORT_MODES)[number];
type ImportStatus = (typeof HISTORY_STATUSES)[number];

type ImportHistoryRow = {
  id: number;
  job_id: string;
  file_name: string;
  imported_by: string;
  imported_at: string;
  entity: string;
  mode: ImportMode;
  status: ImportStatus;
  total_records: number;
  success_count: number;
  failed_count: number;
};

type PreviewRow = {
  employee: string;
  employee_code: string;
  designation: string;
  department: string;
  email: string;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function useDebounced<T>(value: T, delay = 400) {
  const [d, setD] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status: ImportStatus) {
  switch (status) {
    case "Completed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Processing":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Failed":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    case "Validated":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                  */
/* -------------------------------------------------------------------------- */

function makeDummyHistory(count = 16): ImportHistoryRow[] {
  const rnd = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const pick = <T,>(arr: readonly T[]) => arr[rnd(0, arr.length - 1)];

  return Array.from({ length: count }, (_, i) => {
    const total = rnd(40, 520);
    const status = pick(HISTORY_STATUSES);
    const failed =
      status === "Failed" ? rnd(8, 40) : status === "Completed" ? rnd(0, 6) : rnd(0, 4);
    const success =
      status === "Validated" ? 0 : Math.max(total - failed, 0);

    return {
      id: i + 1,
      job_id: `IMP-${String(1200 + i)}`,
      file_name: `employees_batch_${String(i + 1).padStart(2, "0")}.xlsx`,
      imported_by: ["Rafay Ahmed", "Bilal Khan", "HR Officer", "Admin User"][rnd(0, 3)],
      imported_at: new Date(
        2026,
        1,
        rnd(1, 28),
        rnd(9, 19),
        rnd(0, 59)
      ).toISOString(),
      entity: pick(ENTITIES),
      mode: pick(IMPORT_MODES),
      status,
      total_records: total,
      success_count: success,
      failed_count: failed,
    };
  }).sort((a, b) => +new Date(b.imported_at) - +new Date(a.imported_at));
}

const PREVIEW_ROWS: PreviewRow[] = [
  {
    employee: "Muqadas Mazhar",
    employee_code: "EMP-1043",
    designation: "Team Lead",
    department: "Product",
    email: "sarah.chen@company.com",
  },
  {
    employee: "Aisha Khan",
    employee_code: "EMP-1044",
    designation: "HR Officer",
    department: "HR",
    email: "aisha.khan@company.com",
  },
  {
    employee: "Bilal Ahmed",
    employee_code: "EMP-1045",
    designation: "Finance Executive",
    department: "Finance",
    email: "bilal.ahmed@company.com",
  },
  {
    employee: "Hira Malik",
    employee_code: "EMP-1046",
    designation: "Software Engineer",
    department: "Engineering",
    email: "hira.malik@company.com",
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const EmployeeBulkImportPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entity, setEntity] = useState<string>(ENTITIES[0]);
  const [importMode, setImportMode] = useState<ImportMode>("Create + Update");
  const [validateOnly, setValidateOnly] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const [history, setHistory] = useState<ImportHistoryRow[]>(() => makeDummyHistory(16));
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 400);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [viewingJob, setViewingJob] = useState<ImportHistoryRow | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [q, perPage]);

  const filteredHistory = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return history;

    return history.filter((item) => {
      const hay =
        `${item.job_id} ${item.file_name} ${item.imported_by} ${item.entity} ${item.mode} ${item.status}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [history, q]);

  const totalEntries = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredHistory.slice(start, start + perPage);
  }, [filteredHistory, currentPage, perPage]);

  const completedCount = history.filter((x) => x.status === "Completed").length;
  const processingCount = history.filter((x) => x.status === "Processing").length;
  const failedCount = history.filter((x) => x.status === "Failed").length;
  const totalImportedRecords = history.reduce((sum, x) => sum + x.success_count, 0);

  const selectedFileEstimatedRows = selectedFile
    ? Math.max(20, Math.min(500, Math.floor(selectedFile.size / 180)))
    : 148;

  const selectedFileEstimatedErrors = selectedFile
    ? Math.max(0, Math.floor(selectedFileEstimatedRows * 0.04))
    : 6;

  const selectedFileEstimatedValid = Math.max(
    0,
    selectedFileEstimatedRows - selectedFileEstimatedErrors
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setSelectedFile(nextFile);
    toast.success("File selected", {
      description: `${nextFile.name} is ready for validation/import.`,
    });
  };

  const handleDownloadTemplate = () => {
    const template = [
      [
        "first_name",
        "last_name",
        "official_email",
        "mobile_personal",
        "designation",
        "department",
        "join_date",
        "employment_type",
        "status",
      ],
      [
        "Sarah",
        "Chen",
        "sarah.chen@company.com",
        "+9231110000137",
        "Team Lead",
        "Product",
        "2024-02-02",
        "Contract",
        "Active",
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8;" }));
    a.download = "employee_bulk_import_template.csv";
    a.click();

    toast.success("Template downloaded", {
      description: "Employee import template has been downloaded.",
    });
  };

  const handleDownloadErrors = (row: ImportHistoryRow) => {
    const csv = [
      ["row", "field", "message"],
      ["12", "official_email", "Email already exists"],
      ["18", "employee_code", "Duplicate employee code"],
      ["21", "join_date", "Invalid date format"],
    ]
      .map((r) => r.join(","))
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `${row.job_id.toLowerCase()}_errors.csv`;
    a.click();

    toast.success("Error file downloaded", {
      description: `Downloaded errors for ${row.job_id}.`,
    });
  };

  const handleValidate = () => {
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please choose an Excel or CSV file first.",
      });
      return;
    }

    const newRow: ImportHistoryRow = {
      id: Date.now(),
      job_id: `IMP-${Date.now().toString().slice(-5)}`,
      file_name: selectedFile.name,
      imported_by: "Current User",
      imported_at: new Date().toISOString(),
      entity,
      mode: importMode,
      status: "Validated",
      total_records: selectedFileEstimatedRows,
      success_count: 0,
      failed_count: selectedFileEstimatedErrors,
    };

    setHistory((prev) => [newRow, ...prev]);

    toast.success("Validation completed", {
      description: `${selectedFileEstimatedValid} valid rows and ${selectedFileEstimatedErrors} issue(s) detected.`,
    });
  };

  const handleStartImport = () => {
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please choose an Excel or CSV file first.",
      });
      return;
    }

    setIsImporting(true);

    const tempId = Date.now();

    const processingRow: ImportHistoryRow = {
      id: tempId,
      job_id: `IMP-${tempId.toString().slice(-5)}`,
      file_name: selectedFile.name,
      imported_by: "Current User",
      imported_at: new Date().toISOString(),
      entity,
      mode: importMode,
      status: validateOnly ? "Validated" : "Processing",
      total_records: selectedFileEstimatedRows,
      success_count: validateOnly ? 0 : 0,
      failed_count: validateOnly ? selectedFileEstimatedErrors : 0,
    };

    setHistory((prev) => [processingRow, ...prev]);

    if (validateOnly) {
      setIsImporting(false);
      toast.success("Validation-only run completed", {
        description: "No records were imported. File was only validated.",
      });
      return;
    }

    toast.success("Import started", {
      description: "Your employee import job is now processing.",
    });

    window.setTimeout(() => {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                status: "Completed",
                success_count: selectedFileEstimatedValid,
                failed_count: selectedFileEstimatedErrors,
              }
            : item
        )
      );

      setIsImporting(false);

      toast.success("Import completed", {
        description: `${selectedFileEstimatedValid} records imported successfully.`,
      });
    }, 1800);
  };

  const handleReRun = (row: ImportHistoryRow) => {
    const rerun: ImportHistoryRow = {
      ...row,
      id: Date.now(),
      job_id: `IMP-${Date.now().toString().slice(-5)}`,
      imported_at: new Date().toISOString(),
      status: "Processing",
      success_count: 0,
      failed_count: 0,
    };

    setHistory((prev) => [rerun, ...prev]);

    toast.success("Re-run started", {
      description: `${row.file_name} has been queued again.`,
    });

    window.setTimeout(() => {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === rerun.id
            ? {
                ...item,
                status: "Completed",
                success_count: Math.max(rerun.total_records - 2, 0),
                failed_count: 2,
              }
            : item
        )
      );
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-6">
      
        <Card className="overflow-hidden bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] border border-gray-200 shadow-sm">
          <div className="relative h-full  p-6 text-white">
            {/* <div className="absolute h-full inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_35%)]" /> */}
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-sm">
                  <FileUp className="h-7 w-7 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Employee Bulk Import</h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      Beautiful UI
                    </Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-white/80">
                    Upload employee records in bulk, validate them before import, and track every import job with a clean history view.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Smart import workflow
                    </Badge>
                    <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Validation-ready
                    </Badge>
                    <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                      <History className="mr-1 h-3 w-3" />
                      Full import history
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>

                <Button
                  className="bg-white text-brand-900 hover:bg-white/90"
                  onClick={handleChooseFile}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Summary Cards                                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Completed Imports
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">{completedCount}</p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Processing Jobs
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">{processingCount}</p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <Clock3 className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Failed Jobs
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">{failedCount}</p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <AlertCircle className="h-5 w-5 text-brand-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Records Imported
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {totalImportedRecords.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <Users className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Tabs                                                               */}
        {/* ------------------------------------------------------------------ */}
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="h-auto rounded-xl bg-brand-100 p-1">
            <TabsTrigger
              value="import"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-brand-800 data-[state=active]:text-white"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-brand-800 data-[state=active]:text-white"
            >
              <History className="mr-2 h-4 w-4" />
              Import History
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* Import Tab                                                       */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="import" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              {/* Upload + Preview */}
              <div className="space-y-6">
                <Card className="overflow-hidden border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800">
                        <FileSpreadsheet className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-brand-900">
                          Upload Employee File
                        </CardTitle>
                        <CardDescription className="text-brand-700">
                          Supports CSV and Excel formats for employee master upload.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div
                      onClick={handleChooseFile}
                      className="group cursor-pointer rounded-2xl border-2 border-dashed border-brand-300 bg-brand-100/40 p-10 text-center transition-all hover:border-brand-800 hover:bg-brand-100"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <UploadCloud className="h-8 w-8 text-brand-800" />
                      </div>

                      <h3 className="mt-5 text-lg font-semibold text-brand-900">
                        Drop your file here or click to browse
                      </h3>
                      <p className="mt-1 text-sm text-brand-700">
                        Recommended format: template-based CSV or Excel file
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <Badge className="border-gray-200 bg-white text-brand-800 hover:bg-white">
                          CSV
                        </Badge>
                        <Badge className="border-gray-200 bg-white text-brand-800 hover:bg-white">
                          XLSX
                        </Badge>
                        <Badge className="border-gray-200 bg-white text-brand-800 hover:bg-white">
                          Max 10 MB
                        </Badge>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800">
                              <FileSpreadsheet className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-brand-900">{selectedFile.name}</p>
                              <p className="text-xs text-brand-700">
                                {formatBytes(selectedFile.size)} • Ready for validation/import
                              </p>
                            </div>
                          </div>

                          <Badge className="w-fit bg-brand-700 text-white border-transparent hover:bg-brand-700">
                            File Selected
                          </Badge>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <div className="rounded-xl bg-brand-100 p-4">
                            <p className="text-xs text-brand-700">Estimated Rows</p>
                            <p className="mt-1 text-2xl font-bold text-brand-900">
                              {selectedFileEstimatedRows}
                            </p>
                          </div>
                          <div className="rounded-xl bg-brand-100 p-4">
                            <p className="text-xs text-brand-700">Likely Valid</p>
                            <p className="mt-1 text-2xl font-bold text-brand-900">
                              {selectedFileEstimatedValid}
                            </p>
                          </div>
                          <div className="rounded-xl bg-brand-100 p-4">
                            <p className="text-xs text-brand-700">Possible Issues</p>
                            <p className="mt-1 text-2xl font-bold text-brand-900">
                              {selectedFileEstimatedErrors}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-brand-700">Valid rows confidence</span>
                              <span className="font-semibold text-brand-900">
                                {Math.round(
                                  (selectedFileEstimatedValid / selectedFileEstimatedRows) * 100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                (selectedFileEstimatedValid / selectedFileEstimatedRows) * 100
                              }
                              className="h-2"
                            />
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-brand-700">Import readiness</span>
                              <span className="font-semibold text-brand-900">
                                {selectedFileEstimatedErrors === 0 ? "Excellent" : "Needs review"}
                              </span>
                            </div>
                            <Progress
                              value={selectedFileEstimatedErrors === 0 ? 100 : 82}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-brand-900">
                      Preview Sample Rows
                    </CardTitle>
                    <CardDescription className="text-brand-700">
                      A quick look at what the import file should resemble.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-brand-100/60">
                          <tr>
                            {["Employee", "Code", "Designation", "Department", "Email"].map((head) => (
                              <th
                                key={head}
                                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800"
                              >
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-300/40 bg-white">
                          {PREVIEW_ROWS.map((row) => (
                            <tr key={`${row.employee}-${row.employee_code}`} className="hover:bg-brand-100/40">
                              <td className="px-5 py-3 text-sm font-medium text-brand-900">
                                {row.employee}
                              </td>
                              <td className="px-5 py-3 text-sm text-brand-900">
                                {row.employee_code}
                              </td>
                              <td className="px-5 py-3 text-sm text-brand-900">
                                {row.designation}
                              </td>
                              <td className="px-5 py-3 text-sm text-brand-900">
                                {row.department}
                              </td>
                              <td className="px-5 py-3 text-sm text-brand-900">
                                {row.email}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings + CTA */}
              <div className="space-y-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-brand-900">
                      Import Settings
                    </CardTitle>
                    <CardDescription className="text-brand-700">
                      Configure how this employee batch should be processed.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5 p-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">Entity</label>
                      <Select value={entity} onValueChange={setEntity}>
                        <SelectTrigger className="border-gray-200 text-brand-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-800">Import Mode</label>
                      <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                        <SelectTrigger className="border-gray-200 text-brand-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMPORT_MODES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-brand-800">Processing Options</label>

                      <button
                        type="button"
                        onClick={() => setValidateOnly((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                          validateOnly
                            ? "border-brand-800 bg-brand-100"
                            : "border-gray-200 bg-white hover:bg-brand-100/40"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-brand-900">Validate Only</p>
                          <p className="text-xs text-brand-700">
                            Check issues but do not import records.
                          </p>
                        </div>
                        <Badge
                          className={
                            validateOnly
                              ? "bg-brand-800 text-white border-transparent"
                              : "bg-white text-brand-800 border-gray-200"
                          }
                        >
                          {validateOnly ? "Enabled" : "Disabled"}
                        </Badge>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSendWelcomeEmail((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                          sendWelcomeEmail
                            ? "border-brand-800 bg-brand-100"
                            : "border-gray-200 bg-white hover:bg-brand-100/40"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-brand-900">Send Welcome Emails</p>
                          <p className="text-xs text-brand-700">
                            Notify newly created employees after successful import.
                          </p>
                        </div>
                        <Badge
                          className={
                            sendWelcomeEmail
                              ? "bg-brand-800 text-white border-transparent"
                              : "bg-white text-brand-800 border-gray-200"
                          }
                        >
                          {sendWelcomeEmail ? "Enabled" : "Disabled"}
                        </Badge>
                      </button>
                    </div>

                    <div className="rounded-2xl bg-brand-100/60 p-4">
                      <p className="text-sm font-semibold text-brand-900">Supported field examples</p>
                      <ul className="mt-3 space-y-2 text-xs text-brand-700">
                        <li>• First Name, Last Name, Official Email</li>
                        <li>• Mobile, Designation, Department, Join Date</li>
                        <li>• Employment Type, Status, Work Location</li>
                        <li>• Employee Code can be optional if system auto-generates it</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* <Card className="overflow-hidden border border-gray-200 shadow-sm">
                  <div className="bg-linear-to-br from-brand-800 via-[#4D446E] to-brand-900 p-5 text-white">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Ready to Import?</h3>
                        <p className="mt-1 text-sm text-white/80">
                          Validate your file first, then run the final import with confidence.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <Button
                        className="w-full bg-white text-brand-900 hover:bg-white/90"
                        onClick={handleValidate}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Validate File
                      </Button>

                      <Button
                        className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
                        onClick={handleStartImport}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Import...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {validateOnly ? "Run Validation Only" : "Start Import"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-brand-900">
                      Import Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    {[
                      "Download the employee import template",
                      "Upload CSV or Excel file",
                      "Validate records and review errors",
                      "Run import and track the job in history",
                    ].map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="pt-1 text-sm text-brand-900">{step}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card> */}
              </div>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* History Tab                                                      */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-brand-900">
                      Bulk Import History
                    </CardTitle>
                    <CardDescription className="text-brand-700">
                      Review all past import jobs, outcomes, and error exports.
                    </CardDescription>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-[280px]">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <Input
                        placeholder="Search by job, file, user, entity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-700">Show</span>
                      <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                        <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {[10, 25, 50, 100].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-brand-700">entries</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm">
                      <span className="text-brand-700">Showing </span>
                      <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                      <span className="text-brand-700"> to </span>
                      <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                      <span className="text-brand-700"> of </span>
                      <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                      <span className="text-brand-700"> jobs</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-xs text-brand-700">
                        <span className="font-semibold text-brand-900">{completedCount}</span> Completed
                      </div>
                      <div className="h-3 w-px bg-brand-300" />
                      <div className="text-xs text-brand-700">
                        <span className="font-semibold text-brand-900">{processingCount}</span> Processing
                      </div>
                      <div className="h-3 w-px bg-brand-300" />
                      <div className="text-xs text-brand-700">
                        <span className="font-semibold text-brand-900">{failedCount}</span> Failed
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 ">
                        <tr>
                          {[
                            "SR.",
                            "Job ID",
                            "File",
                            "Imported By",
                            
                            "Status",
                            "Records",
                            "Result",
                            "Actions",
                          ].map((head) => (
                            <th
                              key={head}
                              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-brand-300/40 bg-white">
                        {paginatedHistory.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-16 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <History className="h-10 w-10 text-brand-300" />
                                <p className="font-medium text-brand-800">No import history found</p>
                                <p className="text-sm text-brand-600">Try adjusting your search criteria</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedHistory.map((row,i) => (
                            <tr key={row.id} className="align-top transition-colors hover:bg-brand-100/40">
                              <td className="px-5 py-4">
                               {i+1}
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-brand-900">{row.job_id}</div>
                                <div className="text-[11px] text-brand-700">
                                  {formatDateTime(row.imported_at)}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="min-w-[220px]">
                                  <div className="font-medium text-brand-900">{row.file_name}</div>
                                  <div className="text-[11px] text-brand-700">Employee master batch</div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm text-brand-900">
                                {row.imported_by}
                              </td>

                              {/* <td className="px-5 py-4 text-sm text-brand-900">
                                {row.entity}
                              </td>

                              <td className="px-5 py-4">
                                <Badge className="border-gray-200 bg-brand-100 text-brand-800 hover:bg-brand-100">
                                  {row.mode}
                                </Badge>
                              </td> */}

                              <td className="px-5 py-4">
                                <Badge className={getStatusClass(row.status)}>{row.status}</Badge>
                              </td>

                              <td className="px-5 py-4 text-sm font-medium text-brand-900">
                                {row.total_records.toLocaleString()}
                              </td>

                              <td className="px-5 py-4">
                                <div className="min-w-[120px]">
                                  <div className="text-sm font-medium text-brand-900">
                                    {row.success_count.toLocaleString()} success
                                  </div>
                                  <div className="text-[11px] text-brand-700">
                                    {row.failed_count.toLocaleString()} failed
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-brand-800 hover:bg-brand-100 hover:text-brand-900"
                                    onClick={() => setViewingJob(row)}
                                    title="View"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                                    onClick={() => handleReRun(row)}
                                    title="Re-run"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>

                                  {row.failed_count > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-brand-600 hover:bg-brand-100 hover:text-brand-900"
                                      onClick={() => handleDownloadErrors(row)}
                                      title="Download Errors"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {paginatedHistory.length > 0 && (
                    <div className="border-t border-gray-200 px-5 py-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-brand-700">
                          Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                          <span className="font-semibold text-brand-900">{totalPages}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(1)}
                            disabled={currentPage === 1}
                            className="border-gray-200 text-brand-800 hover:bg-brand-200"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="border-gray-200 text-brand-800 hover:bg-brand-200"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="mx-1 flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let p: number;
                              if (totalPages <= 5) p = i + 1;
                              else if (currentPage <= 3) p = i + 1;
                              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                              else p = currentPage - 2 + i;

                              return (
                                <Button
                                  key={p}
                                  variant={currentPage === p ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPage(p)}
                                  className={
                                    currentPage === p
                                      ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900"
                                      : "border-gray-200 text-brand-800 hover:bg-brand-200"
                                  }
                                >
                                  {p}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="border-gray-200 text-brand-800 hover:bg-brand-200"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="border-gray-200 text-brand-800 hover:bg-brand-200"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-sm text-brand-700">
                          <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                          {" – "}
                          <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                          {" of "}
                          <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                          {" jobs"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ------------------------------------------------------------------ */}
        {/* View Job Dialog                                                    */}
        {/* ------------------------------------------------------------------ */}
        <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
          <DialogContent className="max-w-2xl border border-gray-200 bg-white p-0 overflow-hidden">
            {viewingJob && (
              <>
                <div className="bg-brand-900 px-6 py-5">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                      <History className="h-4 w-4 opacity-80" />
                      Import Job Details
                    </DialogTitle>
                    <DialogDescription className="text-brand-300">
                      Review summary and outcome of the selected import job.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">Job ID</p>
                      <p className="mt-1 font-semibold text-brand-900">{viewingJob.job_id}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">Status</p>
                      <div className="mt-2">
                        <Badge className={getStatusClass(viewingJob.status)}>
                          {viewingJob.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">File Name</p>
                      <p className="mt-1 font-semibold text-brand-900">{viewingJob.file_name}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">Imported By</p>
                      <p className="mt-1 font-semibold text-brand-900">{viewingJob.imported_by}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">Entity</p>
                      <p className="mt-1 font-semibold text-brand-900">{viewingJob.entity}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-brand-700">Mode</p>
                      <p className="mt-1 font-semibold text-brand-900">{viewingJob.mode}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-brand-100 p-4 text-center">
                      <p className="text-xs text-brand-700">Total Records</p>
                      <p className="mt-1 text-2xl font-bold text-brand-900">
                        {viewingJob.total_records.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-brand-100 p-4 text-center">
                      <p className="text-xs text-brand-700">Successful</p>
                      <p className="mt-1 text-2xl font-bold text-brand-900">
                        {viewingJob.success_count.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-brand-100 p-4 text-center">
                      <p className="text-xs text-brand-700">Failed</p>
                      <p className="mt-1 text-2xl font-bold text-brand-900">
                        {viewingJob.failed_count.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-brand-700">Success Ratio</span>
                      <span className="font-semibold text-brand-900">
                        {viewingJob.total_records > 0
                          ? Math.round(
                              (viewingJob.success_count / viewingJob.total_records) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        viewingJob.total_records > 0
                          ? (viewingJob.success_count / viewingJob.total_records) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {viewingJob.failed_count > 0 && (
                      <Button
                        variant="outline"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                        onClick={() => handleDownloadErrors(viewingJob)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Errors
                      </Button>
                    )}
                    <Button
                      className="bg-brand-800 text-white hover:bg-brand-900"
                      onClick={() => handleReRun(viewingJob)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-run Import
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EmployeeBulkImportPage;