export type SubMenuItem = {
  id: number;
  icon: any;
  title: string;
  pathname?: string;
  disabled?: boolean;
  subMenu?: SubMenuItem[];
};

export type MenuItem = {
  id: number;
  icon: any;
  title: string;
  subMenu?: SubMenuItem[];
  pathname?: string;
  disabled?: boolean;
};

export type ModuleItem = {
  id: number;
  name: string;
  icon: any;
  Menu: MenuItem[];
  admin: boolean;
};

export const modules: ModuleItem[] = [
  {
    id: 9,
    name: "ConnectCentral",
    icon: "ShieldCheck",
    admin: false,
    Menu: [
      // Security Command Center
      {
        id: 901,
        icon: "LayoutDashboard",
        title: "Security Dashboard",
        pathname: "/connect-central/security",
      },

      // Sessions
      {
        id: 902,
        icon: "MonitorSmartphone",
        title: "Sessions",
        subMenu: [
          {
            id: 9021,
            icon: "Laptop2",
            title: "My Sessions",
            pathname: "/connect-central/sessions",
          },
          {
            id: 9022,
            icon: "Globe",
            title: "Company Sessions",
            pathname: "/connect-central/sessions/company",
          },
        ],
      },

      // Authentication
      {
        id: 903,
        icon: "KeyRound",
        title: "Authentication",
        subMenu: [
          {
            id: 9031,
            icon: "Smartphone",
            title: "2FA & OAuth",
            pathname: "/connect-central/authentication",
          },

          {
            id: 9033,
            icon: "Globe2",
            title: "OAuth Providers",
            pathname: "/connect-central/authentication/oauth",
          },
        ],
      },

      // Access Manager
      {
        id: 904,
        icon: "Users",
        title: "Access",
        subMenu: [
          {
            id: 9041,
            icon: "ShieldHalf",
            title: "Role Permissions",
            pathname: "/connect-central/access",
          },
          {
            id: 9043,
            icon: "KeyRound",
            title: "Permissions",
            pathname: "/connect-central/access/permissions",
          },
          {
            id: 9042,
            icon: "Lock",
            title: "Account Locks",
            pathname: "/connect-central/access/locks",
          },
        ],
      },

      // Policies
      {
        id: 905,
        icon: "Settings2",
        title: "Policies",
        subMenu: [
          {
            id: 9051,
            icon: "Clock",
            title: "Session Policies",
            pathname: "/connect-central/policies",
          },
          {
            id: 9052,
            icon: "KeySquare",
            title: "Password Policy",
            pathname: "/connect-central/policies/password",
          },
        ],
      },
    ],
  },

  {
    id: 22,
    name: "Audit Trail",
    icon: "ScrollText",
    admin: false,
    Menu: [
      {
        id: 220100,
        icon: "Newspaper",
        title: "Combined Feed",
        pathname: "/audit-trail",
      },
      {
        id: 220200,
        icon: "ShieldCheck",
        title: "Security Logs",
        pathname: "/audit-trail/security",
      },
      {
        id: 220300,
        icon: "Activity",
        title: "Activity Logs",
        pathname: "/audit-trail/activity",
      },
    ],
  },

  {
    id: 12,
    name: "SystemFlex",
    icon: "Settings",
    admin: false,
    // Repaired 2026-05-30 (Sprint 1 Day 1): the previous menu items
    // (CustomizePro / AdminSuite and their children) were placeholder stubs with
    // NO pathnames, pointing at pages that were never built. Repointed to the
    // four real screens under app/(system)/system-flex/.
    Menu: [
      {
        id: 120100,
        icon: "HeartPulse",
        title: "System Health",
        pathname: "/system-flex/health",
      },
      {
        id: 120200,
        icon: "DatabaseBackup",
        title: "Backup (VaultGuard)",
        pathname: "/system-flex/backup",
      },
      {
        id: 120300,
        icon: "Settings2",
        title: "Company Settings",
        pathname: "/system-flex/settings",
      },
      {
        id: 120500,
        icon: "Cog",
        title: "System Settings",
        pathname: "/system-flex/system",
      },
    ],
  },

  {
    id: 23,
    name: "Notify Pro",
    icon: "Bell",
    admin: false,
    Menu: [
      {
        id: 230500,
        icon: "Cog",
        title: "Dashboard",
        pathname: "/notify-pro/admin",
      },
      {
        id: 230100,
        icon: "Inbox",
        title: "Inbox",
        pathname: "/notify-pro/inbox",
      },
      {
        id: 230200,
        icon: "SlidersHorizontal",
        title: "Preferences",
        pathname: "/notify-pro/preferences",
      },
      {
        id: 230300,
        icon: "Megaphone",
        title: "Announcements",
        pathname: "/notify-pro/announcements",
      },
      {
        id: 230400,
        icon: "Send",
        title: "Delivery Log",
        pathname: "/notify-pro/log",
      },
      {
        id: 230700,
        icon: "Megaphone",
        title: "Campaigns",
        pathname: "/notify-pro/campaigns",
      },
      {
        id: 120400,
        icon: "Bell",
        title: "Notify Hub",
        pathname: "/notify-pro/notify-hub",
      },
      {
        id: 230600,
        icon: "MessageSquare",
        title: "WhatsApp",
        pathname: "/notify-pro/whatsapp-config",
      },
    ],
  },

  {
    id: 24,
    name: "DMS",
    icon: "Folder",
    admin: false,
    Menu: [
      {
        id: 240100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/dms",
      },
      {
        id: 240700,
        icon: "FileText",
        title: "Folder",
        pathname: "/dms/folders",
      },
      {
        id: 240200,
        icon: "FileText",
        title: "Documents",
        pathname: "/dms/documents",
      },
      {
        id: 240400,
        icon: "FileSignature",
        title: "Pending Signatures",
        pathname: "/dms/pending-signatures",
      },
      {
        id: 240500,
        icon: "UploadCloud",
        title: "Bulk Upload",
        pathname: "/dms/bulk-upload",
      },
      {
        id: 240600,
        icon: "ShieldCheck",
        title: "Compliance",
        pathname: "/dms/compliance",
      },
    ],
  },

  {
    id: 25,
    name: "Flexi Import",
    icon: "Upload",
    admin: false,
    Menu: [
      {
        id: 250100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/flexi-import",
      },
      {
        id: 250500,
        icon: "FileSpreadsheet",
        title: "Importer templates",
        pathname: "/flexi-import/templates",
      },
      {
        id: 250300,
        icon: "Layers",
        title: "Batches",
        pathname: "/flexi-import/batches",
      },
    ],
  },

  {
    id: 26,
    name: "Letter Forge",
    icon: "FileSignature",
    admin: false,
    Menu: [
      {
        id: 260100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/letter-forge",
      },
      {
        id: 260200,
        icon: "LayoutTemplate",
        title: "Templates",
        pathname: "/letter-forge/templates",
      },
      {
        id: 260400,
        icon: "Mail",
        title: "Letters",
        pathname: "/letter-forge/letters",
      },
      {
        id: 260700,
        icon: "Layers",
        title: "Letter Batches",
        pathname: "/letter-forge/letter-batches",
      },
    ],
  },

  {
    id: 1,
    name: "Flexi HQ",
    icon: "Building2",

    Menu: [
      {
        id: 10100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/flexi-hq",
      },
      {
        id: 10200,
        icon: "Building2",
        title: "Company",
        pathname: "/flexi-hq/companies",
      },
      {
        id: 10300,
        icon: "Network",
        title: "Organization chart",
        pathname: "/flexi-hq/org-chart",
      },
      {
        id: 10400,
        icon: "FormInput",
        title: "Form Builder",
        pathname: "/flexi-hq/form-builder",
      },
      {
        id: 10500,
        icon: "ListChecks",
        title: "Validation Catalog",
        pathname: "/flexi-hq/validation-catalog",
      },
      {
        id: 10600,
        icon: "Workflow",
        title: "Workflow",
        pathname: "/flexi-hq/workflows",
      },

      {
        id: 10700,
        icon: "FileClock",
        title: "Audit Log",
        pathname: "/flexi-hq/audit-log",
      },
    ],
    admin: false,
  },

  {
    id: 2,
    name: "PeopleHub",
    icon: "Users",
    Menu: [
      {
        id: 20100,
        icon: "LayoutDashboard",
        title: "PeopleHub Home",
        pathname: "/people-hub",
      },
      {
        id: 20200,
        icon: "Users",
        title: "Employee Directory",
        pathname: "/people-hub/employees",
      },
      {id: 40399, icon: "ClipboardCheck", title: "Profile Change Requests", pathname: "/people-hub/profile-change-requests"},

      {
        id: 20300,
        icon: "Hourglass",
        title: "Probation",
        pathname: "/people-hub/probation",
      },
      {
        id: 20400,
        icon: "ArrowRightLeft",
        title: "Transfers & Promotions",
        pathname: "/people-hub/transfer-promotion",
      },
      {
        id: 20500,
        icon: "LogOut",
        title: "Exit Horizon",
        pathname: "/people-hub/exits",
      },
      {
        id: 20600,
        icon: "ClipboardCheck",
        title: "Approvals",
        pathname: "/people-hub/approvals",
      },

      {
        id: 20700,
        icon: "UploadCloud",
        title: "Bulk Import",
        pathname: "/people-hub/bulk-import",
      },
    ],
    admin: false,
  },

  {
    id: 5,
    name: "TimeSync",
    icon: "Clock",
    admin: false,
    Menu: [
      // ═══════════════════════════════════════════════════════════════════
      // 1. DASHBOARD (standalone)
      // ═══════════════════════════════════════════════════════════════════
      {
        id: 50100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/time-sync",
      },
      {
        id: 50200,
        icon: "FileCog",
        title: "Attendance Policy",
        pathname: "/time-sync/attendance-policies",
      },

      // ═══════════════════════════════════════════════════════════════════
      // 2. MY ATTENDANCE (7 items)
      // ═══════════════════════════════════════════════════════════════════
      {
        id: 50300,
        icon: "User",
        title: "MY ATTENDANCE",
        subMenu: [
          {
            id: 50301,
            icon: "History",
            title: "My Timeline",
            pathname: "/time-sync/my-timelines",
          },
          {
            id: 50302,
            icon: "Fingerprint",
            title: "Punch Attendance",
            pathname: "/time-sync/punch-attendance",
          },
          {
            id: 50304,
            icon: "FileEdit",
            title: "My Regularization",
            pathname: "/time-sync/my-regularizations",
          },
          {
            id: 50305,
            icon: "Repeat",
            title: "My Shift Swap",
            pathname: "/time-sync/my-shift-swap",
          },
          {
            id: 50308,
            icon: "CalendarDays",
            title: "My Schedule",
            pathname: "/time-sync/my-schedule",
          },
          {
            id: 50303,
            icon: "Timer",
            title: "My Overtime",
            pathname: "/time-sync/my-overtimes",
            disabled: true,
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════
      // 3. TEAM
      // ═══════════════════════════════════════════════════════════════════
      {
        id: 50400,
        icon: "Users",
        title: "TEAM",
        subMenu: [
          {
            id: 50401,
            icon: "Users",
            title: "My Team",
            pathname: "/time-sync/my-team",
          },
        ],
      },
      // {
      //   id: 5,
      //   icon: "GitBranch",
      //   title: "WORKFLOWS",
      //   subMenu: [
      //     {
      //       id: 52,
      //       icon: "ClipboardList",
      //       title: "Regularization Panel",
      //       pathname: "/timesync/regularization-panel",
      //     },
      //     {
      //       id: 53,
      //       icon: "Hand",
      //       title: "Manual Punch",
      //       pathname: "/timesync/manual-punch",
      //     },
      //     {
      //       id: 54,
      //       icon: "Timer",
      //       title: "OT Approvals",
      //       pathname: "/timesync/ot-approvals-admin",
      //     },
      //     {
      //       id: 55,
      //       icon: "ArrowLeftRight",
      //       title: "Shift Swaps",
      //       pathname: "/timesync/shift-swaps",
      //     },

      //     {
      //       id: 56,
      //       icon: "Play",
      //       title: "Live Processes",
      //       pathname: "/timesync/workflow-instances",
      //     },
      //   ],
      // },

      // ═══════════════════════════════════════════════════════════════════
      // 6. SHIFT STUDIO (6 items - trimmed from 15)
      // Removed: Flexi Rules, Break Configs, Weekly Off, Alt Sat, Holidays, Special → SCHEDULING RULES
      // Removed: Swap Management (duplicate of Shift Swaps)
      // ═══════════════════════════════════════════════════════════════════
      {
        id: 50600,
        icon: "CalendarCog",
        title: "SHIFT STUDIO",
        subMenu: [
          {
            id: 50603,
            icon: "Layers",
            title: "Shift Templates",
            pathname: "/time-sync/shift-templates",
          },
          {
            id: 50604,
            icon: "UserCheck",
            title: "Shift Assignment",
            pathname: "/time-sync/shift-assignment",
          },
          {
            id: 50602,
            icon: "Copy",
            title: "Roster Templates",
            pathname: "/time-sync/roster-templates",
          },
          {
            id: 50601,
            icon: "LayoutGrid",
            title: "Roster Planner",
            pathname: "/time-sync/roster-planner",
          },
          {
            id: 50605,
            icon: "CalendarCheck",
            title: "Calendar Assignment",
            pathname: "/time-sync/calendar-assignment",
          },
          {
            id: 50606,
            icon: "DoorOpen",
            title: "Open Shifts",
            pathname: "/time-sync/open-shifts",
            disabled: true,
          },
        ],
      },

      {
        id: 50800,
        icon: "ShieldAlert",
        title: "ANOMALIES & COMPLIANCE",
        subMenu: [
          {
            id: 50801,
            icon: "AlertCircle",
            title: "Exceptions Inbox",
            pathname: "/time-sync/exceptions-inbox",
          },
          {
            id: 50802,
            icon: "Bot",
            title: "AI Guard",
            pathname: "/time-sync/ai-anomaly",
            disabled: true,
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════
      // 11. HARDWARE (3 items - removed System Audit Logs)
      // ═══════════════════════════════════════════════════════════════════
      {
        id: 50900,
        icon: "HardDrive",
        title: "HARDWARE",
        subMenu: [
          {
            id: 50901,
            icon: "Tablet",
            title: "Devices",
            pathname: "/time-sync/device-management",
          },
          {
            id: 50904,
            icon: "IdCard",
            title: "Employee Badges",
            pathname: "/time-sync/employee-badges",
          },
          {
            id: 50905,
            icon: "RefreshCw",
            title: "Attendance Reprocessing",
            pathname: "/time-sync/attendance-reprocessing",
          },
          {
            id: 50902,
            icon: "HeartPulse",
            title: "Device Health",
            pathname: "/time-sync/device-health",
            disabled: true,
          },
          {
            id: 50903,
            icon: "Download",
            title: "Ingestion Jobs",
            pathname: "/time-sync/ingestion-jobs",
            disabled: true,
          },
        ],
      },
    ],
  },

  {
    id: 7,
    name: "LeaveEase",
    icon: "Palmtree",
    admin: false, // Default, can be overridden based on user
    Menu: [
      {
        id: 70100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/leave-ease",
      },
      {
        id: 70200,
        icon: "Calendar",
        title: "My Leave",
        subMenu: [
          {
            id: 70201,
            icon: "WalletCards",
            title: "My Balance",
            pathname: "/leave-ease/my-balance",
          },
          {
            id: 70202,
            icon: "List",
            title: "My Requests",
            pathname: "/leave-ease/my-requests",
          },
          {
            id: 70203,
            icon: "CalendarDays",
            title: "My Calendar",
            pathname: "/leave-ease/my-calendar",
          },
          {
            id: 70204,
            icon: "BookText",
            title: "Balance Ledger",
            pathname: "/leave-ease/balance-ledger",
          },
          {
            id: 70205,
            icon: "Wallet",
            title: "Encashment",
            pathname: "/leave-ease/encashment",
          },
          {
            id: 70206,
            icon: "CalendarPlus",
            title: "Comp Off",
            pathname: "/leave-ease/comp-off",
          },
        ],
      },
      {
        id: 70300,
        icon: "ClipboardCheck",
        title: "Approvals",
        subMenu: [
          {
            id: 70301,
            icon: "ClipboardCheck",
            title: "Approvals Inbox",
            pathname: "/leave-ease/approvals-inbox",
          },
          {
            id: 70302,
            icon: "CheckSquare",
            title: "Comp-Off Approvals",
            pathname: "/leave-ease/co-approvals",
          },
          {
            id: 70303,
            icon: "Coins",
            title: "Encashment Approvals",
            pathname: "/leave-ease/encashment-approvals",
          },
          {
            id: 70304,
            icon: "ShieldCheck",
            title: "Adjustment Approvals",
            pathname: "/leave-ease/adjustment-approvals",
          },
          {
            id: 70305,
            icon: "UserCheck",
            title: "Delegations",
            pathname: "/leave-ease/delegations",
          },
        ],
      },
      {
        id: 70400,
        icon: "Users",
        title: "Team",
        subMenu: [
          {
            id: 70401,
            icon: "CalendarRange",
            title: "Team Calendar",
            pathname: "/leave-ease/team-calendar",
          },
          {
            id: 70402,
            icon: "Scale",
            title: "Team Balances",
            pathname: "/leave-ease/team-balances",
          },
        ],
      },
      {
        id: 70500,
        icon: "SlidersHorizontal",
        title: "Leave Setup (HR)",
        subMenu: [
          {
            id: 70501,
            icon: "Tags",
            title: "Leave Types",
            pathname: "/leave-ease/leave-types",
          },
          {
            id: 70502,
            icon: "ShieldCheck",
            title: "Leave Policies",
            pathname: "/leave-ease/leave-policies",
          },
          {
            id: 70503,
            icon: "PartyPopper",
            title: "Holiday Calendar",
            pathname: "/leave-ease/holiday-calendar",
          },
          {
            id: 70504,
            icon: "Hourglass",
            title: "Accrual Rules",
            pathname: "/leave-ease/accrual-rules",
          },
          {
            id: 70505,
            icon: "FastForward",
            title: "Carry-Forward",
            pathname: "/leave-ease/carry-forward",
          },
          {
            id: 70506,
            icon: "CalendarX",
            title: "Blackout Dates",
            pathname: "/leave-ease/blackout",
          },
        ],
      },
      {
        id: 70600,
        icon: "Wallet",
        title: "Balance Operations (HR)",
        subMenu: [
          {
            id: 70601,
            icon: "Sliders",
            title: "Balance Adjustments",
            pathname: "/leave-ease/balance-adjustments",
          },
          {
            id: 70602,
            icon: "ClipboardList",
            title: "Opening Balances",
            pathname: "/leave-ease/opening-balances",
          },

          {
            id: 70608,
            icon: "RefreshCw",
            title: "Year-End Close",
            pathname: "/leave-ease/year-end",
          },
        ],
      },
    ],
  },
  {
    id: 36,
    name: "Pakistan Compliance",
    icon: "Gavel",
    admin: false,
    Menu: [
      // Dashboard
      {
        id: 360100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/compliance/dashboard",
      },
      // Configuration
      {
        id: 360200,
        icon: "Settings",
        title: "Configuration",
        subMenu: [
          {
            id: 360201,
            icon: "Calendar",
            title: "Tax Years & Slabs",
            pathname: "/compliance/tax-years",
          },
          {
            id: 360202,
            icon: "Coins",
            title: "EOBI Config",
            pathname: "/compliance/eobi",
          },
          {
            id: 360203,
            icon: "Shield",
            title: "Social Security Config",
            pathname: "/compliance/social-security",
          },
          {
            id: 360204,
            icon: "Gift",
            title: "Gratuity Config",
            pathname: "/compliance/gratuity",
          },
          {
            id: 360205,
            icon: "Gift",
            title: "Provident Fund Config",
            pathname: "/compliance/provident-fund",
          },
          {
            id: 360206,
            icon: "Money",
            title: "Minimum Wages Config",
            pathname: "/compliance/minimum-wages",
          },
        ],
      },
      // Employee Statutory Data
      {
        id: 360300,
        icon: "Users",
        title: "Employee Statutory Data",
        pathname: "/compliance/employee-statutory",
      },
      {
        id: 360301,
        icon: "Users",
        title: "Entity Profiles",
        pathname: "/compliance/entity-profiles",
      },
      // Reports & Filings
      {
        id: 360400,
        icon: "FileText",
        title: "Reports & Filings",
        subMenu: [
          {
            id: 360401,
            icon: "FileSpreadsheet",
            title: "EOBI Schedule (R‑6/R‑9)",
            pathname: "/compliance/reports/eobi",
          },
          {
            id: 360402,
            icon: "FileSpreadsheet",
            title: "Social Security Schedule",
            pathname: "/compliance/reports/ss",
          },
          {
            id: 360403,
            icon: "Receipt",
            title: "Tax Register",
            pathname: "/compliance/reports/tax-register",
          },
          {
            id: 360404,
            icon: "PieChart",
            title: "Gratuity Liability",
            pathname: "/compliance/reports/gratuity-liability",
          },
          {
            id: 360405,
            icon: "DollarSign",
            title: "Employer Statutory Cost",
            pathname: "/compliance/reports/employer-cost",
          },
          {
            id: 360406,
            icon: "AlertTriangle",
            title: "Minimum Wage Violations",
            pathname: "/compliance/reports/min-wage",
          },
          {
            id: 360407,
            icon: "RefreshCw",
            title: "Year‑End Reconciliation",
            pathname: "/compliance/reports/reconciliation",
          },
          {
            id: 360408,
            icon: "UserCheck",
            title: "Filer / Non‑Filer Status",
            pathname: "/compliance/reports/filer-status",
          },
        ],
      },
      // Certificates
      {
        id: 360500,
        icon: "Files",
        title: "Certificates",
        subMenu: [
          {
            id: 360501,
            icon: "FilePlus",
            title: "Tax Certificate",
            pathname: "/compliance/tax-certificates",
          },
          {
            id: 360502,
            icon: "FileText",
            title: "My Certificates",
            pathname: "/compliance/certificates/my",
          },
        ],
      },
      // Ledger & Remittances
      {
        id: 360600,
        icon: "BookOpen",
        title: "Ledger & Remittances",
        subMenu: [
          {
            id: 360601,
            icon: "List",
            title: "Contribution Ledger",
            pathname: "/compliance/ledger",
          },
          {
            id: 360602,
            icon: "CheckCircle",
            title: "Mark Remitted",
            pathname: "/compliance/ledger/remit",
          },
          {
            id: 360603,
            icon: "RefreshCw",
            title: "Reconciliation",
            pathname: "/compliance/ledger/reconcile",
          },
        ],
      },
      // Employee Self‑Service
      {
        id: 360700,
        icon: "User",
        title: "Tax Calculations",
        subMenu: [
          {
            id: 360701,
            icon: "Receipt",
            title: "Tax Calculations",
            pathname: "/compliance/calculator",
          },
          {
            id: 360701,
            icon: "Receipt",
            title: "My Tax Summary",
            pathname: "/compliance/ess/tax-summary",
          },
          {
            id: 360702,
            icon: "FileText",
            title: "My Tax Certificate",
            pathname: "/compliance/ess/certificate",
          },
          {
            id: 360703,
            icon: "History",
            title: "My EOBI History",
            pathname: "/compliance/ess/eobi-history",
          },
          {
            id: 360704,
            icon: "Gift",
            title: "My Gratuity Estimate",
            pathname: "/compliance/ess/gratuity-estimate",
          },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "PayEdge",
    icon: "CreditCard",
    admin: false, // Default, can be overridden based on user
    Menu: [
      {
        id: 60100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/pay-edge",
      },
      {
        id: 60200,
        icon: "LayoutGrid",
        title: "Main",
        subMenu: [
          {
            id: 60201,
            icon: "UserCircle",
            title: "My Payroll",
            pathname: "/pay-edge/my-payroll",
          },
          {
            id: 60202,
            icon: "Sparkles",
            title: "Payslip Explainer",
            pathname: "/pay-edge/payslip-explainer",
          },
          {
            id: 60203,
            icon: "History",
            title: "Salary History",
            pathname: "/pay-edge/salary-history",
          },
          // {
          //   id: 60204,
          //   icon: "HandCoins",
          //   title: "My Loans",
          //   pathname: "/pay-edge/my-loan",
          // },
          // {
          //   id: 60205,
          //   icon: "ShieldCheck",
          //   title: "EOBI Statement",
          //   pathname: "/pay-edge/eobi-statement",
          // },
          // {
          //   id: 60206,
          //   icon: "Landmark",
          //   title: "PF Statement",
          //   pathname: "/pay-edge/pf-statement",
          // },
          {
            id: 60207,
            icon: "Users",
            title: "Team Payroll",
            pathname: "/pay-edge/team-payroll",
          },
          // {
          //   id: 60208,
          //   icon: "Coins",
          //   title: "Request Advance",
          //   pathname: "/pay-edge/request-advance",
          // },
        ],
      },
      {
        id: 60300,
        icon: "Settings",
        title: "Configuration",

        subMenu: [
          {
            id: 60301,
            icon: "Layers",
            title: "Pay Head",
            pathname: "/pay-edge/pay-heads",
          },
          {
            id: 60302,
            icon: "Briefcase",
            title: "Salary Structures",
            pathname: "/pay-edge/salary-structures",
          },
          {
            id: 60303,
            icon: "GitBranch",
            title: "Salary Assignments",
            pathname: "/pay-edge/salary-assignments",
          },
          // {
          //   id: 60304,
          //   icon: "Link2",
          //   title: "Gratuity Policies",
          //   pathname: "/pay-edge/gratuity-policies",
          // },

          {
            id: 60305,
            icon: "LayoutTemplate",
            title: "Payslip Designer",
            pathname: "/pay-edge/payslip-designer",
          },
        ],
      },
      {
        id: 60400,
        icon: "Calculator",
        title: "Operations",

        subMenu: [
          {
            id: 60404,
            icon: "CalendarRange",
            title: "Payroll Periods",
            pathname: "/pay-edge/payroll-periods",
          },
          {
            id: 60401,
            icon: "PlayCircle",
            title: "Payroll Processing",
            pathname: "/pay-edge/payroll-processing",
          },
          {
            id: 60413,
            icon: "FileText",
            title: "Bank Files",
            pathname: "/pay-edge/bank-files",
          },
          {
            id: 60402,
            icon: "Calendar",
            title: "Payroll Calendar",
            pathname: "/pay-edge/payroll-calendar",
          },
          {
            id: 60403,
            icon: "AlertCircle",
            title: "Exception Center",
            pathname: "/pay-edge/exception-center",
          },
          {
            id: 60405,
            icon: "Boxes",
            title: "Payroll Groups",
            pathname: "/pay-edge/payroll-groups",
          },
          // {
          //   id: 60406,
          //   icon: "HandCoins",
          //   title: "Loans & Advances",
          //   pathname: "/pay-edge/loans-advances",
          // },
          {
            id: 60407,
            icon: "Repeat",
            title: "Recovery Schedule",
            pathname: "/pay-edge/recovery-schedule",
          },
          {
            id: 60408,
            icon: "Percent",
            title: "Adjustments",
            pathname: "/pay-edge/adjustments",
          },
          {
            id: 60409,
            icon: "ClipboardCheck",
            title: "Adj. Approvals",
            pathname: "/pay-edge/adj-approvals",
          },
          {
            id: 60410,
            icon: "History",
            title: "Arrears Processing",
            pathname: "/pay-edge/arrears-processing",
          },
          {
            id: 60411,
            icon: "TrendingUp",
            title: "Increments & Bonus",
            pathname: "/pay-edge/increments-bonus",
          },
          {
            id: 60412,
            icon: "Ban",
            title: "Final Settlement",
            pathname: "/pay-edge/fnf-settlements",
          },
          // {
          //   id: 60413,
          //   icon: "Calculator",
          //   title: "Gratuity Calc",
          //   pathname: "/pay-edge/gratuity-calc",
          // },
        ],
      },
      {
        id: 60500,
        icon: "FileText",
        title: "Outputs",
        subMenu: [
          {
            id: 60501,
            icon: "ReceiptText",
            title: "Payslip Viewer",
            pathname: "/pay-edge/payslip-viewer",
          },
          {
            id: 60502,
            icon: "LayoutList",
            title: "Payroll Registers",
            pathname: "/pay-edge/payroll-registers",
          },
          {
            id: 60503,
            icon: "Landmark",
            title: "Bank Advice",
            pathname: "/pay-edge/bank-advice",
          },
          {
            id: 60504,
            icon: "History",
            title: "Export History",
            pathname: "/pay-edge/export-history",
          },
          {
            id: 60505,
            icon: "Database",
            title: "JV Export",
            pathname: "/pay-edge/jv-export",
          },
          {
            id: 60506,
            icon: "FileEdit",
            title: "Revision Letters",
            pathname: "/pay-edge/revision-letters",
          },
          {
            id: 60507,
            icon: "PieChart",
            title: "Cost Analysis",
            pathname: "/pay-edge/cost-analysis",
          },
          {
            id: 60508,
            icon: "BarChart3",
            title: "Gratuity Provisions",
            pathname: "/pay-edge/gratuity-provisions",
          },

          {
            id: 60510,
            icon: "RefreshCw",
            title: "Reconciliation",
            pathname: "/pay-edge/reconciliation",
          },
          {
            id: 60511,
            icon: "ShieldAlert",
            title: "Anomaly Detection",
            pathname: "/pay-edge/anomaly-detection",
          },
          {
            id: 60512,
            icon: "FileClock",
            title: "Audit Logs",
            pathname: "/pay-edge/audit-logs",
          },
          {
            id: 60513,
            icon: "Clock",
            title: "Scheduled",
            pathname: "/pay-edge/scheduled-reports",
          },
        ],
      },
      {
        id: 60600,
        icon: "Rocket",
        title: "Advanced",
        subMenu: [
          {
            id: 60601,
            icon: "Bot",
            title: "AI Assistant",
            pathname: "/pay-edge/ai-assistant",
          },
          {
            id: 60602,
            icon: "BrainCircuit",
            title: "Policy Copilot",
            pathname: "/pay-edge/policy-copilot",
          },

          {
            id: 60603,
            icon: "Bell",
            title: "Alert Config",
            pathname: "/pay-edge/alert-config",
          },
          {
            id: 60604,
            icon: "Gem",
            title: "Entitlements",
            pathname: "/pay-edge/entitlements",
          },
          {
            id: 60605,
            icon: "Settings",
            title: "Settings",
            pathname: "/pay-edge/settings",
          },
        ],
      },
    ],
  },
  {
    id: 32,
    name: "LoanHub",
    icon: "HandCoins",
    admin: false,
    Menu: [
      {
        id: 320100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/loan-hub",
      },
      {
        id: 320200,
        icon: "FileText",
        title: "Applications",
        pathname: "/loan-hub/applications",
      },
      {
        id: 320300,
        icon: "Wallet",
        title: "Loans",
        pathname: "/loan-hub/active",
      },
      {
        id: 320400,
        icon: "Banknote",
        title: "Recovery",
        pathname: "/loan-hub/recovery",
      },
      {
        id: 320500,
        icon: "BarChart3",
        title: "Reports",
        pathname: "/loan-hub/reports",
      },
      {
        id: 320600,
        icon: "UserRound",
        title: "My Loans",
        pathname: "/loan-hub/my-loans",
      },
      {
        id: 320700,
        icon: "Settings",
        title: "Settings",
        subMenu: [
          {
            id: 320710,
            icon: "Layers",
            title: "Loan Types",
            pathname: "/loan-hub/settings/types",
          },
          {
            id: 320720,
            icon: "SlidersHorizontal",
            title: "Policies",
            pathname: "/loan-hub/settings/policies",
          },
        ],
      },
    ],
  },
  {
    id: 38,
    name: "ExpenseHub",
    icon: "ReceiptText",
    admin: false,
    Menu: [
      {
        id: 380100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/expense-hub",
      },
      {
        id: 380200,
        icon: "FileText",
        title: "Claims",
        pathname: "/expense-hub/claims",
      },
      {
        id: 380300,
        icon: "CheckCircle2",
        title: "Approvals",
        pathname: "/expense-hub/approvals",
      },
      {
        id: 380400,
        icon: "Plane",
        title: "Travel",
        pathname: "/expense-hub/travel",
      },
      {
        id: 380500,
        icon: "Receipt",
        title: "Receipts",
        pathname: "/expense-hub/receipts",
      },
      {
        id: 380600,
        icon: "BarChart3",
        title: "Reports",
        pathname: "/expense-hub/reports",
      },
      {
        id: 380700,
        icon: "Settings",
        title: "Config",
        subMenu: [
          {
            id: 380710,
            icon: "Layers",
            title: "Categories",
            pathname: "/expense-hub/categories",
          },
          {
            id: 380720,
            icon: "SlidersHorizontal",
            title: "Policies",
            pathname: "/expense-hub/policies",
          },
          {
            id: 380730,
            icon: "MapPin",
            title: "Per-diem Rates",
            pathname: "/expense-hub/per-diem-rates",
          },
          {
            id: 380740,
            icon: "Car",
            title: "Mileage Rates",
            pathname: "/expense-hub/mileage-rates",
          },
          {
            id: 380750,
            icon: "Settings2",
            title: "Settings",
            pathname: "/expense-hub/settings",
          },
        ],
      },
    ],
  },

  {
    id: 3,
    name: "TalentWorks",
    icon: "UserSearch",
    Menu: [
      {
        id: 30100,
        icon: "Zap",
        title: "TalentTrack",
        subMenu: [
          {
            id: 30101,
            icon: "Zap",
            title: "JobWorks",
          },
          {
            id: 30102,
            icon: "Zap",
            title: "TalentPool",
          },
          {
            id: 30103,
            icon: "Zap",
            title: "OfferZone",
          },
        ],
      },
      {
        id: 30200,
        icon: "Zap",
        title: "Reports",
        subMenu: [
          {
            id: 30201,
            icon: "Zap",
            title: "Recruitment Metrics",
          },
        ],
      },
      {
        id: 30300,
        icon: "Zap",
        title: "SkillForge",
        subMenu: [
          {
            id: 30301,
            icon: "Zap",
            title: "TraningPath",
          },
          {
            id: 30302,
            icon: "Zap",
            title: "Feedback Loop",
          },
        ],
      },
    ],
    admin: false,
  },

  {
    id: 4,
    name: "PerformPro",
    icon: "Target",
    Menu: [
      {
        id: 40100,
        icon: "Zap",
        title: "Performance Hub",
        subMenu: [
          {
            id: 40101,
            icon: "Zap",
            title: "GoalManager",
          },
          {
            id: 40102,
            icon: "Zap",
            title: "Appraisal Avenue",
          },
          {
            id: 40103,
            icon: "Zap",
            title: "Feedback Focus",
          },
          {
            id: 40104,
            icon: "Zap",
            title: "Employee Growth",
          },
        ],
      },
      {
        id: 40200,
        icon: "Zap",
        title: "Reports",
        subMenu: [
          {
            id: 40201,
            icon: "Zap",
            title: "Appraisal Insights",
          },
        ],
      },
    ],
    admin: false,
  },

  {
    id: 13,
    name: "EngageBoard",
    icon: "HeartHandshake",
    Menu: [
      {
        id: 130100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/engageboard",
      },
      {
        id: 130200,
        icon: "ClipboardList",
        title: "Surveys",
        pathname: "/engageboard/surveys",
      },
      {
        id: 130300,
        icon: "Gauge",
        title: "eNPS",
        pathname: "/engageboard/enps",
      },
      {
        id: 130400,
        icon: "Wallet",
        title: "Points & Rewards",
        subMenu: [
          {
            id: 130401,
            icon: "Wallet",
            title: "My Wallet",
            pathname: "/engageboard/points",
          },
          {
            id: 130402,
            icon: "Wallet",
            title: "Rewards Catalog",
            pathname: "/engageboard/points/catalog",
          },
          {
            id: 130403,
            icon: "Wallet",
            title: "My Redemptions",
            pathname: "/engageboard/points/redemptions",
          },
          {
            id: 130404,
            icon: "Wallet",
            title: "Admin",
            pathname: "/engageboard/points/admin",
          },
        ],
      },
      {
        id: 130500,
        icon: "Newspaper",
        title: "Company Feed",
        pathname: "/engageboard/feed",
      },
      {
        id: 130600,
        icon: "Megaphone",
        title: "Announcements",
        pathname: "/engageboard/announcements",
      },
      {
        id: 130700,
        icon: "Award",
        title: "Recognitions",
        subMenu: [
          {
            id: 130701,
            icon: "Award",
            title: "Give Recognition",
            pathname: "/engageboard/recognitions",
          },
          {
            id: 130702,
            icon: "Award",
            title: "Badges (Admin)",
            pathname: "/engageboard/recognitions/badges",
          },
        ],
      },
      {
        id: 130800,
        icon: "PartyPopper",
        title: "Celebrations",
        pathname: "/engageboard/celebrations",
      },
    ],
    admin: false,
  },

  {
    id: 11,
    name: "ProjectEdge",
    icon: "FolderKanban",
    Menu: [
      {
        id: 110100,
        icon: "LayoutDashboard",
        title: "Overview",
        pathname: "/projectedge",
      },
      {
        id: 110200,
        icon: "FolderKanban",
        title: "Projects",
        pathname: "/projectedge/projects",
      },
      {
        id: 110300,
        icon: "ListChecks",
        title: "My tasks",
        pathname: "/projectedge/my-tasks",
      },
      {
        id: 110400,
        icon: "Clock3",
        title: "Timesheets",
        pathname: "/projectedge/timesheets",
      },
      {
        id: 110500,
        icon: "TriangleAlert",
        title: "Delay tracker",
        pathname: "/projectedge/delays",
      },
      {
        id: 110600,
        icon: "UsersRound",
        title: "Resources",
        pathname: "/projectedge/resources",
      },
    ],
    admin: false,
  },

  {
    id: 10,
    name: "Insight360",
    icon: "Telescope",
    Menu: [
      {
        id: 100100,
        icon: "Zap",
        title: "Flexilnsights",
        subMenu: [
          {
            id: 100101,
            icon: "Zap",
            title: "Employee Metrics",
          },
          {
            id: 100102,
            icon: "Zap",
            title: "Performance Dashboard",
          },
          {
            id: 100103,
            icon: "Zap",
            title: "Payroll & Leave Reports",
          },
        ],
      },
    ],
    admin: false,
  },

  // ===========================================================================
  // Roadmap modules — sourced from the original module specification documents
  // (Flexi HRMS Development Documents). Added as placeholder tiles (icon + name)
  // so they appear in the module grid in sequence; pages are not built yet, so
  // the single "Overview" menu item intentionally has no pathname.
  // ===========================================================================
  {
    id: 27,
    name: "SkillForge",
    icon: "GraduationCap",
    admin: false,
    Menu: [{ id: 270100, icon: "GraduationCap", title: "Overview" }],
  },
  {
    id: 28,
    name: "LeadershipLab",
    icon: "Award",
    admin: false,
    Menu: [{ id: 280100, icon: "Award", title: "Overview" }],
  },
  {
    id: 29,
    name: "CultureCore",
    icon: "Heart",
    admin: false,
    Menu: [{ id: 290100, icon: "Heart", title: "Overview" }],
  },
  {
    id: 30,
    name: "BenefitHub",
    icon: "ShieldPlus",
    admin: false,
    Menu: [{ id: 300100, icon: "ShieldPlus", title: "Overview" }],
  },
  {
    id: 31,
    name: "WellNest",
    icon: "Leaf",
    admin: false,
    Menu: [{ id: 310100, icon: "Leaf", title: "Overview" }],
  },

  {
    id: 33,
    name: "WorkforcePlanning",
    icon: "Workflow",
    admin: false,
    Menu: [{ id: 330100, icon: "Waypoints", title: "Overview" }],
  },
  {
    id: 34,
    name: "AMS",
    icon: "Package",
    admin: false,
    Menu: [
      {
        id: 340100,
        icon: "LayoutDashboard",
        title: "Dashboard",
        pathname: "/ams/dashboard",
      },
      {
        id: 340200,
        icon: "Layers",
        title: "Categories",
        pathname: "/ams/categories",
      },
      {
        id: 340300,
        icon: "Building2",
        title: "Vendors",
        pathname: "/ams/vendors",
      },
      {
        id: 340400,
        icon: "Package",
        title: "Assets",
        pathname: "/ams/assets",
      },
      {
        id: 340500,
        icon: "UserRound",
        title: "Assignments",
        pathname: "/ams/assignments",
      },
      {
        id: 340600,
        icon: "FileText",
        title: "Handover Notes",
        pathname: "/ams/handover-notes",
      },
      {
        id: 340700,
        icon: "Trash2",
        title: "Disposals",
        pathname: "/ams/disposals",
      },
      {
        id: 340800,
        icon: "KeyRound",
        title: "Licenses",
        pathname: "/ams/licenses",
      },
      {
        id: 340850,
        icon: "Boxes",
        title: "Bundles",
        pathname: "/ams/settings/bundles",
      },
      {
        id: 340860,
        icon: "ClipboardList",
        title: "Outstanding Bundles",
        pathname: "/ams/bundles/outstanding",
      },
      {
        id: 340900,
        icon: "BarChart3",
        title: "Reports",
        pathname: "/ams/reports/utilization",
      },
    ],
  },
  {
    id: 35,
    name: "FlexiDesk",
    icon: "Headset",
    admin: false,
    // Expands the existing FlexiDesk entry (do not add a second one). Employees use FlexiDesk through
    // the ESS portal (/ess/tickets); this system entry is for HR / resolvers. Only pages that exist
    // are linked: more items land with the resolver workspace (Sprint 2) and settings (Sprint 6, now built).
    Menu: [
      {
        id: 350050,
        icon: "LayoutDashboard",
        title: "Overview",
        pathname: "/flexi-desk/admin",
      },
      {
        id: 350100,
        icon: "Headset",
        title: "Tickets",
        pathname: "/flexi-desk/tickets",
      },
      {
        id: 350200,
        icon: "Scale",
        title: "Grievances",
        pathname: "/flexi-desk/grievances",
      },
      {
        id: 350300,
        icon: "BookOpen",
        title: "Knowledge base",
        pathname: "/flexi-desk/knowledge-base",
      },
      {
        id: 350400,
        icon: "Heart",
        title: "Satisfaction",
        pathname: "/flexi-desk/csat",
      },
      {
        id: 350500,
        icon: "Settings",
        title: "Settings",
        pathname: "/flexi-desk/settings/categories",
      },
      {
        id: 350600,
        icon: "BarChart3",
        title: "Reports",
        pathname: "/flexi-desk/reports",
      },
    ],
  },

  {
    id: 14,
    name: "Flexi meta",
    icon: "Library",
    admin: true,
    Menu: [
      // 2.1 Geography (replaces single "Country" item with a group)
      {
        id: 140100,
        icon: "Globe",
        title: "Geography",
        subMenu: [
          {
            id: 140101,
            icon: "Zap",
            title: "Countries",
            pathname: "/flexi-meta/countries",
          },
          {
            id: 140102,
            icon: "Zap",
            title: "States/Provinces",
            pathname: "/flexi-meta/states",
          },
          {
            id: 140103,
            icon: "Zap",
            title: "Cities",
            pathname: "/flexi-meta/cities",
          },
          {
            id: 140104,
            icon: "Zap",
            title: "Regions",
            pathname: "/flexi-meta/regions",
          },
        ],
      },

      // 2.2 Company Dictionaries (moved from old "Company")
      {
        id: 140200,
        icon: "BookOpen",
        title: "Company Dictionaries",
        subMenu: [
          {
            id: 140201,
            icon: "Zap",
            title: "Entity Type",
            pathname: "/flexi-meta/entity-types",
          },
          {
            id: 140202,
            icon: "Zap",
            title: "Location Type",
            pathname: "/flexi-meta/location-types",
          },
          {
            id: 140203,
            icon: "Zap",
            title: "Locations",
            pathname: "/flexi-meta/locations",
          },
          {
            id: 140204,
            icon: "Zap",
            title: "Business Line",
            pathname: "/flexi-meta/business-lines",
          },
          {
            id: 140205,
            icon: "Layers",
            title: "Divisions",
            pathname: "/flexi-meta/divisions",
          },
          {
            id: 140206,
            icon: "GitFork",
            title: "Departments",
            pathname: "/flexi-meta/departments",
          },
          {
            id: 140207,
            icon: "BookUser",
            title: "Designations",
            pathname: "/flexi-meta/designations",
          },
          {
            id: 140208,
            icon: "Users",
            title: "Grades & Bands",
            pathname: "/flexi-meta/grade-bands",
          },

          {
            id: 140209,
            icon: "Wallet",
            title: "Cost Centers",
            pathname: "/flexi-meta/cost-centers",
          },
          {
            id: 140210,
            icon: "Zap",
            title: "Branches",
            pathname: "/flexi-meta/branches",
          },
          {
            id: 140211,
            icon: "Zap",
            title: "Devices",
            pathname: "/flexi-meta/device-types",
          },
        ],
      },

      // Keep your existing Employee block intact
      {
        id: 140300,
        icon: "Users",
        title: "Employee",
        subMenu: [
          {
            id: 140301,
            icon: "Zap",
            title: "Gender",
            pathname: "/flexi-meta/genders",
          },
          {
            id: 140302,
            icon: "Zap",
            title: "Salutation",
            pathname: "/flexi-meta/salutations",
          },

          {
            id: 140303,
            icon: "Zap",
            title: "Employee Type",
            pathname: "/flexi-meta/employee-types",
          },
          {
            id: 140304,
            icon: "Zap",
            title: "Blood group",
            pathname: "/flexi-meta/blood-groups",
          },
          {
            id: 140305,
            icon: "Zap",
            title: "Marital Status",
            pathname: "/flexi-meta/marital-statuses",
          },
          {
            id: 140306,
            icon: "Zap",
            title: "Health Condition",
            pathname: "/flexi-meta/health-conditions",
          },
          {
            id: 140307,
            icon: "Zap",
            title: "Document Categories",
            pathname: "/flexi-meta/document-categories",
          },
          {
            id: 140308,
            icon: "Zap",
            title: "Document Types",
            pathname: "/flexi-meta/document-types",
          },
        ],
      },

      {
        id: 140400,
        icon: "Coins",
        title: "Finance",
        subMenu: [
          {
            id: 140401,
            icon: "Zap",
            title: "Currencies",
            pathname: "/flexi-meta/currencies",
          },
          {
            id: 140402,
            icon: "Zap",
            title: "FX Rates",
            pathname: "/flexi-meta/fx-rates",
          },
          {
            id: 140403,
            icon: "Zap",
            title: "Banks",
            pathname: "/flexi-meta/banks",
          },
          {
            id: 140404,
            icon: "Zap",
            title: "Bank Branches",
            pathname: "/flexi-meta/bank-branches",
          },
          {
            id: 140405,
            icon: "Zap",
            title: "IBAN Formats",
            pathname: "/flexi-meta/iban-formats",
          },
        ],
      },

      {
        id: 140500,
        icon: "ScrollText",
        title: "Statutory Framework",
        subMenu: [
          {
            id: 140501,
            icon: "Zap",
            title: "Minimum Wages",
            pathname: "/flexi-meta/minimum-wages",
          },
          {
            id: 140502,
            icon: "Zap",
            title: "Statutory Rates",
            pathname: "/flexi-meta/statutory-rates",
          },
        ],
      },

      {
        id: 140600,
        icon: "Archive",
        title: "Catalogs",
        subMenu: [
          {
            id: 140601,
            icon: "Zap",
            title: "Salary Components",
            pathname: "/flexi-meta/salary-components",
          },

          {
            id: 140602,
            icon: "Zap",
            title: "Skills & Trades",
            pathname: "/flexi-meta/skill-trades",
          },
          {
            id: 140603,
            icon: "Zap",
            title: "Grade Templates",
            pathname: "/flexi-meta/grade-templates",
          },
        ],
      },
    ],
  },

  {
    id: 15,
    name: "Settings",
    icon: "Settings",
    Menu: [
      {
        id: 150100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 150101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 150102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 150103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 16,
    name: "Users",
    icon: "UserCog",
    Menu: [
      {
        id: 160100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 160101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 160102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 160103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 17,
    name: "Manage Modules",
    icon: "Blocks",
    Menu: [
      {
        id: 170100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 170101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 170102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 170103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 18,
    name: "Permissions",
    icon: "KeyRound",
    Menu: [
      {
        id: 180100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 180101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 180102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 180103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 19,
    name: "Billing",
    icon: "CreditCard",
    Menu: [
      {
        id: 190100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 190101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 190102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 190103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 20,
    name: "Field Names",
    icon: "Tags",
    Menu: [
      {
        id: 200100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 200101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 200102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 200103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },

  {
    id: 21,
    name: "Data",
    icon: "Database",
    Menu: [
      {
        id: 210100,
        icon: "Zap",
        title: "PulseCheck",
        subMenu: [
          {
            id: 210101,
            icon: "Zap",
            title: "Engage Surveys",
          },
          {
            id: 210102,
            icon: "Zap",
            title: "TeamEvents",
          },
          {
            id: 210103,
            icon: "Zap",
            title: "Rewards & Recognition",
          },
        ],
      },
    ],
    admin: true,
  },
];

const MODULE_LANDING_OVERRIDES: Record<number, string> = {
  7: "/leave-ease",
  9: "/connect-central", // Menu[0] is /connect-central/security; tile lands on the module root
  12: "/system-flex", // Menu[0] is a sub-route; tile lands on the module root
  14: "/flexi-meta", // Menu[0] is a sub-route; tile lands on the module root
  23: "/notify-pro", // Menu[0] is a sub-route; tile lands on the module root
};

export function getModuleLandingPath(id: number): string | undefined {
  const mod = modules.find((m) => m.id === id);
  if (!mod) return undefined;
  return MODULE_LANDING_OVERRIDES[id] ?? mod.Menu?.[0]?.pathname;
}

export function getModuleIdForPath(pathname: string): number | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg) return null;

  for (const mod of modules) {
    const segments = new Set<string>();
    const collect = (p?: string) => {
      const s = p?.split("/").filter(Boolean)[0];
      if (s) segments.add(s);
    };
    for (const item of mod.Menu ?? []) {
      collect(item.pathname);
      for (const sub of item.subMenu ?? []) collect(sub.pathname);
    }
    collect(MODULE_LANDING_OVERRIDES[mod.id]);
    if (segments.has(seg)) return mod.id;
  }
  return null;
}
