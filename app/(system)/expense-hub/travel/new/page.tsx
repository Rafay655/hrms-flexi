"use client";

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { expenseHubService } from "@/services/expense-hub";
import { searchLetterEmployees, type LetterEmployeeOption } from "@/services/letterforge-employee-search";
import type { TripType, TravelRequestPayload } from "@/types/expense-hub";

export default function TravelBuilderPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<LetterEmployeeOption | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    trip_type: "domestic" as TripType,
    destination_city: "",
    purpose: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    estimated_amount: "",
    advance_amount: "",
  });

  const { data: results = [] } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () => searchLetterEmployees(search),
    enabled: search.trim().length >= 2 && !employee,
  });

  const submit = useMutation({
    mutationFn: async () => {
      // Build the payload with the correct type
      const payload: TravelRequestPayload = {
        employee_id: employee ? Number(employee.uuid) : undefined, // convert to number
        trip_type: form.trip_type,
        destination_city: form.destination_city || null,
        purpose: form.purpose,
        start_date: form.start_date,
        end_date: form.end_date,
        estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : null,
        advance_amount: form.advance_amount ? parseFloat(form.advance_amount) : null,
      };

      // createTravelRequest returns an Axios response with data: { data: TravelRequest }
      const createRes = await expenseHubService.createTravelRequest(payload);
      const tr = createRes.data.data; // unwrap the TravelRequest

      // submitTravel returns similar structure, but we don't need the response data
      await expenseHubService.submitTravel(tr.uuid);

      return tr;
    },
    onSuccess: (tr) => {
      toast.success("Travel request submitted for approval.");
      router.push(`/expense-hub/travel/${tr.uuid}`);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Could not submit the travel request." }),
  });

  const canSubmit = !!employee && form.purpose.trim().length > 0;

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Travel</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">New Travel Request</h1>
      </div>

      <div className="grid max-w-2xl gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <div className="grid gap-1">
          <Label>Employee</Label>
          {employee ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
              <span>{employee.name} <span className="text-gray-500">· {employee.employee_code}</span></span>
              <button onClick={() => setEmployee(null)} className="text-xs font-medium text-brand-700 hover:underline">Change</button>
            </div>
          ) : (
            <div className="relative">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee by name…" />
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-100 bg-white shadow-lg">
                  {results.map((r) => (
                    <li key={r.uuid}>
                      <button onClick={() => { setEmployee(r); setSearch(""); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50">
                        <span>{r.name}</span><span className="text-xs text-gray-500">{r.employee_code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Trip type</Label>
            <select value={form.trip_type} onChange={(e) => setForm({ ...form, trip_type: e.target.value as TripType })} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
            </select>
          </div>
          <div className="grid gap-1">
            <Label>Destination</Label>
            <Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} placeholder="City" />
          </div>
        </div>

        <div className="grid gap-1">
          <Label>Purpose</Label>
          <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Client kickoff" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Start date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="grid gap-1">
            <Label>End date</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="grid gap-1">
            <Label>Estimated cost</Label>
            <Input type="number" value={form.estimated_amount} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} />
          </div>
          <div className="grid gap-1">
            <Label>Advance requested</Label>
            <Input type="number" value={form.advance_amount} onChange={(e) => setForm({ ...form, advance_amount: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending} className="bg-brand-800 text-white hover:bg-brand-900">
            Submit for approval
          </Button>
        </div>
      </div>
    </div>
  );
}