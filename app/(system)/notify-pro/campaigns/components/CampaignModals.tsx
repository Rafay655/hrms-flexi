// components/CampaignModals.tsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Eye,
  Loader2,
  Megaphone,
  Plus,
  X,
  Sparkles,
  UploadCloud,
  GalleryHorizontal,
  Users,
  Calendar,
  Settings2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SearchableSelect, { Option } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

import type {
  Campaign,
  CampaignType,
  CampaignFrequency,
  CarouselSlide,
  ExtendedFormState,
  CampaignDetail,
} from "@/types/campaigns";
import {
  MAX_SLIDES,
  MIN_SLIDES,
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_META,
  FREQUENCY_OPTIONS,
  inputClass,
  selectClass,
  EMPTY_FORM,
} from "@/constants/campaigns";
import {
  createEmptySlide,
  revokeIfBlob,
  toDatetimeLocal,
  validateForm,
} from "@/lib/campaign-utils";
import {
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
} from "@/hooks/useCampaigns";
import { useDepartments } from "@/hooks/useDepartments";
import { useRoles } from "@/hooks/useRoles";

// ── SectionCard (local) ──────────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, action, children }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E1B4B]/8 text-[#1E1B4B]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ── SlideEditor (local) ──────────────────────────────────────────────────────

interface SlideEditorProps {
  slide: CarouselSlide;
  index: number;
  total: number;
  onChange: (index: number, patch: Partial<CarouselSlide>) => void;
  onImageChange: (index: number, file: File | null) => void;
  onRemove: (index: number) => void;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  index,
  total,
  onChange,
  onImageChange,
  onRemove,
}) => {
  const inputId = `slide-${slide.id}-image`;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1B4B]/8 px-2.5 py-1 text-xs font-semibold text-[#1E1B4B]">
          Slide {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={total <= MIN_SLIDES}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          aria-label={`Remove slide ${index + 1}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 items-start gap-3">
          <label
            htmlFor={inputId}
            className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-colors hover:border-[#1E1B4B]/40 hover:bg-[#1E1B4B]/5 hover:text-[#1E1B4B]"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px] font-medium">Upload</span>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageChange(index, e.target.files?.[0] ?? null)}
          />
          {slide.imagePreview && (
            <div className="relative">
              <img
                src={slide.imagePreview}
                alt={`Slide ${index + 1} preview`}
                className="h-20 w-28 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={() => onImageChange(index, null)}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-slate-500 shadow-md ring-1 ring-slate-200 hover:text-red-600"
                aria-label="Remove slide image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={slide.title}
              onChange={(e) => onChange(index, { title: e.target.value })}
              placeholder="Slide title"
              className={cn(inputClass, "bg-white")}
            />
            <Input
              value={slide.cta_text}
              onChange={(e) => onChange(index, { cta_text: e.target.value })}
              placeholder="CTA text (e.g. Take Survey)"
              className={cn(inputClass, "bg-white")}
            />
          </div>
          <Textarea
            value={slide.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Slide description"
            className={cn(inputClass, "min-h-[60px] bg-white")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={slide.deep_link}
              onChange={(e) => onChange(index, { deep_link: e.target.value })}
              placeholder="/deep/link/path"
              className={cn(inputClass, "bg-white")}
            />
            <Input
              type="number"
              min="1"
              max="60"
              value={slide.display_duration_seconds}
              onChange={(e) => onChange(index, { display_duration_seconds: e.target.value })}
              placeholder="Duration (sec)"
              className={cn(inputClass, "bg-white")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── DetailLoading ────────────────────────────────────────────────────────────

export const DetailLoading: React.FC<{ label?: string }> = ({
  label = "Loading campaign…",
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
    <Loader2 className="h-6 w-6 animate-spin text-[#1E1B4B]" aria-hidden="true" />
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);

// ── CampaignModal ─────────────────────────────────────────────────────────────

interface CampaignModalProps {
  open: boolean;
  editUuid: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  open,
  editUuid,
  onClose,
  onSaved,
}) => {
  const isEdit = editUuid !== null;
  const [form, setForm] = useState<ExtendedFormState>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { mutate: createMutate, isPending: isCreating } = useCreateCampaign();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateCampaign();
  const isSaving = isCreating || isUpdating;

  const { data: detailResponse, isLoading: isDetailLoading } = useCampaign(editUuid ?? "");
  const campaignDetail = detailResponse as CampaignDetail | undefined;

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useDepartments({ per_page: 100 });
  const departmentOptions: Option[] = (departmentsData?.data ?? []).map((d: { id: number; name: string }) => ({
    value: String(d.id),
    label: d.name,
  }));

  const { data: rolesData, isLoading: isRolesLoading } = useRoles();
  const roleOptions: Option[] = (rolesData?.data ?? []).map((r: { id: number; name: string }) => ({
    value: r.name,
    label: r.name,
  }));

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      if (!campaignDetail) return;
      const rawSlides = campaignDetail.slides;

      setForm({
        type: campaignDetail.type,
        title: campaignDetail.title ?? "",
        description: campaignDetail.description ?? "",
        image_alt_text: campaignDetail.image_alt_text ?? "",
        cta_text: campaignDetail.cta_text ?? "",
        deep_link: campaignDetail.deep_link ?? "",
        target_roles: campaignDetail.target_roles ?? [],
        target_departments: campaignDetail.target_departments ?? [],
        start_at: toDatetimeLocal(campaignDetail.start_at),
        end_at: toDatetimeLocal(campaignDetail.end_at),
        frequency: campaignDetail.frequency,
        cooldown_hours: campaignDetail.cooldown_hours?.toString() ?? "0",
        priority: campaignDetail.priority.toString(),
        display_duration_seconds: campaignDetail.display_duration_seconds.toString(),
        is_draft: campaignDetail.is_draft,
        slides:
          campaignDetail.type === "carousel" && rawSlides && rawSlides.length > 0
            ? [...rawSlides]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((s) => ({
                  id: crypto.randomUUID(),
                  image: null,
                  imagePreview: s.image_url,
                  title: s.title ?? "",
                  description: s.description ?? "",
                  cta_text: s.cta_text ?? "",
                  deep_link: s.deep_link ?? "",
                  display_duration_seconds: String(s.display_duration_seconds ?? 3),
                }))
            : campaignDetail.type === "carousel"
            ? [createEmptySlide()]
            : [],
      });
      setImagePreview(campaignDetail.image_url ?? null);
      setImageFile(null);
    } else {
      setForm({ ...EMPTY_FORM, slides: [] });
      setImagePreview(null);
      setImageFile(null);
    }
    setValidationError(null);

    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, campaignDetail]);

  const set = <K extends keyof ExtendedFormState>(key: K, value: ExtendedFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTypeChange = (type: CampaignType) => {
    setForm((f) => ({
      ...f,
      type,
      slides: type === "carousel" && f.slides.length === 0 ? [createEmptySlide()] : f.slides,
    }));
  };

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

  const updateSlide = (index: number, patch: Partial<CarouselSlide>) => {
    setForm((f) => ({
      ...f,
      slides: f.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const handleSlideImageChange = (index: number, file: File | null) => {
    setForm((f) => {
      const slides = [...f.slides];
      const prev = slides[index];
      revokeIfBlob(prev.imagePreview);
      slides[index] = {
        ...prev,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : null,
      };
      return { ...f, slides };
    });
  };

  const addSlide = () => {
    setForm((f) => (f.slides.length >= MAX_SLIDES ? f : { ...f, slides: [...f.slides, createEmptySlide()] }));
  };

  const removeSlide = (index: number) => {
    setForm((f) => {
      if (f.slides.length <= MIN_SLIDES) return f;
      revokeIfBlob(f.slides[index].imagePreview);
      return { ...f, slides: f.slides.filter((_, i) => i !== index) };
    });
  };

  const handleSave = () => {
    const err = validateForm(form);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const formData = new FormData();
    formData.append("type", form.type);
    formData.append("title", form.title.trim());
    formData.append("target_roles", JSON.stringify(form.target_roles));
    formData.append("target_departments", JSON.stringify(form.target_departments));
    formData.append("start_at", form.start_at);
    formData.append("end_at", form.end_at);
    formData.append("frequency", form.frequency);
    formData.append("cooldown_hours", form.cooldown_hours || "0");
    formData.append("priority", form.priority || "0");
    formData.append("is_draft", form.is_draft ? "1" : "0");
    formData.append("is_active", form.is_draft ? "0" : "1");

    if (form.type === "carousel") {
      form.slides.forEach((slide, i) => {
        formData.append(`slides[${i}][title]`, slide.title.trim());
        formData.append(`slides[${i}][description]`, slide.description.trim());
        formData.append(`slides[${i}][cta_text]`, slide.cta_text.trim());
        formData.append(`slides[${i}][deep_link]`, slide.deep_link.trim());
        formData.append(`slides[${i}][display_duration_seconds]`, slide.display_duration_seconds || "3");
        if (slide.image) {
          formData.append(`slides[${i}][image]`, slide.image);
        }
      });
    } else {
      formData.append("description", form.description.trim());
      formData.append("image_alt_text", form.image_alt_text.trim());
      formData.append("cta_text", form.cta_text.trim());
      formData.append("deep_link", form.deep_link.trim());
      formData.append("display_duration_seconds", form.display_duration_seconds || "3");
      if (imageFile) {
        formData.append("image", imageFile);
      }
    }

    if (isEdit) {
      toast.promise(
        new Promise((resolve, reject) => {
          updateMutate(
            { uuid: editUuid!, formData },
            {
              onSuccess: (res) => {
                onSaved();
                resolve(res);
              },
              onError: reject,
            }
          );
        }),
        {
          loading: "Saving campaign…",
          success: "Campaign updated.",
          error: "Failed to update campaign.",
        }
      );
    } else {
      toast.promise(
        new Promise((resolve, reject) => {
          createMutate(formData, {
            onSuccess: (res) => {
              onSaved();
              resolve(res);
            },
            onError: reject,
          });
        }),
        {
          loading: "Creating campaign…",
          success: "Campaign created.",
          error: "Failed to create campaign.",
        }
      );
    }
  };

  const nowDatetimeLocal = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  const showLoadingState = isEdit && isDetailLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-3xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#3730a3] text-white shadow-sm">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {isEdit ? "Edit Campaign" : "New Campaign"}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isEdit ? "Update the details below" : "Set up content, audience and schedule"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50/60 px-6 py-6">
          {showLoadingState ? (
            <DetailLoading />
          ) : (
            <div className="space-y-5">
              {validationError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {validationError}
                </div>
              )}

              {/* Type */}
              <SectionCard icon={Sparkles} title="Campaign Type" subtitle="Choose how this campaign will appear">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CAMPAIGN_TYPES.map((t) => {
                    const meta = CAMPAIGN_TYPE_META[t.value];
                    const Icon = meta.icon;
                    const selected = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTypeChange(t.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                          selected
                            ? "border-[#1E1B4B] bg-[#1E1B4B]/5 text-[#1E1B4B] ring-1 ring-[#1E1B4B]/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Content */}
              <SectionCard
                icon={Sparkles}
                title={form.type === "carousel" ? "Campaign Name" : "Content"}
                subtitle={form.type === "carousel" ? "Internal reference name, not shown to users" : "Title and description shown to users"}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-title">Title</Label>
                  <Input
                    id="campaign-title"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Campaign title"
                    maxLength={255}
                    className={inputClass}
                  />
                </div>
                {form.type !== "carousel" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-description">Description</Label>
                    <Textarea
                      id="campaign-description"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Campaign description"
                      className={cn(inputClass, "min-h-[80px]")}
                    />
                  </div>
                )}
              </SectionCard>

              {/* Creative / Slides */}
              {form.type === "carousel" ? (
                <SectionCard
                  icon={GalleryHorizontal}
                  title="Slides"
                  subtitle="Add up to 5 slides for the carousel"
                  action={
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      {form.slides.length} / {MAX_SLIDES}
                    </span>
                  }
                >
                  <div className="space-y-3">
                    {form.slides.map((slide, i) => (
                      <SlideEditor
                        key={slide.id}
                        slide={slide}
                        index={i}
                        total={form.slides.length}
                        onChange={updateSlide}
                        onImageChange={handleSlideImageChange}
                        onRemove={removeSlide}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSlide}
                    disabled={form.slides.length >= MAX_SLIDES}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-[#1E1B4B]/40 hover:bg-[#1E1B4B]/5 hover:text-[#1E1B4B] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Slide
                  </button>
                </SectionCard>
              ) : (
                <SectionCard icon={UploadCloud} title="Creative" subtitle="Image, call-to-action and destination">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="campaign-image"
                      className="flex h-24 w-36 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-[#1E1B4B]/40 hover:bg-[#1E1B4B]/5 hover:text-[#1E1B4B]"
                    >
                      <UploadCloud className="h-5 w-5" aria-hidden="true" />
                      <span className="text-[11px] font-medium">Upload image</span>
                    </label>
                    <input
                      id="campaign-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-24 w-36 rounded-xl border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-slate-500 shadow-md ring-1 ring-slate-200 hover:text-red-600"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-alt">Image Alt Text</Label>
                    <Input
                      id="campaign-alt"
                      value={form.image_alt_text}
                      onChange={(e) => set("image_alt_text", e.target.value)}
                      placeholder="Alt text for image"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="campaign-cta">CTA Text</Label>
                      <Input
                        id="campaign-cta"
                        value={form.cta_text}
                        onChange={(e) => set("cta_text", e.target.value)}
                        placeholder="Call to action"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="campaign-deeplink">Deep Link</Label>
                      <Input
                        id="campaign-deeplink"
                        value={form.deep_link}
                        onChange={(e) => set("deep_link", e.target.value)}
                        placeholder="/path/to/page"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Audience */}
              <SectionCard icon={Users} title="Audience" subtitle="Who should see this campaign">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Roles</Label>
                    <SearchableSelect
                      multiple
                      options={roleOptions}
                      value={form.target_roles}
                      onChange={(vals) => set("target_roles", vals)}
                      placeholder="Select roles"
                      searchPlaceholder="Search roles..."
                      emptyText="No roles found."
                      groupLabel="Roles"
                      allowAll={false}
                      isLoading={isRolesLoading}
                      widthClass="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Departments</Label>
                    <SearchableSelect
                      multiple
                      options={departmentOptions}
                      value={form.target_departments.map(String)}
                      onChange={(vals) => set("target_departments", vals.map(Number))}
                      placeholder="Select departments"
                      searchPlaceholder="Search departments..."
                      emptyText="No departments found."
                      groupLabel="Departments"
                      allowAll={false}
                      isLoading={isDepartmentsLoading}
                      widthClass="w-full"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Schedule */}
              <SectionCard icon={Calendar} title="Schedule" subtitle="When this campaign runs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-start">Start At</Label>
                    <Input
                      id="campaign-start"
                      type="datetime-local"
                      value={form.start_at}
                      onChange={(e) => set("start_at", e.target.value)}
                      min={nowDatetimeLocal}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-end">End At</Label>
                    <Input
                      id="campaign-end"
                      type="datetime-local"
                      value={form.end_at}
                      onChange={(e) => set("end_at", e.target.value)}
                      min={form.start_at || nowDatetimeLocal}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-frequency">Frequency</Label>
                  <select
                    id="campaign-frequency"
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value as CampaignFrequency)}
                    className={selectClass}
                  >
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </SectionCard>

              {/* Behavior */}
              <SectionCard icon={Settings2} title="Behavior" subtitle="Fine-tune display rules">
                <div className={cn("grid grid-cols-1 gap-4", form.type === "carousel" ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-cooldown">Cooldown Hours</Label>
                    <Input
                      id="campaign-cooldown"
                      type="number"
                      min="0"
                      max="720"
                      value={form.cooldown_hours}
                      onChange={(e) => set("cooldown_hours", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-priority">Priority</Label>
                    <Input
                      id="campaign-priority"
                      type="number"
                      min="0"
                      max="1000"
                      value={form.priority}
                      onChange={(e) => set("priority", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {form.type !== "carousel" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="campaign-duration">Display Duration (sec)</Label>
                      <Input
                        id="campaign-duration"
                        type="number"
                        min="1"
                        max="60"
                        value={form.display_duration_seconds}
                        onChange={(e) => set("display_duration_seconds", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Visibility */}
              <SectionCard icon={Eye} title="Visibility" subtitle="Save as draft or publish now">
                <div>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => set("is_draft", true)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                        form.is_draft ? "bg-white text-[#1E1B4B] shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => set("is_draft", false)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                        !form.is_draft ? "bg-white text-[#1E1B4B] shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Publish
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {form.is_draft ? "Saved privately until you publish it." : "Goes live immediately once saved."}
                  </p>
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl border-slate-200">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || showLoadingState}
            className="rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#2d2a6e] text-white shadow-md transition-shadow hover:shadow-lg hover:from-[#2d2a6e] hover:to-[#1E1B4B]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : form.is_draft ? (
              "Save as Draft"
            ) : (
              "Publish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── ViewCampaignDialog ────────────────────────────────────────────────────────

interface ViewCampaignDialogProps {
  uuid: string | null;
  onClose: () => void;
}

export const ViewCampaignDialog: React.FC<ViewCampaignDialogProps> = ({ uuid, onClose }) => {
  const { data: detailResponse, isLoading } = useCampaign(uuid ?? "");
  const campaign = detailResponse as CampaignDetail | undefined;

  if (!uuid) return null;

  const slides = campaign?.slides ? [...campaign.slides].sort((a, b) => a.sort_order - b.sort_order) : [];

  return (
    <Dialog open={!!uuid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto rounded-3xl border-none p-0 shadow-2xl sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-[#1E1B4B]">Campaign Details</DialogTitle>
        </DialogHeader>

        {isLoading || !campaign ? (
          <DetailLoading />
        ) : (
          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="border text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                {CAMPAIGN_TYPES.find((t) => t.value === campaign.type)?.label ?? campaign.type}
              </Badge>
              <Badge
                className={cn(
                  "border text-xs font-medium",
                  campaign.is_draft
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : campaign.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                )}
              >
                {campaign.is_draft ? "Draft" : campaign.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {campaign.title && (
              <div>
                <h3 className="text-lg font-semibold text-[#1E1B4B]">{campaign.title}</h3>
              </div>
            )}

            {campaign.type !== "carousel" && campaign.image_url && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={campaign.image_url}
                  alt={campaign.image_alt_text || campaign.title || "Campaign"}
                  className="max-h-64 w-full object-cover"
                />
              </div>
            )}

            {campaign.type !== "carousel" && campaign.description && (
              <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap">
                {campaign.description}
              </div>
            )}

            {campaign.type === "carousel" && slides.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700">Slides ({slides.length})</h4>
                <div className="space-y-3">
                  {slides.map((s) => (
                    <div key={s.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                      {s.image_url && (
                        <img src={s.image_url} alt={s.title} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1E1B4B]">{s.title}</p>
                        {s.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{s.description}</p>
                        )}
                        {s.cta_text && (
                          <p className="mt-1 text-xs font-medium text-indigo-600">{s.cta_text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-500">Start At</h4>
                <p className="text-sm text-slate-700">{format(new Date(campaign.start_at), "MMM d, yyyy · h:mm a")}</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-500">End At</h4>
                <p className="text-sm text-slate-700">{format(new Date(campaign.end_at), "MMM d, yyyy · h:mm a")}</p>
              </div>
              {campaign.frequency && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-slate-500">Frequency</h4>
                  <p className="text-sm text-slate-700">{campaign.frequency}</p>
                </div>
              )}
              {campaign.cooldown_hours !== null && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-slate-500">Cooldown Hours</h4>
                  <p className="text-sm text-slate-700">{campaign.cooldown_hours}</p>
                </div>
              )}
              {campaign.priority !== null && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-slate-500">Priority</h4>
                  <p className="text-sm text-slate-700">{campaign.priority}</p>
                </div>
              )}
              {campaign.type !== "carousel" && campaign.display_duration_seconds !== null && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-slate-500">Display Duration</h4>
                  <p className="text-sm text-slate-700">{campaign.display_duration_seconds} sec</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-700">Target Roles</h4>
              {campaign.target_roles && campaign.target_roles.length > 0 ? (
                <p className="text-sm text-slate-600">{campaign.target_roles.join(", ")}</p>
              ) : (
                <p className="text-sm text-slate-600">All roles</p>
              )}
            </div>

        <div>
  <h4 className="mb-2 text-sm font-medium text-slate-700">Target Departments</h4>
  {campaign.target_departments_data && campaign.target_departments_data.length > 0 ? (
    <p className="text-sm text-slate-600">
      {campaign.target_departments_data.map((d) => d.name).join(", ")}
    </p>
  ) : (
    <p className="text-sm text-slate-600">All departments</p>
  )}
</div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── ConfirmActionDialog ───────────────────────────────────────────────────────

interface ConfirmActionDialogProps {
  action: { type: "publish" | "unpublish" | "delete" | "duplicate"; campaign: Campaign } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  action,
  onClose,
  onConfirm,
}) => {
  if (!action) return null;

  const { type, campaign } = action;
  const title = campaign.title || campaign.type;
  const descriptions = {
    publish: `Publish "${title}"? It will become active immediately.`,
    unpublish: `Unpublish "${title}"? It will stop being displayed.`,
    delete: `Delete "${title}"? This action cannot be undone.`,
    duplicate: `Duplicate "${title}"? A copy will be created.`,
  };

  return (
    <AlertDialog open={!!action} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {type === "publish"
              ? "Publish campaign?"
              : type === "unpublish"
              ? "Unpublish campaign?"
              : type === "delete"
              ? "Delete campaign?"
              : "Duplicate campaign?"}
          </AlertDialogTitle>
          <AlertDialogDescription>{descriptions[type]}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={type === "delete" ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]"}
          >
            {type === "publish" ? "Publish" : type === "unpublish" ? "Unpublish" : type === "delete" ? "Delete" : "Duplicate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};