// services/preferences.service.ts

import {api} from "@/lib/api";
import type {
    NotificationPreferenceItem,
  PreferencesApiResponse,
  UpdatePreferencePayload,
  UpdateQuietHoursPayload,
} from '@/types/preferences';

const API_BASE = '/notify-pro';

export const preferencesService = {
  /**
   * GET /preferences – fetch all preferences for the authenticated user.
   */
  async getPreferences(): Promise<PreferencesApiResponse> {
    const { data } = await api.get<{ data: PreferencesApiResponse }>(
      `${API_BASE}/preferences`
    );
    return data.data;
  },

  /**
   * PUT /preferences/:templateKey – update a single template's channel settings.
   */
  async updatePreference(
    templateKey: string,
    payload: UpdatePreferencePayload
  ): Promise<NotificationPreferenceItem> {
    const { data } = await api.put<{ data: NotificationPreferenceItem }>(
      `${API_BASE}/preferences/${templateKey}`,
      payload
    );
    return data.data;
  },

  /**
   * DELETE /preferences/:templateKey – reset a specific template to default.
   */
  async resetPreference(templateKey: string): Promise<void> {
    await api.delete(`${API_BASE}/preferences/${templateKey}`);
  },

  /**
   * PATCH /preferences/quiet-hours – update global quiet hours.
   */
  async updateQuietHours(payload: UpdateQuietHoursPayload): Promise<{
    quiet_hours: PreferencesApiResponse['quiet_hours'];
  }> {
    const { data } = await api.patch<{
      data: { quiet_hours: PreferencesApiResponse['quiet_hours'] };
    }>(`${API_BASE}/preferences/quiet-hours`, payload);
    return data.data;
  },
};