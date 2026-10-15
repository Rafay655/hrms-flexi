"use client";

import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Toggle } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { RosterTemplate } from "@/app/(system)/time-sync/shifts/types";
import { createPattern } from "@/app/(system)/time-sync/shifts/utils";

function createTemplate(): RosterTemplate {
  return {
    id: 0,
    entity_id: 1,
    template_name: "",
    rotation_cycle_days: 7,
    pattern: createPattern(7),
    auto_rotate: true,
    is_active: true,
    created_by: "Admin User",
  };
}

export default function RosterTemplatesPage() {
  const { data, saveTemplate, deleteTemplate, cloneTemplate, toggleTemplate, getShift } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RosterTemplate>(createTemplate());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.templates.filter((template) => template.template_name.toLowerCase().includes(q));
  }, [data.templates, query]);

  const submit = () => {
    const ok = saveTemplate(form);
    if (ok) {
      setOpen(false);
      setForm(createTemplate());
    }
  };

  const updateDays = (days: number) => {
    const safe = Math.max(1, Math.min(31, Number(days || 1)));
    setForm((current) => {
      const pattern = Array.from({ length: safe }, (_, i) => current.pattern[i] || { day: i + 1, shift_id: null }).map((row, index) => ({
        day: index + 1,
        shift_id: row.shift_id,
      }));
      return { ...current, rotation_cycle_days: safe, pattern };
    });
  };

  return (
    <ModuleShell title="Roster Templates" subtitle="Reusable cycle-based shift rotation patterns for departments, plants, operations and field teams.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:max-w-sm"
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={() => { setForm(createTemplate()); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filtered.map((template) => (
            <Card key={template.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{template.template_name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{template.rotation_cycle_days}-day cycle</p>
                </div>
                <Badge className={template.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {template.pattern.map((row) => (
                  <div key={`${template.id}-${row.day}`} className={`rounded-2xl border p-3 text-center ${row.shift_id ? "border-slate-200 bg-slate-50" : "border-rose-200 bg-rose-50"}`}>
                    <div className="text-xs text-slate-500">Day {row.day}</div>
                    <div className="mt-2 text-xs font-semibold text-slate-900">{getShift(row.shift_id)?.shift_code || "OFF"}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setForm({ ...template, pattern: template.pattern.map((row) => ({ ...row })) }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => cloneTemplate(template.id)}>
                  <Copy className="h-4 w-4" />
                  Clone
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleTemplate(template.id)}>
                  {template.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteTemplate(template.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={open}
        title={form.id ? "Edit Template" : "Create Template"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Update Template" : "Create Template"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Template Name" value={form.template_name} onChange={(v) => setForm((c) => ({ ...c, template_name: v }))} />
          <Input label="Cycle Days" type="number" value={form.rotation_cycle_days} onChange={(v) => updateDays(Number(v))} />
          <div className="pt-8">
            <Toggle label="Auto Rotate" checked={form.auto_rotate} onChange={(v) => setForm((c) => ({ ...c, auto_rotate: v }))} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <div className="mb-4 text-sm font-semibold text-slate-700">Pattern Setup</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {form.pattern.map((row, index) => (
              <div key={row.day} className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-medium text-slate-700">Day {row.day}</div>
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={row.shift_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setForm((current) => {
                      const pattern = [...current.pattern];
                      pattern[index] = { ...pattern[index], shift_id: value };
                      return { ...current, pattern };
                    });
                  }}
                >
                  <option value="">Off Day</option>
                  {data.shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>{shift.shift_code} - {shift.shift_name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </ModuleShell>
  );
}
