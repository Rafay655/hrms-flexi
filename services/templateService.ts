import { api } from "@/lib/api";
import type { Template, TemplateFormData } from "@/types/templates";

const API_BASE = "/notify-pro/notify-hub/templates";

export const fetchTemplates = async (
  page: number,
  search: string,
  perPage: number,
  filters?: { module?: string; channel?: string; is_active?: boolean }
) => {
  const params: any = { page, per_page: perPage, search };
  if (filters?.module) params.module = filters.module;
  if (filters?.channel) params.channel = filters.channel;
  if (filters?.is_active !== undefined) params.is_active = filters.is_active;
  const response = await api.get(API_BASE, { params });
  return response.data; // { data: Template[], meta: { current_page, last_page, per_page, total } }
};

export const fetchTemplate = async (uuid: string) => {
  const response = await api.get(`${API_BASE}/${uuid}`);
  return response.data; // { data: Template }
};

export const createTemplate = async (data: TemplateFormData) => {
  const response = await api.post(API_BASE, data);
  return response.data; // { data: Template }
};

export const updateTemplate = async (uuid: string, data: TemplateFormData) => {
  const response = await api.put(`${API_BASE}/${uuid}`, data);
  return response.data; // { data: Template }
};

export const deleteTemplate = async (uuid: string) => {
  await api.delete(`${API_BASE}/${uuid}`);
};

export const resetTemplate = async (uuid: string) => {
  await api.post(`${API_BASE}/${uuid}/reset`);
};

export const testTemplate = async (uuid: string, recipientEmail: string) => {
  await api.post(`${API_BASE}/${uuid}/test`, { recipient_email: recipientEmail });
};