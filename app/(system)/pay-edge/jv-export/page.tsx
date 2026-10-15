"use client";
import { useMemo, useState } from "react";
import {
  FileJson,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Database,
  Settings2,
  Search,
  Filter,
  Layers,
  ExternalLink,
  Info,
  Check,
  RefreshCw,
  X,
  PencilLine,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
} from "lucide-react";

type EntryType = "DEBIT" | "CREDIT";
type RunStatus = "Draft" | "Ready" | "Posted";

interface GLMapping {
  id: string;
  component: string;
  glAccount: string;
  glName: string;
  type: EntryType;
  costCenter: string;
  amount: number;
}

interface ERPConfig {
  targetSystem: string;
  postingPeriod: string;
  companyCode: string;
  documentType: string;
  currency: string;
}

interface JVRun {
  id: string;
  label: string;
  authId: string;
  status: RunStatus;
  postedDocId?: string | null;
  config: ERPConfig;
  mappings: GLMapping[];
}

const DEFAULT_PER_PAGE = 10;

const INITIAL_RUNS: JVRun[] = [
  {
    id: "jan-2025-v12",
    label: "Jan 2025 (v1.2)",
    authId: "FX-JV-2025-9922",
    status: "Ready",
    postedDocId: null,
    config: {
      targetSystem: "SAP S/4HANA",
      postingPeriod: "2025/001",
      companyCode: "PK01",
      documentType: "SA",
      currency: "PKR",
    },
    mappings: [
      {
        id: "map-1",
        component: "Basic Salary",
        glAccount: "501001",
        glName: "Salaries & Wages Exp",
        type: "DEBIT",
        costCenter: "ENGINEERING",
        amount: 22500000,
      },
      {
        id: "map-2",
        component: "House Rent",
        glAccount: "501002",
        glName: "Staff Allowances Exp",
        type: "DEBIT",
        costCenter: "ENGINEERING",
        amount: 10125000,
      },
      {
        id: "map-3",
        component: "Income Tax",
        glAccount: "202005",
        glName: "WHT Payable - Salaries",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 3500000,
      },
      {
        id: "map-4",
        component: "Provident Fund (EE)",
        glAccount: "202010",
        glName: "PF Payable - Employee",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 2775000,
      },
      {
        id: "map-5",
        component: "Net Salary Payable",
        glAccount: "201001",
        glName: "Salaries Clearing A/C",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 26350000,
      },
    ],
  },
  {
    id: "dec-2024-final",
    label: "Dec 2024 Final",
    authId: "FX-JV-2024-9817",
    status: "Posted",
    postedDocId: "190002245",
    config: {
      targetSystem: "SAP S/4HANA",
      postingPeriod: "2024/012",
      companyCode: "PK01",
      documentType: "SA",
      currency: "PKR",
    },
    mappings: [
      {
        id: "map-11",
        component: "Basic Salary",
        glAccount: "501001",
        glName: "Salaries & Wages Exp",
        type: "DEBIT",
        costCenter: "ENGINEERING",
        amount: 21900000,
      },
      {
        id: "map-12",
        component: "House Rent",
        glAccount: "501002",
        glName: "Staff Allowances Exp",
        type: "DEBIT",
        costCenter: "ENGINEERING",
        amount: 9850000,
      },
      {
        id: "map-13",
        component: "Income Tax",
        glAccount: "202005",
        glName: "WHT Payable - Salaries",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 3325000,
      },
      {
        id: "map-14",
        component: "Provident Fund (EE)",
        glAccount: "202010",
        glName: "PF Payable - Employee",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 2650000,
      },
      {
        id: "map-15",
        component: "Net Salary Payable",
        glAccount: "201001",
        glName: "Salaries Clearing A/C",
        type: "CREDIT",
        costCenter: "CORPORATE",
        amount: 25775000,
      },
    ],
  },
];

function formatPKRShort(value: number): string {
  return `PKR ${(value / 1000000).toFixed(2)}M`;
}

