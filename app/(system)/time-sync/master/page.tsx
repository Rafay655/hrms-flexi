
"use client";

import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Select, Toggle } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { Shift } from "@/app/(system)/time-sync/shifts/types";
import { weekDays } from "@/app/(system)/time-sync/shifts/utils";

function createShift(): Shift {
  return {
    id: 0,
    entity_id: 1,
    shift_code: "",
    shift_name: "",
    shift_type: "fixed",
    start_time: "09:00",
    end_time: "18:00",
    is_cross_day: false,
    break_start: "13:00",
    break_end: "14:00",
    break_minutes: 60,
    working_minutes: 480,
    grace_in_minutes: 15,
    grace_out_minutes: 10,
    buffer_in_minutes: 30,
    buffer_out_minutes: 30,
    overtime_allowed: true,
    max_ot_minutes: 120,
    ot_requires_approval: true,
    night_premium_applicable: false,
    night_premium_rate: null,
    working_days: [1, 2, 3, 4, 5],
    weekly_off_days: [6, 7],
    late_mark_after_minutes: 16,
    half_day_threshold_minutes: 240,
    absent_threshold_minutes: 300,
    min_rest_between_shifts_hours: 10,
    max_consecutive_days: 6,
    early_clock_in_rounding_minutes: 15,
    late_clock_out_rounding_minutes: 15,
    paid_break_minutes: 15,
    unpaid_break_minutes: 45,
    geo_fence_required: false,
    requires_biometric: true,
    requires_manager_override: true,
    color_code: "#4F46E5",
    is_active: true,
    rules: [1, 2, 3, 5, 6, 7],
  };
}

