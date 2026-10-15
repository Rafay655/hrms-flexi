import { api } from '@/lib/api';
import type {
  DocumentType,
  DocumentTypeFormData,
  DocumentTypeApiPayload,
  PaginatedDocumentTypesResponse,
} from '@/types/document-type';

const BASE_PATH = '/flexi-meta/document-types';

const toApiPayload = (data: DocumentTypeFormData): DocumentTypeApiPayload => ({
  name: data.name.trim(),
  category_id: data.category_id,
  description: data.description.trim() || null,
  requires_expiry: data.requires_expiry,
  requires_verification: data.requires_verification,
  is_active: data.is_active,
});

export const documentTypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedDocumentTypesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getByUuid: async (uuid: string): Promise<DocumentType> => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data;
  },

  create: async (payload: DocumentTypeFormData): Promise<DocumentType> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (uuid: string, payload: DocumentTypeFormData): Promise<DocumentType> => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};