"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";

type LeaveRow = {
  id: number;
  type: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  status: string;
  approved_by: string;
  applied_on: string;
};

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Casual Leave",
  "Maternity Leave",
  "Without Pay",
  "Compensatory Off",
];
const STATUSES = ["Approved", "Pending", "Rejected", "Cancelled"];
const APPROVERS = ["Asad Rehman", "Zara Tariq", "Ahmed Raza", "Omar Farooq"];

function makeHistory(): LeaveRow[] {
  const year = 2025;
  return Array.from({ length: 20 }, (_, i) => {
    const month = (i % 12) + 1;
    const day = (i * 3) % 25 + 1;
    const duration = (i % 5) + 1;
    const from = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const toDate = new Date(year, month - 1, day + duration - 1);
    const to = `${year}-${String(month).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;
    return {
      id: i + 1,
      type: LEAVE_TYPES[i % LEAVE_TYPES.length],
      from_date: from,
      to_date: to,
      days: duration,
      reason:
        i % 3 === 0
          ? "Family matter"
          : i % 3 === 1
          ? "Medical rest"
          : "Personal work",
      status: i > 16 ? "Pending" : i % 9 === 0 ? "Rejected" : "Approved",
      approved_by: APPROVERS[i % APPROVERS.length],
      applied_on: `${year}-${String(month).padStart(2, "0")}-${String(Math.max(1, day - 2)).padStart(2, "0")}`,
    };
  });
}

export default function LeaveHistoryPage() {
  const [rows, setRows] = useState<LeaveRow[]>(() => makeHistory());

  const statusClass = (s: string) =>
    s === "Approved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      : s === "Pending"
      ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
      : s === "Rejected"
      ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";

  const columns: DataTableColumn<LeaveRow>[] = [
    {
      key: "type",
      header: "Type",
      render: (v) => <span className="font-semibold text-brand-900">{v as string}</span>,
    },
    { key: "from_date", header: "From" },
    { key: "to_date", header: "To" },
    { key: "days", header: "Days" },
    { key: "reason", header: "Reason" },
    {
      key: "status",
      header: "Status",
      render: (v) => <Badge className={statusClass(v as string)}>{v as string}</Badge>,
    },
    { key: "approved_by", header: "Approved By" },
    { key: "applied_on", header: "Applied On" },
  ];

  return (
    <DataTable<LeaveRow>
      title="Leave History"
      description="Your complete leave request record"
      columns={columns}
      data={rows}
      searchKeys={["type", "reason", "status", "approved_by"]}
      searchPlaceholder="Search by type, reason, or approver..."
      addLabel="Apply for Leave"
      exportFilename="my-leave-history"
      onAdd={() => {}}
      onEdit={() => {}}
      onDelete={(item) => {
        setRows((prev) => prev.filter((r) => r.id !== item.id));
        toast.success("Leave record removed");
      }}
      renderForm={(mode, item, onClose) => (
        <div className="p-4 text-sm text-muted-foreground">
          Leave history is read-only. Use "Apply for Leave" to create a new request.
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-brand-800 hover:bg-brand-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    />
  );
}
