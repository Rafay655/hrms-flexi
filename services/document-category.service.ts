import { api } from '@/lib/api';
import type {
  DocumentCategory,
  DocumentCategoryFormData,
  DocumentCategoryApiPayload,
  DocumentCategoryListResponse,
} from '@/types/document-category';

const BASE_PATH = '/flexi-meta/document-categories';

const toApiPayload = (data: DocumentCategoryFormData): DocumentCategoryApiPayload => ({
  name: data.name.trim(),
  icon: data.icon.trim(),
  description: data.description.trim() || null,
  is_active: data.is_active,
});

export const documentCategoryService = {
  getAll: async (params?: { search?: string }): Promise<DocumentCategoryListResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getByUuid: async (uuid: string): Promise<DocumentCategory> => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data;
  },

  create: async (payload: DocumentCategoryFormData): Promise<DocumentCategory> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (uuid: string, payload: DocumentCategoryFormData): Promise<DocumentCategory> => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};