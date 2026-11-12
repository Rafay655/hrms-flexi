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
import Link from "next/link";
import { EmployeeLink } from "@/components/shared/EmployeeLink";
import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  Cpu,
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
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS (extracted from TimeSyncDashboard)
// ─────────────────────────────────────────────────────────────────────────────
const CHART = {
  navy: "#1E1A3A",   // brand-900
  dark: "#322E53",   // brand-800 — Gross
  sage: "#49426E",   // brand-700
  gold: "#EEC293",   // brand-500 — Net
  rose: "#F3AB9D",   // brand-400 — Tax
  peach: "#f7c9b9",  // brand-300
  sand: "#5c5490",   // brand-600
  violet: "#5c5490",
  mint: "#EEC293",
};

/* Payroll health metrics */
const PAYROLL_HEALTH = [
  { label: "Payment Success Rate", value: 87.5 },
  { label: "Tax Compliance",       value: 100 },
  { label: "EOBI Coverage",        value: 94.2 },
  { label: "Soc. Security Coverage", value: 78.6 },
];
const healthColor = (v: number) =>
  v >= 90 ? "bg-emerald-500" : v >= 70 ? "bg-amber-500" : "bg-red-500";
const healthText = (v: number) =>
  v >= 90 ? "text-emerald-700" : v >= 70 ? "text-amber-700" : "text-red-700";

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART.sand}`,
  backgroundColor: "#fff",
};
const gridStroke = `${CHART.sand}60`;
const tickStyle = { fill: CHART.sage };

// Status badge styles (from TimeSyncDashboard)
const statusStyles = {
  Paid: "bg-[#4A8C6E]/10 text-[#2C5F4A] border-[#4A8C6E]/40",
  Pending: "bg-brand-100 text-brand-800 border-brand-300",
  "On Hold": "bg-[#E78B8B]/20 text-[#6D2A2A] border-[#E78B8B]/40",
};

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK DATA (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
interface Employee {
  id: string; name: string; dept: string; role: string;
  gross: number; deduction: number; tax: number; net: number;
  status: "Paid" | "Pending" | "On Hold"; date: string; initials: string;
}

const MONTHLY = [
  { month: "Oct", gross: 3820, net: 2796, tax: 649, deductions: 375 },
  { month: "Nov", gross: 3910, net: 2864, tax: 664, deductions: 382 },
  { month: "Dec", gross: 4150, net: 3037, tax: 705, deductions: 408 },
  { month: "Jan", gross: 3980, net: 2915, tax: 676, deductions: 389 },
  { month: "Feb", gross: 4060, net: 2971, tax: 690, deductions: 399 },
  { month: "Mar", gross: 4215, net: 3087, tax: 716, deductions: 412 },
];

const DEPT_DATA = [
  { dept: "Engg",      gross: 987, net: 723, headcount: 42 },
  { dept: "Product",   gross: 423, net: 310, headcount: 18 },
  { dept: "Sales",     gross: 735, net: 539, headcount: 35 },
  { dept: "Mktg",      gross: 484, net: 354, headcount: 22 },
  { dept: "Finance",   gross: 322, net: 236, headcount: 15 },
  { dept: "HR",        gross: 228, net: 167, headcount: 12 },
  { dept: "Design",    gross: 336, net: 246, headcount: 16 },
];

const DEDUCTION_PIE = [
  { name: "EOBI",             value: 38.5, fill: CHART.dark },
  { name: "Soc. Security",    value: 25.9, fill: CHART.violet },
  { name: "Loan Recovery",    value: 9.3,  fill: CHART.gold },
  { name: "Leave Deduction",  value: 4.6,  fill: CHART.rose },
  { name: "Other",            value: 4.8,  fill: CHART.peach },
];

const RADIAL_DATA = [
  { name: "< 500K",  value: 32, fill: CHART.sage },
  { name: "500K–1M", value: 54, fill: CHART.gold },
  { name: "1M–2M",   value: 78, fill: CHART.dark },
  { name: "> 2M",    value: 91, fill: CHART.violet },
];

const EMPLOYEES: Employee[] = [
  { id:"EMP001", name:"Sana Ahmed",     dept:"Engineering", role:"Sr. Software Engineer",  gross:285000, deduction:32000, tax:48500, net:204500, status:"Paid",    date:"Mar 28", initials:"SA" },
  { id:"EMP002", name:"Muhammad Ali",   dept:"Product",     role:"Product Manager",        gross:245000, deduction:28000, tax:41650, net:175350, status:"Paid",    date:"Mar 28", initials:"MA" },
  { id:"EMP003", name:"Ayesha Malik",   dept:"Design",      role:"Lead UX Designer",       gross:210000, deduction:24000, tax:35700, net:150300, status:"Paid",    date:"Mar 28", initials:"AM" },
  { id:"EMP004", name:"Junaid Khan",    dept:"Finance",     role:"Financial Analyst",      gross:195000, deduction:22500, tax:33150, net:139350, status:"Pending", date:"Mar 31", initials:"JK" },
  { id:"EMP005", name:"Emaan Sheikh",   dept:"HR",          role:"HR Business Partner",    gross:175000, deduction:20000, tax:29750, net:125250, status:"Paid",    date:"Mar 28", initials:"ES" },
  { id:"EMP006", name:"Tariq Mehmood",  dept:"Engineering", role:"DevOps Engineer",        gross:265000, deduction:30500, tax:45050, net:189450, status:"On Hold", date:"—",      initials:"TM" },
  { id:"EMP007", name:"Aisha Siddiqui", dept:"Marketing",   role:"Marketing Director",     gross:230000, deduction:26500, tax:39100, net:164400, status:"Paid",    date:"Mar 28", initials:"AS" },
  { id:"EMP008", name:"Raza Nawaz",     dept:"Sales",       role:"Sales Manager",          gross:220000, deduction:25000, tax:37400, net:157600, status:"Pending", date:"Mar 31", initials:"RN" },
  { id:"EMP009", name:"Fatima Al-Noor", dept:"Engineering", role:"Backend Developer",      gross:240000, deduction:27500, tax:40800, net:171700, status:"Paid",    date:"Mar 28", initials:"FA" },
  { id:"EMP010", name:"Danish Kamran",  dept:"Sales",       role:"Account Executive",      gross:190000, deduction:21800, tax:32300, net:135900, status:"Paid",    date:"Mar 28", initials:"DK" },
];

const COMPLIANCE = [
  { task: "EOBI Challan Submission", due: "Apr 15", done: true },
  { task: "WHT Filing (FBR)", due: "Apr 15", done: true },
  { task: "Provincial Social Security", due: "Apr 21", done: true },
  { task: "Gratuity Fund Reconciliation", due: "Apr 30", done: false },
  { task: "Annual WHT Return (FBR)", due: "May 31", done: false },
  { task: "Tax Certificate Issuance (FBR)", due: "May 31", done: false },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `PKR ${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `PKR ${(n / 1_000).toFixed(0)}K`
  : `PKR ${n.toLocaleString()}`;

// Mini Spark-bars (reused from TimeSyncDashboard)
function MiniBars() {
  return (
    <div className="mt-3 flex gap-0.5">
      {[40, 65, 80, 55, 70, 90, 60].map((h, i) => (
        <div key={i} className="w-1.5 rounded-full bg-white/30" style={{ height: `${h * 0.18}px` }} />
      ))}
    </div>
  );
}

// Custom Tooltip for charts (matches TimeSync style)
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sand-200 shadow-lg rounded-xl p-3 text-xs" style={{ ...tooltipStyle }}>
      <p className="font-bold text-brand-900 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-brand-700 capitalize">{p.name}</span>
          </div>
          <span className="font-semibold text-brand-900">PKR {p.value}L</span>
        </div>
      ))}
    </div>
  );
}

