// app/flexi-hq/notifications/logs/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  History,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Activity,
  Mail,
  Smartphone,
  Bell,
  MessageSquare,
  RefreshCcw,
  MoreVertical,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

type DeliveryStatus = "DELIVERED" | "FAILED" | "PENDING" | "BOUNCED";
type Channel = "EMAIL" | "PUSH" | "SMS" | "IN_APP";

interface DeliveryLog {
  id: string;
  timestamp: string;
  event: string;
  recipient: { name: string; email: string };
  channel: Channel;
  status: DeliveryStatus;
  provider: string;
  payload?: Record<string, any>; // for view details
}

const STATUS_UI: Record<
  DeliveryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DELIVERED: { label: "Delivered", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  PENDING: { label: "Pending", variant: "secondary" },
  BOUNCED: { label: "Bounced", variant: "outline" },
};

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  PUSH: <Smartphone className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  IN_APP: <Bell className="h-3.5 w-3.5" />,
};

const generateMockLogs = (count = 100): DeliveryLog[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `LOG-${9000 + i}`,
    timestamp: `2025-01-15 ${String(Math.floor(i / 60) + 8).padStart(2, "0")}:${String(i % 60).padStart(2, "0")} ${i % 2 === 0 ? "AM" : "PM"}`,
    event: ["punch.success", "anomaly.late", "ot.approved", "roster.published"][i % 4],
    recipient: {
      name: ["Sarah Chen", "Ahmed Khan", "James Wilson", "Priya Das"][i % 4],
      email: ["s.chen@flexi.com", "a.khan@flexi.com", "j.wilson@flexi.com", "p.das@flexi.com"][i % 4],
    },
    channel: (["EMAIL", "PUSH", "SMS", "IN_APP"] as Channel[])[i % 4],
    status: i % 15 === 0 ? "FAILED" : i % 25 === 0 ? "BOUNCED" : i % 30 === 0 ? "PENDING" : "DELIVERED",
    provider: i % 4 === 0 ? "SendGrid" : i % 4 === 1 ? "Firebase" : i % 4 === 2 ? "Twilio" : "Internal",
    payload: {
      subject: "Attendance Update",
      template: "punch_success",
      variables: { employee_name: "John Doe", time: "09:00 AM" },
    },
  }));

