import { z } from "zod";
import type { Company } from "@/types/company";
export const companyStep1Schema = z.object({
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters"),

  company_code: z
    .string()
    .min(1, "Company code is required")
    .max(20, "Company code must be less than 20 characters")
    .regex(
      /^[A-Za-z0-9\-_]+$/,
      "Only letters, numbers, hyphen and underscore are allowed"
    ),

  parent_company_id: z.string().nullable().optional(),

  website_url: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^https?:\/\/.+/.test(value),
      "Website must be a valid URL"
    ),

  fiscal_year_start_month: z.string().nullable().optional(),

  industry: z.string().max(100).nullable().optional(),

  logo: z.any().nullable().optional(),

  theme_color: z
    .string()
    .regex(/^#[A-Fa-f0-9]{6}$/, "Theme color must be a valid hex color")
    .nullable()
    .optional(),

  description: z.string().max(1000).nullable().optional(),
});

export type CompanyFormValues = z.infer<typeof companyStep1Schema>;

export type props = {
  next: () => void;
  prev?: () => void;
  isLast?: boolean;
  companyUuid?: string | null;
  setCompanyUuid?: (uuid: string) => void;
  initialData?: Company | null;
  onCompanyUpdated?: (company: Company) => void;
};
/* ------------------------------------------------------------------ */
/* Step 2 – Digital Presence                                          */
/* ------------------------------------------------------------------ */

export const PLATFORM_OPTIONS = [
  "linkedin",
  "twitter",
  "facebook",
  "instagram",
  "youtube",
  "other",
] as const;

export const socialProfileSchema = z.object({
  platform: z.enum(PLATFORM_OPTIONS),
  handle: z.string().min(1, "Handle is required").max(100),
  url: z.string().url("Enter a valid URL").max(255),
});

export const digitalPresenceSchema = z.object({
  support_email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Enter a valid support email"
    ),

  social_profiles: z
    .array(socialProfileSchema)
    .max(10, "Maximum 10 social profiles allowed"),
});

export type DigitalPresenceForm = z.infer<typeof digitalPresenceSchema>;
/* ------------------------------------------------------------------ */
/* Step 3 – Contact & Legal                                           */
/* ------------------------------------------------------------------ */

export const DATE_FORMAT_OPTIONS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
] as const;

// in types.ts
export const WEEK_START_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const COMPANY_STATUS_OPTIONS = ["active", "inactive"] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Karachi", label: "Asia/Karachi" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
] as const;

export type TimezoneValue = (typeof TIMEZONE_OPTIONS)[number]["value"];

export const companyStep3Schema = z.object({
  official_email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Enter a valid official email"
    ),

  phone: z.string().max(20).optional().nullable(),
  timezone: z.string().optional().nullable(),

  country_id: z.string().optional().nullable(),
  state_id: z.string().optional().nullable(),
  city_id: z.string().optional().nullable(),

  address_line_1: z.string().max(255).optional().nullable(),
  address_line_2: z.string().max(255).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),

  incorporation_date: z.string().optional().nullable(),
  registration_number: z.string().max(50).optional().nullable(),
  tax_vat_id: z.string().max(50).optional().nullable(),

  currency_id: z.string().optional().nullable(),

  letterhead: z.any().nullable().optional(),
  remove_letterhead: z.boolean().optional(),
branch_ids: z.array(z.string()).min(1, "Select at least one branch"),
  date_format: z.enum(DATE_FORMAT_OPTIONS).optional().nullable(),
  week_start_day: z.enum(WEEK_START_OPTIONS).optional().nullable(),
  status: z.enum(COMPANY_STATUS_OPTIONS).optional().nullable(),
});

export type CompanyStep3Form = z.infer<typeof companyStep3Schema>;