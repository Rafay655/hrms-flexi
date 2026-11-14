import { api } from "@/lib/api";
import {
  ApiField,
  EmployeeDraftResponse,
  FieldErrors,
  FieldValue,
  FormMode,
  FormResponse,
  PublishEmployeeResponse,
  StepSubmitPayload,
} from "@/types/onboarding-form";
import { ApiFieldOption } from "@/types/onboarding-form";
const BASE_URL = "/people-hub/onboarding";

function getFieldKey(field: ApiField) {
  return field.system_key || field.field_key || "";
}

function normalizeErrorKey(key: string) {
  return key
    .replace(/^data\./, "")
    .replace(/^files\./, "")
    .replace(/^data\[/, "")
    .replace(/^files\[/, "")
    .replace(/\]$/, "")
    .replace(/\.\d+$/, "");
}

function normalizeLaravelErrors(
  errors?: Record<string, string[] | string>
): FieldErrors {
  const normalized: FieldErrors = {};

  if (!errors) return normalized;

  Object.entries(errors).forEach(([key, value]) => {
    const cleanKey = normalizeErrorKey(key);

    normalized[cleanKey] = Array.isArray(value)
      ? value[0] || "Invalid value."
      : value || "Invalid value.";
  });

  return normalized;
}

function isEmptyFormValue(value: FieldValue) {
  if (value instanceof File) return false;
  if (Array.isArray(value)) return value.length === 0;
  if (value === null || value === undefined) return true;

  return String(value).trim() === "";
}

function appendStepFieldToFormData(
  formData: FormData,
  field: ApiField,
  value: FieldValue
) {
  const fieldKey = getFieldKey(field);

  if (!fieldKey || isEmptyFormValue(value)) return;

  if (value instanceof File) {
    formData.append(`files[${fieldKey}]`, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      formData.append(`data[${fieldKey}][]`, item);
    });
    return;
  }

  formData.append(`data[${fieldKey}]`, value as string | Blob);
}

function buildStepFormData(payload: StepSubmitPayload) {
  const formData = new FormData();

  formData.append("form_mode", payload.form_mode);
  formData.append("step_id", String(payload.step_id));

  payload.fields.forEach((field) => {
    const fieldKey = getFieldKey(field);
    const value = payload.values[fieldKey];

    appendStepFieldToFormData(formData, field, value);
  });

  return formData;
}

function getSubmitUrl(employeeUuid?: string) {
  if (employeeUuid) {
    return `${BASE_URL}/${employeeUuid}/update`;
  }

  return BASE_URL;
}

function extractEmployeeUuid(raw: unknown) {
  const response = raw as EmployeeDraftResponse;

  return (
    response?.data?.id ||
    response?.data?.employee_uuid ||
    response?.data?.uuid ||
    response?.id ||
    response?.employee_uuid ||
    response?.uuid ||
    ""
  );
}

export type OnboardingReadinessField = {
  field_key: string;
  field_label: string;
  required_in_detail?: boolean;
  show_in_detail?: boolean;
  table: string | null;
  module: string;
};
export type OnboardingReadiness = {
  ready: boolean;
  mode: FormMode;
  issues: (OnboardingReadinessField & { step: string | null; reason: string; message: string })[];
  required_fields?: OnboardingReadinessField[];
};

export const onboardingService = {
  async readiness(mode: FormMode, signal?: AbortSignal): Promise<OnboardingReadiness> {
    const { data } = await api.get<{ success: boolean; message?: string; data: OnboardingReadiness }>(`${BASE_URL}/readiness`, { params: { mode }, signal });
    if (!data.success) throw new Error(data.message || "Unable to check onboarding readiness.");
    return data.data;
  },
  getForm: async (mode: FormMode, companyUuid: string) => {
    const response = await api.get<FormResponse>(`${BASE_URL}/form`, {
      params: {
        mode,
      },
      headers: {
        Accept: "application/json",
        "X-Company-ID": companyUuid,
      },
    });

    return response.data;
  },

  getEmployee: async (employeeUuid: string, companyUuid: string) => {
    const response = await api.get<EmployeeDraftResponse>(
      `${BASE_URL}/${employeeUuid}`,
      {
        headers: {
          Accept: "application/json",
          "X-Company-ID": companyUuid,
        },
      }
    );

    return response.data;
  },

  submitStep: async (payload: StepSubmitPayload, companyUuid: string) => {
  const formData = buildStepFormData(payload);

  const url = getSubmitUrl(payload.employee_uuid);

  try {
    const response = await api.post<EmployeeDraftResponse>(url, formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        "X-Company-ID": companyUuid,
      },
    });

    return {
      success: response.data.success !== false,
      message: response.data.message || "Step saved successfully.",
      employeeUuid: extractEmployeeUuid(response.data),
      errors: {},
      raw: response.data,
    };
  } catch (error: any) {
    const responseData = error?.response?.data;

    return {
      success: false,
      message:
        responseData?.message ||
        error?.message ||
        "Something went wrong while submitting this step.",
      employeeUuid: "",
      errors: normalizeLaravelErrors(responseData?.errors),
      raw: responseData,
    };
  }
},

  publishEmployee: async (
  employeeUuid: string,
  formMode: FormMode,
  companyUuid: string
) => {
  const formData = new FormData();

  formData.append("form_mode", formMode);

  try {
    const response = await api.post<PublishEmployeeResponse>(
      `${BASE_URL}/${employeeUuid}/update`,
      formData,
      {
        params: {
          finalize: true,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          "X-Company-ID": companyUuid,
        },
      }
    );

    return {
      success: response.data.success !== false,
      message: response.data.message || "Employee published successfully.",
      errors: {},
      raw: response.data,
    };
  } catch (error: any) {
    const responseData = error?.response?.data;

    return {
      success: false,
      message:
        responseData?.message ||
        error?.message ||
        "Something went wrong while publishing employee.",
      errors: normalizeLaravelErrors(responseData?.errors),
      raw: responseData,
    };
  }
},getLookupOptions: async ({
  sourceKey,
  companyUuid,
  parentValue,
}: {
  sourceKey: string;
  companyUuid: string;
  parentFilterColumn?: string | null;
  parentValue?: string | number | null;
}) => {
  const params: Record<string, string | number> = {
    company_uuid: companyUuid,
  };

  if (parentValue !== null && parentValue !== undefined) {
    params.parent_value = parentValue;
  }

  const response = await api.get<{
    success?: boolean;
    message?: string;
    data?: ApiFieldOption[];
    options?: ApiFieldOption[];
  }>(`/people-hub/lookups/${sourceKey}`, {
    params,
    headers: {
      Accept: "application/json",
      "X-Company-ID": companyUuid,
    },
  });

  return response.data.data || response.data.options || [];
},
};

export const onboardingHelpers = {
  getFieldKey,
  normalizeLaravelErrors,
  extractEmployeeUuid,
};