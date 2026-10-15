// lib/campaign-utils.ts
import type { ExtendedFormState, CarouselSlide } from "@/types/campaigns";
import { MAX_SLIDES, MIN_SLIDES } from "@/constants/campaigns";

export const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const revokeIfBlob = (url: string | null | undefined) => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};

export const createEmptySlide = (): CarouselSlide => ({
  id: generateId(),
  image: null,
  imagePreview: null,
  title: "",
  description: "",
  cta_text: "",
  deep_link: "",
  display_duration_seconds: "3",
});

export const validateForm = (form: ExtendedFormState): string | null => {
  if (!form.start_at) return "Start date is required.";
  if (!form.end_at) return "End date is required.";
  if (new Date(form.end_at) <= new Date(form.start_at))
    return "End date must be after start date.";
  if (!form.target_roles.length && !form.target_departments.length)
    return "Select at least one target role or department.";
  if (!form.is_draft && !form.title.trim())
    return "Title is required for publishing.";
  if (
    form.cooldown_hours &&
    (isNaN(Number(form.cooldown_hours)) ||
      Number(form.cooldown_hours) < 0 ||
      Number(form.cooldown_hours) > 720)
  )
    return "Cooldown hours must be between 0 and 720.";
  if (
    form.priority &&
    (isNaN(Number(form.priority)) ||
      Number(form.priority) < 0 ||
      Number(form.priority) > 1000)
  )
    return "Priority must be between 0 and 1000.";

  if (form.type === "carousel") {
    if (!form.slides.length) return "Add at least one slide.";
    if (form.slides.length > MAX_SLIDES)
      return `You can add up to ${MAX_SLIDES} slides.`;
    for (let i = 0; i < form.slides.length; i++) {
      const slide = form.slides[i];
      if (!slide.title.trim()) return `Slide ${i + 1}: title is required.`;
      if (!slide.imagePreview && !slide.image)
        return `Slide ${i + 1}: image is required.`;
      const dur = Number(slide.display_duration_seconds);
      if (slide.display_duration_seconds && (isNaN(dur) || dur < 1 || dur > 60))
        return `Slide ${i + 1}: display duration must be between 1 and 60 seconds.`;
    }
  } else {
    if (
      form.display_duration_seconds &&
      (isNaN(Number(form.display_duration_seconds)) ||
        Number(form.display_duration_seconds) < 1 ||
        Number(form.display_duration_seconds) > 60)
    )
      return "Display duration must be between 1 and 60 seconds.";
  }

  return null;
};

export const toDatetimeLocal = (iso: string | null): string =>
  iso ? iso.slice(0, 16) : "";