function formatFullPKR(value: number): string {
  return value.toLocaleString();
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

function createCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isValidGLAccount(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

function isValidCostCenter(value: string): boolean {
  return value.trim().length >= 3;
}

export function JVExport() {
  const [runs, setRuns] = useState<JVRun[]>(INITIAL_RUNS);
  const [selectedRunId, setSelectedRunId] = useState<string>(INITIAL_RUNS[0].id);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | EntryType>("All");
  const [costCenterFilter, setCostCenterFilter] = useState<string>("All Cost Centers");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [isPosting, setIsPosting] = useState(false);
  const [postingToast, setPostingToast] = useState(false);

  const [editingMapping, setEditingMapping] = useState<GLMapping | null>(null);
  const [mappingDraft, setMappingDraft] = useState<GLMapping | null>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configDraft, setConfigDraft] = useState<ERPConfig | null>(null);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0],
    [runs, selectedRunId]
  );

  const totals = useMemo(() => {
    const debits = selectedRun.mappings
      .filter((item) => item.type === "DEBIT")
      .reduce((sum, item) => sum + item.amount, 0);

    const credits = selectedRun.mappings
      .filter((item) => item.type === "CREDIT")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      debits,
      credits,
      balanced: debits === credits,
      variance: Math.abs(debits - credits),
    };
  }, [selectedRun]);

  const costCenters = useMemo(() => {
    return [
      "All Cost Centers",
      ...Array.from(new Set(selectedRun.mappings.map((item) => item.costCenter))),
    ];
  }, [selectedRun]);

  const filteredMappings = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return selectedRun.mappings.filter((item) => {
      const matchesSearch =
        !needle ||
        [
          item.component,
          item.glAccount,
          item.glName,
          item.type,
          item.costCenter,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesCostCenter =
        costCenterFilter === "All Cost Centers" || item.costCenter === costCenterFilter;

      return matchesSearch && matchesType && matchesCostCenter;
    });
  }, [selectedRun, search, typeFilter, costCenterFilter]);

  const totalEntries = filteredMappings.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedMappings = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredMappings.slice(start, start + perPage);
  }, [filteredMappings, currentPage, perPage]);

  const validation = useMemo(() => {
    const debitCreditEquality = totals.balanced;
    const validGLStrings = selectedRun.mappings.every((item) =>
      isValidGLAccount(item.glAccount)
    );
    const activeCostCenters = selectedRun.mappings.every((item) =>
      isValidCostCenter(item.costCenter)
    );
    const positiveAmounts = selectedRun.mappings.every((item) => item.amount > 0);

    return {
      debitCreditEquality,
      validGLStrings,
      activeCostCenters,
      positiveAmounts,
      allPassed:
        debitCreditEquality &&
        validGLStrings &&
        activeCostCenters &&
        positiveAmounts,
    };
  }, [selectedRun, totals]);

  const debitLines = useMemo(
    () => selectedRun.mappings.filter((item) => item.type === "DEBIT").length,
    [selectedRun]
  );

  const creditLines = useMemo(
    () => selectedRun.mappings.filter((item) => item.type === "CREDIT").length,
    [selectedRun]
  );

  const openEditModal = (mapping: GLMapping): void => {
    setEditingMapping(mapping);
    setMappingDraft({ ...mapping });
  };

  const closeEditModal = (): void => {
    setEditingMapping(null);
    setMappingDraft(null);
  };

  const saveMappingChanges = (): void => {
    if (!mappingDraft) return;

    setRuns((prev) =>
      prev.map((run) =>
        run.id !== selectedRun.id
          ? run
          : {
              ...run,
              status: "Draft",
              postedDocId: null,
              mappings: run.mappings.map((item) =>
                item.id === mappingDraft.id ? mappingDraft : item
              ),
            }
      )
    );

    closeEditModal();
  };

  const openConfigModal = (): void => {
    setConfigDraft({ ...selectedRun.config });
    setShowConfigModal(true);
  };

  const saveConfigChanges = (): void => {
    if (!configDraft) return;

    setRuns((prev) =>
      prev.map((run) =>
        run.id !== selectedRun.id
          ? run
          : {
              ...run,
              status: "Draft",
              postedDocId: null,
              config: configDraft,
            }
      )
    );

    setShowConfigModal(false);
  };

  const handlePostToERP = (): void => {
    if (!validation.allPassed || isPosting) return;

    setIsPosting(true);

    window.setTimeout(() => {
      const docId = `19${Math.floor(100000 + Math.random() * 899999)}`;

      setRuns((prev) =>
        prev.map((run) =>
          run.id !== selectedRun.id
            ? run
            : {
                ...run,
                status: "Posted",
                postedDocId: docId,
              }
        )
      );

      setIsPosting(false);
      setPostingToast(true);

      window.setTimeout(() => {
        setPostingToast(false);
      }, 3500);
    }, 1800);
  };

  const handleExportTemplate = (): void => {
    const csv = createCsv(
      ["component", "glAccount", "glName", "type", "costCenter", "amount"],
      [["Basic Salary", "501001", "Salaries & Wages Exp", "DEBIT", "ENGINEERING", 0]]
    );

    downloadFile(csv, "gl-mapping-template.csv", "text/csv;charset=utf-8;");
  };

  const handleExportExcel = (): void => {
    const csv = createCsv(
      ["Component", "GL Account", "GL Name", "Entry Type", "Cost Center", "Amount"],
      selectedRun.mappings.map((item) => [
        item.component,
        item.glAccount,
        item.glName,
        item.type,
        item.costCenter,
        item.amount,
      ])
    );

    downloadFile(
      csv,
      `jv-export-${selectedRun.label.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportJson = (): void => {
    const payload = {
      run: selectedRun.label,
      authId: selectedRun.authId,
      status: selectedRun.status,
      config: selectedRun.config,
      totals,
      mappings: selectedRun.mappings,
    };

    downloadFile(
      JSON.stringify(payload, null, 2),
      `jv-export-${selectedRun.label.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.json`,
      "application/json;charset=utf-8;"
    );
  };

  const resetPage = (): void => setPage(1);

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">
                Accounting JV Export
              </h2>
              <p className="mt-0.5 text-sm text-brand-700">
                Map payroll components to General Ledger accounts for ERP integration
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openConfigModal}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Settings2 className="h-4 w-4" />
                Global Mapping
              </button>

              <div className="relative">
                <select
                  value={selectedRun.id}
                  onChange={(e) => {
                    setSelectedRunId(e.target.value);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
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

          {/* Balance banner */}
          <div
            className={`flex flex-col gap-4 border-t px-6 py-5 md:flex-row md:items-center md:justify-between ${
              totals.balanced
                ? "border-emerald-700 bg-emerald-600 text-white"
                : "border-red-700 bg-red-600 text-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/15 p-3">
                {totals.balanced ? (
                  <ShieldCheck className="h-8 w-8" />
                ) : (
                  <AlertCircle className="h-8 w-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {totals.balanced ? "Trial Balance Verified" : "Voucher Unbalanced"}
                </h3>
                <p className="text-sm text-white/85">
                  {totals.balanced
                    ? "All debit and credit entries match. Voucher is ready for ERP transmission."
                    : `There is a variance of PKR ${formatFullPKR(
                        totals.variance
                      )}. Please review GL mappings before posting.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Total Debits
                </p>
                <p className="text-2xl font-black">{formatPKRShort(totals.debits)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Total Credits
                </p>
                <p className="text-2xl font-black">{formatPKRShort(totals.credits)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left */}
          <div className="space-y-4 lg:col-span-8">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand-800" />
                  <h4 className="text-sm font-semibold text-brand-900">
                    Voucher Line Items
                  </h4>
                </div>

                <button
                  onClick={handleExportTemplate}
                  className="text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:underline"
                >
                  Download Template
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative w-full sm:w-[280px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      placeholder="Search component, GL, cost center..."
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
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value as "All" | EntryType);
                        resetPage();
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      <option value="All">All Types</option>
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>

                    <select
                      value={costCenterFilter}
                      onChange={(e) => {
                        setCostCenterFilter(e.target.value);
                        resetPage();
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      {costCenters.map((center) => (
                        <option key={center} value={center}>
                          {center}
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

              <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">{showingFrom}</span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">{showingTo}</span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                  <span className="text-brand-700"> mappings</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">{debitLines}</span>
                    Debit Lines
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">{creditLines}</span>
                    Credit Lines
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Pay Component
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        GL Account
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Cost Center
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Debit (PKR)
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Credit (PKR)
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedMappings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                              <Layers className="h-5 w-5 text-brand-800" />
                            </div>
                            <p className="text-sm font-semibold text-brand-900">
                              No mapping lines found
                            </p>
                            <p className="text-sm text-brand-700">
                              Try changing the search, entry type, or cost center filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedMappings.map((mapping) => (
                        <tr key={mapping.id} className="hover:bg-brand-100/50">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-brand-900">
                              {mapping.component}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-[12px] font-semibold text-brand-900">
                                {mapping.glAccount}
                              </span>
                              <span className="text-xs text-brand-700">
                                {mapping.glName}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                              {mapping.costCenter}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-brand-900">
                            {mapping.type === "DEBIT" ? formatFullPKR(mapping.amount) : "--"}
                          </td>

                          <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-red-700">
                            {mapping.type === "CREDIT" ? formatFullPKR(mapping.amount) : "--"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(mapping)}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <PencilLine className="h-4 w-4" />
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-brand-800 text-white">
                      <th colSpan={3} className="px-5 py-4 text-right text-sm font-semibold">
                        Trial Balance Total
                      </th>
                      <th className="px-5 py-4 text-right text-sm font-semibold">
                        {formatFullPKR(totals.debits)}
                      </th>
                      <th className="px-5 py-4 text-right text-sm font-semibold">
                        {formatFullPKR(totals.credits)}
                      </th>
                      <th className="px-5 py-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {paginatedMappings.length > 0 && (
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
          </div>

          {/* Right */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-brand-900">
                  ERP Integration
                </h3>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-brand-800" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Target System
                      </span>
                    </div>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {selectedRun.config.targetSystem}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-700">Connection Status</span>
                      <span className="font-semibold text-emerald-700">
                        Encrypted Link OK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-700">Posting Period</span>
                      <span className="font-semibold text-brand-900">
                        {selectedRun.config.postingPeriod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-700">Company Code</span>
                      <span className="font-semibold text-brand-900">
                        {selectedRun.config.companyCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-700">Document Type</span>
                      <span className="font-semibold text-brand-900">
                        {selectedRun.config.documentType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-brand-100/40"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Excel Export
                    </span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-brand-100/40"
                  >
                    <FileJson className="h-5 w-5 text-amber-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      JSON API
                    </span>
                  </button>
                </div>

                <div className="h-px bg-gray-100" />

                {!selectedRun.postedDocId ? (
                  <button
                    onClick={handlePostToERP}
                    disabled={!validation.allPassed || isPosting}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand-800 px-4 py-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPosting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isPosting ? "Posting to ERP..." : "Post to General Ledger"}
                  </button>
                ) : (
                  <div className="rounded-xl bg-emerald-500 px-4 py-4 text-white">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-wider">
                          Success
                        </p>
                        <p className="mt-1 text-sm opacity-95">
                          DOC ID: {selectedRun.postedDocId} posted successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Post-Posting Checklist
                  </h4>

                  {[
                    {
                      label: "Debit / Credit Equality",
                      status: validation.debitCreditEquality,
                    },
                    {
                      label: "Valid GL Account Strings",
                      status: validation.validGLStrings,
                    },
                    {
                      label: "Active Cost Center Mapping",
                      status: validation.activeCostCenters,
                    },
                    {
                      label: "Positive Line Amounts",
                      status: validation.positiveAmounts,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 text-sm text-brand-800"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          item.status ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {item.status ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                      </div>
                      {item.label}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-200 bg-brand-100/30 p-4">
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-0.5 h-4 w-4 text-brand-800" />
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        ERP Voucher Context
                      </p>
                      <p className="mt-1 text-sm leading-6 text-brand-700">
                        Run: {selectedRun.label} • Auth ID: {selectedRun.authId}
                      </p>
                      <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline">
                        View posting metadata
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Audit Enforcement
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-700">
              Once a JV is successfully posted to the ERP, the payroll run should be
              treated as accounting closed. Any reversal must be performed inside the
              ERP and documented against the original authorization trail.
            </p>
          </div>
        </div>
      </div>

      {/* Mapping Edit Modal */}
      {editingMapping && mappingDraft && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-brand-900/30 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">Edit GL Mapping</h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Update ledger coding for the selected payroll component
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Pay Component
                </label>
                <input
                  type="text"
                  value={mappingDraft.component}
                  onChange={(e) =>
                    setMappingDraft({ ...mappingDraft, component: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  GL Account
                </label>
                <input
                  type="text"
                  value={mappingDraft.glAccount}
                  onChange={(e) =>
                    setMappingDraft({ ...mappingDraft, glAccount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Entry Type
                </label>
                <select
                  value={mappingDraft.type}
                  onChange={(e) =>
                    setMappingDraft({
                      ...mappingDraft,
                      type: e.target.value as EntryType,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  GL Name
                </label>
                <input
                  type="text"
                  value={mappingDraft.glName}
                  onChange={(e) =>
                    setMappingDraft({ ...mappingDraft, glName: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Cost Center
                </label>
                <input
                  type="text"
                  value={mappingDraft.costCenter}
                  onChange={(e) =>
                    setMappingDraft({ ...mappingDraft, costCenter: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Amount
                </label>
                <input
                  type="number"
                  value={mappingDraft.amount}
                  onChange={(e) =>
                    setMappingDraft({
                      ...mappingDraft,
                      amount: Number(e.target.value || 0),
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeEditModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                onClick={saveMappingChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && configDraft && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-brand-900/30 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">
                  ERP Integration Settings
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Configure posting metadata for the selected payroll run
                </p>
              </div>

              <button
                onClick={() => setShowConfigModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Target System
                </label>
                <input
                  type="text"
                  value={configDraft.targetSystem}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, targetSystem: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Posting Period
                </label>
                <input
                  type="text"
                  value={configDraft.postingPeriod}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, postingPeriod: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Company Code
                </label>
                <input
                  type="text"
                  value={configDraft.companyCode}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, companyCode: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Document Type
                </label>
                <input
                  type="text"
                  value={configDraft.documentType}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, documentType: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase text-brand-900 outline-none focus:border-brand-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Currency
                </label>
                <input
                  type="text"
                  value={configDraft.currency}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, currency: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase text-brand-900 outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                onClick={saveConfigChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {postingToast && (
        <div className="fixed bottom-6 right-6 z-[220] rounded-xl bg-emerald-500 px-5 py-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider">
                Success
              </p>
              <p className="mt-1 text-sm">
                JV posted successfully to ERP for {selectedRun.label}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default JVExport