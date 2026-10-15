"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  Users, UserCheck, UserX, Clock, Bell, Star, TrendingUp,
  MapPin, Briefcase, Sun, Moon, Sunset, CalendarClock,
  ChevronRight, X, CheckCircle2, XCircle, AlertCircle,
  BarChart3, Activity, Award, Building2, Search, Plus,
  ArrowUpRight, ArrowDownRight, Minus,
  Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  Legend,
} from "recharts";
import { EmployeeLink } from "@/components/shared/EmployeeLink";

// ─── TYPES ─────────────────────────────────────────────────────────
type Status = "present" | "absent" | "late" | "leave";
type Shift  = "Morning" | "Evening" | "Night" | "General";

interface Employee {
  id: string; name: string; role: string; dept: string;
  city: string; shift: Shift; status: Status;
  initials: string; color: string;
  inTime: string; outTime: string;
  otMTD: number; leaves: number; perf: number; joined: string;
}

interface Request {
  id: string; empId: string; empName: string; empInitials: string; empColor: string;
  type: string; desc: string; date: string; urgent: boolean;
}

// ─── DATA ──────────────────────────────────────────────────────────
const EMPLOYEES: Employee[] = [
  { id:"E001", name:"Rafay Ahmed",      role:"Sr. Software Engineer",  dept:"Engineering",    city:"Lahore",     shift:"Morning", status:"present", initials:"RA", color:"#322E53", inTime:"09:02", outTime:"18:15", otMTD:8.5, leaves:2, perf:94, joined:"Jan 2022" },
  { id:"E002", name:"Yousaf Khan",      role:"Software Engineer",      dept:"Engineering",    city:"Islamabad",  shift:"Morning", status:"present", initials:"YK", color:"#49426E", inTime:"09:05", outTime:"18:00", otMTD:4.0, leaves:1, perf:88, joined:"Mar 2023" },
  { id:"E003", name:"Humza Ali",        role:"Frontend Developer",     dept:"Engineering",    city:"Karachi",    shift:"Evening", status:"late",    initials:"HA", color:"#EEC293", inTime:"09:31", outTime:"18:10", otMTD:2.0, leaves:3, perf:76, joined:"Jun 2023" },
  { id:"E004", name:"Shaban Akhtar",    role:"Backend Developer",      dept:"Engineering",    city:"Peshawar",   shift:"Night",   status:"present", initials:"SA", color:"#F3AB9D", inTime:"23:00", outTime:"07:00", otMTD:6.0, leaves:0, perf:91, joined:"Aug 2021" },
  { id:"E005", name:"Fatima Tariq",     role:"QA Engineer",            dept:"Quality",        city:"Lahore",     shift:"Morning", status:"leave",   initials:"FT", color:"#F3AB9D", inTime:"--",    outTime:"--",    otMTD:1.0, leaves:5, perf:85, joined:"Feb 2022" },
  { id:"E006", name:"Ali Raza",         role:"DevOps Engineer",        dept:"Infrastructure", city:"Multan",     shift:"General", status:"absent",  initials:"AR", color:"#6B7280", inTime:"--",    outTime:"--",    otMTD:0.0, leaves:7, perf:68, joined:"Nov 2020" },
  { id:"E007", name:"Zainab Malik",     role:"Product Manager",        dept:"Product",        city:"Islamabad",  shift:"Morning", status:"present", initials:"ZM", color:"#322E53", inTime:"08:58", outTime:"18:30", otMTD:3.5, leaves:1, perf:97, joined:"Sep 2021" },
  { id:"E008", name:"Bilal Hussain",    role:"Data Engineer",          dept:"Analytics",      city:"Lahore",     shift:"Morning", status:"present", initials:"BH", color:"#49426E", inTime:"09:10", outTime:"18:05", otMTD:5.0, leaves:2, perf:82, joined:"Apr 2022" },
  { id:"E009", name:"Ayesha Siddiqui", role:"UX Designer",            dept:"Design",         city:"Karachi",    shift:"Morning", status:"late",    initials:"AS", color:"#EEC293", inTime:"09:42", outTime:"18:20", otMTD:1.5, leaves:4, perf:89, joined:"Jul 2023" },
  { id:"E010", name:"Usman Ghani",      role:"Security Engineer",      dept:"Infrastructure", city:"Rawalpindi", shift:"Night",   status:"present", initials:"UG", color:"#F3AB9D", inTime:"22:55", outTime:"07:10", otMTD:9.0, leaves:0, perf:93, joined:"Dec 2020" },
  { id:"E011", name:"Hira Baig",        role:"HR Specialist",          dept:"HR",             city:"Lahore",     shift:"Morning", status:"present", initials:"HB", color:"#F3AB9D", inTime:"09:00", outTime:"18:00", otMTD:0.5, leaves:1, perf:90, joined:"May 2022" },
  { id:"E012", name:"Kamran Saeed",     role:"Finance Analyst",        dept:"Finance",        city:"Faisalabad", shift:"General", status:"absent",  initials:"KS", color:"#6B7280", inTime:"--",    outTime:"--",    otMTD:0.0, leaves:3, perf:71, joined:"Jan 2023" },
];

