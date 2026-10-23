import { api } from '@/lib/api';

export const correctionOptions = [
  { value: 'add_in', label: 'Add clock-in' },
  { value: 'add_out', label: 'Add clock-out' },
  { value: 'modify_in', label: 'Correct clock-in' },
  { value: 'modify_out', label: 'Correct clock-out' },
  { value: 'full_replacement', label: 'Replace both punches' },
];

export interface MyRegularization {
  id: string; employee_id: string;
  employee: { id: string; name: string; employee_code: string } | null;
  attendance_date: string; correction_type: string;
  requested_in: string | null; requested_out: string | null;
  reason: string; supporting_doc_path: string | null; status: string;
  rejection_reason: string | null; decided_at: string | null;
  decided_by_user: { name: string } | null; created_at: string;
}

export interface RegularizationPayload {
  employee_id: string; attendance_date: string; correction_type: string;
  requested_in: string | null; requested_out: string | null;
  reason: string; supporting_doc_path: string | null;
}

export interface AttendanceDaySnapshot {
  employee_id: string;
  attendance_date: string;
  found: boolean;
  first_in: string | null;
  last_out: string | null;
  status: string;
  daily_attendance: any;
  open_regularizations: any[];
}

interface Envelope<T = unknown> { 
  success: boolean; 
  message: string; 
  data: T;
}

interface ListResponse extends Envelope {
  data: MyRegularization[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

function checked<T extends Envelope>(data: T): T {
  if (!data.success) throw new Error(data.message || 'The request failed.');
  return data;
}

const root = '/time-sync/regularizations';

export const myRegularizationsService = {
  async list(
    page: number, 
    per_page: number, 
    signal?: AbortSignal, 
    filters?: { 
      search?: string; 
      status?: string; 
      correction_type?: string; 
      scope?: 'my' | 'team' 
    }
  ) {
    const data = checked(
      (await api.get<ListResponse>(`${root}`, { 
        params: { 
          page, 
          per_page, 
          scope: filters?.scope ?? 'my', 
          ...filters 
        }, 
        signal 
      })).data
    );
    if (!Array.isArray(data.data)) throw new Error('Unexpected regularization response.');
    return data;
  },

  async save({ id, payload }: { id?: string; payload: RegularizationPayload }) {
    return checked((await (id ? api.put<Envelope>(`${root}/${id}`, payload) : api.post<Envelope>(root, payload))).data);
  },

  async cancel({ id, reason }: { id: string; reason: string }) {
    return checked((await api.delete<Envelope>(`${root}/${id}`, { data: { cancel_reason: reason.trim() || null } })).data);
  },

  async approve(id: string) {
    return checked((await api.post<Envelope>(`${root}/${id}/approve`)).data);
  },

  async reject({ id, reason }: { id: string; reason: string }) {
    return checked((await api.post<Envelope>(`${root}/${id}/reject`, { rejection_reason: reason.trim() })).data);
  },

  async getAttendanceDay(date: string, signal?: AbortSignal) {
    return checked(
      (await api.get<Envelope<AttendanceDaySnapshot>>(`${root}/attendance-day`, { 
        params: { attendance_date: date },
        signal 
      })).data
    );
  }
};