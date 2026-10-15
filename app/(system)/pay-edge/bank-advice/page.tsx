 "use client";
import { useMemo, useState } from "react";
import {
  Landmark,
  Download,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  Building2,
  ExternalLink,
  Search,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
  Users,
  FileCode2,
} from "lucide-react";
type AdviceFormat = "TXT" | "XLSX" | "API";
type AdviceStatus = "Ready" | "Sent" | "Failed";
interface BankSummary {
  bankName: string;
  employeeCount: number;
  totalAmount: number;
  format: AdviceFormat;
  status: AdviceStatus;
  routingCode: string;
  accountTitle: string;
  fileName: string;
}
interface ChequeCase {
  employeeId: string;
  employeeName: string;
  amount: number;
}
interface SplitAccountCase {
  employeeId: string;
  employeeName: string;
  primaryBank: string;
  primaryShare: number;
  secondaryBank: string;
  secondaryShare: number;
}
interface AdviceRun {
  id: string;
  label: string;
  authId: string;
  totalEmployees: number;
  totalDisbursement: number;
  bankTransfers: number;
  chequeCash: number;
  banks: BankSummary[];
  chequeCases: ChequeCase[];
  splitAccounts: SplitAccountCase[];
}
const DEFAULT_PER_PAGE = 10;
const ADVICE_RUNS: AdviceRun[] = [
  {
    id: "jan-2025-v12",
    label: "Jan 2025 (v1.2)",
    authId: "FX-BNK-2025-9922",
    totalEmployees: 325,
    totalDisbursement: 29800000,
    bankTransfers: 315,
    chequeCash: 10,
    banks: [
      {
        bankName: "Habib Bank Limited (HBL)",
        employeeCount: 210,
        totalAmount: 18500000,
        format: "TXT",
        status: "Ready",
        routingCode: "HABBPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "HBL_JAN2025_PAYROLL.TXT",
      },
      {
        bankName: "Meezan Bank",
        employeeCount: 85,
        totalAmount: 7200000,
        format: "XLSX",
        status: "Sent",
        routingCode: "MEZNPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "MEEZAN_JAN2025_PAYROLL.xlsx",
      },
      {
        bankName: "Standard Chartered",
        employeeCount: 30,
        totalAmount: 4100000,
        format: "API",
        status: "Ready",
        routingCode: "SCBLPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "SC_API_BATCH_JAN2025.json",
      },
    ],
    chequeCases: [
      { employeeId: "EMP-1003", employeeName: "Umar Farooq", amount: 45000 },
      { employeeId: "EMP-1032", employeeName: "Sara Khan", amount: 82000 },
      { employeeId: "EMP-1044", employeeName: "Noman Ali", amount: 65000 },
    ],
    splitAccounts: [
      {
        employeeId: "EMP-1005",
        employeeName: "Mustafa Kamal",
        primaryBank: "HBL",
        primaryShare: 80,
        secondaryBank: "Meezan",
        secondaryShare: 20,
      },
      {
        employeeId: "EMP-1048",
        employeeName: "Areeba Javed",
        primaryBank: "Standard Chartered",
        primaryShare: 60,
        secondaryBank: "HBL",
        secondaryShare: 40,
      },
    ],
  },
  {
    id: "jan-2025-v11",
    label: "Jan 2025 (v1.1)",
    authId: "FX-BNK-2025-9887",
    totalEmployees: 322,
    totalDisbursement: 29450000,
    bankTransfers: 312,
    chequeCash: 10,
    banks: [
      {
        bankName: "Habib Bank Limited (HBL)",
        employeeCount: 208,
        totalAmount: 18200000,
        format: "TXT",
        status: "Sent",
        routingCode: "HABBPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "HBL_JAN2025_V11.TXT",
      },
      {
        bankName: "Meezan Bank",
        employeeCount: 84,
        totalAmount: 7150000,
        format: "XLSX",
        status: "Sent",
        routingCode: "MEZNPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "MEEZAN_JAN2025_V11.xlsx",
      },
      {
        bankName: "Standard Chartered",
        employeeCount: 20,
        totalAmount: 4100000,
        format: "API",
        status: "Failed",
        routingCode: "SCBLPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "SC_API_JAN2025_V11.json",
      },
    ],
    chequeCases: [
      { employeeId: "EMP-1003", employeeName: "Umar Farooq", amount: 45000 },
      { employeeId: "EMP-1032", employeeName: "Sara Khan", amount: 82000 },
    ],
    splitAccounts: [
      {
        employeeId: "EMP-1005",
        employeeName: "Mustafa Kamal",
        primaryBank: "HBL",
        primaryShare: 80,
        secondaryBank: "Meezan",
        secondaryShare: 20,
      },
    ],
  },
  {
    id: "dec-2024-final",
    label: "Dec 2024 Final",
    authId: "FX-BNK-2024-9710",
    totalEmployees: 319,
    totalDisbursement: 28700000,
    bankTransfers: 309,
    chequeCash: 10,
    banks: [
      {
        bankName: "Habib Bank Limited (HBL)",
        employeeCount: 206,
        totalAmount: 17900000,
        format: "TXT",
        status: "Sent",
        routingCode: "HABBPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "HBL_DEC2024_FINAL.TXT",
      },
      {
        bankName: "Meezan Bank",
        employeeCount: 83,
        totalAmount: 6900000,
        format: "XLSX",
        status: "Sent",
        routingCode: "MEZNPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "MEEZAN_DEC2024_FINAL.xlsx",
      },
      {
        bankName: "Standard Chartered",
        employeeCount: 20,
        totalAmount: 3900000,
        format: "API",
        status: "Sent",
        routingCode: "SCBLPKKA",
        accountTitle: "Flexi HRMS Payroll Control",
        fileName: "SC_API_DEC2024_FINAL.json",
      },
    ],
    chequeCases: [
      { employeeId: "EMP-1011", employeeName: "Faizan Shah", amount: 61000 },
    ],
    splitAccounts: [],
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
function getStatusClasses(status: AdviceStatus): string {
  switch (status) {
    case "Ready":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Sent":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Failed":
      return "bg-red-50 text-red-700 border-red-200";
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
function generatePreviewLines(bank: BankSummary): string[] {
  const recordCount = Math.min(bank.employeeCount, 4);
  const baseAmount = Math.round(bank.totalAmount / bank.employeeCount);
  const lines: string[] = [];
  lines.push(
    `01|${bank.routingCode}|${bank.fileName}|${bank.employeeCount}|${bank.totalAmount}`,
  );
  for (let i = 0; i < recordCount; i += 1) {
    const employeeNo = String(1001 + i).padStart(4, "0");
    const amount = baseAmount + i * 2500;
    lines.push(
      `02|EMP-${employeeNo}|PK12${bank.routingCode.slice(0, 4)}0001220000000${employeeNo}|${amount}`,
    );
  }
  lines.push(
    `... ${Math.max(bank.employeeCount - recordCount, 0)} more records`,
  );
  lines.push(
    `99|${bank.employeeCount}|${bank.totalAmount}|${bank.routingCode}`,
  );
  return lines;
}
function createCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
 function BankAdviceGenerator() {
  const [runs, setRuns] = useState<AdviceRun[]>(ADVICE_RUNS);
  const [selectedRunId, setSelectedRunId] = useState<string>(ADVICE_RUNS[0].id);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<"All" | AdviceFormat>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | AdviceStatus>("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [showPreview, setShowPreview] = useState(false);
  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0],
    [runs, selectedRunId],
  );
  const [activeBankName, setActiveBankName] = useState<string>(
    selectedRun.banks[0]?.bankName ?? "",
  );
  const activeBank = useMemo(() => {
    const fallback = selectedRun.banks[0] ?? null;
    return (
      selectedRun.banks.find((bank) => bank.bankName === activeBankName) ??
      fallback
    );
  }, [selectedRun, activeBankName]);
  const filteredBanks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return selectedRun.banks.filter((bank) => {
      const matchesSearch =
        !needle ||
        [
          bank.bankName,
          bank.format,
          bank.status,
          bank.fileName,
          bank.routingCode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesFormat =
        formatFilter === "All" || bank.format === formatFilter;
      const matchesStatus =
        statusFilter === "All" || bank.status === statusFilter;
      return matchesSearch && matchesFormat && matchesStatus;
    });
  }, [selectedRun, search, formatFilter, statusFilter]);
  const totalEntries = filteredBanks.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const paginatedBanks = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredBanks.slice(start, start + perPage);
  }, [filteredBanks, currentPage, perPage]);
  const stats = useMemo(() => {
    const ready = selectedRun.banks.filter(
      (bank) => bank.status === "Ready",
    ).length;
    const sent = selectedRun.banks.filter(
      (bank) => bank.status === "Sent",
    ).length;
    const failed = selectedRun.banks.filter(
      (bank) => bank.status === "Failed",
    ).length;
    return { ready, sent, failed };
  }, [selectedRun]);
  const validationItems = useMemo(
    () => [
      { label: "Record Count Verified", status: "PASS" },
      { label: "Sum Hash Check", status: "PASS" },
      { label: "IBAN Formatting (PK)", status: "PASS" },
      { label: "Duplicate Entry Protection", status: "PASS" },
    ],
    [],
  );
  const previewLines = useMemo(
    () => (activeBank ? generatePreviewLines(activeBank) : []),
    [activeBank],
  );
  const resetPage = (): void => setPage(1);
  const handleRunChange = (runId: string): void => {
    setSelectedRunId(runId);
    const run = runs.find((item) => item.id === runId) ?? runs[0];
    setActiveBankName(run.banks[0]?.bankName ?? "");
    setSearch("");
    setFormatFilter("All");
    setStatusFilter("All");
    setPage(1);
  };
  const updateBankStatus = (
    bankName: string,
    nextStatus: AdviceStatus,
  ): void => {
    setRuns((prev) =>
      prev.map((run) =>
        run.id !== selectedRunId
          ? run
          : {
              ...run,
              banks: run.banks.map((bank) =>
                bank.bankName === bankName
                  ? { ...bank, status: nextStatus }
                  : bank,
              ),
            },
      ),
    );
  };
  const handleTransmit = (bank: BankSummary): void => {
    updateBankStatus(bank.bankName, "Sent");
  };
  const handleDownloadTxt = (bank: BankSummary): void => {
    const content = generatePreviewLines(bank).join("\n");
    downloadFile(
      content,
      bank.fileName.replace(/\.(xlsx|json)$/i, ".txt"),
      "text/plain;charset=utf-8;",
    );
  };
  const handleDownloadExcel = (bank: BankSummary): void => {
    const csv = createCsv(
      [
        "Bank",
        "Employees",
        "Total Amount",
        "Format",
        "Status",
        "Routing Code",
        "Account Title",
      ],
      [
        [
          bank.bankName,
          bank.employeeCount,
          bank.totalAmount,
          bank.format,
          bank.status,
          bank.routingCode,
          bank.accountTitle,
        ],
      ],
    );
    downloadFile(
      csv,
      `${bank.bankName.replace(/[^a-z0-9]/gi, "_")}.csv`,
      "text/csv;charset=utf-8;",
    );
  };
  const handleDownloadComprehensive = (): void => {
    const csv = createCsv(
      [
        "Bank",
        "Employees",
        "Total Amount",
        "Format",
        "Status",
        "Routing Code",
        "File Name",
      ],
      selectedRun.banks.map((bank) => [
        bank.bankName,
        bank.employeeCount,
        bank.totalAmount,
        bank.format,
        bank.status,
        bank.routingCode,
        bank.fileName,
      ]),
    );
    downloadFile(
      csv,
      `bank-advice-summary-${selectedRun.label.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`,
      "text/csv;charset=utf-8;",
    );
  };
  return (
    <div className="min-h-screen bg-white p-3">
      
      <div className="space-y-4">
        
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            
            <div>
              
              <h2 className="text-2xl font-bold text-brand-900">
                
                Bank Advice Management
              </h2>
              <p className="mt-0.5 text-sm text-brand-700">
                
                Generate and transmit payment instructions to financial
                institutions
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              
              <div className="relative w-[220px]">
                
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <select
                  value={selectedRunId}
                  onChange={(e) => handleRunChange(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                >
                  
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      
                      {run.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Global stats */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                
                Total Disbursement
              </p>
              <div className="mt-2 flex items-center justify-between">
                
                <p className="text-2xl font-bold text-brand-900">
                  
                  {formatPKRShort(selectedRun.totalDisbursement)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  
                  <Wallet className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-1 text-sm text-brand-700">
                
                {selectedRun.totalEmployees} employees
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                
                Bank Transfers
              </p>
              <div className="mt-2 flex items-center justify-between">
                
                <p className="text-2xl font-bold text-brand-900">
                  
                  {selectedRun.bankTransfers}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  
                  <Landmark className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-1 text-sm text-brand-700">
                Auto disbursement records
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                
                Cheque / Cash
              </p>
              <div className="mt-2 flex items-center justify-between">
                
                <p className="text-2xl font-bold text-brand-900">
                  
                  {selectedRun.chequeCash}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  
                  <Users className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-1 text-sm text-brand-700">
                Manual intervention cases
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                
                Transmission Health
              </p>
              <div className="mt-2 flex items-center justify-between">
                
                <p className="text-2xl font-bold text-brand-900">
                  
                  {stats.sent}/{selectedRun.banks.length}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-1 text-sm text-brand-700">
                
                Ready: {stats.ready} • Failed: {stats.failed}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          
          {/* Left column */}
          <div className="space-y-4 xl:col-span-8">
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                
                <div>
                  
                  <h3 className="text-sm font-semibold text-brand-900">
                    
                    Bank-wise Distribution
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    
                    Advice files by bank institution and transfer format
                  </p>
                </div>
                <button
                  onClick={handleDownloadComprehensive}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  
                  <Download className="h-4 w-4" /> Download Comprehensive
                  XLSX
                </button>
              </div>
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  
                  <div className="relative w-full sm:w-[280px]">
                    
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      placeholder="Search bank, file, or routing code..."
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
                      value={formatFilter}
                      onChange={(e) => {
                        setFormatFilter(e.target.value as "All" | AdviceFormat);
                        resetPage();
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      
                      <option value="All">All Formats</option>
                      <option value="TXT">TXT</option>
                      <option value="XLSX">XLSX</option>
                      <option value="API">API</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as "All" | AdviceStatus);
                        resetPage();
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      
                      <option value="All">All Statuses</option>
                      <option value="Ready">Ready</option>
                      <option value="Sent">Sent</option>
                      <option value="Failed">Failed</option>
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
              <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                
                <div className="text-sm">
                  
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {showingFrom}
                  </span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">
                    {showingTo}
                  </span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">
                    {totalEntries}
                  </span>
                  <span className="text-brand-700"> bank records</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {stats.ready}
                    </span>
                    Ready
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {stats.sent}
                    </span>
                    Sent
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {stats.failed}
                    </span>
                    Failed
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                
                <table className="w-full min-w-[1080px]">
                  
                  <thead className="border-b border-gray-200 bg-white">
                    
                    <tr>
                      
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Bank Institution
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Employees
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Total Amount
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Format
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    
                    {paginatedBanks.length === 0 ? (
                      <tr>
                        
                        <td colSpan={6} className="px-6 py-16 text-center">
                          
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                              
                              <Landmark className="h-5 w-5 text-brand-800" />
                            </div>
                            <p className="text-sm font-semibold text-brand-900">
                              
                              No bank records found
                            </p>
                            <p className="text-sm text-brand-700">
                              
                              Try changing the run, search, format, or status
                              filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedBanks.map((bank) => (
                        <tr
                          key={bank.bankName}
                          className={`cursor-pointer transition hover:bg-brand-100/50 ${activeBank?.bankName === bank.bankName ? "bg-brand-100/30" : ""}`}
                          onClick={() => setActiveBankName(bank.bankName)}
                        >
                          
                          <td className="px-5 py-4">
                            
                            <div className="flex items-center gap-3">
                              
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeBank?.bankName === bank.bankName ? "bg-brand-800 text-white" : "bg-brand-100 text-brand-800"}`}
                              >
                                
                                <Building2 className="h-4 w-4" />
                              </div>
                              <div>
                                
                                <p className="text-sm font-semibold text-brand-900">
                                  
                                  {bank.bankName}
                                </p>
                                <p className="mt-0.5 text-xs text-brand-700">
                                  
                                  {bank.fileName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-semibold text-brand-900">
                            
                            {bank.employeeCount}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                            
                            {formatPKRShort(bank.totalAmount)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getFormatClasses(bank.format)}`}
                            >
                              
                              {bank.format}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(bank.status)}`}
                            >
                              
                              {bank.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            
                            <div className="flex items-center justify-end gap-1">
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveBankName(bank.bankName);
                                  setShowPreview(true);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                                title="Preview"
                              >
                                
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadTxt(bank);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                                title="Download TXT"
                              >
                                
                                <FileText className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransmit(bank);
                                }}
                                disabled={bank.status === "Sent"}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Transmit"
                              >
                                
                                <Send className="h-4 w-4" /> Send
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {paginatedBanks.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  
                  <div className="text-sm text-brand-700">
                    
                    Page
                    <span className="font-semibold text-brand-900">
                      {currentPage}
                    </span>
                    of
                    <span className="font-semibold text-brand-900">
                      {totalPages}
                    </span>
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
                      else if (currentPage >= totalPages - 2)
                        pageNumber = totalPages - 4 + i;
                      else pageNumber = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${currentPage === pageNumber ? "border-brand-800 bg-brand-800 text-white" : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"}`}
                        >
                          
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
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
                    
                    <span className="font-semibold text-brand-900">
                      {showingFrom}
                    </span>
                    {" – "}
                    <span className="font-semibold text-brand-900">
                      {showingTo}
                    </span>
                    {" of "}
                    <span className="font-semibold text-brand-900">
                      {totalEntries}
                    </span>
                    {" entries"}
                  </div>
                </div>
              )}
            </div>
            {/* Special cases */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                
                <div>
                  
                  <h3 className="text-sm font-semibold text-brand-900">
                    
                    Exceptions & Special Cases
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    
                    Manual intervention items requiring extra review
                  </p>
                </div>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  
                  Manual Intervention
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
                
                <div className="space-y-3">
                  
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    
                    Cheque Payments ({selectedRun.chequeCases.length})
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    
                    {selectedRun.chequeCases.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-brand-700">
                        
                        No cheque cases in this run.
                      </div>
                    ) : (
                      selectedRun.chequeCases.map((item) => (
                        <div
                          key={item.employeeId}
                          className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
                        >
                          
                          <div>
                            
                            <p className="text-sm font-semibold text-brand-900">
                              
                              {item.employeeName}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-700">
                              
                              {item.employeeId}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-brand-900">
                            
                            {formatPKRFull(item.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    
                    Split Bank Accounts ({selectedRun.splitAccounts.length}
                    )
                  </h4>
                  <div className="space-y-3">
                    
                    {selectedRun.splitAccounts.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-brand-700">
                        
                        No split-account cases in this run.
                      </div>
                    ) : (
                      selectedRun.splitAccounts.map((item) => (
                        <div
                          key={item.employeeId}
                          className="rounded-xl border border-gray-200 bg-white p-4"
                        >
                          
                          <p className="text-sm font-semibold text-brand-900">
                            
                            {item.employeeName} ({item.employeeId})
                          </p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            
                            <span className="text-brand-700">
                              
                              {item.primaryBank}: {item.primaryShare}%
                            </span>
                            <span className="text-brand-700">
                              
                              {item.secondaryBank}: {item.secondaryShare}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right column */}
          <div className="space-y-4 xl:col-span-4">
            
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                
                <div>
                  
                  <h3 className="text-sm font-semibold text-brand-900">
                    
                    File Integrity Check
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    
                    Validation before transmission
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <div className="space-y-3 px-5 py-5">
                
                {validationItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    
                    <span className="text-sm font-medium text-brand-800">
                      
                      {item.label}
                    </span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
              </div>
              {activeBank && (
                <>
                  
                  <div className="border-t border-gray-200 px-5 py-4">
                    
                    <div className="flex items-center justify-between">
                      
                      <h4 className="text-sm font-semibold text-brand-900">
                        
                        Active Advice
                      </h4>
                      <button
                        onClick={() => setShowPreview((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:underline"
                      >
                        
                        {showPreview ? "Hide" : "Expand"} Preview
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        
                        <p className="text-xs uppercase tracking-wider text-brand-700">
                          
                          Format
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          
                          {activeBank.format}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        
                        <p className="text-xs uppercase tracking-wider text-brand-700">
                          
                          Routing
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          
                          {activeBank.routingCode}
                        </p>
                      </div>
                    </div>
                  </div>
                  {showPreview && (
                    <div className="px-5 pb-5">
                      
                      <div className="mb-3 flex items-center gap-2">
                        
                        <FileCode2 className="h-4 w-4 text-brand-800" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          
                          Advice Structure Preview
                        </h4>
                      </div>
                      <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] leading-6 text-emerald-400">
                        
                        {previewLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-200 px-5 py-4">
                    
                    <div className="grid grid-cols-2 gap-2">
                      
                      <button
                        onClick={() => handleDownloadTxt(activeBank)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:bg-brand-100"
                      >
                        
                        <FileText className="h-4 w-4" /> Download TXT
                      </button>
                      <button
                        onClick={() => handleDownloadExcel(activeBank)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:bg-brand-100"
                      >
                        
                        <FileSpreadsheet className="h-4 w-4" /> Export
                        Excel
                      </button>
                    </div>
                    <button
                      onClick={() => handleTransmit(activeBank)}
                      disabled={activeBank.status === "Sent"}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      
                      <Send className="h-4 w-4" /> Transmit to Bank Gateway
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                
                <Info className="h-4 w-4 text-brand-800" />
              </div>
              <div>
                
                <h4 className="text-sm font-semibold text-brand-900">
                  
                  Secure Disbursement Protocol
                </h4>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  
                  All generated advice files should be encrypted before
                  transmission. HR and Finance approvals must be validated
                  against the final payroll authorization before the bank
                  gateway submission is completed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BankAdviceGenerator