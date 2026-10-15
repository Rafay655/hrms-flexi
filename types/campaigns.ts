export type CampaignType = "splash_banner" | "popup_modal" | "home_banner" | "carousel";
export type CampaignFrequency = "once_ever" | "once_per_day" | "every_app_open";
import {

  Zap,
  Square,
  LayoutTemplate,
  GalleryHorizontal,

} from "lucide-react";

export interface Campaign {
  uuid: string;
  type: CampaignType;
  title: string | null;
  description: string | null;
  image_url: string | null;
  image_alt_text: string | null;
  cta_text: string | null;
  deep_link: string | null;
  target_roles: string[] | null;
  target_departments: number[] | null;
  start_at: string;
  end_at: string;
  frequency: CampaignFrequency;
  cooldown_hours: number | null;
  priority: number;
  display_duration_seconds: number;
  is_active: boolean;
  is_draft: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignFormState {
  type: CampaignType;
  title: string;
  description: string;
  image_alt_text: string;
  cta_text: string;
  deep_link: string;
  target_roles: string[];
  target_departments: number[];
  start_at: string;
  end_at: string;
  frequency: CampaignFrequency;
  cooldown_hours: string;
  priority: string;
  display_duration_seconds: string;
  is_draft: boolean;
}

export interface CampaignsResponse {
  data: Campaign[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}


export interface CampaignSlide {
  id: number;
  uuid: string;
  campaign_id: number;
  image_path: string | null;
  image_alt_text: string | null;
  title: string;
  description: string | null;
  cta_text: string | null;
  deep_link: string | null;
  display_duration_seconds: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  image_url: string | null;
}

export type CampaignDetail = Campaign & { slides?: CampaignSlide[];target_departments_data?: { id: number; name: string }[]; };

// ── Constants ─────────────────────────────────────────────────────────────────

export const CAMPAIGN_TYPE_META: Record<
  CampaignType,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  splash_banner: { label: "Splash Banner", icon: Zap, description: "Full-screen on open" },
  popup_modal: { label: "Popup Modal", icon: Square, description: "Centered overlay" },
  home_banner: { label: "Home Banner", icon: LayoutTemplate, description: "Inline banner on home" },
  carousel: { label: "Carousel", icon: GalleryHorizontal, description: "Multi-slide swipeable" },
};

 export const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = (
  Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]
).map((value) => ({ value, label: CAMPAIGN_TYPE_META[value].label }));

export const FREQUENCY_OPTIONS: { value: CampaignFrequency; label: string }[] = [
  { value: "once_ever", label: "Once Ever" },
  { value: "once_per_day", label: "Once Per Day" },
  { value: "every_app_open", label: "Every App Open" },
];

export const MAX_SLIDES = 5;
export const MIN_SLIDES = 1;

export interface CarouselSlide {
  id: string;
  image: File | null;
  imagePreview: string | null;
  title: string;
  description: string;
  cta_text: string;
  deep_link: string;
  display_duration_seconds: string;
}

export type ExtendedFormState = CampaignFormState & { slides: CarouselSlide[] };