// TabButton component (same premium look as TimeSync)
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
        active
          ? "bg-brand-800 text-white shadow-md"
          : "text-brand-700 hover:bg-brand-100 hover:text-brand-800"
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  KPI CARD (exactly as in TimeSyncDashboard, with gradients)
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  bg,
  delay,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ElementType;
  bg: string;
  delay: number;
}) {
  const isPositive = !delta.startsWith("-");
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className={`p-5 ${bg.includes("EEC293") || bg.includes("F3AB9D") ? "text-[#322E53]" : "text-white"} ${bg}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg.includes("EEC293") || bg.includes("F3AB9D") ? "bg-[#322E53]/15" : "bg-white/20"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.25, type: "spring", stiffness: 300 }}
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${bg.includes("EEC293") || bg.includes("F3AB9D") ? "bg-[#322E53]/15 text-[#322E53]" : isPositive ? "bg-white/20 text-white" : "bg-black/18 text-white"}`}
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
        <p className="opacity-75 text-xs font-medium mt-1">{label}</p>
        <MiniBars />
        <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-white/10 to-transparent" />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "reports">("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState<"All" | "Paid" | "Pending" | "On Hold">("All");
  const [period, setPeriod] = useState("March 2025");

  const filtered = EMPLOYEES.filter(e =>
    (statusFilter === "All" || e.status === statusFilter) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) ||
     e.dept.toLowerCase().includes(search.toLowerCase()) ||
     e.id.toLowerCase().includes(search.toLowerCase()))
  );

  const paidCount = EMPLOYEES.filter(e => e.status === "Paid").length;
  const pendingCount = EMPLOYEES.filter(e => e.status === "Pending").length;
  const holdCount = EMPLOYEES.filter(e => e.status === "On Hold").length;

  // KPI gradients (copied from TimeSyncDashboard)
  const kpiGradients = [
    "bg-gradient-to-br from-[#322E53] to-[#49426E]",   // Gross Payroll — brand-800 → brand-700
    "bg-gradient-to-br from-[#49426E] to-[#5c5490]",   // Net Disbursed — brand-700 → brand-600
    "bg-gradient-to-br from-[#EEC293] to-[#e8b57a]",   // Departments — peach
    "bg-gradient-to-br from-[#322E53] to-[#5c5490]",   // Employees — brand-800 → brand-600
    "bg-gradient-to-br from-[#5c5490] to-[#49426E]",   // Deductions — brand-600 → brand-700
    "bg-gradient-to-br from-[#F3AB9D] to-[#ef9083]",   // Pending Payments — salmon
  ];

  return (
    <div className="min-h-screen bg-white p-6 md:p-8" style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-brand-900 tracking-tight leading-tight">Pay Edge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Payroll processing, salary structures, tax and statutory compliance
          </p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-sm text-brand-700">Last processed · Mar 28, 2025 at 02:14 AM</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
              {paidCount}/{EMPLOYEES.length} Paid
            </Badge>
            {pendingCount > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                {pendingCount} Pending
              </Badge>
            )}
            {holdCount > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200">
                {holdCount} On Hold
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-white border border-brand-200 text-brand-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 shadow-sm"
          >
            {["January 2025", "February 2025", "March 2025"].map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <Button variant="outline" className="border-brand-800 text-brand-800 hover:bg-brand-100">
            ↓ Export
          </Button>
          <Button
            className="bg-gradient-to-r from-[#322E53] to-[#49426E] text-white shadow-md hover:shadow-lg transition-shadow"
          >
            ▷ Run Payroll
          </Button>
        </div>
      </motion.div>

      {/* ── Cross-module alert: pending Final Settlements ─────────────── */}
      <Link
        href="/people-hub/exits?filter=fnf-pending"
        className="group mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-3.5 shadow-sm transition-all hover:shadow-md hover:border-amber-300"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">
              3 employees have exits pending Final Settlement
            </p>
            <p className="text-xs text-brand-700 mt-0.5">
              Clearance is complete — F&F calculation and payout required
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-800 group-hover:text-amber-900">
          Review in People Hub
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      {/* ── Cross-module alert: pending Leave Encashments ─────────────── */}
      <Link
        href="/leave-ease/encashment"
        className="group mb-6 flex items-center justify-between gap-4 rounded-xl border border-brand-300/60 bg-gradient-to-r from-brand-100/60 to-white px-5 py-3.5 shadow-sm transition-all hover:shadow-md hover:border-brand-400"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
            <Calendar className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">
              4 leave encashment requests pending processing
            </p>
            <p className="text-xs text-brand-700 mt-0.5">
              Approve in LeaveEase to include in the next payroll cycle
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-800 group-hover:text-brand-900">
          Open in LeaveEase
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Gross Payroll" value="PKR 42.2M" delta="+3.8%" icon={TrendingUp} bg={kpiGradients[0]} delay={0.05} />
        <KpiCard label="Net Disbursed" value="PKR 30.9M" delta="+4.1%" icon={Activity} bg={kpiGradients[1]} delay={0.10} />
        <KpiCard label="Departments" value="7" delta="+1" icon={Network} bg={kpiGradients[2]} delay={0.15} />
        <KpiCard label="Total Employees" value="160" delta="+5" icon={Users} bg={kpiGradients[3]} delay={0.20} />
        <KpiCard label="Total Deductions" value="PKR 8.4M" delta="-0.5%" icon={ArrowDownRight} bg={kpiGradients[4]} delay={0.25} />
        <KpiCard label="Pending Payments" value="4" delta="+1" icon={AlertTriangle} bg={kpiGradients[5]} delay={0.30} />
      </div>

      {/* ── Tabs (using TabButton from TimeSync) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="flex flex-wrap gap-1 rounded-xl bg-white border border-brand-200/60 p-1 w-fit mb-7 shadow-sm"
      >
        {(["overview", "employees", "reports"] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TabButton>
        ))}
      </motion.div>

      {/* ── Animated Tab Content ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Row 1: Area Chart + Deduction Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trend Area Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Monthly Payroll Trend</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">6-month gross · net · tax comparison</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={MONTHLY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.dark} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={CHART.dark} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.gold} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={CHART.gold} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.rose} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={CHART.rose} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={v => <span className="text-xs text-brand-600 capitalize">{v}</span>} />
                      <Area type="monotone" dataKey="gross" stroke={CHART.dark} strokeWidth={2.5} fill="url(#grossGrad)" dot={false} />
                      <Area type="monotone" dataKey="net" stroke={CHART.gold} strokeWidth={2.5} fill="url(#netGrad)" dot={false} />
                      <Area type="monotone" dataKey="tax" stroke={CHART.rose} strokeWidth={2} fill="url(#taxGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-brand-200">
                    {[
                      { label: "Avg Monthly Gross", val: "PKR 4.02M", color: CHART.dark },
                      { label: "Avg Monthly Net", val: "PKR 2.95M", color: CHART.sage },
                      { label: "YTD Tax Paid", val: "PKR 4.1M", color: CHART.gold },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-base font-black" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deduction Pie */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Deduction Mix</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">By category, March 2025</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={DEDUCTION_PIE}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {DEDUCTION_PIE.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: unknown) => [`${v}%`, ""]}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {DEDUCTION_PIE.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-brand-600 text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-brand-900 text-xs font-bold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payroll Health progress bars */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-800" />
                  <span className="text-base font-semibold text-brand-900">Payroll Health</span>
                </div>
                <p className="text-xs text-brand-700 mt-0.5">
                  Compliance and disbursement quality indicators
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {PAYROLL_HEALTH.map((m) => (
                    <div key={m.label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-900">{m.label}</span>
                        <span className={`text-sm font-bold ${healthText(m.value)}`}>
                          {m.value}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
                        <div
                          className={`h-full rounded-full ${healthColor(m.value)} transition-all`}
                          style={{ width: `${m.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Row 2: Dept Bar Chart + Radial Salary Bands */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dept Bar */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Department-wise Payroll</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Gross vs Net disbursement (in Lakhs)</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={DEPT_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="32%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize: 10, ...tickStyle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`PKR ${v}L`, ""]} />
                      <Legend formatter={v => <span className="text-xs text-brand-600 capitalize">{v}</span>} />
                      <Bar dataKey="gross" fill={CHART.dark} radius={[6, 6, 0, 0]} name="Gross" />
                      <Bar dataKey="net" fill={CHART.gold} radius={[6, 6, 0, 0]} name="Net" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-brand-200">
                    {[
                      { label: "Departments", val: "7", color: CHART.violet },
                      { label: "Total Gross", val: "PKR 35.15M", color: CHART.dark },
                      { label: "Total Net", val: "PKR 25.75M", color: CHART.sage },
                      { label: "Avg/Employee", val: "PKR 219K", color: CHART.gold },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-brand-200 bg-brand-50">
                        <p className="text-sm font-black" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-xs mt-0.5 text-brand-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Radial — Salary Bands */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Salary Bands</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Employee count by range</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={RADIAL_DATA} startAngle={90} endAngle={-270}>
                      <RadialBar {...({ minAngle: 15 } as any)} dataKey="value" cornerRadius={6} background={{ fill: "#f1f5f9" }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} employees`, ""]} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5 mt-2">
                    {RADIAL_DATA.map(d => (
                      <div key={d.name} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-brand-600 text-xs flex-1">{d.name}</span>
                        <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: d.fill }}
                            initial={{ width: 0 }}
                            animate={{ width: `${d.value}%` }}
                            transition={{ delay: 0.8, duration: 0.75 }}
                          />
                        </div>
                        <span className="text-brand-900 text-xs font-bold w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Compliance + Payroll Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compliance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Compliance Checklist</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Statutory obligations · Q1 2025</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMPLIANCE.map((item, i) => (
                      <motion.div
                        key={item.task}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i + 0.3 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          item.done
                            ? "border-emerald-100 bg-emerald-50/60"
                            : "border-brand-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            item.done ? "bg-emerald-500 text-white" : "bg-white border-2 border-brand-200 text-brand-400"
                          }`}
                        >
                          {item.done ? "✓" : ""}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${item.done ? "text-brand-400 line-through" : "text-brand-900"}`}>
                            {item.task}
                          </p>
                          <p className="text-xs text-brand-500 mt-0.5">Due: {item.due}</p>
                        </div>
                        {!item.done && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#322E53] to-[#49426E] text-white text-xs px-2 py-1 h-auto"
                          >
                            Action
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Health */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-800" />
                    <span className="text-base font-semibold text-brand-900">Payroll Health</span>
                  </div>
                  <p className="text-xs text-brand-700 mt-0.5">Current cycle metrics</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Payment Success Rate", val: 87.5, color: CHART.sage },
                      { label: "Tax Compliance", val: 100, color: CHART.dark },
                      { label: "PF Coverage", val: 94.2, color: CHART.violet },
                      { label: "Social Security Coverage", val: 78.6, color: CHART.gold },
                      { label: "Bonus Processed", val: 62.5, color: CHART.rose },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * i + 0.4 }}
                      >
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-brand-600 font-medium">{item.label}</span>
                          <span className="font-bold" style={{ color: item.color }}>{item.val}%</span>
                        </div>
                        <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ delay: 0.2 * i + 0.5, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-brand-200">
                    <p className="text-xs text-brand-500 font-semibold uppercase tracking-wider mb-3">Tax Summary</p>
                    {[
                      { label: "Total WHT", val: "PKR 7.17M", color: CHART.gold },
                      { label: "PF (Emp+Empr)", val: "PKR 3.24Cr", color: CHART.violet },
                      { label: "Soc. Security Total", val: "PKR 1.89M", color: CHART.sage },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center mb-2">
                        <span className="text-xs text-brand-600">{s.label}</span>
                        <span className="text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ════════════ EMPLOYEES ════════════ */}
        {activeTab === "employees" && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Summary tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Employees", val: EMPLOYEES.length, sub: "in cycle", color: CHART.dark },
                { label: "Paid", val: paidCount, sub: "disbursed", color: CHART.sage },
                { label: "Pending", val: pendingCount, sub: "awaiting", color: CHART.gold },
                { label: "On Hold", val: holdCount, sub: "blocked", color: CHART.rose },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-5 border border-brand-200 bg-brand-50"
                >
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">{s.label}</p>
                  <p className="text-xs text-brand-600">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Filters + Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand-800" />
                      <span className="text-base font-semibold text-brand-900">Employee Payroll Details</span>
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">Individual salary breakdown · {period}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 text-sm">🔍</span>
                      <input
                        type="text"
                        placeholder="Search employee…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-white border border-brand-200 text-brand-700 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-brand-300 w-44"
                      />
                    </div>
                    <div className="flex bg-brand-100 rounded-xl p-0.5 gap-0.5">
                      {(["All", "Paid", "Pending", "On Hold"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            statusFilter === s
                              ? "bg-brand-800 text-white shadow"
                              : "text-brand-700 hover:bg-brand-200"
                          }`}
                        >
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
                        {["Employee", "Department", "Gross Salary", "Deductions", "Tax (WHT)", "Net Pay", "Status", "Date"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-brand-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filtered.map((emp, i) => (
                          <motion.tr
                            key={emp.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-brand-100 hover:bg-brand-50/80 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <EmployeeLink
                                  employeeId={emp.id}
                                  employeeName={emp.name}
                                  showAvatar
                                />
                                <p className="text-brand-500 text-xs ml-9">{emp.id} · {emp.role}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4"><span className="text-brand-700 text-sm">{emp.dept}</span></td>
                            <td className="px-5 py-4"><span className="text-brand-900 text-sm font-bold">{fmt(emp.gross)}</span></td>
                            <td className="px-5 py-4"><span className="text-sm font-medium" style={{ color: CHART.rose }}>- {fmt(emp.deduction)}</span></td>
                            <td className="px-5 py-4"><span className="text-sm font-medium" style={{ color: CHART.gold }}>- {fmt(emp.tax)}</span></td>
                            <td className="px-5 py-4"><span className="text-sm font-bold" style={{ color: CHART.sage }}>{fmt(emp.net)}</span></td>
                            <td className="px-5 py-4">
                              <Badge className={statusStyles[emp.status]}>{emp.status}</Badge>
                            </td>
                            <td className="px-5 py-4"><span className="text-brand-500 text-sm">{emp.date}</span></td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="py-16 text-center text-brand-500 text-sm">No employees match your filter.</div>
                  )}
                </div>
                {/* Footer */}
                <div className="px-5 py-4 border-t border-brand-200 bg-brand-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-brand-500 text-xs">Showing {filtered.length} of {EMPLOYEES.length} employees</p>
                  <div className="flex gap-6 flex-wrap">
                    {[
                      { label: "Gross", val: filtered.reduce((s, e) => s + e.gross, 0), color: CHART.dark },
                      { label: "Deductions", val: filtered.reduce((s, e) => s + e.deduction, 0), color: CHART.rose },
                      { label: "Tax", val: filtered.reduce((s, e) => s + e.tax, 0), color: CHART.gold },
                      { label: "Net", val: filtered.reduce((s, e) => s + e.net, 0), color: CHART.sage },
                    ].map(t => (
                      <div key={t.label} className="text-right">
                        <p className="text-xs text-brand-500">{t.label}</p>
                        <p className="text-sm font-black" style={{ color: t.color }}>{fmt(t.val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ════════════ REPORTS ════════════ */}
        {activeTab === "reports" && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Report Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Payroll Register", desc: "Complete register with all details", icon: "📋", size: "2.4 MB", date: "Mar 28", gradient: "from-[#443763] to-[#5c5490]" },
                { title: "WHT Deduction Report", desc: "WHT summary and FBR challan details", icon: "🧾", size: "1.1 MB", date: "Mar 28", gradient: "from-[#EEC293] to-[#DEAD68]" },
                { title: "Bank Transfer File", desc: "NEFT/RTGS file for disbursement", icon: "🏦", size: "0.8 MB", date: "Mar 28", gradient: "from-[#49426E] to-[#49426E]" },
                { title: "EOBI Challan", desc: "EOBI contribution statement", icon: "📂", size: "0.5 MB", date: "Mar 28", gradient: "from-[#322E53] to-[#5c5490]" },
                { title: "Salary Tax Certificate", desc: "Salary tax deduction certificate (§149)", icon: "📑", size: "1.8 MB", date: "Mar 28", gradient: "from-[#F3AB9D] to-[#F3AB9D]" },
                { title: "Department Summary", desc: "Dept-wise payroll cost analysis", icon: "📊", size: "0.9 MB", date: "Mar 28", gradient: "from-[#6D2A2A] to-[#A34141]" },
              ].map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  className="bg-white rounded-2xl border border-brand-200 shadow-sm p-5 cursor-pointer hover:border-brand-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-brand-100">
                      {r.icon}
                    </div>
                    <span className="text-brand-500 text-xs">{r.size}</span>
                  </div>
                  <h3 className="text-brand-900 font-bold text-sm mb-1">{r.title}</h3>
                  <p className="text-brand-600 text-xs mb-4">{r.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-500 text-xs">{r.date}</span>
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${r.gradient} text-white text-xs px-3 py-1 h-auto`}
                    >
                      Download ↓
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-800" />
                  <span className="text-base font-semibold text-brand-900">Audit Log</span>
                </div>
                <p className="text-xs text-brand-700 mt-0.5">All actions for March 2025 payroll cycle</p>
              </CardHeader>
              <CardContent>
                <div>
                  {[
                    { time: "Mar 28, 02:14 AM", action: "Payroll processed for 160 employees", user: "Admin Khan", type: "success" },
                    { time: "Mar 28, 02:10 AM", action: "Bank transfer file generated (PKR 4.87 Cr)", user: "System", type: "info" },
                    { time: "Mar 27, 11:45 PM", action: "Salary revised for EMP006 — placed On Hold", user: "Admin Khan", type: "warning" },
                    { time: "Mar 27, 06:30 PM", action: "Payroll approved by Finance Head", user: "Zaid Farooq", type: "success" },
                    { time: "Mar 26, 03:00 PM", action: "Tax calculation completed for all employees", user: "System", type: "info" },
                    { time: "Mar 25, 10:22 AM", action: "Payroll draft submitted for approval", user: "Admin Khan", type: "info" },
                    { time: "Mar 24, 04:00 PM", action: "Attendance data synced from HRM", user: "System", type: "info" },
                  ].map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 py-3.5 border-b border-brand-100 last:border-0 hover:bg-brand-50/60 px-2 rounded-xl transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.type === "success" ? "bg-emerald-400" : log.type === "warning" ? "bg-amber-400" : "bg-indigo-400"
                      }`} />
                      <span className="text-brand-500 text-xs font-mono w-36 flex-shrink-0">{log.time}</span>
                      <span className="text-brand-700 text-sm flex-1">{log.action}</span>
                      <span className="text-brand-500 text-xs w-24 text-right">{log.user}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statutory Rates & Slabs */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-brand-800" />
                  <span className="text-base font-semibold text-brand-900">Statutory Rates & Slabs</span>
                </div>
                <p className="text-xs text-brand-700 mt-0.5">Reference for current fiscal year</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: "Income Tax Slabs", items: ["Up to PKR 250K — Nil", "PKR 250K–500K — 5%", "PKR 500K–1M — 20%", "Above PKR 1M — 30%"], color: CHART.gold },
                    { title: "Provident Fund", items: ["Employee: 12% of Basic", "Employer: 12% of Basic", "Admin Charges: 0.5%", "EDLI: 0.5%"], color: CHART.dark },
                    { title: "Social Security Contribution", items: ["Employee: 0.75-1% (province)", "Employer: 5% of basic wages", "Wage ceiling: PKR 25-30K/mo", "Monthly contribution"], color: CHART.sage },
                  ].map(card => (
                    <div
                      key={card.title}
                      className="rounded-xl p-5 border border-brand-200 bg-brand-50"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: card.color }} />
                        <h3 className="text-sm font-bold" style={{ color: card.color }}>{card.title}</h3>
                      </div>
                      <div className="space-y-2">
                        {card.items.map((item, i) => (
                          <p key={i} className="text-xs text-brand-700 py-1.5 border-b border-white/70 last:border-0">{item}</p>
                        ))}
                      </div>
                    </div>
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