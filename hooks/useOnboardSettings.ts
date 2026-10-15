import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { onboardSettingsService } from "@/services/onboard-settings.service";

import type {
  SaveOnboardFieldPayload,
  StoreStepPayload,
  UpdateStepPayload,
} from "@/types/onboard-settings";

export function useOnboardSettings(
  companyUuid?: string,
  formBuilderId?: string
) {
  return useQuery({
    queryKey: ["onboard-settings", companyUuid, formBuilderId],
    queryFn: () => onboardSettingsService.getSettings(companyUuid, formBuilderId),
    enabled: Boolean(companyUuid && formBuilderId),
  });
}

export function useOnboardDataSources(category = "company") {
  return useQuery({
    queryKey: ["onboard-data-sources", category],
    queryFn: () => onboardSettingsService.getDataSources(category),
  });
}

export function useValidationRules() {
  return useQuery({
    queryKey: ["validation-rules"],
    queryFn: () => onboardSettingsService.getValidationRules(),
  });
}

export function useAddStep(companyUuid?: string, formBuilderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<StoreStepPayload, "company_uuid" | "form_builder_id">) =>
      onboardSettingsService.createStep({
        company_uuid: companyUuid ?? "",
        form_builder_id: Number(formBuilderId),
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useUpdateStepMutation(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      data,
    }: {
      stepId: number;
      data: UpdateStepPayload;
    }) => onboardSettingsService.updateStep(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useDeleteStepMutation(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stepId: number) => onboardSettingsService.deleteStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useReorderSteps(companyUuid?: string, formBuilderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      onboardSettingsService.reorderSteps(companyUuid, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useSaveOnboardField(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveOnboardFieldPayload) =>
      onboardSettingsService.saveField(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useUpdateOnboardField(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fieldId,
      payload,
    }: {
      fieldId: number;
      payload: SaveOnboardFieldPayload;
    }) => onboardSettingsService.updateField(fieldId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useDeleteOnboardField(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: number) => onboardSettingsService.deleteField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}

export function useReorderOnboardFields(
  companyUuid?: string,
  formBuilderId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { step_id: number; ordered_ids: number[] }) =>
      onboardSettingsService.reorderFields(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboard-settings", companyUuid, formBuilderId],
      });
    },
  });
}