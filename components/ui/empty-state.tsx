// components/ui/empty-state.tsx
import React from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Megaphone,
  title,
  description,
  buttonLabel,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
      <Icon className="h-8 w-8 text-slate-400" aria-hidden="true" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
    <Button onClick={onAction} className="mt-2 gap-2 bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
      <Plus className="h-4 w-4" aria-hidden="true" />
      {buttonLabel}
    </Button>
  </div>
);