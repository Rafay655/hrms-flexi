"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Sun,
  Moon,
  Coffee,
  Zap,
  MapPin,
  Users,
  TrendingUp,
  X,
  Eye,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type ShiftType = "Morning" | "Evening" | "Night" | "General" | "Off";

interface Shift {
  id: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  location: string;
  breakStart?: string;
  breakEnd?: string;
  overtimeHours?: number;
}

interface ScheduleDay {
  date: Date;
  shift: Shift | null;
  notes?: string;
  isToday: boolean;
}

// ------------------------------------------------------------------
// Mock Data with Pakistani Names
// ------------------------------------------------------------------
const shifts: Record<ShiftType, Shift> = {
  Morning: {
    id: "morning",
    type: "Morning",
    startTime: "09:00",
    endTime: "18:00",
    location: "Head Office - IT Floor",
    breakStart: "13:00",
    breakEnd: "14:00",
    overtimeHours: 0,
  },
  Evening: {
    id: "evening",
    type: "Evening",
    startTime: "14:00",
    endTime: "23:00",
    location: "Head Office - IT Floor",
    breakStart: "18:00",
    breakEnd: "19:00",
    overtimeHours: 0,
  },
  Night: {
    id: "night",
    type: "Night",
    startTime: "23:00",
    endTime: "08:00",
    location: "Data Center",
    breakStart: "03:00",
    breakEnd: "04:00",
    overtimeHours: 0,
  },
  General: {
    id: "general",
    type: "General",
    startTime: "09:00",
    endTime: "17:00",
    location: "Head Office",
    breakStart: "12:30",
    breakEnd: "13:30",
    overtimeHours: 0,
  },
  Off: {
    id: "off",
    type: "Off",
    startTime: "--",
    endTime: "--",
    location: "",
    overtimeHours: 0,
  },
};

