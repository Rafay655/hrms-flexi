// components/announcements/AnnouncementModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {toast} from "react-hot-toast";
import {
  AlertCircle,
  Loader2,
  X,
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Bold,
  Italic,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementFormState, ImportanceLevel } from "@/types/announcements";
import {
  ALL_ROLES,
  IMPORTANCE_CONFIG,
  EMPTY_FORM,
} from "@/constants/announcements";
import { toDatetimeLocal, validateForm } from "@/lib/announcement-utils";
import { useCreateAnnouncement, useUpdateAnnouncement } from "@/hooks/useAnnouncements";

interface AnnouncementModalProps {
  open: boolean;
  editTarget: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  open,
  editTarget,
  onClose,
  onSaved,
}) => {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: createMutate, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateAnnouncement();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setForm({
        title: editTarget.title,
        body: editTarget.body,
        importance: editTarget.importance,
        target_all: editTarget.target_roles === null || editTarget.target_roles.length === 0,
        target_roles: editTarget.target_roles ?? [],
        in_app_enabled: editTarget.channels.includes("in_app"),
        email_enabled: editTarget.channels.includes("email"),
        whatsapp_enabled: editTarget.channels.includes("whatsapp"),
        push_enabled: editTarget.channels.includes("push"),
        is_draft: editTarget.is_draft,
        publish_mode: editTarget.publish_at ? "schedule" : "now",
        publish_at: toDatetimeLocal(editTarget.publish_at),
        expires_at: toDatetimeLocal(editTarget.expires_at),
      });
      setImagePreview(editTarget.image_url ?? null);
      setImageFile(null);
    } else {
      setForm(EMPTY_FORM);
      setImagePreview(null);
      setImageFile(null);
    }
    setValidationError(null);

    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [open, editTarget]);

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || "text";
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const set = <K extends keyof AnnouncementFormState>(key: K, value: AnnouncementFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleRole = (role: string) =>
    setForm((f) => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter((r) => r !== role)
        : [...f.target_roles, role],
    }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSave = () => {
    const err = validateForm(form);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("body", form.body.trim());
    formData.append("importance", form.importance);

    if (form.target_all) {
      formData.append("target_all", "1");
      formData.append("target_roles", "");
    } else {
      formData.append("target_all", "0");
      formData.append("target_roles", JSON.stringify(form.target_roles));
    }

    const channels: string[] = [];
    if (form.in_app_enabled) channels.push("in_app");
    if (form.push_enabled) channels.push("push");
    if (form.email_enabled) channels.push("email");
    if (form.whatsapp_enabled) channels.push("whatsapp");
    formData.append("channels", JSON.stringify(channels));
    formData.append("email_enabled", form.email_enabled ? "1" : "0");
    formData.append("whatsapp_enabled", form.whatsapp_enabled ? "1" : "0");
    formData.append("push_enabled", form.push_enabled ? "1" : "0");

    formData.append("is_draft", form.is_draft ? "1" : "0");
    if (!form.is_draft) {
      if (form.publish_mode === "schedule" && form.publish_at) {
        formData.append("publish_at", form.publish_at);
      } else {
        formData.append("publish_at", "");
      }
    }
    if (form.expires_at) {
      formData.append("expires_at", form.expires_at);
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (isEdit) {
      updateMutate({ uuid: editTarget!.uuid, formData }, { onSuccess: onSaved });
    } else {
      createMutate(formData, { onSuccess: onSaved });
    }
  };

  const nowDatetimeLocal = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-[#1E1B4B]">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {validationError}
            </div>
          )}

          {/* Mode: Draft vs Publish */}
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="is_draft"
                  checked={form.is_draft}
                  onChange={() => set("is_draft", true)}
                  className="accent-[#1E1B4B]"
                />
                Save as Draft
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="is_draft"
                  checked={!form.is_draft}
                  onChange={() => set("is_draft", false)}
                  className="accent-[#1E1B4B]"
                />
                Publish / Schedule
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Office closed on public holiday"
              maxLength={255}
            />
            <p className="text-right text-[10px] text-slate-400">{form.title.length} / 255</p>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Body</Label>
            <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-input bg-slate-50 px-2 py-1.5">
              {[
                { Icon: Bold, title: "Bold", action: () => wrapSelection("**") },
                { Icon: Italic, title: "Italic", action: () => wrapSelection("_") },
                { Icon: Link2, title: "Link", action: () => wrapSelection("[", "](url)") },
              ].map(({ Icon, title, action }) => (
                <button
                  key={title}
                  type="button"
                  onClick={action}
                  title={title}
                  aria-label={title}
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ))}
              <span className="ml-auto self-center pr-1 text-[10px] text-slate-400">Markdown supported</span>
            </div>
            <Textarea
              id="ann-body"
              ref={textareaRef}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Write your announcement here. Supports **bold**, _italic_, and [links](url)."
              className="min-h-[140px] rounded-t-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="ann-image">Image (optional)</Label>
            <Input id="ann-image" type="file" accept="image/*" onChange={handleImageChange} className="max-w-sm" />
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-md border border-slate-200 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Importance */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Importance</legend>
            <div className="grid grid-cols-3 gap-3">
              {(["normal", "important", "urgent"] as ImportanceLevel[]).map((imp) => {
                const cfg = IMPORTANCE_CONFIG[imp];
                const selected = form.importance === imp;
                return (
                  <button
                    key={imp}
                    type="button"
                    onClick={() => set("importance", imp)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]",
                      selected ? cn(cfg.className, cfg.selectedRing) : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Target Audience */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Target Audience</span>
            <div className="flex items-center gap-2">
              <Checkbox id="target-all" checked={form.target_all} onCheckedChange={(checked) => set("target_all", !!checked)} />
              <label htmlFor="target-all" className="cursor-pointer text-sm text-slate-700">All users</label>
            </div>
            {!form.target_all && (
              <div className="ml-1 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                {ALL_ROLES.map((role) => (
                  <div key={role.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={form.target_roles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <label htmlFor={`role-${role.value}`} className="cursor-pointer text-sm text-slate-700">
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Channels */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Delivery Channels</span>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Checkbox
                  id="ch-in-app"
                  checked={form.in_app_enabled}
                  onCheckedChange={(checked) => set("in_app_enabled", checked === true)}
                />
                <label htmlFor="ch-in-app" className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <Bell className="h-4 w-4 text-[#1E1B4B]" aria-hidden="true" />
                  In-App Notification
                </label>
              </div>

              <div className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                form.push_enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50"
              )}>
                <Checkbox
                  id="ch-push"
                  checked={form.push_enabled}
                  onCheckedChange={(checked) => set("push_enabled", !!checked)}
                />
                <label htmlFor="ch-push" className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <Smartphone className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Push Notification
                </label>
              </div>

              <div className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                form.email_enabled ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"
              )}>
                <Checkbox
                  id="ch-email"
                  checked={form.email_enabled}
                  onCheckedChange={(checked) => set("email_enabled", !!checked)}
                />
                <label htmlFor="ch-email" className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Email
                </label>
              </div>

              <div className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                form.whatsapp_enabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
              )}>
                <Checkbox
                  id="ch-whatsapp"
                  checked={form.whatsapp_enabled}
                  onCheckedChange={(checked) => set("whatsapp_enabled", !!checked)}
                />
                <label htmlFor="ch-whatsapp" className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <MessageSquare className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  WhatsApp
                </label>
              </div>
            </div>
          </div>

          {/* Publish Timing (only if not draft) */}
          {!form.is_draft && (
            <div className="space-y-3">
              <span className="text-sm font-medium text-slate-700">Publish Timing</span>
              <div className="flex gap-5">
                {(["now", "schedule"] as const).map((mode) => (
                  <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="publish-mode"
                      value={mode}
                      checked={form.publish_mode === mode}
                      onChange={() => set("publish_mode", mode)}
                      className="accent-[#1E1B4B]"
                    />
                    {mode === "now" ? "Publish now" : "Schedule"}
                  </label>
                ))}
              </div>
              {form.publish_mode === "schedule" && (
                <div className="space-y-1">
                  <Label htmlFor="publish-at" className="text-xs text-slate-500">Schedule date &amp; time</Label>
                  <Input
                    id="publish-at"
                    type="datetime-local"
                    value={form.publish_at}
                    onChange={(e) => set("publish_at", e.target.value)}
                    min={nowDatetimeLocal}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Expires At */}
          <div className="space-y-1.5 pb-2">
            <Label htmlFor="expires-at" className="text-sm font-medium text-slate-700">
              Expires At <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Input
              id="expires-at"
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => set("expires_at", e.target.value)}
              min={form.publish_at || nowDatetimeLocal}
              className="max-w-xs"
            />
            <p className="text-xs text-slate-400">After this time the announcement will be marked as expired.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : form.is_draft ? (
              "Save as Draft"
            ) : form.publish_mode === "now" ? (
              "Publish Now"
            ) : (
              "Schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
