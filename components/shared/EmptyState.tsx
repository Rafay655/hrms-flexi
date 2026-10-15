import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
        <Icon className="h-8 w-8 text-brand-700" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-brand-900">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-brand-800 text-white hover:bg-brand-700"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
