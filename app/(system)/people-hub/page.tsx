// app/(system)/people-hub/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  LogOut,
  Clock,
  FileCheck,
  UserCog,
  Award,
  Shield,
  BarChart3,
  TrendingUp,
  History,
  Layers,
  MapPin,
  GitBranch,
  Briefcase,
  AlertCircle,
  GraduationCap,
  BookOpen,
  UserX,
  CheckCircle2,
  ClipboardList,
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
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAB_LIST_CLS, TAB_TRIGGER_CLS } from "@/lib/ui-constants";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MOCK_STATS = [
  {
    title: "Total Employees",
    value: "1,247",
    icon: Users,
    change: "+3.2%",
    href: "/people-hub/employees",
    cardBg: "bg-gradient-to-br from-[#322E53] to-[#49426E]",
  },
  {
    title: "New Joiners",
    value: "34",
    icon: UserPlus,
    change: "+11",
    href: "/people-hub/onboarding",
    cardBg: "bg-gradient-to-br from-[#49426E] to-[#5c5490]",
  },
  {
    title: "Probation Reviews Due",
    value: "21",
    icon: Clock,
    change: "+4",
    href: "/people-hub/probation",
    cardBg: "bg-gradient-to-br from-[#EEC293] to-[#e8b57a]",
    textColor: "text-[#322E53]",
  },
  {
    title: "ESS Requests Pending",
    value: "47",
    icon: FileCheck,
    change: "+12",
    href: "/people-hub/ess-profile",
    cardBg: "bg-gradient-to-br from-[#F3AB9D] to-[#ef9083]",
    textColor: "text-[#322E53]",
  },
  {
    title: "Exit Cases Active",
    value: "12",
    icon: LogOut,
    change: "+1",
    href: "/people-hub/exits",
    cardBg: "bg-gradient-to-br from-[#5c5490] to-[#49426E]",
  },
  {
    title: "Skills Pending Review",
    value: "89",
    icon: Award,
    change: "+7",
    href: "/people-hub/approvals",
    cardBg: "bg-gradient-to-br from-[#322E53] to-[#5c5490]",
  },
];

const MOCK_DEPT_HEADCOUNT = [
  { department: "IT", headcount: 128, open: 5 },
  { department: "HR", headcount: 42, open: 2 },
  { department: "Finance", headcount: 63, open: 1 },
  { department: "Sales", headcount: 345, open: 12 },
  { department: "Operations", headcount: 274, open: 8 },
  { department: "Admin", headcount: 56, open: 0 },
];

const MOCK_HEADCOUNT_BY_GRADE = [
  { grade: "E1-E2", count: 98 },
  { grade: "M1-M3", count: 212 },
  { grade: "S1-S3", count: 668 },
  { grade: "W1-W2", count: 158 },
  { grade: "Intern", count: 111 },
];

const CHART = {
  navy: "#1E1A3A",   // brand-900
  dark: "#322E53",   // brand-800 — primary
  sage: "#49426E",   // brand-700
  gold: "#EEC293",   // brand-500 — Flexi peach
  rose: "#F3AB9D",   // brand-400 — salmon
  peach: "#f7c9b9",  // brand-300
  sand: "#5c5490",   // brand-600
};

/* Department-specific palette (matches Bata director spec) */
const DEPT_COLORS: Record<string, string> = {
  Engineering: "#322E53", // brand-800
  IT:          "#322E53", // brand-800
  HR:          "#49426E", // brand-700
  Finance:     "#EEC293", // brand-500
  Sales:       "#F3AB9D", // brand-400
  Operations:  "#5c5490", // brand-600
  Marketing:   "#f7c9b9", // brand-300
  Admin:       "#f7c9b9", // brand-300
  Legal:       "#f7c9b9", // brand-300
};

/* Monthly attrition trend (last 6 months) */
const MOCK_ATTRITION_TREND = [
  { month: "Oct", exits: 2 },
  { month: "Nov", exits: 3 },
  { month: "Dec", exits: 1 },
  { month: "Jan", exits: 4 },
  { month: "Feb", exits: 2 },
  { month: "Mar", exits: 3 },
];

