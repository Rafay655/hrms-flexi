'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, Flame, TrendingUp, Calendar, CheckCircle2,
  XCircle, Clock, ChevronRight, Award, Zap,
  History, Info, Star, Target, Download, AlertCircle,
  X, FileText, BarChart2, Filter, RefreshCw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RewardStatus = 'Credited' | 'Pending' | 'Rejected';
type RewardType   = 'Monthly' | 'Quarterly' | 'Annual';
type Tab          = 'overview' | 'progress' | 'history';
type Filter       = 'all' | 'Monthly' | 'Quarterly' | 'Annual';

interface RewardHistory {
  id: number;
  period: string;
  rule: string;
  award: string;
  days: number;
  leaveType: string;
  status: RewardStatus;
  creditedOn: string;
  reason: string;
  type: RewardType;
}

interface EligibilityRule {
  id: number;
  name: string;
  description: string;
  frequency: RewardType | 'Monthly';
  award: string;
  icon: React.ReactNode;
  criteria: string[];
}

interface ProgressCheck {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_HISTORY: RewardHistory[] = [
  {
    id: 1, period: 'Jan 2025', rule: 'Perfect Attendance Bonus',
    award: '+1 day Annual Leave', days: 1, leaveType: 'Annual Leave',
    status: 'Credited', creditedOn: 'Feb 02, 2025',
    reason: 'Zero absences, zero lates', type: 'Monthly',
  },
  {
    id: 2, period: 'Dec 2024', rule: 'Perfect Attendance Bonus',
    award: '+1 day Annual Leave', days: 1, leaveType: 'Annual Leave',
    status: 'Credited', creditedOn: 'Jan 02, 2025',
    reason: 'Zero absences, zero lates', type: 'Monthly',
  },
  {
    id: 3, period: 'Nov 2024', rule: 'Punctuality Award',
    award: '+0.5 day Casual Leave', days: 0.5, leaveType: 'Casual Leave',
    status: 'Credited', creditedOn: 'Dec 02, 2024',
    reason: '< 3 lates this month', type: 'Monthly',
  },
  {
    id: 4, period: 'Q4 2024', rule: 'Quarterly Wellness Reward',
    award: '+2 days Annual Leave', days: 2, leaveType: 'Annual Leave',
    status: 'Credited', creditedOn: 'Jan 05, 2025',
    reason: '< 2 sick days in quarter', type: 'Quarterly',
  },
  {
    id: 5, period: 'Oct 2024', rule: 'Perfect Attendance Bonus',
    award: '+1 day Annual Leave', days: 1, leaveType: 'Annual Leave',
    status: 'Credited', creditedOn: 'Nov 02, 2024',
    reason: 'Zero absences, zero lates', type: 'Monthly',
  },
  {
    id: 6, period: 'Sep 2024', rule: 'Perfect Attendance Bonus',
    award: '+1 day Annual Leave', days: 1, leaveType: 'Annual Leave',
    status: 'Credited', creditedOn: 'Oct 02, 2024',
    reason: 'Zero absences, zero lates', type: 'Monthly',
  },
  {
    id: 7, period: 'Aug 2024', rule: 'Perfect Attendance Bonus',
    award: '+1 day Annual Leave', days: 1, leaveType: 'Annual Leave',
    status: 'Pending', creditedOn: '—',
    reason: 'Under payroll review', type: 'Monthly',
  },
  {
    id: 8, period: 'Jul 2024', rule: 'Punctuality Award',
    award: '+0.5 day Casual Leave', days: 0.5, leaveType: 'Casual Leave',
    status: 'Rejected', creditedOn: '—',
    reason: '3 late occurrences recorded', type: 'Monthly',
  },
];

const ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    id: 1,
    name: 'Perfect Attendance Bonus',
    description: 'Awarded when an employee has zero absences and zero late occurrences in a full calendar month.',
    frequency: 'Monthly',
    award: '+1 day Annual Leave',
    icon: <Trophy size={20} className="text-amber-500" />,
    criteria: ['Zero unapproved absences', 'Zero late occurrences', 'No unpaid leave taken'],
  },
  {
    id: 2,
    name: 'Punctuality Award',
    description: 'Awarded when an employee has no more than 2 late occurrences (each ≤ 15 minutes) in a calendar month.',
    frequency: 'Monthly',
    award: '+0.5 day Casual Leave',
    icon: <Clock size={20} className="text-blue-500" />,
    criteria: ['Maximum 2 late occurrences', 'Each late ≤ 15 minutes', 'No unapproved absences'],
  },
  {
    id: 3,
    name: 'Quarterly Wellness Reward',
    description: 'Awarded when an employee uses fewer than 2 sick days in any calendar quarter.',
    frequency: 'Quarterly',
    award: '+2 days Annual Leave',
    icon: <Star size={20} className="text-emerald-500" />,
    criteria: ['< 2 sick days in the quarter', 'All absences properly documented', 'No unapproved absences'],
  },
  {
    id: 4,
    name: 'Annual Star Performer',
    description: 'Awarded for achieving perfect attendance in 10 or more months within a single calendar year.',
    frequency: 'Annual',
    award: '+5 days Annual Leave',
    icon: <Award size={20} className="text-purple-500" />,
    criteria: ['Perfect attendance in ≥ 10 months', 'No disciplinary actions', 'All leave properly submitted'],
  },
];

