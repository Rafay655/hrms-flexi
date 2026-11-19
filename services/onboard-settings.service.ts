import {api} from "@/lib/api";

import type {
  DataSourceItem,
  OnboardSettingsResponse,
  SaveOnboardFieldPayload,
  StoreStepPayload,
  UpdateStepPayload,
  ValidationRuleCatalogItem,
} from "@/types/onboard-settings";

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export const onboardSettingsService = {
  async getSettings(companyUuid?: string, formBuilderId?: string) {
    const params = new URLSearchParams();

    if (companyUuid) params.set("company_uuid", companyUuid);
    if (formBuilderId) params.set("form_builder_id", formBuilderId);

    const response = await api.get<OnboardSettingsResponse>(
      `/flexi-hq/onboard-settings?${params.toString()}`
    );

    return response.data;
  },

  async getDataSources(category = "company") {
    const response = await api.get(
      `/flexi-hq/onboard-settings/data-sources`
    );

    return extractArray<DataSourceItem>(response.data);
  },

async getValidationRules() {
  const response = await api.get(`/flexi-hq/validation-rules?per_page=100`);

  return response.data?.data ?? [];
},

  async createStep(payload: StoreStepPayload) {
    const response = await api.post(`/flexi-hq/onboard-settings/steps`, payload);
    return response.data;
  },

  async updateStep(stepId: number, payload: UpdateStepPayload) {
    const response = await api.put(
      `/flexi-hq/onboard-settings/steps/${stepId}`,
      payload
    );

    return response.data;
  },

  async deleteStep(stepId: number) {
    const response = await api.delete(
      `/flexi-hq/onboard-settings/steps/${stepId}`
    );

    return response.data;
  },

  async reorderSteps(companyUuid: string | undefined, orderedIds: number[]) {
    const response = await api.post(`/flexi-hq/onboard-settings/steps/reorder`, {
      company_uuid: companyUuid,
      ordered_ids: orderedIds,
    });

    return response.data;
  },

  async saveField(payload: SaveOnboardFieldPayload) {
    const response = await api.post(
      `/flexi-hq/onboard-settings/fields`,
      payload
    );

    return response.data;
  },
  async updateField(fieldId: number, payload: SaveOnboardFieldPayload) {
  const response = await api.patch(
    `/flexi-hq/onboard-settings/fields/${fieldId}`,
    payload
  );

  return response.data;
},

async deleteField(fieldId: number) {
  const response = await api.delete(
    `/flexi-hq/onboard-settings/fields/${fieldId}`
  );

  return response.data;
},
async reorderFields(payload: { step_id: number; ordered_ids: number[] }) {
  const response = await api.post(
    `/flexi-hq/onboard-settings/fields/reorder`,
    payload
  );

  return response.data;
},
};