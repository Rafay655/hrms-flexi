"use client";

import React from "react";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Gem,
  Globe,
  HardDrive,
  Info,
  Landmark,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

export default function PayEdgeEntitlements() {
  const currentPlan = "PayEdge Pro";
  const validUntil = "Dec 31, 2025";
  const employeeUsage = 485;
  const employeeLimit = 1000;
  const usagePercentage = (employeeUsage / employeeLimit) * 100;

  const coreFeatures = [
    "Rule-based Components",
    "Batch Processing",
    "Digital Payslips",
    "Standard Reports",
    "ESS Portal Access",
  ];

  const proFeatures = [
    "ERP Integrations",
    "Loan Management",
    "Arrears Processing",
    "Advanced Analytics",
    "PayEdge AI Assistant",
  ];

  const enterpriseFeatures = [
    "Multi-currency Payouts",
    "Full & Final (EOS)",
    "UAE/GCC Localization",
    "Workflow Orchestration",
    "Audit Immutable Logs",
    "SSO & SAML 2.0",
  ];

  const pakistanAddOns = [
    { name: "FBR Income Tax", active: true },
    { name: "EOBI Contributions", active: true },
    { name: "Provincial SS (PESSI/SESSI)", active: true },
    { name: "Provident Fund Trust", active: true },
  ];

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-brand-900 px-6 py-6 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Gem className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">{currentPlan}</h2>
                  <p className="mt-0.5 text-sm text-white/70">
                    Enterprise subscription overview
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Valid until {validUntil}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      Active & compliant
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full rounded-xl border border-white/10 bg-white/10 p-5 lg:w-[360px]">
                <div className="flex items-end justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Employee Utilization
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {employeeUsage} / {employeeLimit}
                  </p>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] text-white/70">
                  {usagePercentage.toFixed(1)}% of total capacity used
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Current plan: </span>
                <span className="font-semibold text-brand-900">{currentPlan}</span>
                <span className="text-brand-700"> · Valid through </span>
                <span className="font-semibold text-brand-900">{validUntil}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">{employeeUsage}</span> active employees
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{employeeLimit}</span> included seats
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{usagePercentage.toFixed(1)}%</span> used
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TierCard
            title="Core Engine"
            status="Included"
            muted
            items={coreFeatures}
          />

          <TierCard
            title="Pro Add-ons"
            status="Current Tier"
            active
            items={proFeatures}
          />

          <TierCard
            title="Enterprise"
            status="Locked"
            locked
            items={enterpriseFeatures}
            footer={
              <button className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100">
                Upgrade to Enterprise
              </button>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-800" />
                <h3 className="text-sm font-semibold text-brand-900">
                  Localized Compliance
                </h3>
              </div>

              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Pakistan Ready
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {pakistanAddOns.map((addon) => (
                <div
                  key={addon.name}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <span className="text-sm font-semibold text-brand-900">
                    {addon.name}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-brand-800" />
                <h3 className="text-sm font-semibold text-brand-900">
                  Global Regions
                </h3>
              </div>

              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                Locked
              </span>
            </div>

            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                <Globe className="h-5 w-5 text-brand-800" />
              </div>

              <h4 className="mt-4 text-base font-semibold text-brand-900">
                UAE & GCC Localization
              </h4>
              <p className="mt-2 max-w-sm text-sm leading-6 text-brand-700">
                Automated WPS files, gratuity compliance, and regional payroll rule
                support for GCC entities.
              </p>

              <button className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100">
                Request Region Expansion
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-brand-900 shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white">
                  Enterprise Success Manager
                </h4>
                <p className="mt-1 text-sm text-white/70">
                  Dedicated support for your payroll team, documentation, and subscription queries.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20">
                Technical Documentation
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-brand-900 transition hover:bg-gray-100">
                Contact Sales
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <Info className="h-4 w-4 text-brand-800" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-brand-900">
                Billing & Subscription Note
              </h4>
              <p className="mt-1 text-sm leading-6 text-brand-700">
                Your subscription is managed through the Flexi Cloud Console. For
                billing questions or usage overages, use the Flexi Billing Portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  title,
  status,
  items,
  active,
  locked,
  muted,
  footer,
}: {
  title: string;
  status: string;
  items: string[];
  active?: boolean;
  locked?: boolean;
  muted?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={
        active
          ? "rounded-xl border border-brand-800 bg-white p-5 shadow-sm"
          : muted
          ? "rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          : "rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{title}</h3>
          <p className="mt-1 text-[11px] text-brand-700">{status}</p>
        </div>

        {locked ? (
          <Lock className="h-4 w-4 text-brand-700" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-brand-900">
            {active ? (
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" />
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-800" />
            )}
            <span className={locked ? "text-brand-700" : "text-brand-900"}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  );
}