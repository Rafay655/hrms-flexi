import { showApiError } from "@/lib/error-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { validationRuleService } from "@/services/validation-rule.service";
import type {
  ValidationRuleFormData,
  ValidationRulesQueryParams,
} from "@/types/validation-rule";

export const validationRuleKeys = {
  all: ["validation-rules"] as const,
  lists: () => [...validationRuleKeys.all, "list"] as const,
  list: (params: ValidationRulesQueryParams) =>
    [...validationRuleKeys.lists(), params] as const,
};

const getErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export function useValidationRules(params?: ValidationRulesQueryParams) {
  const normalizedParams: ValidationRulesQueryParams = {
    page: params?.page ?? 1,
    per_page: params?.per_page ?? 10,
    search: params?.search ?? "",
  };

  return useQuery({
    queryKey: validationRuleKeys.list(normalizedParams),
    queryFn: () => validationRuleService.getAll(normalizedParams),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateValidationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ValidationRuleFormData) =>
      validationRuleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: validationRuleKeys.lists(),
      });

      toast.success("Validation rule created successfully");
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: getErrorMessage(error, "Failed to create validation rule") });
    },
  });
}

export function useUpdateValidationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ValidationRuleFormData;
    }) => validationRuleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: validationRuleKeys.lists(),
      });

      toast.success("Validation rule updated successfully");
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: getErrorMessage(error, "Failed to update validation rule") });
    },
  });
}

export function useDeleteValidationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => validationRuleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: validationRuleKeys.lists(),
      });

      toast.success("Validation rule deleted successfully");
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: getErrorMessage(error, "Failed to delete validation rule") });
    },
  });
}