'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { amsService } from '@/services/ams.service';
import { employeeService } from '@/services/employee.service';

export default function AssignAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: ['people-hub', 'employees', 'all'],
    // detailed: 0 — OnboardingController's detailed=0 branch returns a flat
    // { id, uuid, employee_code, name, gross_salary } shape per employee: a
    // real top-level `uuid` field plus a resolved display `name`. The
    // detailed=true default (EmployeeResource) instead puts the employee's
    // uuid under a field called `id` (not `uuid`) and has no flat `name` (only
    // a conditionally-loaded `user.name`). This form reads `e.uuid` and
    // `e.name` directly when building the picker and submitting
    // employee_uuid to POST /ams/assignments, so detailed=0 is the shape that
    // actually matches what the code reads — it is not a workaround for a
    // missing/broken uuid, both branches carry the employee's uuid.
    queryFn: () => employeeService.getAll({ per_page: 500, detailed: 0 }),
  });

  const { data: availableAssetsRes } = useQuery({
    queryKey: ['ams', 'assets', 'available'],
    queryFn: () => amsService.getAssets({ status: 'available', per_page: 200 }),
  });
  const availableAssets = availableAssetsRes?.data ?? [];

  const [form, setForm] = useState({
    employee_uuid: '', asset_uuid: '', assignment_type: 'permanent',
    assigned_date: new Date().toISOString().slice(0, 10), expected_return_date: '',
    condition_at_issue: 'new', remarks: '',
  });

  const mutation = useMutation({
    mutationFn: () => amsService.createAssignment({
      asset_uuid: form.asset_uuid,
      employee_uuid: form.employee_uuid,
      assigned_date: form.assigned_date,
      expected_return_date: form.expected_return_date || undefined,
      assignment_type: form.assignment_type,
      condition_at_issue: form.condition_at_issue,
      remarks: form.remarks || undefined,
    }),
    onSuccess: () => {
      toast.success('Asset assigned. A handover note has been generated for e-signature.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['ams', 'assets'] });
      router.push('/ams/assignments');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not assign asset.'),
  });

  return (
    <div className="p-3 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Assign Asset</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label className="mb-2">Employee</Label>
            <Select value={form.employee_uuid} onValueChange={(uuid) => setForm({ ...form, employee_uuid: uuid })}>
              <SelectTrigger><SelectValue placeholder="Search employee" /></SelectTrigger>
              <SelectContent>
                {(employees ?? []).map((e) => (
                  <SelectItem key={e.uuid} value={e.uuid}>{e.name ?? e.employee_code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Asset</Label>
            <Select value={form.asset_uuid} onValueChange={(uuid) => setForm({ ...form, asset_uuid: uuid })}>
              <SelectTrigger><SelectValue placeholder="Select an available asset" /></SelectTrigger>
              <SelectContent>
                {availableAssets.map((a) => (
                  <SelectItem key={a.uuid} value={a.uuid}>{a.asset_tag} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Assignment Type</Label>
              <Select value={form.assignment_type} onValueChange={(v) => setForm({ ...form, assignment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2">Condition at Issue</Label>
              <Select value={form.condition_at_issue} onValueChange={(v) => setForm({ ...form, condition_at_issue: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="mb-2">Assigned Date</Label><Input type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} /></div>
            {form.assignment_type !== 'permanent' && (
              <div><Label className="mb-2">Expected Return Date</Label><Input type="date" value={form.expected_return_date} onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })} /></div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push('/ams/assignments')}>Cancel</Button>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
              disabled={!form.employee_uuid || !form.asset_uuid || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Assigning...' : 'Assign & Generate Handover Note'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
