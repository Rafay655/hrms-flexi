"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  Building2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import {
  type ComplianceTag,
  type Field,
  type Step,
} from "@/lib/onboarding-schema";

const COMPANY_NAMES: Record<string, string> = {
  "bata-pk": "Bata Pakistan Ltd",
  "bata-retail": "Bata Retail Ltd",
  "bata-services": "Bata Services Pvt Ltd",
};

/* ──────────────────────────────────────────────────────────── */
/*  Compliance tag styling (mirrors components/onboard-page.tsx)*/
/* ──────────────────────────────────────────────────────────── */
function getTagStyles(tag: ComplianceTag) {
  switch (tag) {
    case "nadra":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "eobi":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "fbr":
      return "bg-green-100 text-green-800 border-green-300";
    case "safety":
      return "bg-red-100 text-red-800 border-red-300";
    case "ss":
      return "bg-sky-100 text-sky-800 border-sky-300";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/* ──────────────────────────────────────────────────────────── */
/*  Dynamic field renderer — reads field.type from schema       */
/* ──────────────────────────────────────────────────────────── */
type FormValues = Record<string, string | boolean>;

function renderField(
  field: Field,
  values: FormValues,
  setValue: (key: string, value: string | boolean) => void,
  error?: string
) {
  const raw = values[field.key];

  if (field.type === "checkbox") {
    return (
      <label
        key={field.id}
        className={`flex items-center gap-3 py-2 text-sm text-foreground ${
          field.span === 2 ? "md:col-span-2" : field.span === 3 ? "md:col-span-3" : ""
        }`}
      >
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-800"
          checked={Boolean(raw)}
          onChange={(e) => setValue(field.key, e.target.checked)}
        />
        <span>{field.label}</span>
        {field.req && <span className="text-red-500">*</span>}
      </label>
    );
  }

  return (
    <div
      key={field.id}
      className={
        field.span === 2
          ? "md:col-span-2"
          : field.span === 3
          ? "md:col-span-3"
          : ""
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">
          {field.label}
          {field.req && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {field.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`rounded-md px-1.5 py-0 text-[10px] ${getTagStyles(tag)}`}
          >
            {tag.toUpperCase()}
          </Badge>
        ))}
      </div>

      {field.type === "textarea" ? (
        <Textarea
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.ph || ""}
          className="min-h-[92px] bg-background"
        />
      ) : field.type === "select" ? (
        <Select
          value={typeof raw === "string" ? raw : ""}
          onValueChange={(v) => setValue(field.key, v)}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder={field.ph || "Select..."} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {(field.opts ?? "")
              .split(",")
              .map((opt) => opt.trim())
              .filter(Boolean)
              .map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ) : field.type === "upload" ? (
        <div className="flex min-h-[86px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center transition hover:border-brand-800 hover:bg-brand-100/30">
          <p className="text-sm font-medium text-brand-900">Click to upload</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, PDF</p>
        </div>
      ) : (
        <Input
          type={field.type}
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.ph || ""}
          disabled={field.disabled}
          className="bg-background"
        />
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Page                                                        */
/* ──────────────────────────────────────────────────────────── */
export default function NewEmployeePage() {
  const router = useRouter();
  const schema = useAppSelector((state) => state.onboarding.schema);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading a company's form configuration
  useEffect(() => {
    if (!selectedCompany) return;
    setLoadingConfig(true);
    const t = setTimeout(() => setLoadingConfig(false), 600);
    return () => clearTimeout(t);
  }, [selectedCompany]);

  const visibleSteps = useMemo(
    () => schema.filter((step) => step.fields.some((f) => f.d)),
    [schema]
  );
  const totalSteps = visibleSteps.length;
  const safeStep = Math.min(stepIndex, Math.max(totalSteps - 1, 0));
  const currentStep: Step | undefined = visibleSteps[safeStep];
  const currentFields = currentStep
    ? currentStep.fields.filter((f) => f.d)
    : [];

  const totalFields = visibleSteps.flatMap((s) => s.fields.filter((f) => f.d));
  const requiredCount = totalFields.filter((f) => f.req).length;
  const progress = totalSteps ? Math.round(((safeStep + 1) / totalSteps) * 100) : 0;

  const setValue = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    if (!currentStep) return true;
    const stepErrors: Record<string, string> = {};
    currentStep.fields
      .filter((f) => f.d && f.req && f.type !== "checkbox")
      .forEach((f) => {
        const v = values[f.key];
        if (!v || (typeof v === "string" && v.trim() === "")) {
          stepErrors[f.key] = `${f.label} is required`;
        }
      });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentStep()) {
      toast.error("Please complete the required fields");
      return;
    }
    if (safeStep < totalSteps - 1) {
      setStepIndex(safeStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (safeStep > 0) {
      setStepIndex(safeStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error("Please complete the required fields");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      toast.success("Employee onboarded successfully");
      router.push("/people-hub/employees");
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Onboard New Employee
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schema-driven onboarding form · {totalSteps} steps ·{" "}
            {totalFields.length} fields · {requiredCount} required
          </p>
        </div>
        {safeStep > 0 && (
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-brand-800 hover:bg-brand-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Company selector card */}
      <Card className="mb-6 border-brand-300/30 bg-brand-100/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-900">
                Which company is this employee joining?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The onboarding form will load based on that company's
                configuration
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="bata-pk">Bata Pakistan Ltd</SelectItem>
                  <SelectItem value="bata-retail">Bata Retail Ltd</SelectItem>
                  <SelectItem value="bata-services">
                    Bata Services Pvt Ltd
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedCompany && (
                <p className="text-[10px] text-muted-foreground">
                  34 fields configured · Last updated March 2025
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedCompany && (
        <Card className="border-brand-300/40">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Building2 className="h-10 w-10 text-brand-400" />
            <p className="text-sm font-semibold text-brand-800">
              Select a company above to load their onboarding form
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Each company has its own configuration defined in Flexi HQ →
              Form Builder. The wizard will adapt automatically once you pick
              one.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedCompany && loadingConfig && (
        <Card className="border-brand-300/40">
          <CardContent className="space-y-3 p-5">
            <div className="h-5 w-2/3 rounded bg-brand-100 animate-pulse" />
            <div className="h-2 w-full rounded bg-brand-100 animate-pulse" />
            <div className="grid grid-cols-3 gap-2 pt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-brand-100 animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCompany && !loadingConfig && (
        <>
      {/* Progress card with step pills */}
      <Card className="border-brand-300/40 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {totalSteps ? safeStep + 1 : 0} of {totalSteps}
            </span>
            <span className="font-semibold text-brand-900">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-800 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {visibleSteps.map((step, idx) => {
                const isActive = idx === safeStep;
                const isDone = idx < safeStep;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => setStepIndex(idx)}
                      className={`flex min-w-[170px] items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "border-brand-800 bg-brand-800 text-white"
                          : isDone
                          ? "border-brand-300 bg-brand-100 text-brand-900"
                          : "border-border bg-background text-foreground hover:bg-brand-100/50"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          isActive
                            ? "border-white/20 bg-white/10 text-white"
                            : isDone
                            ? "border-brand-400 bg-white text-brand-800"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {step.title}
                        </div>
                        <div
                          className={`mt-0.5 text-xs ${
                            isActive
                              ? "text-white/70"
                              : isDone
                              ? "text-brand-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.icon} Step {idx + 1}
                        </div>
                      </div>
                    </button>
                    {idx !== visibleSteps.length - 1 && (
                      <div className="mx-1 h-px w-8 bg-border" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current step body */}
      {currentStep ? (
        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader className="bg-brand-100/30 border-b border-brand-300/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-lg text-white">
                  {currentStep.icon}
                </div>
                <div>
                  <CardTitle className="text-base text-brand-900">
                    {currentStep.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentStep.desc}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-brand-300">
                  {currentFields.filter((f) => f.type !== "checkbox").length} fields
                </Badge>
                <Badge
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700"
                >
                  {
                    currentFields.filter(
                      (f) => f.req && f.type !== "checkbox"
                    ).length
                  }{" "}
                  req
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {currentFields.map((f) =>
                renderField(f, values, setValue, errors[f.key])
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-brand-300/40">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Building2 className="h-8 w-8 text-brand-400" />
            <p className="text-sm text-brand-800">
              No onboarding schema configured.
            </p>
            <p className="text-xs text-muted-foreground">
              Configure the form in Flexi HQ → Form Builder first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Nav / submit */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={safeStep === 0 || isSubmitting}
          className="border-gray-200 text-brand-800 hover:bg-brand-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex flex-1 justify-center gap-1.5">
          {visibleSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all ${
                idx === safeStep
                  ? "w-6 bg-brand-800"
                  : idx < safeStep
                  ? "w-2 bg-brand-500"
                  : "w-2 bg-brand-100"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          title="Save draft"
        >
          <Save className="h-4 w-4" />
        </Button>

        {safeStep === totalSteps - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || totalSteps === 0}
            className="bg-brand-800 text-white hover:bg-brand-900 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={totalSteps === 0}
            className="bg-brand-800 text-white hover:bg-brand-900"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
        </>
      )}
    </div>
  );
}
