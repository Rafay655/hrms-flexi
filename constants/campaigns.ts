// constants/campaigns.ts
import { Zap, Square, LayoutTemplate, GalleryHorizontal } from "lucide-react";
import type { CampaignType, CampaignFrequency, ExtendedFormState } from "@/types/campaigns";

export const CAMPAIGN_TYPE_META: Record<
  CampaignType,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  splash_banner: { label: "Splash Banner", icon: Zap, description: "Full-screen on open" },
  popup_modal: { label: "Popup Modal", icon: Square, description: "Centered overlay" },
  home_banner: { label: "Home Banner", icon: LayoutTemplate, description: "Inline banner on home" },
  carousel: { label: "Carousel", icon: GalleryHorizontal, description: "Multi-slide swipeable" },
};

export const CAMPAIGN_TYPES = (Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]).map((value) => ({
  value,
  label: CAMPAIGN_TYPE_META[value].label,
}));

export const FREQUENCY_OPTIONS: { value: CampaignFrequency; label: string }[] = [
  { value: "once_ever", label: "Once Ever" },
  { value: "once_per_day", label: "Once Per Day" },
  { value: "every_app_open", label: "Every App Open" },
];

export const MAX_SLIDES = 5;
export const MIN_SLIDES = 1;

export const inputClass =
  "rounded-xl border-slate-200 shadow-sm focus-visible:ring-4 focus-visible:ring-[#1E1B4B]/10 focus-visible:border-[#1E1B4B]";

export const selectClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1E1B4B] focus:outline-none focus:ring-4 focus:ring-[#1E1B4B]/10";

export const EMPTY_FORM: ExtendedFormState = {
  type: "popup_modal",
  title: "",
  description: "",
  image_alt_text: "",
  cta_text: "",
  deep_link: "",
  target_roles: [],
  target_departments: [],
  start_at: "",
  end_at: "",
  frequency: "once_ever",
  cooldown_hours: "24",
  priority: "10",
  display_duration_seconds: "3",
  is_draft: true,
  slides: [],
};