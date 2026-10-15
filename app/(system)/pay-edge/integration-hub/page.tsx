"use client";

import React, { useMemo, useState } from "react";
import {
  Link2,
  RefreshCw,
  Clock,
  CalendarDays,
  Users,
  Cloud,
  Calculator,
  Plus,
  Trash2,
  Info,
  ArrowRight,
  Database,
  Settings2,
  Terminal,
  ShieldCheck,
  Layers,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HubTab = "INTERNAL" | "EXTERNAL" | "JV";
type SyncStatus = "ACTIVE" | "PENDING" | "ERROR";
type ConnectorStatus = "CONNECTED" | "DISCONNECTED";

interface FlexiModule {
  id: string;
  name: string;
  icon: LucideIcon;
  status: SyncStatus;
  lastSync: string;
  mappedEntities: number;
  subtitle: string;
}

interface ExternalERP {
  id: string;
  name: string;
  provider: string;
  status: ConnectorStatus;
  endpoint: string;
  lastPost: string;
}

interface MappingRule {
  id: string;
  component: string;
  debit: string;
  credit: string;
}

const INTERNAL_MODULES: FlexiModule[] = [
  {
    id: "time",
    name: "TimeSync",
    icon: Clock,
    status: "ACTIVE",
    lastSync: "10 mins ago",
    mappedEntities: 325,
    subtitle: "Native Flexi data bridge",
  },
  {
    id: "leave",
    name: "LeaveEase",
    icon: CalendarDays,
    status: "ACTIVE",
    lastSync: "2 hours ago",
    mappedEntities: 42,
    subtitle: "Leave balances and rules",
  },
  {
    id: "hub",
    name: "PeopleHub",
    icon: Users,
    status: "ACTIVE",
    lastSync: "Real-time",
    mappedEntities: 485,
    subtitle: "Core employee master sync",
  },
];

const EXTERNAL_ERPS: ExternalERP[] = [
  {
    id: "erp1",
    name: "SAP S/4HANA",
    provider: "SAP SE",
    status: "CONNECTED",
    endpoint: "https://api.sap.corp/jv/v1",
    lastPost: "Dec 31, 2024",
  },
  {
    id: "erp2",
    name: "Oracle NetSuite",
    provider: "Oracle",
    status: "DISCONNECTED",
    endpoint: "N/A",
    lastPost: "N/A",
  },
  {
    id: "erp3",
    name: "QuickBooks Online",
    provider: "Intuit",
    status: "CONNECTED",
    endpoint: "https://quickbooks.api.intuit.com",
    lastPost: "Dec 15, 2024",
  },
];

const INITIAL_MAPPING_RULES: MappingRule[] = [
  {
    id: "1",
    component: "Basic Salary",
    debit: "501001 - Salaries Exp",
    credit: "201001 - Accrued Sal",
  },
  {
    id: "2",
    component: "House Rent Allowance",
    debit: "501002 - Allowances Exp",
    credit: "201001 - Accrued Sal",
  },
  {
    id: "3",
    component: "Income Tax",
    debit: "201001 - Accrued Sal",
    credit: "202005 - Tax Payable",
  },
  {
    id: "4",
    component: "Provident Fund (ER)",
    debit: "501005 - Benefits Exp",
    credit: "202010 - PF Payable",
  },
];

function SyncBadge({ status }: { status: SyncStatus }) {
  const styles: Record<SyncStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    PENDING:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
    ERROR: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </Badge>
  );
}

