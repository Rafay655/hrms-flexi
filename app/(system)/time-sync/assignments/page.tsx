"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Select } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { EmployeeShiftAssignment } from "@/app/(system)/time-sync/shifts/types";

function createAssignment(): EmployeeShiftAssignment {
  return {
    id: 0,
    employee_id: 0,
    shift_id: 0,
    valid_from: "2026-04-01",
    valid_to: "",
    assignment_type: "default",
    assigned_by: "Admin User",
  };
}

export default function AssignmentsPage() {
  const { data, getEmployee, getShift, saveAssignment, deleteAssignment } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeShiftAssignment>(createAssignment());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.assignments.filter((assignment) => {
      const employee = getEmployee(assignment.employee_id);
      const shift = getShift(assignment.shift_id);
      return (
        employee?.name.toLowerCase().includes(q) ||
        employee?.code.toLowerCase().includes(q) ||
        shift?.shift_name.toLowerCase().includes(q) ||
        assignment.assignment_type.toLowerCase().includes(q)
      );
    });
  }, [data.assignments, getEmployee, getShift, query]);

  const submit = () => {
    const ok = saveAssignment(form);
    if (ok) {
      setOpen(false);
      setForm(createAssignment());
    }
  };

  return (
    <ModuleShell title="Employee Shift Assignments" subtitle="Default, temporary and override-level employee shift mapping with overlap validation.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:max-w-sm"
            placeholder="Search assignments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={() => { setForm(createAssignment()); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Employee",
                    "Code",
                    "Shift",
                    "Valid From",
                    "Valid To",
                    "Type",
                    "Assigned By",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4 font-medium text-slate-900">{getEmployee(assignment.employee_id)?.name}</td>
                    <td className="px-4 py-4 text-slate-600">{getEmployee(assignment.employee_id)?.code}</td>
                    <td className="px-4 py-4 text-slate-600">{getShift(assignment.shift_id)?.shift_name}</td>
                    <td className="px-4 py-4 text-slate-600">{assignment.valid_from}</td>
                    <td className="px-4 py-4 text-slate-600">{assignment.valid_to || "Open Ended"}</td>
                    <td className="px-4 py-4"><Badge className="border-slate-200 bg-slate-50 text-slate-700 capitalize">{assignment.assignment_type}</Badge></td>
                    <td className="px-4 py-4 text-slate-600">{assignment.assigned_by}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setForm(assignment); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteAssignment(assignment.id)}>
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
        title={form.id ? "Edit Assignment" : "Create Assignment"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Update Assignment" : "Create Assignment"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Employee"
            value={form.employee_id}
            onChange={(v) => setForm((c) => ({ ...c, employee_id: Number(v) }))}
            options={data.assignments
              .map((a) => a.employee_id)
              .filter((value, index, arr) => arr.indexOf(value) === index)
              .map((id) => ({ value: id, label: `${getEmployee(id)?.name} (${getEmployee(id)?.code})` }))}
          />
          <Select
            label="Shift"
            value={form.shift_id}
            onChange={(v) => setForm((c) => ({ ...c, shift_id: Number(v) }))}
            options={data.shifts.map((shift) => ({ value: shift.id, label: `${shift.shift_code} - ${shift.shift_name}` }))}
          />
          <Input label="Valid From" type="date" value={form.valid_from} onChange={(v) => setForm((c) => ({ ...c, valid_from: v }))} />
          <Input label="Valid To" type="date" value={form.valid_to} onChange={(v) => setForm((c) => ({ ...c, valid_to: v }))} />
          <Select
            label="Assignment Type"
            value={form.assignment_type}
            onChange={(v) => setForm((c) => ({ ...c, assignment_type: v as EmployeeShiftAssignment["assignment_type"] }))}
            options={[
              { value: "default", label: "Default" },
              { value: "temporary", label: "Temporary" },
              { value: "override", label: "Override" },
            ]}
          />
          <Input label="Assigned By" value={form.assigned_by} onChange={(v) => setForm((c) => ({ ...c, assigned_by: v }))} />
        </div>
      </Modal>
    </ModuleShell>
  );
}
