"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  Calendar,
  AlertTriangle,
 
  Cpu,
  TrendingUp,
  BarChart3,
  RefreshCw,

  Zap,
  Timer,
  CalendarDays,
  Activity,
  Network,
  SlidersHorizontal,
  UserCheck,
  ClipboardList,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// ─────────────────────────────────────────────
//  CHART PALETTE  (same brand tokens)
// ─────────────────────────────────────────────
const CHART = {
  navy: "#1E1A3A",   // brand-900
  dark: "#322E53",   // brand-800
  sage: "#49426E",   // brand-700
  gold: "#EEC293",   // brand-500 — peach
  rose: "#F3AB9D",   // brand-400 — salmon
  peach: "#f7c9b9",  // brand-300
  sand: "#5c5490",   // brand-600
  violet: "#5c5490",
  mint: "#EEC293",
};

/* Attendance status semantic colors */
const ATTENDANCE_COLORS = {
  present: "#16a34a",  // green
  absent:  "#dc2626",  // red
  late:    "#EEC293",  // brand-500 peach
  leave:   "#49426E",  // brand-700 purple
};

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART.sand}`,
  backgroundColor: "#fff",
};
const gridStroke = `${CHART.sand}60`;
const tickStyle = { fill: CHART.sage };

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────

const KPI_CARDS = [
  {
    title: "Pending Regularizations",
    value: "138",
    sub: "missing punches",
    icon: RefreshCw,
    change: "+18",
    up: false,
    bg: "bg-gradient-to-br from-[#49426E] to-[#5c5490]",
    href: "/time-sync/my-regularizations",
  },
  {
    title: "Active Anomalies",
    value: "63",
    sub: "unresolved flags",
    icon: AlertTriangle,
    change: "-7",
    up: true,
    bg: "bg-gradient-to-br from-[#EEC293] to-[#e8b57a]",
    textColor: "text-[#322E53]",
    href: "/time-sync/exceptions-inbox",
  },
  {
    title: "Machines Online",
    value: "34/38",
    sub: "biometric devices",
    icon: Cpu,
    change: "4 offline",
    up: false,
    bg: "bg-gradient-to-br from-[#5c5490] to-[#49426E]",
    href: "/time-sync/device-management",
  },
  {
    title: "Roster Coverage",
    value: "98.2%",
    sub: "this week",
    icon: CalendarDays,
    change: "+0.5%",
    up: true,
    bg: "bg-gradient-to-br from-[#322E53] to-[#5c5490]",
    href: "/time-sync/roster-planner",
  },
];

const DAILY_ATTENDANCE = [
  { day: "Mon", present: 1120, absent: 78, late: 49 },
  { day: "Tue", present: 1145, absent: 62, late: 40 },
  { day: "Wed", present: 1098, absent: 99, late: 50 },
  { day: "Thu", present: 1162, absent: 55, late: 30 },
  { day: "Fri", present: 1084, absent: 113, late: 50 },
];

const PUNCH_TREND = [
  { hour: "06:00", punches: 12 },
  { hour: "07:00", punches: 98 },
  { hour: "08:00", punches: 387 },
  { hour: "09:00", punches: 312 },
  { hour: "10:00", punches: 54 },
  { hour: "11:00", punches: 18 },
  { hour: "12:00", punches: 32 },
  { hour: "13:00", punches: 41 },
  { hour: "17:00", punches: 298 },
  { hour: "18:00", punches: 421 },
  { hour: "19:00", punches: 162 },
  { hour: "20:00", punches: 44 },
];

const OVERTIME_MONTHLY = [
  { month: "Oct", approved: 2210, pending: 340, rejected: 80 },
  { month: "Nov", approved: 2490, pending: 410, rejected: 110 },
  { month: "Dec", approved: 3100, pending: 290, rejected: 60 },
  { month: "Jan", approved: 2650, pending: 380, rejected: 90 },
  { month: "Feb", approved: 2720, pending: 360, rejected: 75 },
  { month: "Mar", approved: 2847, pending: 312, rejected: 55 },
];

const SHIFT_DISTRIBUTION = [
  { name: "Morning (A)", value: 512, color: CHART.dark },
  { name: "Evening (B)", value: 318, color: CHART.gold },
  { name: "Night (C)", value: 184, color: CHART.violet },
  { name: "General", value: 233, color: CHART.sage },
];

const ANOMALY_TYPES = [
  { type: "Missing In-Punch", count: 28, color: CHART.rose },
  { type: "Missing Out-Punch", count: 19, color: CHART.peach },
  { type: "Short Hours", count: 9, color: CHART.gold },
  { type: "Early Departure", count: 7, color: CHART.violet },
];

const DEPT_OT_HOURS = [
  { dept: "Operations", hours: 921 },
  { dept: "IT", hours: 430 },
  { dept: "Sales", hours: 620 },
  { dept: "Finance", hours: 210 },
  { dept: "HR", hours: 98 },
  { dept: "Admin", dept_short: "Admin", hours: 140 },
];

const ROSTER_COVERAGE = [
  { week: "W-5", coverage: 97.1 },
  { week: "W-4", coverage: 96.8 },
  { week: "W-3", coverage: 98.4 },
  { week: "W-2", coverage: 97.9 },
  { week: "W-1", coverage: 98.2 },
  { week: "This", coverage: 98.2 },
];

const MACHINE_STATUS = [
  { id: "M-01", location: "Gate A – Main Entrance", status: "online", lastSync: "2m ago", punches: 412 },
  { id: "M-02", location: "Gate B – Factory Floor", status: "online", lastSync: "3m ago", punches: 318 },
  { id: "M-03", location: "Admin Block", status: "online", lastSync: "1m ago", punches: 201 },
  { id: "M-08", location: "Warehouse", status: "offline", lastSync: "3h ago", punches: 0 },
  { id: "M-12", location: "Regional – Karachi", status: "warning", lastSync: "18m ago", punches: 47 },
  { id: "M-15", location: "Regional – Lahore", status: "online", lastSync: "5m ago", punches: 106 },
];

const REGULARIZATION_QUEUE = [
  { name: "Tariq Mahmood", dept: "Operations", type: "Missing In-Punch", date: "Mar 15", status: "Pending" },
  { name: "Nadia Aslam", dept: "Finance", type: "Missing Out-Punch", date: "Mar 15", status: "Pending" },
  { name: "Hassan Zafar", dept: "IT", type: "Short Hours", date: "Mar 14", status: "In Review" },
  { name: "Ayesha Siddiqui", dept: "HR", type: "Missing In-Punch", date: "Mar 14", status: "Pending" },
  { name: "Bilal Shah", dept: "Sales", type: "Early Departure", date: "Mar 13", status: "Approved" },
];

const MY_TIME_TEAM = [
  { name: "Zara Ahmed", role: "Sr. Engineer", status: "In", time: "08:47", ot: 0 },
  { name: "Omar Raza", role: "Accountant", status: "In", time: "09:02", ot: 1.5 },
  { name: "Hira Maqbool", role: "Designer", status: "Out", time: "18:12", ot: 0 },
  { name: "Usman Qureshi", role: "Team Lead", status: "Absent", time: "—", ot: 0 },
  { name: "Sana Ali", role: "QA Engineer", status: "In", time: "08:55", ot: 2 },
];

const RADAR_TEAM_METRICS = [
  { subject: "Attendance", A: 92, B: 88, fullMark: 100 },
  { subject: "Punctuality", A: 80, B: 72, fullMark: 100 },
  { subject: "OT Compliance", A: 75, B: 68, fullMark: 100 },
  { subject: "Roster Adh.", A: 88, B: 91, fullMark: 100 },
  { subject: "Reg. Rate", A: 95, B: 89, fullMark: 100 },
];

const WEEKLY_HOURS_WORKED = [
  { day: "Mon", planned: 8, actual: 8.4, ot: 0.4 },
  { day: "Tue", planned: 8, actual: 7.9, ot: 0 },
  { day: "Wed", planned: 8, actual: 9.1, ot: 1.1 },
  { day: "Thu", planned: 8, actual: 8.6, ot: 0.6 },
  { day: "Fri", planned: 8, actual: 7.5, ot: 0 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } },
} as const;

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function MiniBars() {
  return (
    <div className="mt-3 flex gap-0.5">
      {[40, 65, 80, 55, 70, 90, 60].map((h, i) => (
        <div key={i} className="w-1.5 rounded-full bg-white/30" style={{ height: `${h * 0.18}px` }} />
      ))}
    </div>
  );
}

function SectionSkeleton({ height = "h-[220px]" }) {
  return <div className={`w-full rounded-xl bg-brand-100 animate-pulse ${height}`} />;
}



function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-brand-800 text-white shadow-md"
          : "text-brand-700 hover:bg-brand-100 hover:text-brand-800"
      }`}
    >
      {children}
    </button>
  );
}

