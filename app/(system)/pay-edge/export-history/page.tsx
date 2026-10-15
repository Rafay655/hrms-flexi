"use client";
import { useMemo, useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock3,
  RefreshCw,
  FileText,
  Landmark,
  X,
  Terminal,
  ShieldCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Send,
  FileSpreadsheet,
  Info,
} from "lucide-react";

type ExportStatus =
  | "Generated"
  | "Sent"
  | "Processed"
  | "Failed"
  | "Partially Processed";

type AdviceFormat = "TXT" | "XLSX" | "API";
type TransportMode = "SFTP" | "Portal Upload" | "API Push";

interface BankExportRecord {
  id: string;
  date: string;
  run: string;
  bank: string;
  employees: number;
  amount: number;
  status: ExportStatus;
  format: AdviceFormat;
  transportMode: TransportMode;
  fileName: string;
  responseCode: string;
  referenceId: string;
  lastMessage: string;
}

const DEFAULT_PER_PAGE = 10;

const MOCK_HISTORY: BankExportRecord[] = [
  {
    id: "EXP-2025-099",
    date: "2025-01-15",
    run: "Jan 2025 (v1.2)",
    bank: "Habib Bank Limited",
    employees: 210,
    amount: 18500000,
    status: "Sent",
    format: "TXT",
    transportMode: "SFTP",
    fileName: "HBL_JAN2025_V12.TXT",
    responseCode: "ACK-102-INQUEUE",
    referenceId: "HBL-7788992211",
    lastMessage: "File received and queued for bank-side batch processing.",
  },
  {
    id: "EXP-2025-098",
    date: "2025-01-15",
    run: "Jan 2025 (v1.2)",
    bank: "Meezan Bank",
    employees: 85,
    amount: 7200000,
    status: "Processed",
    format: "XLSX",
    transportMode: "Portal Upload",
    fileName: "MEEZAN_JAN2025_V12.xlsx",
    responseCode: "ACK-200-SUCCESS",
    referenceId: "MZN-6655442211",
    lastMessage: "Batch accepted and fully processed by bank reconciliation layer.",
  },
  {
    id: "EXP-2025-097",
    date: "2025-01-15",
    run: "Jan 2025 (v1.2)",
    bank: "Standard Chartered",
    employees: 30,
    amount: 4100000,
    status: "Failed",
    format: "API",
    transportMode: "API Push",
    fileName: "SC_API_JAN2025_V12.json",
    responseCode: "ERR-503-GATEWAY",
    referenceId: "SC-ERR-20250115",
    lastMessage: "Gateway timeout while receiving batch header record.",
  },
  {
    id: "EXP-2025-096",
    date: "2025-01-14",
    run: "Jan 2025 (v1.1)",
    bank: "Habib Bank Limited",
    employees: 208,
    amount: 18200000,
    status: "Processed",
    format: "TXT",
    transportMode: "SFTP",
    fileName: "HBL_JAN2025_V11.TXT",
    responseCode: "ACK-200-SUCCESS",
    referenceId: "HBL-7788992202",
    lastMessage: "Transmission completed and confirmed by HBL payroll gateway.",
  },
  {
    id: "EXP-2025-095",
    date: "2025-01-14",
    run: "Jan 2025 (v1.1)",
    bank: "Meezan Bank",
    employees: 84,
    amount: 7150000,
    status: "Partially Processed",
    format: "XLSX",
    transportMode: "Portal Upload",
    fileName: "MEEZAN_JAN2025_V11.xlsx",
    responseCode: "ACK-206-PARTIAL",
    referenceId: "MZN-6655442204",
    lastMessage: "Main batch accepted; 2 employee records moved to exception queue.",
  },
  {
    id: "EXP-2025-094",
    date: "2025-01-14",
    run: "Jan 2025 (v1.1)",
    bank: "Standard Chartered",
    employees: 20,
    amount: 3900000,
    status: "Generated",
    format: "API",
    transportMode: "API Push",
    fileName: "SC_API_JAN2025_V11.json",
    responseCode: "N/A",
    referenceId: "Pending",
    lastMessage: "Advice generated and waiting for transmission approval.",
  },
  {
    id: "EXP-2024-093",
    date: "2024-12-31",
    run: "Dec 2024 Final",
    bank: "Habib Bank Limited",
    employees: 206,
    amount: 17900000,
    status: "Processed",
    format: "TXT",
    transportMode: "SFTP",
    fileName: "HBL_DEC2024_FINAL.TXT",
    responseCode: "ACK-200-SUCCESS",
    referenceId: "HBL-7788991191",
    lastMessage: "Batch posted and released to settlement processing.",
  },
  {
    id: "EXP-2024-092",
    date: "2024-12-31",
    run: "Dec 2024 Final",
    bank: "Meezan Bank",
    employees: 83,
    amount: 6900000,
    status: "Processed",
    format: "XLSX",
    transportMode: "Portal Upload",
    fileName: "MEEZAN_DEC2024_FINAL.xlsx",
    responseCode: "ACK-200-SUCCESS",
    referenceId: "MZN-6655441195",
    lastMessage: "All records were validated and accepted.",
  },
  {
    id: "EXP-2024-091",
    date: "2024-12-31",
    run: "Dec 2024 Final",
    bank: "Standard Chartered",
    employees: 20,
    amount: 3900000,
    status: "Sent",
    format: "API",
    transportMode: "API Push",
    fileName: "SC_API_DEC2024_FINAL.json",
    responseCode: "ACK-102-INQUEUE",
    referenceId: "SC-6655441180",
    lastMessage: "Payload received; bank acknowledgement pending.",
  },
];