const REQUESTS: Request[] = [
  { id:"R1", empId:"E003", empName:"Humza Ali",        empInitials:"HA", empColor:"#EEC293", type:"Regularization",  desc:"Late arrival on 22 Mar — system issue", date:"22 Mar", urgent:true },
  { id:"R2", empId:"E004", empName:"Shaban Akhtar",    empInitials:"SA", empColor:"#F3AB9D", type:"Shift Swap",      desc:"Swap night shift on 28 Mar with Yousaf", date:"28 Mar", urgent:false },
  { id:"R3", empId:"E005", empName:"Fatima Tariq",     empInitials:"FT", empColor:"#F3AB9D", type:"Leave Extension", desc:"Medical leave extension +2 days", date:"27 Mar", urgent:true },
  { id:"R4", empId:"E001", empName:"Rafay Ahmed",      empInitials:"RA", empColor:"#322E53", type:"Overtime Claim",  desc:"4 hrs overtime on 20 Mar project deadline", date:"20 Mar", urgent:false },
  { id:"R5", empId:"E009", empName:"Ayesha Siddiqui", empInitials:"AS", empColor:"#EEC293", type:"Regularization",  desc:"Late arrival on 24 Mar — traffic", date:"24 Mar", urgent:false },
];

const WEEKLY_DATA = [
  { day:"Mon", present:9, late:1, absent:2 },
  { day:"Tue", present:10, late:1, absent:1 },
  { day:"Wed", present:8,  late:2, absent:2 },
  { day:"Thu", present:9,  late:1, absent:2 },
  { day:"Fri", present:7,  late:2, absent:3 },
  { day:"Sat", present:5,  late:0, absent:0 },
  { day:"Today", present:8, late:2, absent:2 },
];

const OT_TREND = [
  { month:"Oct", hours:18 }, { month:"Nov", hours:22 },
  { month:"Dec", hours:31 }, { month:"Jan", hours:25 },
  { month:"Feb", hours:19 }, { month:"Mar", hours:24.5 },
];

const DEPT_DATA = [
  { name:"Engineering",    value:4, fill:"#322E53" },
  { name:"Infrastructure", value:2, fill:"#49426E" },
  { name:"Quality",        value:1, fill:"#F3AB9D" },
  { name:"Analytics",      value:1, fill:"#EEC293" },
  { name:"Design",         value:1, fill:"#F3AB9D" },
  { name:"Product",        value:1, fill:"#f7c9b9" },
  { name:"HR",             value:1, fill:"#6B7280" },
  { name:"Finance",        value:1, fill:"#A8A29E" },
];

const ACTIVITY = [
  { time:"09:02", msg:"Rafay Ahmed clocked in",            type:"in" },
  { time:"09:05", msg:"Yousaf Khan clocked in",            type:"in" },
  { time:"09:10", msg:"Bilal Hussain clocked in",          type:"in" },
  { time:"09:31", msg:"Humza Ali — Marked Late",           type:"late" },
  { time:"09:42", msg:"Ayesha Siddiqui — Marked Late",     type:"late" },
  { time:"10:15", msg:"Fatima Tariq — Leave approved",     type:"leave" },
  { time:"11:00", msg:"Shaban Akhtar night shift ended",   type:"out" },
  { time:"14:30", msg:"New OT claim: Rafay Ahmed",         type:"request" },
];

