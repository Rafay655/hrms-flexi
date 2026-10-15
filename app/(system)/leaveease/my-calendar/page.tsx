"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List as ListIcon,
  MapPin,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Bot,
  X,
  Sparkles,
  Filter,
} from "lucide-react";
import { LeaveType, LeaveStatus } from "@/lib/leaveEaseTypes";

interface CalendarEvent {
  id: string;
  type: LeaveType | "Holiday";
  status: LeaveStatus | "FIXED";
  startDate: Date;
  endDate: Date;
  label: string;
  isHalfDay?: boolean;
  location?: string;
  note?: string;
}

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "h1",
    type: "Holiday",
    status: "FIXED",
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 5),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 5),
    label: "Public Holiday",
    note: "Company observed holiday",
  },
  {
    id: "h2",
    type: "Holiday",
    status: "FIXED",
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 14),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 14),
    label: "National Holiday",
    note: "Office closed for all staff",
  },
  {
    id: "l1",
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 10),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 12),
    label: "Family Trip",
    location: "Lahore",
    note: "Approved by reporting manager",
  },
  {
    id: "l2",
    type: LeaveType.SICK,
    status: LeaveStatus.PENDING,
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 18),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth(), 18),
    label: "Doctor Appointment",
    isHalfDay: true,
    location: "Local Clinic",
    note: "Pending manager review",
  },
  {
    id: "l3",
    type: LeaveType.CASUAL,
    status: LeaveStatus.APPROVED,
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 10),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 11),
    label: "Personal Work",
    note: "Short personal leave",
  },
  {
    id: "l4",
    type: LeaveType.UNPAID,
    status: LeaveStatus.REJECTED,
    startDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 21),
    endDate: new Date(CURRENT_YEAR, TODAY.getMonth() + 1, 22),
    label: "Emergency Travel",
    location: "Karachi",
    note: "Rejected due to staffing shortage",
  },
];

