"use client";

import { useEffect, useMemo, useState } from "react";
import { visibleFieldKeys, conditionFieldKey } from "@/lib/onboarding-visibility";
import { useParams } from "next/navigation";

import {
  onboardingHelpers,
  onboardingService,
} from "@/services/onboarding-form.service";
import {
  ApiField,
  ApiFieldOption,
  ApiFieldValueObject,
  ApiMeta,
  ApiStep,
  EmployeeDraftResponse,
  FieldErrors,
  FieldValue,
  FormMode,
  FormValues,
} from "@/types/onboarding-form";

function getCompanyUuid() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("company_uuid") ||
    localStorage.getItem("companyUuid") ||
    "6eca7723-dee6-411b-918a-830915d8605a"
  );
}

function isEmptyValue(value: unknown) {
  if (value instanceof File) return false;
  if (Array.isArray(value)) return value.length === 0;
  if (value === null || value === undefined) return true;

  return String(value).trim() === "";
}

function normalizeApiValueToFieldValue(rawValue: unknown): FieldValue {
  if (rawValue === null || rawValue === undefined) return null;

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => {
        if (item && typeof item === "object") {
          const objectValue = item as ApiFieldValueObject & {
            url?: string;
            path?: string;
            file_url?: string;
            document_url?: string;
            preview_url?: string;
            storage_url?: string;
            full_url?: string;
          };

          const fileUrl =
            objectValue.full_url ||
            objectValue.storage_url ||
            objectValue.url ||
            objectValue.file_url ||
            objectValue.document_url ||
            objectValue.preview_url ||
            objectValue.path;

          if (fileUrl) return String(fileUrl);

          return String(objectValue.value ?? objectValue.id ?? "");
        }

        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof rawValue === "object") {
    const objectValue = rawValue as ApiFieldValueObject & {
      url?: string;
      path?: string;
      file_url?: string;
      document_url?: string;
      preview_url?: string;
      storage_url?: string;
      full_url?: string;
    };

    const fileUrl =
      objectValue.full_url ||
      objectValue.storage_url ||
      objectValue.url ||
      objectValue.file_url ||
      objectValue.document_url ||
      objectValue.preview_url ||
      objectValue.path;

    if (fileUrl) {
      return fileUrl;
    }

    const finalValue = objectValue.value ?? objectValue.id ?? "";

    return finalValue === "" ? null : String(finalValue);
  }

  if (typeof rawValue === "boolean") return rawValue ? "1" : "0";
  return String(rawValue);
}

function normalizeStep(step: ApiStep): ApiStep {
  return {
    ...step,
    id: step.id ?? step.step_id ?? 0,
    name: step.name ?? step.step_name ?? "Untitled Step",
    fields_count: step.fields_count ?? step.fields?.length ?? 0,
    required_count:
      step.required_count ??
      step.fields?.filter((field) => field.is_required).length ??
      0,
    fields: step.fields ?? [],
  };
}

function buildFormConfigInitialValues(steps: ApiStep[]) {
  const initialValues: FormValues = {};

  steps.forEach((step) => {
    step.fields.forEach((field) => {
      const fieldKey = onboardingHelpers.getFieldKey(field);

      if (!fieldKey) return;

      const rawValue =
        field.current_value ?? field.value ?? field.default_value ?? (["checkbox", "toggle"].includes(field.type) ? "0" : null);

      const finalValue = normalizeApiValueToFieldValue(rawValue);

      if (finalValue !== null) {
        initialValues[fieldKey] = finalValue;
      }
    });
  });

  return initialValues;
}

function buildEmployeePrefillValues(employeeResponse: EmployeeDraftResponse) {
  const prefillValues: FormValues = {};

  const employeeSteps = employeeResponse.data?.profile?.steps || [];

  employeeSteps.forEach((step) => {
    Object.entries(step.fields || {}).forEach(([fieldKey, field]) => {
      const finalValue = normalizeApiValueToFieldValue(field?.value ?? null);

      if (finalValue !== null) {
        prefillValues[fieldKey] = finalValue;
      }
    });
  });

  return prefillValues;
}

