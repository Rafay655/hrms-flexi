'use client';

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  FileWarning,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Hooks ──────────────────────────────────────────────────
import { useComplianceDashboard } from '@/hooks/useComplianceDashboard';

// ── Types (already defined, but we'll keep them) ─────────
interface DashboardSummary {
  health_score: number;
  health_status: 'good' | 'warning' | 'critical';
  active_tax_year: {
    label: string;
    end_date: string;
  } | null;
  pending_remittances: {
    eobi: number;
    ss: number;
    fbr: number;
    wwf: number;
    wppf: number;
  };
  min_wage_violations: number;
  missing_statutory_profiles: number;
  province_employer_cost: Record<
    string,
    { eobi: number; ss: number; pf: number; gratuity: number; total: number }
  >;
  upcoming_deadlines: Array<{
    id: string;
    name: string;
    due_date: string;
    days_left: number;
  }>;
  certificates_pending: number;
}

interface ComplianceAreaSummary {
  compliance_area: string;
  current_status: 'compliant' | 'pending' | 'overdue';
  pending_count: number;
  amount_pending: number;
  overdue_count: number;
  last_updated: string;
  action?: string;
}

interface DashboardFilters {
  entity_id?: string;
  tax_year_id?: string;
  payroll_month?: string;
  province?: string;
  areas?: string[];
}


const AREA_COLOR: Record<string, string> = {
  'Eobi employee': '#322E53',
  'Social security employer': '#3F8F6F',
  'Income tax': '#A13A2C',
  // Add more as needed
};
const FONT_SERIF = "'Fraunces', ui-serif, Georgia, serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

// ── Dummy data for filters ──────────────────────────────
const dummyEntities = [
  { id: '1', name: 'Flexi HRMS (Pvt) Ltd.' },
  { id: '2', name: 'MEPCO' },
];
const dummyTaxYears = [
  { id: '8875cbbe-2de4-4181-863f-9ba433de33b1', label: 'FY 2027-28' },
  { id: 'f71b7e3e-c418-4eeb-9d1a-57531dd28391', label: 'FY 2026-27' },
];
const dummyProvinces = [
  { value: 'punjab', label: 'Punjab' },
  { value: 'sindh', label: 'Sindh' },
  { value: 'kpk', label: 'KPK' },
  { value: 'balochistan', label: 'Balochistan' },
  { value: 'ict', label: 'ICT' },
];
const ALL_AREAS = ['Eobi employee', 'Social security employer', 'Income tax'];
const COLOR = {
  paper: 'var(--brand-100)',
  paperDim: 'var(--brand-200?)', // not defined, we keep fallback
  ink: 'var(--brand-900)',
  inkSoft: 'var(--brand-700)',
  line: 'var(--brand-200?)',
  card: '#FFFFFF',
  brass: 'var(--brand-500)',
  brassDeep: 'var(--brand-800)',
  brassSoft: 'var(--brand-300)',
  good: '#3F8F6F',
  goodBg: '#E3F1EA',
  warn: '#B15B3F',
  warnBg: '#FBE9E4',
  bad: '#A13A2C',
  badBg: '#F7E1DC',
  muted: '#8783A0',
} as const;
// ── Helpers ──────────────────────────────────────────────
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}
function pkr(n: number) {
  return 'PKR ' + n.toLocaleString('en-US');
}
function statusPalette(status: string) {
  const s = status.toLowerCase();
  if (s === 'good' || s === 'compliant') return { fg: COLOR.good, bg: COLOR.goodBg };
  if (s === 'warning' || s === 'pending') return { fg: COLOR.warn, bg: COLOR.warnBg };
  return { fg: COLOR.bad, bg: COLOR.badBg };
}