type ViewMode = "grid" | "list";
type TypeFilter = "All" | LeaveType | "Holiday";
type StatusFilter = "All" | LeaveStatus | "FIXED";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isDateWithinRange(date: Date, start: Date, end: Date) {
  const d = startOfDay(date).getTime();
  return d >= startOfDay(start).getTime() && d <= endOfDay(end).getTime();
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function eventIntersectsMonth(event: CalendarEvent, month: Date) {
  const monthStart = getMonthStart(month).getTime();
  const monthEnd = endOfDay(getMonthEnd(month)).getTime();
  const eventStart = startOfDay(event.startDate).getTime();
  const eventEnd = endOfDay(event.endDate).getTime();

  return eventEnd >= monthStart && eventStart <= monthEnd;
}

function getTypeClasses(type: CalendarEvent["type"], status: CalendarEvent["status"]) {
  if (type === "Holiday") {
    return {
      solid: "bg-violet-600",
      soft: "bg-violet-50 text-violet-700 border-violet-200",
      dot: "bg-violet-500",
    };
  }

  const isPending = status === LeaveStatus.PENDING;
  switch (type) {
    case LeaveType.ANNUAL:
      return {
        solid: isPending ? "bg-[#5c5490]/60" : "bg-[#443763]",
        soft: "bg-[#443763]/10 text-[#443763] border-[#443763]/20",
        dot: "bg-[#443763]",
      };
    case LeaveType.CASUAL:
      return {
        solid: isPending ? "bg-[#EEC293]/70" : "bg-[#EEC293]",
        soft: "bg-[#EEC293]/10 text-[#8C6239] border-[#EEC293]/20",
        dot: "bg-[#EEC293]",
      };
    case LeaveType.SICK:
      return {
        solid: isPending ? "bg-[#F3AB9D]/70" : "bg-[#F3AB9D]",
        soft: "bg-[#F3AB9D]/10 text-[#9C4F4A] border-[#F3AB9D]/20",
        dot: "bg-[#F3AB9D]",
      };
    case LeaveType.UNPAID:
      return {
        solid: isPending ? "bg-slate-400/70" : "bg-slate-500",
        soft: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-500",
      };
    default:
      return {
        solid: "bg-slate-500",
        soft: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-500",
      };
  }
}

function getStatusClasses(status: CalendarEvent["status"]) {
  switch (status) {
    case LeaveStatus.APPROVED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case LeaveStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case LeaveStatus.REJECTED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case LeaveStatus.CANCELLED:
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "FIXED":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function formatRange(start: Date, end: Date) {
  const startStr = start.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const endStr = end.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (isSameDay(start, end)) return startStr;
  return `${startStr} — ${endStr}`;
}

function countBusinessDaysInMonth(month: Date) {
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  let count = 0;

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    if (!isWeekend(date)) count++;
  }

  return count;
}

function countEventDaysWithinMonth(event: CalendarEvent, month: Date) {
  const monthStart = getMonthStart(month);
  const monthEnd = getMonthEnd(month);

  const start = event.startDate > monthStart ? event.startDate : monthStart;
  const end = event.endDate < monthEnd ? event.endDate : monthEnd;

  let count = 0;

  for (
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    cursor <= end;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  ) {
    if (!isWeekend(cursor)) {
      count += event.isHalfDay && isSameDay(start, end) ? 0.5 : 1;
    }
  }

  return count;
}

function CalendarDetailDrawer({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;

  const typeClasses = getTypeClasses(event.type, event.status);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-[#111827]/35 backdrop-blur-[2px]" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="bg-gradient-to-br from-[#322E53] via-[#322E53] to-[#5c5490] px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Calendar Event
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight">{event.label}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${typeClasses.soft}`}
                  >
                    {event.type}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Event Details
              </h4>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Duration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatRange(event.startDate, event.endDate)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Half Day
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {event.isHalfDay ? "Yes" : "No"}
                  </p>
                </div>

                {event.location && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Location
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {event.location}
                    </div>
                  </div>
                )}

                {event.note && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Notes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{event.note}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-[#443763]" />
                <div>
                  <h4 className="text-sm font-semibold text-[#322E53]">Smart Insight</h4>
                  <p className="mt-1 text-sm text-gray-700">
                    {event.type === "Holiday"
                      ? "This is a fixed holiday event and does not require any action from you."
                      : event.status === LeaveStatus.PENDING
                      ? "This leave is still pending review. Keep backup coverage ready until final approval."
                      : event.status === LeaveStatus.APPROVED
                      ? "This leave is approved and already reflected in your calendar timeline."
                      : "You may want to review the policy or resubmit with improved details if needed."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#443763] to-[#5c5490] text-sm font-semibold text-white transition hover:opacity-95"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyLeaveCalendar() {
  const [view, setView] = useState<ViewMode>("grid");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const allTypes: TypeFilter[] = [
    "All",
    LeaveType.ANNUAL,
    LeaveType.CASUAL,
    LeaveType.SICK,
    LeaveType.UNPAID,
    "Holiday",
  ];

  const allStatuses: StatusFilter[] = [
    "All",
    "FIXED",
    LeaveStatus.APPROVED,
    LeaveStatus.PENDING,
    LeaveStatus.REJECTED,
    LeaveStatus.CANCELLED,
  ];

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((event) => {
      const matchType = typeFilter === "All" || event.type === typeFilter;
      const matchStatus = statusFilter === "All" || event.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [typeFilter, statusFilter]);

  const currentMonthEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => eventIntersectsMonth(event, currentMonth))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [filteredEvents, currentMonth]);

  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const nextMonthEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => eventIntersectsMonth(event, nextMonth))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [filteredEvents, nextMonth]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => endOfDay(event.endDate) >= startOfDay(TODAY))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 4);
  }, [filteredEvents]);

  const monthSummary = useMemo(() => {
    const workingDays = countBusinessDaysInMonth(currentMonth);

    const publicHolidays = currentMonthEvents.filter(
      (event) => event.type === "Holiday"
    ).length;

    const approvedLeaveDays = currentMonthEvents
      .filter(
        (event) => event.type !== "Holiday" && event.status === LeaveStatus.APPROVED
      )
      .reduce((sum, event) => sum + countEventDaysWithinMonth(event, currentMonth), 0);

    const pendingLeaveDays = currentMonthEvents
      .filter(
        (event) => event.type !== "Holiday" && event.status === LeaveStatus.PENDING
      )
      .reduce((sum, event) => sum + countEventDaysWithinMonth(event, currentMonth), 0);

    const netWorking = Math.max(0, workingDays - publicHolidays - approvedLeaveDays);

    return {
      workingDays,
      publicHolidays,
      approvedLeaveDays,
      pendingLeaveDays,
      netWorking,
    };
  }, [currentMonth, currentMonthEvents]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(
        <div
          key={`pad-${i}`}
          className="min-h-[128px] border-b border-r border-gray-100 bg-gray-50/60"
        />
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const weekend = isWeekend(date);
      const isTodayCell = isSameDay(date, TODAY);

      const dayEvents = currentMonthEvents.filter((event) =>
        isDateWithinRange(date, event.startDate, event.endDate)
      );

      cells.push(
        <div
          key={d}
          className={`group relative min-h-[128px] border-b border-r border-gray-100 p-2.5 transition ${
            weekend ? "bg-gray-50/70" : "bg-white hover:bg-gray-50/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                isTodayCell
                  ? "bg-[#443763] text-white"
                  : weekend
                  ? "text-gray-400"
                  : "text-gray-700"
              }`}
            >
              {d}
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            {dayEvents.slice(0, 3).map((event) => {
              const typeClasses = getTypeClasses(event.type, event.status);

              return (
                <button
                  key={`${event.id}-${d}`}
                  onClick={() => setSelectedEvent(event)}
                  title={`${event.label} (${event.type})`}
                  className={`flex ${
                    event.isHalfDay ? "w-[52%]" : "w-full"
                  } items-center gap-1 rounded-md px-2 py-1 text-left text-[10px] font-semibold text-white transition hover:opacity-90 ${
                    typeClasses.solid
                  } ${event.status === LeaveStatus.PENDING ? "opacity-75" : ""}`}
                >
                  <span className="truncate">
                    {event.type === "Holiday" ? "⭐ " : ""}
                    {event.label}
                  </span>
                </button>
              );
            })}

            {dayEvents.length > 3 && (
              <div className="px-1 text-[10px] font-semibold text-gray-400">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-r border-gray-200 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>
    );
  };

  const renderMonthListBlock = (monthDate: Date, events: CalendarEvent[]) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="border-l-4 border-[#443763] pl-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h4>
          <span className="text-xs font-medium text-gray-400">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
            No events for this month with the current filters.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const typeClasses = getTypeClasses(event.type, event.status);

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[#443763]/20 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-[64px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        {event.startDate.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-xl font-bold text-[#443763]">{event.startDate.getDate()}</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-sm font-semibold text-gray-900">{event.label}</h5>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${typeClasses.soft}`}
                        >
                          {event.type}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        {formatRange(event.startDate, event.endDate)}
                      </p>

                      {event.note && <p className="mt-1 text-xs text-gray-400">{event.note}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="min-h-screen bg-white p-4 lg:p-8"
        style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
      >
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#322E53]">Leave Calendar</h2>
              <p className="mt-1 text-sm text-gray-600">
                Plan your time off, review upcoming leave, and track public holidays.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-lg px-3 py-2 transition ${
                    view === "grid"
                      ? "bg-[#443763] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`rounded-lg px-3 py-2 transition ${
                    view === "list"
                      ? "bg-[#443763] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="min-w-[170px] px-3 text-center text-sm font-semibold text-gray-700">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#443763] transition hover:bg-gray-50"
              >
                Today
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#443763]/10 text-[#443763]">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#322E53]">Calendar Filters</p>
                  <p className="text-xs text-gray-500">Refine by leave type and status</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#443763]"
                >
                  {allTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "All" ? "All Types" : type}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#443763]"
                >
                  {allStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-6">
              {view === "grid" ? (
                <>
                  {renderCalendar()}

                  <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Legend
                    </span>

                    {[
                      { label: "Annual", cls: "bg-[#443763]" },
                      { label: "Casual", cls: "bg-[#EEC293]" },
                      { label: "Sick", cls: "bg-[#F3AB9D]" },
                      { label: "Unpaid", cls: "bg-slate-500" },
                      { label: "Holiday", cls: "bg-violet-600" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded ${item.cls}`} />
                        <span className="text-xs font-medium text-gray-600">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  {renderMonthListBlock(currentMonth, currentMonthEvents)}
                  {renderMonthListBlock(nextMonth, nextMonthEvents)}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Month Summary
                </h4>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Working Days</span>
                    <span className="font-semibold text-gray-900">{monthSummary.workingDays}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Approved Leave</span>
                    <span className="font-semibold text-[#443763]">
                      {monthSummary.approvedLeaveDays}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Pending Leave</span>
                    <span className="font-semibold text-amber-600">
                      {monthSummary.pendingLeaveDays}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Public Holidays</span>
                    <span className="font-semibold text-violet-600">
                      {monthSummary.publicHolidays}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-800">Net Working</span>
                    <span className="font-bold text-[#322E53]">{monthSummary.netWorking}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Upcoming Events
                </h4>

                <div className="mt-5 space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => {
                      const typeClasses = getTypeClasses(event.type, event.status);

                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="flex w-full gap-3 text-left"
                        >
                          <div className={`w-1 shrink-0 rounded-full ${typeClasses.dot}`} />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{event.label}</p>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              {event.startDate.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No upcoming events found.</p>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#322E53] via-[#322E53] to-[#5c5490] p-7 text-white shadow-xl">
                <Bot className="absolute bottom-[-10px] right-[-10px] opacity-10" size={100} />
                <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-semibold leading-tight">Plan with AI</h4>
                  <p className="text-sm text-white/70">
                    Check policy rules, coverage risks, and timing guidance before your next leave.
                  </p>
                  <button className="h-11 w-full rounded-xl bg-[#E8D5A3] text-sm font-semibold text-[#3E3B6F] transition hover:bg-white">
                    Ask Policy Copilot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalendarDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
}