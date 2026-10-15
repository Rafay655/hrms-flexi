export type DashboardPeriod = "2026-10" | "2026-09";
export interface DmsDashboardDemo {
  periodLabel: string;
  statuses: { key: string; name: string; value: number }[];
  trend: { month: string; uploaded: number; verified: number }[];
  types: { name: string; value: number }[];
  folders: { name: string; value: number }[];
  signatures: { pending: number; signed: number; declined: number };
  compliance: { expiring: number; expired: number; missing: number };
  folderCount: number;
  batches: { name: string; status: string; total: number; success: number; failed: number }[];
  documents: { reference: string; owner: string; name: string; type: string; date: string; folder: string; status: string }[];
}
const history = [
  { month: "Apr", uploaded: 210, verified: 192 }, { month: "May", uploaded: 248, verified: 223 },
  { month: "Jun", uploaded: 272, verified: 251 }, { month: "Jul", uploaded: 255, verified: 240 },
  { month: "Aug", uploaded: 310, verified: 284 }, { month: "Sep", uploaded: 360, verified: 332 },
  { month: "Oct*", uploaded: 144, verified: 116 },
];
// UI fixtures only. References are display text, never live API identifiers.
export const demoDashboards: Record<DashboardPeriod, DmsDashboardDemo> = {
  "2026-10": {
    periodLabel: "1–12 October 2026",
    statuses: [{ key: "verified", name: "Verified", value: 116 }, { key: "pending", name: "Pending", value: 20 }, { key: "rejected", name: "Rejected", value: 5 }, { key: "expired", name: "Expired", value: 3 }],
    trend: history.slice(1),
    types: [{ name: "HR letters", value: 42 }, { name: "Identity", value: 38 }, { name: "Contracts", value: 26 }, { name: "Certificates", value: 22 }, { name: "Other", value: 16 }],
    folders: [{ name: "Personal folders", value: 102 }, { name: "Shared folders", value: 42 }],
    signatures: { pending: 9, signed: 24, declined: 2 },
    compliance: { expiring: 12, expired: 7, missing: 18 }, folderCount: 36,
    batches: [{ name: "October employee documents", status: "Processing", total: 40, success: 28, failed: 2 }, { name: "Training certificates", status: "Completed", total: 24, success: 24, failed: 0 }, { name: "Contract renewals", status: "Completed with failures", total: 18, success: 16, failed: 2 }],
    documents: [
      { reference: "DOC-0144", owner: "Ahmed Raza", name: "Employment confirmation", type: "HR letter", date: "12 Oct 2026", folder: "Personal", status: "verified" },
      { reference: "DOC-0143", owner: "Sara Khan", name: "Identity document", type: "Identity", date: "12 Oct 2026", folder: "Personal", status: "pending" },
      { reference: "DOC-0142", owner: "Waleed Aslam", name: "Employment contract", type: "Contract", date: "11 Oct 2026", folder: "Personal", status: "verified" },
      { reference: "DOC-0141", owner: "HR team", name: "Workplace policy", type: "Policy", date: "10 Oct 2026", folder: "Shared", status: "verified" },
      { reference: "DOC-0140", owner: "Ayesha Malik", name: "Training certificate", type: "Certificate", date: "09 Oct 2026", folder: "Personal", status: "rejected" },
      { reference: "DOC-0139", owner: "Hassan Ali", name: "Professional certificate", type: "Certificate", date: "08 Oct 2026", folder: "Personal", status: "expired" },
    ],
  },
  "2026-09": {
    periodLabel: "1–30 September 2026",
    statuses: [{ key: "verified", name: "Verified", value: 332 }, { key: "pending", name: "Pending", value: 16 }, { key: "rejected", name: "Rejected", value: 8 }, { key: "expired", name: "Expired", value: 4 }],
    trend: history.slice(0, 6),
    types: [{ name: "HR letters", value: 96 }, { name: "Identity", value: 112 }, { name: "Contracts", value: 68 }, { name: "Certificates", value: 54 }, { name: "Other", value: 30 }],
    folders: [{ name: "Personal folders", value: 270 }, { name: "Shared folders", value: 90 }],
    signatures: { pending: 6, signed: 68, declined: 3 },
    compliance: { expiring: 10, expired: 5, missing: 22 }, folderCount: 32,
    batches: [{ name: "September onboarding", status: "Completed", total: 60, success: 60, failed: 0 }, { name: "Employee certificates", status: "Completed with failures", total: 35, success: 32, failed: 3 }],
    documents: [
      { reference: "DOC-0360", owner: "Sara Khan", name: "Salary certificate", type: "HR letter", date: "30 Sep 2026", folder: "Personal", status: "verified" },
      { reference: "DOC-0359", owner: "Ahmed Raza", name: "Identity document", type: "Identity", date: "29 Sep 2026", folder: "Personal", status: "pending" },
      { reference: "DOC-0358", owner: "HR team", name: "Leave policy", type: "Policy", date: "28 Sep 2026", folder: "Shared", status: "verified" },
      { reference: "DOC-0357", owner: "Hassan Ali", name: "Professional certificate", type: "Certificate", date: "27 Sep 2026", folder: "Personal", status: "expired" },
    ],
  },
};