/* Tenure distribution */
const MOCK_TENURE_DISTRIBUTION = [
  { band: "<1yr",  count: 34 },
  { band: "1-3yr", count: 89 },
  { band: "3-5yr", count: 67 },
  { band: "5yr+",  count: 48 },
];

/* Employment type split */
const MOCK_EMPLOYMENT_TYPE_SPLIT = [
  { name: "Permanent", value: 68, color: "#322E53" }, // brand-800
  { name: "Contract",  value: 22, color: "#EEC293" }, // brand-500
  { name: "Intern",    value: 10, color: "#F3AB9D" }, // brand-400
];

const MOCK_BRANCH_DISTRIBUTION = [
  { name: "Head Office", value: 320, color: CHART.navy },
  { name: "Regional Offices", value: 480, color: CHART.dark },
  { name: "Factories", value: 210, color: CHART.sage },
  { name: "Warehouses", value: 97, color: CHART.gold },
  { name: "Field Offices", value: 140, color: CHART.rose },
];

const MOCK_HEADCOUNT_TREND = [
  { month: "Oct", headcount: 1180 },
  { month: "Nov", headcount: 1203 },
  { month: "Dec", headcount: 1228 },
  { month: "Jan", headcount: 1235 },
  { month: "Feb", headcount: 1247 },
  { month: "Mar", headcount: 1270 },
];

const MOCK_RECENT_ACTIVITIES = [
  { id: 1, name: "Aisha Khan", action: "joined", role: "Software Engineer", date: "2025-03-10", avatar: "AK", status: "onboarding" },
  { id: 2, name: "Bilal Ahmed", action: "promoted", role: "Senior HRBP", date: "2025-03-09", avatar: "BA", status: "career" },
  { id: 3, name: "Fatima Tariq", action: "transferred", role: "Marketing Specialist", date: "2025-03-08", avatar: "FT", status: "career" },
  { id: 4, name: "Omar Farooq", action: "confirmed", role: "Accountant", date: "2025-03-07", avatar: "OF", status: "probation" },
  { id: 5, name: "Sana Malik", action: "updated skill", role: "Project Manager (PMP)", date: "2025-03-06", avatar: "SM", status: "skills" },
  { id: 6, name: "Naveed Iqbal", action: "resigned", role: "Supervisor", date: "2025-03-05", avatar: "NI", status: "exit" },
];

const MOCK_PROBATION_DUE = [
  { name: "Usman Chaudhry", endDate: "2025-04-15", manager: "Zara Tariq", avatar: "UC", recommendation: "Pending" },
  { name: "Hira Naeem", endDate: "2025-04-22", manager: "Ahmed Raza", avatar: "HN", recommendation: "Review Scheduled" },
  { name: "Rizwan Ali", endDate: "2025-05-01", manager: "Fatima Khan", avatar: "RA", recommendation: "Extension Suggested" },
  { name: "Nadia Aslam", endDate: "2025-05-10", manager: "Omar Farooq", avatar: "NA", recommendation: "Pending" },
];

const MOCK_EXIT_CLEARANCE = [
  { name: "Zubair Ahmed", lwd: "2025-03-20", dept: "IT", status: "pending", fnf: "Pending" },
  { name: "Sara Riaz", lwd: "2025-03-22", dept: "Finance", status: "in-progress", fnf: "Calculated" },
  { name: "Kamran Haider", lwd: "2025-03-25", dept: "Sales", status: "pending", fnf: "Pending" },
];

const MOCK_ESS_REQUESTS = [
  { id: 1, employee: "Maham Ali", type: "Bank Details Update", status: "Pending HR", submitted: "2h ago" },
  { id: 2, employee: "Abdullah Khan", type: "Address Change", status: "Pending Approval", submitted: "5h ago" },
//   { id: 3, employee: "Sadia Noor", type: "Dependent Update", status: "Pending HR", submitted: "1d ago" },
//   { id: 4, employee: "Hamza Tariq", type: "Education Upload", status: "More Info Needed", submitted: "1d ago" },
];

