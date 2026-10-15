"use client";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EmployeeLinkProps {
  employeeId: string | number;
  employeeName: string;
  showAvatar?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function EmployeeLink({
  employeeId,
  employeeName,
  showAvatar = false,
  size = "md",
  className = "",
}: EmployeeLinkProps) {
  const initials = employeeName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Generate consistent color from name
  const colors = [
    "bg-brand-800",
    "bg-brand-700",
    "bg-brand-600",
    "bg-emerald-600",
    "bg-blue-600",
    "bg-violet-600",
  ];
  const colorIndex = employeeName.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <Link
      href={`/people-hub/employees/${employeeId}`}
      className={`inline-flex items-center gap-2 text-brand-800 hover:text-brand-600 hover:underline underline-offset-2 transition-colors ${
        size === "sm" ? "text-xs" : "text-sm"
      } font-medium ${className}`}
    >
      {showAvatar && (
        <Avatar className={size === "sm" ? "h-6 w-6" : "h-7 w-7"}>
          <AvatarFallback
            className={`${avatarColor} text-white text-[10px] font-semibold`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      {employeeName}
    </Link>
  );
}
