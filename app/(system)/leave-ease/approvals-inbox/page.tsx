"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Settings2,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  UserPlus,
  Keyboard,
  Clock,
  Calendar,
  History,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  Info,
  Timer,
  User,
  Plane,
  Heart,
  Briefcase,
  Coffee,
  GraduationCap,
  Home,
  Umbrella,
  CalendarDays,
  Clock4,
  CornerUpLeft,
  FileText,
  RefreshCw,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type LeaveType =
  | "ANNUAL"
  | "SICK"
  | "MATERNITY"
  | "PATERNITY"
  | "UNPAID"
  | "COMPASSIONATE"
  | "STUDY"
  | "RELOCATION"
  | "OTHER";

type LeaveStatus =
  | "PENDING"
  | "ESCALATED"
  | "DELEGATED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type TabKey =
  | "ALL"
  | "MY_QUEUE"
  | "ESCALATED"
  | "DELEGATED"
  | "COMPLETED"
  | "CANCELLED";

interface LeaveItem {
  id: string;
  employeeName: string;
  employeeId: string;
  avatar: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  appliedDate: string;
  returnDate: string;
  totalDays: number;
  balanceBefore: number;
  balanceAfter: number;
  slaHoursRemaining: number;
  reason: string;
  medicalCertificate?: boolean;
  emergencyContact?: string;
  attachments?: { name: string; url?: string }[];
  delegatedTo?: string;
  escalatedLevel?: number;
  approverComments?: string;
  createdBy: string;
}

const DEFAULT_PAGE_SIZE = 10;

const LEAVE_TYPE_CONFIG: Record<
  LeaveType,
  {
    label: string;
    pill: string;
    icon: React.ReactNode;
    hint: string;
  }
> = {
  ANNUAL: {
    label: "Annual Leave",
    pill: "bg-brand-50 text-brand-800 border-brand-200",
    icon: <Plane className="h-3.5 w-3.5" />,
    hint: "Paid vacation leave",
  },
  SICK: {
    label: "Sick Leave",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <Heart className="h-3.5 w-3.5" />,
    hint: "Medical leave",
  },
  MATERNITY: {
    label: "Maternity",
    pill: "bg-pink-50 text-pink-700 border-pink-200",
    icon: <User className="h-3.5 w-3.5" />,
    hint: "Maternity leave",
  },
  PATERNITY: {
    label: "Paternity",
    pill: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    hint: "Paternity leave",
  },
  UNPAID: {
    label: "Unpaid Leave",
    pill: "bg-gray-50 text-gray-700 border-gray-200",
    icon: <Coffee className="h-3.5 w-3.5" />,
    hint: "Without pay",
  },
  COMPASSIONATE: {
    label: "Compassionate",
    pill: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Heart className="h-3.5 w-3.5" />,
    hint: "Bereavement / emergency",
  },
  STUDY: {
    label: "Study Leave",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    hint: "Study / exam leave",
  },
  RELOCATION: {
    label: "Relocation",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Home className="h-3.5 w-3.5" />,
    hint: "Moving leave",
  },
  OTHER: {
    label: "Other Leave",
    pill: "bg-slate-50 text-slate-700 border-slate-200",
    icon: <Umbrella className="h-3.5 w-3.5" />,
    hint: "Other leave types",
  },
};

const LEAVE_STATUS_CONFIG: Record<
  LeaveStatus,
  {
    label: string;
    pill: string;
    dot: string;
    help: string;
  }
> = {
  PENDING: {
    label: "Pending",
    pill: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
    help: "Waiting for action.",
  },
  ESCALATED: {
    label: "Escalated",
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    help: "Escalated due to SLA risk.",
  },
  DELEGATED: {
    label: "Delegated",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    help: "Delegated to another approver.",
  },
  APPROVED: {
    label: "Approved",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    help: "Leave approved.",
  },
  REJECTED: {
    label: "Rejected",
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    help: "Leave rejected.",
  },
  CANCELLED: {
    label: "Cancelled",
    pill: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    help: "Cancelled by employee.",
  },
};

function formatPrettyDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrettyDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nowIso() {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSlaBadge(hours: number) {
  if (hours <= 8) {
    return {
      text: `${hours}h left`,
      cls: "text-red-700 bg-red-50 border-red-200",
    };
  }

  if (hours <= 24) {
    return {
      text: `${hours}h left`,
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }

  return {
    text: `${hours}h left`,
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
}

function seedDummyLeave(): LeaveItem[] {
  const employees = [
    {
      name: "Ahmed Khan",
      id: "EMP-1021",
      avatar: "AK",
      department: "Engineering",
      position: "Senior Developer",
    },
    {
      name: "Sarah Chen",
      id: "EMP-1043",
      avatar: "SC",
      department: "Product",
      position: "Product Manager",
    },
    {
      name: "James Wilson",
      id: "EMP-1009",
      avatar: "JW",
      department: "Operations",
      position: "Ops Lead",
    },
    {
      name: "Priya Das",
      id: "EMP-1091",
      avatar: "PD",
      department: "Engineering",
      position: "QA Engineer",
    },
    {
      name: "Marcus Low",
      id: "EMP-1066",
      avatar: "ML",
      department: "IT",
      position: "System Admin",
    },
    {
      name: "Elena Frost",
      id: "EMP-1018",
      avatar: "EF",
      department: "HR",
      position: "HR Manager",
    },
    {
      name: "David Park",
      id: "EMP-1102",
      avatar: "DP",
      department: "Marketing",
      position: "Marketing Lead",
    },
    {
      name: "Lisa Wong",
      id: "EMP-1075",
      avatar: "LW",
      department: "Sales",
      position: "Account Executive",
    },
  ];

  const types: LeaveType[] = [
    "ANNUAL",
    "SICK",
    "MATERNITY",
    "PATERNITY",
    "UNPAID",
    "COMPASSIONATE",
    "STUDY",
    "RELOCATION",
    "OTHER",
  ];

  return Array.from({ length: 36 }).map((_, i) => {
    const emp = employees[i % employees.length];
    const type = types[i % types.length];

    const status: LeaveStatus =
      i === 0
        ? "ESCALATED"
        : i === 1
        ? "DELEGATED"
        : i === 2
        ? "CANCELLED"
        : i % 9 === 0
        ? "APPROVED"
        : i % 11 === 0
        ? "REJECTED"
        : "PENDING";

    const startDay = 10 + (i % 16);
    const duration = Math.max(1, (i % 5) + 1);
    const startDate = `2026-01-${String(startDay).padStart(2, "0")}`;
    const endDate = `2026-01-${String(startDay + duration - 1).padStart(2, "0")}`;
    const returnDate = `2026-01-${String(startDay + duration).padStart(2, "0")}`;

    const reasons: Record<LeaveType, string[]> = {
      ANNUAL: ["Family vacation", "Personal time off", "Travel abroad"],
      SICK: ["Flu symptoms", "Medical appointment", "Recovery from illness"],
      MATERNITY: ["Maternity leave", "Childbirth recovery"],
      PATERNITY: ["Newborn care", "Support spouse"],
      UNPAID: ["Personal reasons", "Extended travel"],
      COMPASSIONATE: ["Family emergency", "Bereavement"],
      STUDY: ["Final exams", "Course completion"],
      RELOCATION: ["Moving houses", "Setting up new home"],
      OTHER: ["Personal leave", "Special circumstances"],
    };

    const balanceBefore = type === "ANNUAL" ? 18 - (i % 10) : 0;
    const balanceAfter = Math.max(0, balanceBefore - duration);

    return {
      id: `LEAVE-${2024 + i}`,
      employeeName: emp.name,
      employeeId: emp.id,
      avatar: emp.avatar,
      department: emp.department,
      position: emp.position,
      leaveType: type,
      status,
      startDate,
      endDate,
      appliedDate: new Date(
        Date.parse("2026-01-01T12:00:00Z") - i * 6 * 60 * 60 * 1000
      ).toISOString(),
      returnDate,
      totalDays: duration,
      balanceBefore,
      balanceAfter,
      slaHoursRemaining: status === "ESCALATED" ? 4 : Math.max(2, 72 - ((i * 3) % 72)),
      reason: reasons[type][i % reasons[type].length],
      medicalCertificate: type === "SICK" && i % 3 === 0,
      emergencyContact: i % 4 === 0 ? "+1 (555) 123-4567" : undefined,
      attachments:
        i % 5 === 0
          ? [{ name: "supporting-document.pdf" }, { name: "leave-proof.pdf" }]
          : [],
      delegatedTo: status === "DELEGATED" ? "Department Head" : undefined,
      escalatedLevel: status === "ESCALATED" ? 2 : undefined,
      approverComments: i % 7 === 0 ? "Please provide supporting document." : undefined,
      createdBy: "Employee Self-Service",
    };
  });
}

function downloadLeaveCsv(rows: LeaveItem[]) {
  const headers = [
    "Request ID",
    "Employee Name",
    "Employee ID",
    "Department",
    "Position",
    "Leave Type",
    "Status",
    "Start Date",
    "End Date",
    "Return Date",
    "Total Days",
    "SLA Hours Remaining",
    "Reason",
  ];

  const csvRows = rows.map((item) => [
    item.id,
    item.employeeName,
    item.employeeId,
    item.department,
    item.position,
    item.leaveType,
    item.status,
    item.startDate,
    item.endDate,
    item.returnDate,
    item.totalDays,
    item.slaHoursRemaining,
    item.reason,
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "leave-approvals-inbox.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const styles = {
    default: {
      iconWrap: "bg-brand-800 text-white",
      value: "text-brand-900",
    },
    danger: {
      iconWrap: "bg-red-600 text-white",
      value: "text-red-600",
    },
    success: {
      iconWrap: "bg-emerald-600 text-white",
      value: "text-emerald-700",
    },
  } as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold ${styles[tone].value}`}>{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone].iconWrap}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Pill({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  if (!open) return null;

  const width =
    size === "md" ? "max-w-lg" : size === "lg" ? "max-w-2xl" : "max-w-4xl";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${width} overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl`}
      >
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-brand-700">{subtitle}</p> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer ? <div className="border-t border-gray-200 bg-white px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  danger = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      title={title}
      subtitle={description}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-800 hover:bg-brand-900"
            }`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-sm text-brand-700">{description}</p>
    </ModalShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function CreateLeaveModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<LeaveItem>) => void;
}) {
  const [type, setType] = useState<LeaveType>("ANNUAL");
  const [employeeName, setEmployeeName] = useState("Ahmed Khan");
  const [employeeId, setEmployeeId] = useState("EMP-1021");
  const [department, setDepartment] = useState("Engineering");
  const [position, setPosition] = useState("Senior Developer");
  const [startDate, setStartDate] = useState("2026-01-15");
  const [endDate, setEndDate] = useState("2026-01-17");
  const [totalDays, setTotalDays] = useState(3);
  const [reason, setReason] = useState("Family vacation");
  const [medicalCertificate, setMedicalCertificate] = useState(false);
  const [sla, setSla] = useState(48);
  const [balanceBefore, setBalanceBefore] = useState(18);

  useEffect(() => {
    if (!open) return;
    setType("ANNUAL");
    setEmployeeName("Ahmed Khan");
    setEmployeeId("EMP-1021");
    setDepartment("Engineering");
    setPosition("Senior Developer");
    setStartDate("2026-01-15");
    setEndDate("2026-01-17");
    setTotalDays(3);
    setReason("Family vacation");
    setMedicalCertificate(false);
    setSla(48);
    setBalanceBefore(18);
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create Leave Request"
      subtitle="Creates a new request in pending status."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onCreate({
                leaveType: type,
                employeeName,
                employeeId,
                department,
                position,
                avatar: employeeName
                  .split(" ")
                  .slice(0, 2)
                  .map((x) => x[0]?.toUpperCase())
                  .join(""),
                startDate,
                endDate,
                returnDate: endDate,
                totalDays: Number(totalDays),
                reason,
                medicalCertificate,
                slaHoursRemaining: Number(sla),
                balanceBefore: Number(balanceBefore),
                balanceAfter: Math.max(0, Number(balanceBefore) - Number(totalDays)),
              })
            }
            className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
          >
            Create
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Leave Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          >
            {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_CONFIG[t as LeaveType].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Employee Name">
          <input
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Employee ID">
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Department">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Position">
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="End Date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Total Days">
          <input
            type="number"
            min={1}
            max={30}
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="SLA Hours Remaining">
          <input
            type="number"
            min={1}
            max={168}
            value={sla}
            onChange={(e) => setSla(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        {type === "ANNUAL" ? (
          <Field label="Balance Before">
            <input
              type="number"
              min={0}
              max={30}
              value={balanceBefore}
              onChange={(e) => setBalanceBefore(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
            />
          </Field>
        ) : null}

        {type === "SICK" ? (
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-brand-900">
              <input
                type="checkbox"
                checked={medicalCertificate}
                onChange={(e) => setMedicalCertificate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
              />
              Requires medical certificate
            </label>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Field label="Reason">
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}

function EditLeaveModal({
  open,
  item,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  item: LeaveItem | null;
  onClose: () => void;
  onSave: (item: LeaveItem) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<LeaveItem | null>(item);

  useEffect(() => setDraft(item), [item]);

  if (!open || !draft) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Edit ${draft.id}`}
      subtitle="Update the request locally."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onDelete(draft.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Leave Type">
          <select
            value={draft.leaveType}
            onChange={(e) => setDraft({ ...draft, leaveType: e.target.value as LeaveType })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          >
            {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_CONFIG[t as LeaveType].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as LeaveStatus })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          >
            {Object.keys(LEAVE_STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>
                {LEAVE_STATUS_CONFIG[s as LeaveStatus].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Start Date">
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="End Date">
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="Total Days">
          <input
            type="number"
            min={1}
            max={30}
            value={draft.totalDays}
            onChange={(e) => setDraft({ ...draft, totalDays: Number(e.target.value) })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <Field label="SLA Hours Remaining">
          <input
            type="number"
            min={1}
            max={168}
            value={draft.slaHoursRemaining}
            onChange={(e) =>
              setDraft({ ...draft, slaHoursRemaining: Number(e.target.value) })
            }
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Reason">
            <textarea
              rows={4}
              value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}

export default function LeaveApprovalsInbox() {
  const currentApproverName = "You (Manager)";
  const [items, setItems] = useState<LeaveItem[]>(seedDummyLeave());

  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | LeaveType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeaveStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const viewItem = useMemo(
    () => items.find((item) => item.id === viewId) ?? null,
    [items, viewId]
  );

  const editItem = useMemo(
    () => items.find((item) => item.id === editId) ?? null,
    [items, editId]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewId) setViewId(null);
        if (editId) setEditId(null);
        if (createOpen) setCreateOpen(false);
        if (deleteTargetId) setDeleteTargetId(null);
      }

      const anyModalOpen = !!viewId || !!editId || createOpen || !!deleteTargetId;
      if (anyModalOpen || selectedIds.size === 0) return;

      if (e.key.toLowerCase() === "a") bulkUpdateStatus("APPROVED");
      if (e.key.toLowerCase() === "r") bulkUpdateStatus("REJECTED");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds, viewId, editId, createOpen, deleteTargetId]);

  const departments = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.department)));
  }, [items]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      escalated: items.filter((x) => x.status === "ESCALATED").length,
      delegated: items.filter((x) => x.status === "DELEGATED").length,
      completed: items.filter(
        (x) => x.status === "APPROVED" || x.status === "REJECTED"
      ).length,
      cancelled: items.filter((x) => x.status === "CANCELLED").length,
      myQueue: items.filter(
        (x) => x.status === "PENDING" || x.status === "ESCALATED"
      ).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (activeTab === "MY_QUEUE") {
      list = list.filter((x) => x.status === "PENDING" || x.status === "ESCALATED");
    } else if (activeTab === "ESCALATED") {
      list = list.filter((x) => x.status === "ESCALATED");
    } else if (activeTab === "DELEGATED") {
      list = list.filter((x) => x.status === "DELEGATED");
    } else if (activeTab === "COMPLETED") {
      list = list.filter((x) => x.status === "APPROVED" || x.status === "REJECTED");
    } else if (activeTab === "CANCELLED") {
      list = list.filter((x) => x.status === "CANCELLED");
    }

    if (typeFilter !== "ALL") {
      list = list.filter((x) => x.leaveType === typeFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((x) => x.status === statusFilter);
    }

    if (departmentFilter !== "ALL") {
      list = list.filter((x) => x.department === departmentFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (x) =>
          x.employeeName.toLowerCase().includes(q) ||
          x.employeeId.toLowerCase().includes(q) ||
          x.id.toLowerCase().includes(q) ||
          x.department.toLowerCase().includes(q) ||
          x.position.toLowerCase().includes(q)
      );
    }

    const order: Record<LeaveStatus, number> = {
      ESCALATED: 0,
      PENDING: 1,
      DELEGATED: 2,
      APPROVED: 3,
      REJECTED: 4,
      CANCELLED: 5,
    };

    list.sort((a, b) => {
      const diff = order[a.status] - order[b.status];
      if (diff !== 0) return diff;
      return a.slaHoursRemaining - b.slaHoursRemaining;
    });

    return list;
  }, [items, activeTab, typeFilter, statusFilter, departmentFilter, searchQuery]);

  useEffect(() => {
    setPageIndex(0);
  }, [activeTab, typeFilter, statusFilter, departmentFilter, searchQuery, pageSize]);

  const totalEntries = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(pageIndex + 1, totalPages);
  const start = pageIndex * pageSize;
  const end = Math.min(totalEntries, start + pageSize);
  const pagedRows = filteredItems.slice(start, end);

  const allVisibleSelected =
    pagedRows.length > 0 && pagedRows.every((row) => selectedIds.has(row.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pagedRows.forEach((row) => {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      });
      return next;
    });
  };

  const bulkUpdateStatus = (status: LeaveStatus) => {
    setItems((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, status } : item))
    );
    setSelectedIds(new Set());
  };

  const quickUpdateStatus = (id: string, status: LeaveStatus) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const deleteRequest = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (viewId === id) setViewId(null);
    if (editId === id) setEditId(null);
  };

  const createRequest = (payload: Partial<LeaveItem>) => {
    const next: LeaveItem = {
      id: `LEAVE-${Math.floor(3000 + Math.random() * 700)}`,
      employeeName: payload.employeeName ?? "New Employee",
      employeeId: payload.employeeId ?? "EMP-0000",
      avatar: payload.avatar ?? "NE",
      department: payload.department ?? "Unknown",
      position: payload.position ?? "Staff",
      leaveType: payload.leaveType ?? "ANNUAL",
      status: "PENDING",
      startDate: payload.startDate ?? "2026-01-15",
      endDate: payload.endDate ?? "2026-01-17",
      appliedDate: nowIso(),
      returnDate: payload.returnDate ?? payload.endDate ?? "2026-01-18",
      totalDays: payload.totalDays ?? 3,
      balanceBefore: payload.balanceBefore ?? 15,
      balanceAfter: payload.balanceAfter ?? 12,
      slaHoursRemaining: payload.slaHoursRemaining ?? 48,
      reason: payload.reason ?? "Personal reasons",
      medicalCertificate: payload.medicalCertificate ?? false,
      emergencyContact: payload.emergencyContact,
      attachments: payload.attachments ?? [],
      createdBy: currentApproverName,
    };

    setItems((prev) => [next, ...prev]);
  };

  const handleReset = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
    setActiveTab("ALL");
    setSelectedIds(new Set());
    setPageIndex(0);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const overdue = items.filter(
    (x) =>
      x.slaHoursRemaining <= 8 &&
      (x.status === "PENDING" || x.status === "ESCALATED")
  ).length;

  const currentlyOnLeave = items.filter(
    (x) =>
      x.status === "APPROVED" &&
      new Date(x.startDate) <= new Date() &&
      new Date(x.endDate) >= new Date()
  ).length;

  const avgResponse = "6.5h";

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Leave Approvals Inbox</h1>
            <p className="mt-1 text-sm text-brand-700">
              Review leave requests, check team coverage, and manage approvals efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={() => downloadLeaveCsv(filteredItems)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Create Leave Request
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={items.length}
            subtitle="All leave entries"
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Critical SLA"
            value={overdue}
            subtitle="Need urgent action"
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="danger"
          />
          <StatCard
            title="Currently On Leave"
            value={currentlyOnLeave}
            subtitle="Approved and active"
            icon={<CalendarDays className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            title="Avg Response"
            value={avgResponse}
            subtitle="Recent approvals"
            icon={<Clock4 className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search name, employee ID, request ID, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition placeholder:text-brand-400 focus:border-brand-800"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "ALL" | LeaveType)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="ALL">All Leave Types</option>
                  {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
                    <option key={t} value={t}>
                      {LEAVE_TYPE_CONFIG[t as LeaveType].label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "ALL" | LeaveStatus)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="ALL">All Statuses</option>
                  {Object.keys(LEAVE_STATUS_CONFIG).map((s) => (
                    <option key={s} value={s}>
                      {LEAVE_STATUS_CONFIG[s as LeaveStatus].label}
                    </option>
                  ))}
                </select>

                <select
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>

                <button className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-brand-800 transition hover:bg-brand-100">
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "ALL" as const, label: "All", count: counts.all },
                { id: "MY_QUEUE" as const, label: "My Queue", count: counts.myQueue },
                { id: "ESCALATED" as const, label: "Escalated", count: counts.escalated },
                { id: "DELEGATED" as const, label: "Delegated", count: counts.delegated },
                { id: "COMPLETED" as const, label: "Completed", count: counts.completed },
                { id: "CANCELLED" as const, label: "Cancelled", count: counts.cancelled },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-brand-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-brand-700">
                Showing <span className="font-semibold text-brand-900">{totalEntries === 0 ? 0 : start + 1}</span> to{" "}
                <span className="font-semibold text-brand-900">{end}</span> of{" "}
                <span className="font-semibold text-brand-900">{totalEntries}</span> entries
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">{overdue}</span> Critical SLA
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{currentlyOnLeave}</span> On Leave
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{selectedIds.size}</span> Selected
                </span>
              </div>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="border-b border-gray-200 bg-brand-800 px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-white">
                  <span className="text-sm font-semibold">{selectedIds.size} selected</span>
                  <span className="hidden h-4 w-px bg-white/20 md:block" />
                  <span className="inline-flex items-center gap-2 text-xs text-white/80">
                    <Keyboard className="h-3.5 w-3.5" />
                    Press <kbd className="rounded bg-white/10 px-1">A</kbd> approve •{" "}
                    <kbd className="rounded bg-white/10 px-1">R</kbd> reject
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => bulkUpdateStatus("APPROVED")}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>

                  <button
                    onClick={() => bulkUpdateStatus("REJECTED")}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>

                  <button
                    onClick={() => {
                      setItems((prev) =>
                        prev.map((x) =>
                          selectedIds.has(x.id)
                            ? {
                                ...x,
                                status: "DELEGATED",
                                delegatedTo: "HR Manager",
                              }
                            : x
                        )
                      );
                      setSelectedIds(new Set());
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    Delegate
                  </button>

                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Period
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Duration
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    SLA
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-brand-900">
                          No leave requests found
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          No leave requests match your current filters.
                        </p>
                        <button
                          onClick={handleReset}
                          className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((item) => {
                    const type = LEAVE_TYPE_CONFIG[item.leaveType];
                    const status = LEAVE_STATUS_CONFIG[item.status];
                    const sla = buildSlaBadge(item.slaHoursRemaining);
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-brand-100 ${
                          isSelected ? "bg-brand-50" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
                              {item.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">{item.employeeName}</p>
                              <p className="mt-0.5 text-[11px] text-brand-700">
                                {item.employeeId} • {item.department}
                              </p>
                              <p className="text-[11px] text-brand-600">{item.position}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Pill className={type.pill}>
                            {type.icon}
                            {type.label}
                          </Pill>
                          <p className="mt-1 text-[11px] text-brand-700">{type.hint}</p>
                          {item.medicalCertificate ? (
                            <div className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              Medical Cert
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-brand-900">
                            {formatPrettyDate(item.startDate)} → {formatPrettyDate(item.endDate)}
                          </div>
                          <div className="mt-0.5 text-[11px] text-brand-700">
                            Applied: {formatPrettyDateTime(item.appliedDate)}
                          </div>
                          <div className="mt-1 max-w-[260px] truncate text-[11px] text-brand-600">
                            {item.reason}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-lg font-bold text-brand-900">{item.totalDays}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                              Days
                            </span>
                          </div>
                          {item.leaveType === "ANNUAL" ? (
                            <div className="mt-1 text-[11px] text-brand-700">
                              Bal: {item.balanceBefore} → {item.balanceAfter}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sla.cls}`}
                          >
                            <Timer className="h-3.5 w-3.5" />
                            {sla.text}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <Pill className={status.pill}>
                            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                            {status.label}
                          </Pill>

                          {item.status === "DELEGATED" && item.delegatedTo ? (
                            <div className="mt-1 text-[11px] text-brand-700">
                              To: {item.delegatedTo}
                            </div>
                          ) : null}

                          {item.status === "ESCALATED" && item.escalatedLevel ? (
                            <div className="mt-1 text-[11px] text-red-700">
                              Level: {item.escalatedLevel}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === "PENDING" || item.status === "ESCALATED" ? (
                              <>
                                <button
                                  onClick={() => quickUpdateStatus(item.id, "APPROVED")}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                  title="Quick Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => quickUpdateStatus(item.id, "REJECTED")}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                                  title="Quick Reject"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}

                            <button
                              onClick={() => setViewId(item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                              title="View"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setEditId(item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                              title="Request Changes"
                            >
                              <CornerUpLeft className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalEntries > 0 ? (
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageIndex((prev) => clamp(prev - 1, 0, totalPages - 1))}
                    disabled={pageIndex === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber: number;

                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPageIndex(pageNumber - 1)}
                        className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                          currentPage === pageNumber
                            ? "border-brand-800 bg-brand-800 text-white"
                            : "border-gray-200 text-brand-800 hover:bg-brand-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      setPageIndex((prev) => clamp(prev + 1, 0, totalPages - 1))
                    }
                    disabled={pageIndex === totalPages - 1 || totalEntries === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageIndex(totalPages - 1)}
                    disabled={pageIndex === totalPages - 1 || totalEntries === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {totalEntries === 0 ? 0 : start + 1}
                  </span>{" "}
                  – <span className="font-semibold text-brand-900">{end}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <ModalShell
          open={!!viewItem}
          onClose={() => setViewId(null)}
          title={
            viewItem
              ? `${viewItem.id} • ${LEAVE_TYPE_CONFIG[viewItem.leaveType].label}`
              : "Leave Request"
          }
          subtitle={
            viewItem
              ? `${viewItem.employeeName} (${viewItem.employeeId}) • ${viewItem.department}`
              : undefined
          }
          size="xl"
          footer={
            viewItem ? (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex items-center gap-2 text-sm text-brand-700">
                  <Info className="h-4 w-4" />
                  {LEAVE_STATUS_CONFIG[viewItem.status].help}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {viewItem.status === "PENDING" || viewItem.status === "ESCALATED" ? (
                    <>
                      <button
                        onClick={() => {
                          quickUpdateStatus(viewItem.id, "REJECTED");
                          setViewId(null);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          quickUpdateStatus(viewItem.id, "APPROVED");
                          setViewId(null);
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={() => {
                      if (!viewItem) return;
                      setEditId(viewItem.id);
                      setViewId(null);
                    }}
                    className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : null
          }
        >
          {viewItem ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <Pill className={LEAVE_TYPE_CONFIG[viewItem.leaveType].pill}>
                      {LEAVE_TYPE_CONFIG[viewItem.leaveType].icon}
                      {LEAVE_TYPE_CONFIG[viewItem.leaveType].label}
                    </Pill>

                    <Pill className={LEAVE_STATUS_CONFIG[viewItem.status].pill}>
                      <span className={`h-2 w-2 rounded-full ${LEAVE_STATUS_CONFIG[viewItem.status].dot}`} />
                      {LEAVE_STATUS_CONFIG[viewItem.status].label}
                    </Pill>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${buildSlaBadge(viewItem.slaHoursRemaining).cls}`}
                    >
                      <Timer className="h-3.5 w-3.5" />
                      {buildSlaBadge(viewItem.slaHoursRemaining).text}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Leave Period
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {formatPrettyDate(viewItem.startDate)} → {formatPrettyDate(viewItem.endDate)}
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        Return Date: {formatPrettyDate(viewItem.returnDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Duration
                      </p>
                      <p className="mt-1 text-2xl font-bold text-brand-900">
                        {viewItem.totalDays} day{viewItem.totalDays !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {viewItem.leaveType === "ANNUAL" ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Balance Before
                          </p>
                          <p className="mt-1 text-lg font-bold text-brand-900">
                            {viewItem.balanceBefore} days
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Balance After
                          </p>
                          <p className="mt-1 text-lg font-bold text-brand-900">
                            {viewItem.balanceAfter} days
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Reason
                      </p>
                      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-brand-700">
                        {viewItem.reason}
                      </div>
                    </div>

                    {viewItem.emergencyContact ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Emergency Contact
                        </p>
                        <p className="mt-1 text-sm text-brand-900">{viewItem.emergencyContact}</p>
                      </div>
                    ) : null}

                    {viewItem.medicalCertificate ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-semibold">
                            Medical certificate required
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {viewItem.attachments?.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Attachments
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {viewItem.attachments.map((attachment, index) => (
                            <span
                              key={`${attachment.name}-${index}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-brand-700"
                            >
                              {attachment.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {viewItem.approverComments ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                          Approver Comments
                        </p>
                        <p className="mt-1 text-sm text-amber-700">{viewItem.approverComments}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Approval Timeline
                  </p>

                  <div className="mt-4 space-y-4">
                    {[
                      { at: viewItem.appliedDate, text: "Leave request submitted" },
                      {
                        at: nowIso(),
                        text:
                          viewItem.status === "ESCALATED"
                            ? "Escalated due to SLA risk"
                            : viewItem.status === "DELEGATED"
                            ? `Delegated to ${viewItem.delegatedTo ?? "another approver"}`
                            : "Waiting for approver action",
                      },
                    ].map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-brand-800" />
                        <div>
                          <p className="text-sm font-semibold text-brand-900">{event.text}</p>
                          <p className="text-[11px] text-brand-700">{formatPrettyDateTime(event.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Team Coverage Check
                      </p>
                      <p className="mt-2 text-sm text-brand-700">
                        {viewItem.totalDays > 5
                          ? "Long leave period. Review team capacity and handover plan."
                          : "Standard leave duration. Ensure basic coverage is arranged."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ModalShell>

        <EditLeaveModal
          open={!!editItem}
          item={editItem}
          onClose={() => setEditId(null)}
          onSave={(updated) => {
            setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditId(null);
          }}
          onDelete={(id) => {
            setEditId(null);
            setDeleteTargetId(id);
          }}
        />

        <CreateLeaveModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={(payload) => {
            createRequest(payload);
            setCreateOpen(false);
          }}
        />

        <ConfirmDialog
          open={!!deleteTargetId}
          title="Delete leave request?"
          description="This will permanently remove the leave request from the local dummy dataset."
          confirmText="Delete"
          danger
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={() => {
            if (!deleteTargetId) return;
            deleteRequest(deleteTargetId);
            setDeleteTargetId(null);
          }}
        />
      </div>
    </div>
  );
}