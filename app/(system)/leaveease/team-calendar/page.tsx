"use client";

import { useMemo, useState } from "react";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  Plane,
  X,
  ChevronDown,
  Info,
  Search,
  Briefcase,
  CalendarCheck,
  UserCheck,
  UserX,
} from "lucide-react";

type DayStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEK_OFF"
  | "HALF_DAY"
  | "OT";

type ViewMode = "Week" | "Month";
type Department = "All" | "Engineering" | "HR" | "Finance" | "Design" | "Operations";

interface DayRecord {
  status: DayStatus;
  in?: string;
  out?: string;
  hours?: string;
  ot?: string;
  reason?: string;
  reviewed?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  department: Exclude<Department, "All">;
  role: string;
  records: Record<string, DayRecord>;
}

const STATUS_UI: Record<
  DayStatus,
  { color: string; soft: string; label: string; text: string; icon: React.ReactNode }
> = {
  PRESENT: {
    color: "bg-emerald-500",
    soft: "bg-emerald-50 border-emerald-200",
    label: "Present",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  LATE: {
    color: "bg-amber-500",
    soft: "bg-amber-50 border-amber-200",
    label: "Late",
    text: "text-amber-700",
    icon: <Clock3 className="h-3 w-3" />,
  },
  ABSENT: {
    color: "bg-rose-500",
    soft: "bg-rose-50 border-rose-200",
    label: "Absent",
    text: "text-rose-700",
    icon: <UserX className="h-3 w-3" />,
  },
  LEAVE: {
    color: "bg-sky-500",
    soft: "bg-sky-50 border-sky-200",
    label: "Leave",
    text: "text-sky-700",
    icon: <Plane className="h-3 w-3" />,
  },
  HOLIDAY: {
    color: "bg-violet-500",
    soft: "bg-violet-50 border-violet-200",
    label: "Holiday",
    text: "text-violet-700",
    icon: <CalendarCheck className="h-3 w-3" />,
  },
  WEEK_OFF: {
    color: "bg-slate-200",
    soft: "bg-slate-50 border-slate-200",
    label: "Weekly Off",
    text: "text-slate-600",
    icon: <Briefcase className="h-3 w-3" />,
  },
  HALF_DAY: {
    color: "bg-gradient-to-br from-emerald-400 to-amber-400",
    soft: "bg-emerald-50 border-emerald-200",
    label: "Half Day",
    text: "text-emerald-700",
    icon: <Clock3 className="h-3 w-3" />,
  },
  OT: {
    color: "bg-[#443763]",
    soft: "bg-violet-50 border-violet-200",
    label: "Overtime",
    text: "text-violet-700",
    icon: <Clock3 className="h-3 w-3" />,
  },
};

const MOCK_NAMES = [
  "Alex Rivera",
  "Saira Chaudhry",
  "Junaid Waqar",
  "Parveen Danish",
  "Marcus Low",
  "Emaan Farooq",
  "Tom Hardy",
  "Lisa Ray",
  "Kevin Hart",
  "Nina Simone",
  "Oscar Isaac",
  "Wanda M.",
  "Pietro M.",
  "Vision AI",
  "Natasha R.",
];

const DEPARTMENTS: Exclude<Department, "All">[] = [
  "Engineering",
  "Engineering",
  "Finance",
  "Design",
  "Operations",
  "HR",
  "Engineering",
  "Design",
  "Finance",
  "Operations",
  "HR",
  "Engineering",
  "Design",
  "Operations",
  "Finance",
];

const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Account Officer",
  "UI Designer",
  "Operations Executive",
  "HR Officer",
  "QA Engineer",
  "Product Designer",
  "Payroll Analyst",
  "Field Ops Coordinator",
  "HRBP",
  "DevOps Engineer",
  "Visual Designer",
  "Operations Analyst",
  "Finance Executive",
];

function toKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function getWeekStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return startOfDay(copy);
}

function buildVisibleDates(anchor: Date, viewMode: ViewMode) {
  if (viewMode === "Week") {
    const start = getWeekStart(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const total = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: total }, (_, i) => new Date(year, month, i + 1));
}

