"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Globe2, Mail, Phone, MapPin, Calendar,
  FileText, Users, ChevronRight, Briefcase, Award, Clock,
  Facebook, Twitter, Linkedin, Instagram, ExternalLink,
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Activity, PieChart as PieIcon, BarChart2, GitBranch,
  Star, Shield, Zap, Edit,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                  */
/* -------------------------------------------------------------------------- */

const company = {
  id: "1",
  legal_name: "Flexi Global Inc.",
  short_code: "FLEXI-US",
  website: "https://flexihr.com",
  description: "Next‑gen HR platform for distributed teams. We help companies manage remote employees with ease, compliance, and clarity.",
  logo: "/logo.png",
  fiscal_year_start: "2025-01",
  support_email: "support@flexihr.com",
  main_phone: "+1-800-555-1234",
  timezone: "America/New_York",
  registered_email: "legal@flexihr.com",
  address: { line1: "123 Market St", line2: "Suite 400", city: "San Francisco", state: "California", country: "United States", zip: "94105" },
  established_on: "2015-04-01",
  registration_no: "REG-987654",
  tax_vat_id: "TAX-123-456",
  currency: "USD",
  letterhead: "/dummy/letterhead.pdf",
  socials: [
    { platform: "linkedin", handle: "flexihr", url: "https://linkedin.com/company/flexihr" },
    { platform: "twitter", handle: "@flexihr", url: "https://twitter.com/flexihr" },
    { platform: "facebook", handle: "flexihr", url: "https://facebook.com/flexihr" },
  ],
};

const stats = [
  { label: "Total Employees", value: "342", icon: Users, change: "+12%", trend: "up", sub: "vs last month" },
  { label: "Departments", value: "8", icon: Briefcase, change: "+2", trend: "up", sub: "new this quarter" },
  { label: "Open Positions", value: "14", icon: Award, change: "-3", trend: "down", sub: "vs last month" },
  { label: "Avg. Tenure", value: "3.2 yrs", icon: Clock, change: "+0.4", trend: "up", sub: "year over year" },
  { label: "Retention Rate", value: "91%", icon: Shield, change: "+2%", trend: "up", sub: "last 12 months" },
  { label: "Hiring Velocity", value: "8/mo", icon: Zap, change: "+3", trend: "up", sub: "roles filled/month" },
];

const divisions = [
  { name: "North America", departments: [
    { name: "Engineering", subDepartments: ["Frontend", "Backend", "DevOps", "QA"], employeeCount: 78 },
    { name: "Sales", subDepartments: ["Enterprise", "SMB", "Customer Success"], employeeCount: 45 },
    { name: "Marketing", subDepartments: ["Content", "SEO", "Brand"], employeeCount: 23 },
  ]},
  { name: "Europe", departments: [
    { name: "Engineering", subDepartments: ["Mobile", "Platform"], employeeCount: 34 },
    { name: "HR", subDepartments: ["Recruiting", "Operations"], employeeCount: 12 },
  ]},
  { name: "Asia Pacific", departments: [
    { name: "Customer Support", subDepartments: ["Tier 1", "Tier 2"], employeeCount: 28 },
    { name: "Finance", subDepartments: ["Accounting", "Payroll"], employeeCount: 15 },
  ]},
];

const recentEmployees = [
  { name: "Alice Johnson", role: "Senior Frontend Dev", avatar: "", department: "Engineering", joined: "Feb 2025" },
  { name: "Bob Smith", role: "Account Executive", avatar: "", department: "Sales", joined: "Jan 2025" },
  { name: "Carla Diaz", role: "HR Manager", avatar: "", department: "HR", joined: "Jan 2025" },
  { name: "David Lee", role: "DevOps Lead", avatar: "", department: "Engineering", joined: "Dec 2024" },
  { name: "Fatima Khan", role: "Finance Analyst", avatar: "", department: "Finance", joined: "Dec 2024" },
];

const growthData = [
  { month: "Sep", employees: 312, hires: 8, exits: 4 },
  { month: "Oct", employees: 324, hires: 14, exits: 2 },
  { month: "Nov", employees: 331, hires: 9, exits: 2 },
  { month: "Dec", employees: 338, hires: 10, exits: 3 },
  { month: "Jan", employees: 342, hires: 7, exits: 3 },
  { month: "Feb", employees: 350, hires: 11, exits: 3 },
];

