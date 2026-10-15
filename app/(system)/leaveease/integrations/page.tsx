// app/flexi-hq/integrations/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Clock,
  DollarSign,
  Users,
  Target,
  Zap,
  ChevronRight,
  ArrowRightLeft,
  ShieldCheck,
  Search,
  Activity,
  ArrowUpRight,
  Terminal,
  Download,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";
import { IntegrationConfigDrawer } from "@/components/leaveease/IntegrationLeaveDrawer"; // ensure path matches

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "OK" | "Error" | "Syncing";
  description: string;
  lastSync: string;
  todayCount: number;
  color: string; // for icon background, now using brand classes
}

interface SyncLog {
  id: string;
  timestamp: string;
  integration: string;
  direction: "Inbound" | "Outbound" | "Bi-directional";
  records: number;
  status: "Success" | "Failed" | "Partial";
  details?: string;
}

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const INTEGRATIONS: Integration[] = [
  {
    id: "timesync",
    name: "TimeSync",
    icon: Clock,
    status: "OK",
    description:
      "Approved leave applications automatically overlay attendance rosters and bypass daily punch requirements.",
    lastSync: "5 mins ago",
    todayCount: 45,
    color: "bg-brand-100 text-brand-800",
  },
  {
    id: "payedge",
    name: "PayEdge",
    icon: DollarSign,
    status: "OK",
    description:
      "Syncs unpaid leave for deductions and approved encashments for earnings processing in the payroll cycle.",
    lastSync: "1h ago",
    todayCount: 12,
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "peoplehub",
    name: "PeopleHub",
    icon: Users,
    status: "OK",
    description:
      "Synchronizes employee master data, department hierarchy, and grade levels to determine leave eligibility.",
    lastSync: "3h ago",
    todayCount: 150,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "performpro",
    name: "PerformPro",
    icon: Target,
    status: "Syncing",
    description:
      "Sends absence signals and leave utilization patterns to the performance module for holistic review.",
    lastSync: "Just now",
    todayCount: 8,
    color: "bg-amber-100 text-amber-800",
  },
];

