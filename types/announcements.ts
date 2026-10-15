export type AnnouncementStatus = "draft" | "scheduled" | "published" | "expired" | "retracted";
export type ImportanceLevel = "normal" | "important" | "urgent";
export type AnnouncementChannel = "in_app" | "email" | "push" | "whatsapp";

export interface Announcement {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  target_roles: string[] | null;
  channels: AnnouncementChannel[];
  status: AnnouncementStatus;
  is_draft: boolean;
  publish_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  reads_count: number;
  total_target_count: number;
  image_url?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementFormState {
  title: string;
  body: string;
  importance: ImportanceLevel;
  target_all: boolean;
  target_roles: string[];
  in_app_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  is_draft: boolean;
  publish_mode: "now" | "schedule";
  publish_at: string;
  expires_at: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  importance: ImportanceLevel;
  target_roles: string[] | null;
  channels: AnnouncementChannel[];
  is_draft: boolean;
  publish_at?: string | null;
  expires_at?: string | null;
}

export interface AnnouncementsResponse {
  data: Announcement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