const MOCK_ONBOARDING_STATUS = [
  { name: "Pre-Joining", value: 10, color: CHART.navy },
  { name: "In-Progress", value: 24, color: CHART.gold },
  { name: "Completed", value: 68, color: CHART.sage },
  { name: "Cancelled", value: 3, color: CHART.rose },
];

const MOCK_SKILL_DISTRIBUTION = [
  { skill: "Leadership", employees: 95 },
  { skill: "Project Mgmt", employees: 120 },
  { skill: "React", employees: 85 },
  { skill: "Laravel", employees: 72 },
  { skill: "Electrical Safety", employees: 210 },
];

const MOCK_SKILL_GAPS = [
  { designation: "Supervisor", gap: 22 },
  { designation: "Engineer", gap: 15 },
  { designation: "Officer", gap: 10 },
  { designation: "Manager", gap: 7 },
  { designation: "HRBP", gap: 5 },
];

const MOCK_COMPLIANCE_ALERTS = [
  { category: "CNIC Expiring Soon", count: 23, severity: "high", link: "/people-hub/approvals?alert=cnic" },
  { category: "Certifications Expiring", count: 47, severity: "medium", link: "/people-hub/approvals?alert=cert" },
  { category: "Missing Employee Documents", count: 89, severity: "high", link: "/people-hub/bulk-import" },
  { category: "EOBI Nominee Incomplete", count: 12, severity: "low", link: "/people-hub/ess-profile" },
];

const MOCK_DISCIPLINARY_CASES = [
  { name: "Farhan Javed", type: "Written Warning", category: "Attendance", status: "Open" },
  { name: "Adeel Shah", type: "Show-Cause Notice", category: "Policy Violation", status: "Pending Response" },
  { name: "Rukhsar Ahmed", type: "Inquiry", category: "Misconduct", status: "Under Inquiry" },
];

const severityClasses: Record<string, string> = {
  high: "bg-brand-600 text-white border-transparent",
  medium: "bg-brand-500 text-white border-transparent",
  low: "bg-brand-700 text-white border-transparent",
};

