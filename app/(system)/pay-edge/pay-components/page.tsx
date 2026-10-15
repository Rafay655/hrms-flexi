"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Wallet,
  MinusCircle,
  ShieldCheck,
  HandCoins,
  Zap,
  ChevronDown,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  RefreshCcw,
} from "lucide-react";
import { EarningComponentForm } from "@/components/EarningComponentForm";
import { DeductionComponentForm } from "@/components/DeductionComponentForm";
import { ContributionComponentForm } from "@/components/ContributionComponentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ComponentType = "EARNING" | "DEDUCTION" | "CONTRIBUTION" | "TAX" | "REIMBURSEMENT";

interface PayComponent {
  code: string;
  name: string;
  type: ComponentType;
  calculation: string;
  frequency: string;
  taxable: boolean;
  recurring: boolean;
  status: "Active" | "Inactive";
  description: string;
  flags: {
    otBase?: boolean;
    gratuity?: boolean;
    pf?: boolean;
    eobi?: boolean;
  };
}

const DEFAULT_PER_PAGE = 10;

const TYPE_CONFIG: Record<ComponentType, { icon: React.ElementType; label: string }> = {
  EARNING: { label: "Earnings", icon: Wallet },
  DEDUCTION: { label: "Deductions", icon: MinusCircle },
  CONTRIBUTION: { label: "Contributions", icon: HandCoins },
  TAX: { label: "Tax", icon: ShieldCheck },
  REIMBURSEMENT: { label: "Reimbursements", icon: Zap },
};

const MOCK_COMPONENTS: PayComponent[] = [
  {
    code: "B001",
    name: "Basic Salary",
    type: "EARNING",
    calculation: "Fixed",
    frequency: "Monthly",
    taxable: true,
    recurring: true,
    status: "Active",
    description: "Main monthly earning component.",
    flags: { otBase: true, gratuity: true, pf: true, eobi: true },
  },
  {
    code: "H002",
    name: "House Rent Allowance",
    type: "EARNING",
    calculation: "45% of Basic",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Housing support component.",
    flags: { gratuity: true },
  },
  {
    code: "U003",
    name: "Utilities Allowance",
    type: "EARNING",
    calculation: "10% of Basic",
    frequency: "Monthly",
    taxable: true,
    recurring: true,
    status: "Active",
    description: "Utility support allowance.",
    flags: {},
  },
  {
    code: "T004",
    name: "Income Tax",
    type: "TAX",
    calculation: "FBR Slabs 2024-25",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Income tax deduction as per slab.",
    flags: {},
  },
  {
    code: "P005",
    name: "Provident Fund (Employee)",
    type: "DEDUCTION",
    calculation: "8.33% of Basic",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Employee-side PF deduction.",
    flags: { pf: true },
  },
  {
    code: "P006",
    name: "Provident Fund (Company)",
    type: "CONTRIBUTION",
    calculation: "8.33% of Basic",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Employer-side PF contribution.",
    flags: { pf: true },
  },
  {
    code: "E007",
    name: "EOBI (Employee)",
    type: "DEDUCTION",
    calculation: "Fixed (PKR 180)",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Employee-side EOBI deduction.",
    flags: { eobi: true },
  },
  {
    code: "E008",
    name: "EOBI (Company)",
    type: "CONTRIBUTION",
    calculation: "Fixed (PKR 540)",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Employer-side EOBI contribution.",
    flags: { eobi: true },
  },
  {
    code: "M009",
    name: "Fuel Reimbursement",
    type: "REIMBURSEMENT",
    calculation: "Limit vs Actual",
    frequency: "Ad-hoc",
    taxable: false,
    recurring: false,
    status: "Active",
    description: "Approved fuel expense reimbursement.",
    flags: {},
  },
  {
    code: "C010",
    name: "Conveyance Allowance",
    type: "EARNING",
    calculation: "Fixed",
    frequency: "Monthly",
    taxable: true,
    recurring: true,
    status: "Active",
    description: "Transport allowance component.",
    flags: { gratuity: true },
  },
  {
    code: "O011",
    name: "Overtime Payment",
    type: "EARNING",
    calculation: "2.0x Hourly",
    frequency: "Monthly",
    taxable: true,
    recurring: false,
    status: "Active",
    description: "Overtime-based earning component.",
    flags: { otBase: true },
  },
  {
    code: "L012",
    name: "Loan Recovery",
    type: "DEDUCTION",
    calculation: "Installment",
    frequency: "Monthly",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Loan recovery through payroll.",
    flags: {},
  },
  {
    code: "G013",
    name: "Gratuity Provision",
    type: "CONTRIBUTION",
    calculation: "15 Days Basic",
    frequency: "Annual",
    taxable: false,
    recurring: true,
    status: "Active",
    description: "Annual gratuity provision entry.",
    flags: { gratuity: true },
  },
];

