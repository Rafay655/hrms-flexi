"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  "flexi-hq": "Flexi HQ",
  "table-preview": "Table Preview",
  "people-hub": "People Hub",
  "time-sync": "Time Sync",
  "pay-edge": "PayEdge",
  "flexi-meta": "Flexi Meta",
  employees: "Employees",
  exits: "Exit Horizon",
  probation: "Probation",
  "transfer-promotion": "Transfers & Promotions",
  approvals: "Approvals",
  "ess-profile": "ESS Profile",
  "bulk-import": "Bulk Import",
  onboarding: "Onboarding",
  "payroll-processing": "Payroll Processing",
  "final-settlement": "Final Settlement",
  "salary-structures": "Salary Structures",
  "daily-report": "Daily Attendance",
  "roster-planner": "Roster Planner",
  "approvals-inbox": "Approvals Inbox",
  "audit-log": "Audit Log",
  companies: "Companies",
  workflows: "Workflows",
  new: "New",
  edit: "Edit",
  // LeaveEase
  leaveease: "LeaveEase",
  "my-balance": "My Balance",
  "my-requests": "My Requests",
  "my-calendar": "My Calendar",
  "my-earned-rewards": "My Rewards",
  "pending-approvals": "Pending Approvals",
  "adjustment-approvals": "Adjustment Approvals",
  "encashment-approvals": "Encashment Approvals",
  "od-approvals": "OD Approvals",
  "co-approvals": "Comp-Off Approvals",
  "od-travel": "OD / Travel",
  "od-reports": "OD Reports",
  delegations: "Delegations",
  "sla-monitor": "SLA Monitor",
  "team-balances": "Team Balances",
  "team-calendar": "Team Calendar",
  forecast: "Forecast",
  "leave-types": "Leave Types",
  eligibility: "Eligibility Groups",
  accrual: "Accrual Rules",
  "leave-proration": "Leave Proration",
  blackout: "Blackout Periods",
  "holiday-calendar": "Holiday Calendar",
  "employee-assignments": "Employee Assignments",
  entitlements: "Entitlements",
  "opening-balances": "Opening Balances",
  "balance-ledger": "Balance Ledger",
  "balance-adjustments": "Balance Adjustments",
  "carry-forward": "Carry Forward",
  "year-end": "Year End",
  encashment: "Encashment",
  "incentive-rules": "Incentive Rules",
  "incentive-runs": "Incentive Runs",
  "workflow-builder": "Workflow Builder",
  "workflow-instances": "Workflow Instances",
  "ai-copilot": "AI Copilot",
  "ai-anomalies": "AI Anomalies",
  "ai-risk": "AI Risk",
  simulator: "Simulator",
  analytics: "Analytics",
  reports: "Reports",
  notifications: "Notifications",
  "notification-templates": "Notification Templates",
  "notification-logs": "Notification Logs",
  "payroll-periods": "Payroll Periods",
  integrations: "Integrations",
  "audit-logs": "Audit Logs",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label:
      SEGMENT_LABELS[seg] ||
      seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
    isId: /^\d+$/.test(seg) || /^\[/.test(seg),
  }));

  const isTablePreview = pathname === "/table-preview";
  if (crumbs.length <= 1 && !isTablePreview) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1 text-muted-foreground mb-3 ${isTablePreview ? "font-sidebar text-[13px]" : "text-xs"}`}>
      <Link
        href={isTablePreview ? "/flexi-hq" : "/"}
        aria-label="Home"
        className="hover:text-brand-800 transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-50" />
          {crumb.isLast ? (
            <span aria-current="page" className="text-brand-800 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-brand-800 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
