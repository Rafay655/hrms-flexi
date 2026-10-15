"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  CalendarClock,
  CalendarOff,
  Check,
  CircleAlert,
  Clock3,
  DatabaseZap,
  GripVertical,
  Info,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  UserCheck,
  Users,
  WalletCards,
  type LucideProps,
} from "lucide-react";
import { insight360Service } from "@/services/insight360";
import { useAppSelector } from "@/store/hooks";
import type { Insight360Dashboard, Insight360LayoutItem, Insight360WidgetData } from "@/types/insight360";
import {
  DashboardWidgetCard,
  formatWidgetValue,
  widgetFreshness,
  widgetRows,
} from "../_components/DashboardWidgetCard";
import { ErrorPanel, LoadingPanel, ScopeIndicator } from "../_components/Insight360Ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

type IconComponent = ComponentType<LucideProps>;

type SummaryCard = {
  key: string;
  title: string;
  value: string;
  supportingText: string;
  source: string;
  freshness: string;
  icon: IconComponent;
  tone: "purple" | "green" | "coral" | "amber";
  restricted?: boolean;
};

const SUMMARY_TONES: Record<SummaryCard["tone"], { icon: string; iconBackground: string; accent: string }> = {
  purple: { icon: "text-brand-700", iconBackground: "bg-brand-100", accent: "text-brand-700" },
  green: { icon: "text-emerald-700", iconBackground: "bg-emerald-50", accent: "text-emerald-700" },
  coral: { icon: "text-rose-600", iconBackground: "bg-rose-50", accent: "text-rose-600" },
  amber: { icon: "text-amber-700", iconBackground: "bg-amber-50", accent: "text-amber-700" },
};

const DASHBOARD_PROVIDER_LABELS: Record<string, string> = {
  people_hub: "PeopleHub",
  time_sync: "TimeSync",
  leave_ease: "LeaveEase",
  pay_edge: "PayEdge",
};

const DASHBOARD_ITEM_LABELS: Record<string, string> = {
  headcount_total: "Active Workforce",
  employment_status_mix: "Employment Status Distribution",
  attendance_status_mix: "Attendance Status Today",
  average_work_minutes: "Average Working Time",
  leave_status_mix: "Leave Request Status",
  net_pay_total: "Net Payroll",
};

function dashboardProviderLabel(provider: string): string {
  return DASHBOARD_PROVIDER_LABELS[provider] ?? provider.replaceAll("_", " ");
}

function matchingRowValue(widget: Insight360WidgetData | undefined, matcher?: RegExp): number {
  if (!widget) return 0;
  const rows = widgetRows(widget);
  if (!matcher) return rows[0]?.value ?? 0;
  return rows.find((row) => matcher.test(row.category.toLowerCase()))?.value ?? 0;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 }).format(value);
}

function freshnessSummary(widgets: Insight360WidgetData[]): string {
  const latest = widgets
    .map((widget) => widget.freshness.data_as_of ? new Date(widget.freshness.data_as_of).getTime() : 0)
    .reduce((maximum, value) => Math.max(maximum, value), 0);
  if (!latest) return "Waiting for the first update";
  const minutes = Math.max(0, Math.floor((Date.now() - latest) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  return `Updated ${new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latest))}`;
}

function OperationalKpiCard({ card }: { card: SummaryCard }) {
  const tone = SUMMARY_TONES[card.tone];
  const Icon = card.icon;

  return (
    <article className="flex min-h-[186px] flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-[0_1px_3px_rgba(30,26,58,0.06)]">
      <header className="flex min-h-6 items-start justify-between gap-2">
        <h2 className="text-sm font-semibold leading-5 text-brand-900">{card.title}</h2>
      </header>
      <div className="mt-3 flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconBackground}`}>
          <Icon aria-hidden="true" className={`h-5 w-5 ${tone.icon}`} />
        </span>
        <p className="min-w-0 text-xl font-bold tracking-tight text-brand-900 xl:text-2xl">{card.value}</p>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600">{card.supportingText}</p>
      <div className="mt-2">
        <span className={`inline-flex rounded-md border border-current/20 px-1.5 py-0.5 text-xs font-semibold ${tone.accent} ${tone.iconBackground}`}>{card.source}</span>
      </div>
      <footer className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-gray-500">
        {card.restricted ? <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" /> : <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />}
        {card.restricted ? "Restricted to authorised roles" : `As of ${card.freshness}`}
      </footer>
    </article>
  );
}

function SortableVisibilityItem({ item, label, onToggle }: {
  item: Insight360LayoutItem;
  label: string;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.widget_key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-h-14 items-center gap-2 rounded-xl border bg-white px-2.5 py-2 transition-shadow ${isDragging ? "z-10 border-brand-600 shadow-lg" : "border-gray-200"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        className="transition-colors flex h-11 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-gray-400 hover:bg-brand-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 text-sm font-medium text-brand-900">{label}</span>
      <Switch
        checked={item.is_visible}
        onCheckedChange={onToggle}
        aria-label={`${item.is_visible ? "Hide" : "Show"} ${label}`}
        className="data-[state=checked]:bg-brand-700"
      />
    </div>
  );
}

function AttentionCard({ title, value, description, href, action, icon: Icon, tone }: {
  title: string;
  value: string;
  description: string;
  href: string;
  action: string;
  icon: IconComponent;
  tone: "amber" | "coral" | "purple";
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    coral: "border-rose-200 bg-rose-50 text-rose-700",
    purple: "border-gray-200 bg-brand-100 text-brand-700",
  }[tone];

  return (
    <article className={`flex min-h-48 flex-col rounded-xl border p-3 ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{title}</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">{value}</p>
        </div>
        <Icon aria-hidden="true" className="h-8 w-8" />
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
      <Link href={href} className="mt-auto inline-flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-current/25 bg-white/80 px-3 text-xs font-semibold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
        {action}<ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

function AverageWorkingTimePanel({ widget }: { widget: Insight360WidgetData }) {
  const minutes = matchingRowValue(widget);
  const targetMinutes = 8 * 60;
  const barHeight = Math.min(100, Math.max(0, (minutes / targetMinutes) * 100));

  return (
    <article className="flex min-h-[330px] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.06)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-brand-900">Average Recorded Working Time</h2>
          <p className="mt-0.5 text-xs font-semibold text-brand-600">TimeSync</p>
        </div>
      </header>
      <p className="mt-2 text-xs text-gray-600">Average recorded hours per employee</p>
      <div className="relative mt-3 flex min-h-44 flex-1 items-end justify-center overflow-hidden rounded-lg bg-[linear-gradient(to_top,var(--border)_1px,transparent_1px)] bg-[length:100%_25%] px-8 pb-6 pt-4">
        <div className="absolute left-3 right-3 top-[22%] border-t border-dashed border-amber-500" />
        <span className="absolute right-3 top-[calc(22%-18px)] text-xs font-semibold text-amber-800">8h target</span>
        {minutes > 0 ? (
          <div className="flex h-full w-20 flex-col items-center justify-end">
            <span className="mb-1 text-xs font-semibold text-brand-900">{formatWidgetValue(minutes, widget)}</span>
            <div className="w-12 rounded-t-md bg-brand-700" style={{ height: `${barHeight}%` }} />
            <span className="mt-1.5 text-xs text-gray-500">Current</span>
          </div>
        ) : (
          <div className="mb-8 flex flex-col items-center text-center text-xs text-gray-500">
            <Clock3 aria-hidden="true" className="mb-2 h-6 w-6 text-brand-600" />
            No recorded working-time trend is available for this scope.
          </div>
        )}
      </div>
      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />As of {widgetFreshness(widget, true)}</span>
        <span className="font-semibold text-brand-700">Current average</span>
      </footer>
    </article>
  );
}

function WidgetStatesPanel({ attendanceWidget, payrollWidget }: {
  attendanceWidget?: Insight360WidgetData;
  payrollWidget?: Insight360WidgetData;
}) {
  const hasAttendanceData = Boolean(attendanceWidget?.data.rows.length);

  return (
    <aside aria-labelledby="widget-states-heading" className="space-y-2">
      <h2 id="widget-states-heading" className="text-sm font-bold text-brand-900">Widget states</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex gap-2.5">
          <CircleAlert aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${hasAttendanceData ? "text-emerald-600" : "text-brand-700"}`} />
          <div>
            <h3 className="text-xs font-semibold text-brand-900">{hasAttendanceData ? "Attendance data available" : "No attendance data available"}</h3>
            <p className="mt-1 text-xs leading-4 text-gray-600">{hasAttendanceData ? "TimeSync supplied attendance records for the current scope." : "TimeSync has not returned attendance records for the selected scope."}</p>
          </div>
        </div>
        <Link href="/insight360/catalogue?q=attendance" className="transition-colors mt-3 inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-brand-600 px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open TimeSync reports</Link>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex gap-2.5">
          <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <div>
            <h3 className="text-xs font-semibold text-brand-900">{payrollWidget ? "Sensitive metric" : "Restricted metric"}</h3>
            <p className="mt-1 text-xs leading-4 text-gray-600">{payrollWidget ? "Net payroll is visible because your current role includes the required access." : "Your current role does not include permission to view payroll totals."}</p>
          </div>
        </div>
        <Link href="/insight360/catalogue?q=payroll" className="transition-colors mt-3 inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-brand-600 px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">View access information</Link>
      </div>
    </aside>
  );
}

function DashboardWorkspace({ initial }: { initial: Insight360Dashboard }) {
  const queryClient = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const company = useAppSelector((state) => state.auth.company);
  const canRefresh = permissions.includes("insight360.dashboard.manage");
  const [items, setItems] = useState<Insight360LayoutItem[]>(initial.layout.items);
  const [customizing, setCustomizing] = useState(false);
  const [saved, setSaved] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const catalogue = useQuery({ queryKey: ["insight360", "dashboard", "catalogue"], queryFn: insight360Service.dashboardWidgets });
  const widgetMap = useMemo(() => new Map(initial.widgets.map((widget) => [widget.widget_key, widget])), [initial.widgets]);
  const descriptorMap = useMemo(() => new Map((catalogue.data ?? []).map((widget) => [widget.widget_key, widget])), [catalogue.data]);
  const orderedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const visibleItems = orderedItems.filter((item) => item.is_visible);
  const visibleWidgets = visibleItems.map((item) => widgetMap.get(item.widget_key)).filter((widget): widget is Insight360WidgetData => Boolean(widget));

  const headcountWidget = visibleWidgets.find((widget) => widget.widget_key === "headcount_total");
  const employmentWidget = visibleWidgets.find((widget) => widget.widget_key === "employment_status_mix");
  const attendanceWidget = visibleWidgets.find((widget) => widget.widget_key === "attendance_status_mix");
  const averageTimeWidget = visibleWidgets.find((widget) => widget.widget_key === "average_work_minutes");
  const payrollWidget = visibleWidgets.find((widget) => widget.widget_key === "net_pay_total");
  const leaveWidget = visibleWidgets.find((widget) => widget.widget_key === "leave_status_mix");

  const attendanceRows = attendanceWidget ? widgetRows(attendanceWidget) : [];
  const attendanceTotal = attendanceRows.reduce((sum, row) => sum + row.value, 0);
  const presentToday = matchingRowValue(attendanceWidget, /^present$|\bpresent\b/);
  const onLeaveToday = matchingRowValue(leaveWidget, /approved|on leave/);
  const attendanceExceptions = attendanceRows
    .filter((row) => /absent|late|not recorded|missing|exception/.test(row.category.toLowerCase()))
    .reduce((sum, row) => sum + row.value, 0);
  const pendingLeave = matchingRowValue(leaveWidget, /pending|awaiting/);

  const summaryCards: SummaryCard[] = [];
  if (headcountWidget) summaryCards.push({
      key: "active-workforce",
      title: "Active Workforce",
      value: formatWidgetValue(matchingRowValue(headcountWidget), headcountWidget),
      supportingText: "Employee records in your permitted company scope",
      source: dashboardProviderLabel(headcountWidget.primary_provider),
      freshness: widgetFreshness(headcountWidget),
      icon: Users,
      tone: "purple",
  });
  if (attendanceWidget) {
    summaryCards.push({
        key: "present-today",
        title: "Present Today",
        value: formatCount(presentToday),
        supportingText: attendanceTotal > 0 ? `${Math.round((presentToday / attendanceTotal) * 100)}% of recorded attendance` : "No attendance has been recorded yet",
        source: dashboardProviderLabel(attendanceWidget.primary_provider),
        freshness: widgetFreshness(attendanceWidget),
        icon: UserCheck,
        tone: "green",
    });
  }
  if (leaveWidget) summaryCards.push({
      key: "on-leave",
      title: "On Leave",
      value: formatCount(onLeaveToday),
      supportingText: pendingLeave > 0 ? `${formatCount(pendingLeave)} pending requests` : "No pending leave requests",
      source: dashboardProviderLabel(leaveWidget.primary_provider),
      freshness: widgetFreshness(leaveWidget),
      icon: CalendarOff,
      tone: "coral",
  });
  if (averageTimeWidget) summaryCards.push({
      key: "average-time",
      title: "Average Working Time",
      value: formatWidgetValue(matchingRowValue(averageTimeWidget), averageTimeWidget),
      supportingText: "Average recorded work time per employee",
      source: dashboardProviderLabel(averageTimeWidget.primary_provider),
      freshness: widgetFreshness(averageTimeWidget),
      icon: Clock3,
      tone: "amber",
  });
  if (payrollWidget) summaryCards.push({
      key: "net-payroll",
      title: "Net Payroll",
      value: formatWidgetValue(matchingRowValue(payrollWidget), payrollWidget),
      supportingText: "Authorised net payroll total",
      source: dashboardProviderLabel(payrollWidget.primary_provider),
      freshness: widgetFreshness(payrollWidget),
      icon: WalletCards,
      tone: "purple",
      restricted: true,
  });

  const saveLayout = useMutation({
    mutationFn: () => insight360Service.saveDashboardLayout({ name: initial.layout.name, items: orderedItems }),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["insight360", "dashboard"], dashboard);
      setItems(dashboard.layout.items);
      setSaved(true);
      setCustomizing(false);
    },
  });
  const resetLayout = useMutation({
    mutationFn: insight360Service.resetDashboardLayout,
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["insight360", "dashboard"], dashboard);
      setItems(dashboard.layout.items);
      setSaved(false);
      setCustomizing(false);
    },
  });
  const refreshWidget = useMutation({
    mutationFn: insight360Service.refreshDashboardWidget,
    onSuccess: (widget: Insight360WidgetData) => {
      queryClient.setQueryData<Insight360Dashboard>(["insight360", "dashboard"], (current) => current ? {
        ...current,
        widgets: current.widgets.map((item) => item.widget_key === widget.widget_key ? widget : item),
      } : current);
    },
  });
  const refreshDashboard = useMutation({
    mutationFn: () => queryClient.invalidateQueries({ queryKey: ["insight360", "dashboard"], exact: true }),
  });

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    setItems((current) => {
      const sorted = [...current].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((item) => item.widget_key === event.active.id);
      const newIndex = sorted.findIndex((item) => item.widget_key === event.over?.id);
      return arrayMove(sorted, oldIndex, newIndex).map((item, order) => ({ ...item, order }));
    });
    setSaved(false);
  }

  function toggleWidget(widgetKey: string) {
    setItems((current) => current.map((item) => item.widget_key === widgetKey ? { ...item, is_visible: !item.is_visible } : item));
    setSaved(false);
  }

  function cancelCustomizing() {
    setItems(initial.layout.items);
    setCustomizing(false);
  }

  const reportingWidgets = visibleWidgets.filter((widget) => widget.data.rows.length > 0).length;
  const coveragePercent = visibleWidgets.length > 0 ? Math.round((reportingWidgets / visibleWidgets.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="relative border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="pr-14 lg:pr-0">
            <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Operational Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Live workforce, attendance, leave and payroll intelligence.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:pr-14">
            <ScopeIndicator companyName={company?.name} />
            <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-brand-100 px-3 text-sm text-brand-800">
              <CalendarClock aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
              <span className="text-gray-600">As at</span>
              <span className="font-semibold text-brand-900">Today</span>
            </span>
            <button
              type="button"
              onClick={() => refreshDashboard.mutate()}
              disabled={refreshDashboard.isPending}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-brand-600 bg-white px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshDashboard.isPending ? "animate-spin motion-reduce:animate-none" : ""}`} />
              <span className="hidden sm:inline">Refresh data</span>
            </button>
            <Sheet open={customizing} onOpenChange={(open) => open ? setCustomizing(true) : cancelCustomizing()}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Customise dashboard"
                  className="absolute right-0 top-0 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
                >
                  <SlidersHorizontal aria-hidden="true" className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent className="w-full border-gray-200 bg-brand-100 p-0 sm:max-w-md" showCloseButton>
                <SheetHeader className="border-b border-gray-200 bg-white px-5 py-5 pr-14">
                  <SheetTitle className="text-xl text-brand-900">Customise dashboard</SheetTitle>
                  <SheetDescription className="leading-6 text-gray-600">
                    Show or hide widgets and drag them into the order that works for you. Your layout is saved for this account and company.
                  </SheetDescription>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-brand-900">Widget visibility and order</h2>
                      <p className="mt-1 text-xs text-gray-500">{visibleItems.length} of {items.length} widgets shown</p>
                    </div>
                    {saved && <span role="status" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check aria-hidden="true" className="h-4 w-4" />Saved</span>}
                  </div>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedItems.map((item) => item.widget_key)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {orderedItems.map((item) => (
                          <SortableVisibilityItem
                            key={item.widget_key}
                            item={item}
                            label={DASHBOARD_ITEM_LABELS[item.widget_key] ?? descriptorMap.get(item.widget_key)?.name ?? widgetMap.get(item.widget_key)?.name ?? item.widget_key}
                            onToggle={() => toggleWidget(item.widget_key)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {(saveLayout.error || resetLayout.error) && (
                    <div className="mt-4"><ErrorPanel message="The dashboard layout could not be updated. Check your permissions and try again." /></div>
                  )}
                  <div className="mt-5 flex gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600">
                    <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    Changes affect only your dashboard and do not change what other users can see.
                  </div>
                </div>

                <SheetFooter className="border-t border-gray-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => saveLayout.mutate()}
                    disabled={saveLayout.isPending || visibleItems.length === 0}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save aria-hidden="true" className="h-4 w-4" />{saveLayout.isPending ? "Saving…" : "Save layout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetLayout.mutate()}
                    disabled={resetLayout.isPending}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50"
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />Reset to default
                  </button>
                  <SheetClose asChild>
                    <button type="button" onClick={cancelCustomizing} className="transition-colors min-h-11 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Cancel</button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-gray-600">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand-700" />
            Showing information available to your assigned company, role and permissions.
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{freshnessSummary(visibleWidgets)}
          </div>
        </div>
      </header>

      {(refreshWidget.error || refreshDashboard.error) && <ErrorPanel message="The dashboard data could not be refreshed. Try again in a moment." />}
      {saved && !customizing && <p role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check aria-hidden="true" className="h-4 w-4" />Your dashboard layout was saved.</p>}

      {summaryCards.length > 0 && (
        <section aria-label="Operational summary">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => <OperationalKpiCard key={card.key} card={card} />)}
          </div>
        </section>
      )}

      {(employmentWidget || attendanceWidget || averageTimeWidget || leaveWidget) && (
        <section aria-label="Workforce insights" className="grid gap-3 xl:grid-cols-2">
          {employmentWidget && (
            <DashboardWidgetCard
              widget={employmentWidget}
              canRefresh={canRefresh}
              refreshing={refreshWidget.isPending && refreshWidget.variables === employmentWidget.widget_key}
              onRefresh={() => refreshWidget.mutate(employmentWidget.widget_key)}
            />
          )}
          {attendanceWidget && (
            <DashboardWidgetCard
              widget={attendanceWidget}
              canRefresh={canRefresh}
              refreshing={refreshWidget.isPending && refreshWidget.variables === attendanceWidget.widget_key}
              onRefresh={() => refreshWidget.mutate(attendanceWidget.widget_key)}
            />
          )}
          {averageTimeWidget && <AverageWorkingTimePanel widget={averageTimeWidget} />}
          {leaveWidget && (
              <DashboardWidgetCard
                widget={leaveWidget}
                canRefresh={canRefresh}
                refreshing={refreshWidget.isPending && refreshWidget.variables === leaveWidget.widget_key}
                onRefresh={() => refreshWidget.mutate(leaveWidget.widget_key)}
              />
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(230px,1fr)] lg:items-start">
        <div aria-labelledby="operational-attention-heading">
          <div className="mb-3 flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="h-5 w-5 text-amber-700" />
            <h2 id="operational-attention-heading" className="text-lg font-bold text-brand-900">Operational attention</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <AttentionCard
              title="Attendance exceptions"
              value={formatCount(attendanceExceptions)}
              description="Absent, late or unrecorded attendance entries in the current dashboard data."
              href="/insight360/catalogue?q=attendance"
              action="Review exceptions"
              icon={TriangleAlert}
              tone="amber"
            />
            <AttentionCard
              title="Pending leave approvals"
              value={formatCount(pendingLeave)}
              description="Leave requests still waiting in the workflow status data available to you."
              href="/insight360/catalogue?q=leave"
              action="Review requests"
              icon={CalendarOff}
              tone="coral"
            />
            <AttentionCard
              title="Dashboard coverage"
              value={`${coveragePercent}%`}
              description={`${reportingWidgets} of ${visibleWidgets.length} visible widgets currently contain reportable records.`}
              href="/insight360/catalogue"
              action="View data coverage"
              icon={DatabaseZap}
              tone="purple"
            />
          </div>
        </div>
        <WidgetStatesPanel attendanceWidget={attendanceWidget} payrollWidget={payrollWidget} />
      </section>
    </div>
  );
}

export default function Insight360DashboardPage() {
  const dashboard = useQuery({ queryKey: ["insight360", "dashboard"], queryFn: insight360Service.dashboard });

  if (dashboard.isLoading) return <div className="min-h-[60vh] bg-brand-100 p-4 sm:p-6"><LoadingPanel label="Preparing your operational dashboard" /></div>;
  if (dashboard.error || !dashboard.data) return <div className="min-h-[60vh] bg-brand-100 p-4 sm:p-6"><ErrorPanel message="Your dashboard is unavailable or you do not have dashboard access." /></div>;

  const workspaceKey = `${dashboard.data.layout.uuid ?? "default"}:${dashboard.data.layout.items.map((item) => `${item.widget_key}-${item.order}-${item.is_visible}`).join("|")}`;

  return (
    <div className="min-h-full bg-white">
      <DashboardWorkspace key={workspaceKey} initial={dashboard.data} />
    </div>
  );
}
