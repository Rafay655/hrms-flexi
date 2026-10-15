// lib/announcement-utils.ts
import type { Announcement, AnnouncementStatus, AnnouncementFormState } from "@/types/announcements";

export const toDatetimeLocal = (iso: string | null): string =>
  iso ? iso.slice(0, 16) : "";

export const truncateText = (str: string | null, limit: number): string => {
  if (!str) return '';
  return str.length > limit ? `${str.substring(0, limit)}...` : str;
};

export const validateForm = (form: AnnouncementFormState): string | null => {
  if (!form.title.trim()) return "Title is required.";
  if (form.title.trim().length > 255) return "Title must be 255 characters or fewer.";
  if (!form.body.trim()) return "Announcement body is required.";
  if (!form.target_all && form.target_roles.length === 0)
    return "Select at least one role, or choose to target all users.";
  if (!form.is_draft && form.publish_mode === "schedule" && !form.publish_at)
    return "Please choose a schedule date and time.";
  return null;
};

/**
 * Derives a display status from the fields the API actually returns
 * (is_draft, is_published, publish_at, published_at, expires_at).
 * The API does NOT return a `status` string field, so this replaces
 * any direct reads of `ann.status`, which were always `undefined`
 * and silently fell back to "draft" everywhere they were used.
 *
 * NOTE: There's currently no field in the API response that maps to
 * "retracted". If/when the backend adds one (e.g. a `retracted_at`
 * timestamp or a dedicated flag), add that check here.
 */
export const getAnnouncementStatus = (ann: Announcement): AnnouncementStatus => {
  if (ann.expires_at && new Date(ann.expires_at) < new Date() && ann.is_published) {
    return "expired";
  }
  if (ann.is_draft) {
    return ann.publish_at ? "scheduled" : "draft";
  }
  if (ann.is_published) {
    return "published";
  }
  return "draft";
};