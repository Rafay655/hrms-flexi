"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  Lock,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EmployeeRole =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR_MANAGER"
  | "HR_ADMIN"
  | "SUPER_ADMIN";

type DocumentStatus = "Uploaded" | "Missing" | "Pending Review";

type ProfileTab = "Personal" | "Contact" | "Employment" | "Bank" | "Emergency";

type Employee360Tab =
  | "Attendance"
  | "Leave"
  | "Payroll"
  | "Loans"
  | "Disciplinary";

interface Employee {
  uuid: string;
  name: string;
  employee_code: string;
  designation: string;
  department: string;
  location: string;
  reporting_manager: string;
  official_email: string;
  personal_email: string;
  phone: string;
  joining_date: string;
  employment_type: string;
  grade: string;
  status: string;
  profile_completion: number;
  current_address: string;
  cnic: string;
  bank_name: string;
  account_number: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
}

interface ProfileField {
  label: string;
  key: keyof Employee;
  value: string;
  editable: boolean;
}

interface ProfileGroup {
  group: ProfileTab;
  icon: typeof User;
  fields: ProfileField[];
}

interface EmployeeDocument {
  name: string;
  status: DocumentStatus;
  uploaded_at: string | null;
}

interface LeaveBalance {
  type: string;
  used: number;
  remaining: number;
  total: number;
  colorClass: string;
}

interface Payslip {
  month: string;
  net_salary: string;
  status: string;
}

interface PendingRequest {
  field_key: keyof Employee;
  field_label: string;
  current_value: string;
  requested_value: string;
  reason: string;
  submitted_at: string;
}

const employee: Employee = {
  uuid: "emp-uuid-001",
  name: "Ayesha Khan",
  employee_code: "EMP-1042",
  designation: "Senior HR Executive",
  department: "Human Resources",
  location: "Lahore Head Office",
  reporting_manager: "Sarah Ahmed",
  official_email: "ayesha.khan@flexihrm.com",
  personal_email: "ayesha.personal@example.com",
  phone: "+92 300 1234567",
  joining_date: "August 15, 2023",
  employment_type: "Full-time",
  grade: "G-6",
  status: "Active",
  profile_completion: 82,
  current_address: "House 42, Block D, Gulberg III, Lahore",
  cnic: "35202-1234567-8",
  bank_name: "HBL — Habib Bank Limited",
  account_number: "1234-5678-9012",
  iban: "",
  emergency_contact_name: "Umar Khan",
  emergency_contact_number: "",
};

const missingFields = ["Emergency Contact Number", "CNIC Back Image", "Bank IBAN"];

const documents: EmployeeDocument[] = [
  {
    name: "CNIC Front",
    status: "Uploaded",
    uploaded_at: "20 Apr 2026",
  },
  {
    name: "CNIC Back",
    status: "Missing",
    uploaded_at: null,
  },
  {
    name: "Employment Contract",
    status: "Uploaded",
    uploaded_at: "12 Jan 2026",
  },
  {
    name: "Educational Certificate",
    status: "Pending Review",
    uploaded_at: "03 May 2026",
  },
  {
    name: "Resume / CV",
    status: "Missing",
    uploaded_at: null,
  },
];

const leaveBalances: LeaveBalance[] = [
  {
    type: "Annual",
    used: 6,
    remaining: 14,
    total: 20,
    colorClass: "bg-emerald-400",
  },
  {
    type: "Sick",
    used: 2,
    remaining: 8,
    total: 10,
    colorClass: "bg-blue-400",
  },
  {
    type: "Casual",
    used: 3,
    remaining: 7,
    total: 10,
    colorClass: "bg-amber-400",
  },
  {
    type: "Leave In Lieu",
    used: 1,
    remaining: 4,
    total: 5,
    colorClass: "bg-violet-400",
  },
];

const payslips: Payslip[] = [
  {
    month: "April 2026",
    net_salary: "PKR 185,000",
    status: "Paid",
  },
  {
    month: "March 2026",
    net_salary: "PKR 185,000",
    status: "Paid",
  },
  {
    month: "February 2026",
    net_salary: "PKR 182,500",
    status: "Paid",
  },
];