// Employee schedule for the next 14 days (current week + next week)
const generateSchedule = (startDate: Date): ScheduleDay[] => {
  const schedule: ScheduleDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13); // 14 days

  const shiftPattern: ShiftType[] = [
    "Morning",
    "Morning",
    "Evening",
    "Evening",
    "Night",
    "Off",
    "General",
    "Morning",
    "Evening",
    "Night",
    "Morning",
    "General",
    "Off",
    "Evening",
  ];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    let shiftType: ShiftType = "Morning";

    // Customize for specific dates with Pakistani holidays/events
    const dateStr = date.toISOString().split("T")[0];
    if (dateStr === "2025-03-23") shiftType = "Off"; // Pakistan Day
    else if (dateStr === "2025-03-31" || dateStr === "2025-04-01") shiftType = "Off"; // Eid
    else {
      // Pattern based on index
      const idx = (Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) % shiftPattern.length;
      shiftType = shiftPattern[idx];
    }

    schedule.push({
      date,
      shift: shifts[shiftType],
      notes: shiftType === "Off" && dateStr === "2025-03-23" ? "Pakistan Day Holiday" : undefined,
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  return schedule;
};

// Current user (Rafay Ahmed)
const currentUser = {
  name: "Rafay Ahmed",
  role: "Senior Software Engineer",
  department: "IT",
  employeeId: "EMP101",
};

// Upcoming events (shift swaps, roster changes)
const upcomingEvents = [
  { date: "2025-03-28", title: "Shift Swap with Yousaf Khan", description: "Morning → Evening" },
  { date: "2025-04-02", title: "Roster Change Request", description: "Evening → Night (Pending Approval)" },
  { date: "2025-04-05", title: "Team Meeting", description: "09:30 - 10:30, Conference Room A" },
];

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------
const formatDate = (date: Date) => date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const getShiftColor = (type: ShiftType) => {
  switch (type) {
    case "Morning": return "bg-amber-50 text-amber-800 border-amber-200";
    case "Evening": return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "Night": return "bg-purple-50 text-purple-800 border-purple-200";
    case "General": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Off": return "bg-gray-50 text-gray-500 border-gray-200";
    default: return "bg-white text-gray-800 border-gray-200";
  }
};

const getShiftIcon = (type: ShiftType) => {
  switch (type) {
    case "Morning": return <Sun size={14} className="text-amber-600" />;
    case "Evening": return <Sun size={14} className="text-indigo-600" />;
    case "Night": return <Moon size={14} className="text-purple-600" />;
    case "General": return <Clock size={14} className="text-emerald-600" />;
    default: return null;
  }
};

// ------------------------------------------------------------------
// Day Detail Modal
// ------------------------------------------------------------------
function DayDetailModal({ day, onClose }: { day: ScheduleDay; onClose: () => void }) {
  const { date, shift, notes } = day;
  const shiftName = shift?.type === "Off" ? "Day Off" : shift?.type;

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
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {shift?.type === "Off" ? (
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Day Off</p>
              {notes && <p className="text-sm text-gray-500 mt-1">{notes}</p>}
            </div>
          ) : (
            <>
              <div className={`rounded-xl border p-4 ${getShiftColor(shift?.type || "Morning")}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getShiftIcon(shift?.type || "Morning")}
                  <span className="font-semibold">{shiftName} Shift</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-500" />
                    <span>{shift?.startTime} – {shift?.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-gray-500" />
                    <span>{shift?.location}</span>
                  </div>
                  {shift?.breakStart && shift?.breakEnd && (
                    <div className="flex items-center gap-2">
                      <Coffee size={12} className="text-gray-500" />
                      <span>Break: {shift.breakStart} – {shift.breakEnd}</span>
                    </div>
                  )}
                  {shift?.overtimeHours && shift.overtimeHours > 0 && (
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-yellow-600" />
                      <span>Overtime: +{shift.overtimeHours}h</span>
                    </div>
                  )}
                </div>
              </div>
              {notes && <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">{notes}</div>}
            </>
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
export default function MySchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);

  // Calculate start of week (Monday)
  const getStartOfWeek = useCallback((offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    // Adjust to Monday as start
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday + offset * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }, []);

  const startOfWeek = useMemo(() => getStartOfWeek(weekOffset), [weekOffset, getStartOfWeek]);
  const endOfWeek = useMemo(() => {
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + 6);
    return end;
  }, [startOfWeek]);

  const schedule = useMemo(() => {
    // Generate schedule for the next 14 days, but we'll only show the current week.
    const fullSchedule = generateSchedule(startOfWeek);
    return fullSchedule.slice(0, 7);
  }, [startOfWeek]);

  const weekLabel = useMemo(() => {
    const start = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${start} – ${end}`;
  }, [startOfWeek, endOfWeek]);

  const handlePrevWeek = () => setWeekOffset(offset => offset - 1);
  const handleNextWeek = () => setWeekOffset(offset => offset + 1);
  const handleThisWeek = () => setWeekOffset(0);

  // Upcoming shifts (next 7 days from today)
  const upcomingShifts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureSchedule = generateSchedule(today);
    return futureSchedule.filter(day => day.date >= today && day.shift?.type !== "Off").slice(0, 5);
  }, []);

  // Stats for current week
  const weekStats = useMemo(() => {
    const totalShifts = schedule.filter(day => day.shift?.type !== "Off").length;
    const totalHours = schedule.reduce((sum, day) => {
      if (day.shift?.type !== "Off") {
        const start = day.shift!.startTime.split(":").map(Number);
        const end = day.shift!.endTime.split(":").map(Number);
        let hours = end[0] - start[0];
        if (hours < 0) hours += 24;
        return sum + hours;
      }
      return sum;
    }, 0);
    return { totalShifts, totalHours };
  }, [schedule]);

  return (
    <>
    
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">My Schedule</h1>
              <p className="text-sm text-gray-500">
                {currentUser.name} • {currentUser.role} • {currentUser.department}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleThisWeek}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                This Week
              </button>
              <div className="flex rounded-xl border border-gray-200 bg-white p-1">
                <button onClick={handlePrevWeek} className="rounded-lg p-1 hover:bg-gray-100">
                  <ChevronLeft size={18} />
                </button>
                <span className="px-2 text-sm font-medium text-gray-700 my-auto">{weekLabel}</span>
                <button onClick={handleNextWeek} className="rounded-lg p-1 hover:bg-gray-100">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Shifts This Week" value={weekStats.totalShifts} icon={Calendar} color="blue" />
            <StatCard label="Total Hours" value={`${weekStats.totalHours}h`} icon={Clock} color="green" />
            <StatCard label="Upcoming Shifts" value={upcomingShifts.length} icon={TrendingUp} color="purple" />
          </div>

          {/* Weekly Schedule Grid */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Weekly Schedule</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {schedule.map(day => (
                <ScheduleCard key={day.date.toISOString()} day={day} onClick={() => setSelectedDay(day)} />
              ))}
            </div>
          </div>

          {/* Upcoming Shifts List */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Shifts</h2>
            {upcomingShifts.length === 0 ? (
              <p className="text-center text-gray-400">No upcoming shifts</p>
            ) : (
              <div className="space-y-2">
                {upcomingShifts.map(day => (
                  <div
                    key={day.date.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{formatDate(day.date)}</div>
                      <div className="text-xs text-gray-500">
                        {day.shift?.type} • {day.shift?.startTime} – {day.shift?.endTime}
                      </div>
                    </div>
                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getShiftColor(day.shift?.type || "Morning")}`}>
                      {day.shift?.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-400">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div key={event.date} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                    <Calendar size={16} className="mt-0.5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-800">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{event.description}</div>
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
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

function ScheduleCard({ day, onClick }: { day: ScheduleDay; onClick: () => void }) {
  const { date, shift, isToday, notes } = day;
  const shiftType = shift?.type;
  const isOff = shiftType === "Off";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-3 transition-all ${getShiftColor(shiftType || "Morning")} ${
        isToday ? "ring-2 ring-[#3E3B6F] ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${isToday ? "text-[#3E3B6F]" : "text-gray-700"}`}>
          {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
        </span>
        {getShiftIcon(shiftType || "Morning")}
      </div>
      <div className="mt-2">
        {isOff ? (
          <span className="text-xs text-gray-500">Day Off</span>
        ) : (
          <>
            <div className="text-sm font-medium">{shiftType}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {shift?.startTime} – {shift?.endTime}
            </div>
          </>
        )}
        {notes && <div className="mt-1 text-[10px] text-gray-400 truncate">{notes}</div>}
      </div>
    </motion.div>
  );
}