"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2, Upload, Lock, RotateCcw } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Select, Toggle } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { Roster } from "@/app/(system)/time-sync/shifts/types";

function createRoster(): Roster {
  return {
    id: 0,
    entity_id: 1,
    roster_name: "",
    start_date: "2026-04-01",
    end_date: "2026-04-07",
    template_id: null,
    status: "draft",
    total_employees: 0,
    published_at: null,
    published_by: null,
    created_by: "Admin User",
  };
}

export default function RostersPage() {
  const { data, saveRoster, generateEntriesForRoster, publishRoster, lockRoster, reopenRoster, deleteRoster } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [form, setForm] = useState<Roster>(createRoster());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.rosters.filter((roster) => roster.roster_name.toLowerCase().includes(q));
  }, [data.rosters, query]);

  const submit = () => {
    const ok = saveRoster(form, autoGenerate);
    if (ok) {
      setOpen(false);
      setForm(createRoster());
      setAutoGenerate(true);
    }
  };

  const statusClass = (status: string) => {
    if (status === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "locked") return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <ModuleShell title="Rosters" subtitle="Create roster periods, auto-generate entries, publish to employees and lock before payroll.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:max-w-sm"
            placeholder="Search rosters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={() => { setForm(createRoster()); setAutoGenerate(true); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Roster
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Roster Name",
                    "Date Range",
                    "Template",
                    "Employees",
                    "Status",
                    "Published",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((roster) => (
                  <tr key={roster.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4 font-medium text-slate-900">{roster.roster_name}</td>
                    <td className="px-4 py-4 text-slate-600">{roster.start_date} → {roster.end_date}</td>
                    <td className="px-4 py-4 text-slate-600">{data.templates.find((t) => t.id === roster.template_id)?.template_name || "Manual / Assignments"}</td>
                    <td className="px-4 py-4 text-slate-600">{roster.total_employees}</td>
                    <td className="px-4 py-4"><Badge className={statusClass(roster.status)}>{roster.status}</Badge></td>
                    <td className="px-4 py-4 text-slate-600">{roster.published_at || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setForm(roster); setAutoGenerate(false); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />

                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => generateEntriesForRoster(roster.id)}>
                          <RefreshCcw className="h-4 w-4" />
                          
                        </Button>
                        {roster.status === "draft" && <Button size="sm" variant="success" onClick={() => publishRoster(roster.id)}><Upload className="h-4 w-4" /></Button>}
                        {roster.status !== "locked" && <Button size="sm" variant="secondary" onClick={() => lockRoster(roster.id)}><Lock className="h-4 w-4" /></Button>}
                        {roster.status === "locked" && <Button size="sm" variant="secondary" onClick={() => reopenRoster(roster.id)}><RotateCcw className="h-4 w-4" /></Button>}
                        <Button size="sm" variant="danger" onClick={() => deleteRoster(roster.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        title={form.id ? "Edit Roster" : "Create Roster"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Update Roster" : "Create Roster"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Roster Name" value={form.roster_name} onChange={(v) => setForm((c) => ({ ...c, roster_name: v }))} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(v) => setForm((c) => ({ ...c, start_date: v }))} />
          <Input label="End Date" type="date" value={form.end_date} onChange={(v) => setForm((c) => ({ ...c, end_date: v }))} />
          <Select
            label="Template"
            value={form.template_id ?? ""}
            onChange={(v) => setForm((c) => ({ ...c, template_id: v ? Number(v) : null }))}
            options={[
              { value: "", label: "Manual / Employee Assignments" },
              ...data.templates.map((template) => ({ value: template.id, label: template.template_name })),
            ]}
          />
        </div>

        <div className="mt-6">
          <Toggle label="Auto Generate Entries After Save" checked={autoGenerate} onChange={setAutoGenerate} />
        </div>
      </Modal>
    </ModuleShell>
  );
}
