"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock3,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Send,
  Wallet,
  FileText,
  Bell,
  Eye,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PayrollEventStatus =
  | "Scheduled"
  | "In Progress"
  | "At Risk"
  | "Completed"
  | "Locked";

type PayrollEventType =
  | "Period Open"
  | "Data Sync"
  | "Validation"
  | "Exceptions"
  | "Review"
  | "Approval"
  | "Disbursement"
  | "Publish"
  | "Compliance"
  | "Custom";

type CalendarView = "month" | "agenda";

interface PayrollCalendarEvent {
  id: string;
  title: string;
  type: PayrollEventType;
  status: PayrollEventStatus;
  group: string;
  owner: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  timeLabel: string;
  employees: number;
  notes: string;
}

const PAYROLL_GROUPS = [
  "Islamabad Corporate",
  "Karachi Operations",
  "Executive Management",
  "Sales Commission Group",
  "Fixed Term Contractors",
];

const EVENT_TYPES: PayrollEventType[] = [
  "Period Open",
  "Data Sync",
  "Validation",
  "Exceptions",
  "Review",
  "Approval",
  "Disbursement",
  "Publish",
  "Compliance",
  "Custom",
];

const STATUS_OPTIONS: PayrollEventStatus[] = [
  "Scheduled",
  "In Progress",
  "At Risk",
  "Completed",
  "Locked",
];