// ── Count-up hook ──────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    function step(ts: number) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ── Reveal wrapper ──────────────────────────────────────
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={cn('animate-[fadeUp_620ms_cubic-bezier(0.16,0.8,0.3,1)_both]', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────
function StatChip({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'ink',
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  tone?: 'ink' | 'good' | 'warn' | 'bad';
}) {
  const count = useCountUp(value);
  const toneColor =
    tone === 'bad' ? COLOR.bad : tone === 'warn' ? COLOR.warn : tone === 'good' ? COLOR.good : COLOR.ink;
  return (
    <div
      className="rounded-2xl border bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: COLOR.line }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: COLOR.paperDim, color: toneColor }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <span className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
          {label}
        </span>
      </div>
      <div className="mt-1.5 text-[28px] font-semibold leading-tight" style={{ fontFamily: FONT_MONO, color: COLOR.ink }}>
        {count}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs" style={{ color: COLOR.muted }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export default function ComplianceDashboard() {
  const { data: apiData, isLoading, error, refetch } = useComplianceDashboard();

  // ── Filters (for UI, but API doesn't support filters yet) ──
  const [filters, setFilters] = useState<DashboardFilters>({
    entity_id: undefined,
    tax_year_id: undefined,
    payroll_month: '',
    province: undefined,
    areas: [],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Dashboard refreshed');
    } catch (err) {
      showApiError(err, { fallbackMessage: 'Failed to refresh dashboard' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Map API data to DashboardSummary ──────────────────
  const summary = useMemo<DashboardSummary | null>(() => {
    if (!apiData) return null;

    // Map health status based on compliance_seal
    let health_status: 'good' | 'warning' | 'critical' = 'warning';
    if (apiData.compliance_seal >= 80) health_status = 'good';
    else if (apiData.compliance_seal >= 60) health_status = 'warning';
    else health_status = 'critical';

    // pending_remittances: we only have a total number, so we distribute among funds (or show a single entry)
    // Since the API doesn't break down by fund, we'll put the total under 'eobi' for display.
    const totalPending = apiData.metrics.pending_remittances;
    const pendingRemittances = {
      eobi: totalPending,
      ss: 0,
      fbr: 0,
      wwf: 0,
      wppf: 0,
    };

    // upcoming_deadlines: map to required format
    const upcomingDeadlines = apiData.upcoming_deadlines.map((d, index) => ({
      id: `deadline-${index}`,
      name: d.name,
      due_date: d.date,
      days_left: d.status === 'overdue' ? -1 : d.status === 'today' ? 0 : 5, // we don't have actual days left, but we can compute from date
    }));

    // We don't have province_employer_cost, so we provide an empty object.
    // We could optionally use area_status to create some breakdown.
    const provinceEmployerCost = {};

    return {
      health_score: apiData.compliance_seal,
      health_status,
      active_tax_year: apiData.active_tax_year ? {
        label: apiData.active_tax_year.label,
        end_date: apiData.active_tax_year.closes_on,
      } : null,
      pending_remittances: pendingRemittances,
      min_wage_violations: apiData.metrics.min_wage_violations,
      missing_statutory_profiles: apiData.metrics.missing_profiles,
      province_employer_cost: provinceEmployerCost,
      upcoming_deadlines: upcomingDeadlines,
      certificates_pending: apiData.metrics.certificates_pending,
    };
  }, [apiData]);

  // ── Map area_status to ComplianceAreaSummary ──────────
  const areas = useMemo<ComplianceAreaSummary[]>(() => {
    if (!apiData) return [];
    return apiData.area_status.map((area) => {
      // Determine status mapping
      let current_status: 'compliant' | 'pending' | 'overdue' = 'compliant';
      const statusLower = area.status.toLowerCase();
      if (statusLower === 'pending') current_status = 'pending';
      else if (statusLower === 'overdue' || statusLower === 'late') current_status = 'overdue';

      return {
        compliance_area: area.area,
        current_status,
        pending_count: area.pending,
        amount_pending: area.amount,
        overdue_count: area.status.toLowerCase() === 'overdue' ? 1 : 0, // approximate
        last_updated: area.updated || new Date().toISOString(),
        action: undefined, // no action provided
      };
    });
  }, [apiData]);

  // ── Charts data ──────────────────────────────────────
  const gaugeData = summary ? [{ value: summary.health_score, fill: summary.health_score >= 80 ? COLOR.good : summary.health_score >= 60 ? COLOR.warn : COLOR.bad }] : [];
  const displayedScore = useCountUp(summary ? summary.health_score : 0, 1100);
  const totalRemittances = summary ? Object.values(summary.pending_remittances).reduce((a, b) => a + b, 0) : 0;

  // ── Donut chart: pending by fund ──────────────────────
  const remittanceDonut = useMemo(() => {
    if (!summary) return [];
    const labels: Record<string, string> = { eobi: 'EOBI', ss: 'Social Security', fbr: 'FBR Tax', wwf: 'WWF', wppf: 'WPPF' };
    return Object.entries(summary.pending_remittances)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: labels[k], value: v, color: AREA_COLOR[labels[k]] || COLOR.brass }));
  }, [summary]);

  // ── Bar chart: province cost (we don't have data, so we show a placeholder) ──
  const provinceBars = useMemo(() => {
    // If we have province_employer_cost, use it, else show empty
    if (summary && Object.keys(summary.province_employer_cost).length > 0) {
      return Object.entries(summary.province_employer_cost)
        .map(([k, v]) => ({ province: k.charAt(0).toUpperCase() + k.slice(1), total: v.total }))
        .sort((a, b) => b.total - a.total);
    }
    // Fallback: show some dummy data if needed
    return [];
  }, [summary]);

  const totalProvinceCost = summary
    ? Object.values(summary.province_employer_cost).reduce((s, p) => s + p.total, 0)
    : 0;

  // ── Loading / Error ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-full p-6" style={{ background: COLOR.paper }}>
        <div className="mx-auto max-w-[1180px] animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 rounded-md bg-black/10" />
              <div className="mt-2 h-4 w-64 rounded-md bg-black/5" />
            </div>
            <div className="h-10 w-28 rounded-lg bg-black/10" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 w-full rounded-2xl bg-black/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6" style={{ background: COLOR.paper }}>
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-semibold" style={{ color: COLOR.ink }}>Failed to load dashboard</p>
          <p className="text-sm" style={{ color: COLOR.muted }}>{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4" style={{ background: COLOR.brass, color: COLOR.ink }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6" style={{ background: COLOR.paper }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: COLOR.ink }}>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ color: COLOR.ink }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bar-fill {
          transition: width 700ms cubic-bezier(0.16, 0.8, 0.3, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1180px] px-6 pb-16 pt-8">
        {/* Header */}
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: COLOR.brass }} />
                <span className="text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: COLOR.brassDeep }}>
                  Statutory Compliance
                </span>
              </div>
              <h1 className="text-[34px] font-semibold tracking-tight" style={{ fontFamily: FONT_SERIF }}>
                Compliance Dashboard
              </h1>
              <p className="mt-1.5 max-w-[480px] text-sm" style={{ color: COLOR.inkSoft }}>
                Payroll, EOBI, Social Security, FBR and welfare-fund standing across your organization.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 rounded-lg font-semibold transition-transform duration-150 hover:-translate-y-0.5 hover:brightness-95"
              style={{ background: COLOR.brass, color: COLOR.ink }}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          </div>
        </Reveal>

        {/* Filters (keep as UI only, no functionality) */}
        <Reveal delay={60}>
          <div
            className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border bg-white p-4 transition-shadow duration-200 hover:shadow-md md:grid-cols-3 lg:grid-cols-5"
            style={{ borderColor: COLOR.line }}
          >
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                Legal Entity
              </Label>
              <Select value={filters.entity_id || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, entity_id: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {dummyEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                Tax Year
              </Label>
              <Select value={filters.tax_year_id || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, tax_year_id: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {dummyTaxYears.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                Payroll Month
              </Label>
              <Input
                type="month"
                value={filters.payroll_month || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, payroll_month: e.target.value || undefined }))}
                className="mt-1.5 w-full"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                Province
              </Label>
              <Select value={filters.province || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, province: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {dummyProvinces.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                Compliance Area
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="mt-1.5 w-full justify-start font-normal">
                    <span className="truncate">
                      {filters.areas && filters.areas.length > 0 ? filters.areas.join(', ') : 'All Areas'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, areas: undefined }))}>
                    All Areas
                  </DropdownMenuItem>
                  {ALL_AREAS.map((area) => (
                    <DropdownMenuItem
                      key={area}
                      className="cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => {
                        const current = filters.areas || [];
                        const updated = current.includes(area) ? current.filter(a => a !== area) : [...current, area];
                        setFilters(prev => ({ ...prev, areas: updated.length > 0 ? updated : undefined }));
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-[4px] border"
                          style={{
                            background: (filters.areas || []).includes(area) ? AREA_COLOR[area] : 'transparent',
                            borderColor: (filters.areas || []).includes(area) ? AREA_COLOR[area] : COLOR.line,
                          }}
                        />
                        {area}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Reveal>

        {/* Hero row: gauge + stat chips */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(220px,320px)_1fr]">
          <Reveal delay={100}>
            <div
              className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[20px] p-6 transition-transform duration-200 hover:-translate-y-1"
              style={{ background: COLOR.ink }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 20%, ${COLOR.brassSoft}22, transparent 60%)` }}
              />
              <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C9C2AC]">
                Compliance Seal
              </span>
              <div className="relative h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="76%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270} barSize={14}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background={{ fill: 'rgba(255,255,255,0.08)' }}
                      dataKey="value"
                      cornerRadius={20}
                      animationDuration={1100}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[42px] font-semibold leading-none text-white" style={{ fontFamily: FONT_MONO }}>
                    {displayedScore}
                  </span>
                  <span className="mt-0.5 text-[11px] text-gray-400">out of 100</span>
                </div>
              </div>
              <span
                className="mt-1.5 rounded-full px-3.5 py-1 text-xs font-semibold capitalize"
                style={{ background: statusPalette(summary.health_status).bg, color: statusPalette(summary.health_status).fg }}
              >
                {summary.health_status}
              </span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <Reveal delay={140}>
              <StatChip
                icon={Landmark}
                label="Pending Remittances"
                value={totalRemittances}
                sub={totalRemittances === 0 ? 'All clear' : `${remittanceDonut.length} fund${remittanceDonut.length === 1 ? '' : 's'} open`}
                tone={totalRemittances > 5 ? 'bad' : totalRemittances > 0 ? 'warn' : 'good'}
              />
            </Reveal>
            <Reveal delay={180}>
              <StatChip
                icon={AlertTriangle}
                label="Min Wage Violations"
                value={summary.min_wage_violations}
                sub={summary.min_wage_violations > 0 ? 'Needs review' : 'All compliant'}
                tone={summary.min_wage_violations > 0 ? 'bad' : 'good'}
              />
            </Reveal>
            <Reveal delay={220}>
              <StatChip
                icon={Users}
                label="Missing Profiles"
                value={summary.missing_statutory_profiles}
                sub="NTN / EOBI / SS / Province"
                tone={summary.missing_statutory_profiles > 0 ? 'warn' : 'good'}
              />
            </Reveal>
            <Reveal delay={260}>
              <StatChip
                icon={FileWarning}
                label="Certificates Pending"
                value={summary.certificates_pending}
                sub="Annual tax certificates"
                tone={summary.certificates_pending > 0 ? 'warn' : 'good'}
              />
            </Reveal>

            <Reveal delay={300} className="sm:col-span-2 xl:col-span-4">
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: COLOR.line }}
              >
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                    Active Tax Year
                  </div>
                  <div className="mt-1 text-xl font-semibold" style={{ fontFamily: FONT_SERIF }}>
                    {summary.active_tax_year ? summary.active_tax_year.label : 'No active tax year'}
                  </div>
                </div>
                {summary.active_tax_year && (
                  <div className="text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                      Closes
                    </div>
                    <div className="text-[15px] font-semibold" style={{ fontFamily: FONT_MONO, color: COLOR.brassDeep }}>
                      {fmtDate(summary.active_tax_year.end_date)}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Charts row */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(300px,1.4fr)]">
          {/* Donut: remittances by fund */}
          <Reveal delay={120}>
            <div
              className="h-full rounded-[18px] border bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderColor: COLOR.line }}
            >
              <div className="text-[17px] font-semibold" style={{ fontFamily: FONT_SERIF }}>
                Pending by Fund
              </div>
              <div className="mb-2 text-[12.5px]" style={{ color: COLOR.muted }}>
                Open remittance items across statutory funds
              </div>
              {remittanceDonut.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-[13.5px] font-semibold" style={{ color: COLOR.good }}>
                  <CheckCircle2 size={26} />
                  All remittances are clear
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-[150px] w-[150px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={remittanceDonut}
                          dataKey="value"
                          nameKey="name" 
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={3}
                          animationDuration={800}
                        >
                          {remittanceDonut.map((d, i) => (
                            <Cell key={i} fill={d.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: `1px solid ${COLOR.line}`, fontSize: 12.5 }}
                          formatter={(v: any, n: any) => [`${v} pending`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {remittanceDonut.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-semibold" style={{ fontFamily: FONT_MONO }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Bar: province cost */}
          <Reveal delay={160}>
            <div
              className="h-full rounded-[18px] border bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderColor: COLOR.line }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[17px] font-semibold" style={{ fontFamily: FONT_SERIF }}>
                    Employer Cost by Province
                  </div>
                  <div className="text-[12.5px]" style={{ color: COLOR.muted }}>
                    EOBI + SS + PF + gratuity, monthly
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR.muted }}>
                    Total
                  </div>
                  <div className="text-[15px] font-semibold" style={{ fontFamily: FONT_MONO, color: COLOR.brassDeep }}>
                    {pkr(totalProvinceCost)}
                  </div>
                </div>
              </div>
              <div className="mt-1.5 h-[190px] w-full">
                {provinceBars.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm" style={{ color: COLOR.muted }}>
                    No province cost data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={provinceBars} layout="vertical" margin={{ left: 4, right: 20, top: 8, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={COLOR.line} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="province"
                        width={80}
                        tick={{ fontSize: 12.5, fill: COLOR.inkSoft }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: COLOR.paperDim }}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${COLOR.line}`, fontSize: 12.5 }}
                        formatter={(v: any) => [pkr(v as number), 'Employer cost']}
                      />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]} animationDuration={800}>
                        {provinceBars.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? COLOR.brass : COLOR.brassSoft} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Deadlines timeline */}
        <Reveal delay={180}>
          <div
            className="mb-5 rounded-[18px] border bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: COLOR.line }}
          >
            <div className="text-[17px] font-semibold" style={{ fontFamily: FONT_SERIF }}>
              Upcoming Deadlines
            </div>
            <div className="mb-3.5 text-[12.5px]" style={{ color: COLOR.muted }}>
              {summary.upcoming_deadlines.length} filings on the calendar
            </div>
            <div className="flex flex-col gap-2.5">
              {summary.upcoming_deadlines.map((d) => {
                // Compute days_left from date
                const dueDate = new Date(d.due_date);
                const today = new Date();
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const overdue = diffDays < 0;
                const urgent = diffDays >= 0 && diffDays <= 5;
                const tone = overdue ? COLOR.bad : urgent ? COLOR.warn : COLOR.good;
                const toneBg = overdue ? COLOR.badBg : urgent ? COLOR.warnBg : COLOR.goodBg;
                const widthPct = overdue ? 100 : Math.max(6, 100 - Math.min(diffDays, 30) * 3.2);
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3.5 rounded-lg px-2.5 py-2 transition-colors duration-150 hover:bg-black/[0.03]"
                  >
                    <Clock size={16} color={tone} className="shrink-0" />
                    <div className="w-[170px] shrink-0 text-[13.5px] font-semibold">{d.name}</div>
                    <div className="w-[100px] shrink-0 text-xs" style={{ color: COLOR.muted }}>
                      {fmtDate(d.due_date, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: COLOR.paperDim }}>
                      <div className="bar-fill h-full rounded-full" style={{ width: `${widthPct}%`, background: tone }} />
                    </div>
                    <span
                      className="min-w-[76px] shrink-0 rounded-full px-2.5 py-1 text-center text-[11.5px] font-bold"
                      style={{ background: toneBg, color: tone }}
                    >
                      {overdue ? `${Math.abs(diffDays)}d overdue` : `${diffDays}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Compliance area table */}
        <Reveal delay={220}>
          <div className="rounded-[18px] border bg-white p-5" style={{ borderColor: COLOR.line }}>
            <div className="text-[17px] font-semibold" style={{ fontFamily: FONT_SERIF }}>
              Compliance Area Status
            </div>
            <div className="mb-3.5 text-[12.5px]" style={{ color: COLOR.muted }}>
              Detailed standing of each statutory area
            </div>
            {areas.length === 0 ? (
              <div className="py-10 text-center text-[13.5px]" style={{ color: COLOR.muted }}>
                No compliance areas to display.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                      {['Area', 'Status', 'Pending', 'Amount', 'Overdue', 'Updated', ''].map((h, i) => (
                        <th
                          key={h + i}
                          className={cn(
                            'px-2.5 py-2.5 text-[11px] font-bold uppercase tracking-wide',
                            i === 3 ? 'text-right' : i >= 2 && i <= 4 ? 'text-center' : 'text-left'
                          )}
                          style={{ color: COLOR.muted }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map((area) => {
                      const pal = statusPalette(area.current_status);
                      return (
                        <tr
                          key={area.compliance_area}
                          className="transition-colors duration-150 hover:bg-black/[0.03]"
                          style={{ borderBottom: `1px solid ${COLOR.line}` }}
                        >
                          <td className="flex items-center gap-2 px-2.5 py-3 font-semibold">
                            <span
                              className="inline-block h-4 w-[3px] rounded-[3px]"
                              style={{ background: AREA_COLOR[area.compliance_area] || COLOR.brass }}
                            />
                            {area.compliance_area}
                          </td>
                          <td className="px-2.5 py-3">
                            <span
                              className="rounded-full px-2.5 py-1 text-[11.5px] font-bold capitalize"
                              style={{ background: pal.bg, color: pal.fg }}
                            >
                              {area.current_status}
                            </span>
                          </td>
                          <td className="px-2.5 py-3 text-center" style={{ fontFamily: FONT_MONO }}>
                            {area.pending_count}
                          </td>
                          <td className="px-2.5 py-3 text-right" style={{ fontFamily: FONT_MONO }}>
                            {pkr(area.amount_pending)}
                          </td>
                          <td
                            className={cn('px-2.5 py-3 text-center', area.overdue_count > 0 && 'font-bold')}
                            style={{ fontFamily: FONT_MONO, color: area.overdue_count > 0 ? COLOR.bad : COLOR.inkSoft }}
                          >
                            {area.overdue_count}
                          </td>
                          <td className="px-2.5 py-3 text-[12.5px]" style={{ color: COLOR.muted }}>
                            {fmtDate(area.last_updated)}
                          </td>
                          <td className="px-2.5 py-3 text-right">
                            {area.action ? (
                              <a
                                href={area.action}
                                className="text-[12.5px] font-semibold no-underline"
                                style={{ color: COLOR.brassDeep }}
                              >
                                View →
                              </a>
                            ) : (
                              <span style={{ color: COLOR.muted }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
