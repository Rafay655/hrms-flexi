// constants/announcements.ts
import type { ImportanceLevel, AnnouncementChannel, AnnouncementFormState } from "@/types/announcements";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";

export const ALL_ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "it_admin", label: "IT Admin" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "hr_officer", label: "HR Officer" },
  { value: "manager", label: "Manager" },
  { value: "finance", label: "Finance" },
  { value: "employee", label: "Employee" },
];

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 border-blue-200" },
  published: { label: "Published", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500 border-gray-200" },
  retracted: { label: "Retracted", className: "bg-red-50 text-red-600 border-red-200" },
};

export const IMPORTANCE_CONFIG: Record<ImportanceLevel, { label: string; className: string; selectedRing: string }> = {
  normal: {
    label: "Normal",
    className: "bg-indigo-50 text-[#1E1B4B] border-indigo-100",
    selectedRing: "ring-2 ring-indigo-400 ring-offset-1",
  },
  important: {
    label: "Important",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    selectedRing: "ring-2 ring-amber-400 ring-offset-1",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-50 text-red-600 border-red-200",
    selectedRing: "ring-2 ring-red-400 ring-offset-1",
  },
};

export const CHANNEL_META: Record<AnnouncementChannel, { label: string; Icon: React.ElementType }> = {
  in_app: { label: "In-App", Icon: Bell },
  email: { label: "Email", Icon: Mail },
  push: { label: "Push Notification", Icon: Smartphone },
  whatsapp: { label: "WhatsApp", Icon: MessageSquare },
};

export const EMPTY_FORM: AnnouncementFormState = {
  title: "",
  body: "",
  importance: "normal",
  target_all: true,
  target_roles: [],
  in_app_enabled: true,
  email_enabled: false,
  whatsapp_enabled: false,
  push_enabled: true,
  is_draft: true,
  publish_mode: "now",
  publish_at: "",
  expires_at: "",
};
