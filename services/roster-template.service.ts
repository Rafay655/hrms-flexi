import { api } from '@/lib/api';
import type {
  RosterTemplate,
  RosterTemplateFormData,
  RosterTemplateApiPayload,
  PaginatedRosterTemplatesResponse,
  TemplateType,
} from '@/types/roster-template';

const BASE_PATH = '/time-sync/roster/templates';

const toApiPayload = (data: RosterTemplateFormData): RosterTemplateApiPayload => ({
  name: data.name.trim(),
  template_type: data.template_type as TemplateType,
  working_days: data.working_days,
  pattern_data: data.pattern_data,
  auto_generate: data.auto_generate,
  is_active: data.is_active,
});

export const rosterTemplateService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    template_type?: string;
    is_active?: number;
  }) => {
    const { data } = await api.get<PaginatedRosterTemplatesResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as RosterTemplate;
  },

  create: async (payload: RosterTemplateFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: RosterTemplateFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};