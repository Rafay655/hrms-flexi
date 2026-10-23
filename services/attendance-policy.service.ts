import { api } from '@/lib/api';
import type { AttendancePolicy, AttendancePolicyFormData, PaginatedAttendancePoliciesResponse } from '@/types/attendance-policy';

const ROOT = '/time-sync/policies';
interface Envelope<T> { success: boolean; message: string; data: T }
function checked<T extends { success: boolean; message: string }>(data: T): T {
  if (!data.success) throw new Error(data.message || 'The policy request failed.');
  return data;
}
export interface PolicySimulationInput {
  policy_uuid: string; shift_start_time: string; shift_end_time: string;
  punch_in: string; punch_out: string; break_minutes: number;
}
export interface PolicySimulation {
  policy: AttendancePolicy;
  input: Partial<PolicySimulationInput>;
  result: { status: string; work_minutes: number; late_minutes: number; early_out_minutes: number; note?: string };
}
export const attendancePolicyService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedAttendancePoliciesResponse> {
    const response = checked((await api.get<Envelope<AttendancePolicy[] | PaginatedAttendancePoliciesResponse['data']> & { meta?: PaginatedAttendancePoliciesResponse['data']['meta'] }>(ROOT, { params })).data);
    const rows = Array.isArray(response.data) ? response.data : response.data?.data;
    const meta = Array.isArray(response.data) ? response.meta : response.data?.meta;
    if (!Array.isArray(rows) || !meta) throw new Error('Unexpected attendance policy listing response.');
    return { ...response, data: { data: rows, meta, links: null } };
  },
  async getById(uuid: string): Promise<AttendancePolicy> {
    return checked((await api.get<Envelope<AttendancePolicy>>(`${ROOT}/${uuid}`)).data).data;
  },
  async save({ uuid, payload }: { uuid?: string; payload: Record<string, unknown> }): Promise<AttendancePolicy> {
    const response = uuid ? await api.put<Envelope<AttendancePolicy>>(`${ROOT}/${uuid}`, payload) : await api.post<Envelope<AttendancePolicy>>(ROOT, payload);
    return checked(response.data).data;
  },
  async create(payload: AttendancePolicyFormData) {
    return attendancePolicyService.save({ payload: { ...payload, department_ids: payload.department_ids.map(Number), employment_types: payload.employment_types.map(Number) } });
  },
  async update(uuid: string, payload: AttendancePolicyFormData) {
    return attendancePolicyService.save({ uuid, payload: { ...payload, department_ids: payload.department_ids.map(Number), employment_types: payload.employment_types.map(Number) } });
  },
  async delete(uuid: string): Promise<void> {
    const response = await api.delete<Envelope<unknown>>(`${ROOT}/${uuid}`);
    if (response.data) checked(response.data);
  },
  async simulate(payload: PolicySimulationInput): Promise<PolicySimulation> {
    return checked((await api.post<Envelope<PolicySimulation>>(`${ROOT}/simulate`, payload)).data).data;
  },
};
