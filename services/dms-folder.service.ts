import { api } from '@/lib/api';
import type {
  DmsFolder,
  DmsFolderFormData,
  DmsFolderApiPayload,
} from '@/types/dms-folder';

const BASE_PATH = '/dms/folders';

const toApiPayload = (data: DmsFolderFormData): DmsFolderApiPayload => ({
  name: data.name.trim(),
  slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
  parent_id: data.parent_id || null,
  folder_type: data.folder_type || 'personal',
  is_system: data.is_system || false,
});

export const dmsFolderService = {
  getAll: async (): Promise<{ success: boolean; message: string; data: DmsFolder[] }> => {
    const { data } = await api.get(BASE_PATH);
    return data;
  },

  getByUuid: async (uuid: string): Promise<DmsFolder> => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data;
  },

  create: async (payload: DmsFolderFormData): Promise<DmsFolder> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (uuid: string, payload: DmsFolderFormData): Promise<DmsFolder> => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};