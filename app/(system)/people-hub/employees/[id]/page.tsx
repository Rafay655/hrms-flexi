"use client";

import React, { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Clock,
  Award,
  TrendingUp,
  Download,
  Edit,
  Trash2,
  FileText,
  CreditCard,
  Home,
  UserCircle,
  CheckCircle2,
  Sparkles,
  Activity,
  ArrowUpRight,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Types & Constants
// -----------------------------------------------------------------------------

const EMPLOYMENT_TYPES = [
  "Permanent",
  "Contract",
  "Probation",
  "Intern",
  "Daily-Wage",
] as const;

const WORK_MODES = ["On-site", "Remote", "Hybrid"] as const;

const STATUSES = [
  "Active",
  "Probation",
  "Notice Period",
  "Inactive",
  "Suspended",
  "Exited",
] as const;

const DEPARTMENTS = [
  "Product",
  "Engineering",
  "HR",
  "Finance",
  "Operations",
  "Sales",
  "Marketing",
  "Support",
  "Admin",
  "Compliance",
] as const;

const DESIGNATIONS = [
  "Team Lead",
  "Software Engineer",
  "HR Officer",
  "Finance Executive",
  "Operations Manager",
  "Sales Manager",
  "Support Specialist",
  "Product Manager",
  "Admin Officer",
  "Compliance Executive",
] as const;

const NAMES = [
  "Muqadas Mazhar",
  "Aisha Khan",
  "Bilal Ahmed",
  "Fatima Noor",
  "Usman Tariq",
  "Hira Malik",
  "Zain Ali",
  "Sana Raza",
  "Omar Farooq",
  "Maham Sheikh",
  "Abdullah Khan",
  "Nadia Aslam",
  "Rizwan Ali",
  "Muneeb Shah",
  "Anaya Ahmed",
  "Hamza Tariq",
  "Sadia Noor",
  "Farhan Javed",
  "Rukhsar Ahmed",
  "Adeel Shah",
  "Kashif Iqbal",
  "Nimra Fatima",
  "Ahmed Raza",
  "Tayyaba Khalid",
];

const MANAGERS = [
  "Team Lead",
  "Sarah Khan",
  "Ahmed Raza",
  "Omar Farooq",
  "Zara Tariq",
  "Bilal Hussain",
  "Sana Malik",
  "Hassan Ali",
];

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
type WorkMode = (typeof WORK_MODES)[number];
type EmployeeStatus = (typeof STATUSES)[number];

interface Employee {
  id: number;
  name: string;
  emp_code: string;
  manager: string;
  designation: string;
  department: string;
  work_mode: WorkMode;
  join_date: string;
  email: string;
  phone: string;
  employment_type: EmploymentType;
  type_description: string;
  status: EmployeeStatus;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  bank_account?: string;
  tax_id?: string;
  education?: { degree: string; institution: string; year: string }[];
  experience?: { title: string; company: string; duration: string }[];
}

type ModuleCardData = {
  title:
    | "TimeSync"
    | "PayEdge"
    | "LeaveEase"
    | "TalentWorks"
    | "PerformPro"
    | "ExpenseEase";
  subtitle: string;
  value: string;
  helper: string;
  score: number;
  icon: React.ElementType;
  statA: string;
  statALabel: string;
  statB: string;
  statBLabel: string;
  sparkline: { label: string; value: number }[];
  route: string;
};

type AnalyticsBundle = {
  modules: ModuleCardData[];
  attendanceSeries: {
    month: string;
    attendance: number;
    punctuality: number;
  }[];
  payrollSeries: {
    month: string;
    netPay: number;
    bonus: number;
  }[];
  leaveExpenseSeries: {
    month: string;
    leaveDays: number;
    claims: number;
  }[];
  moduleScoreSeries: {
    module: string;
    score: number;
  }[];
  recentActivities: {
    title: string;
    detail: string;
    time: string;
    module: string;
  }[];
};

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: EmployeeStatus) {
  switch (status) {
    case "Active":
      return "bg-brand-700 text-white border-transparent";
    case "Probation":
      return "bg-brand-800 text-white border-transparent";
    case "Notice Period":
      return "bg-brand-600 text-white border-transparent";
    case "Inactive":
      return "bg-brand-500 text-white border-transparent";
    case "Suspended":
      return "bg-brand-900 text-white border-transparent";
    case "Exited":
      return "bg-brand-400 text-white border-transparent";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getTypeBadgeClass(type: EmploymentType) {
  switch (type) {
    case "Permanent":
      return "bg-brand-100 text-brand-800 border-border";
    case "Contract":
      return "bg-brand-300/40 text-brand-900 border-border";
    case "Probation":
      return "bg-brand-500/15 text-brand-800 border-border";
    case "Intern":
      return "bg-brand-400/15 text-brand-800 border-border";
    case "Daily-Wage":
      return "bg-brand-600/15 text-brand-900 border-border";
    default:
      return "bg-brand-100 text-brand-800 border-border";
  }
}

// Dummy employee
function generateDummyEmployee(id: number): Employee {
  const rnd = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T,>(arr: readonly T[]) => arr[rnd(0, arr.length - 1)];

  const name = NAMES[id % NAMES.length] || "John Doe";
  const designation = pick(DESIGNATIONS);
  const department = pick(DEPARTMENTS);
  const work_mode = pick(WORK_MODES);
  const employment_type = pick(EMPLOYMENT_TYPES);
  const status =
    employment_type === "Probation"
      ? Math.random() > 0.4
        ? "Probation"
        : "Active"
      : pick(STATUSES);

  const joinYear = rnd(2020, 2025);
  const joinMonth = rnd(0, 11);
  const joinDay = rnd(1, 28);
  const join_date = new Date(joinYear, joinMonth, joinDay).toISOString();

  const birthYear = rnd(1988, 2000);
  const birthMonth = rnd(0, 11);
  const birthDay = rnd(1, 28);
  const date_of_birth = new Date(
    birthYear,
    birthMonth,
    birthDay
  ).toISOString();

  return {
    id,
    name,
    emp_code: `EMP-${1000 + id}`,
    manager: pick(MANAGERS),
    designation,
    department,
    work_mode,
    join_date,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
    phone: `+92 ${rnd(300, 349)} ${rnd(1000000, 9999999)}`,
    employment_type,
    type_description: `${employment_type} employee assigned to ${department}.`,
    status,
    date_of_birth,
    gender: rnd(0, 1) ? "Male" : "Female",
    nationality: "Pakistani",
    address: `${rnd(12, 199)} Main Boulevard, Lahore, Pakistan`,
    emergency_contact_name: "Amina Khan",
    emergency_contact_phone: `+92 ${rnd(300, 349)} ${rnd(1000000, 9999999)}`,
    emergency_contact_relation: "Spouse",
    bank_account: `PK${rnd(10, 99)} HBL ${rnd(1000, 9999)} ${rnd(
      1000,
      9999
    )} ${rnd(1000, 9999)}`,
    tax_id: `NTN-${rnd(1000000, 9999999)}`,
    education: [
      {
        degree: "B.Sc. Computer Science",
        institution: "FAST University",
        year: "2018",
      },
      {
        degree: "M.Sc. Data Science",
        institution: "NUST",
        year: "2020",
      },
    ],
    experience: [
      {
        title: "Junior Software Engineer",
        company: "Tech Solutions",
        duration: "2018 - 2020",
      },
      {
        title: "Senior Software Engineer",
        company: "InnovateX",
        duration: "2020 - 2023",
      },
      {
        title: "Team Lead",
        company: "Current Company",
        duration: "2023 - Present",
      },
    ],
  };
}

function generateAnalytics(id: number): AnalyticsBundle {
  const shift = id % 5;

  const modules: ModuleCardData[] = [
    {
      title: "TimeSync",
      route: `/time-sync/daily-report`,
      subtitle: "Attendance & punctuality",
      value: `${96 + shift * 0.3}%`,
      helper: "Attendance compliance this month",
      score: 91 + shift,
      icon: Clock,
      statA: `${12 + shift}h`,
      statALabel: "Overtime",
      statB: `${2 + shift}`,
      statBLabel: "Late marks",
      sparkline: [
        { label: "W1", value: 89 + shift },
        { label: "W2", value: 93 + shift },
        { label: "W3", value: 95 + shift },
        { label: "W4", value: 96 + shift },
      ],
    },
    {
      title: "PayEdge",
      route: `/pay-edge/my-payroll`,
      subtitle: "Payroll & salary engine",
      value: `PKR ${(245 + shift * 8).toLocaleString()}k`,
      helper: "Net payroll processed",
      score: 88 + shift,
      icon: CreditCard,
      statA: `PKR ${18 + shift}k`,
      statALabel: "Tax",
      statB: `PKR ${9 + shift}k`,
      statBLabel: "Bonus",
      sparkline: [
        { label: "Jan", value: 225 + shift * 4 },
        { label: "Feb", value: 232 + shift * 4 },
        { label: "Mar", value: 241 + shift * 4 },
        { label: "Apr", value: 245 + shift * 4 },
      ],
    },
    {
      title: "LeaveEase",
      route: `/leaveease/my-balance`,
      subtitle: "Leave balance & approvals",
      value: `${14 - shift} days`,
      helper: "Current annual leave balance",
      score: 84 + shift,
      icon: Calendar,
      statA: `${5 + shift}`,
      statALabel: "Used",
      statB: `${1 + (shift % 2)}`,
      statBLabel: "Pending",
      sparkline: [
        { label: "Jan", value: 2 + shift },
        { label: "Feb", value: 3 + shift },
        { label: "Mar", value: 1 + shift },
        { label: "Apr", value: 2 + shift },
      ],
    },
    {
      title: "TalentWorks",
      route: `/people-hub/ess-profile`,
      subtitle: "Learning & growth signals",
      value: `${7 + shift} skills`,
      helper: "Verified skill tags on profile",
      score: 80 + shift,
      icon: GraduationCap,
      statA: `${2 + shift}`,
      statALabel: "Courses",
      statB: `${1 + shift}`,
      statBLabel: "Certs",
      sparkline: [
        { label: "Q1", value: 58 + shift * 4 },
        { label: "Q2", value: 64 + shift * 4 },
        { label: "Q3", value: 71 + shift * 4 },
        { label: "Q4", value: 79 + shift * 4 },
      ],
    },
    {
      title: "PerformPro",
      route: `/people-hub/ess-profile`,
      subtitle: "Reviews & goal performance",
      value: `${(4.2 + shift * 0.1).toFixed(1)}/5`,
      helper: "Last appraisal rating",
      score: 89 + shift,
      icon: Award,
      statA: `${86 + shift}%`,
      statALabel: "Goals hit",
      statB: `${3 + shift}`,
      statBLabel: "KPIs",
      sparkline: [
        { label: "Q1", value: 78 + shift },
        { label: "Q2", value: 82 + shift },
        { label: "Q3", value: 88 + shift },
        { label: "Q4", value: 91 + shift },
      ],
    },
    {
      title: "ExpenseEase",
      route: `/people-hub/ess-profile`,
      subtitle: "Claims & reimbursements",
      value: `PKR ${(38 + shift * 3).toLocaleString()}k`,
      helper: "Approved claims this quarter",
      score: 85 + shift,
      icon: FileText,
      statA: `${4 + shift}`,
      statALabel: "Claims",
      statB: `${1.8 + shift * 0.1}d`,
      statBLabel: "Turnaround",
      sparkline: [
        { label: "Jan", value: 14 + shift },
        { label: "Feb", value: 19 + shift },
        { label: "Mar", value: 24 + shift },
        { label: "Apr", value: 27 + shift },
      ],
    },
  ];

  return {
    modules,
    attendanceSeries: [
      { month: "Jan", attendance: 92 + shift, punctuality: 88 + shift },
      { month: "Feb", attendance: 94 + shift, punctuality: 90 + shift },
      { month: "Mar", attendance: 95 + shift, punctuality: 91 + shift },
      { month: "Apr", attendance: 96 + shift, punctuality: 93 + shift },
      { month: "May", attendance: 97 + shift, punctuality: 94 + shift },
      { month: "Jun", attendance: 96 + shift, punctuality: 95 + shift },
    ],
    payrollSeries: [
      { month: "Jan", netPay: 220 + shift * 4, bonus: 8 + shift },
      { month: "Feb", netPay: 226 + shift * 4, bonus: 9 + shift },
      { month: "Mar", netPay: 231 + shift * 4, bonus: 10 + shift },
      { month: "Apr", netPay: 238 + shift * 4, bonus: 10 + shift },
      { month: "May", netPay: 243 + shift * 4, bonus: 11 + shift },
      { month: "Jun", netPay: 248 + shift * 4, bonus: 12 + shift },
    ],
    leaveExpenseSeries: [
      { month: "Jan", leaveDays: 2 + shift, claims: 1 + shift },
      { month: "Feb", leaveDays: 1 + shift, claims: 2 + shift },
      { month: "Mar", leaveDays: 3 + shift, claims: 1 + shift },
      { month: "Apr", leaveDays: 2 + shift, claims: 2 + shift },
      { month: "May", leaveDays: 4 + shift, claims: 3 + shift },
      { month: "Jun", leaveDays: 2 + shift, claims: 2 + shift },
    ],
    moduleScoreSeries: modules.map((item) => ({
      module: item.title,
      score: item.score,
    })),
    recentActivities: [
      {
        title: "TimeSync synced successfully",
        detail: "Attendance device pushed 22 check-ins with no mismatch.",
        time: "Today · 09:12 AM",
        module: "TimeSync",
      },
      {
        title: "Payroll cycle marked complete",
        detail: "June salary sheet locked and final pay generated.",
        time: "Yesterday · 06:40 PM",
        module: "PayEdge",
      },
      {
        title: "Leave request approved",
        detail: "Annual leave request for 2 days approved by reporting manager.",
        time: "Yesterday · 11:18 AM",
        module: "LeaveEase",
      },
      {
        title: "Skill badge awarded",
        detail: "Advanced React skill tag added after assessment completion.",
        time: "2 days ago",
        module: "TalentWorks",
      },
      {
        title: "Q2 review published",
        detail: "PerformPro review signed off with rating above expectations.",
        time: "3 days ago",
        module: "PerformPro",
      },
      {
        title: "Expense claim reimbursed",
        detail: "Travel expense of PKR 12,500 marked as reimbursed.",
        time: "4 days ago",
        module: "ExpenseEase",
      },
    ],
  };
}

// -----------------------------------------------------------------------------
// UI Components
// -----------------------------------------------------------------------------

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}) => (
  <Card className="overflow-hidden border-border bg-gradient-to-br from-white via-white to-brand-100/20 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-brand-900">{value}</p>
          {trend ? (
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                trend.positive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 ${trend.positive ? "" : "rotate-180"}`}
              />
              <span>{trend.value}% vs last month</span>
            </div>
          ) : null}
        </div>
        <div className="rounded-xl bg-brand-100 p-2.5">
          <Icon className="h-5 w-5 text-brand-800" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
    <div className="rounded-lg bg-brand-100 p-2">
      <Icon className="h-4 w-4 text-brand-800" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-brand-900">{value}</p>
    </div>
  </div>
);

const ModuleCard = ({ item }: { item: ModuleCardData }) => {
  const Icon = item.icon;
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(item.route)}
      className="group cursor-pointer overflow-hidden border-border bg-gradient-to-br from-white via-white to-brand-100/25 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-600 to-brand-300" />
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-100 p-3">
              <Icon className="h-5 w-5 text-brand-800" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-900">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="border-transparent bg-brand-800 text-white">
              {item.score}%
            </Badge>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>

        <div className="mb-1 text-2xl font-bold text-brand-900">{item.value}</div>
        <p className="mb-4 text-sm text-muted-foreground">{item.helper}</p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="text-xs text-muted-foreground">{item.statALabel}</p>
            <p className="mt-1 text-sm font-semibold text-brand-900">
              {item.statA}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="text-xs text-muted-foreground">{item.statBLabel}</p>
            <p className="mt-1 text-sm font-semibold text-brand-900">
              {item.statB}
            </p>
          </div>
        </div>

        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={item.sparkline}>
              <defs>
                <linearGradient
                  id={`moduleGradient-${item.title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#322E53" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#322E53" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#322E53"
                strokeWidth={2}
                fill={`url(#moduleGradient-${item.title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function EmployeeViewPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = Number(params.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const employee = useMemo(() => generateDummyEmployee(employeeId), [employeeId]);
  const analytics = useMemo(() => generateAnalytics(employeeId), [employeeId]);

  const handleEdit = () => {
    router.push(`/people-hub/employees/${employeeId}/edit`);
  };

  const handleDelete = () => {
    toast.success("Employee deleted", {
      description: "Employee has been removed successfully.",
    });
    router.push("/people-hub/employees");
  };

  const handleBack = () => {
    router.back();
  };

  const joinDate = new Date(employee.join_date);
  const today = new Date();
  const tenureYears = today.getFullYear() - joinDate.getFullYear();
  const tenureMonths = today.getMonth() - joinDate.getMonth();
  const totalMonths = tenureYears * 12 + tenureMonths;
  const tenureString =
    totalMonths < 12
      ? `${totalMonths} months`
      : `${Math.floor(totalMonths / 12)} yrs ${totalMonths % 12} mos`;

  const kpis = {
    attendance: `${analytics.modules[0].value}`,
    performance: `${analytics.modules[4].value}`,
    leavesTaken: `${5 + (employeeId % 4)}`,
    projects: `${4 + (employeeId % 3)}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-100/20 via-background to-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-brand-800 hover:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/leaveease/my-balance")}
            className="gap-2 border-border text-brand-800 hover:bg-brand-100"
          >
            <Calendar className="h-4 w-4" /> Leave Balance
          </Button>
          <Button
            variant="outline"
            onClick={handleEdit}
            className="gap-2 border-border text-brand-800 hover:bg-brand-100"
          >
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2 border-border text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <Card className="mb-6 overflow-hidden border-border bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-sm">
        <div className=" px-6 py-7 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <Avatar className="h-24 w-24 rounded-2xl border border-white/20 bg-white/10 text-3xl font-bold text-white">
              <AvatarFallback className="bg-transparent">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">{employee.name}</h1>
                <Badge className={getStatusBadgeClass(employee.status)}>
                  {employee.status}
                </Badge>
                <Badge className={getTypeBadgeClass(employee.employment_type)}>
                  {employee.employment_type}
                </Badge>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2 text-sm text-white/85 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {employee.designation} · {employee.department}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(employee.join_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/10 text-white">
                  {employee.emp_code}
                </Badge>
                <Badge className="border-white/10 bg-white/10 text-white">
                  Manager: {employee.manager}
                </Badge>
                <Badge className="border-white/10 bg-white/10 text-white">
                  {employee.work_mode}
                </Badge>
                <Badge className="border-white/10 bg-white/10 text-white">
                  HRMS 360 Profile
                </Badge>
              </div>
            </div>

            <div className="grid min-w-[280px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">Tenure</p>
                <p className="mt-1 text-xl font-semibold">{tenureString}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">Manager</p>
                <p className="mt-1 text-xl font-semibold">{employee.manager}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">Work Mode</p>
                <p className="mt-1 text-xl font-semibold">{employee.work_mode}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">Performance</p>
                <p className="mt-1 text-xl font-semibold">{kpis.performance}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tenure"
          value={tenureString}
          icon={Clock}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Attendance"
          value={kpis.attendance}
          icon={Users}
          trend={{ value: 2, positive: true }}
        />
        <StatCard
          title="Performance"
          value={kpis.performance}
          icon={Award}
          trend={{ value: 4, positive: true }}
        />
        <StatCard
          title="Projects"
          value={kpis.projects}
          icon={Briefcase}
          trend={{ value: 1, positive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto flex-wrap gap-2 rounded-2xl border border-border bg-white p-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Personal
          </TabsTrigger>
          <TabsTrigger
            value="employment"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Employment
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger
            value="emergency"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Emergency
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
          >
            Documents
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* Modules Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-900">
                  HRMS Module Snapshot
                </h2>
                <p className="text-sm text-muted-foreground">
                  Live-looking dummy insights across employee-facing modules
                </p>
              </div>
              <Badge className="border-transparent bg-brand-100 text-brand-800">
                Employee 360 View
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analytics.modules.map((item) => (
                <ModuleCard key={item.title} item={item} />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-border shadow-sm xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-brand-900">
                  TimeSync Attendance Trend
                </CardTitle>
                <CardDescription>
                  Attendance and punctuality performance over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.attendanceSeries}>
                    <defs>
                      <linearGradient
                        id="attendanceFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#322E53" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#322E53" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient
                        id="punctualityFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#EEC293" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#EEC293" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#322E53"
                      fill="url(#attendanceFill)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="punctuality"
                      stroke="#EEC293"
                      fill="url(#punctualityFill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">
                  PayEdge Payroll Movement
                </CardTitle>
                <CardDescription>
                  Net pay processed vs bonus trend
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.payrollSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="netPay"
                      stroke="#322E53"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bonus"
                      stroke="#F3AB9D"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">
                  Module Health Score
                </CardTitle>
                <CardDescription>
                  Current dummy score by module
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.moduleScoreSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="module" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#322E53" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity + leave chart */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">
                  LeaveEase & ExpenseEase Activity
                </CardTitle>
                <CardDescription>
                  Leave days used vs claim submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.leaveExpenseSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="leaveDays"
                      radius={[8, 8, 0, 0]}
                      fill="#EEC293"
                    />
                    <Bar
                      dataKey="claims"
                      radius={[8, 8, 0, 0]}
                      fill="#49426E"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">
                  Recent HRMS Activity
                </CardTitle>
                <CardDescription>
                  Latest employee actions across modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.recentActivities.map((activity, idx) => (
                  <div
                    key={`${activity.module}-${idx}`}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-900">
                        {activity.title}
                      </p>
                      <Badge variant="outline">{activity.module}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.detail}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-brand-700">
                      <Activity className="h-3 w-3" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PERSONAL */}
        <TabsContent value="personal">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-900">
                Personal Information
              </CardTitle>
              <CardDescription>
                Core identity and employee profile data
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow
                icon={UserCircle}
                label="Full Name"
                value={employee.name}
              />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={formatDate(employee.date_of_birth!)}
              />
              <InfoRow
                icon={UserCircle}
                label="Gender"
                value={employee.gender!}
              />
              <InfoRow
                icon={MapPin}
                label="Nationality"
                value={employee.nationality!}
              />
              <InfoRow
                icon={Home}
                label="Address"
                value={employee.address!}
              />
              <InfoRow
                icon={CreditCard}
                label="Tax ID"
                value={employee.tax_id!}
              />
              <InfoRow
                icon={CreditCard}
                label="Bank Account"
                value={employee.bank_account!}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMPLOYMENT */}
        <TabsContent value="employment" className="space-y-4">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-900">
                Employment Details
              </CardTitle>
              <CardDescription>
                Work assignment, reporting, and organizational placement
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow
                icon={Briefcase}
                label="Employee Code"
                value={employee.emp_code}
              />
              <InfoRow
                icon={Briefcase}
                label="Designation"
                value={employee.designation}
              />
              <InfoRow
                icon={Briefcase}
                label="Department"
                value={employee.department}
              />
              <InfoRow
                icon={Users}
                label="Manager"
                value={employee.manager}
              />
              <InfoRow
                icon={Calendar}
                label="Join Date"
                value={formatDate(employee.join_date)}
              />
              <InfoRow
                icon={Clock}
                label="Work Mode"
                value={employee.work_mode}
              />
              <InfoRow
                icon={Award}
                label="Employment Type"
                value={employee.employment_type}
              />
              <InfoRow
                icon={FileText}
                label="Type Description"
                value={employee.type_description}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.education?.map((edu, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-brand-700" />
                      <p className="font-medium text-brand-900">{edu.degree}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {edu.institution}
                    </p>
                    <p className="text-xs text-brand-700">{edu.year}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-brand-900">Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.experience?.map((exp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-brand-700" />
                      <p className="font-medium text-brand-900">{exp.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-brand-700">{exp.duration}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-900">
                Contact Information
              </CardTitle>
              <CardDescription>
                Reachability and communication details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              <InfoRow icon={MapPin} label="Address" value={employee.address!} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMERGENCY */}
        <TabsContent value="emergency">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-900">
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Contact person for urgent or health-related situations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow
                icon={UserCircle}
                label="Name"
                value={employee.emergency_contact_name!}
              />
              <InfoRow
                icon={Heart}
                label="Relation"
                value={employee.emergency_contact_relation!}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={employee.emergency_contact_phone!}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-900">Documents</CardTitle>
              <CardDescription>
                Employee compliance and HR records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  name: "Employment Contract.pdf",
                  uploaded: "Jan 15, 2024",
                  tag: "Signed",
                },
                {
                  name: "CNIC Copy.pdf",
                  uploaded: "Jan 15, 2024",
                  tag: "Verified",
                },
                {
                  name: "Last Appraisal.pdf",
                  uploaded: "Apr 03, 2025",
                  tag: "PerformPro",
                },
                {
                  name: "Expense Claim Summary.pdf",
                  uploaded: "Jun 18, 2025",
                  tag: "ExpenseEase",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-brand-100 p-2">
                      <FileText className="h-5 w-5 text-brand-800" />
                    </div>
                    <div>
                      <p className="font-medium text-brand-900">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded on {doc.uploaded}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.tag}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-brand-800 hover:bg-brand-100"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-900">
              Delete Employee?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The employee record will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-brand-800 hover:bg-brand-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-brand-600 text-white hover:bg-brand-900"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}