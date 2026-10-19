"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectEdgePerson } from "@/types/projectedge";

export function PersonLabel({ person, fallback = "Unassigned" }: {
  person?: ProjectEdgePerson | null;
  fallback?: string;
}) {
  if (!person) return <span>{fallback}</span>;
  const initials = person.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar size="sm" aria-hidden="true">
        {person.avatar && <AvatarImage src={person.avatar} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span>{person.name}</span>
    </span>
  );
}