// ─── STATUS CONFIG ──────────────────────────────────────────────────
const STATUS: Record<Status, { label:string; bg:string; text:string; border:string; dot:string }> = {
  present: { label:"Present", bg:"#F0FDF4", text:"#166534", border:"#86EFAC", dot:"#22C55E" },
  late:    { label:"Late",    bg:"#FFFBEB", text:"#92400E", border:"#FCD34D", dot:"#F59E0B" },
  absent:  { label:"Absent",  bg:"#FEF2F2", text:"#991B1B", border:"#FCA5A5", dot:"#EF4444" },
  leave:   { label:"On Leave",bg:"#EFF6FF", text:"#1E40AF", border:"#93C5FD", dot:"#3B82F6" },
};

const SHIFT_META: Record<Shift, { icon: React.ReactNode; color: string }> = {
  Morning: { icon:<Sun size={12}/>,       color:"#EEC293" },
  Evening: { icon:<Sunset size={12}/>,    color:"#F3AB9D" },
  Night:   { icon:<Moon size={12}/>,      color:"#322E53" },
  General: { icon:<Clock size={12}/>,     color:"#49426E" },
};

// ─── SMALL COMPONENTS ──────────────────────────────────────────────
function Avatar({ initials, color, size = 36 }: { initials:string; color:string; size?:number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 font-black text-white"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}dd, ${color}88)`,
        border: `2px solid ${color}33`,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status:Status }) {
  const cfg = STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1  text-[8px] font-semibold px-2 py-1 rounded-full"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function PerfBar({ value }: { value:number }) {
  const color = value >= 90 ? "#49426E" : value >= 75 ? "#EEC293" : "#F3AB9D";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#F5E6D0]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold w-7 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, color, trend, delay = 0
}: {
  label:string; value:number|string; sub?:string;
  icon:React.ElementType; color:string; trend?:"up"|"down"|"flat"; delay?:number;
}) {
  const trendIcon = trend === "up" ? <ArrowUpRight size={13} className="text-[#49426E]" />
                  : trend === "down" ? <ArrowDownRight size={13} className="text-[#F3AB9D]" />
                  : <Minus size={13} className="text-[#9CA3AF]" />;
  const trendColor = trend === "up" ? "text-[#49426E]" : trend === "down" ? "text-[#F3AB9D]" : "text-[#9CA3AF]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl p-5 bg-white border border-[#F5E6D0] shadow-[0_1px_3px_rgba(30,29,56,0.06),0_4px_16px_rgba(30,29,56,0.04)]"
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-xl" style={{ background: color }} />
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-[#322E53] tracking-tight font-league">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-2">
          {trendIcon}
          <span className={`text-xs font-semibold ${trendColor}`}>{sub}</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#322E53] text-[#F5E6D0] rounded-xl px-4 py-2 text-xs shadow-lg font-league">
      <div className="font-bold mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-1.5 text-gray-300">
          <span className="w-1.5 h-1.5 rounded-sm" style={{ background: p.fill || p.color }} />
          {p.name}: <strong className="text-[#F5E6D0]">{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function TeamDashboard() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState<"all"|Status>("all");
  const [selected, setSelected]   = useState<Employee|null>(null);
  const [approved, setApproved]   = useState<string[]>([]);
  const [rejected, setRejected]   = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(true);

  const filtered = useMemo(() => {
    let list = EMPLOYEES;
    if (activeTab !== "all") list = list.filter(e => e.status === activeTab);
    if (search) list = list.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [search, activeTab]);

  const summary = useMemo(() => ({
    present: EMPLOYEES.filter(e => e.status === "present").length,
    late:    EMPLOYEES.filter(e => e.status === "late").length,
    absent:  EMPLOYEES.filter(e => e.status === "absent").length,
    leave:   EMPLOYEES.filter(e => e.status === "leave").length,
  }), []);

  const star = EMPLOYEES.reduce((a, b) => a.perf > b.perf ? a : b);
  const pendingReqs = REQUESTS.filter(r => !approved.includes(r.id) && !rejected.includes(r.id));

  const tabs: Array<{ key:"all"|Status; label:string }> = [
    { key:"all",     label:`All (${EMPLOYEES.length})` },
    { key:"present", label:`Present (${summary.present})` },
    { key:"late",    label:`Late (${summary.late})` },
    { key:"absent",  label:`Absent (${summary.absent})` },
    { key:"leave",   label:`Leave (${summary.leave})` },
  ];

  return (
    <>
    

      <div className="min-h-screen bg-white">

        {/* ── TOPBAR ─────────────────────────────────── */}
        <div className="bg-[#322E53] border-b border-white/10">
          <div className="max-w-screen-2xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#EEC293] to-[#f7c9b9] flex items-center justify-center">
                <Building2 size={18} className="text-[#322E53]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#F5E6D0]">HRMS Flexi</div>
                <div className="text-[10px] text-[#F5E6D0]/40 tracking-wide">TEAM DASHBOARD</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-px h-6 bg-white/10" />
              <div className="text-xs text-[#F5E6D0]/50">
                <span className="text-green-500 font-semibold">● </span>
                Live · Thu 26 Mar 2025
              </div>
              <div className="text-xs text-[#F5E6D0]/50">Lahore HQ</div>

              <button
                onClick={() => setShowPanel(v => !v)}
                className="relative bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-[#F5E6D0] flex items-center gap-1.5 text-xs font-semibold transition hover:bg-white/20"
              >
                <Bell size={15} />
                {pendingReqs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F3AB9D] rounded-full border-2 border-[#322E53]" />
                )}
              </button>

              <button className="bg-gradient-to-r from-[#EEC293] to-[#f7c9b9] rounded-lg px-4 py-2 text-xs font-bold text-[#322E53] shadow-md flex items-center gap-1.5">
                <Plus size={14} /> Add Member
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-8 py-8">

          {/* ── PAGE TITLE ── */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#322E53]">Team Overview</h1>
            <p className="text-sm text-gray-400 mt-1">Engineering Division · 12 employees across 6 cities</p>
          </motion.div>

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Team Size"      value={EMPLOYEES.length} sub="across 6 cities"      icon={Users}      color="#322E53" trend="flat" delay={0}    />
            <StatCard label="Present"        value={summary.present}  sub="+1 vs yesterday"       icon={UserCheck}  color="#49426E" trend="up"  delay={0.07}  />
            <StatCard label="Late Today"     value={summary.late}     sub="−1 vs yesterday"       icon={AlertCircle}color="#EEC293" trend="down" delay={0.14} />
            <StatCard label="Absent"         value={summary.absent}   sub="2 unexcused"           icon={UserX}      color="#F3AB9D" trend="down" delay={0.21} />
            <StatCard label="Pending"        value={pendingReqs.length} sub="requests awaiting"   icon={Bell}       color="#F3AB9D" trend="flat" delay={0.28} />
          </div>

          {/* ── MAIN LAYOUT ── */}
          <div className="flex gap-6">

            {/* ──── LEFT COLUMN ──── */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">

              {/* CHARTS ROW */}
              <div className="grid grid-cols-3 gap-5">

                {/* Weekly Attendance Bar Chart */}
                <div className="col-span-2 rounded-2xl p-5 bg-white border border-[#F5E6D0] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm font-extrabold text-[#322E53]">Weekly Attendance</div>
                      <div className="text-xs text-gray-400">Last 7 days · Lahore HQ</div>
                    </div>
                    <div className="flex gap-4">
                      {[["#322E53","Present"],["#EEC293","Late"],["#F3AB9D","Absent"]].map(([c,l]) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                          <span className="text-xs text-gray-400">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={WEEKLY_DATA} barSize={12} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="present" fill="#322E53" radius={[4, 4, 0, 0]} name="Present" />
                      <Bar dataKey="late"    fill="#EEC293" radius={[4, 4, 0, 0]} name="Late" />
                      <Bar dataKey="absent"  fill="#F3AB9D" radius={[4, 4, 0, 0]} name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Dept Pie Chart */}
                <div className="rounded-2xl p-5 bg-white border border-[#F5E6D0] shadow-sm">
                  <div className="text-sm font-extrabold text-[#322E53] mb-0.5">Departments</div>
                  <div className="text-xs text-gray-400 mb-3">Headcount breakdown</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={DEPT_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                        dataKey="value" paddingAngle={3} stroke="none">
                        {DEPT_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {DEPT_DATA.slice(0, 4).map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-sm" style={{ background: d.fill }} />
                          <span className="text-[10px] text-gray-500">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#322E53]">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* OT Trend Area Chart */}
              <div className="rounded-2xl p-5 bg-[#322E53] border border-white/10 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm font-extrabold text-[#F5E6D0]">Overtime Trend (MTD)</div>
                    <div className="text-xs text-[#F5E6D0]/40">Monthly overtime hours · Team total</div>
                  </div>
                  <div className="bg-[#EEC293]/20 border border-[#EEC293]/40 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-extrabold text-[#EEC293]">24.5h this month</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={OT_TREND}>
                    <defs>
                      <linearGradient id="otGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EEC293" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#EEC293" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(245,230,208,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(245,230,208,0.4)" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#EEC293" strokeWidth={2.5} fill="url(#otGrad)" name="OT Hours" dot={{ fill: "#EEC293", r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* TEAM TABLE */}
              <div className="rounded-2xl overflow-hidden bg-white border border-[#F5E6D0] shadow-sm">

                {/* Search + Tabs */}
                <div className="px-5 pt-4 pb-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-extrabold text-[#322E53]">Team Members</div>
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Name, role, city…"
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-[#F5E6D0] text-xs text-[#322E53] bg-[#FAFAFA] outline-none focus:ring-1 focus:ring-[#EEC293] w-48"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {tabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all ${
                          activeTab === t.key
                            ? "bg-[#322E53] text-[#F5E6D0]"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-[#322E53] overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        {["Employee","City","Shift","Status","Clock In / Out","OT MTD","Perf",""].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#F5E6D0]">
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
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-[#F5E6D0] cursor-pointer hover:bg-[#FFFBF5] transition-colors"
                            onClick={() => setSelected(emp)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col">
                                <EmployeeLink
                                  employeeId={emp.id}
                                  employeeName={emp.name}
                                  showAvatar
                                />
                                <div className="text-[11px] text-gray-400 ml-9">{emp.role}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin size={11} /> {emp.city}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: SHIFT_META[emp.shift].color }}>
                                {SHIFT_META[emp.shift].icon} {emp.shift}
                              </div>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={emp.status}  /></td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">{emp.inTime}/{emp.outTime}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-extrabold ${emp.otMTD >= 6 ? "text-[#F3AB9D]" : emp.otMTD >= 3 ? "text-[#EEC293]" : "text-gray-400"}`}>
                                {emp.otMTD}h
                              </span>
                            </td>
                            <td className="px-4 py-3 w-28"><PerfBar value={emp.perf} /></td>
                            <td className="px-4 py-3">
                              <button className="bg-[#F5E6D0] rounded-lg px-3 py-1 text-[11px] font-bold text-[#322E53] hover:bg-[#EBD8B8] transition-colors">
                                <Eye size={12} className="inline-block" /> 
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ──── RIGHT SIDEBAR ──── */}
            <AnimatePresence>
              {showPanel && (
                <motion.div
                  initial={{ opacity: 0, x: 24, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 320 }}
                  exit={{ opacity: 0, x: 24, width: 0 }}
                  className="flex-shrink-0 flex flex-col gap-5 overflow-hidden"
                >
                  {/* Star of Month */}
                  <div className="rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-[#322E53] to-[#322E53] border border-[#EEC293]/40 shadow-xl">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#EEC293] opacity-10 blur-3xl" />
                    <div className="flex items-center gap-2 mb-4">
                      <Star size={13} className="text-[#EEC293] fill-[#EEC293]" />
                      <span className="text-[10px] font-extrabold text-[#EEC293] tracking-wider uppercase">Star of the Month</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar initials={star.initials} color={star.color} size={48} />
                      <div>
                        <div className="text-base font-extrabold text-[#F5E6D0]">
                          <EmployeeLink
                            employeeId={star.id}
                            employeeName={star.name}
                            className="!text-[#F5E6D0] hover:!text-[#EEC293]"
                          />
                        </div>
                        <div className="text-[11px] text-[#F5E6D0]/50 mt-0.5">{star.role}</div>
                        <div className="text-[10px] text-[#F5E6D0]/35 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {star.city} · Since {star.joined}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[["Perf", `${star.perf}%`], ["OT MTD", `${star.otMTD}h`], ["Leaves", `${star.leaves}d`]].map(([k, v]) => (
                        <div key={k} className="bg-white/10 rounded-lg py-2 text-center">
                          <div className="text-[9px] text-[#F5E6D0]/40 uppercase tracking-wide">{k}</div>
                          <div className="text-sm font-extrabold text-[#F5E6D0]">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <ResponsiveContainer width="100%" height={60}>
                        <RadialBarChart innerRadius="60%" outerRadius="100%"
                          data={[{ value: star.perf, fill: "#EEC293" }]}
                          startAngle={180} endAngle={0}>
                          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "rgba(245,230,208,0.08)" }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="rounded-2xl p-5 bg-white border border-[#F5E6D0] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-extrabold text-[#322E53]">Pending Requests</div>
                      {pendingReqs.length > 0 && (
                        <span className="bg-red-50 text-[#F3AB9D] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                          {pendingReqs.length} pending
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {pendingReqs.map(r => (
                          <motion.div
                            key={r.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`rounded-xl p-3 ${r.urgent ? "bg-red-50 border border-red-200" : "bg-[#FAFAFA] border border-[#F5E6D0]"}`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <Avatar initials={r.empInitials} color={r.empColor} size={28} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <EmployeeLink
                                    employeeId={r.empId}
                                    employeeName={r.empName}
                                    size="sm"
                                  />
                                  {r.urgent && (
                                    <span className="text-[9px] font-extrabold bg-[#F3AB9D] text-white px-1.5 py-0.5 rounded-full">URGENT</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400">{r.type} · {r.date}</div>
                              </div>
                            </div>
                            <div className="text-[11px] text-gray-500 mb-2 leading-tight">{r.desc}</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setApproved(a => [...a, r.id]);
                                  toast.success(`${r.empName}'s ${r.type} approved`);
                                }}
                                className="flex-1 bg-green-50 border border-green-200 rounded-lg py-1.5 text-[11px] font-bold text-green-800 hover:bg-green-100"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejected(r2 => [...r2, r.id]);
                                  toast.error(`${r.empName}'s ${r.type} rejected`);
                                }}
                                className="flex-1 bg-red-50 border border-red-200 rounded-lg py-1.5 text-[11px] font-bold text-red-800 hover:bg-red-100"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {pendingReqs.length === 0 && (
                        <div className="text-center py-5 text-gray-400 text-xs">✓ All clear — no pending requests</div>
                      )}
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="rounded-2xl p-5 bg-white border border-[#F5E6D0] shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
                      <span className="text-sm font-extrabold text-[#322E53]">Live Activity</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {ACTIVITY.map((a, i) => {
                        const dotColor =
                          a.type === "in" ? "#49426E" :
                          a.type === "late" ? "#EEC293" :
                          a.type === "leave" ? "#322E53" :
                          a.type === "request" ? "#F3AB9D" : "#9CA3AF";
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3"
                          >
                            <span className="text-[10px] font-mono text-gray-400 w-10 pt-0.5">{a.time}</span>
                            <div className="w-px bg-[#F5E6D0] self-stretch" />
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                              <span className="text-[11px] text-gray-500 leading-tight">{a.msg}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── EMPLOYEE MODAL ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-[#322E53]/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#F5E6D0]"
            >
              <div className="relative p-7 bg-gradient-to-br from-[#322E53]/10 to-[#F5E6D0]/20 border-b border-[#F5E6D0]">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-5 right-5 bg-black/10 rounded-lg p-1.5 hover:bg-black/20 transition"
                >
                  <X size={15} className="text-[#322E53]" />
                </button>
                <div className="flex items-center gap-4">
                  <Avatar initials={selected.initials} color={selected.color} size={56} />
                  <div>
                    <div className="text-xl font-extrabold text-[#322E53]">
                      <EmployeeLink
                        employeeId={selected.id}
                        employeeName={selected.name}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{selected.role} · {selected.dept}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={selected.status} />
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapPin size={10} /> {selected.city}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    ["Employee ID", selected.id],
                    ["Shift", selected.shift],
                    ["Clock In", selected.inTime],
                    ["Clock Out", selected.outTime],
                    ["OT (MTD)", `${selected.otMTD}h`],
                    ["Leaves Used", `${selected.leaves} days`],
                    ["Joined", selected.joined],
                    ["Department", selected.dept],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-[#FAFAFA] border border-[#F5E6D0] rounded-xl p-2.5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</div>
                      <div className="text-sm font-bold text-[#322E53] mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Performance Score</div>
                  <PerfBar value={selected.perf} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                  <button className="flex-2 bg-gradient-to-r from-[#322E53] to-[#322E53] rounded-xl py-2.5 text-xs font-bold text-[#F5E6D0] shadow-md hover:shadow-lg transition">
                    View Full Profile →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}