"use client";

/**
 * ModuleGrid — branded module switcher panel used inside the top-bar dropdowns
 * (HRMS Modules + Admin Center) in DashboardHeader.
 *
 * Visual design from the FlexiHrmsModuleGrid reference: a purple gradient header
 * with the Flexi HRMS lockup + gold accent rule, a 2/4-column grid of icon-chip
 * tiles (resting / hover-lift / active = ink fill + gold ring), and a footer
 * showing the module count and the active module label.
 *
 * Data comes from the app's `modules` registry (lib/sidebarData); icons are
 * lucide-react names resolved at render time. Selecting a tile calls onSelect
 * with the module id (DashboardHeader maps it to a route + active-module state).
 */

import React, { useState } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ModuleItem } from "@/lib/sidebarData";

/* Flexi HRMS brand palette (product-only, never mixed with corporate blue) */
const INK = "#322E53"; // primary purple
const INK_SOFT = "#49426E"; // secondary purple
const GOLD = "#EEC293"; // warm accent -> active marker
const CORAL = "#F3AB9D"; // warm accent -> reserved, header gradient only
const CHIP = "#F4F3F8"; // resting icon chip
const CHIP_HOVER = "#ECE9F5";

const ICONS = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;

function ModuleTile({
  module,
  active,
  onSelect,
}: {
  module: ModuleItem;
  active: boolean;
  onSelect: (id: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const Icon = ICONS[module.icon as string] ?? Icons.Square;
  const filled = active;

  return (
    <button
      type="button"
      onClick={() => onSelect(module.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group flex flex-col items-center gap-2.5 rounded-2xl px-2 py-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      style={
        {
          backgroundColor: hover && !filled ? "rgba(50,46,83,0.04)" : "transparent",
          "--tw-ring-color": GOLD,
        } as React.CSSProperties
      }
      aria-pressed={active}
      title={module.name}
    >
      <span
        className="relative flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: 60,
          height: 60,
          backgroundColor: filled ? INK : hover ? CHIP_HOVER : CHIP,
          boxShadow: filled
            ? "0 10px 22px -8px rgba(50,46,83,0.6)"
            : hover
            ? "0 6px 14px -8px rgba(50,46,83,0.3)"
            : "none",
          transform: hover && !filled ? "translateY(-2px)" : "translateY(0)",
          outline: filled ? "2px solid " + GOLD : "none",
          outlineOffset: filled ? 3 : 0,
        }}
      >
        <Icon size={24} strokeWidth={1.8} color={filled ? "#FFFFFF" : INK_SOFT} />
      </span>
      <span
        className="text-center text-[12.5px] leading-tight"
        style={{ color: filled ? INK : "#5A5670", fontWeight: filled ? 600 : 500 }}
      >
        {module.name}
      </span>
    </button>
  );
}

export interface ModuleGridPanelProps {
  /** Sub-label under the "Flexi HRMS" lockup, e.g. "Modules" or "Admin Center". */
  title: string;
  modules: ModuleItem[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

export default function ModuleGridPanel({
  title,
  modules,
  activeId,
  onSelect,
}: ModuleGridPanelProps) {
  const activeLabel = modules.find((m) => m.id === activeId)?.name;

  return (
    <div className="flex max-h-[80vh] flex-col bg-white">
      {/* Branded header shell (pinned) */}
      <div
        className="relative shrink-0 px-7 pb-6 pt-5"
        style={{
          background:
            "linear-gradient(135deg, " + INK + " 0%, " + INK_SOFT + " 78%, #5B4F7E 100%)",
        }}
      >
        {/* reserved coral touch: faint corner glow */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-25 blur-2xl"
          style={{ background: "radial-gradient(circle, " + CORAL + ", transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid " + GOLD + "55",
            }}
          >
            <Icons.LayoutGrid size={20} color={GOLD} strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <div className="text-[17px] font-bold tracking-tight text-white">
              Flexi <span style={{ color: GOLD, fontWeight: 700 }}>HRMS</span>
            </div>
            <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.62)" }}>
              {title}
            </div>
          </div>
        </div>
        {/* gold accent rule */}
        <div
          className="mt-5 h-[3px] w-16 rounded-full"
          style={{ background: "linear-gradient(to right, " + GOLD + ", " + CORAL + ")" }}
        />
      </div>

      {/* Module grid (scrolls when the module list overflows the panel) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
          {modules.map((m) => (
            <ModuleTile
              key={m.id}
              module={m}
              active={activeId === m.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* Branded footer line (pinned) */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#EFEDF4] bg-white px-6 py-3.5">
        <span
          className="flex items-center gap-2 text-[12px] font-medium"
          style={{ color: "#7A768C" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
          {modules.length} modules
        </span>
        {activeLabel && (
          <span className="text-[12px] font-semibold" style={{ color: INK_SOFT }}>
            {activeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
