'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Calculator, Info, AlertTriangle, CheckCircle2,
  History, ArrowRight, ArrowUpRight, DollarSign, Wallet, FileText,
  ChevronRight, Search, Clock, X, RefreshCw, Download,
  Shield, TrendingDown, AlertCircle, Eye, Filter,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EncashStatus = 'Paid' | 'Pending' | 'Rejected' | 'Processing';
type Tab = 'request' | 'history' | 'policy';

interface EncashableType {
  type: string;
  available: number;
  isEligible: boolean;
  minRetain: number;
  ratePerDay: number;
  reason?: string;
}

interface EncashmentRecord {
  id: string;
  date: string;
  type: string;
  days: number;
  grossAmount: number;
  taxDeducted: number;
  netAmount: number;
  status: EncashStatus;
  paidOn: string;
  payslipUrl?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error' | 'warn';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ELIGIBILITY_DATA: EncashableType[] = [
  { type: 'Annual Leave',  available: 16, isEligible: true,  minRetain: 5, ratePerDay: 5000 },
  { type: 'Casual Leave',  available: 7,  isEligible: false, minRetain: 0, ratePerDay: 4500, reason: 'Company policy does not allow Casual Leave encashment.' },
  { type: 'Comp-Off',      available: 3,  isEligible: true,  minRetain: 0, ratePerDay: 4800 },
];

const MOCK_HISTORY: EncashmentRecord[] = [
  {
    id: 'ENC-2024-001', date: 'Jan 15, 2024', type: 'Annual Leave',
    days: 5, grossAmount: 25000, taxDeducted: 2500, netAmount: 22500,
    status: 'Paid', paidOn: 'Jan 31, 2024',
  },
  {
    id: 'ENC-2023-082', date: 'Jul 10, 2023', type: 'Comp-Off',
    days: 2, grossAmount: 9600, taxDeducted: 960, netAmount: 8640,
    status: 'Paid', paidOn: 'Jul 31, 2023',
  },
  {
    id: 'ENC-2023-041', date: 'Apr 02, 2023', type: 'Annual Leave',
    days: 3, grossAmount: 15000, taxDeducted: 1500, netAmount: 13500,
    status: 'Paid', paidOn: 'Apr 30, 2023',
  },
  {
    id: 'ENC-2022-118', date: 'Dec 05, 2022', type: 'Annual Leave',
    days: 4, grossAmount: 20000, taxDeducted: 2000, netAmount: 18000,
    status: 'Rejected', paidOn: '—',
  },
];

const POLICY_POINTS = [
  { icon: <Shield size={16} />, title: 'Frequency', detail: 'Encashment is allowed once per calendar year per leave type.' },
  { icon: <TrendingDown size={16} />, title: 'Minimum Retain', detail: 'You must retain at least 5 days of Annual Leave balance at all times.' },
  { icon: <DollarSign size={16} />, title: 'Taxable Income', detail: 'Payout is added to your taxable income and tax is deducted at source (10%).' },
  { icon: <AlertTriangle size={16} />, title: 'Irreversible', detail: 'Once processed, the leave balance cannot be restored. Verify before submitting.' },
  { icon: <Clock size={16} />, title: 'Processing Time', detail: 'Approved requests are processed in the next payroll cycle (up to 30 days).' },
  { icon: <FileText size={16} />, title: 'Documentation', detail: 'A payslip/credit advice is issued for every completed encashment.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const ShieldCheck: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: EncashStatus }> = ({ status }) => {
  const cfg: Record<EncashStatus, { cls: string; icon: React.ReactNode }> = {
    Paid:       { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={10} /> },
    Pending:    { cls: 'bg-amber-50 text-amber-700 border-amber-100',       icon: <Clock size={10} /> },
    Processing: { cls: 'bg-blue-50 text-blue-700 border-blue-100',          icon: <RefreshCw size={10} /> },
    Rejected:   { cls: 'bg-red-50 text-red-700 border-red-100',             icon: <X size={10} /> },
  };
  const { cls, icon } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {icon} {status}
    </span>
  );
};