const INITIAL_EVENTS: PayrollCalendarEvent[] = [
  {
    id: "EV-001",
    title: "January Payroll Window Opens",
    type: "Period Open",
    status: "Completed",
    group: "Islamabad Corporate",
    owner: "Payroll Officer",
    startDate: "2026-04-01",
    dueDate: "2026-04-01",
    timeLabel: "09:00 AM",
    employees: 145,
    notes: "Open payroll window and allow adjustments for the monthly cycle.",
  },
  {
    id: "EV-002",
    title: "Attendance & Leave Sync",
    type: "Data Sync",
    status: "Completed",
    group: "Islamabad Corporate",
    owner: "System Sync",
    startDate: "2026-04-02",
    dueDate: "2026-04-02",
    timeLabel: "10:00 AM",
    employees: 145,
    notes: "Sync attendance, OT, and leave balances from integrated systems.",
  },
  {
    id: "EV-003",
    title: "Karachi Payroll Data Ingestion",
    type: "Data Sync",
    status: "In Progress",
    group: "Karachi Operations",
    owner: "Payroll Officer",
    startDate: "2026-04-03",
    dueDate: "2026-04-03",
    timeLabel: "11:30 AM",
    employees: 280,
    notes: "Ingest operational attendance and contractor adjustments.",
  },
  {
    id: "EV-004",
    title: "Validation Run",
    type: "Validation",
    status: "Scheduled",
    group: "Islamabad Corporate",
    owner: "Payroll Manager",
    startDate: "2026-04-04",
    dueDate: "2026-04-04",
    timeLabel: "02:00 PM",
    employees: 145,
    notes: "Run all tax, deduction, joiner, and exit validations.",
  },
  {
    id: "EV-005",
    title: "Resolve Payroll Exceptions",
    type: "Exceptions",
    status: "At Risk",
    group: "Karachi Operations",
    owner: "HR Manager",
    startDate: "2026-04-05",
    dueDate: "2026-04-06",
    timeLabel: "03:00 PM",
    employees: 280,
    notes: "Resolve bank mapping issues, negative net salary, and loan edge cases.",
  },
  {
    id: "EV-006",
    title: "Department Review",
    type: "Review",
    status: "Scheduled",
    group: "Executive Management",
    owner: "Department Head",
    startDate: "2026-04-07",
    dueDate: "2026-04-07",
    timeLabel: "12:00 PM",
    employees: 12,
    notes: "Executive payroll review with final adjustment confirmation.",
  },
  {
    id: "EV-007",
    title: "Finance Approval",
    type: "Approval",
    status: "Scheduled",
    group: "Islamabad Corporate",
    owner: "Finance Head",
    startDate: "2026-04-09",
    dueDate: "2026-04-09",
    timeLabel: "04:00 PM",
    employees: 145,
    notes: "Finance sign-off before disbursement file generation.",
  },
  {
    id: "EV-008",
    title: "Bank Disbursement",
    type: "Disbursement",
    status: "Locked",
    group: "Islamabad Corporate",
    owner: "Treasury",
    startDate: "2026-04-10",
    dueDate: "2026-04-10",
    timeLabel: "09:30 AM",
    employees: 145,
    notes: "Bank advice shared and payroll file locked for disbursement.",
  },
  {
    id: "EV-009",
    title: "Payslip Publication",
    type: "Publish",
    status: "Scheduled",
    group: "Islamabad Corporate",
    owner: "Payroll Officer",
    startDate: "2026-04-11",
    dueDate: "2026-04-11",
    timeLabel: "05:00 PM",
    employees: 145,
    notes: "Publish payslips on ESS and notify employees.",
  },
  {
    id: "EV-010",
    title: "FBR Annex-C Review",
    type: "Compliance",
    status: "Scheduled",
    group: "Karachi Operations",
    owner: "Compliance Officer",
    startDate: "2026-04-14",
    dueDate: "2026-04-14",
    timeLabel: "01:00 PM",
    employees: 280,
    notes: "Review statutory output before monthly closure.",
  },
];

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toYmd(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return toYmd(a) === toYmd(b);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getStatusBadgeClass(status: PayrollEventStatus) {
  switch (status) {
    case "Scheduled":
      return "border-gray-200 bg-white text-brand-800 hover:bg-white";
    case "In Progress":
      return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50";
    case "At Risk":
      return "border-red-200 bg-red-50 text-red-700 hover:bg-red-50";
    case "Completed":
      return "border-green-200 bg-green-50 text-green-700 hover:bg-green-50";
    case "Locked":
      return "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50";
    default:
      return "border-gray-200 bg-white text-brand-800 hover:bg-white";
  }
}

function getEventStripeClass(type: PayrollEventType) {
  switch (type) {
    case "Period Open":
      return "bg-brand-800";
    case "Data Sync":
      return "bg-blue-600";
    case "Validation":
      return "bg-amber-500";
    case "Exceptions":
      return "bg-red-500";
    case "Review":
      return "bg-cyan-600";
    case "Approval":
      return "bg-emerald-600";
    case "Disbursement":
      return "bg-purple-600";
    case "Publish":
      return "bg-indigo-600";
    case "Compliance":
      return "bg-pink-600";
    default:
      return "bg-gray-600";
  }
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-700">
      <span className="font-semibold text-brand-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export default function PayrollCalendarPage() {
  const [events, setEvents] = useState<PayrollCalendarEvent[]>(INITIAL_EVENTS);
  const [view, setView] = useState<CalendarView>("month");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 3, 1));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Custom" as PayrollEventType,
    status: "Scheduled" as PayrollEventStatus,
    group: PAYROLL_GROUPS[0],
    owner: "Payroll Officer",
    startDate: toYmd(new Date(2026, 3, 1)),
    dueDate: toYmd(new Date(2026, 3, 1)),
    timeLabel: "09:00 AM",
    employees: 0,
    notes: "",
  });

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.group.toLowerCase().includes(q) ||
        event.type.toLowerCase().includes(q) ||
        event.owner.toLowerCase().includes(q);
      const matchesGroup = groupFilter === "all" ? true : event.group === groupFilter;
      const matchesStatus = statusFilter === "all" ? true : event.status === statusFilter;
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [events, search, groupFilter, statusFilter]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, PayrollCalendarEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!map[event.startDate]) map[event.startDate] = [];
      map[event.startDate].push(event);
    });
    return map;
  }, [filteredEvents]);

  const selectedDateKey = toYmd(selectedDate);
  const selectedDateEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.startDate === selectedDateKey)
      .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  }, [filteredEvents, selectedDateKey]);

  const selectedEvent = useMemo(() => {
    return filteredEvents.find((event) => event.id === selectedEventId) || null;
  }, [filteredEvents, selectedEventId]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days: Date[] = [];
    let cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [currentMonth]);

  const stats = useMemo(() => {
    return {
      total: filteredEvents.length,
      completed: filteredEvents.filter((e) => e.status === "Completed").length,
      risk: filteredEvents.filter((e) => e.status === "At Risk").length,
      inProgress: filteredEvents.filter((e) => e.status === "In Progress").length,
    };
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => {
        if (a.startDate === b.startDate) return a.timeLabel.localeCompare(b.timeLabel);
        return a.startDate.localeCompare(b.startDate);
      })
      .slice(0, 5);
  }, [filteredEvents]);

  const handleCreate = () => {
    if (!form.title.trim()) {
      alert("Milestone title is required.");
      return;
    }
    const newEvent: PayrollCalendarEvent = {
      id: `EV-${Date.now()}`,
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      group: form.group,
      owner: form.owner.trim() || "Payroll Officer",
      startDate: form.startDate,
      dueDate: form.dueDate,
      timeLabel: form.timeLabel,
      employees: Number(form.employees || 0),
      notes: form.notes.trim(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setSelectedDate(new Date(form.startDate));
    setSelectedEventId(newEvent.id);
    setCreateOpen(false);
    setForm({
      title: "",
      type: "Custom",
      status: "Scheduled",
      group: PAYROLL_GROUPS[0],
      owner: "Payroll Officer",
      startDate: form.startDate,
      dueDate: form.startDate,
      timeLabel: "09:00 AM",
      employees: 0,
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-brand-900">
                    Payroll Calendar
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-sm text-brand-700">
                    Plan payroll cycles, approvals, compliance tasks, and disbursement milestones
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={view === "month" ? "default" : "outline"}
                  onClick={() => setView("month")}
                  className={
                    view === "month"
                      ? "bg-brand-800 text-white hover:bg-brand-900"
                      : "border-gray-200 text-brand-800 hover:bg-brand-100"
                  }
                >
                  Month View
                </Button>
                <Button
                  variant={view === "agenda" ? "default" : "outline"}
                  onClick={() => setView("agenda")}
                  className={
                    view === "agenda"
                      ? "bg-brand-800 text-white hover:bg-brand-900"
                      : "border-gray-200 text-brand-800 hover:bg-brand-100"
                  }
                >
                  Agenda View
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-brand-800 text-white hover:bg-brand-900"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search + filters + stats */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  placeholder="Search by milestone, group, type, owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-gray-200 pl-10 text-brand-900"
                />
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-2">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <Building2 className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {PAYROLL_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {filteredEvents.length}
                  </span>
                  <span className="text-brand-700"> payroll milestones</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatPill label="Total" value={stats.total} />
                  <div className="h-3 w-px bg-brand-300" />
                  <StatPill label="Completed" value={stats.completed} />
                  <div className="h-3 w-px bg-brand-300" />
                  <StatPill label="In Progress" value={stats.inProgress} />
                  <div className="h-3 w-px bg-brand-300" />
                  <StatPill label="At Risk" value={stats.risk} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Main area */}
          <div className="xl:col-span-8">
            <Card className="overflow-hidden border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[180px] text-center text-base font-semibold text-brand-900">
                      {formatMonthLabel(currentMonth)}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                      setSelectedDate(today);
                    }}
                    className="border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    Today
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {view === "month" ? (
                  <div className="overflow-x-auto">
                    <div className="grid min-w-[900px] grid-cols-7 border-b border-gray-200 bg-white">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                          key={day}
                          className="border-r border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-700 last:border-r-0"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid min-w-[900px] grid-cols-7">
                      {monthDays.map((day) => {
                        const dayKey = toYmd(day);
                        const dayEvents = eventsByDate[dayKey] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                          <button
                            key={dayKey}
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedEventId(dayEvents[0]?.id ?? null);
                            }}
                            className={`min-h-[140px] border-b border-r border-gray-200 p-3 text-left align-top transition-colors last:border-r-0 ${
                              isSelected ? "bg-brand-100" : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span
                                className={`text-sm font-semibold ${
                                  isCurrentMonth ? "text-brand-900" : "text-gray-400"
                                }`}
                              >
                                {day.getDate()}
                              </span>
                              {dayEvents.length > 0 ? (
                                <span className="rounded-full bg-brand-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  {dayEvents.length}
                                </span>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  className="overflow-hidden rounded-md border border-gray-200 bg-white"
                                >
                                  <div className={`h-1 ${getEventStripeClass(event.type)}`} />
                                  <div className="px-2 py-1.5">
                                    <div className="truncate text-[11px] font-semibold text-brand-900">
                                      {event.title}
                                    </div>
                                    <div className="mt-0.5 truncate text-[10px] text-brand-700">
                                      {event.timeLabel}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {dayEvents.length > 3 ? (
                                <div className="text-[11px] font-semibold text-brand-700">
                                  +{dayEvents.length - 3} more
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredEvents.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <CalendarDays className="h-6 w-6 text-brand-700" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No milestones found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your filters or add a new milestone.
                        </p>
                      </div>
                    ) : (
                      filteredEvents
                        .sort((a, b) =>
                          a.startDate === b.startDate
                            ? a.timeLabel.localeCompare(b.timeLabel)
                            : a.startDate.localeCompare(b.startDate)
                        )
                        .map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setSelectedDate(new Date(event.startDate));
                              setSelectedEventId(event.id);
                            }}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1 h-10 w-1 rounded-full ${getEventStripeClass(
                                  event.type
                                )}`}
                              />
                              <div>
                                <div className="text-sm font-semibold text-brand-900">
                                  {event.title}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-700">
                                  <span>{event.startDate}</span>
                                  <span>•</span>
                                  <span>{event.timeLabel}</span>
                                  <span>•</span>
                                  <span>{event.group}</span>
                                </div>
                              </div>
                            </div>
                            <StatusBadge status={event.status} />
                          </button>
                        ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side panel */}
          <div className="space-y-4 xl:col-span-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-brand-900">
                  Selected Day
                </CardTitle>
                <CardDescription className="text-sm text-brand-700">
                  {formatDayLabel(selectedDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {selectedDateEvents.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-brand-700">
                    No payroll activities planned for this date.
                  </div>
                ) : (
                  selectedDateEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        selectedEventId === event.id
                          ? "border-brand-800 bg-brand-100"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-brand-900">
                          {event.title}
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-700">
                        <span>{event.type}</span>
                        <span>•</span>
                        <span>{event.timeLabel}</span>
                        <span>•</span>
                        <span>{event.group}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-brand-900">
                  Milestone Detail
                </CardTitle>
                <CardDescription className="text-sm text-brand-700">
                  Full details for the selected payroll activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {selectedEvent ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-brand-900">
                            {selectedEvent.title}
                          </h4>
                          <p className="mt-1 text-sm text-brand-700">
                            {selectedEvent.notes || "No additional notes added."}
                          </p>
                        </div>
                        <StatusBadge status={selectedEvent.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.type}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Group
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.group}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Owner
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.owner}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Employees
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.employees}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Start Date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.startDate}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Due Date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedEvent.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                        <Bell className="h-4 w-4 text-brand-700" />
                        Suggested reminders
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="border-gray-200 bg-white text-[11px] font-semibold text-brand-700 hover:bg-white"
                        >
                          1 day before
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-gray-200 bg-white text-[11px] font-semibold text-brand-700 hover:bg-white"
                        >
                          Same day morning
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-gray-200 bg-white text-[11px] font-semibold text-brand-700 hover:bg-white"
                        >
                          Escalate if at risk
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-brand-700">
                    Select a milestone to view details.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-brand-900">
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-sm text-brand-700">
                  Next important payroll activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <div
                      className={`mt-1 h-8 w-1 rounded-full ${getEventStripeClass(
                        event.type
                      )}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-brand-900">
                        {event.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-brand-700">
                        <span>{event.startDate}</span>
                        <span>•</span>
                        <span>{event.timeLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-brand-800 bg-brand-800 text-white shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Cycle Snapshot</h3>
                    <p className="text-sm text-white/80">
                      Monthly payroll execution overview
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Open Activities
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {
                        filteredEvents.filter(
                          (e) => !["Completed", "Locked"].includes(e.status)
                        ).length
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Completed
                    </p>
                    <p className="mt-1 text-lg font-semibold">{stats.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      At Risk
                    </p>
                    <p className="mt-1 text-lg font-semibold">{stats.risk}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Groups
                    </p>
                    <p className="mt-1 text-lg font-semibold">{PAYROLL_GROUPS.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden border border-gray-200 bg-white p-0">
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <h3 className="text-base font-semibold text-brand-900">
              Add Payroll Milestone
            </h3>
            <p className="mt-1 text-sm text-brand-700">
              Create a new payroll activity, deadline, or compliance checkpoint
            </p>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Milestone Title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Finance Approval for April Payroll"
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Type
                </label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as PayrollEventType }))
                  }
                >
                  <SelectTrigger className="border-gray-200 text-brand-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as PayrollEventStatus }))
                  }
                >
                  <SelectTrigger className="border-gray-200 text-brand-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Payroll Group
                </label>
                <Select
                  value={form.group}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, group: value }))}
                >
                  <SelectTrigger className="border-gray-200 text-brand-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYROLL_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Owner
                </label>
                <Input
                  value={form.owner}
                  onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Time
                </label>
                <Input
                  value={form.timeLabel}
                  onChange={(e) => setForm((prev) => ({ ...prev, timeLabel: e.target.value }))}
                  placeholder="e.g. 02:00 PM"
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Employees
                </label>
                <Input
                  type="number"
                  value={form.employees}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, employees: Number(e.target.value || 0) }))
                  }
                  className="border-gray-200 text-brand-900"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Notes
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add context, dependencies, or compliance notes..."
                  className="min-h-[110px] border-gray-200 text-brand-900"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-6 pb-5">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-brand-800 text-white hover:bg-brand-900">
              Create Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: PayrollEventStatus }) {
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold ${getStatusBadgeClass(status)}`}
    >
      {status}
    </Badge>
  );
}

