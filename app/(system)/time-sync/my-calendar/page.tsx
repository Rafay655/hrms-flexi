"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  User,
  Briefcase,
  MapPin,
  Sun,
  Moon,
  Coffee,
  Eye,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type DayStatus = "present" | "late" | "absent" | "leave" | "holiday" | "short_day" | "half_day" | "weekly_off";

interface CalendarEvent {
  id: string;
  title: string;
  type: "attendance" | "leave" | "holiday" | "shift_swap" | "roster_change" | "regularization";
  status?: DayStatus;
  date: Date;
  time?: string;
  description?: string;
}

interface DayData {
  date: Date;
  status: DayStatus | null;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
}

// ------------------------------------------------------------------
// Mock Data with Pakistani Names
// ------------------------------------------------------------------
const holidays = [
  { date: "2025-03-23", title: "Pakistan Day", type: "holiday" as const },
  { date: "2025-03-31", title: "Eid-ul-Fitr (Tentative)", type: "holiday" as const },
  { date: "2025-04-01", title: "Eid-ul-Fitr (Tentative)", type: "holiday" as const },
];

const leaves = [
  { employee: "Rafay Ahmed", date: "2025-03-28", type: "Annual Leave" },
  { employee: "Yousaf Khan", date: "2025-03-29", type: "Sick Leave" },
  { employee: "Humza Ali", date: "2025-03-30", type: "Casual Leave" },
];

const attendanceData: Record<string, DayStatus> = {
  "2025-03-01": "present",
  "2025-03-02": "present",
  "2025-03-03": "present",
  "2025-03-04": "late",
  "2025-03-05": "present",
  "2025-03-06": "present",
  "2025-03-07": "weekly_off",
  "2025-03-08": "weekly_off",
  "2025-03-09": "present",
  "2025-03-10": "present",
  "2025-03-11": "absent",
  "2025-03-12": "present",
  "2025-03-13": "present",
  "2025-03-14": "half_day",
  "2025-03-15": "weekly_off",
  "2025-03-16": "weekly_off",
  "2025-03-17": "present",
  "2025-03-18": "present",
  "2025-03-19": "present",
  "2025-03-20": "short_day",
  "2025-03-21": "present",
  "2025-03-22": "weekly_off",
  "2025-03-23": "holiday", // Pakistan Day
  "2025-03-24": "present",
  "2025-03-25": "present",
  "2025-03-26": "present",
  "2025-03-27": "present",
  "2025-03-28": "leave", // Rafay's leave
  "2025-03-29": "leave", // Yousaf's leave
  "2025-03-30": "leave", // Humza's leave
  "2025-03-31": "holiday", // Eid-ul-Fitr
};

const shiftSwaps = [
  { id: "1", requester: "Shaban Akhtar", target: "Rafay Ahmed", date: "2025-03-26", status: "pending" },
  { id: "2", requester: "Yousaf Khan", target: "Humza Ali", date: "2025-03-27", status: "approved" },
];

const rosterChanges = [
  { id: "1", employee: "Rafay Ahmed", date: "2025-03-25", from: "Morning", to: "Evening", status: "approved" },
  { id: "2", employee: "Humza Ali", date: "2025-03-28", from: "Evening", to: "Night", status: "pending" },
];

// Helper to generate events for a given day
const getEventsForDate = (date: Date): CalendarEvent[] => {
  const dateStr = date.toISOString().split("T")[0];
  const events: CalendarEvent[] = [];

  // Holiday
  const holiday = holidays.find(h => h.date === dateStr);
  if (holiday) {
    events.push({
      id: `holiday-${dateStr}`,
      title: holiday.title,
      type: "holiday",
      date,
    });
  }

  // Leave
  const leave = leaves.find(l => l.date === dateStr);
  if (leave) {
    events.push({
      id: `leave-${dateStr}`,
      title: `${leave.employee} - ${leave.type}`,
      type: "leave",
      date,
      description: `${leave.employee} is on ${leave.type}`,
    });
  }

  // Shift Swap
  const shiftSwap = shiftSwaps.find(s => s.date === dateStr);
  if (shiftSwap) {
    events.push({
      id: `swap-${dateStr}`,
      title: `Shift Swap: ${shiftSwap.requester} ↔ ${shiftSwap.target}`,
      type: "shift_swap",
      date,
      description: `Status: ${shiftSwap.status}`,
    });
  }

  // Roster Change
  const rosterChange = rosterChanges.find(r => r.date === dateStr);
  if (rosterChange) {
    events.push({
      id: `roster-${dateStr}`,
      title: `Roster Change: ${rosterChange.employee}`,
      type: "roster_change",
      date,
      description: `${rosterChange.from} → ${rosterChange.to}`,
    });
  }

  return events;
};

