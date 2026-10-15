// components/ui/loading-skeleton.tsx
import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 6 }) => (
  <div aria-label="Loading content" className="divide-y divide-slate-50">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4">
        <div className="h-4 w-8 rounded bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-4 w-28 rounded bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-8 w-8 rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
);