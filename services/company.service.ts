import { CompanyStep3Form } from "@/app/(system)/flexi-hq/companies/new/types";
import { api } from "@/lib/api";
import type {
  Company,
  PaginatedCompaniesResponse,
  CompanyStep1FormData,
  CompanyStep1Response,
  CompanyStep2FormData,
  CompanyStep2Response,
  CompanyStep3Response,
} from "@/types/company";

const BASE_PATH = "/flexi-hq/companies";

const getFiscalMonthNumber = (value?: string | number | null) => {
  if (!value) return null;

  if (typeof value === "number") {
    return value;
  }

  // input type="month" gives value like "2026-04"
  if (/^\d{4}-\d{2}$/.test(value)) {
    return Number(value.split("-")[1]);
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? null : numericValue;
};

const toStep1Payload = (data: CompanyStep1FormData): FormData => {
  const formData = new FormData();

  formData.append("company_name", data.company_name.trim());
  formData.append("company_code", data.company_code.trim());

  if (data.parent_company_id) {
    formData.append("parent_company_id", data.parent_company_id);
  }

  if (data.website_url) {
    formData.append("website_url", data.website_url.trim());
  }

  const fiscalMonth = getFiscalMonthNumber(data.fiscal_year_start_month);

  if (fiscalMonth) {
    formData.append("fiscal_year_start_month", String(fiscalMonth));
  }

  if (data.industry) {
    formData.append("industry", data.industry.trim());
  }

  if (data.theme_color) {
    formData.append("theme_color", data.theme_color);
  }

  if (data.description) {
    formData.append("description", data.description.trim());
  }

  if (data.logo instanceof File) {
    formData.append("logo", data.logo);
  }

  return formData;
};
const toStep2Payload = (data: CompanyStep2FormData) => ({
  support_email: data.support_email?.trim() || null,
  social_profiles:
    data.social_profiles
      ?.filter((profile) => profile.platform && profile.handle && profile.url)
      .map((profile) => ({
        platform: profile.platform,
        handle: profile.handle.trim(),
        url: profile.url.trim(),
      })) ?? [],
  wizard_step: 2,
});
const appendIfValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
};

const toStep3Payload = (data: CompanyStep3Form): FormData => {
  const formData = new FormData();

  appendIfValue(formData, "official_email", data.official_email?.trim());
  appendIfValue(formData, "phone", data.phone?.trim());
  appendIfValue(formData, "timezone", data.timezone);

  appendIfValue(formData, "country_id", data.country_id);
  appendIfValue(formData, "state_id", data.state_id);
  appendIfValue(formData, "city_id", data.city_id);
  appendIfValue(formData, "currency_id", data.currency_id);

  appendIfValue(formData, "address_line_1", data.address_line_1?.trim());
  appendIfValue(formData, "address_line_2", data.address_line_2?.trim());
  appendIfValue(formData, "street", data.street?.trim());
  appendIfValue(formData, "postal_code", data.postal_code?.trim());

  appendIfValue(formData, "incorporation_date", data.incorporation_date);
  appendIfValue(
    formData,
    "registration_number",
    data.registration_number?.trim(),
  );
  appendIfValue(formData, "tax_vat_id", data.tax_vat_id?.trim());

  appendIfValue(formData, "date_format", data.date_format);
  appendIfValue(formData, "week_start_day", data.week_start_day);
  appendIfValue(formData, "status", data.status);
if (data.branch_ids && data.branch_ids.length > 0) {
    data.branch_ids.forEach((id) => {
      formData.append("branch_ids[]", String(id));
    });
  }
  formData.append("wizard_step", "3");

  if (data.remove_letterhead) {
    formData.append("remove_letterhead", "1");
  }

  if (data.letterhead instanceof File) {
    formData.append("letterhead", data.letterhead);
  }

  return formData;
};

export const companyService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedCompaniesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: string): Promise<Company> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data.data ?? data;
  },

  createStep1: async (
    payload: CompanyStep1FormData,
  ): Promise<CompanyStep1Response> => {
    const { data } = await api.post(BASE_PATH, toStep1Payload(payload), {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  updateStep1: async (
    companyUuid: string,
    payload: CompanyStep1FormData,
  ): Promise<CompanyStep1Response> => {
    const { data } = await api.post(
      `${BASE_PATH}/${companyUuid}`,
      toStep1Payload(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          _method: "PUT",
        },
      },
    );

    return data;
  },
  updateStep2: async (
    companyUuid: string,
    payload: CompanyStep2FormData,
  ): Promise<CompanyStep2Response> => {
    const { data } = await api.put(
      `${BASE_PATH}/${companyUuid}`,
      toStep2Payload(payload),
    );

    return data;
  },
  updateStep3: async (
    companyUuid: string,
    payload: CompanyStep3Form,
  ): Promise<CompanyStep3Response> => {
    const { data } = await api.post(
      `${BASE_PATH}/${companyUuid}`,
      toStep3Payload(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          _method: "PUT",
        },
      },
    );

    return data;
  },
};
