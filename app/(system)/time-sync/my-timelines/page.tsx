"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  X,
  TrendingUp,
  MapPin,
  ExternalLink,
  ChevronDown,
  CalendarDays,
  FileText,
  ShieldAlert,
  Zap,
  Coffee,
  LogIn,
  LogOut,
  Timer,
  Wifi,
  RefreshCw,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
type ViewMode = "Timeline" | "Calendar" | "List";

type StatusType =
  | "PRESENT"
  | "LATE"
  | "MISSING"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKLY_OFF"
  | "SHORT_DAY"
  | "HALF_DAY"
  | "ABSENT";

interface PunchEvent {
  time: string;       // "09:02 AM"
  type: "in" | "out";
  label: string;
  device: string;
  note?: string;
  noteType?: "ok" | "warn";
}

interface AttendanceDay {
  id: string;
  date: Date;
  status: StatusType;
  inTime: string;
  outTime: string;
  method: string;
  workHours: string;
  breakTime: string;
  notes?: string;
  extra?: string;
  location?: string;
  policyImpact?: string;
  shift?: string;
  graceInMins?: number;
  requiredHours?: string;
  punches?: PunchEvent[];
}

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const fmtLong = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const to24 = (t: string): number => {
  if (!t || t === "--") return 0;
  const [time, ampm] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const minsToHM = (m: number): string => {
  const h = Math.floor(Math.abs(m) / 60);
  const min = Math.abs(m) % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

// ─────────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────────
const generateMockData = (): AttendanceDay[] => {
  const data: AttendanceDay[] = [];
  const today = new Date();

  const specialMap: Record<number, Partial<AttendanceDay> & { status: StatusType }> = {
    1: {
      status: "LATE",
      inTime: "09:25 AM",
      notes: "Late 25m (grace exceeded 10m)",
      workHours: "7h 40m",
      breakTime: "1h 00m",
      punches: [
        { time: "09:25 AM", type: "in",  label: "Clock In",  device: "M-01 · Gate A", note: "Late arrival", noteType: "warn" },
        { time: "01:05 PM", type: "out", label: "Break Out", device: "M-01 · Gate A", note: "Lunch" },
        { time: "02:00 PM", type: "in",  label: "Break In",  device: "M-01 · Gate A" },
        { time: "06:05 PM", type: "out", label: "Clock Out", device: "M-01 · Gate A", note: "On time", noteType: "ok" },
      ],
    },
    2: {
      status: "MISSING",
      outTime: "--",
      workHours: "--",
      breakTime: "--",
      notes: "Missing Out Punch",
      punches: [
        { time: "09:00 AM", type: "in", label: "Clock In", device: "M-03 · Admin Block", note: "On time", noteType: "ok" },
      ],
    },
    3: { status: "ABSENT", inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Absent (No punch)", punches: [] },
    5: { status: "LEAVE",  inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Annual Leave (Approved)", punches: [] },
    7: { status: "HOLIDAY",inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Public Holiday", punches: [] },
    8: {
      status: "SHORT_DAY",
      outTime: "04:30 PM",
      workHours: "6h 30m",
      breakTime: "0h 45m",
      notes: "Short Day (Early Exit)",
      punches: [
        { time: "09:02 AM", type: "in",  label: "Clock In",  device: "M-01 · Gate A", note: "On time", noteType: "ok" },
        { time: "04:30 PM", type: "out", label: "Clock Out", device: "M-01 · Gate A", note: "Early exit", noteType: "warn" },
      ],
    },
    10: {
      status: "HALF_DAY",
      inTime: "09:05 AM",
      outTime: "01:10 PM",
      workHours: "3h 35m",
      breakTime: "0h 15m",
      notes: "Half Day (Approved)",
      punches: [
        { time: "09:05 AM", type: "in",  label: "Clock In",  device: "M-01 · Gate A", note: "On time", noteType: "ok" },
        { time: "01:10 PM", type: "out", label: "Clock Out", device: "M-01 · Gate A", note: "Half day exit", noteType: "warn" },
      ],
    },
    13: { status: "ABSENT", inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Absent", punches: [] },
    16: { status: "HOLIDAY",inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Company Holiday", punches: [] },
    20: {
      status: "LATE",
      inTime: "09:18 AM",
      notes: "Late 18m (within 15m grace: net 3m)",
      workHours: "8h 00m",
      breakTime: "1h 00m",
      punches: [
        { time: "09:18 AM", type: "in",  label: "Clock In",  device: "M-01 · Gate A", note: "3m net late", noteType: "warn" },
        { time: "01:00 PM", type: "out", label: "Break Out", device: "M-01 · Gate A" },
        { time: "02:00 PM", type: "in",  label: "Break In",  device: "M-01 · Gate A" },
        { time: "06:18 PM", type: "out", label: "Clock Out", device: "M-01 · Gate A", note: "Compensated late", noteType: "ok" },
      ],
    },
    24: {
      status: "MISSING",
      outTime: "--",
      workHours: "--",
      breakTime: "--",
      notes: "Missing Out Punch (field visit)",
      punches: [
        { time: "09:00 AM", type: "in", label: "Clock In", device: "M-01 · Gate A", note: "On time", noteType: "ok" },
      ],
    },
  };

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const defaultPunches: PunchEvent[] = [
      { time: "09:02 AM", type: "in",  label: "Clock In",  device: i % 2 === 0 ? "Mobile-Geo" : "M-01 · Gate A", note: "On time", noteType: "ok" },
      { time: "01:02 PM", type: "out", label: "Break Out", device: i % 2 === 0 ? "Mobile-Geo" : "M-01 · Gate A", note: "Lunch break" },
      { time: "02:02 PM", type: "in",  label: "Break In",  device: i % 2 === 0 ? "Mobile-Geo" : "M-01 · Gate A" },
      { time: "06:15 PM", type: "out", label: "Clock Out", device: i % 2 === 0 ? "Mobile-Geo" : "M-01 · Gate A", note: "On time", noteType: "ok" },
    ];

    let record: AttendanceDay = {
      id: `day-${i}`,
      date: d,
      status: "PRESENT",
      inTime: "09:02 AM",
      outTime: "06:15 PM",
      method: i % 2 === 0 ? "Mobile-Geo" : "Device",
      workHours: "8h 13m",
      breakTime: "1h 00m",
      notes: "On Time",
      extra: i === 0 ? "15m OT" : undefined,
      location: i % 2 === 0 ? "Office HQ (verified)" : "Office Device",
      shift: "Morning Shift (09:00 - 18:00)",
      graceInMins: 15,
      requiredHours: "9h",
      policyImpact: "No deductions applied.",
      punches: i === 0 ? undefined : defaultPunches, // today handled separately
    };

    if (isWeekend) {
      record = { ...record, status: "WEEKLY_OFF", inTime: "--", outTime: "--", workHours: "--", breakTime: "--", notes: "Weekly Off", policyImpact: "Not applicable.", punches: [] };
    }

    if (specialMap[i]) {
      record = { ...record, ...specialMap[i] } as AttendanceDay;
    }

    // policy impacts
    const policyMap: Partial<Record<StatusType, string>> = {
      LATE:       "Late mark recorded. If grace exceeded, penalty may apply and regularization might be required.",
      MISSING:    "Missing punch. Regularization required to complete attendance for the day.",
      ABSENT:     "Absent day. You can apply leave (if eligible) or raise an issue if this is incorrect.",
      SHORT_DAY:  "Short hours may trigger short-day/partial deduction depending on policy rules.",
      HALF_DAY:   "Half day is recorded. Ensure leave / approval exists to avoid deduction.",
      LEAVE:      "Leave recorded. No attendance punches required.",
      HOLIDAY:    "Holiday recorded. No attendance punches required.",
      WEEKLY_OFF: "Weekly off. No punches needed.",
    };
    if (policyMap[record.status]) record.policyImpact = policyMap[record.status];

    data.push(record);
  }
  return data;
};

const MOCK_DATA = generateMockData();

// ─────────────────────────────────────────────────────────────────
//  STATUS STYLES
// ─────────────────────────────────────────────────────────────────
const getStatusStyles = (status: StatusType) => {
  const map: Record<StatusType, { bg: string; text: string; border: string; dot: string; label: string; ringColor: string }> = {
    PRESENT:    { bg: "bg-[#322E53]/8",   text: "text-[#322E53]",  border: "border-[#322E53]/20",  dot: "bg-[#322E53]",  label: "PRESENT",    ringColor: "#322E53" },
    LATE:       { bg: "bg-[#EEC293]/10",  text: "text-[#7a5a1e]",  border: "border-[#EEC293]/30",  dot: "bg-[#EEC293]",  label: "LATE",       ringColor: "#EEC293" },
    MISSING:    { bg: "bg-[#F3AB9D]/10",  text: "text-[#7a2a27]",  border: "border-[#F3AB9D]/40 border-dashed", dot: "bg-[#F3AB9D]", label: "MISSING OUT", ringColor: "#F3AB9D" },
    ABSENT:     { bg: "bg-rose-50",        text: "text-rose-700",   border: "border-rose-300 border-dashed", dot: "bg-rose-500",   label: "ABSENT",     ringColor: "#f43f5e" },
    LEAVE:      { bg: "bg-[#5c5490]/10",  text: "text-[#4a3270]",  border: "border-[#5c5490]/25",  dot: "bg-[#5c5490]",  label: "LEAVE",      ringColor: "#5c5490" },
    HOLIDAY:    { bg: "bg-violet-50",      text: "text-violet-700", border: "border-violet-200",     dot: "bg-violet-500", label: "HOLIDAY",    ringColor: "#7c3aed" },
    SHORT_DAY:  { bg: "bg-[#EEC293]/10",  text: "text-[#6b4a10]",  border: "border-[#EEC293]/25",  dot: "bg-[#EEC293]",  label: "SHORT DAY",  ringColor: "#EEC293" },
    HALF_DAY:   { bg: "bg-blue-50",        text: "text-blue-700",   border: "border-blue-200",       dot: "bg-blue-500",   label: "HALF DAY",   ringColor: "#3b82f6" },
    WEEKLY_OFF: { bg: "bg-gray-50",        text: "text-gray-400",   border: "border-gray-200",       dot: "bg-gray-400",   label: "WEEKLY OFF", ringColor: "#9ca3af" },
  };
  return map[status] ?? map.PRESENT;
};

// ─────────────────────────────────────────────────────────────────
//  TODAY'S HERO — COMPACT VERSION
// ─────────────────────────────────────────────────────────────────
function TodayHero({ onRegularize, onRequestOT }: { onRegularize: () => void; onRequestOT: () => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const shiftStart = 9 * 60;  // 09:00
  const shiftEnd   = 18 * 60; // 18:00
  const planned    = shiftEnd - shiftStart; // 540 mins

  // Calculate worked mins from punches (hardcoded for demo)
  let worked = 0;
  let lastIn: number | null = null;
  const TODAY_PUNCHES: PunchEvent[] = [
    { time: "09:02 AM", type: "in",  label: "Clock In",  device: "M-01 · Gate A", note: "On time", noteType: "ok" },
    { time: "01:03 PM", type: "out", label: "Break Out", device: "M-01 · Gate A", note: "Lunch break" },
    { time: "02:04 PM", type: "in",  label: "Break In",  device: "M-01 · Gate A" },
  ];
  for (const p of TODAY_PUNCHES) {
    const mins = to24(p.time);
    if (p.type === "in") lastIn = mins;
    else if (p.type === "out" && lastIn !== null) { worked += mins - lastIn; lastIn = null; }
  }
  if (lastIn !== null) worked += nowMins - lastIn;

  const pct = Math.min(Math.round((worked / planned) * 100), 100);
  const remMins = Math.max(0, planned - worked);
  const otMins = nowMins > shiftEnd ? nowMins - shiftEnd : 0;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-lg"
      style={{ background: "linear-gradient(135deg, #322E53 0%, #322E53 80%)" }}
    >
      <div className="p-4 md:p-5 flex flex-wrap items-center gap-4">
        {/* left: live time + clock-in info */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">{hh}</span>
              <span className="text-lg font-bold text-white/60 animate-pulse">:</span>
              <span className="text-xl font-bold text-white">{mm}</span>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#49426E] opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#49426E]" />
            </span>
          </div>
          <div>
            <div className="text-xs text-white/60">Clocked in at</div>
            <div className="text-base font-bold text-white">09:02 AM</div>
            <div className="text-[10px] text-white/40">M-01 · Gate A</div>
          </div>
        </div>

        {/* middle: progress ring */}
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14">
            <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
              <circle cx={28} cy={28} r={24} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
              <circle
                cx={28} cy={28} r={24} fill="none"
                stroke="#49426E" strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(pct/100) * 150.8} 150.8`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-xs font-bold">{pct}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-white/60">Remaining</div>
            <div className="text-sm font-bold text-white">{minsToHM(remMins)}</div>
          </div>
        </div>

        {/* right: quick stats */}
        <div className="flex gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <Timer className="h-3 w-3 text-white/60" />
            <div className="text-sm font-bold text-white">{(worked/60).toFixed(1)}h</div>
            <div className="text-[9px] text-white/40">worked</div>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <Zap className="h-3 w-3 text-white/60" />
            <div className="text-sm font-bold text-white">{minsToHM(otMins)}</div>
            <div className="text-[9px] text-white/40">OT</div>
          </div>
        </div>

        {/* actions */}
        <div className="flex gap-2 ml-auto">
          <button onClick={onRegularize}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/25 transition-colors">
            <RefreshCw size={12} /> Regularize
          </button>
          <button onClick={onRequestOT}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/25 transition-colors">
            <Zap size={12} /> Request OT
          </button>
        </div>
      </div>

      {/* today's punches mini strip */}
      <div className="flex gap-2 border-t border-white/10 px-4 py-3 overflow-x-auto">
        {TODAY_PUNCHES.map((p, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${p.type === "in" ? "bg-[#322E53]" : "bg-[#EEC293]"}`}>
              {p.type === "in" ? <LogIn size={8} className="text-white" /> : <LogOut size={8} className="text-white" />}
            </div>
            <span className="text-xs text-white/80">{p.time}</span>
            {p.note && (
              <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${p.noteType === "warn" ? "bg-[#EEC293]/30 text-[#EEC293]" : "bg-[#49426E]/30 text-[#49426E]"}`}>
                {p.note}
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 border border-dashed border-white/20">
          <Clock size={12} className="text-white/40" />
          <span className="text-xs text-white/40">Clock Out (18:00)</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────
function DetailDrawer({ day, onClose }: { day: AttendanceDay; onClose: () => void }) {
  const styles = getStatusStyles(day.status);
  const needsAction = ["LATE", "MISSING", "ABSENT"].includes(day.status);

  const primaryLabel = day.status === "ABSENT" ? "Apply Leave" : day.status === "MISSING" || day.status === "LATE" ? "Request Regularization" : "Trace Calculation";
  const primaryBg    = day.status === "ABSENT" || day.status === "LATE" || day.status === "MISSING" ? "#3E3B6F" : "#3E3B6F";
  const primaryHint  = day.status === "ABSENT"
    ? "Use this if you were absent and want to convert it to a leave day."
    : day.status === "LATE"
    ? "Late beyond grace usually needs regularization or manager approval."
    : day.status === "MISSING"
    ? "Missing punch must be regularized to complete attendance for the day."
    : "See how hours and policy were calculated for this day.";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end" style={{ margin: 0 }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Calculation Trace</h3>
              <p className="text-sm text-gray-500">{fmtLong(day.date)}</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* status pill */}
            <div className={`flex items-center justify-between rounded-2xl border p-4 ${styles.bg} ${styles.border}`}>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${styles.dot}`} />
                <span className={`font-bold ${styles.text}`}>Status: {styles.label}</span>
              </div>
              {needsAction && (
                <span className="animate-pulse text-[10px] font-black text-red-600">ACTION REQUIRED</span>
              )}
            </div>

            {/* punches mini-timeline */}
            {day.punches && day.punches.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Punch Timeline</p>
                <div className="relative space-y-0 pl-8">
                  <div className="absolute left-[28px] top-3 bottom-3 w-0.5 rounded-full bg-gray-200" />
                  {day.punches.map((p, i) => (
                    <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      <div className={`absolute left-[-4px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow z-10 ${p.type === "in" ? "bg-[#322E53]" : "bg-[#EEC293]"}`}>
                        {p.type === "in"
                          ? <LogIn  style={{ width: 8, height: 8, color: "#fff" }} />
                          : <LogOut style={{ width: 8, height: 8, color: "#fff" }} />}
                      </div>
                      <div className="ml-4 flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.device}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900 tabular-nums">{p.time}</div>
                            {p.note && (
                              <div className={`text-[9px] font-semibold mt-0.5 ${p.noteType === "warn" ? "text-[#EEC293]" : "text-[#49426E]"}`}>{p.note}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* policy box */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert size={16} className="mt-0.5 text-gray-400" />
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Policy Impact</p>
                  <p className="text-sm font-medium leading-relaxed text-gray-700">{day.policyImpact}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Required",  value: day.requiredHours || "9h" },
                      { label: "Grace In",  value: `${day.graceInMins ?? 15}m` },
                      { label: "Shift",     value: "Morning" },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{c.label}</p>
                        <p className="mt-1 text-sm font-black text-gray-900">{c.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* calc trace */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <TrendingUp size={13} className="text-[#3E3B6F]" /> How it was calculated
              </h4>

              <div className="overflow-hidden rounded-2xl border border-gray-100">
                {/* shift + location row */}
                <div className="flex justify-between border-b border-gray-100 bg-white p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Applied Shift</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{day.shift || "Morning Shift (9:00 AM – 6:00 PM)"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Method</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{day.location || day.method}</p>
                  </div>
                </div>

                {/* in/out trace */}
                <div className="divide-y divide-gray-100 bg-gray-50/40 p-5 space-y-4">
                  {[
                    {
                      label: `Punch In: ${day.inTime}`,
                      children: day.status === "LATE"
                        ? ["→ Late recorded", `→ Grace window: ${day.graceInMins ?? 15}m`, "→ Action: Regularize if grace exceeded"]
                        : day.status === "ABSENT"
                        ? ["→ No punch found"]
                        : ["LEAVE", "HOLIDAY", "WEEKLY_OFF"].includes(day.status)
                        ? ["→ Not required for this status"]
                        : ["→ On Time ✓"],
                      childColors: day.status === "LATE"
                        ? ["text-orange-500", "text-orange-500", "text-red-700"]
                        : day.status === "ABSENT"
                        ? ["text-rose-700"]
                        : ["LEAVE", "HOLIDAY", "WEEKLY_OFF"].includes(day.status)
                        ? ["text-gray-400"]
                        : ["text-green-600"],
                    },
                    {
                      label: `Punch Out: ${day.outTime}`,
                      children: day.status === "MISSING"
                        ? ["→ Missing punch out — regularization required"]
                        : day.status === "SHORT_DAY"
                        ? ["→ Early exit — short day recorded"]
                        : day.status === "PRESENT" && day.extra
                        ? [`→ Extra time: ${day.extra}`]
                        : ["LEAVE", "HOLIDAY", "WEEKLY_OFF", "ABSENT"].includes(day.status)
                        ? ["→ Not applicable"]
                        : ["→ Standard exit"],
                      childColors: day.status === "MISSING"
                        ? ["text-red-700"]
                        : day.status === "SHORT_DAY"
                        ? ["text-yellow-700"]
                        : day.status === "PRESENT" && day.extra
                        ? ["text-blue-600"]
                        : ["LEAVE", "HOLIDAY", "WEEKLY_OFF", "ABSENT"].includes(day.status)
                        ? ["text-gray-400"]
                        : ["text-gray-500"],
                    },
                  ].map((row, ri) => (
                    <div key={ri} className="space-y-1">
                      <p className="text-sm font-bold text-gray-800">{row.label}</p>
                      <div className="ml-2 space-y-0.5 border-l-2 border-gray-200 pl-3 py-1">
                        {row.children.map((c, ci) => (
                          <p key={ci} className={`text-[10px] font-bold ${row.childColors[ci] || "text-gray-500"}`}>{c}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* metrics */}
                <div className="bg-[#3E3B6F]/5 p-5">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Work Metrics</p>
                      <div className="space-y-1 text-xs font-medium text-gray-600">
                        {[
                          ["Work Hours", day.workHours],
                          ["Break",      day.breakTime],
                          ["Net",        day.workHours, true],
                        ].map(([label, val, bold]) => (
                          <div key={label as string} className={`flex justify-between ${bold ? "pt-1 border-t border-gray-200 text-[#3E3B6F] font-black" : ""}`}>
                            <span>{label}:</span>
                            <span className={bold ? "text-sm font-black" : "font-bold text-gray-900"}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-4 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Notes</p>
                      <div className="flex items-start gap-2">
                        <FileText size={12} className="mt-0.5 text-gray-400" />
                        <p className="text-[11px] font-medium leading-relaxed text-gray-600">{day.notes || "—"}</p>
                      </div>
                      {day.status === "ABSENT" && (
                        <p className="text-[11px] font-bold leading-relaxed text-rose-700">Tip: Apply leave if you were on approved absence.</p>
                      )}
                      {day.status === "MISSING" && (
                        <p className="text-[11px] font-bold leading-relaxed text-red-700">Tip: Add time + reason in regularization form.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* what to do hint */}
              <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <AlertCircle size={16} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">What should I do?</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-700">{primaryHint}</p>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex gap-3 border-t border-gray-100 bg-gray-50 p-5">
            <button
              className="flex-1 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ background: primaryBg }}
              onClick={() => console.log(primaryLabel, day.id)}
            >
              {primaryLabel}
            </button>
          
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN EXPORT WITH PAGINATION
// ─────────────────────────────────────────────────────────────────
export const MyAttendanceTimeline: React.FC = () => {
  const [viewMode, setViewMode]       = useState<ViewMode>("Timeline");
  const [selectedDay, setSelectedDay] = useState<AttendanceDay | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRegularize, setShowRegularize] = useState(false);
  const [showOT, setShowOT] = useState(false);

  // Pagination state (for Timeline and List views)
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when view mode changes
  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  // Paginated data for Timeline (all days sorted descending)
  const allDaysSorted = useMemo(() => {
    return [...MOCK_DATA].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  const totalPages = Math.ceil(allDaysSorted.length / itemsPerPage);
  const paginatedDays = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return allDaysSorted.slice(start, start + itemsPerPage);
  }, [page, allDaysSorted]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<null | { date: Date; record?: AttendanceDay }> = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const record = MOCK_DATA.find(d => sameDay(d.date, date));
      days.push({ date, record });
    }
    return days;
  }, [currentMonth]);

  const TimelineItem = ({ day }: { day: AttendanceDay }) => {
    const styles = getStatusStyles(day.status);
    const needsAct = ["LATE", "MISSING", "ABSENT"].includes(day.status);
    const isToday = sameDay(day.date, new Date());

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedDay(day)}
        className={`group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all hover:shadow-xl ${styles.border} ${isToday ? "ring-2 ring-[#3E3B6F] ring-offset-2" : ""}`}
      >
        <div className={`flex items-center justify-between border-b border-gray-50 px-5 py-2.5 ${styles.bg}`}>
          <div className="flex items-center gap-2">
            {isToday && <span className="rounded-full bg-[#3E3B6F] px-2 py-0.5 text-[9px] font-black text-white">TODAY</span>}
            <span className="text-sm font-bold text-gray-800">{fmtLong(day.date)}</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>{styles.label}</span>
        </div>

        <div className="flex flex-col gap-4 bg-white p-5 lg:flex-row lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-5 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Punch Times</p>
              <p className="text-sm font-bold text-gray-800">{day.inTime} — {day.outTime}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-gray-400">
                <MapPin size={9} /> {day.location || day.method}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Hours / Break</p>
              <p className="text-sm font-bold text-gray-800">
                {day.workHours} <span className="mx-1 text-gray-200">|</span> {day.breakTime}
              </p>
              {day.extra && <p className="mt-1 text-[10px] font-bold text-[#3E3B6F]">Extra: {day.extra}</p>}
            </div>
            <div className="col-span-2 lg:col-span-1">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Status Remarks</p>
              <p className={`text-sm font-bold ${needsAct ? "text-red-600" : "text-gray-600"}`}>{day.notes}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {day.status === "ABSENT" ? (
              <button onClick={e => { e.stopPropagation(); setSelectedDay(day); }}
                className="rounded-xl bg-[#3E3B6F] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
                Apply Leave
              </button>
            ) : day.status === "MISSING" || day.status === "LATE" ? (
              <button onClick={e => { e.stopPropagation(); setSelectedDay(day); }}
                className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white">
                Regularize ⚠️
              </button>
            ) : (
              <button onClick={e => { e.stopPropagation(); setSelectedDay(day); }}
                className="rounded-xl bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100">
                View Details
              </button>
            )}
            <div className="p-2 text-gray-300 transition-colors group-hover:text-[#3E3B6F]">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* TODAY'S HERO (compact) */}
      <TodayHero
        onRegularize={() => setShowRegularize(true)}
        onRequestOT={() => setShowOT(true)}
      />

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Attendance History</h2>
          <p className="text-sm font-medium text-gray-500">Detailed log of your working hours and status</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* view toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {([
              { id: "Timeline", icon: Clock    },
              { id: "Calendar", icon: CalendarIcon },
              { id: "List",     icon: ListIcon },
            ] as { id: ViewMode; icon: React.ElementType }[]).map(m => (
              <button key={m.id} onClick={() => setViewMode(m.id)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  viewMode === m.id ? "bg-[#3E3B6F] text-white shadow" : "text-gray-500 hover:bg-gray-50"
                }`}>
                <m.icon size={13} /> {m.id}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            <CalendarDays size={13} /> Last 30 Days
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-[#3E3B6F] px-4 py-2 text-xs font-bold text-white shadow-lg transition-opacity hover:opacity-90">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4">
        <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Legend</span>
        {(["PRESENT","LATE","MISSING","ABSENT","LEAVE","HOLIDAY","SHORT_DAY","HALF_DAY","WEEKLY_OFF"] as StatusType[]).map(s => {
          const st = getStatusStyles(s);
          return (
            <span key={s} className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${st.bg} ${st.text} ${st.border}`}>
              {s}
            </span>
          );
        })}
      </div>

      {/* VIEWS */}
      <div className="min-h-[400px]">
        {/* ── TIMELINE with pagination ── */}
        {viewMode === "Timeline" && (
          <div className="space-y-6">
            {paginatedDays.map(day => (
              <TimelineItem key={day.id} day={day} />
            ))}
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CALENDAR (unchanged) */}
        {viewMode === "Calendar" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h3 className="font-bold text-gray-800">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"><ChevronLeft size={17} /></button>
                <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"><ChevronRight size={17} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((cell, i) => {
                const isToday = cell ? sameDay(cell.date, new Date()) : false;
                return (
                  <div key={i}
                    onClick={() => cell?.record && setSelectedDay(cell.record)}
                    className={`min-h-[90px] border-b border-r border-gray-50 p-2 transition-colors last:border-r-0 ${cell?.record ? "cursor-pointer hover:bg-gray-50" : "bg-gray-50/20"}`}
                  >
                    {cell && (
                      <>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday ? "bg-[#3E3B6F] text-white" : "text-gray-400"
                        }`}>
                          {cell.date.getDate()}
                        </span>
                        {cell.record && (
                          <div className={`mt-1.5 rounded-lg border p-1.5 space-y-0.5 ${getStatusStyles(cell.record.status).border} ${getStatusStyles(cell.record.status).bg}`}>
                            <div className="flex items-center gap-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${getStatusStyles(cell.record.status).dot}`} />
                              <span className={`text-[8px] font-bold truncate ${getStatusStyles(cell.record.status).text}`}>{cell.record.status}</span>
                            </div>
                            <p className="text-[9px] font-medium text-gray-600">{cell.record.inTime}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LIST with pagination ── */}
        {viewMode === "List" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">In</th>
                  <th className="px-5 py-3">Out</th>
                  <th className="px-5 py-3">Work Hrs</th>
                  <th className="px-5 py-3">Remarks</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedDays.map(day => {
                  const st = getStatusStyles(day.status);
                  const isToday = sameDay(day.date, new Date());
                  return (
                    <tr key={day.id}
                      onClick={() => setSelectedDay(day)}
                      className={`group cursor-pointer transition-colors hover:bg-gray-50 ${isToday ? "bg-[#3E3B6F]/5" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="rounded-full bg-[#3E3B6F] px-1.5 py-0.5 text-[8px] font-black text-white">TODAY</span>}
                          <span className="text-sm font-bold text-gray-800">{fmtShort(day.date)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                          {day.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-sm text-gray-600">{day.inTime}</td>
                      <td className="px-5 py-3 tabular-nums text-sm text-gray-600">{day.outTime}</td>
                      <td className="px-5 py-3 tabular-nums text-sm font-semibold text-gray-800">{day.workHours}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[180px] truncate">{day.notes}</td>
                      <td className="px-5 py-3 text-right">
                        <button className="p-1.5 text-gray-300 transition-colors group-hover:text-[#3E3B6F]">
                          <ExternalLink size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination controls for list */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedDay && <DetailDrawer day={selectedDay} onClose={() => setSelectedDay(null)} />}

      {/* REGULARIZE MINI MODAL */}
      {showRegularize && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRegularize(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <button onClick={() => setShowRegularize(false)} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100"><X size={16} /></button>
            <h3 className="text-lg font-bold text-gray-900">Regularize Punch</h3>
            <p className="mt-1 text-sm text-gray-500">Submit a correction for a missing or incorrect punch.</p>
            <div className="mt-5 space-y-3">
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</label>
                <input type="date" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" defaultValue={new Date().toISOString().split("T")[0]} /></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Type</label>
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                  <option>Missing In-Punch</option><option>Missing Out-Punch</option><option>Wrong Punch</option>
                </select></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Correct Time</label>
                <input type="time" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason</label>
                <textarea rows={2} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Briefly explain the reason…" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-2xl bg-[#3E3B6F] py-3 text-sm font-bold text-white hover:opacity-90">Submit Request</button>
              <button onClick={() => setShowRegularize(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OT REQUEST MINI MODAL */}
      {showOT && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOT(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <button onClick={() => setShowOT(false)} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100"><X size={16} /></button>
            <h3 className="text-lg font-bold text-gray-900">Request Overtime</h3>
            <p className="mt-1 text-sm text-gray-500">Submit your overtime hours for manager approval.</p>
            <div className="mt-5 space-y-3">
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</label>
                <input type="date" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" defaultValue={new Date().toISOString().split("T")[0]} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">OT Start</label>
                  <input type="time" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" defaultValue="18:00" /></div>
                <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">OT End</label>
                  <input type="time" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" defaultValue="20:00" /></div>
              </div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason / Task</label>
                <textarea rows={2} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="What were you working on…" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-2xl bg-[#3E3B6F] py-3 text-sm font-bold text-white hover:opacity-90">Submit OT Request</button>
              <button onClick={() => setShowOT(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyAttendanceTimeline;