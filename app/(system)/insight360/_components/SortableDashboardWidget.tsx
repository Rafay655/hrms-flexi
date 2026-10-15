"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableDashboardWidget({ id, disabled, columnSpan, children }: {
  id: string;
  disabled: boolean;
  columnSpan: 1 | 2;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative min-w-0 ${columnSpan === 2 ? "xl:col-span-2" : ""} ${isDragging ? "z-20 opacity-70" : ""}`}>
      {!disabled && (
        <button type="button" {...attributes} {...listeners} aria-label="Reorder dashboard widget" className="transition-colors absolute right-16 top-5 z-10 flex h-11 w-11 cursor-grab items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 active:cursor-grabbing">
          <GripVertical aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
}