const generateMockLogs = (count = 50): SyncLog[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `SYNC-${1000 + i}`,
    timestamp: `Feb 12, 2025 • ${String(9 + (i % 12)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")} ${i % 2 === 0 ? "AM" : "PM"}`,
    integration: ["TimeSync", "PayEdge", "PeopleHub", "PerformPro"][i % 4],
    direction: i % 3 === 0 ? "Inbound" : i % 3 === 1 ? "Outbound" : "Bi-directional",
    records: Math.floor(Math.random() * 200) + 1,
    status: i === 7 ? "Failed" : i === 15 ? "Partial" : "Success",
    details: `Batch job completed. ${Math.floor(Math.random() * 10)} warnings.`,
  }));

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function LeaveIntegrations() {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>(() => generateMockLogs(50));
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Filter logs by integration name
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => log.integration.toLowerCase().includes(q));
  }, [logs, searchQuery]);

  // Pagination
  const totalEntries = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  // Handlers
  const handleTestConnection = (id: string, name: string) => {
    setSyncingId(id);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Testing connection to ${name}...`,
        success: `Connection to ${name} successful`,
        error: `Connection to ${name} failed`,
      }
    );
    setTimeout(() => setSyncingId(null), 1500);
  };

  const handleDownloadReport = () => {
    const headers = ["Timestamp", "Integration", "Direction", "Records", "Status"];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.integration,
      log.direction,
      log.records,
      log.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded", { description: `${filteredLogs.length} logs exported.` });
  };

  const handleViewLogDetails = (log: SyncLog) => {
    setSelectedLog(log);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">System Integrations</h1>
            <p className="text-sm text-brand-700">
              Manage data flow between LeaveEase and other Flexi HRMS modules.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-gray-200 text-brand-800 hover:bg-brand-100"
          onClick={() => toast.info("Global API Settings", { description: "Configure API keys and webhooks." })}
        >
          <Settings className="h-4 w-4 mr-2" />
          Global API Settings
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS.map((integ) => {
          const isSyncing = syncingId === integ.id;
          return (
            <Card key={integ.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${integ.color}`}>
                      <integ.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-brand-900">{integ.name}</CardTitle>
                      <p className="text-xs text-brand-700 uppercase tracking-wider">
                        Flexi Module Connection
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      integ.status === "OK"
                        ? "default"
                        : integ.status === "Syncing"
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      integ.status === "OK"
                        ? "bg-brand-700 text-white"
                        : integ.status === "Syncing"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        integ.status === "OK"
                          ? "bg-white"
                          : integ.status === "Syncing"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    {integ.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-brand-700 italic">"{integ.description}"</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-brand-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-brand-700 mb-1">Last Sync</p>
                    <p className="text-sm font-semibold text-brand-900 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-brand-700" />
                      {integ.lastSync}
                    </p>
                  </div>
                  <div className="bg-brand-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-brand-700 mb-1">Today's Traffic</p>
                    <p className="text-sm font-semibold text-brand-900 flex items-center gap-1">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-brand-700" />
                      {integ.todayCount} records
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(integ.id, integ.name)}
                    disabled={isSyncing}
                    className="flex-1 border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1 text-amber-500" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfigId(integ.id)}
                    className="flex-1 border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    className="bg-brand-800 hover:bg-brand-900 text-white"
                    onClick={() => toast.info("Go to module", { description: `Navigate to ${integ.name}` })}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sync Logs Section */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-brand-50/30 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Terminal className="h-5 w-5 text-brand-800" />
              </div>
              <div>
                <CardTitle className="text-lg text-brand-900">Synchronization Logs</CardTitle>
                <p className="text-xs text-brand-700">
                  Real‑time audit of system‑to‑system data transfers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                <Input
                  placeholder="Filter by module..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-56 border-gray-200 focus:border-brand-800 text-brand-900"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Integration
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Terminal className="h-10 w-10 text-brand-300 mx-auto mb-2" />
                      <p className="font-medium text-brand-800">No logs found</p>
                      <p className="text-sm text-brand-600">Try adjusting your filter</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-brand-50 transition-colors cursor-pointer"
                      onClick={() => handleViewLogDetails(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-brand-900">
                          {log.timestamp.split("•")[0]}
                        </p>
                        <p className="text-xs text-brand-700">
                          {log.timestamp.split("•")[1]}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-800" />
                          <span className="text-sm font-medium text-brand-900">
                            {log.integration}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-xs border-gray-200 text-brand-800">
                          {log.direction}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono font-semibold text-brand-900">
                          {log.records}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={
                            log.status === "Success"
                              ? "default"
                              : log.status === "Partial"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            log.status === "Success"
                              ? "bg-brand-700 text-white"
                              : log.status === "Partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {log.status === "Success" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLogDetails(log);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedLogs.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-brand-700">
                Showing {(currentPage - 1) * perPage + 1} to{" "}
                {Math.min(currentPage * perPage, totalEntries)} of {totalEntries} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-brand-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
        <div className="border-t border-gray-200 px-6 py-4 bg-brand-50/30 flex items-center justify-between">
          <Button
            variant="link"
            className="text-brand-800 hover:text-brand-900 p-0 h-auto font-medium"
            onClick={() => setIsAuditOpen(true)}
          >
            View Full Audit Trail →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Daily Sync Report
          </Button>
        </div>
      </Card>

      {/* Security Footer */}
      <div className="bg-brand-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-200" />
              <h4 className="text-lg font-bold">Secure Connectivity</h4>
            </div>
            <p className="text-sm text-brand-100 leading-relaxed">
              All module integrations are handled via Flexi's core messaging bus with 256‑bit
              encryption. System‑to‑system credentials are managed by the HQ Security Vault.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center">
              <p className="text-2xl font-bold text-brand-200">99.9%</p>
              <p className="text-xs font-bold uppercase text-brand-300 tracking-wider">
                Uptime Score
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center">
              <p className="text-2xl font-bold text-brand-200">Real‑time</p>
              <p className="text-xs font-bold uppercase text-brand-300 tracking-wider">
                Sync Latency
              </p>
            </div>
          </div>
        </div>
        <Activity className="absolute -bottom-10 -right-10 h-40 w-40 text-white/5" />
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[500px] border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-brand-900">Sync Log Details</DialogTitle>
            <DialogDescription className="text-brand-700">
              {selectedLog?.id} • {selectedLog?.timestamp}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-brand-700">Integration:</div>
                <div className="font-medium text-brand-900">{selectedLog.integration}</div>
                <div className="text-brand-700">Direction:</div>
                <div className="font-medium text-brand-900">{selectedLog.direction}</div>
                <div className="text-brand-700">Records:</div>
                <div className="font-medium text-brand-900">{selectedLog.records}</div>
                <div className="text-brand-700">Status:</div>
                <div>
                  <Badge
                    variant={
                      selectedLog.status === "Success"
                        ? "default"
                        : selectedLog.status === "Partial"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-800 mb-1">Details</p>
                <p className="text-sm text-brand-700 bg-brand-50 p-3 rounded-lg border border-gray-200">
                  {selectedLog.details || "No additional details available."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Audit Modal */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-brand-900">Full Audit Trail</DialogTitle>
            <DialogDescription className="text-brand-700">
              Complete history of synchronization events (last 30 days)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-brand-50"
              >
                <div>
                  <p className="text-sm font-medium text-brand-900">{log.integration}</p>
                  <p className="text-xs text-brand-700">{log.timestamp}</p>
                </div>
                <Badge
                  variant={
                    log.status === "Success"
                      ? "default"
                      : log.status === "Partial"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Config Drawer */}
      <IntegrationConfigDrawer
        isOpen={!!configId}
        onClose={() => setConfigId(null)}
        integrationId={configId || ""}
      />
    </div>
  );
}