const PROGRESS_CHECKS: ProgressCheck[] = [
  { label: 'No unpaid leave taken (0 days)', status: 'pass', detail: 'You have not taken any unpaid leave this month.' },
  { label: 'Late occurrences: 2 (max allowed: 0)', status: 'fail', detail: 'You have 2 late occurrences recorded. Perfect Attendance requires zero lates.' },
  { label: 'No unapproved absences', status: 'pass', detail: 'All your absences have been properly approved.' },
  { label: 'Sick days used this month: 0', status: 'pass', detail: 'No sick days used in February.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Toast notification
const ToastNotification: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-right duration-300
          ${t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-red-600 text-white' :
                                   'bg-[#3E3B6F] text-white'}`}
      >
        {t.type === 'success' ? <CheckCircle2 size={16} /> :
         t.type === 'error'   ? <XCircle size={16} /> :
                                <Info size={16} />}
        <span>{t.message}</span>
        <button onClick={() => onRemove(t.id)} className="ml-1 opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// Status badge
const StatusBadge: React.FC<{ status: RewardStatus }> = ({ status }) => {
  const cfg = {
    Credited: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={10} /> },
    Pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-100',   icon: <Clock size={10} /> },
    Rejected: { cls: 'bg-red-50 text-red-700 border-red-100',         icon: <XCircle size={10} /> },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
};

// Eligibility Rules Drawer
const RulesDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={drawerRef}
        className="bg-white rounded-t-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#3E3B6F]">Eligibility Rules</h3>
            <p className="text-xs text-gray-400 mt-0.5">Rules reviewed quarterly · Effective Jan 2025</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {ELIGIBILITY_RULES.map(rule => (
            <div key={rule.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">{rule.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{rule.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      {rule.frequency}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#3E3B6F]">{rule.award}</p>
                  <p className="text-[10px] text-gray-400">on eligibility</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{rule.description}</p>
              <ul className="space-y-1">
                {rule.criteria.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
            <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Rules are reviewed quarterly. Contact HR at <span className="font-bold">hr@company.com</span> to request a manual review of a missed or disputed reward.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#3E3B6F] text-white rounded-2xl text-sm font-bold hover:bg-[#2f2d5a] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// Dispute Modal
const DisputeModal: React.FC<{
  reward: RewardHistory;
  onClose: () => void;
  onSubmit: (msg: string) => void;
}> = ({ reward, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    onSubmit(reason);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Dispute Reward</h3>
            <p className="text-xs text-gray-400 mt-0.5">{reward.period} — {reward.rule}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Award</span><span className="font-bold text-[#3E3B6F]">{reward.award}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Status</span><StatusBadge status={reward.status} />
          </div>
        </div>

        <label className="block text-xs font-bold text-gray-600 mb-1.5">Reason for dispute</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Explain why you believe this reward decision is incorrect..."
          className="w-full rounded-xl border border-gray-200 text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#3E3B6F]/30 focus:border-[#3E3B6F] text-gray-700"
        />
        <p className="text-[10px] text-gray-400 mt-1">HR will review within 3 business days.</p>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#3E3B6F] text-white text-sm font-bold hover:bg-[#2f2d5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : null}
            {submitting ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  onOpenRules: () => void;
  onGoProgress: () => void;
  onGoHistory: () => void;
}> = ({ onOpenRules, onGoProgress, onGoHistory }) => {
  const totalDays = MOCK_HISTORY.filter(h => h.status === 'Credited').reduce((s, h) => s + h.days, 0);
  const yearDays  = MOCK_HISTORY.filter(h => h.status === 'Credited' && h.period.includes('2025')).reduce((s, h) => s + h.days, 0);

  const leaveBreakdown = [
    { label: 'Annual Leave',  days: 6.0, color: 'text-[#3E3B6F]', bar: 'bg-indigo-200' },
    { label: 'Casual Leave',  days: 2.0, color: 'text-emerald-700', bar: 'bg-emerald-200' },
    { label: 'Wellness Credit', days: 0.5, color: 'text-amber-700', bar: 'bg-amber-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total earned (all-time)', value: `${totalDays} days`, sub: 'Across 6 reward events', icon: <Award size={20} />, iconBg: 'bg-indigo-50 text-[#3E3B6F]' },
          { label: 'Earned in 2025', value: `${yearDays} days`, sub: 'On track ✓', icon: <TrendingUp size={20} />, iconBg: 'bg-emerald-50 text-emerald-600', valColor: 'text-emerald-600' },
          { label: 'Achievement level', value: 'Silver tier', sub: '1 month to Gold ✦', icon: <Star size={20} />, iconBg: 'bg-amber-50 text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${s.iconBg}`}>{s.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.valColor ?? 'text-gray-900'}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Streak journey</p>
          <div className="flex items-center justify-between mb-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${i <= 5 ? 'bg-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.3)]' : 'bg-gray-100'}`}
                >
                  {i <= 5
                    ? <Flame size={18} className="text-amber-500 fill-amber-400" />
                    : <Star size={16} className="text-gray-300" />}
                </div>
                <span className={`text-[9px] font-bold uppercase ${i <= 5 ? 'text-amber-600' : 'text-gray-300'}`}>M{i}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-100 mb-4 flex items-start gap-2">
            <Zap size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Next milestone: <span className="font-bold">6-month streak</span> — unlock <span className="font-bold">Gold badge</span> + premium perks.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onGoProgress}
              className="flex-1 py-2.5 rounded-2xl bg-[#3E3B6F] text-white text-xs font-bold hover:bg-[#2f2d5a] transition-colors"
            >
              Check Feb status
            </button>
            <button
              onClick={onOpenRules}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View rules
            </button>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Leave balance from rewards</p>
          <div className="space-y-4 mb-5">
            {leaveBreakdown.map((l, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-700">{l.label}</span>
                  <span className={`font-bold ${l.color}`}>{l.days} days</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${l.bar}`}
                    style={{ width: `${Math.min(100, (l.days / 8) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onGoHistory}
            className="w-full py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            View full history <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-900 mb-0.5">How rewards are calculated</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Credits are automatically processed after each payroll lock event using verified attendance data. Eligible credits appear in your leave balance within 2 business days.
          </p>
        </div>
        <button
          onClick={onOpenRules}
          className="flex-shrink-0 text-xs font-bold text-[#3E3B6F] hover:underline flex items-center gap-1"
        >
          View rules <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Tab: Progress ─────────────────────────────────────────────────────────────

const ProgressTab: React.FC<{ onOpenRules: () => void }> = ({ onOpenRules }) => {
  const passCount = PROGRESS_CHECKS.filter(c => c.status === 'pass').length;
  const isEligible = passCount === PROGRESS_CHECKS.length;
  const [expanded, setExpanded] = useState<number | null>(null);

  const monthlyStats = [
    { label: 'Days present',    value: '10', note: 'of 10 working days' },
    { label: 'Late incidents',  value: '2',  note: 'max 0 for bonus' },
    { label: 'Sick days used',  value: '0',  note: '0 used this month' },
    { label: 'Unapproved abs.', value: '0',  note: 'clean record' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Checklist */}
      <div className="space-y-4">
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
              <Clock size={14} className="text-[#3E3B6F]" /> Feb 2025 Progress
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">15 days remaining</span>
          </div>
          <div className="p-6 space-y-2">
            {PROGRESS_CHECKS.map((check, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium border transition-colors
                    ${check.status === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' :
                      check.status === 'fail' ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100' :
                                                'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {check.status === 'pass' ? <CheckCircle2 size={15} /> :
                     check.status === 'fail' ? <XCircle size={15} /> :
                                               <AlertCircle size={15} />}
                    <span>{check.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest">{check.status}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${expanded === i ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>
                {expanded === i && (
                  <div className="mt-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed">
                    {check.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={`mx-6 mb-6 p-4 rounded-2xl text-center border
            ${isEligible ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1
              ${isEligible ? 'text-emerald-600' : 'text-red-500'}`}>
              Projected status
            </p>
            <p className={`text-xl font-bold ${isEligible ? 'text-emerald-700' : 'text-red-600'}`}>
              {isEligible ? 'Eligible 🎉' : 'Not Eligible'}
            </p>
            <p className={`text-[10px] mt-1 ${isEligible ? 'text-emerald-600' : 'text-red-400'}`}>
              {isEligible
                ? 'Keep it up through end of month!'
                : '2 lates recorded — try again next month to keep streak.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* Monthly Snapshot */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Monthly snapshot</p>
          <div className="grid grid-cols-2 gap-3">
            {monthlyStats.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What you could earn */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">What you could earn</p>
          <div className="space-y-3">
            {ELIGIBILITY_RULES.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-50 rounded-xl border border-gray-100">{r.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{r.name}</p>
                    <p className="text-xs text-[#3E3B6F] font-bold">{r.award}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border
                  ${r.frequency === 'Monthly'   ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    r.frequency === 'Quarterly' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                  'bg-amber-50 text-amber-600 border-amber-100'}`}
                >
                  {r.frequency}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onOpenRules}
            className="mt-3 text-[10px] font-bold text-[#3E3B6F] hover:underline uppercase tracking-widest flex items-center gap-1"
          >
            Full eligibility rules <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: History ──────────────────────────────────────────────────────────────

const HistoryTab: React.FC<{
  onDispute: (r: RewardHistory) => void;
  onExport: (r: RewardHistory) => void;
  onExportAll: () => void;
}> = ({ onDispute, onExport, onExportAll }) => {
  const [filter, setFilter]     = useState<Filter>('all');
  const [expandedId, setExpId]  = useState<number | null>(null);

  const filtered = filter === 'all' ? MOCK_HISTORY : MOCK_HISTORY.filter(h => h.type === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All periods' },
    { key: 'Monthly', label: 'Monthly' },
    { key: 'Quarterly', label: 'Quarterly' },
    { key: 'Annual', label: 'Annual' },
  ];

  const totals = {
    credited: filtered.filter(h => h.status === 'Credited').reduce((s, h) => s + h.days, 0),
    pending:  filtered.filter(h => h.status === 'Pending').length,
    rejected: filtered.filter(h => h.status === 'Rejected').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total credited</p>
          <p className="text-xl font-bold text-[#3E3B6F]">{totals.credited} days</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-xl font-bold text-amber-600">{totals.pending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Rejected</p>
          <p className="text-xl font-bold text-red-500">{totals.rejected}</p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
                ${filter === f.key
                  ? 'bg-[#3E3B6F] text-white border-[#3E3B6F]'
                  : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400 font-medium">{filtered.length} records</span>
          <button
            onClick={onExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                {['Period', 'Rule Applied', 'Award', 'Status', 'Credited On', ''].map((h, i) => (
                  <th key={i} className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(row => (
                <React.Fragment key={row.id}>
                  <tr
                    className={`hover:bg-gray-50/40 transition-colors cursor-pointer group
                      ${expandedId === row.id ? 'bg-gray-50/40' : ''}`}
                    onClick={() => setExpId(expandedId === row.id ? null : row.id)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{row.period}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                        ${row.type === 'Monthly'   ? 'bg-indigo-50 text-indigo-500' :
                          row.type === 'Quarterly' ? 'bg-emerald-50 text-emerald-600' :
                                                     'bg-amber-50 text-amber-600'}`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{row.rule}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase">{row.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#3E3B6F] whitespace-nowrap">{row.award}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{row.creditedOn}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight
                        size={16}
                        className={`text-gray-300 group-hover:text-[#3E3B6F] transition-all
                          ${expandedId === row.id ? 'rotate-90 text-[#3E3B6F]' : ''}`}
                      />
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={6} className="px-6 pb-4 pt-0">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-gray-700 mb-1">{row.rule} — {row.period}</p>
                              <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                                Reason: {row.reason}<br />
                                Award: {row.award} ({row.leaveType})<br />
                                Credited on: {row.creditedOn}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); onExport(row); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-white transition-colors"
                              >
                                <FileText size={12} /> Export PDF
                              </button>
                              {row.status !== 'Rejected' && (
                                <button
                                  onClick={e => { e.stopPropagation(); onDispute(row); }}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <AlertCircle size={12} /> Dispute
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const MyEarnedRewards: React.FC = () => {
  const [tab, setTab]                       = useState<Tab>('overview');
  const [rulesOpen, setRulesOpen]           = useState(false);
  const [disputeTarget, setDisputeTarget]   = useState<RewardHistory | null>(null);
  const [toasts, setToasts]                 = useState<Toast[]>([]);
  let toastIdRef = useRef(0);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleDispute = (reason: string) => {
    setDisputeTarget(null);
    addToast('Dispute submitted — HR will review within 3 business days.', 'info');
  };

  const handleExport = (row: RewardHistory) => {
    addToast(`PDF for ${row.period} is downloading...`, 'success');
  };

  const handleExportAll = () => {
    addToast('Exporting full history as CSV...', 'info');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview',          icon: <BarChart2 size={14} /> },
    { key: 'progress', label: 'Feb 2025 progress', icon: <Target size={14} /> },
    { key: 'history',  label: 'Reward history',    icon: <History size={14} /> },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100">
            <Trophy size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3E3B6F]">My Earned Rewards</h1>
            <p className="text-sm text-gray-400 font-medium">Automatic leave credits earned through your performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 rounded-2xl border border-amber-100">
          <Flame size={22} className="text-amber-500 fill-amber-400" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Current Streak</p>
            <p className="text-base font-bold text-amber-700">5 months in a row!</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all
              ${tab === t.key
                ? 'bg-[#3E3B6F] text-white border-[#3E3B6F] shadow-lg shadow-[#3E3B6F]/20'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab
          onOpenRules={() => setRulesOpen(true)}
          onGoProgress={() => setTab('progress')}
          onGoHistory={() => setTab('history')}
        />
      )}
      {tab === 'progress' && (
        <ProgressTab onOpenRules={() => setRulesOpen(true)} />
      )}
      {tab === 'history' && (
        <HistoryTab
          onDispute={setDisputeTarget}
          onExport={handleExport}
          onExportAll={handleExportAll}
        />
      )}

      {/* Overlays */}
      {rulesOpen     && <RulesDrawer onClose={() => setRulesOpen(false)} />}
      {disputeTarget && (
        <DisputeModal
          reward={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSubmit={handleDispute}
        />
      )}

      {/* Toasts */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default MyEarnedRewards;