const deptData = divisions.flatMap(d => d.departments).map(d => ({ name: d.name, value: d.employeeCount }));
const barData = divisions.map(d => ({ name: d.name, employees: d.departments.reduce((a, b) => a + b.employeeCount, 0) }));

const tenureData = [
  { range: "<1 yr", count: 58 },
  { range: "1–2 yrs", count: 72 },
  { range: "2–3 yrs", count: 86 },
  { range: "3–5 yrs", count: 94 },
  { range: "5+ yrs", count: 32 },
];

const radarData = [
  { subject: "Retention", A: 91 },
  { subject: "Engagement", A: 78 },
  { subject: "Productivity", A: 85 },
  { subject: "Satisfaction", A: 72 },
  { subject: "Growth", A: 88 },
  { subject: "Diversity", A: 65 },
];

const hiringFunnelData = [
  { stage: "Applications", count: 420 },
  { stage: "Screened", count: 210 },
  { stage: "Interviewed", count: 84 },
  { stage: "Offered", count: 22 },
  { stage: "Joined", count: 18 },
];

// Brand chart colors
const C = {
  900: "#322E53",
  800: "#322E53",
  700: "#49426E",
  600: "#F3AB9D",
  500: "#EEC293",
  400: "#F3AB9D",
  300: "#f7c9b9",
  100: "#F5E6D0",
};
const PIE_COLORS = [C[800], C[700], C[600], C[500], C[400], C[300], C[900]];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const platformIcon = (p: string) => {
  if (p === "linkedin") return <Linkedin className="h-4 w-4" />;
  if (p === "twitter") return <Twitter className="h-4 w-4" />;
  if (p === "facebook") return <Facebook className="h-4 w-4" />;
  if (p === "instagram") return <Instagram className="h-4 w-4" />;
  return <Globe2 className="h-4 w-4" />;
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

const AVATAR_COLORS = ["bg-brand-900","bg-brand-800","bg-brand-700","bg-brand-600","bg-brand-500"];

/* -------------------------------------------------------------------------- */
/*  Motion variants                                                            */
/* -------------------------------------------------------------------------- */

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } } as const;
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeIn  = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } };

/* -------------------------------------------------------------------------- */
/*  Shared sub-components                                                      */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-brand-700">{children}</p>;
}

