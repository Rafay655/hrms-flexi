// services/entity-profile.service.ts
import { api } from '@/lib/api';
import type {
  EntityProfile,
  CreateEntityProfilePayload,
  UpdateEntityProfilePayload,
  EntityProfileQueryParams,
} from '@/types/entity-profile.types';

export const entityProfileApi = {
  getProfiles: (params?: EntityProfileQueryParams) =>
    api.get<{ data: EntityProfile[]; meta: any }>('/compliance/entity-profiles', { params }),

  getProfile: (uuid: string) =>
    api.get<{ data: EntityProfile }>(`/compliance/entity-profiles/${uuid}`),

  createProfile: (payload: CreateEntityProfilePayload) =>
    api.post<{ data: EntityProfile }>('/compliance/entity-profiles', payload),

  updateProfile: (uuid: string, payload: UpdateEntityProfilePayload) =>
    api.put<{ data: EntityProfile }>(`/compliance/entity-profiles/${uuid}`, payload),

  deleteProfile: (uuid: string) =>
    api.delete(`/compliance/entity-profiles/${uuid}`),
};