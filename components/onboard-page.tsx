"use client";

import { Fragment, useEffect, useState, type MouseEvent } from "react";
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CreditCard,
  DollarSign,
  Eye,
  FilePlus,
  FileText,
  Info,
  Loader2,
  Phone,
  Save,
  UploadCloud,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import SearchSelect from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { onboardingHelpers, onboardingService } from "@/services/onboarding-form.service";
import { ApiField, ApiStep } from "@/types/onboarding-form";

const iconMap: Record<string, LucideIcon> = {
  user: User,
  briefcase: Briefcase,
  phone: Phone,
  users: Users,
  "credit-card": CreditCard,
  "file-text": FileText,
  "file-plus": FilePlus,
  "dollar-sign": DollarSign,
};

function getStepIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Circle;
  return iconMap[iconName] ?? Circle;
}

function getColumnClass(span?: number) {
  if (span === 2) return "md:col-span-2";
  if (span === 3) return "md:col-span-3";
  if (span === 4) return "md:col-span-4";
  if (span === 5) return "md:col-span-5";
  if (span === 6) return "md:col-span-6";
  if (span === 7) return "md:col-span-7";
  if (span === 8) return "md:col-span-8";
  if (span === 9) return "md:col-span-9";
  if (span === 10) return "md:col-span-10";
  if (span === 11) return "md:col-span-11";
  if (span === 12) return "md:col-span-12";

  return "md:col-span-1";
}

function getInputType(type: string) {
  if (type === "phone") return "tel";
  if (type === "email") return "email";
  if (type === "date") return "date";
  if (type === "number") return "number";
  if (type === "password") return "password";

  return "text";
}

function buildStorageSrc(url: string | null | undefined) {
  if (!url) return "";

  if (url.startsWith("http") || url.startsWith("blob:")) {
    return url;
  }

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") || "";

  return `${apiBaseUrl}${url}`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isImageUrl(url: string) {
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url);
}

function getExistingFileUrl(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && !(value instanceof File)) {
    const fileObject = value as {
      url?: string;
      path?: string;
      file_url?: string;
      document_url?: string;
      preview_url?: string;
      storage_url?: string;
      full_url?: string;
    };

    return (
      fileObject.full_url ||
      fileObject.storage_url ||
      fileObject.url ||
      fileObject.file_url ||
      fileObject.document_url ||
      fileObject.preview_url ||
      fileObject.path ||
      ""
    );
  }

  return "";
}

function getExistingFileName(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.split("/").pop() || value;
  }

  if (typeof value === "object" && !(value instanceof File)) {
    const fileObject = value as {
      name?: string;
      original_name?: string;
      filename?: string;
      file_name?: string;
      path?: string;
      url?: string;
    };

    return (
      fileObject.original_name ||
      fileObject.file_name ||
      fileObject.name ||
      fileObject.filename ||
      fileObject.path?.split("/").pop() ||
      fileObject.url?.split("/").pop() ||
      ""
    );
  }

  return "";
}

function getOptionLabel(
  options: { value: unknown; label: unknown }[] | undefined | null,
  rawValue: unknown,
) {
  if (rawValue === null || rawValue === undefined) return "";
  if (!options || !options.length) return String(rawValue);

  const match = options.find(
    (option) => String(option.value) === String(rawValue),
  );

  return match ? String(match.label) : String(rawValue);
}

function getPreviewValue(
  field: ApiField,
  value: unknown,
  options?: { value: unknown; label: unknown }[] | null,
) {
  if (field.type === "select") {
    const label = getOptionLabel(options, value);
    return label.trim() === "" ? "—" : label;
  }

  if (field.type === "multiselect" || field.type === "multi_select") {
    const selectedValues = Array.isArray(value) ? value : [];
    if (!selectedValues.length) return "—";

    const labels = selectedValues
      .map((singleValue) => getOptionLabel(options, singleValue))
      .filter((label) => label.trim() !== "");

    return labels.length ? labels.join(", ") : "—";
  }

  if (field.type === "radio") {
    const match = field.options?.find(
      (option) => String(option.value) === String(value),
    );
    return match ? match.label : value ? String(value) : "—";
  }

  if (field.type === "checkbox") {
    return value === "1" ? "Yes" : "No";
  }

  if (value instanceof File) return value.name;
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  return String(value);
}

