"use client";

import { ModuleShell, Card, Badge } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";

export default function RulesPage() {
  const { data } = useHrmsShiftModule();

  const groups = [
    "attendance",
    "break",
    "overtime",
    "premium",
    "compliance",
    "weekoff",
  ] as const;

  return (
    <ModuleShell title="Rules & Policies" subtitle="Reusable rule presets and enterprise attendance logic references for shift and roster setup.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {groups.map((group) => (
          <Card key={group} className="p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold capitalize text-slate-900">{group}</h2>
              <Badge className="border-slate-200 bg-slate-50 text-slate-700">{data.rulePresets.filter((rule) => rule.category === group).length}</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {data.rulePresets
                .filter((rule) => rule.category === group)
                .map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">{rule.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{rule.description}</div>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </ModuleShell>
  );
}