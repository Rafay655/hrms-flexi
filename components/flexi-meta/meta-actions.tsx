"use client";

import type { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function MetaActions({ children }: { children: ReactNode }) {
  return <div className="flex justify-center">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Row actions" className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">{children}</DropdownMenuContent>
    </DropdownMenu>
  </div>;
}

export function MetaAction({ label, children, onSelect, disabled }: {
  label: string;
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return <DropdownMenuItem disabled={disabled} onSelect={onSelect} className={label === "Delete" ? "text-destructive focus:text-destructive" : undefined}>
    {children}<span>{label}</span>
  </DropdownMenuItem>;
}
