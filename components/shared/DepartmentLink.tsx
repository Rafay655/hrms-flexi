"use client";

import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

type DepartmentLinkProps = {
  deptName: string;
  showIcon?: boolean;
  className?: string;
};

/**
 * Clickable department reference that navigates to Flexi Meta departments
 * with an optional filter applied via query string.
 */
export default function DepartmentLink({
  deptName,
  showIcon = false,
  className = "",
}: DepartmentLinkProps) {
  const href = `/flexi-meta/departments?filter=${encodeURIComponent(deptName)}`;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-indigo-900 underline-offset-2 hover:underline ${className}`}
    >
      {showIcon && <Building2 className="h-3 w-3 text-slate-400" />}
      <span>{deptName}</span>
    </Link>
  );
}