function useFilePreviewUrl(value: unknown, existingUrl: string) {
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    if (!(value instanceof File)) {
      setBlobUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(value);
    setBlobUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [value]);

  if (value instanceof File) return blobUrl;
  return existingUrl ? buildStorageSrc(existingUrl) : "";
}

function PreviewFieldValue({
  field,
  value,
  options,
}: {
  field: ApiField;
  value: unknown;
  options?: { value: unknown; label: unknown }[] | null;
}) {
  const isFileField = field.type === "file" || field.type === "upload";
  const existingUrl = getExistingFileUrl(value);
  const previewUrl = useFilePreviewUrl(isFileField ? value : null, existingUrl);

  if (isFileField) {
    const existingName = getExistingFileName(value);
    const fileName = value instanceof File ? value.name : existingName;

    const showImage =
      value instanceof File
        ? isImageFile(value)
        : previewUrl
          ? isImageUrl(previewUrl)
          : false;

    if (!previewUrl) {
      return (
        <p className="text-sm font-medium text-muted-foreground/60">
          Not provided
        </p>
      );
    }

    if (showImage) {
      return (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="group/img relative mt-0.5 inline-block overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm transition-shadow hover:shadow-md"
        >
          <img
            src={previewUrl}
            alt={`${field.label} preview`}
            className="h-24 w-24 object-cover transition-transform duration-300 ease-out group-hover/img:scale-110"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover/img:bg-black/30 group-hover/img:opacity-100">
            <Eye className="h-4 w-4 text-white drop-shadow" />
          </div>
        </a>
      );
    }

    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-0.5 inline-flex max-w-full items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-brand-800/40 hover:bg-brand-50/50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
          <FileText className="h-3.5 w-3.5" />
        </span>

        <span className="truncate">{fileName || "View file"}</span>
      </a>
    );
  }

  if (field.type === "multiselect" || field.type === "multi_select") {
    const selectedValues = Array.isArray(value) ? value : [];

    if (!selectedValues.length) {
      return (
        <p className="text-sm font-medium text-muted-foreground/60">
          Not provided
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {selectedValues.map((singleValue, index) => (
          <span
            key={`${String(singleValue)}-${index}`}
            className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
          >
            {getOptionLabel(options, singleValue)}
          </span>
        ))}
      </div>
    );
  }

  const displayValue = getPreviewValue(field, value, options);
  const isEmptyDisplay = displayValue === "—";

  return (
    <p
      className={
        isEmptyDisplay
          ? "text-sm font-medium text-muted-foreground/60"
          : "break-words text-sm font-semibold text-foreground"
      }
    >
      {isEmptyDisplay ? "Not provided" : displayValue}
    </p>
  );
}

