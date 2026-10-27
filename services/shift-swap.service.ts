import { api } from '@/lib/api';
export type SwapStatus = 'pending_target' | 'pending_manager' | 'approved' | 'rejected' | 'cancelled';
export interface SwapPerson { id: string; name: string; employee_code: string }
export interface SwapRoster { id: string; roster_date: string; shift_id: string; shift_name: string }
export interface ShiftSwap {
  id: string; requester_id: string; target_id: string;
  requester: SwapPerson | null; target: SwapPerson | null;
  requester_roster: SwapRoster | null; target_roster: SwapRoster | null;
  swap_date: string; reason: string | null; status: SwapStatus;
  target_response_at: string | null; approved_at: string | null;
  approved_by_user: { name: string } | null;
  rejection_reason: string | null; created_at: string;
}
export interface SwapOption extends SwapPerson {
  roster_id: string;
  shift: { id: string; name: string; code: string; start_time: string; end_time: string };
}
export interface SwapOptions { swap_date: string; requester: SwapOption; targets: SwapOption[] }
export interface SwapCreate { requester_id: string; target_id: string; swap_date: string; requester_roster_id: string; target_roster_id: string; reason?: string }
export type SwapAction = 'edit' | 'target-accept' | 'approve' | 'reject' | 'cancel' | 'delete';
export function swapActions(row: ShiftSwap, employeeId?: string, approvalInbox = false, approvalRole = false): { action: SwapAction; label: string }[] {
  if (!employeeId && !(approvalInbox && approvalRole)) return [];
  if (row.requester_id === employeeId) return [
    ...(row.status === 'pending_target' ? [{ action: 'edit' as const, label: 'Edit reason' }] : []),
    ...(['pending_target', 'pending_manager'].includes(row.status) ? [{ action: 'cancel' as const, label: 'Cancel request' }] : []),
    ...(['pending_target', 'cancelled', 'rejected'].includes(row.status) ? [{ action: 'delete' as const, label: 'Delete' }] : []),
  ];
  if (row.target_id === employeeId) return row.status === 'pending_target' ? [{ action: 'target-accept', label: 'Accept' }, { action: 'reject', label: 'Reject' }] : [];
  return approvalInbox && row.status === 'pending_manager' ? [{ action: 'approve', label: 'Approve' }, { action: 'reject', label: 'Reject' }] : [];
}
interface Envelope<T> { success: boolean; message?: string; data: T; workflow?: { completed: boolean; failed: boolean; state: string; instance_id: number; task_id: number } | null }
interface SwapList extends Envelope<ShiftSwap[]> { meta: { current_page: number; per_page: number; total: number; last_page: number } }
const root = '/time-sync/shift-swap-requests';
function checked<T extends { success: boolean; message?: string; workflow?: { failed: boolean } | null }>(response: T): T {
  if (!response.success || response.workflow?.failed) throw new Error(response.message || 'The shift swap could not be completed. Refresh and try again.');
  return response;
}
export const shiftSwapService = {
  async list(inbox: 'my' | 'approvals', params: { page: number; per_page: number; status?: string }, signal?: AbortSignal) {
    return checked((await api.get<SwapList>(inbox === 'my' ? `${root}/my` : root, { params, signal })).data);
  },
  async options(swap_date: string, signal?: AbortSignal) { return checked((await api.get<Envelope<SwapOptions>>(`${root}/options`, { params: { swap_date }, signal })).data).data; },
  async detail(id: string) { return checked((await api.get<Envelope<ShiftSwap>>(`${root}/${id}`)).data).data; },
  async create(payload: SwapCreate) { return checked((await api.post<Envelope<ShiftSwap>>(root, payload)).data); },
  async act({ id, action, reason }: { id: string; action: SwapAction; reason?: string }) {
    if (action === 'edit') return checked((await api.patch<Envelope<ShiftSwap>>(`${root}/${id}`, { reason: reason?.trim() || null })).data);
    if (action === 'delete') return checked((await api.delete<Envelope<ShiftSwap>>(`${root}/${id}`)).data);
    return checked((await api.post<Envelope<ShiftSwap>>(`${root}/${id}/${action}`, action === 'reject' || action === 'cancel' ? { rejection_reason: reason?.trim() || null } : {})).data);
  },
};