function InfoRow({ icon: Icon, label, value, href }: { icon: React.ElementType; label?: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-brand-700" />
      </div>
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>}
        {href ? (
          <a href={href} className="text-sm text-brand-700 hover:text-brand-900 hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm text-brand-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-brand-900 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: <span className="text-brand-900">{p.value}</span></p>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ stat, idx }: { stat: typeof stats[0]; idx: number }) {
  const Icon = stat.icon;
  const accent = [C[800], C[700], C[600], C[500], C[400], C[300]][idx % 6];
  return (
    <motion.div variants={fadeUp}>
      <div className="relative bg-white rounded-xl border border-gray-200 p-4 overflow-hidden hover:shadow-md transition-shadow group">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accent }} />
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: accent + "20" }}>
            <Icon className="h-4.5 w-4.5" style={{ color: accent }} />
          </div>
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full
            ${stat.trend === "up" ? "bg-green-50 text-green-700" : stat.trend === "down" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
            {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : stat.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {stat.change}
          </div>
        </div>
        <p className="text-2xl font-bold text-brand-900 leading-none mb-1">{stat.value}</p>
        <p className="text-xs font-medium text-gray-600">{stat.label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CompanyViewPage() {
  const router = useRouter();

  return (
    <motion.div className="min-h-screen bg-gray-50/60 border" initial="hidden" animate="visible" variants={stagger}>

      {/* ------------------------------------------------------------------ */}
      {/* HERO BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={fadeUp} className="relative overflow-hidden bg-white border-b border-gray-200 px-6 py-8">
        {/* Subtle background accent — very light */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 10% 50%, ${C[800]} 0%, transparent 55%), radial-gradient(circle at 90% 10%, ${C[700]} 0%, transparent 45%)`,
        }} />

        <div className="relative max-w-7xl mx-auto">
          {/* Back + Edit row */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}
              className="gap-1.5 text-brand-800 hover:text-brand-900 hover:bg-brand-100 text-xs">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back
            </Button>
            <Button size="sm" onClick={() => router.push(`/flexi-hq/companies/${company.id}/edit`)}
              className="gap-1.5 bg-brand-800 text-white hover:bg-brand-900 text-xs">
              <Edit className="h-3.5 w-3.5" /> Edit Company
            </Button>
          </div>

          {/* Company identity */}
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {/* Logo */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 border border-brand-300 flex-shrink-0">
              <Building2 className="h-8 w-8 text-brand-800" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-brand-900">{company.legal_name}</h1>
                <Badge className="bg-brand-100 text-brand-800 border-brand-300 text-[10px] font-mono">{company.short_code}</Badge>
                <Badge className="bg-brand-700 text-white border-transparent text-[10px]">Active</Badge>
              </div>
              <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{company.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Globe2 className="h-3 w-3 text-brand-600" />{company.website}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand-600" />{company.address.city}, {company.address.country}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-brand-600" />Est. {formatDate(company.established_on)}</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {company.socials.map(s => (
                <a key={s.platform} href={s.url} target="_blank" rel="noopener"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-800 hover:text-white border border-brand-300 transition-colors">
                  {platformIcon(s.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* STATS STRIP                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 -mt-px">
        <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 py-5">
          {stats.map((s, i) => <StatCard key={s.label} stat={s} idx={i} />)}
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white border border-gray-200 h-10 p-1 mb-6 rounded-lg">
            {[
              { value: "overview",      label: "Overview",        icon: Activity   },
              { value: "analytics",     label: "Analytics",       icon: BarChart2  },
              { value: "organization",  label: "Organization",    icon: GitBranch  },
              { value: "contact",       label: "Contact & Legal", icon: FileText   },
              { value: "digital",       label: "Digital",         icon: Globe2     },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="flex items-center gap-1.5 text-xs font-medium data-[state=active]:bg-brand-800 data-[state=active]:text-white text-gray-500 rounded-md px-3">
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ============================================================ */}
          {/* OVERVIEW TAB                                                  */}
          {/* ============================================================ */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">

              {/* Area chart — growth */}
              <motion.div variants={fadeUp} className="lg:col-span-2">
                <Card className="border-gray-200 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-brand-700" /> Workforce Growth
                      </CardTitle>
                      <Badge className="bg-brand-100 text-brand-800 border-transparent text-[10px]">Last 6 months</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C[800]} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C[800]} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C[700]} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C[700]} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="employees" name="Employees" stroke={C[800]} strokeWidth={2} fill="url(#empGrad)" dot={{ r: 3, fill: C[800] }} />
                        <Area type="monotone" dataKey="hires" name="Hires" stroke={C[700]} strokeWidth={2} fill="url(#hireGrad)" dot={{ r: 3, fill: C[700] }} />
                        <Area type="monotone" dataKey="exits" name="Exits" stroke={C[600]} strokeWidth={2} fill="none" dot={{ r: 3, fill: C[600] }} strokeDasharray="4 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Radar chart — health score */}
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                      <Star className="h-4 w-4 text-brand-700" /> Org Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke={C[800]} fill={C[800]} fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: C[800] }} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tenure distribution */}
            <div className="grid gap-5 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 h-full shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-700" /> Tenure Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={tenureData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                          {tenureData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent employees */}
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 h-full shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-700" /> Recent Employees
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-[11px] text-brand-700 h-6 px-2">View all →</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentEmployees.map((e, i) => (
                      <div key={e.name} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-[11px] font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {initials(e.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-900 truncate">{e.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{e.role} · {e.department}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{e.joined}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ANALYTICS TAB                                                 */}
          {/* ============================================================ */}
          <TabsContent value="analytics" className="space-y-5">

            {/* Hiring funnel + Pie row */}
            <div className="grid gap-5 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-brand-700" /> Hiring Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={hiringFunnelData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                          {hiringFunnelData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                      <PieIcon className="h-4 w-4 text-brand-700" /> Dept. Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie data={deptData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                          {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {deptData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-gray-600 flex-1 truncate">{d.name}</span>
                          <span className="font-semibold text-brand-900">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Division bar + hires/exits bar */}
            <div className="grid gap-5 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Employees by Division</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="employees" name="Employees" fill={C[700]} radius={[4, 4, 0, 0]}>
                          {barData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Hires vs Exits (6 months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="hires" name="Hires" fill={C[700]} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="exits" name="Exits" fill={C[600]} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Department progress bars */}
            <motion.div variants={fadeUp}>
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-brand-900">Department Headcount Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {deptData.map((d, i) => (
                      <div key={d.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-brand-800">{d.name}</span>
                          <span className="text-gray-500">{d.value} · {Math.round(d.value / 342 * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.value / 342) * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ORGANIZATION TAB                                              */}
          {/* ============================================================ */}
          <TabsContent value="organization" className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {divisions.map((div, di) => (
                <motion.div key={div.name} variants={fadeUp}>
                  <Card className="border-gray-200 h-full shadow-none overflow-hidden">
                    <div className="h-1" style={{ backgroundColor: PIE_COLORS[di % PIE_COLORS.length] }} />
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-brand-900">{div.name}</CardTitle>
                        <Badge className="text-[10px] border-transparent font-semibold" style={{ backgroundColor: PIE_COLORS[di % PIE_COLORS.length] + "20", color: PIE_COLORS[di % PIE_COLORS.length] }}>
                          {div.departments.reduce((a, b) => a + b.employeeCount, 0)} emp
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {div.departments.map(dept => (
                        <div key={dept.name} className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-brand-800">{dept.name}</p>
                            <span className="text-[10px] text-gray-500 font-medium">{dept.employeeCount}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dept.subDepartments.map(sub => (
                              <span key={sub} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md">{sub}</span>
                            ))}
                          </div>
                          <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${(dept.employeeCount / 100) * 100}%`,
                              backgroundColor: PIE_COLORS[di % PIE_COLORS.length],
                              opacity: 0.7,
                            }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* CONTACT & LEGAL TAB                                           */}
          {/* ============================================================ */}
          <TabsContent value="contact" className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Contact Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow icon={Mail} label="Support Email" value={company.support_email} href={`mailto:${company.support_email}`} />
                    <InfoRow icon={Mail} label="Registered Email" value={company.registered_email} href={`mailto:${company.registered_email}`} />
                    <InfoRow icon={Phone} label="Main Phone" value={company.main_phone} />
                    <InfoRow icon={Clock} label="Timezone" value={company.timezone} />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Registered Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow icon={MapPin} label="Street" value={company.address.line1} />
                    <InfoRow icon={Building2} label="Suite" value={company.address.line2} />
                    <InfoRow icon={MapPin} label="City & State" value={`${company.address.city}, ${company.address.state} ${company.address.zip}`} />
                    <InfoRow icon={Globe2} label="Country" value={company.address.country} />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Legal & Financial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow icon={FileText} label="Registration No." value={company.registration_no} />
                    <InfoRow icon={Shield} label="Tax / VAT ID" value={company.tax_vat_id} />
                    <InfoRow icon={Globe2} label="Currency" value={company.currency} />
                    <InfoRow icon={Calendar} label="Established" value={formatDate(company.established_on)} />
                    <InfoRow icon={Calendar} label="Fiscal Year Start" value={company.fiscal_year_start} />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {company.letterhead && (
              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none">
                  <CardContent className="pt-4">
                    <a href={company.letterhead} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 hover:underline">
                      <FileText className="h-4 w-4" /> View Official Letterhead
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ============================================================ */}
          {/* DIGITAL TAB                                                   */}
          {/* ============================================================ */}
          <TabsContent value="digital" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div variants={fadeUp} className="lg:col-span-2">
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Social Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {company.socials.map(s => (
                        <a key={s.platform} href={s.url} target="_blank" rel="noopener"
                          className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-brand-50 hover:border-brand-300 transition-colors text-center group">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 group-hover:bg-brand-800 group-hover:text-white transition-colors">
                            {platformIcon(s.platform)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-800 capitalize">{s.platform}</p>
                            <p className="text-[11px] text-gray-500">{s.handle}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-brand-700" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-gray-200 shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-900">Web & Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow icon={Globe2} label="Website" value={company.website} href={company.website} />
                    <InfoRow icon={Mail} label="Support Email" value={company.support_email} href={`mailto:${company.support_email}`} />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </motion.div>
  );
}