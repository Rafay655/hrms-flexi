"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import { ModuleShell, Card, Badge, Button, Input, Modal, Select, TextArea } from "@/app/(system)/time-sync/shifts/components";
import { useHrmsShiftModule } from "@/app/(system)/time-sync/shifts/context";
import { ShiftSwapRequest } from "@/app/(system)/time-sync/shifts/types";

function createSwap(): ShiftSwapRequest {
  return {
    id: 0,
    roster_id: 0,
    requester_id: 0,
    target_id: 0,
    requester_entry_id: 0,
    target_entry_id: 0,
    swap_date: "2026-04-01",
    reason: "",
    status: "pending_target",
    target_response_at: null,
    manager_id: null,
    manager_response_at: null,
    rejection_reason: "",
  };
}

export default function ShiftSwapsPage() {
  const { data, getEmployee, getEntry, getShift, saveSwap, cancelSwap, targetAcceptSwap, rejectSwap, approveSwap } = useHrmsShiftModule();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShiftSwapRequest>(createSwap());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.swaps.filter((swap) => {
      const requester = getEmployee(swap.requester_id);
      const target = getEmployee(swap.target_id);
      return (
        requester?.name.toLowerCase().includes(q) ||
        target?.name.toLowerCase().includes(q) ||
        swap.status.toLowerCase().includes(q) ||
        swap.swap_date.includes(q)
      );
    });
  }, [data.swaps, getEmployee, query]);

  const entryOptions = useMemo(() => {
    if (!form.roster_id || !form.swap_date) return [];
    return data.entries.filter(
      (entry) =>
        entry.roster_id === Number(form.roster_id) &&
        entry.roster_date === form.swap_date &&
        !entry.is_holiday &&
        !entry.is_weekly_off &&
        entry.shift_id !== null
    );
  }, [data.entries, form.roster_id, form.swap_date]);

  const submit = () => {
    const ok = saveSwap(form, !!form.id);
    if (ok) {
      setOpen(false);
      setForm(createSwap());
    }
  };

  const statusClass = (status: string) => {
    if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "rejected" || status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <ModuleShell title="Shift Swap Requests" subtitle="Employee shift swaps with target acceptance and manager approval workflow.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none md:max-w-sm"
            placeholder="Search swaps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={() => { setForm(createSwap()); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Swap Request
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Requester",
                    "Target",
                    "Date",
                    "Requester Shift",
                    "Target Shift",
                    "Status",
                    "Reason",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((swap) => {
                  const requesterEntry = getEntry(swap.requester_entry_id);
                  const targetEntry = getEntry(swap.target_entry_id);
                  return (
                    <tr key={swap.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4 font-medium text-slate-900">{getEmployee(swap.requester_id)?.name}</td>
                      <td className="px-4 py-4 text-slate-600">{getEmployee(swap.target_id)?.name}</td>
                      <td className="px-4 py-4 text-slate-600">{swap.swap_date}</td>
                      <td className="px-4 py-4 text-slate-600">{getShift(requesterEntry?.shift_id ?? null)?.shift_name}</td>
                      <td className="px-4 py-4 text-slate-600">{getShift(targetEntry?.shift_id ?? null)?.shift_name}</td>
                      <td className="px-4 py-4"><Badge className={statusClass(swap.status)}>{swap.status}</Badge></td>
                      <td className="px-4 py-4 text-slate-600">{swap.reason || swap.rejection_reason || "—"}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {swap.status === "pending_target" && (
                            <>
                              <Button size="sm" variant="success" onClick={() => targetAcceptSwap(swap.id)}><CheckCircle2 className="h-4 w-4" />Accept</Button>
                              <Button size="sm" variant="danger" onClick={() => rejectSwap(swap.id, "Rejected by target employee", "target")}><XCircle className="h-4 w-4" />Reject</Button>
                              <Button size="sm" variant="secondary" onClick={() => cancelSwap(swap.id)}><Trash2 className="h-4 w-4" />Cancel</Button>
                            </>
                          )}
                          {swap.status === "pending_manager" && (
                            <>
                              <Button size="sm" variant="success" onClick={() => approveSwap(swap.id)}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                              <Button size="sm" variant="danger" onClick={() => rejectSwap(swap.id, "Rejected by manager", "manager")}><XCircle className="h-4 w-4" />Reject</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        title="Create Swap Request"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create Request</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Roster"
            value={form.roster_id}
            onChange={(v) => setForm((c) => ({ ...c, roster_id: Number(v) }))}
            options={data.rosters.map((roster) => ({ value: roster.id, label: roster.roster_name }))}
          />
          <Input label="Swap Date" type="date" value={form.swap_date} onChange={(v) => setForm((c) => ({ ...c, swap_date: v }))} />
          <div />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Requester Entry"
            value={form.requester_entry_id}
            onChange={(v) => {
              const entry = data.entries.find((e) => e.id === Number(v));
              setForm((c) => ({ ...c, requester_entry_id: Number(v), requester_id: entry?.employee_id || 0 }));
            }}
            options={entryOptions.map((entry) => ({
              value: entry.id,
              label: `${getEmployee(entry.employee_id)?.name} - ${getShift(entry.shift_id)?.shift_name}`,
            }))}
          />
          <Select
            label="Target Entry"
            value={form.target_entry_id}
            onChange={(v) => {
              const entry = data.entries.find((e) => e.id === Number(v));
              setForm((c) => ({ ...c, target_entry_id: Number(v), target_id: entry?.employee_id || 0 }));
            }}
            options={entryOptions.map((entry) => ({
              value: entry.id,
              label: `${getEmployee(entry.employee_id)?.name} - ${getShift(entry.shift_id)?.shift_name}`,
            }))}
          />
        </div>

        <div className="mt-6">
          <TextArea label="Reason" value={form.reason} onChange={(v) => setForm((c) => ({ ...c, reason: v }))} />
        </div>
      </Modal>
    </ModuleShell>
  );
}