const getStatusForDate = (date: Date): DayStatus | null => {
  const dateStr = date.toISOString().split("T")[0];
  const status = attendanceData[dateStr];
  if (status) return status;
  // If no attendance data, but there is holiday or leave, return that status
  if (holidays.find(h => h.date === dateStr)) return "holiday";
  if (leaves.find(l => l.date === dateStr)) return "leave";
  return null;
};

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------
const getStatusIcon = (status: DayStatus) => {
  switch (status) {
    case "present": return <CheckCircle2 size={14} className="text-green-600" />;
    case "late": return <AlertCircle size={14} className="text-yellow-600" />;
    case "absent": return <XCircle size={14} className="text-red-600" />;
    case "leave": return <Briefcase size={14} className="text-blue-600" />;
    case "holiday": return <CalendarDays size={14} className="text-purple-600" />;
    case "short_day": return <Clock size={14} className="text-orange-600" />;
    case "half_day": return <Sun size={14} className="text-amber-600" />;
    case "weekly_off": return <Moon size={14} className="text-gray-500" />;
    default: return null;
  }
};

const getStatusColor = (status: DayStatus) => {
  switch (status) {
    case "present": return "bg-green-100 text-green-800 border-green-200";
    case "late": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "absent": return "bg-red-100 text-red-800 border-red-200";
    case "leave": return "bg-blue-100 text-blue-800 border-blue-200";
    case "holiday": return "bg-purple-100 text-purple-800 border-purple-200";
    case "short_day": return "bg-orange-100 text-orange-800 border-orange-200";
    case "half_day": return "bg-amber-100 text-amber-800 border-amber-200";
    case "weekly_off": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-gray-50 text-gray-400 border-gray-200";
  }
};

