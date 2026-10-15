// types/preferences.ts

/**
 * Channel keys used in the preferences object.
 * These map to database columns and toggle switches.
 */
export type ChannelKey =
  | 'in_app_enabled'
  | 'email_enabled'
  | 'push_enabled'
  | 'sms_enabled'
  | 'whatsapp_enabled';

/**
 * A single user's notification preferences for a specific template.
 * This includes both channel flags and global quiet hours (same for all rows).
 */
export interface ChannelPrefs {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  // Quiet hours are stored per row (duplicated for simplicity), but
  // they are global across all templates. In the API they are returned
  // separately in the top‑level `quiet_hours` object.
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
}

/**
 * Preference item returned in the `templates` array.
 */
export interface NotificationPreferenceItem {
  template_key: string;
  name: string;           // friendly display name (built on the frontend)
  preferences: ChannelPrefs;
}

/**
 * Grouped preferences by module (keyed by first part of template_key).
 */
export type PrefsGrouped = Record<string, NotificationPreferenceItem[]>;

/**
 * The raw API response for GET /preferences.
 */
export interface PreferencesApiResponse {
  quiet_hours: {
    enabled: boolean;
    start: string | null;   // "HH:MM:SS" or null
    end: string | null;
    timezone: string | null;
  };
  templates: Array<{
    template_key: string;
    email_enabled: boolean;
    sms_enabled: boolean;
    whatsapp_enabled: boolean;
    in_app_enabled: boolean;
    push_enabled: boolean;
  }>;
}

/**
 * Payload for updating a single preference (PUT /preferences/:templateKey).
 * All fields are optional – only the changed ones are sent.
 */
export interface UpdatePreferencePayload {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  in_app_enabled?: boolean;
  push_enabled?: boolean;
}

/**
 * Payload for updating quiet hours (PATCH /preferences/quiet-hours).
 */
export interface UpdateQuietHoursPayload {
  enabled: boolean;
  quiet_hours_start?: string | null;   // "HH:MM"
  quiet_hours_end?: string | null;
  quiet_hours_timezone?: string | null;
}