const statusClasses: Record<PayComponent["status"], string> = {
  Active: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Inactive: "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
};

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-700">{title}</p>
            <p className="text-2xl font-bold text-brand-900 mt-1">{value}</p>
            <p className="text-xs text-brand-700 mt-1">{subtitle}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Icon className="h-4 w-4 text-brand-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-brand-700">{label}</span>
      <span className="font-medium text-brand-900 text-right">{value}</span>
    </div>
  );
}

function FlagPill({ label, active }: { label: string; active?: boolean }) {
  if (!active) {
    return <div className="w-7 h-7 rounded-md border border-gray-200 bg-white" />;
  }
  return (
    <div className="w-7 h-7 rounded-md bg-brand-100 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-brand-800">
      {label}
    </div>
  );
}

 const PayComponentsList: React.FC = () => {
  const [components, setComponents] = useState<PayComponent[]>(MOCK_COMPONENTS);
  const [activeTab, setActiveTab] = useState<"ALL" | ComponentType>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [isEarningFormOpen, setIsEarningFormOpen] = useState(false);
  const [isDeductionFormOpen, setIsDeductionFormOpen] = useState(false);
  const [isContributionFormOpen, setIsContributionFormOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<PayComponent | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const q = useDebounced(search, 400);

  useEffect(() => {
    setIsFetching(true);
    const t = setTimeout(() => setIsFetching(false), 300);
    return () => clearTimeout(t);
  }, [q, statusFilter, activeTab, perPage, page]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, activeTab, perPage]);

  const filteredComponents = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return components.filter((item) => {
      const matchesTab = activeTab === "ALL" || item.type === activeTab;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.type.toLowerCase().includes(needle);
      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [components, activeTab, statusFilter, q]);

  const totalEntries = filteredComponents.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const rows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredComponents.slice(start, start + perPage).map((item, index) => ({
      sr: start + index + 1,
      ...item,
    }));
  }, [filteredComponents, currentPage, perPage]);

  const stats = useMemo(() => {
    return {
      TOTAL: components.length,
      EARNING: components.filter((c) => c.type === "EARNING").length,
      DEDUCTION: components.filter((c) => c.type === "DEDUCTION").length,
      CONTRIBUTION: components.filter((c) => c.type === "CONTRIBUTION").length,
      TAX: components.filter((c) => c.type === "TAX").length,
      REIMBURSEMENT: components.filter((c) => c.type === "REIMBURSEMENT").length,
      ACTIVE: components.filter((c) => c.status === "Active").length,
      INACTIVE: components.filter((c) => c.status === "Inactive").length,
    };
  }, [components]);

  const handleSaveEarning = (data: any) => {
    const newItem: PayComponent = {
      code: data.code || `E${Date.now()}`,
      name: data.name || "New Earning",
      type: "EARNING",
      calculation:
        data.calculationType === "Fixed Amount"
          ? `Fixed ${data.value || ""}`.trim()
          : data.calculationType === "% of Basic"
          ? `${data.value || 0}% of Basic`
          : data.calculationType === "% of Gross"
          ? `${data.value || 0}% of Gross`
          : "Custom Formula",
      frequency: data.frequency || "Monthly",
      taxable: !!data.taxable,
      recurring: data.frequency !== "Ad-hoc",
      status: data.status || "Active",
      description: data.description || "Earning component",
      flags: {
        otBase: !!data.partOfOtBase,
        gratuity: !!data.partOfGratuity,
        pf: !!data.impactPf,
        eobi: !!data.impactEobi,
      },
    };
    setComponents((prev) => [newItem, ...prev]);
    setIsEarningFormOpen(false);
  };

  const handleSaveDeduction = (data: any) => {
    const newItem: PayComponent = {
      code: data.code || `D${Date.now()}`,
      name: data.name || "New Deduction",
      type: "DEDUCTION",
      calculation:
        data.calculationType === "Fixed Amount"
          ? `Fixed ${data.value || ""}`.trim()
          : data.calculationType === "% of Gross"
          ? `${data.value || 0}% of Gross`
          : data.calculationType === "Slab-based"
          ? "Slab-based"
          : "Custom Formula",
      frequency: data.frequency || "Monthly",
      taxable: false,
      recurring: data.frequency !== "Ad-hoc",
      status: data.status || "Active",
      description: data.description || "Deduction component",
      flags: {
        pf: data.category?.toLowerCase().includes("provident"),
        eobi: data.category?.toLowerCase().includes("eobi"),
      },
    };
    setComponents((prev) => [newItem, ...prev]);
    setIsDeductionFormOpen(false);
  };

  const handleSaveContribution = (data: any) => {
    const newItem: PayComponent = {
      code: data.code || `C${Date.now()}`,
      name: data.name || "New Contribution",
      type: "CONTRIBUTION",
      calculation: `${data.employerShare || 0}% on ${data.base || "Basic Salary"}`,
      frequency: "Monthly",
      taxable: false,
      recurring: true,
      status: data.status || "Active",
      description: data.description || "Contribution component",
      flags: {
        pf: data.category?.toLowerCase().includes("provident"),
        eobi: data.category?.toLowerCase().includes("eobi"),
        gratuity: data.category?.toLowerCase().includes("gratuity"),
      },
    };
    setComponents((prev) => [newItem, ...prev]);
    setIsContributionFormOpen(false);
  };

  const openView = (component: PayComponent) => {
    setSelectedComponent(component);
    setIsViewOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Pay Components
                </CardTitle>
                <p className="text-sm text-brand-700 mt-1">
                  Redesign aligned with your main listing UI and modal-based add forms.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
                <div className="relative">
                  <Button
                    className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
                    onClick={() => setIsAddMenuOpen((p) => !p)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Component <ChevronDown className="h-4 w-4" />
                  </Button>
                  {isAddMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsAddMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-40 p-2">
                        <button
                          onClick={() => {
                            setIsEarningFormOpen(true);
                            setIsAddMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-800 hover:bg-brand-100 transition-colors"
                        >
                          <Wallet className="h-4 w-4" />
                          New Earning
                        </button>
                        <button
                          onClick={() => {
                            setIsDeductionFormOpen(true);
                            setIsAddMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-800 hover:bg-brand-100 transition-colors"
                        >
                          <MinusCircle className="h-4 w-4" />
                          New Deduction
                        </button>
                        <button
                          onClick={() => {
                            setIsContributionFormOpen(true);
                            setIsAddMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-800 hover:bg-brand-100 transition-colors"
                        >
                          <HandCoins className="h-4 w-4" />
                          New Contribution
                        </button>
                        <div className="h-px bg-gray-200 my-2" />
                        <button
                          disabled
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          New Tax
                        </button>
                        <button
                          disabled
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                        >
                          <Zap className="h-4 w-4" />
                          New Reimbursement
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Components"
                value={String(stats.TOTAL)}
                subtitle="All configured components"
                icon={Wallet}
              />
              <StatCard
                title="Active Components"
                value={String(stats.ACTIVE)}
                subtitle={`${stats.INACTIVE} inactive`}
                icon={CheckCircle2}
              />
              <StatCard
                title="Earnings + Contributions"
                value={String(stats.EARNING + stats.CONTRIBUTION)}
                subtitle="Positive payroll components"
                icon={HandCoins}
              />
              <StatCard
                title="Deductions + Tax"
                value={String(stats.DEDUCTION + stats.TAX)}
                subtitle="Recovery and tax components"
                icon={Receipt}
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={activeTab === "ALL" ? "default" : "outline"}
                onClick={() => setActiveTab("ALL")}
                className={
                  activeTab === "ALL"
                    ? "bg-brand-800 hover:bg-brand-900 text-white"
                    : "border-gray-200 text-brand-800 hover:bg-brand-100"
                }
              >
                All
              </Button>
              {(Object.keys(TYPE_CONFIG) as ComponentType[]).map((key) => (
                <Button
                  key={key}
                  variant={activeTab === key ? "default" : "outline"}
                  onClick={() => setActiveTab(key)}
                  className={
                    activeTab === key
                      ? "bg-brand-800 hover:bg-brand-900 text-white"
                      : "border-gray-200 text-brand-800 hover:bg-brand-100"
                  }
                >
                  {TYPE_CONFIG[key].label}
                </Button>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                <Input
                  placeholder="Search by code, name or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-200 text-brand-900"
                />
              </div>
              <div className="w-full lg:w-48">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
                >
                  <SelectTrigger className="border-gray-200 text-brand-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading */}
            {isFetching && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-800" />
              </div>
            )}

            {/* Table */}
            {!isFetching && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-brand-800">Sr</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Code</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Calculation</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Frequency</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Taxable</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800">Flags</TableHead>
                      <TableHead className="text-xs font-semibold text-brand-800 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-brand-700 py-8">
                          No components found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((item) => (
                        <TableRow key={item.code} className="border-b border-gray-200 hover:bg-brand-50">
                          <TableCell className="text-sm text-brand-800">{item.sr}</TableCell>
                          <TableCell className="text-sm font-mono text-brand-900">{item.code}</TableCell>
                          <TableCell className="text-sm font-medium text-brand-900">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-brand-100 text-brand-800 border-gray-200">
                              {TYPE_CONFIG[item.type]?.label || item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-brand-800">{item.calculation}</TableCell>
                          <TableCell className="text-sm text-brand-800">{item.frequency}</TableCell>
                          <TableCell>
                            {item.taxable ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusClasses[item.status]}>{item.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FlagPill label="OT" active={item.flags?.otBase} />
                              <FlagPill label="Grat" active={item.flags?.gratuity} />
                              <FlagPill label="PF" active={item.flags?.pf} />
                              <FlagPill label="EOBI" active={item.flags?.eobi} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openView(item)}
                              className="h-8 w-8 p-0 text-brand-800 hover:bg-brand-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-sm text-brand-700">
                Showing {showingFrom} to {showingTo} of {totalEntries} entries
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-brand-700 mr-1">Rows per page:</span>
                  <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                    <SelectTrigger className="w-20 h-8 border-gray-200 text-brand-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 text-brand-800"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 text-brand-800"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-brand-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 text-brand-800"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 text-brand-800"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <EarningComponentForm
        isOpen={isEarningFormOpen}
        onClose={() => setIsEarningFormOpen(false)}
        onSave={handleSaveEarning}
      />
      <DeductionComponentForm
        isOpen={isDeductionFormOpen}
        onClose={() => setIsDeductionFormOpen(false)}
        onSave={handleSaveDeduction}
      />
      <ContributionComponentForm
        isOpen={isContributionFormOpen}
        onClose={() => setIsContributionFormOpen(false)}
        onSave={handleSaveContribution}
      />

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl border border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-brand-900 flex items-center gap-2">
              {selectedComponent?.type && TYPE_CONFIG[selectedComponent.type]?.icon &&
                React.createElement(TYPE_CONFIG[selectedComponent.type].icon, {
                  className: "h-5 w-5 text-brand-800",
                })}
              <span>{selectedComponent?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-brand-700">
              Component details and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedComponent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Code" value={selectedComponent.code} />
                <DetailRow
                  label="Type"
                  value={TYPE_CONFIG[selectedComponent.type]?.label || selectedComponent.type}
                />
                <DetailRow label="Calculation" value={selectedComponent.calculation} />
                <DetailRow label="Frequency" value={selectedComponent.frequency} />
                <DetailRow label="Taxable" value={selectedComponent.taxable ? "Yes" : "No"} />
                <DetailRow label="Status" value={selectedComponent.status} />
                <DetailRow label="Description" value={selectedComponent.description || "—"} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-brand-800 mb-2">Impact Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedComponent.flags?.otBase && (
                    <Badge className="bg-brand-100 text-brand-800">OT Base</Badge>
                  )}
                  {selectedComponent.flags?.gratuity && (
                    <Badge className="bg-brand-100 text-brand-800">Gratuity</Badge>
                  )}
                  {selectedComponent.flags?.pf && (
                    <Badge className="bg-brand-100 text-brand-800">Provident Fund</Badge>
                  )}
                  {selectedComponent.flags?.eobi && (
                    <Badge className="bg-brand-100 text-brand-800">EOBI</Badge>
                  )}
                  {!Object.values(selectedComponent.flags || {}).some(Boolean) && (
                    <span className="text-sm text-brand-700">No flags assigned</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
              onClick={() => setIsViewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayComponentsList