"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  HeartPulse,
  Coffee,
  Zap,
  Info,
  History,
  ExternalLink,
  Clock,
  Plus,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveType } from "../types";
import { ApplyLeaveWizard } from "@/components/ApplyLeaveWizard";

interface Balance {
  type: LeaveType | string;
  total: number | "∞";
  used: number;
  remaining: number | "∞";
  earned: number;
  expiring?: { days: number; date: string };
  carryForward?: number;
  isHours?: boolean;
}

interface LedgerEntry {
  id: string;
  date: string;
  label: string;
  qty: string;
  positive?: boolean;
}

const MOCK_BALANCES: Balance[] = [
  {
    type: LeaveType.ANNUAL,
    total: 24,
    used: 8,
    remaining: 16,
    earned: 24,
    carryForward: 4,
    expiring: { days: 2, date: "Mar 31" },
  },
  { type: LeaveType.CASUAL, total: 10, used: 3, remaining: 7, earned: 10 },
  { type: LeaveType.SICK, total: 12, used: 11, remaining: 1, earned: 12 },
  { type: "Comp-Off", total: 2, used: 0, remaining: 2, earned: 2 },
  { type: LeaveType.UNPAID, total: "∞", used: 5, remaining: "∞", earned: 0 },
  { type: "Short Leave", total: 20, used: 4, remaining: 16, earned: 20, isHours: true },
];

const LEDGER_MAP: Record<string, LedgerEntry[]> = {
  [LeaveType.ANNUAL]: [
    { id: "annual-1", date: "Jan 15, 2024", label: "Annual Leave Taken", qty: "-2.0", positive: false },
    { id: "annual-2", date: "Jan 01, 2024", label: "Monthly Accrual", qty: "+2.0", positive: true },
    { id: "annual-3", date: "Dec 15, 2023", label: "Yearly Carry Over", qty: "+4.0", positive: true },
  ],
  [LeaveType.CASUAL]: [
    { id: "casual-1", date: "Feb 10, 2024", label: "Casual Leave Taken", qty: "-1.0", positive: false },
    { id: "casual-2", date: "Jan 01, 2024", label: "Yearly Allocation", qty: "+10.0", positive: true },
    { id: "casual-3", date: "Dec 01, 2023", label: "Adjustment", qty: "+1.0", positive: true },
  ],
  [LeaveType.SICK]: [
    { id: "sick-1", date: "Mar 04, 2024", label: "Sick Leave Taken", qty: "-1.0", positive: false },
    { id: "sick-2", date: "Feb 11, 2024", label: "Sick Leave Taken", qty: "-2.0", positive: false },
    { id: "sick-3", date: "Jan 01, 2024", label: "Yearly Allocation", qty: "+12.0", positive: true },
  ],
  "Comp-Off": [
    { id: "comp-1", date: "Mar 10, 2024", label: "Weekend Support Credit", qty: "+1.0", positive: true },
    { id: "comp-2", date: "Feb 18, 2024", label: "Release Deployment Credit", qty: "+1.0", positive: true },
    { id: "comp-3", date: "Jan 28, 2024", label: "Redeemed", qty: "-0.0", positive: false },
  ],
  [LeaveType.UNPAID]: [
    { id: "unpaid-1", date: "Feb 01, 2024", label: "Unpaid Leave Taken", qty: "-2.0", positive: false },
    { id: "unpaid-2", date: "Jan 12, 2024", label: "Unpaid Leave Taken", qty: "-1.0", positive: false },
    { id: "unpaid-3", date: "Dec 19, 2023", label: "Unpaid Leave Taken", qty: "-2.0", positive: false },
  ],
  "Short Leave": [
    { id: "short-1", date: "Mar 20, 2024", label: "Short Leave Used", qty: "-2.0", positive: false },
    { id: "short-2", date: "Feb 01, 2024", label: "Yearly Allocation", qty: "+20.0", positive: true },
    { id: "short-3", date: "Jan 03, 2024", label: "Balance Adjustment", qty: "+2.0", positive: true },
  ],
};

function getIcon(type: string) {
  switch (type) {
    case LeaveType.ANNUAL:
      return <Calendar className="h-5 w-5 text-brand-900" />;
    case LeaveType.SICK:
      return <HeartPulse className="h-5 w-5 text-rose-500" />;
    case LeaveType.CASUAL:
      return <Coffee className="h-5 w-5 text-amber-500" />;
    case "Comp-Off":
      return <Zap className="h-5 w-5 text-violet-500" />;
    case "Short Leave":
      return <Clock className="h-5 w-5 text-sky-500" />;
    default:
      return <Info className="h-5 w-5 text-slate-400" />;
  }
}

function getBalanceMeta(balance: Balance) {
  const isZero = balance.remaining === 0;
  const isLow =
    typeof balance.remaining === "number" && balance.remaining < 3 && balance.remaining > 0;
  const isInfinite = balance.total === "∞";

  if (isZero) {
    return {
      isZero,
      isLow,
      isInfinite,
      cardClass:
        "border-slate-200 bg-slate-50/80 text-slate-500",
      ringColor: "#CBD5E1",
      badge: "Exhausted",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  if (isLow) {
    return {
      isZero,
      isLow,
      isInfinite,
      cardClass:
        "border-amber-200 bg-amber-50/60 shadow-sm hover:shadow-md",
      ringColor: "#C89B5A",
      badge: "Low Balance",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  return {
    isZero,
    isLow,
    isInfinite,
    cardClass:
      "border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1",
    ringColor: "#1E1D38",
    badge: "Available",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

function CircularUsage({
  percentage,
  ringColor,
  remainingLabel,
}: {
  percentage: number;
  ringColor: string;
  remainingLabel: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const dashoffset = circumference - (circumference * safePercentage) / 100;

  return (
    <div className="relative h-16 w-16">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-700">
        {remainingLabel}
      </div>
    </div>
  );
}

function LedgerDialog({
  open,
  onOpenChange,
  balance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: Balance | null;
}) {
  if (!balance) return null;

  const unit = balance.isHours ? "h" : "d";
  const ledger = LEDGER_MAP[balance.type] ?? [];
  const meta = getBalanceMeta(balance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-gray-200 bg-white p-0 shadow-2xl">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="border-b border-white/10 bg-gradient-to-br from-[#1E1D38] via-[#3A3662] to-[#6E5A9E] px-6 py-6 text-white">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-3xl" />
            <DialogHeader className="relative z-10 space-y-2 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  {getIcon(balance.type)}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">
                    {balance.type} Ledger
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/70">
                    Review recent transactions, carry forward, and available balance.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="relative z-10 mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Remaining
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {balance.remaining}
                  <span className="ml-1 text-sm font-medium text-white/60">{unit}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Used
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {balance.used}
                  <span className="ml-1 text-sm font-medium text-white/60">{unit}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Status
                </p>
                <div className="mt-3">
                  <Badge className={meta.badgeClass}>{meta.badge}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Earned
                </p>
                <p className="mt-2 text-lg font-bold text-brand-900">
                  {balance.earned}
                  <span className="ml-1 text-sm text-gray-500">{unit}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Total
                </p>
                <p className="mt-2 text-lg font-bold text-brand-900">
                  {balance.total}
                  <span className="ml-1 text-sm text-gray-500">{unit}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Carry Forward
                </p>
                <p className="mt-2 text-lg font-bold text-brand-900">
                  {balance.carryForward ?? 0}
                  <span className="ml-1 text-sm text-gray-500">{unit}</span>
                </p>
              </div>
            </div>

            {balance.expiring && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Expiry Alert</p>
                  <p className="text-sm text-amber-700">
                    {balance.expiring.days}
                    {unit} will expire on {balance.expiring.date}.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <h4 className="text-sm font-semibold text-brand-900">Recent Transactions</h4>
                <p className="mt-1 text-xs text-gray-500">Latest balance movements for this leave type.</p>
              </div>

              <div className="divide-y divide-gray-100">
                {ledger.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{entry.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{entry.date}</p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        entry.positive ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {entry.qty} {unit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                Export Ledger
              </Button>
              <Button className="bg-gradient-to-r from-[#443763] to-[#6E5A9E] text-white hover:opacity-95">
                Apply {balance.type}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BalanceCard({
  balance,
  onOpenWizard,
  onOpenLedger,
}: {
  balance: Balance;
  onOpenWizard: (leaveType: string) => void;
  onOpenLedger: (balance: Balance) => void;
}) {
  const unit = balance.isHours ? "h" : "d";
  const meta = getBalanceMeta(balance);

  const percentage =
    typeof balance.total === "number" && balance.total > 0
      ? Math.min(100, (balance.used / balance.total) * 100)
      : 0;

  const remainingPercentLabel =
    balance.total === "∞" ? "∞" : `${Math.max(0, Math.round(100 - percentage))}%`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${meta.cardClass}`}
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 border border-gray-200">
              {getIcon(balance.type)}
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{balance.type}</h4>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Leave Balance
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={meta.badgeClass}>{meta.badge}</Badge>
            {balance.expiring && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                {balance.expiring.days}
                {unit} expires {balance.expiring.date}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold tracking-tight text-brand-900">
                {balance.remaining}
              </span>
              <span className="pb-1 text-sm font-medium text-gray-400">{unit}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Available
            </p>
          </div>

          <CircularUsage
            percentage={100 - percentage}
            ringColor={meta.ringColor}
            remainingLabel={remainingPercentLabel}
          />
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Earned
            </p>
            <p className="mt-1 text-sm font-bold text-gray-800">
              {balance.earned}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Used
            </p>
            <p className="mt-1 text-sm font-bold text-gray-800">
              {balance.used}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Total
            </p>
            <p className="mt-1 text-sm font-bold text-gray-800">
              {balance.total}
              {unit}
            </p>
          </div>
        </div>

        {typeof balance.carryForward === "number" && balance.carryForward > 0 && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-[12px] font-medium text-violet-700">
            <History className="h-3.5 w-3.5" />
            Includes {balance.carryForward}
            {unit} carry forward
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenLedger(balance)}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-brand-900"
          >
            View Ledger
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <Button
            type="button"
            disabled={meta.isZero}
            onClick={() => onOpenWizard(balance.type)}
            className="rounded-xl bg-gradient-to-r from-[#443763] to-[#6E5A9E] px-4 text-xs font-semibold text-white shadow-md shadow-[#443763]/20 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyBalances() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("Annual Leave");
  const [year, setYear] = useState("2024");
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [activeBalance, setActiveBalance] = useState<Balance | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const totals = useMemo(() => {
    const totalAvailable = MOCK_BALANCES.reduce((sum, item) => {
      if (typeof item.remaining === "number" && !item.isHours) return sum + item.remaining;
      return sum;
    }, 0);

    const pendingRequests = 3;
    const lowBalances = MOCK_BALANCES.filter(
      (item) => typeof item.remaining === "number" && item.remaining > 0 && item.remaining < 3
    ).length;

    return {
      totalAvailable,
      pendingRequests,
      lowBalances,
    };
  }, []);

  const handleApplyClick = () => {
    setSelectedLeaveType("Annual Leave");
    setIsWizardOpen(true);
  };

  const handleCardApplyClick = (leaveType: string) => {
    setSelectedLeaveType(leaveType);
    setIsWizardOpen(true);
  };

  const handleWizardSubmit = (formData: any) => {
    console.log("Leave application submitted:", formData);
    setIsWizardOpen(false);
    setShowSuccess(true);

    window.setTimeout(() => {
      setShowSuccess(false);
    }, 2400);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const openLedger = (balance: Balance) => {
    setActiveBalance(balance);
    setLedgerOpen(true);
  };

  return (
    <>
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8"
        style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-7xl space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
                My Leave Balances
              </h2>
              <p className="text-sm text-brand-700 md:text-base">
                Overview of your current entitlements, available balance, and recent activity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:ring-2 focus:ring-brand-200 hover:border-gray-300"
              >
                <option value="2024">Year 2024</option>
                <option value="2023">Year 2023</option>
              </select>

              <Button
                onClick={handleApplyClick}
                className="rounded-xl bg-gradient-to-r from-[#443763] to-[#6E5A9E] px-5 py-2.5 font-semibold text-white shadow-md shadow-[#443763]/20 transition-all hover:shadow-lg hover:shadow-[#443763]/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                Apply Leave
              </Button>
            </div>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
              >
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  Leave application submitted successfully.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Cards Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {MOCK_BALANCES.map((balance) => (
                  <BalanceCard
                    key={String(balance.type)}
                    balance={balance}
                    onOpenWizard={handleCardApplyClick}
                    onOpenLedger={openLedger}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1D38] via-[#3A3662] to-[#6E5A9E] p-7 text-white shadow-xl"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                      Total Available
                    </p>
                    <h3 className="mt-2 text-5xl font-bold tracking-tight">
                      {totals.totalAvailable}
                      <span className="ml-2 text-xl font-medium text-white/50">Days</span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/15">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                        Next Approved Leave
                      </p>
                      <p className="mt-1 text-base font-semibold">Feb 10, 2024</p>
                      <p className="text-xs text-white/45">Casual Leave · 2 Days</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/15">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                        Pending Requests
                      </p>
                      <p className="mt-1 text-base font-semibold">{totals.pendingRequests} Applications</p>
                      <p className="text-xs text-white/45">Awaiting manager approval</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/15">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                        Low Balances
                      </p>
                      <p className="mt-1 text-base font-semibold">{totals.lowBalances} Leave Types</p>
                      <p className="text-xs text-white/45">Review before planning long leave</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-brand-900">
                  <Plus className="h-4 w-4 text-brand-800" />
                  Quick Links
                </h4>

                <div className="space-y-2">
                  {[
                    { label: "Leave Policy Guide", icon: ExternalLink },
                    { label: "Public Holiday List", icon: Calendar },
                    { label: "Balance Adjustments", icon: History },
                  ].map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      className="group flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-700">{link.label}</span>
                      <link.icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-brand-800" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-3xl border border-brand-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-6 md:p-8"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-brand-900 md:text-2xl">
                Quick Apply Tips
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                Small tips to improve approval speed and avoid delays.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="text-base">✓</span> Fast Approval
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Apply at least 7 days earlier for smoother manager approval.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
                  <span className="text-base">⏱</span> Save Time
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Complete applications usually take less than 2 minutes.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <span className="text-base">📱</span> Mobile Friendly
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Submit leave requests quickly from mobile when you're away from desk.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <LedgerDialog open={ledgerOpen} onOpenChange={setLedgerOpen} balance={activeBalance} />

      <ApplyLeaveWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onSubmit={handleWizardSubmit}
        selectedLeaveType={selectedLeaveType}
      />
    </>
  );
}