const profileGroups: ProfileGroup[] = [
  {
    group: "Personal",
    icon: User,
    fields: [
      {
        label: "Full Name",
        key: "name",
        value: employee.name,
        editable: false,
      },
      {
        label: "Employee Code",
        key: "employee_code",
        value: employee.employee_code,
        editable: false,
      },
      {
        label: "CNIC Number",
        key: "cnic",
        value: employee.cnic,
        editable: false,
      },
      {
        label: "Date of Joining",
        key: "joining_date",
        value: employee.joining_date,
        editable: false,
      },
      {
        label: "Grade",
        key: "grade",
        value: employee.grade,
        editable: false,
      },
    ],
  },
  {
    group: "Contact",
    icon: Phone,
    fields: [
      {
        label: "Phone Number",
        key: "phone",
        value: employee.phone,
        editable: true,
      },
      {
        label: "Personal Email",
        key: "personal_email",
        value: employee.personal_email,
        editable: true,
      },
      {
        label: "Official Email",
        key: "official_email",
        value: employee.official_email,
        editable: false,
      },
      {
        label: "Current Address",
        key: "current_address",
        value: employee.current_address,
        editable: true,
      },
    ],
  },
  {
    group: "Employment",
    icon: Briefcase,
    fields: [
      {
        label: "Designation",
        key: "designation",
        value: employee.designation,
        editable: false,
      },
      {
        label: "Department",
        key: "department",
        value: employee.department,
        editable: false,
      },
      {
        label: "Employment Type",
        key: "employment_type",
        value: employee.employment_type,
        editable: false,
      },
      {
        label: "Reporting Manager",
        key: "reporting_manager",
        value: employee.reporting_manager,
        editable: false,
      },
      {
        label: "Office Location",
        key: "location",
        value: employee.location,
        editable: false,
      },
    ],
  },
  {
    group: "Bank",
    icon: CreditCard,
    fields: [
      {
        label: "Bank Name",
        key: "bank_name",
        value: employee.bank_name,
        editable: false,
      },
      {
        label: "Account Number",
        key: "account_number",
        value: employee.account_number,
        editable: true,
      },
      {
        label: "IBAN",
        key: "iban",
        value: employee.iban || "Not provided",
        editable: true,
      },
    ],
  },
  {
    group: "Emergency",
    icon: Shield,
    fields: [
      {
        label: "Contact Name",
        key: "emergency_contact_name",
        value: employee.emergency_contact_name,
        editable: true,
      },
      {
        label: "Contact Number",
        key: "emergency_contact_number",
        value: employee.emergency_contact_number || "Not provided",
        editable: true,
      },
    ],
  },
];

const attendanceChartData = [
  {
    week: "W1",
    present: 5,
    late: 1,
  },
  {
    week: "W2",
    present: 4,
    late: 0,
  },
  {
    week: "W3",
    present: 5,
    late: 2,
  },
  {
    week: "W4",
    present: 4,
    late: 1,
  },
  {
    week: "W5",
    present: 5,
    late: 0,
  },
];

function AppCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-[#5c5490]/[0.12] bg-white shadow-[0_2px_16px_rgba(30,26,58,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

function BrandBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h3 className="m-0 text-sm font-bold tracking-[-0.2px] text-[#1E1A3A]">
        {children}
      </h3>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#5c5490]/[0.06] bg-[#f8f7fc] px-4 py-3.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-slate-400">
        {label}
      </p>
      <p className={`m-0 text-[22px] font-bold tracking-[-0.5px] ${className}`}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

function AttendanceTab() {
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Present"
          value="88"
          sub="days this year"
          className="text-emerald-600"
        />
        <StatCard
          label="Absent"
          value="4"
          sub="days this year"
          className="text-red-600"
        />
        <StatCard
          label="Late Arrivals"
          value="6"
          sub="this year"
          className="text-amber-500"
        />
        <StatCard
          label="Overtime"
          value="23h"
          sub="this year"
          className="text-[#5c5490]"
        />
      </div>

      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-slate-400">
        Monthly attendance trend
      </p>

      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={attendanceChartData}
            margin={{
              top: 4,
              right: 4,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5c5490" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#5c5490" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="week"
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 10,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              cursor={{
                stroke: "#5c5490",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="present"
              stroke="#5c5490"
              strokeWidth={2}
              fill="url(#presentGrad)"
              name="Present days"
            />

            <Area
              type="monotone"
              dataKey="late"
              stroke="#F3AB9D"
              strokeWidth={1.5}
              fill="none"
              name="Late arrivals"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LeaveTab() {
  const upcomingLeaves = [
    {
      date: "May 20–21, 2026",
      type: "Casual Leave",
      days: 2,
    },
    {
      date: "Jun 3, 2026",
      type: "Annual Leave",
      days: 1,
    },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Leave Taken"
          value="12"
          sub="days this year"
          className="text-[#5c5490]"
        />
        <StatCard
          label="Total Balance"
          value="33"
          sub="days remaining"
          className="text-emerald-600"
        />
        <StatCard
          label="Pending Requests"
          value="1"
          sub="awaiting approval"
          className="text-amber-500"
        />
        <StatCard
          label="Upcoming Leaves"
          value="2"
          sub="approved"
          className="text-[#49426E]"
        />
      </div>

      <div className="rounded-[14px] border border-[#5c5490]/[0.06] bg-[#f8f7fc] p-3.5">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-slate-400">
          Upcoming approved leaves
        </p>

        {upcomingLeaves.map((leave, index) => (
          <div
            key={leave.date}
            className={`flex items-center justify-between py-2 ${
              index === 0 ? "border-b border-[#5c5490]/[0.12]" : ""
            }`}
          >
            <div>
              <p className="m-0 text-[13px] font-semibold text-[#1E1A3A]">
                {leave.date}
              </p>
              <p className="m-0 text-xs text-slate-400">{leave.type}</p>
            </div>

            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
              {leave.days}d
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayrollTab() {
  const deductions = [
    {
      label: "Income Tax",
      amount: "PKR 18,000",
    },
    {
      label: "EOBI",
      amount: "PKR 1,250",
    },
    {
      label: "Health Insurance",
      amount: "PKR 8,500",
    },
    {
      label: "Provident Fund",
      amount: "PKR 7,500",
    },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Gross Salary"
          value="PKR 220K"
          sub="current month"
          className="text-[#1E1A3A]"
        />
        <StatCard
          label="Net Salary"
          value="PKR 185K"
          sub="last payslip"
          className="text-emerald-600"
        />
        <StatCard
          label="Last Payslip"
          value="Paid"
          sub="April 2026"
          className="text-emerald-600"
        />
        <StatCard
          label="Total Deductions"
          value="PKR 35K"
          sub="taxes + benefits"
          className="text-red-600"
        />
      </div>

      <div className="rounded-[14px] border border-[#5c5490]/[0.06] bg-[#f8f7fc] p-3.5">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-slate-400">
          Deduction breakdown
        </p>

        {deductions.map((item, index) => (
          <div
            key={item.label}
            className={`flex justify-between py-2 text-[13px] ${
              index < deductions.length - 1
                ? "border-b border-[#5c5490]/[0.06]"
                : ""
            }`}
          >
            <span className="text-slate-600">{item.label}</span>
            <span className="font-semibold text-[#1E1A3A]">{item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoansTab() {
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Active Loan"
          value="PKR 300K"
          sub="personal loan"
          className="text-[#1E1A3A]"
        />
        <StatCard
          label="Outstanding"
          value="PKR 180K"
          sub="remaining balance"
          className="text-amber-500"
        />
        <StatCard
          label="Monthly EMI"
          value="PKR 15K"
          sub="per installment"
          className="text-[#5c5490]"
        />
        <StatCard
          label="Next Deduction"
          value="Jun 1"
          sub="deducted from payroll"
          className="text-[#49426E]"
        />
      </div>

      <div className="rounded-[14px] border border-[#5c5490]/[0.06] bg-[#f8f7fc] p-3.5">
        <div className="mb-2 flex justify-between">
          <span className="text-xs text-slate-400">Repayment progress</span>
          <span className="text-[13px] font-bold text-[#1E1A3A]">40%</span>
        </div>

        <div className="mb-2 h-2 overflow-hidden rounded-md bg-[#5c5490]/[0.18]">
          <div className="h-full w-[40%] rounded-md bg-gradient-to-r from-[#322E53] to-[#5c5490]" />
        </div>

        <p className="m-0 text-[11px] text-slate-400">
          PKR 120,000 repaid · 12 installments remaining
        </p>
      </div>
    </div>
  );
}

function DisciplinaryTab() {
  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatCard
          label="Warnings"
          value="1"
          sub="on record"
          className="text-amber-500"
        />
        <StatCard
          label="Open Cases"
          value="0"
          sub="currently active"
          className="text-emerald-600"
        />
        <StatCard
          label="Resolved"
          value="2"
          sub="all time"
          className="text-[#5c5490]"
        />
      </div>

      <div className="rounded-[14px] border border-[#EEC293]/30 bg-[#fffbf5] p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />

          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.6px] text-slate-400">
            Latest disciplinary note
          </p>
        </div>

        <p className="m-0 text-[13px] leading-6 text-[#1E1A3A]">
          Verbal warning issued on <strong>March 10, 2026</strong> regarding
          late arrivals exceeding 3 occurrences in February. Employee
          acknowledged the note and improvement has been observed since.
        </p>

        <p className="mt-2 text-[11px] text-slate-400">
          Logged by: HR Manager · Status: Resolved
        </p>
      </div>
    </div>
  );
}

function getDocumentStyle(status: DocumentStatus) {
  if (status === "Uploaded") {
    return {
      wrapper: "bg-[#f8f7fc] border-transparent",
      icon: "bg-emerald-400/15 text-emerald-500",
      text: "text-emerald-500",
    };
  }

  if (status === "Missing") {
    return {
      wrapper: "bg-[#F3AB9D]/10 border-[#F3AB9D]/30",
      icon: "bg-[#F3AB9D]/15 text-[#F3AB9D]",
      text: "text-[#F3AB9D]",
    };
  }

  return {
    wrapper: "bg-[#EEC293]/10 border-[#EEC293]/40",
    icon: "bg-[#EEC293]/20 text-[#c9924a]",
    text: "text-[#c9924a]",
  };
}

export default function ESSProfilePage() {
  const [activeProfileTab, setActiveProfileTab] =
    useState<ProfileTab>("Personal");

  const [active360Tab, setActive360Tab] =
    useState<Employee360Tab>("Attendance");

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedField, setSelectedField] = useState<ProfileField | null>(null);

  const [newValue, setNewValue] = useState("");

  const [reason, setReason] = useState("");

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const [showSuccess, setShowSuccess] = useState(false);

  const currentUserRole: EmployeeRole = "HR_MANAGER";

  const tabs360 = useMemo<Employee360Tab[]>(() => {
    const baseTabs: Employee360Tab[] = [
      "Attendance",
      "Leave",
      "Payroll",
      "Loans",
    ];

    if (["HR_MANAGER", "HR_ADMIN", "SUPER_ADMIN"].includes(currentUserRole)) {
      baseTabs.push("Disciplinary");
    }

    return baseTabs;
  }, [currentUserRole]);

  const activeProfileGroup = profileGroups.find(
    (group) => group.group === activeProfileTab
  );

  const openModal = (field: ProfileField) => {
    setSelectedField(field);
    setNewValue("");
    setReason("");
    setShowSuccess(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedField(null);
    setNewValue("");
    setReason("");
    setShowSuccess(false);
  };

  const submitChangeRequest = () => {
    if (!selectedField || !newValue.trim() || !reason.trim()) return;

    const payload: PendingRequest = {
      field_key: selectedField.key,
      field_label: selectedField.label,
      current_value: selectedField.value,
      requested_value: newValue,
      reason,
      submitted_at: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    console.log("POST /ess/change-requests", payload);

    setPendingRequests((previousRequests) => [...previousRequests, payload]);
    setShowSuccess(true);

    window.setTimeout(() => {
      closeModal();
    }, 1800);
  };

  return (
    <div className="min-h-screen  font-sans text-slate-700">
     
      <main className="mx-auto max-w-7xl px-4 py-7 md:px-5 md:pb-12">
        <section className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1A3A] via-[#322E53] to-[#49426E] p-5 shadow-[0_16px_48px_rgba(30,26,58,0.28)] md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#EEC293]/10" />
          <div className="pointer-events-none absolute -bottom-12 right-24 h-52 w-52 rounded-full bg-[#F3AB9D]/10" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="relative shrink-0">
              <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full border-[3px] border-white/20 bg-gradient-to-br from-[#EEC293] to-[#F3AB9D] shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
                <span className="text-[28px] font-extrabold text-[#1E1A3A]">
                  AK
                </span>
              </div>

              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[2.5px] border-[#1E1A3A] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-white">
                  {employee.name}
                </h1>

                <BrandBadge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                  ● Active
                </BrandBadge>
              </div>

              <p className="mb-2.5 text-[15px] font-semibold text-[#EEC293]">
                {employee.designation}
              </p>

              <div className="flex flex-wrap gap-3.5 text-[13px] text-white/55">
                <span className="flex items-center gap-1.5">
                  <Building size={13} /> {employee.department}
                </span>

                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {employee.location}
                </span>

                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Joined {employee.joining_date}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  employee.employment_type,
                  "Confirmed",
                  employee.employee_code,
                  `Grade ${employee.grade}`,
                ].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/65"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="min-w-[188px] rounded-2xl border border-white/10 bg-white/10 px-[18px] py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-white/55">Profile complete</span>

                  <span className="text-xl font-extrabold tracking-[-0.5px] text-[#EEC293]">
                    {employee.profile_completion}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-md bg-white/10">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-[#EEC293] to-[#F3AB9D]"
                    style={{
                      width: `${employee.profile_completion}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[11px] text-white/35">
                  {missingFields.length} fields missing
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const firstEditableField = profileGroups
                      .flatMap((group) => group.fields)
                      .find((field) => field.editable);

                    if (firstEditableField) openModal(firstEditableField);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#EEC293] px-4 py-2.5 text-[13px] font-bold text-[#1E1A3A] transition hover:bg-[#f4ceaa]"
                >
                  <Edit3 size={13} /> Request Change
                </button>

                <button className="inline-flex items-center gap-1.5 rounded-[11px] border border-white/10 bg-white/10 px-3.5 py-2.5 text-[13px] text-white/75 transition hover:bg-white/15">
                  <Upload size={13} /> Upload
                </button>
              </div>
            </div>
          </div>
        </section>

        {pendingRequests.length > 0 ? (
          <div className="mb-4 flex items-center gap-2.5 rounded-[13px] border border-[#F3AB9D]/30 bg-[#F3AB9D]/10 px-4 py-3">
            <Clock size={15} className="text-[#F3AB9D]" />

            <span className="text-[13px] text-[#49426E]">
              You have{" "}
              <strong className="text-[#c97860]">
                {pendingRequests.length}
              </strong>{" "}
              pending change request{pendingRequests.length > 1 ? "s" : ""}{" "}
              awaiting HR approval.
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[18px]">
            <AppCard className="p-5">
              <SectionTitle>Profile Completion</SectionTitle>

              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-lg bg-[#f1f0f8]">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-[#322E53] to-[#5c5490]"
                    style={{
                      width: `${employee.profile_completion}%`,
                    }}
                  />
                </div>

                <span className="text-base font-extrabold tracking-[-0.3px] text-[#1E1A3A]">
                  {employee.profile_completion}%
                </span>
              </div>

              <p className="mb-3 text-xs text-slate-400">
                Complete your profile to unlock all ESS features.
              </p>

              <div className="flex flex-col gap-2">
                {missingFields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center gap-2.5 rounded-[10px] border border-[#F3AB9D]/25 bg-[#F3AB9D]/10 px-3 py-2"
                  >
                    <AlertCircle size={13} className="text-[#F3AB9D]" />

                    <span className="flex-1 text-xs font-medium text-[#49426E]">
                      {field}
                    </span>

                    <ChevronRight size={12} className="text-[#F3AB9D]" />
                  </div>
                ))}
              </div>

              <button className="mt-3.5 w-full rounded-[11px] bg-gradient-to-br from-[#322E53] to-[#5c5490] px-3 py-3 text-[13px] font-bold text-white transition hover:opacity-95">
                Complete Missing Info →
              </button>
            </AppCard>

            <AppCard className="p-5">
              <SectionTitle
                action={
                  <span className="text-xs text-slate-400">
                    {
                      documents.filter(
                        (document) => document.status === "Uploaded"
                      ).length
                    }
                    /{documents.length} uploaded
                  </span>
                }
              >
                My Documents
              </SectionTitle>

              <div className="flex flex-col gap-2">
                {documents.map((document) => {
                  const style = getDocumentStyle(document.status);

                  return (
                    <div
                      key={document.name}
                      className={`flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 ${style.wrapper}`}
                    >
                      <div
                        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] ${style.icon}`}
                      >
                        <FileText size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-xs font-bold text-[#1E1A3A]">
                          {document.name}
                        </p>

                        <p className={`m-0 text-[11px] font-semibold ${style.text}`}>
                          {document.status === "Uploaded"
                            ? `✓ ${document.uploaded_at}`
                            : document.status === "Pending Review"
                              ? "⟳ Pending review"
                              : "⚠ Not uploaded"}
                        </p>
                      </div>

                      {document.status === "Missing" ? (
                        <button
                          onClick={() => alert("Upload dialog coming soon")}
                          className="shrink-0 rounded-md bg-[#F3AB9D] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#e79586]"
                        >
                          Upload
                        </button>
                      ) : null}

                      {document.status === "Uploaded" ? (
                        <button className="shrink-0 rounded-md p-1 transition hover:bg-[#5c5490]/10">
                          <Eye size={14} className="text-[#5c5490]" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </AppCard>

            <AppCard className="p-5">
              <SectionTitle
                action={
                  <button className="text-xs font-bold text-[#5c5490] transition hover:text-[#322E53]">
                    View All →
                  </button>
                }
              >
                Recent Payslips
              </SectionTitle>

              <div className="flex flex-col gap-2">
                {payslips.map((payslip) => (
                  <div
                    key={payslip.month}
                    className="flex items-center gap-2.5 rounded-[11px] bg-[#f8f7fc] px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#5c5490]/15">
                      <DollarSign size={16} className="text-[#5c5490]" />
                    </div>

                    <div className="flex-1">
                      <p className="m-0 text-xs font-bold text-[#1E1A3A]">
                        {payslip.month}
                      </p>
                      <p className="m-0 text-xs text-slate-400">
                        {payslip.net_salary}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                      {payslip.status}
                    </span>

                    <button className="rounded-md p-1 transition hover:bg-[#5c5490]/10">
                      <Eye size={14} className="text-[#5c5490]" />
                    </button>
                  </div>
                ))}
              </div>
            </AppCard>
          </aside>

          <section className="flex min-w-0 flex-col gap-[18px]">
            <AppCard className="overflow-hidden">
              <div className="flex gap-0.5 overflow-x-auto border-b border-[#5c5490]/[0.12] px-5">
                {profileGroups.map(({ group, icon: Icon }) => {
                  const isActive = activeProfileTab === group;

                  return (
                    <button
                      key={group}
                      onClick={() => setActiveProfileTab(group)}
                      className={`mb-[-1px] inline-flex whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[13px] transition ${
                        isActive
                          ? "border-[#5c5490] font-bold text-[#5c5490]"
                          : "border-transparent font-medium text-slate-400 hover:text-[#5c5490]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={13} /> {group}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                {activeProfileGroup?.fields.map((field, index) => {
                  const isMissing =
                    field.value.includes("Not provided") || field.value === "—";

                  return (
                    <div
                      key={field.key}
                      className={`flex flex-col gap-2 px-5 py-3.5 transition hover:bg-[#5c5490]/[0.04] md:flex-row md:items-center ${
                        index < activeProfileGroup.fields.length - 1
                          ? "border-b border-[#5c5490]/[0.06]"
                          : ""
                      }`}
                    >
                      <div className="w-full shrink-0 md:w-[170px]">
                        <span className="text-xs font-medium text-slate-400">
                          {field.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium ${
                            isMissing ? "text-slate-300" : "text-[#1E1A3A]"
                          }`}
                        >
                          {field.value}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {field.editable ? (
                          <button
                            onClick={() => openModal(field)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEC293]/40 bg-[#EEC293]/15 px-2.5 py-1.5 text-xs font-bold text-[#c9924a] transition hover:bg-[#EEC293]/25"
                          >
                            <Edit3 size={11} /> Request change
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#f1f0f7] px-2.5 py-1.5 text-[11px] text-slate-400">
                            <Lock size={10} /> HR Managed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AppCard>

            {pendingRequests.length > 0 ? (
              <AppCard className="p-5">
                <SectionTitle>
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-[#F3AB9D]" /> Pending
                    Change Requests
                  </span>
                </SectionTitle>

                <div className="flex flex-col gap-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={`${request.field_key}-${request.submitted_at}-${request.requested_value}`}
                      className="flex items-center gap-3 rounded-[11px] border border-[#F3AB9D]/20 bg-[#F3AB9D]/10 px-3.5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[13px] font-bold text-[#1E1A3A]">
                          {request.field_label}
                        </p>

                        <p className="m-0 truncate text-xs text-slate-400">
                          → {request.requested_value} · {request.submitted_at}
                        </p>
                      </div>

                      <BrandBadge className="border-[#F3AB9D]/35 bg-[#F3AB9D]/15 text-[#F3AB9D]">
                        Pending
                      </BrandBadge>
                    </div>
                  ))}
                </div>
              </AppCard>
            ) : null}

            <AppCard className="p-5">
              <SectionTitle>Leave Balance</SectionTitle>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {leaveBalances.map((balance) => (
                  <div
                    key={balance.type}
                    className="rounded-[14px] border border-[#5c5490]/[0.06] bg-[#f8f7fc] p-3.5"
                  >
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-400">
                      {balance.type}
                    </p>

                    <div className="mb-2.5 h-1.5 overflow-hidden rounded-md bg-[#5c5490]/10">
                      <div
                        className={`h-full rounded-md ${balance.colorClass}`}
                        style={{
                          width: `${(balance.used / balance.total) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-extrabold tracking-[-0.5px] text-[#1E1A3A]">
                          {balance.remaining}
                        </span>

                        <span className="ml-0.5 text-[11px] text-slate-400">
                          /{balance.total}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {balance.used}d used
                      </span>
                    </div>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      days remaining
                    </p>
                  </div>
                ))}
              </div>
            </AppCard>

            <AppCard className="overflow-hidden">
              <div className="border-b border-[#5c5490]/[0.12] px-5 pt-[18px]">
                <div className="mb-3 flex items-center gap-2">
                  <Activity size={15} className="text-[#5c5490]" />

                  <h3 className="m-0 text-[15px] font-bold text-[#1E1A3A]">
                    Employee 360°
                  </h3>
                </div>

                <div className="flex gap-1 overflow-x-auto">
                  {tabs360.map((tab) => {
                    const isActive = active360Tab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActive360Tab(tab)}
                        className={`whitespace-nowrap rounded-t-[10px] px-3.5 py-2 text-[13px] font-bold transition ${
                          isActive
                            ? "bg-[#322E53] text-white"
                            : "text-slate-400 hover:bg-[#5c5490]/10 hover:text-[#5c5490]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5">
                {active360Tab === "Attendance" ? <AttendanceTab /> : null}
                {active360Tab === "Leave" ? <LeaveTab /> : null}
                {active360Tab === "Payroll" ? <PayrollTab /> : null}
                {active360Tab === "Loans" ? <LoansTab /> : null}
                {active360Tab === "Disciplinary" ? <DisciplinaryTab /> : null}
              </div>
            </AppCard>
          </section>
        </div>
      </main>

      {modalOpen && selectedField ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[#1E1A3A]/55 p-5 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[460px] rounded-[22px] bg-white p-7 shadow-[0_28px_70px_rgba(30,26,58,0.32)]">
            {showSuccess ? (
              <div className="py-7 text-center">
                <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle size={30} className="text-emerald-600" />
                </div>

                <h3 className="mb-2 text-lg font-extrabold tracking-[-0.3px] text-[#1E1A3A]">
                  Request Submitted!
                </h3>

                <p className="m-0 text-sm text-slate-400">
                  Your change request has been sent to HR for approval.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-[22px] flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-1 text-[17px] font-extrabold tracking-[-0.3px] text-[#1E1A3A]">
                      Request Profile Change
                    </h3>

                    <p className="m-0 text-xs text-slate-400">
                      {selectedField.label}
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f0f7] transition hover:bg-[#e8e6f1]"
                  >
                    <X size={15} className="text-[#49426E]" />
                  </button>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#49426E]">
                      Current value
                    </label>

                    <div className="rounded-[11px] border border-[#5c5490]/[0.12] bg-[#f8f7fc] px-3.5 py-2.5 text-sm text-slate-400">
                      {selectedField.value}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#49426E]">
                      New value <span className="text-[#F3AB9D]">*</span>
                    </label>

                    <input
                      value={newValue}
                      onChange={(event) => setNewValue(event.target.value)}
                      placeholder={`Enter new ${selectedField.label.toLowerCase()}`}
                      className="w-full rounded-[11px] border border-[#5c5490]/[0.12] bg-white px-3.5 py-2.5 text-sm text-[#1E1A3A] outline-none transition focus:border-[#5c5490] focus:ring-2 focus:ring-[#5c5490]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#49426E]">
                      Reason <span className="text-[#F3AB9D]">*</span>
                    </label>

                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Briefly describe why this change is needed..."
                      rows={3}
                      className="w-full resize-y rounded-[11px] border border-[#5c5490]/[0.12] bg-white px-3.5 py-2.5 text-sm text-[#1E1A3A] outline-none transition focus:border-[#5c5490] focus:ring-2 focus:ring-[#5c5490]/20"
                    />
                  </div>

                  <button
                    type="button"
                    className="rounded-[11px] border border-dashed border-[#5c5490]/[0.18] p-3.5 text-center transition hover:bg-[#5c5490]/[0.04]"
                  >
                    <Upload size={18} className="mx-auto mb-1.5 text-[#5c5490]" />

                    <p className="m-0 text-xs text-slate-400">
                      Attach supporting document{" "}
                      <span className="text-[#5c5490]">(optional)</span>
                    </p>
                  </button>

                  <button
                    onClick={submitChangeRequest}
                    disabled={!newValue.trim() || !reason.trim()}
                    className="rounded-xl px-3 py-3.5 text-sm font-bold tracking-[-0.1px] transition disabled:cursor-not-allowed disabled:bg-[#f1f0f7] disabled:text-slate-400 enabled:bg-gradient-to-br enabled:from-[#322E53] enabled:to-[#5c5490] enabled:text-white enabled:hover:opacity-95"
                  >
                    Submit Change Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}