function PreviewStepAccordion({
  step,
  stepIndex,
  isLastStep,
  isOpen,
  onToggle,
  values,
  getFieldOptions,
}: {
  step: ApiStep;
  stepIndex: number;
  isLastStep: boolean;
  isOpen: boolean;
  onToggle: () => void;
  values: Record<string, unknown>;
  getFieldOptions: (
    field: ApiField,
  ) => { value: unknown; label: unknown }[] | null | undefined;
}) {
  const StepIcon = getStepIcon(step.icon);
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (!contentRef) return;

    const updateHeight = () => setMaxHeight(contentRef.scrollHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(contentRef);

    return () => observer.disconnect();
  }, [contentRef, isOpen, step.fields, values]);

  const missingRequiredCount = step.fields.filter((field) => {
    if (!field.is_required) return false;
    const fieldKey = onboardingHelpers.getFieldKey(field);
    const value = values[fieldKey];
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  }).length;

  return (
    <div className="relative flex gap-4 md:gap-5">
      <div className="flex flex-col items-center">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
            isOpen
              ? "border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-900"
              : "border-brand-800/20 bg-brand-50 text-brand-800 dark:border-brand-300/20 dark:bg-brand-900/30 dark:text-brand-300",
          ].join(" ")}
        >
          <StepIcon className="h-4 w-4" />
        </div>

        {!isLastStep ? (
          <div className="my-1 w-px flex-1 bg-gradient-to-b from-border via-border to-transparent" />
        ) : null}
      </div>

      <div className={isLastStep ? "flex-1 pb-2" : "flex-1 pb-4"}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-3 rounded-lg py-1.5 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground/80">
              {step.name}
            </h3>

            <span className="text-[11px] font-medium text-muted-foreground">
              {step.fields.length}{" "}
              {step.fields.length === 1 ? "field" : "fields"}
            </span>

            {missingRequiredCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <span className="h-1 w-1 rounded-full bg-red-500" />
                {missingRequiredCount} missing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Check className="h-2.5 w-2.5" />
                Complete
              </span>
            )}
          </div>

          <ChevronRight
            className={[
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
              isOpen ? "rotate-90" : "rotate-0",
            ].join(" ")}
          />
        </button>

        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{
            maxHeight: isOpen ? maxHeight : 0,
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div ref={setContentRef} className="pb-1 pt-3">
            {step.fields.length ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {step.fields.map((field) => {
                  const fieldKey = onboardingHelpers.getFieldKey(field);
                  const value = values[fieldKey];
                  const fieldOptions = getFieldOptions(field);
                  const isEmpty =
                    value === null ||
                    value === undefined ||
                    value === "" ||
                    (Array.isArray(value) && value.length === 0);
                  const isFileField =
                    field.type === "file" || field.type === "upload";
                  const isWideField =
                    isFileField ||
                    field.type === "multiselect" ||
                    field.type === "multi_select" ||
                    field.type === "textarea";

                  return (
                    <div
                      key={field.id}
                      className={[
                        "group relative overflow-hidden rounded-xl border bg-card/60 px-3.5 py-3 transition-colors",
                        isEmpty && field.is_required
                          ? "border-red-300/60 bg-red-50/40 dark:bg-red-950/10"
                          : "border-border/60 hover:border-brand-800/30 hover:bg-brand-50/30 dark:hover:bg-brand-900/10",
                        isWideField ? "sm:col-span-2" : "",
                      ].join(" ")}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/80">
                          {field.label}
                        </p>

                        {field.is_required ? (
                          <span
                            className={[
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              isEmpty
                                ? "bg-red-400"
                                : "bg-emerald-400/70",
                            ].join(" ")}
                          />
                        ) : null}
                      </div>

                      <PreviewFieldValue
                        field={field}
                        value={value}
                        options={fieldOptions}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/60 px-3.5 py-3 text-xs text-muted-foreground">
                No fields configured in this step.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getValidationInfoItems(field: ApiField) {
  const validations = field.validations || [];

  if (validations.length > 0) {
    return validations.map((validation) => {
      const paramText =
        validation.param !== null &&
        validation.param !== undefined &&
        String(validation.param).trim() !== ""
          ? ` (${validation.param})`
          : "";

      return {
        title: `${validation.label}${paramText}`,
        description: validation.description,
      };
    });
  }

  if (field.is_required) {
    return [
      {
        title: "Required",
        description: "This field is required in this mode.",
      },
    ];
  }

  return [
    {
      title: "Optional",
      description: "This field is optional in this mode.",
    },
  ];
}

function FieldInfoTooltip({ field }: { field: ApiField }) {
  const items = getValidationInfoItems(field);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  function handleMouseEnter(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 280;
    const gap = 8;

    let left = rect.left;
    const maxLeft = window.innerWidth - tooltipWidth - 12;

    if (left > maxLeft) left = maxLeft;
    if (left < 12) left = 12;

    setPosition({
      top: rect.bottom + gap,
      left,
    });

    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-brand-800"
        aria-label={`${field.label} validation info`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="fixed z-[9999] w-[280px] rounded-xl border border-border bg-white p-3 text-left shadow-xl dark:bg-popover"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="mb-2 text-xs font-semibold text-foreground">
            {field.label} rules
          </div>

          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={`${field.id}-info-${index}`} className="flex gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-800" />

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-foreground">
                    {item.title}
                  </span>

                  <span className="block text-[11px] leading-snug text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function FileUploadField({
  field,
  fieldKey,
  value,
  errorMessage,
  setFieldValue,
}: {
  field: ApiField;
  fieldKey: string;
  value: unknown;
  errorMessage?: string;
  setFieldValue: (fieldKey: string, value: File | string | null) => void;
}) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const existingUrl = getExistingFileUrl(value);
  const existingName = getExistingFileName(value);

  const previewUrl =
    value instanceof File
      ? localPreviewUrl
      : existingUrl
        ? buildStorageSrc(existingUrl)
        : "";

  const fileName =
    value instanceof File ? value.name : existingName || "Uploaded file";

  const showImage =
    value instanceof File
      ? isImageFile(value)
      : previewUrl
        ? isImageUrl(previewUrl)
        : false;

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setLocalPreviewUrl(nextPreviewUrl);
    setFieldValue(fieldKey, file);
  }

  function handleRemove() {
    if (localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setLocalPreviewUrl("");
    setFieldValue(fieldKey, null);
  }

  return (
    <div
      className={
        errorMessage
          ? "rounded-xl border border-dashed border-red-400 bg-muted/40 p-4"
          : "rounded-xl border border-dashed border-border bg-muted/40 p-4"
      }
    >
      {previewUrl ? (
        <div className="flex flex-col items-center justify-center text-center">
          {showImage ? (
            <div className="relative h-28 w-28 rounded-xl border bg-background p-1 shadow-sm">
              <img
                src={previewUrl}
                alt={`${field.label} preview`}
                className="h-full w-full rounded-lg object-contain"
              />

              <button
                type="button"
                onClick={handleRemove}
                className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative flex w-full flex-col items-center justify-center rounded-lg border bg-background px-3 py-4 text-center shadow-sm">
              <FileText className="mb-2 h-7 w-7 text-brand-800" />

              <p className="max-w-full break-all text-sm font-medium text-foreground">
                {fileName}
              </p>

              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-800 underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View document
                </a>
              ) : null}

              <button
                type="button"
                onClick={handleRemove}
                className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            Change file
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {field.placeholder || "PNG, JPG, PDF, DOC"}
          </p>
        </div>
      ) : (
        <label className="flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-lg text-center transition hover:bg-brand-100/30">
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
          />

          <UploadCloud className="mb-2 h-6 w-6 text-brand-800" />

          <p className="text-sm font-medium">Click to upload</p>

          <p className="text-xs text-muted-foreground">
            {field.placeholder || "PNG, JPG, PDF, DOC"}
          </p>
        </label>
      )}
    </div>
  );
}

function StepNavigator({
  steps,
  activeIndex,
  onStepClick,
  disabled,
}: {
  steps: ApiStep[];
  activeIndex: number;
  onStepClick: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full overflow-x-auto py-6">
      <div
        className="flex items-start"
        style={{ minWidth: `${Math.max(steps.length * 110, 380)}px` }}
      >
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          const lineFilled = index < activeIndex;
          const StepIcon = getStepIcon(step.icon);

          return (
            <Fragment key={step.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onStepClick(index)}
                className="group relative z-10 flex w-[90px] shrink-0 flex-col items-center gap-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div
                  className={[
                    "relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ease-out",
                    isActive
                      ? "scale-110 border-brand-800 bg-brand-800 text-white shadow-[0_0_0_4px_hsl(var(--brand-800)/0.15)] dark:border-brand-300 dark:bg-brand-300 dark:text-brand-900"
                      : isDone
                        ? "border-brand-800 bg-brand-50 text-brand-800 dark:border-brand-300 dark:bg-brand-900/30 dark:text-brand-300"
                        : "border-border bg-background text-muted-foreground group-hover:border-brand-800/40 group-hover:bg-brand-50/60",
                  ].join(" ")}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping rounded-full bg-brand-800 opacity-[0.18]"
                    />
                  ) : null}

                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <StepIcon className="h-[18px] w-[18px]" />
                  )}
                </div>

                <div className="flex flex-col items-center gap-0.5 px-1 text-center">
                  <span
                    className={[
                      "line-clamp-2 text-[11px] font-semibold leading-tight transition-colors duration-200",
                      isActive
                        ? "text-brand-800 dark:text-brand-300"
                        : isDone
                          ? "text-brand-700 dark:text-brand-400"
                          : "text-muted-foreground group-hover:text-foreground",
                    ].join(" ")}
                  >
                    {step.name}
                  </span>

                  <span
                    className={[
                      "tabular-nums text-[10px] transition-colors duration-200",
                      isActive || isDone
                        ? "text-brand-600/70 dark:text-brand-400/70"
                        : "text-muted-foreground/50",
                    ].join(" ")}
                  >
                    {step.fields_count}f · {step.required_count}r
                  </span>
                </div>
              </button>

              {index < steps.length - 1 ? (
                <div
                  aria-hidden
                  className="relative mt-[21px] h-[2px] flex-1 overflow-hidden rounded-full bg-border/50"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-brand-900 transition-[width] duration-500 ease-in-out dark:bg-brand-300"
                    style={{ width: lineFilled ? "100%" : "0%" }}
                  />
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function StepNavigatorSkeleton() {
  return (
    <div className="flex items-start gap-0">
      {Array.from({ length: 4 }).map((_, index) => (
        <Fragment key={index}>
          <div className="flex w-[90px] shrink-0 flex-col items-center gap-2">
            <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-14 animate-pulse rounded-full bg-muted" />
            <div className="h-2 w-10 animate-pulse rounded-full bg-muted/60" />
          </div>

          {index < 3 ? (
            <div className="mt-[21px] h-[2px] flex-1 animate-pulse rounded-full bg-muted" />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

export default function OnboardPage() {
  const {
    mode,
    setMode,

    meta,
    visibleSteps,
    currentStep,
    currentFields,
    totalFields,
    requiredCount,

    employeeUuid,
    isEditMode,

    safeStepIndex,
    setCurrentStepIndex,

    values,
    setFieldValue,

    fieldErrors,

    lazyLoading,
    getFieldOptions,
    isLazyFieldDisabled,

    loading,
    stepSubmitting,
    publishing,

    previewMode,
    setPreviewMode,

    error,
    successMessage,

    progress,

    goNext,
    goToStep,
    submitFinalStep,
    publishEmployee,
  } = useOnboardingForm();

  const companyId = useAppSelector(state => state.auth.company?.id);
  const userId = useAppSelector(state => state.auth.user?.id);

  const readiness = useQuery({
    queryKey: ["onboarding-readiness", companyId, userId, mode],
    queryFn: ({ signal }) => onboardingService.readiness(mode, signal),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const readinessBlocked = readiness.isFetching || readiness.isError || !readiness.data?.ready || !!readiness.data?.issues.length;
  const readinessHasIssues = !!readiness.data && (!readiness.data.ready || readiness.data.issues.length > 0);
  const [dismissedReadiness, setDismissedReadiness] = useState("");
  const readinessKey = `${companyId}:${userId}:${mode}:${readiness.dataUpdatedAt}:${readiness.errorUpdatedAt}`;
  const readinessModalOpen = (readinessHasIssues || readiness.isError) && dismissedReadiness !== readinessKey;

  const [openPreviewStepIds, setOpenPreviewStepIds] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    if (previewMode) {
      setOpenPreviewStepIds(new Set(visibleSteps.map((step) => step.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode]);

  function togglePreviewStep(stepId: number) {
    setOpenPreviewStepIds((previous) => {
      const next = new Set(previous);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  function renderField(field: ApiField) {
    const fieldKey = onboardingHelpers.getFieldKey(field);
    const value = values[fieldKey];
    const errorMessage = fieldErrors[fieldKey];

    const rawOptions = getFieldOptions(field);
    const lazyDisabled = isLazyFieldDisabled(field);
    const selectLoading = Boolean(lazyLoading[fieldKey]);

    const searchSelectOptions =
      rawOptions
        ?.filter(Boolean)
        .map((option, index) => {
          const optionValue =
            option.value !== null &&
            option.value !== undefined &&
            String(option.value).trim() !== ""
              ? String(option.value)
              : `__empty_${fieldKey}_${index}`;

          const optionLabel =
            option.label !== null &&
            option.label !== undefined &&
            String(option.label).trim() !== ""
              ? String(option.label)
              : optionValue;

          return {
            value: optionValue,
            label: optionLabel,
          };
        }) || [];

    return (
      <>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{field.label}</span>

          {field.is_required ? (
            <span className="font-medium text-red-500">*</span>
          ) : null}

          {field.is_login_email ? (
            <Badge
              variant="outline"
              className="rounded-md border-brand-200 bg-brand-50 px-1.5 py-0 text-[10px] text-brand-800"
            >
              LOGIN EMAIL
            </Badge>
          ) : null}

          <FieldInfoTooltip field={field} />
        </div>

        {field.type === "textarea" ? (
          <Textarea
            placeholder={field.placeholder || ""}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setFieldValue(fieldKey, event.target.value)}
            className={
              errorMessage
                ? "min-h-[92px] border-red-400 bg-background"
                : "min-h-[92px] bg-background"
            }
          />
        ) : field.type === "select" ? (
          <SearchSelect
            options={searchSelectOptions}
            value={typeof value === "string" ? value : ""}
            onChange={(selectedValue) => setFieldValue(fieldKey, selectedValue)}
            placeholder={
              lazyDisabled
                ? "Select parent first"
                : field.placeholder || "Select..."
            }
            searchPlaceholder={`Search ${field.label}...`}
            emptyText={
              lazyDisabled
                ? "Please select parent field first."
                : "No option found."
            }
            groupLabel={field.label}
            allowAll={false}
            widthClass="w-full"
            disabled={lazyDisabled}
            isLoading={selectLoading}
            className={
              errorMessage
                ? "h-10 w-full border-red-400 bg-background"
                : "h-10 w-full bg-background"
            }
          />
        ) : field.type === "multiselect" || field.type === "multi_select" ? (
          <SearchSelect
            multiple
            options={searchSelectOptions}
            value={Array.isArray(value) ? value : []}
            onChange={(selectedValues) =>
              setFieldValue(fieldKey, selectedValues)
            }
            placeholder={
              lazyDisabled
                ? "Select parent first"
                : field.placeholder || "Select..."
            }
            searchPlaceholder={`Search ${field.label}...`}
            emptyText={
              lazyDisabled
                ? "Please select parent field first."
                : "No option found."
            }
            groupLabel={field.label}
            allowAll={false}
            widthClass="w-full"
            disabled={lazyDisabled}
            isLoading={selectLoading}
            className={
              errorMessage
                ? "h-10 w-full border-red-400 bg-background"
                : "h-10 w-full bg-background"
            }
          />
        ) : field.type === "radio" ? (
          <div className="grid gap-2 rounded-xl p-1 md:grid-cols-3">
            {field.options?.map((option, index) => (
              <label
                key={`${fieldKey}-${option.value}-${index}`}
                className={
                  errorMessage
                    ? "flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-2 py-1.5 text-sm hover:bg-muted"
                    : "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                }
              >
                <input
                  type="radio"
                  name={fieldKey}
                  value={String(option.value)}
                  checked={value === String(option.value)}
                  onChange={(event) =>
                    setFieldValue(fieldKey, event.target.value)
                  }
                  className="h-4 w-4 accent-[var(--brand-800)]"
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : field.type === "checkbox" ? (
          <label
            className={
              errorMessage
                ? "flex items-center gap-3 rounded-xl border border-red-400 bg-background px-3 py-2 text-sm text-foreground"
                : "flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            }
          >
            <input
              type="checkbox"
              checked={value === "1"}
              onChange={(event) =>
                setFieldValue(fieldKey, event.target.checked ? "1" : "")
              }
              className="h-4 w-4 accent-[var(--brand-800)]"
            />

            <span>{field.placeholder || field.label}</span>
          </label>
        ) : field.type === "file" || field.type === "upload" ? (
          <FileUploadField
            field={field}
            fieldKey={fieldKey}
            value={value}
            errorMessage={errorMessage}
            setFieldValue={setFieldValue}
          />
        ) : (
          <Input
            type={getInputType(field.type)}
            placeholder={field.placeholder || ""}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setFieldValue(fieldKey, event.target.value)}
            className={
              errorMessage ? "border-red-400 bg-background" : "bg-background"
            }
          />
        )}

        {errorMessage ? (
          <p className="mt-1 text-xs font-medium text-red-500">
            {errorMessage}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Dialog open={readinessModalOpen} onOpenChange={open => { if (!open) setDismissedReadiness(readinessKey); }}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-muted/50 px-6 py-4">
            <DialogTitle>Onboarding setup required</DialogTitle>
            <DialogDescription>Resolve these configuration issues before continuing in {mode} mode.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto p-6">
            {readiness.isError ? <p role="alert" className="text-sm text-red-600">{parseApiError(readiness.error).message}</p> : readiness.data?.issues.length ? readiness.data.issues.map((issue, index) => (
              <div key={`${issue.field_key}-${index}`} className="rounded-lg border border-border p-4">
                <p className="text-sm font-semibold text-foreground">{issue.field_label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{[issue.step, issue.module].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{issue.message}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Onboarding configuration is incomplete.</p>}
            {!!readiness.data?.required_fields?.length && <details className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground">Required fields ({readiness.data.required_fields.length})</summary>
              <p className="mt-2 text-xs text-muted-foreground">These are the required fields returned by the API. Configuration issues that block progress are listed above.</p>
              <ul className="mt-3 divide-y divide-border">
                {readiness.data.required_fields.map(field => <li key={field.field_key} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                  <div><p className="font-medium text-foreground">{field.field_label}</p><p className="mt-1 text-xs text-muted-foreground">{field.module}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {field.required_in_detail !== undefined && <Badge variant="outline">{field.required_in_detail ? "Required in detailed" : "Optional in detailed"}</Badge>}
                    {field.show_in_detail !== undefined && <Badge variant="outline">{field.show_in_detail ? "Visible in detailed" : "Hidden in detailed"}</Badge>}
                  </div>
                </li>)}
              </ul>
            </details>}
          </div>
          <DialogFooter className="border-t bg-muted/50 px-6 py-4">
            <Button variant="outline" onClick={() => setDismissedReadiness(readinessKey)}>Close</Button>
            <Button disabled={readiness.isFetching} onClick={() => void readiness.refetch()}>
              {readiness.isFetching ? "Checking…" : "Check again"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {readinessBlocked && <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
        <span>{readiness.isFetching ? "Checking onboarding readiness…" : "Complete the onboarding setup before continuing."}</span>
        {(readinessHasIssues || readiness.isError) && <Button size="sm" variant="outline" onClick={() => setDismissedReadiness("")}>View issues</Button>}
      </div>}

      <div className="border-b bg-brand-900 px-5 py-4 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold">OnboardX Enrollment</h1>
            <p className="text-xs text-brand-900/70">
              {isEditMode
                ? "Edit employee onboarding details"
                : "Create new employee onboarding"}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {employeeUuid ? (
              <Badge className="rounded-full bg-white/10 text-white">
                UUID: {employeeUuid}
              </Badge>
            ) : null}

            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as "quick" | "detailed")}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-2 md:w-[260px]">
                <TabsTrigger value="quick">⚡ Quick Form</TabsTrigger>
                <TabsTrigger value="detailed">⊞ Detailed Form</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Employee Enrollment
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {meta?.total_steps ?? visibleSteps.length} steps •{" "}
                {meta?.total_fields ?? totalFields.length} fields •{" "}
                {meta?.total_required ?? requiredCount} required
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={
                  mode === "quick"
                    ? "rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-yellow-900"
                    : "rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-sky-900"
                }
              >
                {mode === "quick" ? "Quick" : "Detailed"}
              </Badge>

              <Badge
                className={
                  isEditMode
                    ? "rounded-full border border-purple-300 bg-purple-100 px-3 py-1 text-purple-900"
                    : "rounded-full border border-green-300 bg-green-100 px-3 py-1 text-green-900"
                }
              >
                {isEditMode ? "Edit Mode" : "Create Mode"}
              </Badge>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="px-5">
             

              {loading ? (
                <StepNavigatorSkeleton />
              ) : (
                <StepNavigator
                  steps={visibleSteps}
                  activeIndex={safeStepIndex}
                  disabled={stepSubmitting || publishing || previewMode}
                  onStepClick={index => { if (!readinessBlocked || index <= safeStepIndex) goToStep(index); }}
                />
              )}
            </CardContent>
          </Card>

          {previewMode ? (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm">
              <div className="relative overflow-hidden border-b border-border/60 bg-brand-950 px-6 py-7 text-white md:px-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Final Review
                    </span>

                    <h2 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
                      Ready to publish this record
                    </h2>

                    <p className="mt-1 max-w-md text-sm leading-relaxed text-brand-900/70">
                      Every step below is condensed for a final check.
                      Anything missing or mistyped will show clearly.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-brand-900/50">
                      Completion
                    </span>
                    <span className="text-3xl font-semibold leading-none tabular-nums">
                      {visibleSteps.length}
                      <span className="text-base font-normal text-brand-900/50">
                        {" "}
                        / {visibleSteps.length} steps
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5 md:px-7">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openPreviewStepIds.size} of {visibleSteps.length} sections
                  expanded
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setOpenPreviewStepIds((previous) =>
                      previous.size === visibleSteps.length
                        ? new Set()
                        : new Set(visibleSteps.map((step) => step.id)),
                    )
                  }
                  className="text-[11px] font-semibold text-brand-800 underline-offset-2 hover:underline dark:text-brand-300"
                >
                  {openPreviewStepIds.size === visibleSteps.length
                    ? "Collapse all"
                    : "Expand all"}
                </button>
              </div>

              <div className="space-y-0 p-4 md:p-7">
                {visibleSteps.map((step, stepIndex) => (
                  <PreviewStepAccordion
                    key={step.id}
                    step={step}
                    stepIndex={stepIndex}
                    isLastStep={stepIndex === visibleSteps.length - 1}
                    isOpen={openPreviewStepIds.has(step.id)}
                    onToggle={() => togglePreviewStep(step.id)}
                    values={values}
                    getFieldOptions={getFieldOptions}
                  />
                ))}
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur md:px-7">
                <Button
                  type="button"
                  variant="outline"
                  disabled={publishing}
                  onClick={() => setPreviewMode(false)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to edit
                </Button>

                <Button
                  type="button"
                  disabled={readinessBlocked || publishing}
                  onClick={() => { if (!readinessBlocked) void publishEmployee(); }}
                  className="gap-2 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Publish employee
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {!loading && currentStep && !previewMode ? (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="bg-muted/50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-900">
                      {(() => {
                        const Icon = getStepIcon(currentStep.icon);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>

                    <div>
                      <CardTitle className="text-base">
                        {currentStep.name}
                      </CardTitle>

                      <CardDescription>
                        {safeStepIndex === 0 && !employeeUuid
                          ? "Step 1 will create the employee draft."
                          : "This step will update the existing employee draft."}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {currentStep.fields_count} fields
                    </Badge>

                    <Badge
                      variant="outline"
                      className="border-red-200 bg-red-50 text-red-700"
                    >
                      {currentStep.required_count} req
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-5">
                {currentFields.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    {currentFields.map((field) => (
                      <div
                        key={field.id}
                        className={getColumnClass(field.column_span)}
                      >
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No fields configured in this step.
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      You can continue to the next step.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {!previewMode ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={safeStepIndex === 0 || loading || stepSubmitting}
                onClick={() =>
                  setCurrentStepIndex(Math.max(0, safeStepIndex - 1))
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="flex flex-1 justify-center gap-1.5">
                {visibleSteps.map((step, index) => (
                  <div
                    key={`${step.id}-${index}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === safeStepIndex
                        ? "w-6 bg-brand-800 dark:bg-brand-300"
                        : index < safeStepIndex
                          ? "w-2 bg-brand-500/50"
                          : "w-2 bg-border"
                    }`}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={stepSubmitting}
                className="text-muted-foreground"
                onClick={() => console.log("draft values:", values)}
              >
                <Save className="h-4 w-4" />
              </Button>

              {safeStepIndex === visibleSteps.length - 1 ? (
                <Button
                  type="button"
                  disabled={readinessBlocked || loading || stepSubmitting}
                  onClick={() => { if (!readinessBlocked) void submitFinalStep(); }}
                  className="bg-green-700 text-white hover:bg-green-800"
                >
                  {stepSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Preview"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={readinessBlocked || loading || stepSubmitting || !visibleSteps.length}
                  onClick={() => { if (!readinessBlocked) void goNext(); }}
                >
                  {stepSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}