function mergeValues(baseValues: FormValues, employeeValues: FormValues) {
  return {
    ...baseValues,
    ...employeeValues,
  };
}

function getSimpleFieldValue(value: FieldValue) {
  if (value instanceof File) return "";
  if (Array.isArray(value)) return value[0] || "";

  return value || "";
}

export function useOnboardingForm() {
  const params = useParams();

  const routeEmployeeUuid =
    typeof params?.employee_uuid === "string"
      ? params.employee_uuid
      : Array.isArray(params?.employee_uuid)
        ? params.employee_uuid[0]
        : "";

  const [mode, setMode] = useState<FormMode>("quick");
  const [steps, setSteps] = useState<ApiStep[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);

  const [employeeUuid, setEmployeeUuid] = useState(routeEmployeeUuid || "");

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [lazyOptions, setLazyOptions] = useState<
    Record<string, ApiFieldOption[]>
  >({});
  const [lazyLoading, setLazyLoading] = useState<Record<string, boolean>>({});
  const [loadedLazyKeys, setLoadedLazyKeys] = useState<Record<string, boolean>>(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const companyUuid = getCompanyUuid();

  const isEditMode = Boolean(routeEmployeeUuid);

  const allFields = useMemo(() => steps.flatMap(step => step.fields), [steps]);
  const visibleKeys = useMemo(() => visibleFieldKeys(allFields, values, mode), [allFields, values, mode]);
  const visibleSteps = useMemo(() => {
    return [...steps].sort((a,b)=>a.order!==b.order?a.order-b.order:a.id-b.id).map(step=>({
      ...step, fields:step.fields.filter(field=>visibleKeys.has(conditionFieldKey(field))).map(field=>({
        ...field, is_required:(mode==='quick'?field.required_in_quick:field.required_in_detail)??field.is_required,
      })),
    }));
  }, [steps, visibleKeys, mode]);

  const safeStepIndex = Math.min(
    currentStepIndex,
    Math.max(visibleSteps.length - 1, 0)
  );

  const currentStep = visibleSteps[safeStepIndex];
  const currentFields = currentStep?.fields ?? [];
  const totalFields = visibleSteps.flatMap((step) => step.fields);

  const requiredCount = totalFields.filter((field) => field.is_required).length;

  const progress = visibleSteps.length
    ? Math.round(((safeStepIndex + 1) / visibleSteps.length) * 100)
    : 100;

  function getFieldOptions(field: ApiField) {
    const fieldKey = onboardingHelpers.getFieldKey(field);

    if (field.load_strategy === "lazy") {
      return lazyOptions[fieldKey] || [];
    }

    return field.options || [];
  }

  function isLazyFieldDisabled(field: ApiField) {
    if (field.load_strategy !== "lazy") return false;

    const parentSystemKey = field.parent_system_key;

    if (!parentSystemKey) return true;

    const parentValue = values[parentSystemKey];

    if (parentValue instanceof File) return true;
    if (Array.isArray(parentValue)) return parentValue.length === 0;

    return !parentValue;
  }

  function getDirectDependentKeys(parentSystemKey: string) {
    return totalFields
      .filter((field) => field.parent_system_key === parentSystemKey)
      .map((field) => onboardingHelpers.getFieldKey(field))
      .filter(Boolean);
  }

  function getAllDependentKeys(parentSystemKey: string) {
    const collected = new Set<string>();

    function collect(currentParentKey: string) {
      const directKeys = getDirectDependentKeys(currentParentKey);

      directKeys.forEach((key) => {
        if (collected.has(key)) return;

        collected.add(key);
        collect(key);
      });
    }

    collect(parentSystemKey);

    return Array.from(collected);
  }

  function clearDependentValues(parentSystemKey: string) {
    const dependentKeys = getAllDependentKeys(parentSystemKey);

    if (!dependentKeys.length) return;

    setValues((prev) => {
      const next = { ...prev };

      dependentKeys.forEach((key) => {
        delete next[key];
      });

      return next;
    });

    setFieldErrors((prev) => {
      const next = { ...prev };

      dependentKeys.forEach((key) => {
        delete next[key];
      });

      return next;
    });

    setLazyOptions((prev) => {
      const next = { ...prev };

      dependentKeys.forEach((key) => {
        delete next[key];
      });

      return next;
    });

    setLoadedLazyKeys((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((cacheKey) => {
        dependentKeys.forEach((key) => {
          if (cacheKey.startsWith(`${key}:`)) {
            delete next[cacheKey];
          }
        });
      });

      return next;
    });
  }

  async function fetchForm(selectedMode: FormMode) {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      setFieldErrors({});
      setPreviewMode(false);
      setLazyOptions({});
      setLazyLoading({});
      setLoadedLazyKeys({});

      const formJson = await onboardingService.getForm(
        selectedMode,
        companyUuid
      );

      if (!formJson.success) {
        throw new Error(formJson.message || "Failed to load onboarding form.");
      }

      const normalizedSteps = (formJson.data || []).map(normalizeStep);

      let finalValues = buildFormConfigInitialValues(normalizedSteps);

      if (routeEmployeeUuid) {
        const employeeJson = await onboardingService.getEmployee(
          routeEmployeeUuid,
          companyUuid
        );

        if (!employeeJson.success) {
          throw new Error(
            employeeJson.message || "Failed to load employee details."
          );
        }

        const employeeValues = buildEmployeePrefillValues(employeeJson);

        finalValues = mergeValues(finalValues, employeeValues);

        if (employeeJson.data?.id) {
          setEmployeeUuid(employeeJson.data.id);
        }
      }

      setSteps(normalizedSteps);
      setMeta(formJson.meta || null);
      setCurrentStepIndex(0);
      setValues(finalValues);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the form."
      );

      setSteps([]);
      setMeta(null);
      setValues({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchForm(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, routeEmployeeUuid]);

  useEffect(() => {
    const lazyFields = totalFields.filter(
      (field) =>
        field.load_strategy === "lazy" &&
        field.parent_system_key &&
        field.parent_filter_column
    );

    lazyFields.forEach((field) => {
      const fieldKey = onboardingHelpers.getFieldKey(field);
      const parentSystemKey = field.parent_system_key;
      const parentFilterColumn = field.parent_filter_column;

      if (!fieldKey || !parentSystemKey || !parentFilterColumn) return;

      const parentValue = getSimpleFieldValue(values[parentSystemKey]);

      if (!parentValue) return;

      const rawSourceKey = field.source_key || field.parent_source_key;

if (!rawSourceKey) return;

const sourceKey: string = rawSourceKey;

const cacheKey = `${fieldKey}:${sourceKey}:${"parent_value"}:${parentValue}`;

      if (loadedLazyKeys[cacheKey]) return;

      async function loadLazyOptions() {
        try {
          setLazyLoading((prev) => ({
            ...prev,
            [fieldKey]: true,
          }));

          const options = await onboardingService.getLookupOptions({
            sourceKey ,
            companyUuid,
            parentFilterColumn,
            parentValue,
          });

          setLazyOptions((prev) => ({
            ...prev,
            [fieldKey]: options || [],
          }));

          setLoadedLazyKeys((prev) => ({
            ...prev,
            [cacheKey]: true,
          }));
        } catch (err) {
          console.error("Failed to load lazy lookup options", {
            fieldKey,
            sourceKey,
            parentFilterColumn,
            parentValue,
            err,
          });

          setLazyOptions((prev) => ({
            ...prev,
            [fieldKey]: [],
          }));
        } finally {
          setLazyLoading((prev) => ({
            ...prev,
            [fieldKey]: false,
          }));
        }
      }

      loadLazyOptions();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, totalFields.length, companyUuid]);

  function setFieldValue(fieldKey: string, value: FieldValue) {
    setValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    clearDependentValues(fieldKey);

    setFieldErrors((prev) => {
      const nextKeys=visibleFieldKeys(allFields,{...values,[fieldKey]:value},mode);
      const next = Object.fromEntries(Object.entries(prev).filter(([key])=>nextKeys.has(key)));
      delete next[fieldKey];

      return next;
    });

    setError("");
    setSuccessMessage("");
  }

  function validateCurrentStepOnFrontend() {
    const nextErrors: FieldErrors = {};

    currentFields.forEach((field) => {
      if (!field.is_required) return;

      const fieldKey = onboardingHelpers.getFieldKey(field);
      const value = values[fieldKey];

      if (isEmptyValue(value)) {
        nextErrors[fieldKey] = `${field.label} is required.`;
      }
    });

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function submitCurrentStep() {
    if (!currentStep) return false;

    const frontendValid = validateCurrentStepOnFrontend();

    if (!frontendValid) return false;

    try {
      setStepSubmitting(true);
      setError("");
      setSuccessMessage("");

      const result = await onboardingService.submitStep(
        {
          form_mode: mode,
          step_id: currentStep.id,
          values,
          fields: currentFields,
          allFields,
          employee_uuid: employeeUuid || undefined,
        },
        companyUuid
      );

      if (!result.success) {
        setFieldErrors(result.errors || {});
        setError(result.message);
        return false;
      }

      if (result.employeeUuid) {
        setEmployeeUuid(result.employeeUuid);
      }

      setFieldErrors({});
      setSuccessMessage(result.message);

      return true;
    } finally {
      setStepSubmitting(false);
    }
  }

  async function goNext() {
    const submitted = await submitCurrentStep();

    if (!submitted) return;

    setCurrentStepIndex((prev) =>
      Math.min(visibleSteps.length - 1, prev + 1)
    );
  }

  async function goToStep(index: number) {
    if (index <= safeStepIndex) {
      setCurrentStepIndex(index);
      return;
    }

    const submitted = await submitCurrentStep();

    if (!submitted) return;

    setCurrentStepIndex(index);
  }

  async function submitFinalStep() {
    const submitted = await submitCurrentStep();

    if (!submitted) return;

    setPreviewMode(true);
    setSuccessMessage("All steps saved. Please review before publishing.");
  }

  async function publishEmployee() {
    const finalEmployeeUuid = employeeUuid || meta?.employee_uuid || "";

    if (!finalEmployeeUuid) {
      setError("Employee UUID is missing. Please save Step 1 first.");
      return;
    }

    try {
      setPublishing(true);
      setError("");
      setSuccessMessage("");

      const result = await onboardingService.publishEmployee(
        finalEmployeeUuid,
        mode,
        companyUuid
      );

      if (!result.success) {
        setFieldErrors(result.errors || {});
        setError(result.message);
        return;
      }

      setSuccessMessage(result.message || "Employee published successfully.");
    } finally {
      setPublishing(false);
    }
  }

  return {
    mode,
    setMode,

    steps,
    meta,
    visibleSteps,
    currentStep,
    currentFields,
    totalFields,
    requiredCount,

    employeeUuid,
    isEditMode,

    currentStepIndex,
    safeStepIndex,
    setCurrentStepIndex,

    values,
    setFieldValue,

    fieldErrors: Object.fromEntries(Object.entries(fieldErrors).filter(([key])=>visibleKeys.has(key))),
    setFieldErrors,

    lazyOptions,
    lazyLoading,
    getFieldOptions,
    isLazyFieldDisabled,

    loading,
    stepSubmitting,
    publishing,

    previewMode,
    setPreviewMode,

    error,
    setError,

    successMessage,
    setSuccessMessage,

    progress,

    goNext,
    goToStep,
    submitFinalStep,
    publishEmployee,
  };
}