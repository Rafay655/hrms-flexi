"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  List,
  Globe,
  ExternalLink,
  ChevronRight,
  Info,
  CalendarDays,
  Settings2,
  Clock,
  MapPin,
  Search,
  Users,
  Building2,
  RefreshCw,
} from "lucide-react";

interface Holiday {
  date: string;
  day: string;
  name: string;
  type: "Public" | "Restricted" | "Optional";
  appliesTo: string;
}

type ActiveTab = "holidays" | "work-calendars";
type ViewMode = "list" | "calendar";

const PAKISTAN_HOLIDAYS_2025: Holiday[] = [
  { date: "Feb 05, 2025", day: "Wednesday", name: "Kashmir Day", type: "Public", appliesTo: "All Sites" },
  { date: "Mar 23, 2025", day: "Sunday", name: "Pakistan Day", type: "Public", appliesTo: "All Sites" },
  { date: "Mar 31, 2025", day: "Monday", name: "Eid-ul-Fitr*", type: "Public", appliesTo: "All Sites" },
  { date: "Apr 01, 2025", day: "Tuesday", name: "Eid-ul-Fitr Holiday*", type: "Public", appliesTo: "All Sites" },
  { date: "May 01, 2025", day: "Thursday", name: "Labour Day", type: "Public", appliesTo: "All Sites" },
  { date: "Jun 07, 2025", day: "Saturday", name: "Eid-ul-Azha*", type: "Public", appliesTo: "All Sites" },
  { date: "Aug 14, 2025", day: "Thursday", name: "Independence Day", type: "Public", appliesTo: "All Sites" },
  { date: "Sep 05, 2025", day: "Friday", name: "Eid Milad-un-Nabi*", type: "Public", appliesTo: "All Sites" },
  { date: "Dec 25, 2025", day: "Thursday", name: "Quaid-e-Azam Day", type: "Public", appliesTo: "All Sites" },
  { date: "Dec 31, 2025", day: "Wednesday", name: "Bank Holiday", type: "Optional", appliesTo: "Headquarters" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getTypeBadge(type: Holiday["type"]) {
  switch (type) {
    case "Public":
      return "bg-brand-50 text-brand-800 border-brand-200";
    case "Restricted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Optional":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getMonthShort(month: string) {
  return month.slice(0, 3);
}

function parseHolidayMonth(date: string) {
  return date.slice(0, 3);
}

function parseHolidayDay(date: string) {
  return Number(date.slice(4, 6));
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function HolidayCalendarReference() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("holidays");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | Holiday["type"]>("All");

  const holidayTemplates = [
    "Pakistan Public Holidays 2025",
    "Global Standard Holidays 2025",
  ];

  const workCalendarTemplates = [
    "Standard 5-Day Week",
    "Shift Schedule - Group A",
  ];

  const [selectedHolidayTemplate, setSelectedHolidayTemplate] = useState(
    holidayTemplates[0]
  );
  const [selectedWorkCalendar, setSelectedWorkCalendar] = useState(
    workCalendarTemplates[0]
  );

  const filteredHolidays = useMemo(() => {
    const q = search.trim().toLowerCase();

    return PAKISTAN_HOLIDAYS_2025.filter((holiday) => {
      const matchesSearch =
        !q ||
        holiday.name.toLowerCase().includes(q) ||
        holiday.day.toLowerCase().includes(q) ||
        holiday.appliesTo.toLowerCase().includes(q) ||
        holiday.date.toLowerCase().includes(q);

      const matchesType = typeFilter === "All" || holiday.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const stats = useMemo(() => {
    const publicCount = PAKISTAN_HOLIDAYS_2025.filter((h) => h.type === "Public").length;
    const optionalCount = PAKISTAN_HOLIDAYS_2025.filter((h) => h.type === "Optional").length;
    const restrictedCount = PAKISTAN_HOLIDAYS_2025.filter((h) => h.type === "Restricted").length;
    const allSitesCount = PAKISTAN_HOLIDAYS_2025.filter((h) => h.appliesTo === "All Sites").length;

    return {
      total: PAKISTAN_HOLIDAYS_2025.length,
      publicCount,
      optionalCount,
      restrictedCount,
      allSitesCount,
    };
  }, []);

  const monthHolidayMap = useMemo(() => {
    const map: Record<string, { day: number; name: string; type: Holiday["type"] }[]> = {};

    MONTHS.forEach((month) => {
      map[month] = [];
    });

    PAKISTAN_HOLIDAYS_2025.forEach((holiday) => {
      const month = MONTHS.find((m) => getMonthShort(m) === parseHolidayMonth(holiday.date));
      if (!month) return;

      map[month].push({
        day: parseHolidayDay(holiday.date),
        name: holiday.name,
        type: holiday.type,
      });
    });

    return map;
  }, []);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setSelectedYear("2025");
    setSelectedHolidayTemplate(holidayTemplates[0]);
    setSelectedWorkCalendar(workCalendarTemplates[0]);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-brand-900">Holidays & Calendars</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
                <Globe className="h-3.5 w-3.5" />
                Managed in Flexi HQ
              </span>
            </div>
            <p className="mt-1 text-sm text-brand-700">
              Standard reference for leave calculations and accrual eligibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900">
              Manage Holidays in HQ
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Holidays"
            value={stats.total}
            subtitle="Mapped into current reference"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            title="Public Holidays"
            value={stats.publicCount}
            subtitle="Default statutory holidays"
            icon={<CalendarIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Optional / Restricted"
            value={stats.optionalCount + stats.restrictedCount}
            subtitle="Flexible policy-based holidays"
            icon={<Info className="h-5 w-5" />}
          />
          <StatCard
            title="All Sites"
            value={stats.allSitesCount}
            subtitle="Applicable across all locations"
            icon={<Building2 className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "holidays" as const, label: "Holidays" },
              { key: "work-calendars" as const, label: "Work Calendars" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "holidays" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Holiday Template
                  </label>
                  <select
                    value={selectedHolidayTemplate}
                    onChange={(e) => setSelectedHolidayTemplate(e.target.value)}
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-brand-900 outline-none focus:border-brand-800"
                  >
                    {holidayTemplates.map((template) => (
                      <option key={template} value={template}>
                        {template}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search holiday name, day, location..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "All" | Holiday["type"])}
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  >
                    <option value="All">All Types</option>
                    <option value="Public">Public</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Optional">Optional</option>
                  </select>

                  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded-md px-3 py-2 transition ${
                        viewMode === "list"
                          ? "bg-brand-800 text-white"
                          : "text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={`rounded-md px-3 py-2 transition ${
                        viewMode === "calendar"
                          ? "bg-brand-800 text-white"
                          : "text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === "list" ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Date
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Day
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Holiday Name
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Type
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Applies To
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredHolidays.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-14 text-center">
                            <p className="text-sm text-brand-700">No holidays found for the current filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredHolidays.map((holiday, index) => (
                          <tr key={`${holiday.name}-${index}`} className="transition hover:bg-brand-100">
                            <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                              {holiday.date}
                            </td>
                            <td className="px-5 py-4 text-sm text-brand-700">{holiday.day}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand-800" />
                                <span className="text-sm font-semibold text-brand-900">
                                  {holiday.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTypeBadge(
                                  holiday.type
                                )}`}
                              >
                                {holiday.type}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 text-sm text-brand-700">
                                <MapPin className="h-4 w-4 text-brand-500" />
                                {holiday.appliesTo}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                {MONTHS.map((month) => {
                  const monthHolidays = monthHolidayMap[month] ?? [];

                  return (
                    <div
                      key={month}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold text-brand-900">
                        {month}
                      </h3>

                      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                          <span
                            key={`${month}-${day}`}
                            className="text-[10px] font-semibold uppercase tracking-wider text-brand-400"
                          >
                            {day}
                          </span>
                        ))}

                        {Array.from({ length: 31 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const holiday = monthHolidays.find((item) => item.day === dayNum);

                          return (
                            <div
                              key={`${month}-${dayNum}`}
                              title={holiday ? holiday.name : ""}
                              className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium transition ${
                                holiday
                                  ? "bg-brand-800 text-white shadow-sm"
                                  : "text-brand-500 hover:bg-brand-100"
                              }`}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 space-y-2">
                        {monthHolidays.length === 0 ? (
                          <p className="text-xs text-brand-500">No configured holidays.</p>
                        ) : (
                          monthHolidays.map((holiday) => (
                            <div
                              key={`${month}-${holiday.day}-${holiday.name}`}
                              className="rounded-lg border border-gray-200 bg-white p-2"
                            >
                              <p className="text-xs font-semibold text-brand-900">
                                {holiday.day} — {holiday.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-brand-700">{holiday.type}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Active Calendar Template
                    </p>
                    <select
                      value={selectedWorkCalendar}
                      onChange={(e) => setSelectedWorkCalendar(e.target.value)}
                      className="mt-2 h-10 rounded-lg border border-gray-200 bg-white px-3 text-lg font-semibold text-brand-900 outline-none focus:border-brand-800"
                    >
                      {workCalendarTemplates.map((template) => (
                        <option key={template} value={template}>
                          {template}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                    <Settings2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-brand-800">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Weekly Offs
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-900">
                        Saturday
                      </span>
                      <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-900">
                        Sunday
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Holiday Template
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-brand-900">
                      Pakistan Public 2025
                    </p>
                    <p className="mt-1 text-sm text-brand-700">10 annual days mapped</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Effective Date
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-brand-900">
                      Jan 1, 2025 onwards
                    </p>
                    <p className="mt-1 text-sm text-brand-700">Continuous versioning active</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Employee Count
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-brand-900">450 Employees</p>
                    <button className="mt-1 text-sm font-medium text-brand-800 transition hover:text-brand-900">
                      View assigned staff
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                      Impact Note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      These calendars directly affect leave duration calculations. When an employee
                      applies for leave, weekends and holidays marked here will automatically be
                      excluded from balance deduction based on organization policy rules.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-brand-800 p-6 text-white shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Configuration Hub</h3>
                  <p className="text-sm text-white/80">
                    Need to add a site-specific holiday or change the weekend policy for a department?
                  </p>

                  <div className="space-y-3">
                    <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/20">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                          Upcoming Change
                        </p>
                        <p className="mt-1 text-sm font-medium">Eid-ul-Fitr dates might shift</p>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/20">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                          Global Sync
                        </p>
                        <p className="mt-1 text-sm font-medium">Pull updates from Flexi Global</p>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <button className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                    Manage Calendars in HQ
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Audit History
                </h3>

                <div className="mt-5 space-y-4">
                  {[
                    { event: "Calendar Template Revised", date: "Dec 15, 2024", user: "Admin" },
                    { event: "Kashmir Day Added", date: "Nov 02, 2024", user: "System" },
                    { event: "Pakistan Day Fixed", date: "Jan 05, 2024", user: "Admin" },
                  ].map((log, index) => (
                    <div key={`${log.event}-${index}`} className="relative pl-5">
                      <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-brand-300" />
                      <p className="text-sm font-semibold text-brand-900">{log.event}</p>
                      <p className="mt-0.5 text-[11px] text-brand-700">
                        {log.date} • {log.user}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}