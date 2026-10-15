"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Users, Calendar, AlertTriangle, Activity,
  Network, SlidersHorizontal, UserCheck, ClipboardList,
  ArrowUpRight, ArrowDownRight, Zap, Briefcase, Bot,
  PieChart as PieIcon, Settings, Star, RefreshCw, Shield,
  CheckSquare, FileText, BarChart2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS — same palette as TimeSyncDashboard / PayrollDashboard
// ─────────────────────────────────────────────────────────────────────────────
const CHART = {
  navy:   "#322E53",
  dark:   "#322E53",
  mid:    "#49426E",
  light:  "#5c5490",
  peach:  "#EEC293",
  salmon: "#F3AB9D",
  pale:   "#f7c9b9",
  bg:     "#F5F4F8",
  sage:   "#49426E",
  gold:   "#EEC293",
  rose:   "#F3AB9D",
  sand:   "#f7c9b9",
  violet: "#5c5490",
  mint:   "#49426E",
};

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART.sand}`,
  backgroundColor: "#fff",
};
const gridStroke = `${CHART.sand}60`;
const tickStyle  = { fill: CHART.sage };

const statusStyles: Record<string, string> = {
  Approved:  "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  Pending:   "bg-brand-100 text-brand-800 border-brand-300",
  Rejected:  "bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40",
  "On Leave":"bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40",
  Present:   "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  OD:        "bg-brand-100 text-brand-800 border-brand-300",
  Active:    "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  Draft:     "bg-brand-100 text-brand-800 border-brand-300",
  Paused:    "bg-[#F3AB9D]/20 text-[#7A3A2A] border-[#F3AB9D]/40",
  Done:      "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  Credited:  "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
};

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_TREND = [
  { month: "Apr", approved: 310, pending: 45, rejected: 12 },
  { month: "May", approved: 280, pending: 38, rejected: 8  },
  { month: "Jun", approved: 320, pending: 52, rejected: 15 },
  { month: "Jul", approved: 420, pending: 60, rejected: 18 },
  { month: "Aug", approved: 395, pending: 48, rejected: 10 },
  { month: "Sep", approved: 370, pending: 42, rejected: 9  },
  { month: "Oct", approved: 340, pending: 39, rejected: 11 },
  { month: "Nov", approved: 290, pending: 35, rejected: 7  },
  { month: "Dec", approved: 380, pending: 50, rejected: 13 },
  { month: "Jan", approved: 410, pending: 55, rejected: 16 },
  { month: "Feb", approved: 360, pending: 42, rejected: 10 },
  { month: "Mar", approved: 390, pending: 48, rejected: 12 },
];

const LEAVE_TYPE_PIE = [
  { name: "Annual Leave",   value: 38.5, fill: CHART.dark   },
  { name: "Sick Leave",     value: 22.1, fill: CHART.violet },
  { name: "Casual Leave",   value: 17.3, fill: CHART.sage   },
  { name: "Comp-Off",       value: 11.2, fill: CHART.gold   },
  { name: "Maternity/Pat",  value:  6.4, fill: CHART.rose   },
  { name: "LWP",            value:  4.5, fill: CHART.mint   },
];

const DEPT_DATA = [
  { dept: "Engg",    taken: 980, entitlement: 1260, headcount: 42 },
  { dept: "Product", taken: 420, entitlement: 540,  headcount: 18 },
  { dept: "Sales",   taken: 760, entitlement: 945,  headcount: 35 },
  { dept: "Mktg",    taken: 510, entitlement: 630,  headcount: 22 },
  { dept: "Finance", taken: 310, entitlement: 390,  headcount: 15 },
  { dept: "HR",      taken: 230, entitlement: 288,  headcount: 12 },
  { dept: "Design",  taken: 350, entitlement: 432,  headcount: 16 },
];

const RADIAL_HEALTH = [
  { name: "Approval Rate",    value: 94, fill: CHART.sage   },
  { name: "Balance Accuracy", value: 99, fill: CHART.dark   },
  { name: "Policy Coverage",  value: 100,fill: CHART.violet },
  { name: "OD Compliance",    value: 82, fill: CHART.gold   },
];

interface TeamMember {
  id: string; name: string; dept: string; initials: string;
  status: "Present" | "On Leave" | "OD" | "Pending";
  dates: string; used: number; total: number;
}

const TEAM: TeamMember[] = [
  { id:"E01", name:"Zara Ali",       dept:"Engineering", initials:"ZA", status:"On Leave", dates:"Apr 14–16", used:14, total:21 },
  { id:"E02", name:"Bilal Hassan",   dept:"Product",     initials:"BH", status:"OD",       dates:"Apr 21–22", used:8,  total:21 },
  { id:"E03", name:"Sana Mehmood",   dept:"Sales",       initials:"SM", status:"Present",  dates:"—",         used:5,  total:21 },
  { id:"E04", name:"Umar Farooq",    dept:"HR",          initials:"UF", status:"Pending",  dates:"Apr 28–29", used:19, total:21 },
  { id:"E05", name:"Hira Khan",      dept:"Design",      initials:"HK", status:"Present",  dates:"—",         used:3,  total:21 },
  { id:"E06", name:"Danish Raza",    dept:"Finance",     initials:"DR", status:"Pending",  dates:"Apr 30",    used:11, total:21 },
  { id:"E07", name:"Nadia Iqbal",    dept:"Engineering", initials:"NI", status:"Present",  dates:"—",         used:7,  total:21 },
  { id:"E08", name:"Faraz Ahmed",    dept:"Marketing",   initials:"FA", status:"On Leave", dates:"Apr 19–20", used:16, total:21 },
];

const APPROVALS = [
  { id:"A1", name:"Umar Farooq",  type:"Annual Leave",  dates:"Apr 28–May 2", days:5, urgent:true,  initials:"UF" },
  { id:"A2", name:"Danish Raza",  type:"Sick Leave",    dates:"Apr 30",       days:1, urgent:false, initials:"DR" },
  { id:"A3", name:"Nadia Iqbal",  type:"Casual Leave",  dates:"May 5–6",      days:2, urgent:false, initials:"NI" },
  { id:"A4", name:"Faraz Ahmed",  type:"Comp-Off",      dates:"May 12",       days:1, urgent:false, initials:"FA" },
  { id:"A5", name:"Rubab Nasir",  type:"Annual Leave",  dates:"May 19–23",    days:5, urgent:true,  initials:"RN" },
  { id:"A6", name:"Kamran Shah",  type:"Earned Leave",  dates:"May 26–30",    days:5, urgent:false, initials:"KS" },
];

const LEAVE_TYPES_POLICY = [
  { name:"Annual Leave",  days:21,    accrual:"Monthly",    color: CHART.dark   },
  { name:"Sick Leave",    days:12,    accrual:"Upfront",    color: CHART.violet },
  { name:"Casual Leave",  days:8,     accrual:"Upfront",    color: CHART.sage   },
  { name:"Comp-Off",      days:"Earned", accrual:"Per credit", color: CHART.gold},
  { name:"Maternity",     days:182,   accrual:"Upfront",    color: CHART.rose   },
  { name:"LWP",           days:"∞",   accrual:"N/A",        color: CHART.mint   },
];

const COMPLIANCE = [
  { task:"Holiday Calendar Published",       due:"Apr 01", done: true  },
  { task:"PF/ESI Leave Submission",          due:"Apr 15", done: true  },
  { task:"Q4 Accrual Reconciliation",        due:"Apr 20", done: true  },
  { task:"Year-End Carry Forward Run",       due:"Apr 30", done: false },
  { task:"Form 16 – Leave Encashment",       due:"May 15", done: false },
  { task:"Annual Leave Audit Report",        due:"May 31", done: false },
];

const MY_BALANCES = [
  { type:"Annual",  days:12, total:21, color: CHART.dark   },
  { type:"Sick",    days:6,  total:12, color: CHART.violet },
  { type:"Casual",  days:3,  total:8,  color: CHART.sage   },
  { type:"Comp-Off",days:2,  total:5,  color: CHART.gold   },
  { type:"Earned",  days:8,  total:15, color: CHART.rose   },
  { type:"LWP",     days:0,  total:"∞",color: CHART.mint   },
];

const MY_REQUESTS = [
  { type:"Annual",  dates:"Apr 14–16", days:3, status:"Approved" as const },
  { type:"Sick",    dates:"Mar 3",     days:1, status:"Approved" as const },
  { type:"Casual",  dates:"Apr 28–29", days:2, status:"Pending"  as const },
  { type:"Comp-Off",dates:"Apr 21",    days:1, status:"Approved" as const },
  { type:"Annual",  dates:"May 5–9",   days:5, status:"Pending"  as const },
];

const AI_ANOMALIES = [
  { sev:"High",   msg:"Umar Farooq: 4 Monday absences in 6 weeks — pattern detected",              color: CHART.rose   },
  { sev:"Medium", msg:"Finance dept utilisation 94% — risk of excess carry-forward at year-end",   color: CHART.gold   },
  { sev:"Medium", msg:"3 employees have >20 days remaining with no upcoming requests",              color: CHART.gold   },
  { sev:"Low",    msg:"Sick leave spike in Engineering — 18 days this month vs 9 avg",             color: CHART.sage   },
  { sev:"Info",   msg:"OD requests up 40% this quarter — consider reviewing OD policy",            color: CHART.violet },
];

const COVERAGE_RISK = [
  { dept:"Engineering", risk:78 }, { dept:"Sales",    risk:55 },
  { dept:"Product",     risk:30 }, { dept:"Finance",  risk:88 },
  { dept:"HR",          risk:15 }, { dept:"Design",   risk:42 },
];

const REPORTS_LIST = [
  { title:"Leave Register",     desc:"Full register all employees",      icon:"📋", size:"3.1 MB", gradient:"from-[#443763] to-[#5c5490]" },
  { title:"Balance Report",     desc:"Remaining balances by leave type", icon:"📊", size:"1.4 MB", gradient:"from-[#322E53] to-[#49426E]" },
  { title:"Encashment Sheet",   desc:"Payroll liquidation summary",      icon:"💰", size:"0.9 MB", gradient:"from-[#EEC293] to-[#DEAD68]" },
  { title:"Accrual Audit",      desc:"Month-wise accrual log",           icon:"🔍", size:"2.2 MB", gradient:"from-[#443763] to-[#5c5490]" },
  { title:"OD Travel Report",   desc:"Official duty & travel analytics", icon:"✈️", size:"1.8 MB", gradient:"from-[#49426E] to-[#49426E]" },
  { title:"Anomaly Report",     desc:"AI-flagged patterns & risks",      icon:"⚠️", size:"0.7 MB", gradient:"from-[#6D2A2A] to-[#F3AB9D]" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS & SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function MiniBars({ heights }: { heights: number[] }) {
  return (
    <div className="mt-3 flex gap-0.5 items-end" style={{ height: 18 }}>
      {heights.map((h, i) => (
        <div key={i} className="w-1.5 rounded-full bg-white/30" style={{ height: `${h * 0.18}px` }} />
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sand-200 shadow-lg rounded-xl p-3 text-xs" style={tooltipStyle}>
      <p className="font-bold text-brand-900 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-brand-700 capitalize">{p.name}</span>
          </div>
          <span className="font-semibold text-brand-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active ? "bg-brand-800 text-white shadow" : "text-brand-700 hover:bg-brand-100"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressBar({ label, value, color, delay = 0 }: {
  label: string; value: number; color: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-brand-600 font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.15, duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
}

function KpiCard({
  label, value, delta, icon: Icon, bg, delay,
}: {
  label: string; value: string; delta: string;
  icon: React.ElementType; bg: string; delay: number;
}) {
  const isPositive = !delta.startsWith("-");
  const barHeights = [40, 65, 80, 55, 70, 90, 60];
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className={`p-5 text-white ${bg}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Icon className="h-5 w-5" />
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.25, type: "spring", stiffness: 300 }}
            className={`text-xs px-2 py-0.5 rounded-full text-white ${isPositive ? "bg-white/20" : "bg-black/20"}`}
          >
            {delta}
          </motion.span>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.15 }}
          className="text-2xl font-bold"
        >
          {value}
        </motion.p>
        <p className="text-white/75 text-xs font-medium mt-1">{label}</p>
        <MiniBars heights={barHeights} />
        <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-white/10 to-transparent" />
      </div>
    </motion.div>
  );
}