export default function ShiftMasterPage() {
  const { data, saveShift, deleteShift, duplicateShift, toggleShift } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Shift>(createShift());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.shifts.filter(
      (shift) =>
        shift.shift_name.toLowerCase().includes(q) ||
        shift.shift_code.toLowerCase().includes(q) ||
        shift.shift_type.toLowerCase().includes(q)
    );
  }, [data.shifts, query]);

  const submit = () => {
    const ok = saveShift(form);
    if (ok) {
      setOpen(false);
      setForm(createShift());
    }
  };

  const toggleMulti = (key: "working_days" | "weekly_off_days", value: number) => {
    setForm((current) => {
      const exists = current[key].includes(value);
      const next = exists ? current[key].filter((item) => item !== value) : [...current[key], value];
      return { ...current, [key]: next.sort((a, b) => a - b) };
    });
  };

  return (
    <ModuleShell title="Shift Master" subtitle="Create and manage shift definitions, break policies, weekly offs and attendance rules.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:max-w-sm"
            placeholder="Search shifts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={() => { setForm(createShift()); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Shift
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filtered.map((shift) => (
            <Card key={shift.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: shift.color_code }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{shift.shift_name}</h3>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">{shift.shift_code}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 capitalize">{shift.shift_type} • {shift.start_time} - {shift.end_time}</p>
                  </div>
                  <Badge className={shift.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                    {shift.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">Break: {shift.break_minutes} mins</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Working: {shift.working_minutes} mins</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Grace: {shift.grace_in_minutes}/{shift.grace_out_minutes}</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Weekly Off: {shift.weekly_off_days.join(", ")}</div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setForm(shift); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => duplicateShift(shift.id)}>
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleShift(shift.id)}>
                    {shift.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteShift(shift.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={open}
        title={form.id ? "Edit Shift" : "Create Shift"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Update Shift" : "Create Shift"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Shift Code" value={form.shift_code} onChange={(v) => setForm((c) => ({ ...c, shift_code: v }))} />
          <Input label="Shift Name" value={form.shift_name} onChange={(v) => setForm((c) => ({ ...c, shift_name: v }))} />
          <Select
            label="Shift Type"
            value={form.shift_type}
            onChange={(v) => setForm((c) => ({ ...c, shift_type: v as Shift["shift_type"] }))}
            options={[
              { value: "fixed", label: "Fixed" },
              { value: "rotational", label: "Rotational" },
              { value: "flexible", label: "Flexible" },
              { value: "split", label: "Split" },
            ]}
          />
          <Input label="Color" value={form.color_code} onChange={(v) => setForm((c) => ({ ...c, color_code: v }))} />
          <Input label="Start Time" type="time" value={form.start_time} onChange={(v) => setForm((c) => ({ ...c, start_time: v }))} />
          <Input label="End Time" type="time" value={form.end_time} onChange={(v) => setForm((c) => ({ ...c, end_time: v }))} />
          <Input label="Break Start" type="time" value={form.break_start} onChange={(v) => setForm((c) => ({ ...c, break_start: v }))} />
          <Input label="Break End" type="time" value={form.break_end} onChange={(v) => setForm((c) => ({ ...c, break_end: v }))} />
          <Input label="Break Minutes" type="number" value={form.break_minutes} onChange={(v) => setForm((c) => ({ ...c, break_minutes: Number(v) }))} />
          <Input label="Paid Break Minutes" type="number" value={form.paid_break_minutes} onChange={(v) => setForm((c) => ({ ...c, paid_break_minutes: Number(v) }))} />
          <Input label="Unpaid Break Minutes" type="number" value={form.unpaid_break_minutes} onChange={(v) => setForm((c) => ({ ...c, unpaid_break_minutes: Number(v) }))} />
          <Input label="Grace In Minutes" type="number" value={form.grace_in_minutes} onChange={(v) => setForm((c) => ({ ...c, grace_in_minutes: Number(v) }))} />
          <Input label="Grace Out Minutes" type="number" value={form.grace_out_minutes} onChange={(v) => setForm((c) => ({ ...c, grace_out_minutes: Number(v) }))} />
          <Input label="Buffer In Minutes" type="number" value={form.buffer_in_minutes} onChange={(v) => setForm((c) => ({ ...c, buffer_in_minutes: Number(v) }))} />
          <Input label="Buffer Out Minutes" type="number" value={form.buffer_out_minutes} onChange={(v) => setForm((c) => ({ ...c, buffer_out_minutes: Number(v) }))} />
          <Input label="Late Mark After" type="number" value={form.late_mark_after_minutes} onChange={(v) => setForm((c) => ({ ...c, late_mark_after_minutes: Number(v) }))} />
          <Input label="Half Day Threshold" type="number" value={form.half_day_threshold_minutes} onChange={(v) => setForm((c) => ({ ...c, half_day_threshold_minutes: Number(v) }))} />
          <Input label="Absent Threshold" type="number" value={form.absent_threshold_minutes} onChange={(v) => setForm((c) => ({ ...c, absent_threshold_minutes: Number(v) }))} />
          <Input label="Min Rest Gap Hours" type="number" value={form.min_rest_between_shifts_hours} onChange={(v) => setForm((c) => ({ ...c, min_rest_between_shifts_hours: Number(v) }))} />
          <Input label="Max Consecutive Days" type="number" value={form.max_consecutive_days} onChange={(v) => setForm((c) => ({ ...c, max_consecutive_days: Number(v) }))} />
          <Input label="Early In Rounding" type="number" value={form.early_clock_in_rounding_minutes} onChange={(v) => setForm((c) => ({ ...c, early_clock_in_rounding_minutes: Number(v) }))} />
          <Input label="Late Out Rounding" type="number" value={form.late_clock_out_rounding_minutes} onChange={(v) => setForm((c) => ({ ...c, late_clock_out_rounding_minutes: Number(v) }))} />
          <Input label="Max OT Minutes" type="number" value={form.max_ot_minutes ?? 0} onChange={(v) => setForm((c) => ({ ...c, max_ot_minutes: Number(v) }))} />
          <Input label="Night Premium Rate" type="number" value={form.night_premium_rate ?? 1.25} onChange={(v) => setForm((c) => ({ ...c, night_premium_rate: Number(v) }))} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">Working Days</div>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleMulti("working_days", day.id)}
                  className={`rounded-xl border px-3 py-2 text-sm ${form.working_days.includes(day.id) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">Weekly Off Days</div>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleMulti("weekly_off_days", day.id)}
                  className={`rounded-xl border px-3 py-2 text-sm ${form.weekly_off_days.includes(day.id) ? "border-rose-600 bg-rose-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Toggle label="Overtime Allowed" checked={form.overtime_allowed} onChange={(v) => setForm((c) => ({ ...c, overtime_allowed: v }))} />
          <Toggle label="OT Requires Approval" checked={form.ot_requires_approval} onChange={(v) => setForm((c) => ({ ...c, ot_requires_approval: v }))} />
          <Toggle label="Night Premium Applicable" checked={form.night_premium_applicable} onChange={(v) => setForm((c) => ({ ...c, night_premium_applicable: v }))} />
          <Toggle label="Geo Fence Required" checked={form.geo_fence_required} onChange={(v) => setForm((c) => ({ ...c, geo_fence_required: v }))} />
          <Toggle label="Biometric Required" checked={form.requires_biometric} onChange={(v) => setForm((c) => ({ ...c, requires_biometric: v }))} />
          <Toggle label="Manager Override Required" checked={form.requires_manager_override} onChange={(v) => setForm((c) => ({ ...c, requires_manager_override: v }))} />
        </div>
      </Modal>
    </ModuleShell>
  );
}