// ----------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function NotificationDeliveryLogs() {
  const [logs, setLogs] = useState<DeliveryLog[]>(() => generateMockLogs(100));
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Filter logs based on search and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.recipient.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.event.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, debouncedSearch, statusFilter]);

  // Pagination
  const totalEntries = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  // Stats computed from current filtered logs
  const stats = useMemo(() => {
    const delivered = filteredLogs.filter((l) => l.status === "DELIVERED").length;
    const failed = filteredLogs.filter((l) => l.status === "FAILED").length;
    const successRate =
      filteredLogs.length > 0
        ? ((delivered / filteredLogs.length) * 100).toFixed(1)
        : "0.0";
    return { delivered, failed, successRate };
  }, [filteredLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, perPage]);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLogs(generateMockLogs(100));
      setIsRefreshing(false);
      toast.success("Logs refreshed", { description: "Latest delivery data loaded." });
    }, 600);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "Event", "Recipient Name", "Recipient Email", "Channel", "Provider", "Status"];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp,
      log.event,
      log.recipient.name,
      log.recipient.email,
      log.channel,
      log.provider,
      log.status,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notification_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started", { description: `${filteredLogs.length} logs exported.` });
  };

  const handleRetry = (log: DeliveryLog) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Retrying ${log.id}...`,
        success: `Retry initiated for ${log.id}`,
        error: "Retry failed",
      }
    );
    // In a real app, you'd call an API endpoint
  };

  const handleViewDetails = (log: DeliveryLog) => {
    setSelectedLog(log);
    setIsViewOpen(true);
  };

  return (
    <div className="p-6 bg-white min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Delivery Logs</h1>
            <p className="text-sm text-brand-700">
              Real‑time audit trail for all system notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-brand-800 hover:bg-brand-900 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                Success Rate
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-brand-900">{stats.successRate}%</p>
                <Badge className="bg-brand-100 text-brand-800">+0.2%</Badge>
              </div>
            </div>
            <div className="p-3 bg-brand-100 text-brand-800 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                Failed (Last 24h)
              </p>
              <p className="text-3xl font-bold text-brand-900">{stats.failed}</p>
            </div>
            <div className="p-3 bg-brand-600/10 text-brand-600 rounded-xl">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                Avg. Latency
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-brand-900">1.2s</p>
                <span className="text-xs text-brand-700">E2E</span>
              </div>
            </div>
            <div className="p-3 bg-brand-100 text-brand-800 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
          <Input
            placeholder="Search by recipient, event, or log ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-700">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DeliveryStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px] border-gray-200 text-brand-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="BOUNCED">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-50 border-b border-gray-200">
              <tr className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Timestamp</th>
                <th className="px-6 py-4 text-left">Event</th>
                <th className="px-6 py-4 text-left">Recipient</th>
                <th className="px-6 py-4 text-left">Channel</th>
                <th className="px-6 py-4 text-left">Provider</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <History className="h-10 w-10 text-brand-300" />
                      <p className="font-medium text-brand-800">No logs found</p>
                      <p className="text-sm text-brand-600">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-brand-900">{log.timestamp}</span>
                        <span className="text-xs text-brand-700">{log.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-xs border-brand-200 text-brand-800">
                        {log.event}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-brand-900">{log.recipient.name}</span>
                        <span className="text-xs text-brand-700">{log.recipient.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-brand-100 rounded-md text-brand-800">
                          {CHANNEL_ICONS[log.channel]}
                        </div>
                        <span className="text-xs font-medium text-brand-800">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-brand-700">{log.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_UI[log.status].variant} className="text-xs">
                        {STATUS_UI[log.status].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {log.status === "FAILED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                            onClick={() => handleRetry(log)}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                              View Payload
                            </DropdownMenuItem>
                            {log.status === "FAILED" && (
                              <DropdownMenuItem onClick={() => handleRetry(log)}>
                                Retry Delivery
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
              Showing <span className="font-semibold text-brand-900">{(currentPage - 1) * perPage + 1}</span> to{" "}
              <span className="font-semibold text-brand-900">
                {Math.min(currentPage * perPage, totalEntries)}
              </span>{" "}
              of <span className="font-semibold text-brand-900">{totalEntries}</span> logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
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
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* View Payload Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px] border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-brand-900">Log Details</DialogTitle>
            <DialogDescription className="text-brand-700">
              Full payload and metadata for {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-brand-700">Event:</div>
                <div className="font-medium text-brand-900">{selectedLog.event}</div>
                <div className="text-brand-700">Recipient:</div>
                <div className="font-medium text-brand-900">
                  {selectedLog.recipient.name} ({selectedLog.recipient.email})
                </div>
                <div className="text-brand-700">Channel:</div>
                <div className="font-medium text-brand-900">{selectedLog.channel}</div>
                <div className="text-brand-700">Provider:</div>
                <div className="font-medium text-brand-900">{selectedLog.provider}</div>
                <div className="text-brand-700">Status:</div>
                <div>
                  <Badge variant={STATUS_UI[selectedLog.status].variant}>
                    {STATUS_UI[selectedLog.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-800 mb-2">Payload</p>
                <pre className="bg-brand-50 p-4 rounded-lg text-xs overflow-auto max-h-64 border border-gray-200">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer note */}
      <div className="text-xs text-brand-700 text-center py-2">
        <Info className="inline h-3 w-3 mr-1" />
        Logs are retained for 30 days. Delivery attempts are logged in real time.
      </div>
    </div>
  );
}