function formatHeaderRange(anchor: Date, viewMode: ViewMode) {
  if (viewMode === "Week") {
    const weekStart = getWeekStart(anchor);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} — ${weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return anchor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function makeMockTeam(baseDate: Date): TeamMember[] {
  const monthDates = buildVisibleDates(baseDate, "Month");

  return Array.from({ length: 15 }).map((_, idx) => {
    const records: Record<string, DayRecord> = {};

    monthDates.forEach((date) => {
      const day = date.getDate();
      const weekend = isWeekend(date);

      let status: DayStatus = "PRESENT";
      let reason: string | undefined;
      let inTime = "09:00 AM";
      let outTime = "06:00 PM";
      let hours = "9.0h";
      let ot: string | undefined;

      if (weekend) {
        status = "WEEK_OFF";
        inTime = undefined as never;
        outTime = undefined as never;
        hours = undefined as never;
      } else if (day === 1) {
        status = "HOLIDAY";
        inTime = undefined as never;
        outTime = undefined as never;
        hours = undefined as never;
      } else {
        const seed = (idx * 37 + day * 13) % 10;

        if (seed <= 4) status = "PRESENT";
        else if (seed === 5) status = "LATE";
        else if (seed === 6) status = "HALF_DAY";
        else if (seed === 7) status = "LEAVE";
        else if (seed === 8) status = "ABSENT";
        else status = "OT";

        if (status === "LATE") {
          inTime = "09:34 AM";
          outTime = "06:08 PM";
          hours = "8.3h";
        }

        if (status === "HALF_DAY") {
          inTime = "09:10 AM";
          outTime = "01:15 PM";
          hours = "4.0h";
          reason = "Half day approved";
        }

        if (status === "LEAVE") {
          inTime = undefined as never;
          outTime = undefined as never;
          hours = undefined as never;
          reason = day % 2 === 0 ? "Annual Vacation" : "Personal Leave";
        }

        if (status === "ABSENT") {
          inTime = undefined as never;
          outTime = undefined as never;
          hours = undefined as never;
          reason = "Unreported absence";
        }

        if (status === "OT") {
          inTime = "08:55 AM";
          outTime = "08:40 PM";
          hours = "11.7h";
          ot = "2.7h";
        }

        if (status === "PRESENT" && (idx + day) % 9 === 0) {
          outTime = "";
          hours = "—";
          reason = "Missing out-punch";
        }
      }

      records[toKey(date)] = {
        status,
        in: inTime,
        out: outTime,
        hours,
        ot,
        reason,
        reviewed: false,
      };
    });

    return {
      id: `TM-${idx + 1}`,
      name: MOCK_NAMES[idx],
      avatar: MOCK_NAMES[idx][0],
      department: DEPARTMENTS[idx],
      role: ROLES[idx],
      records,
    };
  });
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TeamCalendar() {
  const today = useMemo(() => new Date(2025, 0, 10), []);
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [anchorDate, setAnchorDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [hoveredCell, setHoveredCell] = useState<{ memberId: string; dayKey: string } | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<Department>("All");
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState<TeamMember[]>(() => makeMockTeam(today));

  const visibleDates = useMemo(() => buildVisibleDates(anchorDate, viewMode), [anchorDate, viewMode]);

  const filteredTeam = useMemo(() => {
    const q = search.trim().toLowerCase();

    return team.filter((member) => {
      const departmentMatch =
        departmentFilter === "All" || member.department === departmentFilter;

      const searchMatch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q);

      return departmentMatch && searchMatch;
    });
  }, [team, departmentFilter, search]);

  const dailySummary = useMemo(() => {
    return visibleDates.map((date) => {
      const key = toKey(date);
      const total = filteredTeam.length;
      const presentCount = filteredTeam.filter((member) =>
        ["PRESENT", "LATE", "OT", "HALF_DAY"].includes(member.records[key]?.status)
      ).length;

      const coverage = total === 0 ? 0 : (presentCount / total) * 100;
      return { date, key, count: presentCount, total, coverage };
    });
  }, [visibleDates, filteredTeam]);

  const sidebarData = useMemo(() => {
    if (!selectedDate) return null;

    const key = toKey(selectedDate);

    const present = filteredTeam.filter((m) =>
      ["PRESENT", "LATE", "OT", "HALF_DAY"].includes(m.records[key]?.status)
    );
    const absent = filteredTeam.filter((m) => m.records[key]?.status === "ABSENT");
    const leave = filteredTeam.filter((m) => m.records[key]?.status === "LEAVE");
    const issues = filteredTeam.filter((m) => {
      const record = m.records[key];
      return record?.status === "LATE" || (record?.status === "PRESENT" && !record?.out);
    });

    return {
      key,
      date: selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      present,
      absent,
      leave,
      issues,
    };
  }, [selectedDate, filteredTeam]);

  const overallStats = useMemo(() => {
    const totalCells = visibleDates.length * Math.max(filteredTeam.length, 1);

    let present = 0;
    let leave = 0;
    let absent = 0;
    let issues = 0;

    filteredTeam.forEach((member) => {
      visibleDates.forEach((date) => {
        const r = member.records[toKey(date)];
        if (!r) return;

        if (["PRESENT", "LATE", "OT", "HALF_DAY"].includes(r.status)) present += 1;
        if (r.status === "LEAVE") leave += 1;
        if (r.status === "ABSENT") absent += 1;
        if (r.status === "LATE" || (r.status === "PRESENT" && !r.out)) issues += 1;
      });
    });

    return {
      attendanceRate: Math.round((present / totalCells) * 100),
      leave,
      absent,
      issues,
    };
  }, [filteredTeam, visibleDates]);

  const handlePrev = () => {
    const next = new Date(anchorDate);
    if (viewMode === "Week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setAnchorDate(next);
  };

  const handleNext = () => {
    const next = new Date(anchorDate);
    if (viewMode === "Week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setAnchorDate(next);
  };

  const handleToday = () => {
    setAnchorDate(today);
    setSelectedDate(today);
  };

  const handleExport = () => {
    const rows = filteredTeam.flatMap((member) =>
      visibleDates.map((date) => {
        const record = member.records[toKey(date)];
        return {
          MemberID: member.id,
          Name: member.name,
          Department: member.department,
          Role: member.role,
          Date: date.toLocaleDateString("en-US"),
          Status: record?.status ?? "",
          In: record?.in ?? "",
          Out: record?.out ?? "",
          Hours: record?.hours ?? "",
          OT: record?.ot ?? "",
          Reason: record?.reason ?? "",
        };
      })
    );

    downloadCsv("team-calendar-export.csv", rows);
  };

  const handleResolveIssues = () => {
    if (!sidebarData) return;

    setTeam((prev) =>
      prev.map((member) => {
        const record = member.records[sidebarData.key];
        if (!record) return member;

        if (record.status === "LATE") {
          return {
            ...member,
            records: {
              ...member.records,
              [sidebarData.key]: {
                ...record,
                status: "PRESENT",
                reviewed: true,
              },
            },
          };
        }

        if (record.status === "PRESENT" && !record.out) {
          return {
            ...member,
            records: {
              ...member.records,
              [sidebarData.key]: {
                ...record,
                out: "06:00 PM",
                hours: "9.0h",
                reviewed: true,
              },
            },
          };
        }

        return member;
      })
    );
  };

  const handleGenerateDailyReport = () => {
    if (!sidebarData) return;

    const rows = [
      ...sidebarData.present.map((m) => ({
        Name: m.name,
        Department: m.department,
        Status: m.records[sidebarData.key].status,
        In: m.records[sidebarData.key].in ?? "",
        Out: m.records[sidebarData.key].out ?? "",
        Hours: m.records[sidebarData.key].hours ?? "",
        Reason: m.records[sidebarData.key].reason ?? "",
      })),
      ...sidebarData.leave.map((m) => ({
        Name: m.name,
        Department: m.department,
        Status: m.records[sidebarData.key].status,
        In: "",
        Out: "",
        Hours: "",
        Reason: m.records[sidebarData.key].reason ?? "",
      })),
      ...sidebarData.absent.map((m) => ({
        Name: m.name,
        Department: m.department,
        Status: m.records[sidebarData.key].status,
        In: "",
        Out: "",
        Hours: "",
        Reason: m.records[sidebarData.key].reason ?? "",
      })),
    ];

    downloadCsv(`daily-report-${sidebarData.key}.csv`, rows);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 lg:p-8"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#322E53] via-[#322E53] to-[#5c5490] p-3 text-white shadow-lg shadow-[#443763]/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#322E53]">Team Calendar</h1>
              <p className="mt-1.5 text-sm text-slate-500 max-w-md">
                Track daily attendance, leaves, overtime, and team coverage at a glance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(["Week", "Month"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    viewMode === mode
                      ? "bg-[#443763] text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={handlePrev}
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="min-w-[200px] px-2 text-center text-sm font-semibold text-slate-700">
                {formatHeaderRange(anchorDate, viewMode)}
              </div>

              <button
                onClick={handleNext}
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#443763] transition-all hover:bg-slate-50 hover:shadow-sm"
            >
              Today
            </button>

            <button
              onClick={handleExport}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#443763] to-[#5c5490] px-5 text-sm font-semibold text-white shadow-md shadow-[#443763]/20 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters + Stats Grid */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          {/* Filter Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#443763]/10 text-[#443763]">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#322E53]">Filters & Search</p>
                  <p className="text-xs text-slate-500">Narrow down team members</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, role, department..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-[#443763] focus:ring-1 focus:ring-[#443763]"
                  />
                </div>

                <div className="relative">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value as Department)}
                    className="h-11 min-w-[200px] appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#443763] focus:ring-1 focus:ring-[#443763]"
                  >
                    {["All", "Engineering", "HR", "Finance", "Design", "Operations"].map((d) => (
                      <option key={d} value={d}>
                        {d === "All" ? "All Departments" : d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-4">
            <div className="group rounded-2xl bg-gradient-to-br from-[#443763] via-[#5c5490] to-[#A085E0] p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Attendance</p>
              <p className="mt-2 text-3xl font-bold">{overallStats.attendanceRate}%</p>
            </div>

            <div className="group rounded-2xl bg-gradient-to-br from-[#49426E] via-[#49426E] to-[#CEE7BE] p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Team Size</p>
              <p className="mt-2 text-3xl font-bold">{filteredTeam.length}</p>
            </div>

            <div className="group rounded-2xl bg-gradient-to-br from-[#EEC293] via-[#DEAD68] to-[#FFC574] p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Leave</p>
              <p className="mt-2 text-3xl font-bold">{overallStats.leave}</p>
            </div>

            <div className="group rounded-2xl bg-gradient-to-br from-[#F3AB9D] via-[#F3AB9D] to-[#FCA6A2] p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Issues</p>
              <p className="mt-2 text-3xl font-bold">{overallStats.issues}</p>
            </div>
          </div>
        </div>

        {/* Main Grid: Table + Sidebar */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          {/* Heatmap Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
                  <tr>
                    <th className="sticky left-0 z-30 min-w-[240px] border-b border-r border-slate-100 bg-white p-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Team Member
                    </th>

                    {visibleDates.map((date) => {
                      const selected = selectedDate && isSameDay(selectedDate, date);
                      const todayCell = isSameDay(today, date);

                      return (
                        <th
                          key={toKey(date)}
                          className={`min-w-[56px] border-b border-r border-slate-100 p-2 text-center transition-colors ${
                            selected ? "bg-[#443763]/5" : ""
                          }`}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div
                            className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              todayCell
                                ? "bg-[#443763] text-white shadow-md"
                                : selected
                                ? "bg-[#443763]/10 text-[#443763]"
                                : "text-slate-600"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {filteredTeam.map((member) => (
                    <tr key={member.id} className="group transition-all hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white p-3 group-hover:bg-slate-50/60">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#443763]/10 to-[#5c5490]/10 text-sm font-bold text-[#443763] shadow-sm">
                            {member.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{member.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {member.role} • {member.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {visibleDates.map((date) => {
                        const key = toKey(date);
                        const record = member.records[key];
                        const selected = selectedDate && isSameDay(selectedDate, date);
                        const isHovered =
                          hoveredCell?.memberId === member.id && hoveredCell?.dayKey === key;

                        return (
                          <td
                            key={key}
                            className={`relative border-b border-r border-slate-50 p-1 transition-colors ${
                              selected ? "bg-[#443763]/5" : ""
                            }`}
                            onMouseEnter={() => setHoveredCell({ memberId: member.id, dayKey: key })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div
                              className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-xl shadow-sm transition-all duration-200 hover:scale-[0.97] hover:shadow-md ${STATUS_UI[record.status].color}`}
                            >
                              {record.status === "OT" && (
                                <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                                  OT
                                </span>
                              )}
                              {record.reviewed && (
                                <CheckCircle2 className="h-3 w-3 text-white drop-shadow-sm" />
                              )}
                            </div>

                            {/* Enhanced Tooltip */}
                            {isHovered && !["WEEK_OFF", "HOLIDAY"].includes(record.status) && (
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-52 -translate-x-1/2 rounded-xl bg-slate-900 p-3 text-white shadow-2xl">
                                <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
                                  <div className="flex items-center gap-1.5">
                                    {STATUS_UI[record.status].icon}
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                                      {STATUS_UI[record.status].label}
                                    </span>
                                  </div>
                                  {record.ot && (
                                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                                      +{record.ot}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Check In</span>
                                    <span className="font-medium text-white">{record.in || "—"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Check Out</span>
                                    <span className="font-medium text-white">{record.out || "—"}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                                    <span className="text-slate-400">Total Hours</span>
                                    <span className="font-semibold text-sky-300">
                                      {record.hours || "—"}
                                    </span>
                                  </div>
                                  {record.reason && (
                                    <div className="mt-1 rounded-md bg-white/10 p-1.5 text-[10px] text-slate-200">
                                      {record.reason}
                                    </div>
                                  )}
                                </div>

                                <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

                <tfoot className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-sm">
                  <tr className="border-t border-slate-200">
                    <td className="sticky left-0 z-30 border-r border-t border-slate-200 bg-slate-50 p-4 text-[11px] font-semibold uppercase tracking-wider text-[#443763]">
                      Daily Coverage
                    </td>

                    {dailySummary.map((sum) => {
                      const selected = selectedDate && isSameDay(selectedDate, sum.date);

                      return (
                        <td key={sum.key} className={`border-t border-slate-200 p-1 ${selected ? "bg-[#443763]/10" : ""}`}>
                          <div
                            className={`rounded-lg py-2 text-center text-[11px] font-bold transition-all ${
                              sum.coverage >= 85
                                ? "bg-emerald-100 text-emerald-700"
                                : sum.coverage >= 60
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {sum.count}/{sum.total}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sidebar - Daily Breakdown */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {sidebarData ? (
              <div className="flex h-full flex-col">
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#443763]/5 to-transparent p-5">
                  <div className="absolute right-0 top-0 p-6 text-[#443763]/5">
                    <CalendarIcon className="h-24 w-24" />
                  </div>

                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#443763]">
                        Daily Breakdown
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-slate-800">{sidebarData.date}</h3>
                    </div>

                    <button
                      onClick={() => setSelectedDate(null)}
                      className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Attendance
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-800">
                        {sidebarData.present.length}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                          / {filteredTeam.length}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Efficiency
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600">
                        {filteredTeam.length === 0
                          ? "0%"
                          : `${Math.round((sidebarData.present.length / filteredTeam.length) * 100)}%`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  {/* Issues Section */}
                  {sidebarData.issues.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                          Attention Needed ({sidebarData.issues.length})
                        </p>
                      </div>

                      <div className="space-y-2">
                        {sidebarData.issues.map((m) => {
                          const record = m.records[sidebarData.key];
                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 transition-all hover:shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-200 text-xs font-bold text-rose-700">
                                  {m.avatar}
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-600 shadow-sm">
                                {record.status === "LATE" ? "Late In" : "Missing Out"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Working Team */}
                  <div className="space-y-3">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      On Duty ({sidebarData.present.length})
                    </p>

                    <div className="space-y-2">
                      {sidebarData.present.map((m) => {
                        const record = m.records[sidebarData.key];
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-xl p-2.5 transition-all hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                {m.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700">{m.name}</p>
                                <div className="flex items-center gap-1">
                                  {STATUS_UI[record.status].icon}
                                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                    {STATUS_UI[record.status].label}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-medium text-slate-700">
                                {record.in || "—"} - {record.out || "—"}
                              </p>
                              <p className="text-[11px] text-sky-600">Hrs: {record.hours || "—"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Absent / Leave */}
                  {(sidebarData.leave.length > 0 || sidebarData.absent.length > 0) && (
                    <div className="space-y-3">
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Away / Off Duty
                      </p>

                      <div className="space-y-2">
                        {[...sidebarData.leave, ...sidebarData.absent].map((m) => {
                          const record = m.records[sidebarData.key];
                          const absent = record.status === "ABSENT";

                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                    absent ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600"
                                  }`}
                                >
                                  {absent ? <XCircle className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">{m.name}</p>
                                  <p className="text-xs italic text-slate-500">
                                    {record.reason || "No reason"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 border-t border-slate-100 bg-white p-5">
                  <button
                    onClick={handleResolveIssues}
                    disabled={!sidebarData || sidebarData.issues.length === 0}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#443763] to-[#5c5490] text-sm font-semibold text-white shadow-md shadow-[#443763]/20 transition-all hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolve {sidebarData.issues.length} Issue{sidebarData.issues.length !== 1 ? "s" : ""}
                  </button>

                  <button
                    onClick={handleGenerateDailyReport}
                    disabled={!sidebarData}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                  >
                    Generate Daily Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[500px] flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CalendarIcon className="h-10 w-10 text-slate-300" />
                </div>
                <p className="max-w-[220px] text-[11px] font-semibold uppercase tracking-wider text-slate-400 leading-relaxed">
                  Select a date to view detailed attendance metrics
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend & Info Section */}
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex min-w-max items-center gap-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="border-r border-slate-200 pr-5 text-[#443763]">Status Legend</span>
              {Object.entries(STATUS_UI).map(([status, ui]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-md ${ui.color} shadow-sm`} />
                  <span className="text-slate-600">{ui.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Attendance Insights</h4>
                <p className="mt-1 text-sm text-amber-800/80">
                  In your actual HRMS, this module integrates with punch-in/out data, leave approvals,
                  holiday calendars, and manager workflows for real-time accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}