/**
 * types/engageboard-feed.types.ts
 *
 * Shapes mirror backend/app/Http/Resources/EngageBoard/CompanyFeed/*.php exactly
 * (CompanyPostResource, PostAttachmentResource, PostReactionResource,
 * PostCommentResource, AnnouncementResource) — read directly, not guessed.
 *
 * Known backend gap (documented in docs/engageboard/graph/20c-integration-snippet.md):
 * CompanyPostResource/PostCommentResource expose only `author_id`/`employee_id`
 * (numeric PKs — a User id for posts, an Employee id for comments), never a
 * resolved display name or avatar. There is no HTTP-reachable endpoint in this
 * codebase that maps an arbitrary User id back to a name. `author_type` is the
 * only reliable, always-available author signal for posts.
 */

export type PostAuthorType = "hr" | "manager" | "employee" | "system";

export type PostType =
  | "announcement"
  | "achievement"
  | "celebration"
  | "recognition"
  | "news"
  | "custom";

export type PostVisibility = "company_wide" | "department" | "location" | "custom_group";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export type AttachmentType = "image" | "gif" | "video" | "document" | "link";

export type ReactionType = "like" | "love" | "clap" | "celebrate" | "insightful";

export interface PostAttachment {
  uuid: string;
  attachment_type: AttachmentType;
  file_url: string | null;
  link_url: string | null;
  thumbnail_url: string | null;
  alt_text: string | null;
  mime_type: string | null;
  file_size: number | null;
  sort_order: number;
}

export interface CompanyPost {
  uuid: string;
  post_type: PostType;
  title: string | null;
  body: string;
  author_type: PostAuthorType;
  author_id: number;
  visibility: PostVisibility;
  visibility_scope_id: number | null;
  pin_to_top: boolean;
  pin_until: string | null;
  allow_comments: boolean;
  allow_reactions: boolean;
  schedule_publish_at: string | null;
  status: PostStatus;
  published_at: string | null;
  reference_type: "recognition" | "enps" | "event" | null;
  reference_id: number | null;
  is_editable: boolean;
  reactions_count: number | null;
  comments_count: number | null;
  attachments: PostAttachment[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PostReaction {
  uuid: string;
  employee_id: number;
  reaction_type: ReactionType;
  reacted_at: string | null;
}

export interface PostComment {
  uuid: string;
  employee_id: number;
  parent_comment_id: string | number | null;
  body: string;
  is_edited: boolean;
  is_deleted: boolean;
  mentioned_employee_ids: number[];
  replies: PostComment[];
  created_at: string | null;
  updated_at: string | null;
}

export interface Announcement {
  uuid: string;
  title: string;
  category: string | null;
  body: string;
  banner_image_path: string | null;
  priority: string;
  expires_at: string | null;
  is_published: boolean;
  published_at: string | null;
  is_read: boolean;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  links?: Record<string, string | null>;
}

/** Attachment upload item for the compose form (link attachments carry no file). */
export interface ComposeAttachment {
  type: AttachmentType;
  file?: File;
  link_url?: string;
  alt_text?: string;
}

export interface CreatePostPayload {
  post_type?: PostType;
  title?: string;
  body: string;
  visibility?: PostVisibility;
  visibility_scope_id?: number;
  pin_to_top?: boolean;
  pin_until?: string;
  allow_comments?: boolean;
  allow_reactions?: boolean;
  schedule_publish_at?: string;
  attachments?: ComposeAttachment[];
}

/** A lightweight employee directory entry — see engageboard-feed.service.ts's
 * searchEmployees() docblock for exactly which (confirmed reachable) backend
 * endpoint this is sourced from. */
export interface EmployeeOption {
  id: number;
  uuid: string;
  name: string;
  employee_code: string;
}
