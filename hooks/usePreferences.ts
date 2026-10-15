// hooks/usePreferences.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesService } from '@/services/preferences.service';
import type {
  PreferencesApiResponse,
  UpdatePreferencePayload,
  UpdateQuietHoursPayload,
  NotificationPreferenceItem,
} from '@/types/preferences';

// ── Query keys ───────────────────────────────────────────────────────────────

export const preferencesKeys = {
  all: ['preferences'] as const,
  list: () => [...preferencesKeys.all, 'list'] as const,
  detail: (templateKey: string) =>
    [...preferencesKeys.list(), templateKey] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all preferences for the current user.
 */
export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.list(),
    queryFn: () => preferencesService.getPreferences(),
    staleTime: 30_000,
  });
}

// Context type for optimistic update
type UpdatePreferenceContext = {
  previous: PreferencesApiResponse | undefined;
};

/**
 * Update a single template's channel preferences.
 * Optimistically updates the cache, rolls back on error.
 */
export function useUpdatePreference() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationPreferenceItem,
    Error,
    { templateKey: string; updates: UpdatePreferencePayload },
    UpdatePreferenceContext
  >({
    mutationFn: ({ templateKey, updates }) =>
      preferencesService.updatePreference(templateKey, updates),

    onMutate: async ({ templateKey, updates }) => {
      await queryClient.cancelQueries({
        queryKey: preferencesKeys.list(),
      });

      const previous = queryClient.getQueryData<PreferencesApiResponse>(
        preferencesKeys.list()
      );

      if (previous) {
        const newData = {
          ...previous,
          templates: previous.templates.map((t) =>
            t.template_key === templateKey ? { ...t, ...updates } : t
          ),
        };
        queryClient.setQueryData(preferencesKeys.list(), newData);
      }

      return { previous };
    },

    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKeys.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: preferencesKeys.list(),
      });
    },
  });
}

/**
 * Update global quiet hours.
 */
export function useUpdateQuietHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateQuietHoursPayload) =>
      preferencesService.updateQuietHours(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: preferencesKeys.list(),
      });
    },
  });
}

/**
 * Reset a single template to company defaults.
 */
export function useResetPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateKey: string) =>
      preferencesService.resetPreference(templateKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: preferencesKeys.list(),
      });
    },
  });
}