function ConnectorBadge({ status }: { status: ConnectorStatus }) {
  const styles: Record<ConnectorStatus, string> = {
    CONNECTED:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    DISCONNECTED:
      "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </Badge>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-700">
      <span className="font-semibold text-brand-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}

 const PayEdgeIntegrationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>("INTERNAL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [externalSearch, setExternalSearch] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingRules, setMappingRules] =
    useState<MappingRule[]>(INITIAL_MAPPING_RULES);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1800);
  };

  const filteredExternalErps = useMemo(() => {
    const q = externalSearch.trim().toLowerCase();
    if (!q) return EXTERNAL_ERPS;

    return EXTERNAL_ERPS.filter(
      (erp) =>
        erp.name.toLowerCase().includes(q) ||
        erp.provider.toLowerCase().includes(q) ||
        erp.endpoint.toLowerCase().includes(q) ||
        erp.status.toLowerCase().includes(q)
    );
  }, [externalSearch]);

  const filteredMappingRules = useMemo(() => {
    const q = mappingSearch.trim().toLowerCase();
    if (!q) return mappingRules;

    return mappingRules.filter(
      (rule) =>
        rule.component.toLowerCase().includes(q) ||
        rule.debit.toLowerCase().includes(q) ||
        rule.credit.toLowerCase().includes(q)
    );
  }, [mappingSearch, mappingRules]);

  const connectedCount = EXTERNAL_ERPS.filter(
    (erp) => erp.status === "CONNECTED"
  ).length;

  const handleAddMappingRule = () => {
    setMappingRules((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        component: "New Pay Component",
        debit: "",
        credit: "",
      },
    ]);
  };

  const handleRemoveMappingRule = (id: string) => {
    setMappingRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const handleMappingChange = (
    id: string,
    field: keyof Omit<MappingRule, "id">,
    value: string
  ) => {
    setMappingRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule))
    );
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <Link2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-brand-900">
                    Integration Hub
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-sm text-brand-700">
                    Manage data bridges between Flexi modules and external
                    ecosystems
                  </CardDescription>
                </div>
              </div>

              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="gap-2 bg-brand-800 text-white hover:bg-brand-900"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                />
                Force Global Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs + Summary */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "INTERNAL" as HubTab, label: "Flexi Ecosystem" },
                { id: "EXTERNAL" as HubTab, label: "External ERPs" },
                { id: "JV" as HubTab, label: "JV Mapping Engine" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant="outline"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    activeTab === tab.id
                      ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900 hover:text-white"
                      : "border-gray-200 text-brand-800 hover:bg-brand-100"
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Current section: </span>
                  <span className="font-semibold text-brand-900">
                    {activeTab === "INTERNAL"
                      ? "Flexi Ecosystem"
                      : activeTab === "EXTERNAL"
                      ? "External ERPs"
                      : "JV Mapping Engine"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <SummaryPill
                    label="Internal Modules"
                    value={INTERNAL_MODULES.length}
                  />
                  <div className="h-3 w-px bg-brand-300" />
                  <SummaryPill label="Connected ERPs" value={connectedCount} />
                  <div className="h-3 w-px bg-brand-300" />
                  <SummaryPill
                    label="Mapping Rules"
                    value={mappingRules.length}
                  />
                  <div className="h-3 w-px bg-brand-300" />
                  <SummaryPill
                    label="Sync Status"
                    value={isSyncing ? "Running" : "Ready"}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* INTERNAL */}
        {activeTab === "INTERNAL" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {INTERNAL_MODULES.map((mod) => {
              const Icon = mod.icon;

              return (
                <Card
                  key={mod.id}
                  className="border border-gray-200 shadow-sm transition-colors hover:border-brand-200"
                >
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                          <Icon className="h-5 w-5" />
                        </div>
                        <SyncBadge status={mod.status} />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-brand-900">
                          {mod.name}
                        </h4>
                        <p className="text-sm text-brand-700">{mod.subtitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                            Mappings
                          </p>
                          <p className="mt-1 text-sm font-semibold text-brand-900">
                            {mod.mappedEntities}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                            Last Sync
                          </p>
                          <p className="mt-1 text-sm font-semibold text-brand-900">
                            {mod.lastSync}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-2 border-dashed border-gray-200 shadow-none transition-colors hover:border-brand-200">
              <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <Plus className="h-6 w-6" />
                </div>
                <h5 className="mt-4 text-base font-semibold text-brand-900">
                  Add Native Hook
                </h5>
                <p className="mt-1 max-w-[220px] text-sm text-brand-700">
                  Connect a new internal FlexiHRMS module into the integration
                  hub.
                </p>
                <Button className="mt-4 bg-brand-800 text-white hover:bg-brand-900">
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* EXTERNAL */}
        {activeTab === "EXTERNAL" && (
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-brand-900">
                    External ERP & Accounting Connectors
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-brand-700">
                    Connect, monitor, and manage posting endpoints
                  </CardDescription>
                </div>

                <Button className="bg-brand-800 text-white hover:bg-brand-900">
                  Add API Connector
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  value={externalSearch}
                  onChange={(e) => setExternalSearch(e.target.value)}
                  placeholder="Search by system, provider, endpoint..."
                  className="border-gray-200 pl-10 text-sm text-brand-900"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Sr.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        System Identity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Endpoint Target
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Last Posting
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {filteredExternalErps.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm text-brand-700"
                        >
                          No connectors found.
                        </td>
                      </tr>
                    ) : (
                      filteredExternalErps.map((erp, index) => (
                        <tr
                          key={erp.id}
                          className="border-b border-gray-200 last:border-b-0 hover:bg-brand-100"
                        >
                          <td className="px-4 py-3.5 text-sm font-semibold text-brand-900">
                            {String(index + 1).padStart(2, "0")}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                                <Cloud className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-900">
                                  {erp.name}
                                </p>
                                <p className="text-[11px] text-brand-700">
                                  {erp.provider}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <code className="inline-flex rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-brand-700">
                              {erp.endpoint}
                            </code>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <ConnectorBadge status={erp.status} />
                          </td>

                          <td className="px-4 py-3.5 text-center text-sm font-semibold text-brand-900">
                            {erp.lastPost}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                              >
                                <Terminal className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-brand-700">
                Showing{" "}
                <span className="font-semibold text-brand-900">
                  {filteredExternalErps.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-brand-900">
                  {EXTERNAL_ERPS.length}
                </span>{" "}
                connectors
              </div>
            </CardContent>
          </Card>
        )}

        {/* JV */}
        {activeTab === "JV" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <Card className="overflow-hidden border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-brand-900">
                        Ledger Mapping Configuration
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-brand-700">
                        Manage debit and credit account mappings for payroll
                        posting
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      Download Master Map
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <Input
                      value={mappingSearch}
                      onChange={(e) => setMappingSearch(e.target.value)}
                      placeholder="Search mapping rules..."
                      className="border-gray-200 pl-10 text-sm text-brand-900"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Sr.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Pay Component
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            GL Account (Debit)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            GL Account (Credit)
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white">
                        {filteredMappingRules.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-12 text-center text-sm text-brand-700"
                            >
                              No mapping rules found.
                            </td>
                          </tr>
                        ) : (
                          filteredMappingRules.map((rule, index) => (
                            <tr
                              key={rule.id}
                              className="border-b border-gray-200 last:border-b-0 hover:bg-brand-100"
                            >
                              <td className="px-4 py-3.5 text-sm font-semibold text-brand-900">
                                {String(index + 1).padStart(2, "0")}
                              </td>

                              <td className="px-4 py-3.5">
                                <Input
                                  value={rule.component}
                                  onChange={(e) =>
                                    handleMappingChange(
                                      rule.id,
                                      "component",
                                      e.target.value
                                    )
                                  }
                                  className="border-gray-200 text-sm text-brand-900"
                                />
                              </td>

                              <td className="px-4 py-3.5">
                                <Input
                                  value={rule.debit}
                                  onChange={(e) =>
                                    handleMappingChange(
                                      rule.id,
                                      "debit",
                                      e.target.value
                                    )
                                  }
                                  className="border-gray-200 font-mono text-sm text-brand-900"
                                />
                              </td>

                              <td className="px-4 py-3.5">
                                <Input
                                  value={rule.credit}
                                  onChange={(e) =>
                                    handleMappingChange(
                                      rule.id,
                                      "credit",
                                      e.target.value
                                    )
                                  }
                                  className="border-gray-200 font-mono text-sm text-brand-900"
                                />
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveMappingRule(rule.id)}
                                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleAddMappingRule}
                    className="w-full border-dashed border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Mapping Rule
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 xl:col-span-4">
              <Card className="overflow-hidden border border-brand-800 bg-brand-800 text-white shadow-sm">
                <CardContent className="relative p-5">
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Calculator className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">
                          Voucher Logic
                        </h3>
                        <p className="text-sm text-white/80">
                          Configure how payroll batches are posted
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                          Voucher Grouping
                        </label>
                        <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none">
                          <option className="text-gray-900">
                            Per Cost Center (Consolidated)
                          </option>
                          <option className="text-gray-900">
                            Per Employee (Detail)
                          </option>
                          <option className="text-gray-900">
                            Entire Batch (Consolidated)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                          Posting Trigger
                        </label>
                        <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none">
                          <option className="text-gray-900">
                            Upon Batch Approval
                          </option>
                          <option className="text-gray-900">
                            Manual Posting Only
                          </option>
                          <option className="text-gray-900">
                            Scheduled End of Cycle
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Database className="absolute bottom-[-18px] right-[-18px] h-32 w-32 text-white/5" />
                </CardContent>
              </Card>

              <Card className="border border-blue-100 bg-blue-50 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Info className="h-4 w-4" />
                    <h5 className="text-sm font-semibold">ERP Integrity</h5>
                  </div>
                  <p className="text-sm leading-6 text-blue-800">
                    PayEdge validates balanced mapping status before allowing
                    posting. Current Jan 2025 mapping status is{" "}
                    <span className="font-semibold text-green-700">
                      BALANCED ✓
                    </span>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Audit Block */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-brand-900">
                  Security & Governance Protocol
                </h5>
                <p className="text-sm text-brand-700">
                  All transmissions are encrypted via mutual-TLS v1.3 with
                  automated certificate rotation.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              Audit API Logs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default PayEdgeIntegrationSettings;