// Avatar initials circle
function Avatar({ initials, index }: { initials: string; index: number }) {
  const bgs = [
    "bg-gradient-to-r from-[#443763] to-[#5c5490]",
    "bg-gradient-to-r from-[#49426E] to-[#49426E]",
    "bg-gradient-to-r from-[#EEC293] to-[#DEAD68]",
    "bg-gradient-to-r from-[#322E53] to-[#5c5490]",
    "bg-gradient-to-r from-[#F3AB9D] to-[#F3AB9D]",
    "bg-gradient-to-r from-[#6D2A2A] to-[#A34141]",
  ];
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm ${bgs[index % bgs.length]}`}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function LeaveEaseDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "myleave" | "team" | "approvals" | "policy" | "ai" | "reports"
  >("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "On Leave" | "OD" | "Pending">("All");

  const filteredTeam = TEAM.filter(m =>
    (statusFilter === "All" || m.status === statusFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.dept.toLowerCase().includes(search.toLowerCase()))
  );

  const kpiGradients = [
    "bg-linear-to-br from-[#443763] via-[#5c5490] to-[#A085E0]",
    "bg-linear-to-br from-[#49426E] via-[#49426E] to-[#CEE7BE]",
    "bg-linear-to-br from-[#EEC293] via-[#DEAD68] to-[#FFC574]",
    "bg-linear-to-br from-[#322E53] via-[#5c5490] to-[#A085E0]",
    "bg-linear-to-br from-[#F3AB9D] via-[#F3AB9D] to-[#FCA6A2]",
    "bg-linear-to-br from-[#6D2A2A] via-[#A34141] to-[#E78B8B]",
  ];

  const onLeaveCount  = TEAM.filter(m => m.status === "On Leave").length;
  const pendingCount  = APPROVALS.length;
  const presentCount  = TEAM.filter(m => m.status === "Present").length;

  return (
    <div className="min-h-screen bg-white p-6 md:p-8" style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900">LeaveEase</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-sm text-brand-700">Synced · Apr 6, 2025 at 09:00 AM</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
              {presentCount} Present
            </Badge>
            {onLeaveCount > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200">{onLeaveCount} On Leave</Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">{pendingCount} Pending Approvals</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <select className="bg-white border border-brand-200 text-brand-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 shadow-sm">
            {["April 2025", "March 2025", "February 2025"].map(p => <option key={p}>{p}</option>)}
          </select>
          <Button variant="outline" className="border-brand-800 text-brand-800 hover:bg-brand-100">↓ Export</Button>
          <Button className="bg-gradient-to-r from-[#443763] to-[#5c5490] text-white shadow-md hover:shadow-lg transition-shadow">
            + Apply Leave
          </Button>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Employees"   value="218"    delta="+5"      icon={Users}        bg={kpiGradients[0]} delay={0.05} />
        <KpiCard label="On Leave Today"    value="14"     delta="-2"      icon={Calendar}     bg={kpiGradients[1]} delay={0.10} />
        <KpiCard label="Avg Days Used"     value="32.4"   delta="+2.1"    icon={Activity}     bg={kpiGradients[2]} delay={0.15} />
        <KpiCard label="Approval Rate"     value="94.2%"  delta="+0.8%"   icon={CheckSquare}  bg={kpiGradients[3]} delay={0.20} />
        <KpiCard label="Pending OD"        value="8"      delta="+3"      icon={Briefcase}    bg={kpiGradients[4]} delay={0.25} />
        <KpiCard label="Encashment"        value="₨12.4L" delta="+₨1.2L"  icon={AlertTriangle}bg={kpiGradients[5]} delay={0.30} />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="flex flex-wrap gap-1 rounded-xl bg-brand-100 p-1 w-fit mb-7"
      >
        {([
          ["overview","Overview"],["myleave","My Leave"],["team","Team"],
          ["approvals","Approvals"],["policy","Policy Studio"],["ai","AI Assistant"],["reports","Reports"],
        ] as const).map(([id, label]) => (
          <TabButton key={id} active={activeTab === id} onClick={() => setActiveTab(id)}>{label}</TabButton>
        ))}
      </motion.div>

      {/* ── Tab Content ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">

            {/* Row 1: Trend + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Monthly Leave Trend</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Approved · Pending · Rejected — 12-month view</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={MONTHLY_TREND} margin={{ top:4,right:4,left:-20,bottom:0 }}>
                      <defs>
                        {[["approvedGrad",CHART.dark],["pendingGrad",CHART.gold],["rejectedGrad",CHART.rose]].map(([id,c])=>(
                          <linearGradient key={id as string} id={id as string} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c as string} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={c as string} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize:11,...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11,...tickStyle }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={v=><span className="text-xs text-brand-600 capitalize">{v}</span>} />
                      <Area type="monotone" dataKey="approved" stroke={CHART.dark}  strokeWidth={2.5} fill="url(#approvedGrad)" dot={false} />
                      <Area type="monotone" dataKey="pending"  stroke={CHART.gold}  strokeWidth={2}   fill="url(#pendingGrad)"  dot={false} />
                      <Area type="monotone" dataKey="rejected" stroke={CHART.rose}  strokeWidth={1.5} fill="url(#rejectedGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-brand-200">
                    {[
                      { label:"Total Approved",  val:"3,944", color:CHART.dark   },
                      { label:"Avg Monthly",     val:"328.7", color:CHART.sage   },
                      { label:"Rejection Rate",  val:"3.1%",  color:CHART.rose   },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-base font-black" style={{ color:s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><PieIcon className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Leave Type Mix</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">By category · Q4 FY 2025</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={LEAVE_TYPE_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                        {LEAVE_TYPE_PIE.map((d,i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v:unknown) => [`${v}%`,""]} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {LEAVE_TYPE_PIE.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:d.fill }} />
                        <span className="text-brand-600 text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-brand-900 text-xs font-bold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Dept Bar + Radial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Department Leave Breakdown</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Days taken vs. total entitlement</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={DEPT_DATA} margin={{ top:4,right:4,left:-20,bottom:0 }} barCategoryGap="32%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize:10,...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11,...tickStyle }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}d`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v:unknown) => [`${v} days`,""]} />
                      <Legend formatter={v=><span className="text-xs text-brand-600 capitalize">{v}</span>} />
                      <Bar dataKey="entitlement" fill={CHART.mint}  radius={[6,6,0,0]} name="Entitlement" />
                      <Bar dataKey="taken"        fill={CHART.dark}  radius={[6,6,0,0]} name="Taken" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-brand-200">
                    {[
                      { label:"Departments",    val:"7",    color:CHART.violet },
                      { label:"Total Taken",    val:"3,560",color:CHART.dark   },
                      { label:"Entitlement",    val:"4,485",color:CHART.sage   },
                      { label:"Utilisation",    val:"79.4%",color:CHART.gold   },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-sm font-black" style={{ color:s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Leave Health</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Current cycle metrics</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={RADIAL_HEALTH} startAngle={90} endAngle={-270}>
                      <RadialBar {...({ minAngle:15 } as any)} dataKey="value" cornerRadius={6} background={{ fill:"#f1f5f9" }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v:unknown) => [`${v}%`,""]} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5 mt-2">
                    {RADIAL_HEALTH.map(d => (
                      <div key={d.name} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor:d.fill }} />
                        <span className="text-brand-600 text-xs flex-1">{d.name}</span>
                        <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor:d.fill }}
                            initial={{ width:0 }} animate={{ width:`${d.value}%` }} transition={{ delay:0.8,duration:0.75 }} />
                        </div>
                        <span className="text-brand-900 text-xs font-bold w-8 text-right">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Compliance + Health Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Compliance Checklist</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Statutory & internal obligations · Q1 FY 2026</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMPLIANCE.map((item, i) => (
                      <motion.div key={item.task}
                        initial={{ opacity:0,x:-14 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.1*i+0.3 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          item.done ? "border-emerald-100 bg-emerald-50/60" : "border-brand-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          item.done ? "bg-emerald-500 text-white" : "bg-white border-2 border-brand-200 text-brand-400"
                        }`}>{item.done ? "✓" : ""}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${item.done ? "text-brand-400 line-through" : "text-brand-900"}`}>{item.task}</p>
                          <p className="text-xs text-brand-500 mt-0.5">Due: {item.due}</p>
                        </div>
                        {!item.done && (
                          <Button size="sm" className="bg-gradient-to-r from-[#443763] to-[#5c5490] text-white text-xs px-2 py-1 h-auto">Action</Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Cycle KPIs</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Real-time performance indicators</p>
                </CardHeader>
                <CardContent>
                  <ProgressBar label="On-Time Approval Rate" value={94} color={CHART.sage}   delay={0.1} />
                  <ProgressBar label="Balance Accuracy"      value={99} color={CHART.dark}   delay={0.2} />
                  <ProgressBar label="Policy Coverage"       value={100}color={CHART.violet} delay={0.3} />
                  <ProgressBar label="Encashment Processed"  value={79} color={CHART.gold}   delay={0.4} />
                  <ProgressBar label="OD Compliance"         value={82} color={CHART.rose}   delay={0.5} />
                  <div className="mt-6 pt-5 border-t border-brand-200">
                    <p className="text-xs text-brand-500 font-semibold uppercase tracking-wider mb-3">Comp-Off Summary</p>
                    {[
                      { label:"Credits Earned",  val:"185 days", color:CHART.gold   },
                      { label:"Redeemed",         val:"130 days", color:CHART.violet },
                      { label:"Expiring Soon",    val:"22 days",  color:CHART.rose   },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center mb-2">
                        <span className="text-xs text-brand-600">{s.label}</span>
                        <span className="text-xs font-bold" style={{ color:s.color }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ════════════ MY LEAVE ════════════ */}
        {activeTab === "myleave" && (
          <motion.div key="myleave" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            {/* Balance tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {MY_BALANCES.map((b,i) => (
                <motion.div key={b.type} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}
                  className="rounded-2xl p-5 border border-brand-200 bg-brand-50 text-center">
                  <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">{b.type}</p>
                  <p className="text-3xl font-black" style={{ color:b.color }}>{b.days}</p>
                  <p className="text-xs text-brand-500 mt-1">of {b.total} days</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Requests */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">My Recent Requests</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Latest 5 leave applications</p>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-200">
                        {["Type","Dates","Days","Status"].map(h=>(
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-brand-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MY_REQUESTS.map((r,i) => (
                        <motion.tr key={i} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                          className="border-b border-brand-100 hover:bg-brand-50/80 transition-colors">
                          <td className="px-5 py-3 text-sm font-semibold text-brand-900">{r.type}</td>
                          <td className="px-5 py-3 text-sm text-brand-700">{r.dates}</td>
                          <td className="px-5 py-3 text-sm text-brand-700">{r.days}d</td>
                          <td className="px-5 py-3"><Badge className={statusStyles[r.status]}>{r.status}</Badge></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* My Rewards */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">My Rewards & Incentives</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Earned credits this fiscal year</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label:"Points Earned", val:"450",      color:CHART.gold   },
                      { label:"Perfect Months",val:"3",        color:CHART.dark   },
                      { label:"Streak",        val:"90 days",  color:CHART.violet },
                    ].map(s=>(
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-base font-black" style={{ color:s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    { month:"March",   reason:"Zero Absence",       pts:150, status:"Credited" as const },
                    { month:"February",reason:"Perfect Attendance",  pts:200, status:"Credited" as const },
                    { month:"January", reason:"No LWP",              pts:100, status:"Credited" as const },
                  ].map((r,i)=>(
                    <motion.div key={i} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.07 }}
                      className="flex items-center justify-between py-3 border-b border-brand-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{r.month}</p>
                        <p className="text-xs text-brand-500">{r.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color:CHART.gold }}>+{r.pts} pts</span>
                        <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ════════════ TEAM ════════════ */}
        {activeTab === "team" && (
          <motion.div key="team" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:"Total Team",  val:TEAM.length,                                color:CHART.dark,   sub:"members" },
                { label:"Present",     val:TEAM.filter(m=>m.status==="Present").length, color:CHART.sage,   sub:"today" },
                { label:"On Leave",    val:TEAM.filter(m=>m.status==="On Leave").length,color:CHART.rose,   sub:"away" },
                { label:"Pending",     val:TEAM.filter(m=>m.status==="Pending").length, color:CHART.gold,   sub:"awaiting" },
              ].map((s,i)=>(
                <motion.div key={s.label} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}
                  className="rounded-2xl p-5 border border-brand-200 bg-brand-50">
                  <p className="text-3xl font-black" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">{s.label}</p>
                  <p className="text-xs text-brand-600">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Team Leave Calendar</span></div>
                    <p className="text-xs text-brand-700 mt-0.5">Who's away · who's on OD · April 2025</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 text-sm">🔍</span>
                      <input type="text" placeholder="Search member…" value={search} onChange={e=>setSearch(e.target.value)}
                        className="bg-white border border-brand-200 text-brand-700 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-brand-300 w-44" />
                    </div>
                    <div className="flex bg-brand-100 rounded-xl p-0.5 gap-0.5">
                      {(["All","Present","On Leave","OD","Pending"] as const).map(s=>(
                        <button key={s} onClick={()=>setStatusFilter(s)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter===s?"bg-brand-800 text-white shadow":"text-brand-700 hover:bg-brand-200"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-200">
                        {["Member","Department","Status","Dates","Used / Total","Balance"].map(h=>(
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-brand-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredTeam.map((m,i)=>(
                          <motion.tr key={m.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0 }} transition={{ delay:i*0.04 }}
                            className="border-b border-brand-100 hover:bg-brand-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar initials={m.initials} index={i} />
                                <div><p className="text-brand-900 text-sm font-semibold">{m.name}</p><p className="text-brand-500 text-xs">{m.id}</p></div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-brand-700 text-sm">{m.dept}</td>
                            <td className="px-5 py-4"><Badge className={statusStyles[m.status]}>{m.status}</Badge></td>
                            <td className="px-5 py-4 text-brand-500 text-sm">{m.dates}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden w-20">
                                  <div className="h-full rounded-full" style={{
                                    width:`${Math.round(m.used/m.total*100)}%`,
                                    backgroundColor: m.used/m.total > 0.8 ? CHART.rose : m.used/m.total > 0.6 ? CHART.gold : CHART.sage
                                  }} />
                                </div>
                                <span className="text-xs text-brand-700 font-semibold">{m.used}/{m.total}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-bold" style={{ color: m.total - m.used < 5 ? CHART.rose : CHART.sage }}>
                                {m.total - m.used} days
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {filteredTeam.length === 0 && (
                    <div className="py-16 text-center text-brand-500 text-sm">No members match your filter.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ════════════ APPROVALS ════════════ */}
        {activeTab === "approvals" && (
          <motion.div key="approvals" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:"Pending Inbox",     val:APPROVALS.length,  color:CHART.gold,   sub:"action required" },
                { label:"Avg Approval Time", val:"18h",             color:CHART.dark,   sub:"rolling 30d" },
                { label:"Within SLA",        val:"91%",             color:CHART.sage,   sub:"this month" },
                { label:"Escalated",         val:"3",               color:CHART.rose,   sub:"overdue" },
              ].map((s,i)=>(
                <motion.div key={s.label} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}
                  className="rounded-2xl p-5 border border-brand-200 bg-brand-50">
                  <p className="text-3xl font-black" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">{s.label}</p>
                  <p className="text-xs text-brand-600">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approvals Inbox */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Approvals Inbox</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Sorted by urgency · action required</p>
                </CardHeader>
                <CardContent className="p-0">
                  {APPROVALS.map((a,i)=>(
                    <motion.div key={a.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                      className="flex items-center justify-between gap-4 px-5 py-4 border-b border-brand-100 hover:bg-brand-50/80 transition-colors last:border-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar initials={a.initials} index={i} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-brand-900 text-sm font-semibold">{a.name}</p>
                            {a.urgent && <Badge className="bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40 text-xs">Urgent</Badge>}
                          </div>
                          <p className="text-brand-500 text-xs">{a.type} · {a.dates} · {a.days}d</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" className="bg-gradient-to-r from-[#4A8C6E] to-[#52B788] text-white text-xs px-3 py-1 h-auto">✓ Approve</Button>
                        <Button size="sm" variant="outline" className="border-brand-200 text-brand-600 text-xs px-3 py-1 h-auto hover:bg-red-50 hover:border-red-200">✗</Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                {/* Delegations */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Delegation Assignments</span></div>
                    <p className="text-xs text-brand-700 mt-0.5">Active approval delegates</p>
                  </CardHeader>
                  <CardContent>
                    {[
                      { from:"Zaid Farooq",  to:"Hira Khan",   till:"Apr 30", type:"All Requests" },
                      { from:"Admin Khan",   to:"Danish Raza", till:"May 15", type:"Encashment"   },
                      { from:"Sana Mehmood", to:"Bilal Hassan", till:"Apr 20", type:"Comp-Off"    },
                    ].map((d,i)=>(
                      <motion.div key={i} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.07 }}
                        className="flex items-center justify-between py-3 border-b border-brand-100 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-brand-900">{d.from} → {d.to}</p>
                          <p className="text-xs text-brand-500">Till {d.till}</p>
                        </div>
                        <Badge className="bg-brand-100 text-brand-800 border-brand-300">{d.type}</Badge>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* SLA Monitor */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">SLA Monitor</span></div>
                    <p className="text-xs text-brand-700 mt-0.5">Approval time performance · 30 days</p>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar label="Approved < 24h"   value={78} color={CHART.sage}   delay={0.1} />
                    <ProgressBar label="Approved < 48h"   value={91} color={CHART.dark}   delay={0.2} />
                    <ProgressBar label="Auto-Approved"    value={24} color={CHART.violet} delay={0.3} />
                    <ProgressBar label="Escalation Rate"  value={8}  color={CHART.rose}   delay={0.4} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════ POLICY STUDIO ════════════ */}
        {activeTab === "policy" && (
          <motion.div key="policy" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leave Types */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Leave Types</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Configured leave policies</p>
                </CardHeader>
                <CardContent>
                  {LEAVE_TYPES_POLICY.map((t,i)=>(
                    <motion.div key={t.name} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                      className="flex items-center justify-between py-3 border-b border-brand-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 rounded-full flex-shrink-0" style={{ backgroundColor:t.color }} />
                        <div>
                          <p className="text-sm font-semibold text-brand-900">{t.name}</p>
                          <p className="text-xs text-brand-500">{t.accrual}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color:t.color }}>{t.days}d</span>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Accrual Rules */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Accrual Rules</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Active schedules & run status</p>
                </CardHeader>
                <CardContent>
                  {[
                    { lt:"Annual Leave",  rate:"1.75d/month",   grp:"All Staff",   status:"Active" as const },
                    { lt:"Earned Leave",  rate:"Quarterly",      grp:"Confirmed",   status:"Active" as const },
                    { lt:"Comp-Off",      rate:"Per OT credit",  grp:"Non-Mgmt",    status:"Active" as const },
                    { lt:"Sick Leave",    rate:"Upfront",        grp:"All Staff",   status:"Active" as const },
                    { lt:"Maternity",     rate:"Upfront",        grp:"Eligible",    status:"Paused" as const },
                  ].map((r,i)=>(
                    <motion.div key={r.lt} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                      className={`p-3 rounded-xl border mb-2 transition-all ${r.status==="Active"?"border-emerald-100 bg-emerald-50/40":"border-brand-200 bg-brand-50"}`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-brand-900">{r.lt}</p>
                        <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                      </div>
                      <p className="text-xs text-brand-500 mt-1">{r.rate} · {r.grp}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Blackout Periods */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Blackout Periods</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Leave restriction windows</p>
                </CardHeader>
                <CardContent>
                  {[
                    { period:"Apr 1–7",      reason:"Quarter Close",    dept:"Finance",  color:CHART.rose   },
                    { period:"Jun 30",       reason:"Half-Year End",    dept:"All",      color:CHART.rose   },
                    { period:"Aug 14–16",    reason:"Independence Day", dept:"All",      color:CHART.gold   },
                    { period:"Dec 25–Jan 5", reason:"Year-End Freeze",  dept:"All",      color:CHART.rose   },
                  ].map((b,i)=>(
                    <motion.div key={b.period} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.07 }}
                      className="flex items-start gap-3 py-3 border-b border-brand-100 last:border-0">
                      <div className="w-1 h-9 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor:b.color }} />
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{b.period}</p>
                        <p className="text-xs text-brand-500">{b.reason} · {b.dept}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Carry Forward */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Carry Forward & Year-End</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Rules and latest run status</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label:"Max CF Days",          val:"10",  color:CHART.dark   },
                      { label:"Expiry Period",         val:"6mo", color:CHART.gold   },
                      { label:"Employees Processed",   val:"198", color:CHART.sage   },
                      { label:"Last Run",              val:"Apr 1",color:CHART.violet},
                    ].map(s=>(
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-base font-black" style={{ color:s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    { dept:"Engineering",val:"8d CF",  status:"Done" as const },
                    { dept:"Sales",      val:"6d CF",  status:"Done" as const },
                    { dept:"HR",         val:"10d CF", status:"Pending" as const },
                    { dept:"Finance",    val:"7d CF",  status:"Pending" as const },
                  ].map((r,i)=>(
                    <div key={r.dept} className="flex justify-between items-center py-2.5 border-b border-brand-100 last:border-0">
                      <span className="text-sm text-brand-700">{r.dept} · <strong>{r.val}</strong></span>
                      <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Incentive Rules */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Incentive Rules & Runs</span></div>
                  <p className="text-xs text-brand-700 mt-0.5">Active reward configurations</p>
                </CardHeader>
                <CardContent>
                  {[
                    { name:"Zero Absence Bonus",  pts:200,  freq:"Monthly",   status:"Active" as const },
                    { name:"Perfect Quarter",      pts:500,  freq:"Quarterly", status:"Active" as const },
                    { name:"Milestone Streak",     pts:1000, freq:"Annual",    status:"Draft"  as const },
                    { name:"OD Efficiency",        pts:150,  freq:"Monthly",   status:"Active" as const },
                  ].map((r,i)=>(
                    <motion.div key={r.name} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.07 }}
                      className={`p-3 rounded-xl border mb-2 ${r.status==="Active"?"border-emerald-100 bg-emerald-50/40":"border-brand-200 bg-brand-50"}`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-brand-900">{r.name}</p>
                        <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                      </div>
                      <p className="text-xs text-brand-500 mt-1">{r.pts} pts · {r.freq}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ════════════ AI ASSISTANT ════════════ */}
        {activeTab === "ai" && (
          <motion.div key="ai" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coverage Risk */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background:"linear-gradient(135deg,#322E53,#2D4A35)" }}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white tracking-wide uppercase">Coverage Risk</span>
                  </div>
                  {COVERAGE_RISK.map((r,i)=>{
                    const col = r.risk > 70 ? CHART.rose : r.risk > 40 ? CHART.gold : CHART.mint;
                    return (
                      <motion.div key={r.dept} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.08 }}
                        className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-white/70 w-20 flex-shrink-0">{r.dept}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor:col }}
                            initial={{ width:0 }} animate={{ width:`${r.risk}%` }} transition={{ delay:i*0.1+0.5,duration:0.75 }} />
                        </div>
                        <span className="text-xs font-bold w-8 text-right" style={{ color:col }}>{r.risk}%</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Anomaly Detection */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-lg" style={{ background:"linear-gradient(135deg,#322E53,#322E53)" }}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white tracking-wide uppercase">Anomaly Detection — April 2025</span>
                  </div>
                  {AI_ANOMALIES.map((a,i)=>(
                    <motion.div key={i} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.08 }}
                      className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor:a.color }} />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color:a.color }}>{a.sev}</span>
                        <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{a.msg}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Policy Copilot */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Policy Copilot — Insights</span></div>
                <p className="text-xs text-brand-700 mt-0.5">AI-generated recommendations from policy analysis</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title:"Carry-Forward Optimization",  body:"Based on current utilisation, reduce max CF limit from 10 to 7 days for Engineering to prevent balance bloat at year-end.", action:"View Policy" },
                    { title:"Blackout Gap Detected",        body:"No blackout configured for Q2 end (Jun 30). Finance has 3 requests around this date — high audit risk.",                      action:"Add Blackout" },
                    { title:"Accrual Rule Conflict",        body:"Casual Leave upfront grant conflicts with probation clause for 12 employees onboarded post Jan 2025.",                       action:"Fix Rule" },
                  ].map((item,i)=>(
                    <motion.div key={item.title} initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.1 }}
                      className="rounded-xl border border-brand-200 p-4 bg-brand-50 hover:border-brand-300 transition-all">
                      <p className="text-sm font-bold text-brand-900 mb-2">{item.title}</p>
                      <p className="text-xs text-brand-600 leading-relaxed mb-4">{item.body}</p>
                      <Button size="sm" className="bg-gradient-to-r from-[#443763] to-[#5c5490] text-white text-xs w-full">
                        {item.action} →
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ════════════ REPORTS ════════════ */}
        {activeTab === "reports" && (
          <motion.div key="reports" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.35 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORTS_LIST.map((r,i)=>(
                <motion.div key={r.title} initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}
                  whileHover={{ y:-4, transition:{ duration:0.18 } }}
                  className="bg-white rounded-2xl border border-brand-200 shadow-sm p-5 cursor-pointer hover:border-brand-300 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-brand-100">{r.icon}</div>
                    <span className="text-brand-500 text-xs">{r.size}</span>
                  </div>
                  <h3 className="text-brand-900 font-bold text-sm mb-1">{r.title}</h3>
                  <p className="text-brand-600 text-xs mb-4">{r.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-500 text-xs">Apr 6, 2025</span>
                    <Button size="sm" className={`bg-gradient-to-r ${r.gradient} text-white text-xs px-3 py-1 h-auto`}>Download ↓</Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Audit Log</span></div>
                <p className="text-xs text-brand-700 mt-0.5">All system & admin actions · April 2025</p>
              </CardHeader>
              <CardContent>
                {[
                  { time:"Apr 6, 09:00 AM",  action:"Accrual job run — 218 employees processed",                  user:"System",     type:"info" },
                  { time:"Apr 5, 04:30 PM",  action:"Carry forward completed for Engineering dept (8d cap)",      user:"Admin Khan", type:"success" },
                  { time:"Apr 4, 11:15 AM",  action:"Blackout period added for Jun 30 — Finance",                 user:"Zaid Farooq",type:"warning" },
                  { time:"Apr 3, 02:00 PM",  action:"Leave approved for Umar Farooq — 3 days Annual",            user:"Admin Khan", type:"success" },
                  { time:"Apr 2, 10:00 AM",  action:"Holiday calendar published for FY 2025–26",                 user:"System",     type:"info" },
                  { time:"Apr 1, 12:00 AM",  action:"Year-start: balances reset and opening credits applied",    user:"System",     type:"info" },
                  { time:"Mar 31, 11:55 PM", action:"Encashment payroll data exported — ₨12.4L submitted",       user:"Admin Khan", type:"success" },
                ].map((log,i)=>(
                  <motion.div key={i} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                    className="flex items-center gap-4 py-3.5 border-b border-brand-100 last:border-0 hover:bg-brand-50/60 px-2 rounded-xl transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.type==="success"?"bg-emerald-400":log.type==="warning"?"bg-amber-400":"bg-indigo-400"}`} />
                    <span className="text-brand-500 text-xs font-mono w-36 flex-shrink-0">{log.time}</span>
                    <span className="text-brand-700 text-sm flex-1">{log.action}</span>
                    <span className="text-brand-500 text-xs w-24 text-right">{log.user}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Scheduled Reports */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-brand-800" /><span className="text-base font-semibold text-brand-900">Scheduled Reports</span></div>
                <p className="text-xs text-brand-700 mt-0.5">Automated delivery configuration</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name:"Weekly Balance Digest",  freq:"Every Monday",   next:"Apr 7",         to:"HR Team",        status:"Active" as const },
                    { name:"Monthly Leave Summary",  freq:"1st of month",   next:"May 1",          to:"Finance + HR",   status:"Active" as const },
                    { name:"Anomaly Alerts",          freq:"Real-time",      next:"—",              to:"All Managers",   status:"Active" as const },
                    { name:"Year-End Compliance",     freq:"Annual",         next:"Mar 31, 2026",   to:"Admin",          status:"Active" as const },
                  ].map((r,i)=>(
                    <motion.div key={r.name} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-brand-200 bg-brand-50">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{r.name}</p>
                        <p className="text-xs text-brand-500 mt-0.5">{r.freq} · To: {r.to}</p>
                        <p className="text-xs text-brand-400 mt-0.5">Next: {r.next}</p>
                      </div>
                      <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}