import React from "react";
 enum PayrollStatus {
  Draft = "Draft",
  Pending = "Pending",
  Approved = "Approved",
  Locked = "Locked",
  Published = "Published",
}
interface StatusBadgeProps {
  status: PayrollStatus;
  className?: string;
}

const statusStyles: Record<PayrollStatus, string> = {
  [PayrollStatus.Draft]:
    "bg-gray-100 text-gray-700 border-gray-200",
  [PayrollStatus.Pending]:
    "bg-amber-50 text-amber-700 border-amber-200",
  [PayrollStatus.Approved]:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  [PayrollStatus.Locked]:
    "bg-violet-50 text-violet-700 border-violet-200",
  [PayrollStatus.Published]:
    "bg-blue-50 text-blue-700 border-blue-200",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusStyles[status]} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;