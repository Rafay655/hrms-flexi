"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ModuleItem } from "@/lib/sidebarData";

const ICONS = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;

export interface ModuleGridPanelProps {
  title: string;
  modules: ModuleItem[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

export default function ModuleGridPanel({ title, modules, activeId, onSelect }: ModuleGridPanelProps) {
  const [search, setSearch] = useState("");
  const filtered = modules.filter((module) => module.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <div className="font-sidebar flex max-h-[min(640px,80dvh)] flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 pt-4 pb-3">
        <h2 className="text-[13px] font-semibold text-[#322E53]">{title}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{title === "Admin Center" ? "Manage your workspace and organization." : "Switch to another workspace module."}</p>
        <div className="mt-3 flex h-9 items-center gap-2 rounded-none border border-slate-200 bg-slate-50/60 px-2.5 focus-within:border-[#322E53]/40 focus-within:ring-2 focus-within:ring-[#322E53]/5">
          <Icons.Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input aria-label={`Search ${title.toLowerCase()}`} placeholder="Search modules…" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-800 outline-none placeholder:text-slate-400" />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="rounded p-1 text-slate-400 hover:text-slate-700"><Icons.X className="h-3 w-3" /></button>}
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {filtered.map((module) => {
            const Icon = ICONS[module.icon as string] ?? Icons.Square;
            const active = activeId === module.id;
            return <button key={module.id} type="button" onClick={() => onSelect(module.id)} aria-pressed={active} className={`flex min-h-14 items-center gap-2.5 rounded-none px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#322E53] ${active ? "bg-[#322E53]/[0.07] text-[#322E53]" : "text-slate-600 hover:bg-slate-50 hover:text-[#322E53]"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${active ? "bg-[#322E53] text-white" : "bg-slate-100/80 text-[#322E53]/70"}`}><Icon className="h-4 w-4" strokeWidth={1.7} /></span>
              <span className="flex-1 text-[12px] font-medium leading-5">{module.name}</span>
              {active && <Icons.Check className="h-3.5 w-3.5 shrink-0" />}
            </button>;
          })}
        </div>
        {filtered.length === 0 && <p className="px-4 py-10 text-center text-[12px] text-slate-500">No modules found. Try another name.</p>}
      </div>
      <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">{filtered.length} of {modules.length} modules</div>
    </div>
  );
}
