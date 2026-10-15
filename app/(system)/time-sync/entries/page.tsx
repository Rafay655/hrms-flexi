"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Select, TextArea, Toggle } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { RosterEntry } from "@/app/(system)/time-sync/shifts/types";

function createEntry(): RosterEntry {
  return {
    id: 0,
    roster_id: 0,
    employee_id: 0,
    roster_date: "2026-04-01",
    shift_id: null,
    is_weekly_off: false,
    is_holiday: false,
    notes: "",
  };
}

export default function RosterEntriesPage() {
  const { data, getEmployee, getShift, saveEntry, deleteEntry } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [rosterFilter, setRosterFilter] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RosterEntry>(createEntry());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.entries.filter((entry) => {
      const employee = getEmployee(entry.employee_id);
      const shift = getShift(entry.shift_id);
      const roster = data.rosters.find((r) => r.id === entry.roster_id);
      const matchesQuery =
        employee?.name.toLowerCase().includes(q) ||
        employee?.code.toLowerCase().includes(q) ||
        shift?.shift_name.toLowerCase().includes(q) ||
        roster?.roster_name.toLowerCase().includes(q) ||
        entry.roster_date.includes(q) ||
        entry.notes.toLowerCase().includes(q);
      const matchesRoster = rosterFilter ? entry.roster_id === Number(rosterFilter) : true;
      return Boolean(matchesQuery) && matchesRoster;
    });
  }, [data.entries, data.rosters, getEmployee, getShift, query, rosterFilter]);

  const submit = () => {
    const ok = saveEntry(form);
    if (ok) {
      setOpen(false);
      setForm(createEntry());
    }
  };

  return (
    <ModuleShell title="Roster Entries" subtitle="Manage day-level employee shift assignments, weekly off flags, holiday overrides and notes.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:w-80"
              placeholder="Search entries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="h-11 rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none"
              value={rosterFilter}
              onChange={(e) => setRosterFilter(e.target.value)}
            >
              <option value="">All Rosters</option>
              {data.rosters.map((roster) => (
                <option key={roster.id} value={roster.id}>{roster.roster_name}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => { setForm(createEntry()); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Roster",
                    "Employee",
                    "Date",
                    "Shift",
                    "Weekly Off",
                    "Holiday",
                    "Notes",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4 text-slate-600">{data.rosters.find((r) => r.id === entry.roster_id)?.roster_name}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{getEmployee(entry.employee_id)?.name}</td>
                    <td className="px-4 py-4 text-slate-600">{entry.roster_date}</td>
                    <td className="px-4 py-4 text-slate-600">{getShift(entry.shift_id)?.shift_name || "Off Day"}</td>
                    <td className="px-4 py-4">{entry.is_weekly_off ? <Badge className="border-rose-200 bg-rose-50 text-rose-700">Yes</Badge> : <Badge className="border-slate-200 bg-slate-50 text-slate-700">No</Badge>}</td>
                    <td className="px-4 py-4">{entry.is_holiday ? <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">Holiday</Badge> : <Badge className="border-slate-200 bg-slate-50 text-slate-700">No</Badge>}</td>
                    <td className="px-4 py-4 text-slate-600">{entry.notes || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setForm(entry); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
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
        title={form.id ? "Edit Entry" : "Create Entry"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Update Entry" : "Create Entry"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Roster"
            value={form.roster_id}
            onChange={(v) => setForm((c) => ({ ...c, roster_id: Number(v) }))}
            options={data.rosters.map((roster) => ({ value: roster.id, label: roster.roster_name }))}
          />
          <Select
            label="Employee"
            value={form.employee_id}
            onChange={(v) => setForm((c) => ({ ...c, employee_id: Number(v) }))}
            options={data.assignments.map((a) => ({ value: a.employee_id, label: `${getEmployee(a.employee_id)?.name} (${getEmployee(a.employee_id)?.code})` }))}
          />
          <Input label="Roster Date" type="date" value={form.roster_date} onChange={(v) => setForm((c) => ({ ...c, roster_date: v }))} />
          <Select
            label="Shift"
            value={form.shift_id ?? ""}
            onChange={(v) => setForm((c) => ({ ...c, shift_id: v ? Number(v) : null }))}
            options={[
              { value: "", label: "Off Day" },
              ...data.shifts.map((shift) => ({ value: shift.id, label: `${shift.shift_code} - ${shift.shift_name}` })),
            ]}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Toggle label="Weekly Off" checked={form.is_weekly_off} onChange={(v) => setForm((c) => ({ ...c, is_weekly_off: v }))} />
          <Toggle label="Holiday" checked={form.is_holiday} onChange={(v) => setForm((c) => ({ ...c, is_holiday: v }))} />
        </div>

        <div className="mt-6">
          <TextArea label="Notes" value={form.notes} onChange={(v) => setForm((c) => ({ ...c, notes: v }))} />
        </div>
      </Modal>
    </ModuleShell>
  );
}