function formatPKRShort(value: number): string {
  return `PKR ${(value / 1000000).toFixed(2)}M`;
}

function formatPKRFull(value: number): string {
  return `PKR ${value.toLocaleString()}`;
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function getStatusClasses(status: ExportStatus): string {
  switch (status) {
    case "Generated":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Sent":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Processed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Failed":
      return "bg-red-50 text-red-700 border-red-200";
    case "Partially Processed":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getFormatClasses(format: AdviceFormat): string {
  switch (format) {
    case "TXT":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "XLSX":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "API":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function createCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function generateManifest(record: BankExportRecord): string {
  return [
    `Export ID: ${record.id}`,
    `Date: ${record.date}`,
    `Payroll Run: ${record.run}`,
    `Bank: ${record.bank}`,
    `Employees: ${record.employees}`,
    `Amount: ${record.amount}`,
    `Status: ${record.status}`,
    `Format: ${record.format}`,
    `Transport Mode: ${record.transportMode}`,
    `File Name: ${record.fileName}`,
    `Response Code: ${record.responseCode}`,
    `Reference ID: ${record.referenceId}`,
    `Last Message: ${record.lastMessage}`,
  ].join("\n");
}

function generateTransmissionLog(record: BankExportRecord): string[] {
  const baseLogs = [
    `[09:10:01] INITIALIZING ${record.transportMode.toUpperCase()} CHANNEL`,
    `[09:10:03] AUTH_CONTEXT: PAYROLL_EXPORT_SERVICE`,
    `[09:10:07] EXPORT_SELECTED: ${record.fileName}`,
    `[09:10:10] BANK_TARGET: ${record.bank}`,
  ];

  if (record.status === "Generated") {
    return [
      ...baseLogs,
      `[09:10:12] PAYLOAD_READY: WAITING FOR MANUAL TRANSMISSION`,
    ];
  }

  if (record.status === "Sent") {
    return [
      ...baseLogs,
      `[09:10:15] OUTBOUND_CONNECTION_ESTABLISHED`,
      `[09:10:21] FILE_OR_PAYLOAD_TRANSMITTED`,
      `[09:10:25] ACK_PENDING_FROM_BANK_GATEWAY`,
    ];
  }

  if (record.status === "Processed") {
    return [
      ...baseLogs,
      `[09:10:15] OUTBOUND_CONNECTION_ESTABLISHED`,
      `[09:10:21] FILE_OR_PAYLOAD_TRANSMITTED`,
      `[09:10:26] ACK_RECEIVED: ${record.responseCode}`,
      `[09:10:30] BATCH_MARKED_PROCESSED`,
    ];
  }

  if (record.status === "Partially Processed") {
    return [
      ...baseLogs,
      `[09:10:15] OUTBOUND_CONNECTION_ESTABLISHED`,
      `[09:10:21] FILE_OR_PAYLOAD_TRANSMITTED`,
      `[09:10:26] PARTIAL_ACK_RECEIVED: ${record.responseCode}`,
      `[09:10:34] EXCEPTION_ROWS_ROUTED_FOR_REVIEW`,
    ];
  }

  return [
    ...baseLogs,
    `[09:10:15] CONNECTION_ATTEMPTED`,
    `[09:10:21] GATEWAY_FAILURE: ${record.responseCode}`,
    `[09:10:23] BATCH_MARKED_FAILED`,
  ];
}

function getStepState(
  record: BankExportRecord,
  step: "generated" | "validated" | "transmitted" | "acknowledged"
): "done" | "pending" | "error" | "warning" {
  if (step === "generated") return "done";
  if (step === "validated") return "done";

  if (step === "transmitted") {
    if (record.status === "Generated") return "pending";
    if (record.status === "Failed") return "error";
    return "done";
  }

  if (step === "acknowledged") {
    if (record.status === "Processed") return "done";
    if (record.status === "Partially Processed") return "warning";
    if (record.status === "Failed") return "error";
    return "pending";
  }

  return "pending";
}

function getStepClasses(
  state: "done" | "pending" | "error" | "warning"
): string {
  switch (state) {
    case "done":
      return "bg-emerald-500 border-emerald-500 text-white";
    case "error":
      return "bg-red-500 border-red-500 text-white";
    case "warning":
      return "bg-amber-500 border-amber-500 text-white";
    default:
      return "bg-white border-gray-200 text-gray-300";
  }
}

 function BankExportHistory() {
  const [records, setRecords] = useState<BankExportRecord[]>(MOCK_HISTORY);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ExportStatus>("All");
  const [runFilter, setRunFilter] = useState<string>("All Runs");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [selectedExportId, setSelectedExportId] = useState<string | null>(null);

  const selectedExport = useMemo(
    () => records.find((record) => record.id === selectedExportId) ?? null,
    [records, selectedExportId]
  );

  const runOptions = useMemo(
    () => ["All Runs", ...Array.from(new Set(records.map((record) => record.run)))],
    [records]
  );

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !needle ||
        [
          record.id,
          record.bank,
          record.run,
          record.fileName,
          record.referenceId,
          record.responseCode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const matchesRun = runFilter === "All Runs" || record.run === runFilter;

      return matchesSearch && matchesStatus && matchesRun;
    });
  }, [records, search, statusFilter, runFilter]);

  const totalEntries = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecords.slice(start, start + perPage);
  }, [filteredRecords, currentPage, perPage]);

  const stats = useMemo(() => {
    const generated = records.filter((record) => record.status === "Generated").length;
    const sent = records.filter((record) => record.status === "Sent").length;
    const processed = records.filter((record) => record.status === "Processed").length;
    const failed = records.filter((record) => record.status === "Failed").length;
    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);

    return {
      generated,
      sent,
      processed,
      failed,
      totalAmount,
    };
  }, [records]);

  const resetPage = (): void => setPage(1);

  const handleExportMasterLog = (): void => {
    const csv = createCsv(
      [
        "Export ID",
        "Date",
        "Run",
        "Bank",
        "Employees",
        "Amount",
        "Status",
        "Format",
        "Transport Mode",
        "File Name",
        "Response Code",
        "Reference ID",
      ],
      filteredRecords.map((record) => [
        record.id,
        record.date,
        record.run,
        record.bank,
        record.employees,
        record.amount,
        record.status,
        record.format,
        record.transportMode,
        record.fileName,
        record.responseCode,
        record.referenceId,
      ])
    );

    downloadFile(csv, "bank-export-master-log.csv", "text/csv;charset=utf-8;");
  };

  const handleDownloadManifest = (record: BankExportRecord): void => {
    downloadFile(
      generateManifest(record),
      `${record.id.toLowerCase()}-manifest.txt`,
      "text/plain;charset=utf-8;"
    );
  };

  const updateRecord = (
    id: string,
    updater: (record: BankExportRecord) => BankExportRecord
  ): void => {
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? updater(record) : record))
    );
  };

  const handleRetry = (id: string): void => {
    updateRecord(id, (record) => ({
      ...record,
      status: "Sent",
      responseCode: "ACK-102-INQUEUE",
      referenceId: `${record.bank.split(" ")[0].toUpperCase()}-RETRY-${record.id}`,
      lastMessage: "Transmission retried successfully and is awaiting bank acknowledgement.",
    }));
  };

  const handleMarkProcessed = (id: string): void => {
    updateRecord(id, (record) => ({
      ...record,
      status: "Processed",
      responseCode: "ACK-200-SUCCESS",
      lastMessage: "Bank acknowledgement received and batch marked as processed.",
    }));
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">
                Bank Export History
              </h2>
              <p className="mt-0.5 text-sm text-brand-700">
                Audit trail of all disbursement instructions sent to financial partners
              </p>
            </div>

            <button
              onClick={handleExportMasterLog}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Export Master Log
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Generated
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{stats.generated}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <FileText className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Sent
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{stats.sent}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Send className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Processed
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{stats.processed}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Failed
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{stats.failed}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <AlertCircle className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Amount
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKRShort(stats.totalAmount)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Landmark className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search export ID, bank, run, or file..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <Filter className="h-4 w-4 text-brand-700" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "All" | ExportStatus);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  <option value="All">Status: All</option>
                  <option value="Generated">Status: Generated</option>
                  <option value="Sent">Status: Sent</option>
                  <option value="Processed">Status: Processed</option>
                  <option value="Failed">Status: Failed</option>
                  <option value="Partially Processed">Status: Partially Processed</option>
                </select>

                <select
                  value={runFilter}
                  onChange={(e) => {
                    setRunFilter(e.target.value);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {runOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{showingFrom}</span>
              <span className="text-brand-700"> to </span>
              <span className="font-semibold text-brand-900">{showingTo}</span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">{totalEntries}</span>
              <span className="text-brand-700"> export records</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{stats.sent}</span>
                In Transit
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{stats.processed}</span>
                Completed
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Export ID
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Transmission Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Payroll Run
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Recipient Bank
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employees
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Format
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <History className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No export history found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your search, run, or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-brand-100/50">
                      <td className="px-5 py-4">
                        <div className="font-mono text-sm font-semibold text-brand-900">
                          {record.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-brand-800">
                        {record.date}
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-800">
                        {record.run}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-brand-700" />
                          <span className="text-sm font-semibold text-brand-900">
                            {record.bank}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-brand-900">
                        {record.employees}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                        {formatPKRShort(record.amount)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getFormatClasses(
                            record.format
                          )}`}
                        >
                          {record.format}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedExportId(record.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadManifest(record)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                            title="Download Manifest"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {(record.status === "Failed" ||
                            record.status === "Partially Processed") && (
                            <button
                              onClick={() => handleRetry(record.id)}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              title="Retry Transmission"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {paginatedRecords.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-brand-700">
                Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                <span className="font-semibold text-brand-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber = 1;

                  if (totalPages <= 5) pageNumber = i + 1;
                  else if (currentPage <= 3) pageNumber = i + 1;
                  else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                  else pageNumber = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                        currentPage === pageNumber
                          ? "border-brand-800 bg-brand-800 text-white"
                          : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-brand-700">
                <span className="font-semibold text-brand-900">{showingFrom}</span>
                {" – "}
                <span className="font-semibold text-brand-900">{showingTo}</span>
                {" of "}
                <span className="font-semibold text-brand-900">{totalEntries}</span>
                {" entries"}
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">
              Secure Transmission Note
            </p>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Exported payroll instructions should only move to processed status after
              successful bank acknowledgement. Failed and partially processed batches
              should be retried only after validating the original export manifest.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedExport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-brand-900/30 backdrop-blur-sm"
            onClick={() => setSelectedExportId(null)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                  <History className="h-5 w-5 text-brand-800" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-900">
                    Transmission Details: {selectedExport.id}
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    {selectedExport.bank} • {selectedExport.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedExportId(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Status Tracker */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: "Generated", time: "09:00 AM", key: "generated" as const },
                  { label: "Validated", time: "09:05 AM", key: "validated" as const },
                  { label: "Transmitted", time: "09:10 AM", key: "transmitted" as const },
                  {
                    label: "Bank Acknowledgement",
                    time: "09:12 AM",
                    key: "acknowledged" as const,
                  },
                ].map((step) => {
                  const stepState = getStepState(selectedExport, step.key);

                  return (
                    <div key={step.label} className="relative text-center">
                      <div
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 ${getStepClasses(
                          stepState
                        )}`}
                      >
                        {stepState === "done" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : stepState === "error" ? (
                          <X className="h-4 w-4" />
                        ) : stepState === "warning" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Clock3 className="h-4 w-4" />
                        )}
                      </div>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-brand-800">
                        {step.label}
                      </p>
                      <p className="mt-1 text-xs text-brand-700">{step.time}</p>
                    </div>
                  );
                })}
              </div>

              {/* Logs + Response */}
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-brand-800" />
                    <h4 className="text-sm font-semibold text-brand-900">
                      Transmission Log
                    </h4>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] leading-6 text-emerald-400">
                    {generateTransmissionLog(selectedExport).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-800" />
                    <h4 className="text-sm font-semibold text-brand-900">
                      Bank Gateway Response
                    </h4>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm">
                        <span className="text-brand-700">Response Code</span>
                        <span className="font-semibold text-brand-900">
                          {selectedExport.responseCode}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm">
                        <span className="text-brand-700">Reference ID</span>
                        <span className="font-mono font-semibold text-brand-900">
                          {selectedExport.referenceId}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm">
                        <span className="text-brand-700">Transport</span>
                        <span className="font-semibold text-brand-900">
                          {selectedExport.transportMode}
                        </span>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-brand-100/30 p-4">
                        <p className="text-sm leading-6 text-brand-800">
                          {selectedExport.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Payroll Run
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedExport.run}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Employees
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedExport.employees}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Amount
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {formatPKRFull(selectedExport.amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      File
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedExport.fileName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="grid grid-cols-1 gap-2 border-t border-gray-200 bg-white px-6 py-4 sm:grid-cols-3">
              <button
                onClick={() => handleDownloadManifest(selectedExport)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Manifest
              </button>

              {(selectedExport.status === "Failed" ||
                selectedExport.status === "Partially Processed") && (
                <button
                  onClick={() => handleRetry(selectedExport.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Transmission
                </button>
              )}

              {(selectedExport.status === "Sent" ||
                selectedExport.status === "Partially Processed") && (
                <button
                  onClick={() => handleMarkProcessed(selectedExport.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Processed
                </button>
              )}

              {selectedExport.status === "Processed" && (
                <button
                  onClick={() => setSelectedExportId(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default BankExportHistory