const statusClasses: Record<string, string> = {
  Pending: "bg-brand-100 text-brand-800 border-brand-300",
  "Review Scheduled": "bg-brand-100 text-brand-800 border-brand-300",
  "Extension Suggested": "bg-brand-100 text-brand-800 border-brand-300",
  "Pending HR": "bg-brand-100 text-brand-800 border-brand-300",
  "Pending Approval": "bg-brand-100 text-brand-800 border-brand-300",
  "More Info Needed": "bg-brand-100 text-brand-800 border-brand-300",
  pending: "bg-brand-100 text-brand-800 border-brand-300",
  "in-progress": "bg-brand-100 text-brand-800 border-brand-300",
  Open: "bg-brand-100 text-brand-800 border-brand-300",
  "Pending Response": "bg-brand-100 text-brand-800 border-brand-300",
  "Under Inquiry": "bg-brand-100 text-brand-800 border-brand-300",
  Calculated: "bg-brand-100 text-brand-800 border-brand-300",
};

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART.sand}`,
};

const gridStroke = `${CHART.sand}60`;
const tickStyle = { fill: CHART.sage };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

function MiniBars() {
  return (
    <div className="mt-3 flex gap-0.5">
      {[40, 65, 80, 55, 70, 90, 60].map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-white/30"
          style={{ height: `${h * 0.18}px` }}
        />
      ))}
    </div>
  );
}

function SectionSkeleton({ height = "h-[220px]" }: { height?: string }) {
  return <Skeleton className={`w-full rounded-xl ${height}`} />;
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export default function PeopleHubDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Onboarding Completion",
        value: 86,
        icon: CheckCircle2,
        description: "Overall checklist completion",
      },
      {
        label: "Exit Clearance Completion",
        value: 73,
        icon: ClipboardList,
        description: "Average clearance progress",
      },
      {
        label: "Skill Coverage",
        value: 78,
        icon: Award,
        description: "Mapped required vs rated skills",
      },
    ],
    []
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex min-h-screen flex-col gap-6 bg-white p-6 md:p-8"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-brand-900 tracking-tight leading-tight">
            People Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Employee lifecycle, workforce visibility, approvals, and HR operations in one place
          </p>
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
          <Link href="/people-hub/employees">
            <UserPlus className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Add Employee</p>
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
          <Link href="/people-hub/onboarding">
            <UserPlus className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Start Onboarding</p>
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
          <Link href="/people-hub/transfer-promotion">
            <GitBranch className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Transfer / Promotion</p>
      </TooltipContent>
    </TooltipPrimitive>

    <TooltipPrimitive>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          asChild
          size="icon"
          className="h-8 w-8 border-brand-500 text-brand-500 hover:bg-brand-100"
        >
          <Link href="/people-hub/exits">
            <LogOut className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Process Exit</p>
      </TooltipContent>
    </TooltipPrimitive>
  </TooltipProvider>
</div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI Cards                                                          */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {MOCK_STATS.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link href={stat.href} key={stat.title}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card
                  className={`h-full overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl ${stat.cardBg}`}
                >
                  <div className={`p-4 ${(stat as any).textColor || "text-white"}`}>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 opacity-90" />
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(stat as any).textColor ? "bg-[#322E53]/15 text-[#322E53]" : "bg-white/20 text-white"}`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs opacity-90">{stat.title}</div>
                    </div>
                    <MiniBars />
                  </div>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick Actions                                                      */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          asChild
          className="border-brand-800 bg-white text-brand-800 hover:bg-brand-100"
        >
          <Link href="/people-hub/ess-profile">
            <FileCheck className="mr-2 h-4 w-4" />
            Approve ESS Changes
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="border-brand-700 bg-white text-brand-700 hover:bg-brand-100"
        >
          <Link href="/people-hub/probation">
            <Clock className="mr-2 h-4 w-4" />
            Probation Tracker
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="border-brand-600 bg-white text-brand-600 hover:bg-brand-100"
        >
          <Link href="/people-hub/approvals">
            <Award className="mr-2 h-4 w-4" />
            Skill Matrix
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="border-brand-300 bg-white text-brand-800 hover:bg-brand-100"
        >
          <Link href="/people-hub/approvals">
            <Shield className="mr-2 h-4 w-4" />
            Compliance Alerts
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="border-brand-400 bg-white text-brand-800 hover:bg-brand-100"
        >
          <Link href="/people-hub/approvals">
            <AlertCircle className="mr-2 h-4 w-4" />
            Disciplinary Cases
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="border-brand-500 bg-white text-brand-800 hover:bg-brand-100"
        >
          <Link href="/people-hub/employees">
            <UserCog className="mr-2 h-4 w-4" />
            Employee Directory
          </Link>
        </Button>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Tabs                                                               */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className={TAB_LIST_CLS}>
            <TabsTrigger value="overview"   className={TAB_TRIGGER_CLS}>Overview</TabsTrigger>
            <TabsTrigger value="analytics"  className={TAB_TRIGGER_CLS}>Analytics</TabsTrigger>
            <TabsTrigger value="operations" className={TAB_TRIGGER_CLS}>Operations</TabsTrigger>
            <TabsTrigger value="compliance" className={TAB_TRIGGER_CLS}>Compliance</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* Overview                                                         */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="overview" className="space-y-6">
            {/* Workforce Snapshot */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <Layers className="mr-2 h-4 w-4 text-brand-800" />
                      Headcount by Department
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Workforce spread across departments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={MOCK_DEPT_HEADCOUNT}
                          layout="vertical"
                          margin={{ top: 5, right: 5, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStroke}
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, ...tickStyle }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey="department"
                            type="category"
                            tick={{ fontSize: 10, ...tickStyle }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                          />
                          <Tooltip cursor={{ fill: "#F5E6D040" }} contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="headcount"
                            fill={CHART.dark}
                            radius={[0, 4, 4, 0]}
                            barSize={10}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <BarChart3 className="mr-2 h-4 w-4 text-brand-500" />
                      Headcount by Grade
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Employee distribution by grade bands
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={MOCK_HEADCOUNT_BY_GRADE}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStroke}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="grade"
                            tick={{ fontSize: 10, ...tickStyle }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip cursor={{ fill: "#F5E6D040" }} contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="count"
                            fill={CHART.gold}
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <MapPin className="mr-2 h-4 w-4 text-brand-600" />
                      Employees by Branch Type
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Distribution across business locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <RePieChart>
                          <Pie
                            data={MOCK_BRANCH_DISTRIBUTION}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_BRANCH_DISTRIBUTION.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.color}
                                stroke="white"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend
                            verticalAlign="bottom"
                            height={24}
                            iconSize={8}
                            wrapperStyle={{ fontSize: 10, color: CHART.sage }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Activity + Trend */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={itemVariants}>
                <Card className="border border-brand-300 h-full bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <TrendingUp className="mr-2 h-4 w-4 text-brand-800" />
                      Headcount Trend (Last 6 Months)
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Monthly growth of active employees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[200px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={MOCK_HEADCOUNT_TREND}
                          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, ...tickStyle }} />
                          <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="headcount"
                            stroke={CHART.dark}
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

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <History className="mr-2 h-4 w-4 text-brand-800" />
                      Employee Lifecycle Activity
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Latest onboarding, career, probation, and exit actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_RECENT_ACTIVITIES.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 border border-brand-300">
                            <AvatarFallback className="bg-brand-100 text-[10px] text-brand-900">
                              {item.avatar}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-brand-900">
                                {item.name}
                              </span>
                              <Badge className="border border-brand-300 bg-brand-100 px-1 text-[10px] text-brand-700">
                                {item.action}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-brand-700">
                              {item.role} · {item.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 px-0 text-xs text-brand-800"
                      asChild
                    >
                      <Link href="/people-hub/employees">View employee timeline →</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Probation + Exit */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <Clock className="mr-2 h-4 w-4 text-brand-700" />
                      Probation Reviews Due
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Upcoming manager review actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_PROBATION_DUE.map((item) => (
                        <div key={item.name} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 border border-brand-300">
                            <AvatarFallback className="bg-brand-100 text-[10px] text-brand-900">
                              {item.avatar}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-brand-900">
                                {item.name}
                              </span>
                              <Badge
                                className={`border px-1 text-[10px] ${
                                  statusClasses[item.recommendation] ??
                                  "bg-brand-100 text-brand-800 border-brand-300"
                                }`}
                              >
                                {item.recommendation}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-brand-700">
                              Ends {item.endDate}
                            </div>
                            <div className="text-[10px] text-brand-700">
                              Manager: {item.manager}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 px-0 text-xs text-brand-800"
                      asChild
                    >
                      <Link href="/people-hub/probation">View all due reviews →</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <LogOut className="mr-2 h-4 w-4 text-brand-600" />
                      Exit Clearance & FnF
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Employees in notice period and settlement flow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_EXIT_CLEARANCE.map((item) => (
                        <div key={item.name} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 border border-brand-300">
                            <AvatarFallback className="bg-brand-100 text-[10px] text-brand-900">
                              {item.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-brand-900">
                                {item.name}
                              </span>
                              <Badge className="border border-brand-300 bg-brand-100 px-1 text-[10px] text-brand-700">
                                {item.dept}
                              </Badge>
                              <Badge
                                className={`border px-1 text-[10px] ${
                                  statusClasses[item.status] ??
                                  "bg-brand-100 text-brand-800 border-brand-300"
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-brand-700">
                              <span>LWD: {item.lwd}</span>
                              <span>·</span>
                              <span>FnF: {item.fnf}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 px-0 text-xs text-brand-800"
                      asChild
                    >
                      <Link href="/people-hub/exits">View all exits →</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ESS + Skills + Summary */}
            <div className="grid gap-6 xl:grid-cols-3">
              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <FileCheck className="mr-2 h-4 w-4 text-brand-800" />
                      ESS Requests Queue
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Profile changes awaiting action
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_ESS_REQUESTS.map((req) => (
                        <div key={req.id} className="rounded-lg border border-brand-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-brand-900">
                                {req.employee}
                              </div>
                              <div className="text-[10px] text-brand-700">{req.type}</div>
                            </div>
                            <Badge
                              className={`border px-1 text-[10px] ${
                                statusClasses[req.status] ??
                                "bg-brand-100 text-brand-800 border-brand-300"
                              }`}
                            >
                              {req.status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-[10px] text-brand-700">
                            Submitted {req.submitted}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 px-0 text-xs text-brand-800"
                      asChild
                    >
                      <Link href="/people-hub/ess-profile">View all ESS requests →</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <Award className="mr-2 h-4 w-4 text-brand-600" />
                      Skill Coverage Snapshot
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Most visible skills mapped in workforce
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <SectionSkeleton height="h-[210px]" />
                    ) : (
                      <ResponsiveContainer width="100%" height={210}>
                        <BarChart
                          data={MOCK_SKILL_DISTRIBUTION}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis
                            dataKey="skill"
                            tick={{ fontSize: 10, ...tickStyle }}
                            axisLine={false}
                            tickLine={false}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis hide />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="employees"
                            fill={CHART.dark}
                            radius={[4, 4, 0, 0]}
                            barSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border border-brand-300 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                      <Briefcase className="mr-2 h-4 w-4 text-brand-700" />
                      HR Operations Summary
                    </CardTitle>
                    <CardDescription className="text-xs text-brand-700">
                      Quick health view across core workflows
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {summaryMetrics.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-brand-900">{item.label}</div>
                                <div className="text-[10px] text-brand-700">{item.description}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-brand-900">{item.value}%</div>
                          </div>
                          <Progress value={item.value} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Analytics                                                        */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Headcount vs Open Positions
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Filled vs open roles across departments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <SectionSkeleton height="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={MOCK_DEPT_HEADCOUNT}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis
                          dataKey="department"
                          tick={{ fontSize: 11, ...tickStyle }}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: CHART.sage }} />
                        <Bar
                          dataKey="headcount"
                          name="Filled"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        >
                          {MOCK_DEPT_HEADCOUNT.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={DEPT_COLORS[entry.department] || CHART.dark}
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="open"
                          fill={CHART.gold}
                          name="Open"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Onboarding Status Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Current onboarding pipeline stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <SectionSkeleton height="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={MOCK_ONBOARDING_STATUS}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name }) => name}
                          labelLine={false}
                        >
                          {MOCK_ONBOARDING_STATUS.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.color}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Skill Gap by Designation
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Roles needing the most upskilling attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <SectionSkeleton height="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={MOCK_SKILL_GAPS}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis
                          dataKey="designation"
                          tick={{ fontSize: 11, ...tickStyle }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                          dataKey="gap"
                          fill={CHART.rose}
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Workforce Capability Mix
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Key mapped skill categories in the workforce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <SectionSkeleton height="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={MOCK_SKILL_DISTRIBUTION}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis
                          dataKey="skill"
                          tick={{ fontSize: 10, ...tickStyle }}
                          angle={-15}
                          textAnchor="end"
                          height={55}
                        />
                        <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                          dataKey="employees"
                          fill={CHART.gold}
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Attrition Trend + Workforce Composition ── */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Attrition (Last 6 Months)
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Monthly exit volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={MOCK_ATTRITION_TREND} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, ...tickStyle }} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="exits"
                        stroke="#F3AB9D"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#F3AB9D" }}
                        activeDot={{ r: 6, fill: "#322E53" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Tenure Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Workforce by years of service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MOCK_TENURE_DISTRIBUTION} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="band" tick={{ fontSize: 11, ...tickStyle }} />
                      <YAxis tick={{ fontSize: 11, ...tickStyle }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#322E53" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Employment Type
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Permanent vs Contract vs Intern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={MOCK_EMPLOYMENT_TYPE_SPLIT}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {MOCK_EMPLOYMENT_TYPE_SPLIT.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Operations                                                       */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border border-brand-300 bg-white shadow-md xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-brand-900">
                    <UserPlus className="mr-2 h-4 w-4 text-brand-700" />
                    Onboarding Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    New hires moving through the onboarding flow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_ONBOARDING_STATUS.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-brand-900">{item.name}</div>
                        <div className="text-brand-700">{item.value}</div>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                  <Button
                    asChild
                    className="mt-2 w-full bg-brand-800 text-white hover:bg-brand-900"
                  >
                    <Link href="/people-hub/onboarding">Open Onboarding Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-brand-900">
                    <GitBranch className="mr-2 h-4 w-4 text-brand-700" />
                    Career Events
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Role changes, transfers, and growth actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Promotions Pending Approval", value: 8 },
                    { label: "Transfers in Process", value: 11 },
                    { label: "Reporting Changes", value: 5 },
                    { label: "Contract Renewals Due", value: 6 },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-lg border border-brand-200 p-3"
                    >
                      <span className="text-sm text-brand-900">{row.label}</span>
                      <Badge className="border border-brand-300 bg-brand-100 text-brand-800">
                        {row.value}
                      </Badge>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-brand-800 text-brand-800 hover:bg-brand-100"
                  >
                    <Link href="/people-hub/transfer-promotion">Open Career Events</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-brand-900">
                    <UserX className="mr-2 h-4 w-4 text-brand-700" />
                    Disciplinary Tracker
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Open cases and employee action status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_DISCIPLINARY_CASES.map((item) => (
                    <div key={`${item.name}-${item.type}`} className="rounded-lg border border-brand-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-brand-900">{item.name}</div>
                        <Badge
                          className={`border px-1 text-[10px] ${
                            statusClasses[item.status] ??
                            "bg-brand-100 text-brand-800 border-brand-300"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[10px] text-brand-700">
                        {item.type} · {item.category}
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-brand-800 text-brand-800 hover:bg-brand-100"
                  >
                    <Link href="/people-hub/approvals">Open Disciplinary Cases</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-brand-900">
                    <GraduationCap className="mr-2 h-4 w-4 text-brand-700" />
                    Education & Certifications
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Qualification and certification operations snapshot
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "New Qualifications Awaiting Verification", value: 14 },
                    { label: "Certification Renewals This Month", value: 9 },
                    { label: "HEC Verification Pending", value: 6 },
                    { label: "Expired Certifications", value: 4 },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-brand-200 bg-white p-4"
                    >
                      <div className="text-xs text-brand-700">{row.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-brand-900">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-brand-900">
                    <BookOpen className="mr-2 h-4 w-4 text-brand-700" />
                    Core Records Health
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Completeness of profile, documents, and dependent data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: "Employee 360 Profile Completion", value: 92 },
                    { label: "Dependents & NOK Completion", value: 76 },
                    { label: "Bank Detail Completion", value: 88 },
                    { label: "Document Coverage", value: 81 },
                  ].map((row) => (
                    <div key={row.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-brand-900">{row.label}</div>
                        <div className="text-brand-700">{row.value}%</div>
                      </div>
                      <Progress value={row.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Compliance                                                       */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Compliance & Alerts
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Pakistani HR compliance items requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {MOCK_COMPLIANCE_ALERTS.map((alert) => (
                      <div key={alert.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium text-brand-900">{alert.category}</div>
                          <Badge className={`text-[10px] ${severityClasses[alert.severity]}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <Progress
                          value={alert.count > 50 ? 100 : alert.count * 2}
                          className="h-1.5"
                        />
                        <div className="flex justify-between text-[10px]">
                          <span className="text-brand-700">{alert.count} pending</span>
                          <Link
                            href={alert.link}
                            className="font-medium text-brand-800 hover:underline"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="mt-6 w-full bg-brand-800 text-xs text-white hover:bg-brand-900"
                  >
                    <Link href="/people-hub/approvals">
                      <Shield className="mr-2 h-3 w-3" />
                      Manage Compliance
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-brand-900">
                    Statutory Readiness
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    Core record readiness for compliance processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: "CNIC Coverage", value: 96 },
                    { label: "IBAN Completion", value: 88 },
                    { label: "EOBI Number Coverage", value: 84 },
                    { label: "PESSI / SESSI Coverage", value: 79 },
                    { label: "Dual-Language Fields", value: 64 },
                  ].map((row) => (
                    <div key={row.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-brand-900">{row.label}</div>
                        <div className="text-brand-700">{row.value}%</div>
                      </div>
                      <Progress value={row.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}