// ------------------------------------------------------------------
// Day Cell Component
// ------------------------------------------------------------------
function DayCell({ day, onClick }: { day: DayData; onClick: () => void }) {
  const { date, status, events, isCurrentMonth } = day;
  const isToday = new Date().toDateString() === date.toDateString();
  const statusClass = status ? getStatusColor(status) : "bg-white border-gray-100";
  const hasEvents = events.length > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-xl border p-2 transition-all cursor-pointer ${statusClass} ${
        !isCurrentMonth ? "opacity-40" : ""
      } ${isToday ? "ring-2 ring-[#3E3B6F] ring-offset-2" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${isToday ? "text-[#3E3B6F]" : "text-gray-700"}`}>
          {date.getDate()}
        </span>
        {status && getStatusIcon(status)}
      </div>
      {hasEvents && (
        <div className="mt-1 flex flex-wrap gap-1">
          {events.slice(0, 2).map((event, idx) => (
            <div
              key={event.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  event.type === "holiday" ? "#9333ea" :
                  event.type === "leave" ? "#3b82f6" :
                  event.type === "shift_swap" ? "#eab308" :
                  "#f97316",
              }}
            />
          ))}
          {events.length > 2 && (
            <div className="text-[8px] text-gray-400">+{events.length - 2}</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Day Detail Modal
// ------------------------------------------------------------------
function DayDetailModal({ day, onClose }: { day: DayData; onClose: () => void }) {
  const { date, status, events } = day;
  const statusText = status ? status.replace("_", " ").toUpperCase() : "No record";
  const statusColor = status ? getStatusColor(status) : "bg-gray-50 text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XCircle size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className={`rounded-xl border p-3 ${statusColor}`}>
            <div className="flex items-center gap-2">
              {status && getStatusIcon(status)}
              <span className="font-semibold">Status: {statusText}</span>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Events</h4>
              <div className="space-y-2">
                {events.map(event => (
                  <div key={event.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {event.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!status && events.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No events or attendance record for this day.</p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#3E3B6F] py-2 text-sm font-bold text-white hover:bg-[#2C2A4A]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function MyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // start from Sunday
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // end on Saturday

    const days: DayData[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const status = getStatusForDate(date);
      const events = getEventsForDate(date);
      const isCurrentMonth = date.getMonth() === month;
      days.push({ date, status, events, isCurrentMonth });
    }
    return days;
  }, [currentDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Stats for current user (Rafay Ahmed for demo)
  const userStats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const daysInMonth = calendarDays.filter(d => d.isCurrentMonth);
    const present = daysInMonth.filter(d => d.status === "present").length;
    const late = daysInMonth.filter(d => d.status === "late").length;
    const absent = daysInMonth.filter(d => d.status === "absent").length;
    const leave = daysInMonth.filter(d => d.status === "leave").length;
    const holiday = daysInMonth.filter(d => d.status === "holiday").length;
    const weeklyOff = daysInMonth.filter(d => d.status === "weekly_off").length;
    const totalWorkDays = daysInMonth.length - weeklyOff - holiday;
    return { present, late, absent, leave, holiday, weeklyOff, totalWorkDays };
  }, [calendarDays]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const events: CalendarEvent[] = [];
    for (let d = new Date(today); d <= nextWeek; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dayEvents = getEventsForDate(date);
      events.push(...dayEvents);
    }
    return events;
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
    
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">My Calendar</h1>
              <p className="text-sm text-gray-500">Your attendance, leaves, and events at a glance</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToday}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Today
              </button>
              <div className="flex rounded-xl border border-gray-200 bg-white p-1">
                {["month", "week", "list"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      viewMode === mode ? "bg-[#3E3B6F] text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Present" value={userStats.present} icon={CheckCircle2} color="green" />
            <StatCard label="Late" value={userStats.late} icon={AlertCircle} color="yellow" />
            <StatCard label="Absent" value={userStats.absent} icon={XCircle} color="red" />
            <StatCard label="Leave" value={userStats.leave} icon={Briefcase} color="blue" />
            <StatCard label="Holiday" value={userStats.holiday} icon={CalendarDays} color="purple" />
            <StatCard label="Working Days" value={userStats.totalWorkDays} icon={TrendingUp} color="gray" />
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <button onClick={handlePrevMonth} className="rounded-full p-1 hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-semibold text-gray-800">{monthName}</span>
            <button onClick={handleNextMonth} className="rounded-full p-1 hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid (Month View) */}
          {viewMode === "month" && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <DayCell key={idx} day={day} onClick={() => setSelectedDay(day)} />
                ))}
              </div>
            </div>
          )}

          {/* Week View (Simplified) */}
          {viewMode === "week" && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                    {day}
                  </div>
                ))}
                {calendarDays.slice(0, 7).map((day, idx) => (
                  <DayCell key={idx} day={day} onClick={() => setSelectedDay(day)} />
                ))}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="space-y-3">
                {calendarDays.filter(d => d.isCurrentMonth).map(day => {
                  const statusText = day.status ? day.status.replace("_", " ") : "No record";
                  return (
                    <div
                      key={day.date.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {day.events.length > 0 ? `${day.events.length} event(s)` : "No events"}
                        </div>
                      </div>
                      <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusColor(day.status || "present")}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Events (Next 7 Days)</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-400">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="mt-0.5">
                      {event.type === "holiday" && <CalendarDays size={16} className="text-purple-600" />}
                      {event.type === "leave" && <Briefcase size={16} className="text-blue-600" />}
                      {event.type === "shift_swap" && <Users size={16} className="text-yellow-600" />}
                      {event.type === "roster_change" && <Clock size={16} className="text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {event.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {event.time && ` at ${event.time}`}
                      </div>
                      {event.description && <div className="text-xs text-gray-400 mt-1">{event.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />}
      </AnimatePresence>
    </>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-50 text-gray-600",
  }[color];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <div className={`rounded-full p-1.5 ${colorClasses}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}