// Toast system
const Toaster: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
    {toasts.map(t => (
      <div key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-right duration-300
          ${t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-red-600 text-white' :
            t.type === 'warn'    ? 'bg-amber-500 text-white' :
                                   'bg-[#3E3B6F] text-white'}`}
      >
        {t.type === 'success' ? <CheckCircle2 size={15} /> :
         t.type === 'error'   ? <X size={15} /> :
         t.type === 'warn'    ? <AlertTriangle size={15} /> :
                                <Info size={15} />}
        <span>{t.message}</span>
        <button onClick={() => onRemove(t.id)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
          <X size={13} />
        </button>
      </div>
    ))}
  </div>
);

// Confirm Modal
const ConfirmModal: React.FC<{
  days: number;
  type: string;
  net: number;
  gross: number;
  tax: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ days, type, net, gross, tax, onConfirm, onCancel }) => {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-6 pt-6 pb-5 flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">Confirm encashment request</h3>
            <p className="text-xs text-amber-700 mt-0.5">This is a one-way transaction. Balance cannot be restored after payout.</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-xl hover:bg-amber-100 text-amber-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {[
            { label: 'Leave type',    value: type },
            { label: 'Days to encash', value: `${days} days` },
            { label: 'Gross amount',  value: fmt(gross), color: 'text-gray-900' },
            { label: 'Tax deducted (10%)', value: `– ${fmt(tax)}`, color: 'text-red-500' },
          ].map((r, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{r.label}</span>
              <span className={`font-bold ${r.color ?? 'text-gray-800'}`}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold text-gray-700">Est. net payout</span>
            <span className="text-2xl font-bold text-emerald-600">{fmt(net)}</span>
          </div>
          <p className="text-[10px] text-gray-400 italic">*Subject to final payroll validation.</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-[#3E3B6F] text-white text-sm font-bold hover:bg-[#2f2d5a] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={15} /> Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// Record detail drawer
const RecordDrawer: React.FC<{ record: EncashmentRecord; onClose: () => void; onDownload: () => void }> = ({ record, onClose, onDownload }) => {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#3E3B6F]">Encashment detail</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{record.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: 'Leave type',      value: record.type },
            { label: 'Request date',    value: record.date },
            { label: 'Days encashed',   value: `${record.days} days` },
            { label: 'Gross amount',    value: fmt(record.grossAmount), color: 'text-gray-900' },
            { label: 'Tax deducted',    value: `– ${fmt(record.taxDeducted)}`, color: 'text-red-500' },
            { label: 'Net payout',      value: fmt(record.netAmount), color: 'text-emerald-600 text-lg' },
            { label: 'Status',          value: record.status, isStatus: true },
            { label: 'Payment date',    value: record.paidOn },
          ].map((r: any, i) => (
            <div key={i} className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-0`}>
              <span className="text-sm text-gray-500">{r.label}</span>
              {r.isStatus
                ? <StatusBadge status={record.status} />
                : <span className={`font-bold text-sm ${r.color ?? 'text-gray-800'}`}>{r.value}</span>
              }
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onDownload}
            disabled={record.status !== 'Paid'}
            className="flex-1 py-3 rounded-2xl bg-[#3E3B6F] text-white text-sm font-bold hover:bg-[#2f2d5a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={14} /> Download Payslip
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Request Form ─────────────────────────────────────────────────────────

const RequestTab: React.FC<{ onSubmitSuccess: () => void; addToast: (m: string, t?: Toast['type']) => void }> = ({
  onSubmitSuccess, addToast,
}) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('Annual Leave');
  const [encashDays, setEncashDays]     = useState<number>(0);
  const [reason, setReason]             = useState('');
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPolicy = useMemo(() =>
    ELIGIBILITY_DATA.find(d => d.type === selectedType), [selectedType]);

  const maxEncashable = currentPolicy
    ? Math.max(0, currentPolicy.available - currentPolicy.minRetain) : 0;

  const calc = useMemo(() => {
    if (!currentPolicy) return { gross: 0, tax: 0, net: 0 };
    const gross = encashDays * currentPolicy.ratePerDay;
    const tax   = gross * 0.1;
    return { gross, tax, net: gross - tax };
  }, [currentPolicy, encashDays]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (encashDays === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1600));
    setIsSubmitting(false);
    addToast('Encashment request submitted! Processing in next payroll cycle.', 'success');
    setEncashDays(0);
    setReason('');
    onSubmitSuccess();
  };

  const remainingAfter = currentPolicy ? currentPolicy.available - encashDays : 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Eligibility panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* Eligibility cards */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Encashment Eligibility</h3>
            </div>
            <div className="p-5 divide-y divide-gray-100">
              {ELIGIBILITY_DATA.map(item => (
                <div key={item.type}
                  className={`py-4 flex items-start justify-between first:pt-0 last:pb-0 ${item.isEligible ? 'cursor-pointer group' : ''}`}
                  onClick={() => item.isEligible && setSelectedType(item.type)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${item.isEligible ? 'text-gray-900' : 'text-gray-400'}`}>{item.type}</p>
                      {selectedType === item.type && item.isEligible && (
                        <span className="text-[9px] font-bold bg-[#3E3B6F] text-white px-1.5 py-0.5 rounded-full uppercase">Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{item.available} days available</p>
                    {item.isEligible ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Eligible to encash
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <AlertTriangle size={10} /> Not encashable
                      </span>
                    )}
                    {item.reason && (
                      <p className="text-[10px] text-gray-400 italic max-w-[180px] leading-relaxed">{item.reason}</p>
                    )}
                  </div>
                  {item.isEligible && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Rate/day</p>
                      <p className="text-sm font-bold text-[#3E3B6F]">PKR {item.ratePerDay.toLocaleString()}</p>
                      {item.minRetain > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Retain: {item.minRetain}d</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Policy quick summary */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Info size={13} className="text-[#3E3B6F]" /> Policy snapshot
            </h4>
            {[
              { label: 'Frequency',         value: 'Once per year' },
              { label: 'Min. retain',       value: '5 days (Annual)' },
              { label: 'Last encashment',   value: 'Jan 15, 2024', color: 'text-amber-600' },
              { label: 'Tax rate',          value: '10% at source' },
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-500">{p.label}</span>
                <span className={`font-bold ${p.color ?? 'text-gray-700'}`}>{p.value}</span>
              </div>
            ))}
          </div>

          {/* Tax info banner */}
          <div className="bg-[#3E3B6F] p-6 rounded-[28px] text-white relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="p-2 bg-white/10 rounded-xl w-fit">
                <DollarSign size={20} className="text-amber-200" />
              </div>
              <h4 className="font-bold text-sm">Tax implications</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Encashment payouts are considered taxable income and are subject to deduction at source as per current fiscal year regulations.
              </p>
            </div>
            <CreditCard size={120} className="absolute -bottom-6 -right-6 opacity-5 -rotate-12" />
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleFormSubmit} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <Calculator size={18} className="text-[#3E3B6F]" />
              <h3 className="text-sm font-bold text-gray-700">New encashment request</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Leave Type + Days Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Leave type *</label>
                  <select
                    className="w-full p-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#3E3B6F] outline-none transition-all font-bold text-[#3E3B6F] text-sm cursor-pointer"
                    value={selectedType}
                    onChange={e => { setSelectedType(e.target.value); setEncashDays(0); }}
                    required
                  >
                    {ELIGIBILITY_DATA.filter(d => d.isEligible).map(d => (
                      <option key={d.type} value={d.type}>{d.type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex justify-between">
                    Days to encash *
                    <span className="text-indigo-500 font-bold">Max: {maxEncashable} days</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="0" max={maxEncashable} step="0.5"
                      value={encashDays}
                      onChange={e => setEncashDays(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#3E3B6F]"
                    />
                    <input
                      type="number" min="0" max={maxEncashable} step="0.5"
                      value={encashDays}
                      onChange={e => setEncashDays(Math.min(maxEncashable, parseFloat(e.target.value) || 0))}
                      className="w-16 p-2.5 bg-gray-50 border-2 border-transparent rounded-xl text-center font-bold text-[#3E3B6F] outline-none focus:bg-white focus:border-[#3E3B6F] text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Available: <strong>{currentPolicy?.available}</strong> · Must retain: <strong>{currentPolicy?.minRetain}</strong>
                  </p>
                </div>
              </div>

              {/* Live Calculation */}
              <div className={`rounded-2xl border p-5 space-y-4 transition-all
                ${encashDays > 0 ? 'bg-indigo-50/60 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                  <Calculator size={16} className="text-indigo-500" />
                  <h4 className="text-sm font-bold text-indigo-900">Live payout calculation</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Days',       value: `${encashDays}d` },
                    { label: 'Rate/day',   value: `PKR ${currentPolicy?.ratePerDay.toLocaleString() ?? 0}` },
                    { label: 'Gross',      value: fmt(calc.gross) },
                    { label: 'Tax (10%)',  value: `– PKR ${calc.tax.toLocaleString()}`, color: 'text-red-500' },
                  ].map((c, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">{c.label}</p>
                      <p className={`text-sm font-bold ${c.color ?? 'text-indigo-900'}`}>{c.value}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Est. net payout</p>
                    <p className={`text-3xl font-bold transition-all ${calc.net > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                      {fmt(calc.net)}
                    </p>
                  </div>
                  <p className="text-[10px] text-indigo-400 italic">*Subject to final payroll validation.</p>
                </div>
              </div>

              {/* Cross-module: Pay Edge connection */}
              <div className="mt-4 p-3 bg-brand-100/30 rounded-lg border border-brand-300/30 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-800">Payroll Processing</p>
                  <p className="text-xs text-muted-foreground">Approved encashments are included in the next payroll cycle</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/pay-edge/payroll-processing')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-300/40 text-brand-800 bg-white hover:bg-brand-100/50 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />View in Pay Edge
                </button>
              </div>

              {/* Balance Impact + Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Balance impact</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Current</p>
                      <p className="text-xl font-bold text-gray-900">{currentPolicy?.available ?? 0}d</p>
                    </div>
                    <ArrowRight className="text-gray-300 flex-shrink-0" size={18} />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">After</p>
                      <p className={`text-xl font-bold transition-colors ${remainingAfter < 3 ? 'text-red-500' : 'text-[#3E3B6F]'}`}>
                        {remainingAfter}d
                      </p>
                    </div>
                  </div>
                  {remainingAfter < 3 && encashDays > 0 && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                      <AlertCircle size={10} /> Low balance after encashment
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Justification (optional)</label>
                  <textarea
                    rows={4}
                    className="w-full p-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#3E3B6F] outline-none transition-all text-sm resize-none"
                    placeholder="Provide a reason for this request..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={15} className="flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider">One-way transaction — cannot be reversed after processing.</p>
              </div>
              <button
                type="submit"
                disabled={encashDays === 0 || isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#3E3B6F] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#3E3B6F]/20 hover:bg-[#2f2d5a] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><RefreshCw size={16} className="animate-spin" /> Processing…</>
                  : <><CheckCircle2 size={16} /> Submit encashment request</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          days={encashDays}
          type={selectedType}
          gross={calc.gross}
          tax={calc.tax}
          net={calc.net}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

// ─── Tab: History ──────────────────────────────────────────────────────────────

const HistoryTab: React.FC<{ addToast: (m: string, t?: Toast['type']) => void }> = ({ addToast }) => {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<EncashStatus | 'all'>('all');
  const [selectedRecord, setRecord] = useState<EncashmentRecord | null>(null);

  const filtered = useMemo(() => MOCK_HISTORY.filter(r => {
    const matchesSearch = search === '' ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [search, statusFilter]);

  const totals = {
    net: MOCK_HISTORY.filter(r => r.status === 'Paid').reduce((s, r) => s + r.netAmount, 0),
    days: MOCK_HISTORY.filter(r => r.status === 'Paid').reduce((s, r) => s + r.days, 0),
    count: MOCK_HISTORY.filter(r => r.status === 'Paid').length,
  };

  return (
    <>
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total received', value: fmt(totals.net), color: 'text-emerald-600' },
            { label: 'Days encashed',  value: `${totals.days} days`, color: 'text-[#3E3B6F]' },
            { label: 'Transactions',   value: `${totals.count} paid`, color: 'text-gray-700' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                placeholder="Search ID or type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3E3B6F] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-gray-400" />
              {(['all', 'Paid', 'Pending', 'Rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors
                    ${statusFilter === s
                      ? 'bg-[#3E3B6F] text-white border-[#3E3B6F]'
                      : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <button
              onClick={() => addToast('Exporting history as CSV…', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Download size={11} /> Export
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {['Request ID', 'Type', 'Days', 'Gross', 'Net payout', 'Status', 'Paid on', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">No records found.</td>
                  </tr>
                ) : filtered.map(r => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/40 transition-colors cursor-pointer group"
                    onClick={() => setRecord(r)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-[#3E3B6F] font-mono uppercase">{r.id}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.date}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">{r.type}</td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-700">{r.days}d</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{fmt(r.grossAmount)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">{fmt(r.netAmount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{r.paidOn}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setRecord(r); }}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-[#3E3B6F] hover:bg-gray-100 transition-all"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <RecordDrawer
          record={selectedRecord}
          onClose={() => setRecord(null)}
          onDownload={() => { addToast(`Payslip for ${selectedRecord.id} downloading…`, 'success'); setRecord(null); }}
        />
      )}
    </>
  );
};

// ─── Tab: Policy ──────────────────────────────────────────────────────────────

const PolicyTab: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    {POLICY_POINTS.map((p, i) => (
      <div key={i} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex gap-4">
        <div className="p-2.5 bg-indigo-50 text-[#3E3B6F] rounded-xl flex-shrink-0 h-fit">{p.icon}</div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">{p.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{p.detail}</p>
        </div>
      </div>
    ))}
    <div className="lg:col-span-2 bg-amber-50 rounded-[24px] border border-amber-100 p-5 flex gap-4">
      <Info size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-amber-900 mb-1">Need clarification?</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          For disputes or special encashment requests outside normal policy, contact HR at{' '}
          <span className="font-bold">hr@company.com</span> or raise a ticket via the HR portal.
          Policy is reviewed annually every January.
        </p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const EncashmentRequest: React.FC = () => {
  const [tab, setTab]     = useState<Tab>('request');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef          = useRef(0);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'request', label: 'New request',      icon: <Wallet size={14} /> },
    { key: 'history', label: 'History',           icon: <History size={14} /> },
    { key: 'policy',  label: 'Policy & rules',    icon: <Shield size={14} /> },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl border border-emerald-100">
            <Wallet size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3E3B6F]">Leave Encashment</h1>
            <p className="text-sm text-gray-400 font-medium">Convert eligible unused leave balances into financial credits</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Eligible this year</p>
            <p className="text-sm font-bold text-emerald-700">Max 11 days encashable</p>
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
      {tab === 'request' && (
        <RequestTab
          onSubmitSuccess={() => setTab('history')}
          addToast={addToast}
        />
      )}
      {tab === 'history' && <HistoryTab addToast={addToast} />}
      {tab === 'policy'  && <PolicyTab />}

      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default EncashmentRequest;