const machineStatusColors = {
  online: "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  offline: "bg-brand-100 text-brand-800 border-brand-300",
  warning: "bg-[#DEAD68]/20 text-[#B28950] border-[#DEAD68]/50",
};

const regStatusColors = {
  Pending: "bg-brand-100 text-brand-800 border-brand-300",
  "In Review": "bg-[#DEAD68]/20 text-[#B28950] border-[#DEAD68]/50",
  Approved: "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
};

const teamStatusColors = {
  In: "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  Out: "bg-brand-100 text-brand-700 border-brand-300",
  Absent: "bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40",
};

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

export default function TimeSyncDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "mytime", label: "MyTime & Team" },
    { key: "roster", label: "Roster & Shifts" },
    { key: "anomalies", label: "Anomalies & Regularization" },
    { key: "overtime", label: "Overtime" },
    { key: "machines", label: "Machine Integration" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex min-h-screen flex-col gap-6 bg-white p-6 md:p-8"
      style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
    >
      {/* ── Header ───────────────────────────────────────── */}
 <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
           
            <div>
              <h1 className="text-2xl font-bold text-brand-900 tracking-tight leading-tight">
                TimeSync
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Attendance, shifts, rosters, overtime, anomalies & machine integrations
              </p>
            </div>
          </div>
        </div>

      <div className="flex flex-wrap gap-1">
  <TooltipProvider delayDuration={200}>
    <TooltipPrimitive>
      <TooltipTrigger asChild>
        <Button
          asChild
          size="icon"
          className="h-8 w-8 bg-brand-800 text-white shadow-md hover:bg-brand-900"
        >
          <Link href="/time-sync/my-regularizations">
            <RefreshCw className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Regularize Attendance</p>
      </TooltipContent>
    </TooltipPrimitive>

    <TooltipPrimitive>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          asChild
          size="icon"
          className="h-8 w-8 border-brand-800 text-brand-800 hover:bg-brand-100"
        >
          <Link href="/time-sync/shifts">
            <SlidersHorizontal className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Manage Shifts</p>
      </TooltipContent>
    </TooltipPrimitive>

    <TooltipPrimitive>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          asChild
          size="icon"
          className="h-8 w-8 border-brand-700 text-brand-700 hover:bg-brand-100"
        >
          <Link href="/time-sync/roster-planner">
            <CalendarDays className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Roster Builder</p>
      </TooltipContent>
    </TooltipPrimitive>


  </TooltipProvider>
</div>
      </motion.div>

      {/* ── KPI Cards (PeopleHub style) ─────────────────── */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.up ? ArrowUpRight : ArrowDownRight;
          return (
            <Link href={stat.href} key={stat.title}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className={`h-full overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl ${stat.bg}`}>
                  <div className={`p-4 ${(stat as any).textColor || "text-white"}`}>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 opacity-90" />
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${(stat as any).textColor ? "bg-[#322E53]/15 text-[#322E53]" : "bg-white/20 text-white"}`}>
                        <TrendIcon className="h-3 w-3" />
                        {stat.change}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs opacity-90">{stat.title}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{stat.sub}</div>
                    </div>
                    <MiniBars />
                  </div>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Quick Action Buttons (shadcn outline) ───────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        <Button variant="outline" asChild className="border-brand-800 text-brand-800 hover:bg-brand-100">
          <Link href="/time-sync/my-timelines">
            <UserCheck className="mr-2 h-4 w-4" />
            View My Attendance
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-brand-700 text-brand-700 hover:bg-brand-100">
          <Link href="/time-sync/my-team">
            <Users className="mr-2 h-4 w-4" />
            My Team
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-brand-600 text-brand-600 hover:bg-brand-100">
          <Link href="/time-sync/exceptions-inbox">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Open Anomalies
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-brand-300 text-brand-800 hover:bg-brand-100">
          <Link href="/time-sync/roster-planner">
            <Calendar className="mr-2 h-4 w-4" />
            Shift Planner
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-brand-400 text-brand-800 hover:bg-brand-100">
          <Link href="/time-sync/device-management">
            <Cpu className="mr-2 h-4 w-4" />
            Machine Health
          </Link>
        </Button>
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-1 rounded-xl bg-white border border-brand-200/60 p-1 w-fit mb-6 shadow-sm">
          {tabs.map((tab) => (
            <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* ════════════════ OVERVIEW ════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Row 1: Daily Attendance + Punch Heatmap + Shift Pie */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-brand-800" />
                      <span className="text-base font-semibold text-brand-900">Daily Attendance Breakdown</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Present / Absent / Late this week</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[240px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={DAILY_ATTENDANCE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                          <Bar dataKey="present" name="Present" fill={ATTENDANCE_COLORS.present} radius={[4, 4, 0, 0]} barSize={20} stackId="a" />
                          <Bar dataKey="late" name="Late" fill={ATTENDANCE_COLORS.late} radius={[0, 0, 0, 0]} barSize={20} stackId="a" />
                          <Bar dataKey="absent" name="Absent" fill={ATTENDANCE_COLORS.absent} radius={[4, 4, 0, 0]} barSize={20} stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-brand-600" />
                      <span className="text-base font-semibold text-brand-900">Shift Distribution</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Active employees per shift today</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[240px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <RePieChart>
                          <Pie
                            data={SHIFT_DISTRIBUTION}
                            cx="50%"
                            cy="45%"
                            innerRadius={48}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {SHIFT_DISTRIBUTION.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend verticalAlign="bottom" height={28} iconSize={8} wrapperStyle={{ fontSize: 10, color: CHART.sage }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Row 2: Punch Timing Area + Roster Coverage Line */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-brand-800" />
                      <span className="text-base font-semibold text-brand-900">Today's Punch Traffic</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Hourly punch-in / punch-out volume</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={PUNCH_TREND} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="punchGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART.dark} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={CHART.dark} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="hour" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area
                            type="monotone"
                            dataKey="punches"
                            stroke={CHART.dark}
                            strokeWidth={2.5}
                            fill="url(#punchGrad)"
                            dot={{ r: 3, fill: CHART.gold }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-brand-700" />
                      <span className="text-base font-semibold text-brand-900">Roster Coverage Trend</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Weekly shift-to-roster coverage %</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={ROSTER_COVERAGE} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                          <XAxis dataKey="week" tick={{ fontSize: 11, ...tickStyle }} />
                          <YAxis domain={[94, 100]} tick={{ fontSize: 11, ...tickStyle }} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                          <Line
                            type="monotone"
                            dataKey="coverage"
                            stroke={CHART.sage}
                            strokeWidth={3}
                            dot={{ r: 4, fill: CHART.gold }}
                            activeDot={{ r: 6, fill: CHART.rose }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Row 3: Anomaly Pie + OT Monthly + Machine Mini */}
            <div className="grid gap-6 xl:grid-cols-3">
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-brand-600" />
                      <span className="text-base font-semibold text-brand-900">Anomaly Breakdown</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Active unresolved flags by type</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[210px]" />
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <RePieChart>
                            <Pie data={ANOMALY_TYPES} dataKey="count" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                              {ANOMALY_TYPES.map((e, i) => (
                                <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                          {ANOMALY_TYPES.map((a) => (
                            <div key={a.type} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                                <span className="text-brand-700">{a.type}</span>
                              </div>
                              <span className="font-semibold text-brand-900">{a.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-brand-700" />
                      <span className="text-base font-semibold text-brand-900">Overtime Trend (6 Months)</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Approved vs pending OT hours</p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[210px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={OVERTIME_MONTHLY} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="approved" name="Approved" fill={CHART.dark} radius={[4, 4, 0, 0]} barSize={14} stackId="ot" />
                          <Bar dataKey="pending" name="Pending" fill={CHART.gold} radius={[0, 0, 0, 0]} barSize={14} stackId="ot" />
                          <Bar dataKey="rejected" name="Rejected" fill={CHART.rose} radius={[4, 4, 0, 0]} barSize={14} stackId="ot" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-brand-800" />
                      <span className="text-base font-semibold text-brand-900">Machine Status</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Biometric device connectivity</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {MACHINE_STATUS.slice(0, 6).map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-brand-200 px-3 py-2">
                        <div className="flex items-center gap-2">
                          {m.status === "online" ? (
                            <Wifi className="h-3.5 w-3.5 text-[#4A8C6E]" />
                          ) : m.status === "warning" ? (
                            <Wifi className="h-3.5 w-3.5 text-[#B28950]" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5 text-brand-500" />
                          )}
                          <div>
                            <div className="text-xs font-medium text-brand-900">{m.id}</div>
                            <div className="text-[10px] text-brand-600">{m.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={machineStatusColors[m.status as keyof typeof machineStatusColors]}>{m.status}</Badge>
                          <div className="text-[9px] text-brand-600 mt-0.5">{m.lastSync}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {/* ════════════════ MYTIME & TEAM ════════════════ */}
        {activeTab === "mytime" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">My Week – Planned vs Actual Hours</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Personal time log for current week</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={WEEKLY_HOURS_WORKED} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                      <Bar dataKey="planned" name="Planned hrs" fill={`${CHART.dark}50`} radius={[4, 4, 0, 0]} barSize={22} />
                      <Bar dataKey="actual" name="Actual hrs" fill={CHART.dark} radius={[4, 4, 0, 0]} barSize={22} />
                      <Line type="monotone" dataKey="ot" name="OT hrs" stroke={CHART.gold} strokeWidth={2.5} dot={{ r: 4, fill: CHART.rose }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Team Live View</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Current attendance status of your direct reports</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MY_TIME_TEAM.map((emp) => (
                    <div key={emp.name} className="flex items-center justify-between rounded-xl border border-brand-200 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-brand-900">{emp.name}</div>
                          <div className="text-[10px] text-brand-600">{emp.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {emp.ot > 0 && (
                          <span className="text-[10px] text-[#B28950] font-medium">+{emp.ot}h OT</span>
                        )}
                        <div className="text-right">
                          <Badge className={teamStatusColors[emp.status as keyof typeof teamStatusColors]}>{emp.status}</Badge>
                          <div className="text-[9px] text-brand-600 mt-0.5">{emp.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Team Attendance Radar</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Team A vs Team B – 5-axis performance metrics</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius={100} data={RADAR_TEAM_METRICS}>
                      <PolarGrid stroke={gridStroke} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: CHART.sage }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: CHART.sand }} />
                      <Radar name="Team A" dataKey="A" stroke={CHART.dark} fill={CHART.dark} fillOpacity={0.25} strokeWidth={2} />
                      <Radar name="Team B" dataKey="B" stroke={CHART.gold} fill={CHART.gold} fillOpacity={0.2} strokeWidth={2} />
                      <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">My Time Summary</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Month-to-date personal time statistics</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Days Present", value: "16", sub: "of 18 working days", color: CHART.dark },
                    { label: "Days Absent", value: "2", sub: "1 approved leave", color: CHART.rose },
                    { label: "Total Hours", value: "131h", sub: "planned 144h", color: CHART.gold },
                    { label: "Late Arrivals", value: "3", sub: "avg 12 min late", color: CHART.violet },
                    { label: "OT Hours (MTD)", value: "7.5h", sub: "all approved", color: CHART.sage },
                    { label: "Regularizations", value: "1", sub: "submitted", color: CHART.peach },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-brand-200 p-3">
                      <div className="text-xs text-brand-600">{item.label}</div>
                      <div className="mt-1 text-xl font-bold text-brand-900">{item.value}</div>
                      <div className="text-[10px] text-brand-500">{item.sub}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════ ROSTER & SHIFTS ════════════════ */}
        {activeTab === "roster" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Shift-wise Headcount This Week</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[
                        { day: "Mon", Morning: 510, Evening: 320, Night: 182, General: 230 },
                        { day: "Tue", Morning: 524, Evening: 308, Night: 190, General: 228 },
                        { day: "Wed", Morning: 498, Evening: 330, Night: 175, General: 225 },
                        { day: "Thu", Morning: 515, Evening: 315, Night: 188, General: 236 },
                        { day: "Fri", Morning: 512, Evening: 318, Night: 184, General: 233 },
                      ]}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                      <Bar dataKey="Morning" fill={CHART.dark} radius={[3, 3, 0, 0]} barSize={14} />
                      <Bar dataKey="Evening" fill={CHART.gold} radius={[3, 3, 0, 0]} barSize={14} />
                      <Bar dataKey="Night" fill={CHART.violet} radius={[3, 3, 0, 0]} barSize={14} />
                      <Bar dataKey="General" fill={CHART.sage} radius={[3, 3, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-brand-600" />
                    <span className="text-base font-semibold text-brand-900">Shift Definitions</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Morning (A)", time: "07:00 – 15:00", active: 512, color: CHART.dark },
                    { name: "Evening (B)", time: "15:00 – 23:00", active: 318, color: CHART.gold },
                    { name: "Night (C)", time: "23:00 – 07:00", active: 184, color: CHART.violet },
                    { name: "General", time: "09:00 – 17:00", active: 233, color: CHART.sage },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-xl border border-brand-200 p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                        <div>
                          <div className="text-sm font-medium text-brand-900">{s.name}</div>
                          <div className="text-[10px] text-brand-600">{s.time}</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-brand-900">{s.active}</span>
                    </div>
                  ))}
                  <button className="mt-2 w-full rounded-xl border border-brand-800 py-2 text-xs font-medium text-brand-800 hover:bg-brand-100 transition-colors">
                    Manage Shifts →
                  </button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Roster Coverage (6 Weeks)</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={ROSTER_COVERAGE} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="rosterGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.sage} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART.sage} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, ...tickStyle }} />
                      <YAxis domain={[94, 100]} tick={{ fontSize: 11, ...tickStyle }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                      <Area type="monotone" dataKey="coverage" stroke={CHART.sage} strokeWidth={3} fill="url(#rosterGrad)" dot={{ r: 4, fill: CHART.gold }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Dept-wise Shift Adherence %</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={[
                        { dept: "Operations", value: 96 },
                        { dept: "IT", value: 98 },
                        { dept: "Sales", value: 93 },
                        { dept: "Finance", value: 99 },
                        { dept: "HR", value: 97 },
                        { dept: "Admin", value: 100 },
                      ]}
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" domain={[85, 100]} tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                      <Bar dataKey="value" fill={CHART.dark} radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════ ANOMALIES & REGULARIZATION ════════════════ */}
        {activeTab === "anomalies" && (
          <div className="space-y-6">
            {/* Anomaly Heatmap — 6 departments × 7 days */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-800" />
                  <span className="text-base font-semibold text-brand-900">
                    Anomaly Heatmap — This Week
                  </span>
                </div>
                <p className="text-xs text-brand-700 mt-0.5">
                  Daily anomaly counts by department (darker = more attention required)
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const depts = ["Engineering", "HR", "Finance", "Operations", "Sales", "Factory Floor"];
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  const heatData: Record<string, number[]> = {
                    Engineering: [2, 1, 0, 3, 4, 0, 0],
                    HR: [0, 1, 0, 2, 1, 0, 0],
                    Finance: [1, 0, 0, 1, 2, 0, 0],
                    Operations: [3, 5, 4, 6, 7, 2, 1],
                    Sales: [1, 2, 3, 2, 4, 1, 0],
                    "Factory Floor": [6, 8, 5, 7, 9, 3, 0],
                  };
                  const cellClass = (n: number) => {
                    if (n === 0) return "bg-gray-50 text-gray-400";
                    if (n <= 2) return "bg-amber-100 text-amber-800";
                    if (n <= 5) return "bg-amber-300 text-amber-900";
                    return "bg-red-400 text-white font-bold";
                  };
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            <th className="text-left font-semibold text-brand-700 pb-2 pr-3">
                              Department
                            </th>
                            {days.map((d) => (
                              <th
                                key={d}
                                className="px-1 pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-brand-700"
                              >
                                {d}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {depts.map((dept) => (
                            <tr key={dept}>
                              <td className="py-1 pr-3 text-sm font-medium text-brand-900">
                                {dept}
                              </td>
                              {heatData[dept].map((count, i) => (
                                <td key={i} className="p-1">
                                  <div
                                    className={`flex h-10 w-full items-center justify-center rounded-md border border-white ${cellClass(count)}`}
                                  >
                                    {count}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Scale:</span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-gray-50 border border-gray-200" /> 0
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-amber-100" /> 1-2
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-amber-300" /> 3-5
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-red-400" /> 6+
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-brand-600" />
                    <span className="text-base font-semibold text-brand-900">Anomaly by Type</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ANOMALY_TYPES} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="type" tick={{ fontSize: 9, ...tickStyle }} axisLine={false} tickLine={false} angle={-10} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                        {ANOMALY_TYPES.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Regularization Queue</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Missing punches awaiting employee / HR action</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {REGULARIZATION_QUEUE.map((req) => (
                    <div key={req.name} className="flex items-center justify-between rounded-xl border border-brand-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
                          {req.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-brand-900">{req.name}</div>
                          <div className="text-[10px] text-brand-600">{req.dept} · {req.type} · {req.date}</div>
                        </div>
                      </div>
                      <Badge className={regStatusColors[req.status as keyof typeof regStatusColors]}>{req.status}</Badge>
                    </div>
                  ))}
                  <button className="mt-1 w-full rounded-xl border border-brand-800 py-2 text-xs font-medium text-brand-800 hover:bg-brand-100 transition-colors">
                    View All Regularizations →
                  </button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Dept-wise Anomaly Count</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      layout="vertical"
                      data={[
                        { dept: "Operations", anomalies: 24 },
                        { dept: "Sales", anomalies: 18 },
                        { dept: "IT", anomalies: 9 },
                        { dept: "Finance", anomalies: 6 },
                        { dept: "HR", anomalies: 3 },
                        { dept: "Admin", anomalies: 3 },
                      ]}
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="anomalies" fill={CHART.rose} radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Regularization Resolution Rate</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Monthly % of anomalies resolved</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                      data={[
                        { month: "Oct", rate: 78 },
                        { month: "Nov", rate: 82 },
                        { month: "Dec", rate: 85 },
                        { month: "Jan", rate: 80 },
                        { month: "Feb", rate: 88 },
                        { month: "Mar", rate: 91 },
                      ]}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, ...tickStyle }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 11, ...tickStyle }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="rate" stroke={CHART.dark} strokeWidth={3} dot={{ r: 4, fill: CHART.gold }} activeDot={{ r: 6, fill: CHART.rose }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════ OVERTIME ════════════════ */}
        {activeTab === "overtime" && (
          <div className="space-y-6">
            {/* OT KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "OT Hours This Month", value: "2,847h", sub: "+341 vs last month", color: CHART.dark },
                { label: "Avg OT per Employee", value: "2.28h", sub: "MTD average", color: CHART.violet },
                { label: "OT Cost Estimate", value: "PKR 2.1M", sub: "based on standard rate", color: CHART.gold },
                { label: "Approval Rate", value: "91%", sub: "47 pending, 55 rejected", color: CHART.sage },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-brand-300 bg-white p-5 shadow-md">
                  <div className="text-xs text-brand-600">{item.label}</div>
                  <div className="mt-1 text-2xl font-bold text-brand-900">{item.value}</div>
                  <div className="text-[11px] text-brand-500">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">OT Hours by Department (MTD)</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={DEPT_OT_HOURS} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} angle={-10} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="hours" fill={CHART.dark} radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Monthly OT Approved vs Pending</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={OVERTIME_MONTHLY} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="otApprGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.dark} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART.dark} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="otPendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.gold} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART.gold} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, ...tickStyle }} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                      <Area type="monotone" dataKey="approved" name="Approved" stroke={CHART.dark} fill="url(#otApprGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="pending" name="Pending" stroke={CHART.gold} fill="url(#otPendGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-brand-800" />
                  <span className="text-base font-semibold text-brand-900">Recent OT Requests</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { name: "Ali Hassan", dept: "Operations", hours: 4, date: "Mar 17", status: "Approved" },
                    { name: "Mehwish Iqbal", dept: "IT", hours: 2.5, date: "Mar 17", status: "Pending" },
                    { name: "Rashid Khan", dept: "Sales", hours: 3, date: "Mar 16", status: "Approved" },
                    { name: "Sara Butt", dept: "Finance", hours: 1.5, date: "Mar 16", status: "Rejected" },
                    { name: "Imran Siddiqui", dept: "Admin", hours: 2, date: "Mar 15", status: "Approved" },
                    { name: "Nazia Ahmed", dept: "HR", hours: 1, date: "Mar 15", status: "Pending" },
                  ].map((r) => (
                    <div key={r.name} className="rounded-xl border border-brand-200 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-brand-900">{r.name}</div>
                          <div className="text-[10px] text-brand-600">{r.dept} · {r.date}</div>
                        </div>
                        <Badge
                          className={
                            r.status === "Approved"
                              ? "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40"
                              : r.status === "Rejected"
                              ? "bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40"
                              : "bg-brand-100 text-brand-800 border-brand-300"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-lg font-bold text-brand-900">{r.hours}h</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════════════ MACHINE INTEGRATION ════════════════ */}
        {activeTab === "machines" && (
          <div className="space-y-6">
            {/* Machine KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Devices", value: "38", sub: "across all locations", icon: Cpu },
                { label: "Online", value: "34", sub: "89.5% uptime today", icon: Wifi },
                { label: "Offline / Warning", value: "4", sub: "3 offline, 1 warning", icon: WifiOff },
                { label: "Total Punches Today", value: "2,184", sub: "across all machines", icon: Activity },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-brand-300 bg-white p-5 shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                    <item.icon className="h-5 w-5 text-brand-800" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-900">{item.value}</div>
                    <div className="text-xs text-brand-600">{item.label}</div>
                    <div className="text-[10px] text-brand-400">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">All Machine Status</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    ...MACHINE_STATUS,
                    { id: "M-19", location: "Factory Floor 2", status: "online", lastSync: "4m ago", punches: 88 },
                    { id: "M-22", location: "Regional – Faisalabad", status: "offline", lastSync: "6h ago", punches: 0 },
                  ].map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-brand-200 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {m.status === "online" ? (
                          <Wifi className="h-4 w-4 text-[#4A8C6E]" />
                        ) : m.status === "warning" ? (
                          <Wifi className="h-4 w-4 text-[#B28950]" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-brand-400" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-brand-900">{m.id} – {m.location}</div>
                          <div className="text-[10px] text-brand-600">Last sync: {m.lastSync} · {m.punches} punches</div>
                        </div>
                      </div>
                      <Badge className={machineStatusColors[m.status as keyof typeof machineStatusColors]}>{m.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-700" />
                    <span className="text-base font-semibold text-brand-900">Punch Volume per Machine</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      layout="vertical"
                      data={[
                        { machine: "M-01 Gate A", punches: 412 },
                        { machine: "M-02 Factory", punches: 318 },
                        { machine: "M-03 Admin", punches: 201 },
                        { machine: "M-15 Lahore", punches: 106 },
                        { machine: "M-19 Floor 2", punches: 88 },
                        { machine: "M-12 Karachi", punches: 47 },
                        { machine: "M-08 Whouse", punches: 0 },
                        { machine: "M-22 Fsld", punches: 0 },
                      ]}
                      margin={{ top: 5, right: 20, left: 75, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="machine" type="category" tick={{ fontSize: 9, ...tickStyle }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="punches" radius={[0, 4, 4, 0]} barSize={12}>
                        {[412, 318, 201, 106, 88, 47, 0, 0].map((v, i) => (
                          <Cell key={i} fill={v === 0 ? CHART.rose : CHART.dark} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-700" />
                  <span className="text-base font-semibold text-brand-900">Sync Success Rate (Last 7 Days)</span>
                </div>
                <p className="text-xs text-brand-700 mt-0.5">Daily percentage of successful device sync operations</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={[
                      { day: "Mar 12", rate: 97 },
                      { day: "Mar 13", rate: 95 },
                      { day: "Mar 14", rate: 98 },
                      { day: "Mar 15", rate: 94 },
                      { day: "Mar 16", rate: 97 },
                      { day: "Mar 17", rate: 96 },
                      { day: "Mar 18", rate: 89 },
                    ]}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="syncGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART.violet} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART.violet} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, ...tickStyle }} />
                    <YAxis domain={[85, 100]} tick={{ fontSize: 11, ...tickStyle }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                    <Area type="monotone" dataKey="rate" stroke={CHART.violet} fill="url(#syncGrad)" strokeWidth={2.5} dot={{ r: 4, fill: CHART.gold }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
