"use client";

import { ArrowRightLeft, Calendar, Clock3, GitBranch, RefreshCcw, UserCheck } from "lucide-react";
import { ModuleShell, Card, Button } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";

export default function ShiftOverviewPage() {
  const { data, resetDemoData, exportSnapshot } = useHrmsShiftModule();

  const cards = [
    { title: "Shift Definitions", value: data.shifts.length, hint: "Master shift templates", icon: Clock3 },
    { title: "Roster Templates", value: data.templates.length, hint: "Reusable rotations", icon: GitBranch },
    { title: "Rosters", value: data.rosters.length, hint: "Draft, published and locked", icon: Calendar },
    { title: "Assignments", value: data.assignments.length, hint: "Default / temporary / override", icon: UserCheck },
    { title: "Open Swaps", value: data.swaps.filter((s) => s.status === "pending_target" || s.status === "pending_manager").length, hint: "Need action", icon: ArrowRightLeft },
  ];

  return (
    <ModuleShell
      title="Shift, Roster & Compliance Overview"
      subtitle="One place to manage modern enterprise shift planning with roster generation, swaps, rules and assignment validation."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900">Module features</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div>• Working shift CRUD with validations</div>
              <div>• Rotation templates with cycle patterns</div>
              <div>• Roster generation from assignments or templates</div>
              <div>• Publish / lock / reopen flow</div>
              <div>• Entry-level manual overrides</div>
              <div>• Target + manager swap approval flow</div>
              <div>• Overlap validation for employee assignments</div>
              <div>• Local persistence and export snapshot</div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={exportSnapshot}>Export Snapshot</Button>
              <Button variant="secondary" onClick={resetDemoData}>
                <RefreshCcw className="h-4 w-4" />
                Reset Demo Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}
