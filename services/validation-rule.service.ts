import { api } from "@/lib/api";

import type {
  PaginatedValidationRulesResponse,
  ValidationRule,
  ValidationRuleApiPayload,
  ValidationRuleFormData,
  ValidationRuleSingleResponse,
  ValidationRulesQueryParams,
} from "@/types/validation-rule";

const BASE_PATH = "/flexi-hq/validation-rules";

const toApiPayload = (formData: ValidationRuleFormData): ValidationRuleApiPayload => {
  return {
    key: formData.key.trim(),
    label: formData.label.trim(),
    description: formData.description.trim() || null,
    applies_to: formData.applies_to,
    has_param: Boolean(formData.has_param),
    param_label: formData.has_param ? formData.param_label.trim() || null : null,
    param_type: formData.has_param ? formData.param_type || null : null,
    laravel_rule: formData.laravel_rule.trim(),
    category: formData.category as ValidationRuleApiPayload["category"],
    is_active: Boolean(formData.is_active),
  };
};

export const validationRuleService = {
  getAll: async (
    params?: ValidationRulesQueryParams
  ): Promise<PaginatedValidationRulesResponse> => {
    const { data } = await api.get<PaginatedValidationRulesResponse>(BASE_PATH, {
      params: {
        page: params?.page ?? 1,
        per_page: params?.per_page ?? 10,
        search: params?.search ?? "",
      },
    });

    return data;
  },

  create: async (payload: ValidationRuleFormData): Promise<ValidationRule> => {
    const { data } = await api.post<ValidationRuleSingleResponse>(
      BASE_PATH,
      toApiPayload(payload)
    );

    return data.data;
  },

  update: async (
    id: number,
    payload: ValidationRuleFormData
  ): Promise<ValidationRule> => {
    const { data } = await api.put<ValidationRuleSingleResponse>(
      `${BASE_PATH}/${id}`,
      toApiPayload(payload)
    );

    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};