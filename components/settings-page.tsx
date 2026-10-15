"use client";

import { showApiError } from "@/lib/error-toast";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  useAddStep,
  useDeleteStepMutation,
  useOnboardDataSources,
  useOnboardSettings,
  useReorderSteps,
  useSaveOnboardField,
  useUpdateStepMutation,
  useValidationRules,
  useDeleteOnboardField,
  useUpdateOnboardField,
  useReorderOnboardFields,
} from "@/hooks/useOnboardSettings";

import SearchSelect from "@/components/ui/searchable-select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import type {
  DataSourceItem,
  FieldTag,
  FieldType,
  FieldValidationRule,
  OnboardSettingField,
  OnboardSettingStep,
  SaveOnboardFieldPayload,
  SourceType,
  ValidationRuleCatalogItem,
} from "@/types/onboard-settings";

import {
  FIELD_TAGS,
  FIELD_TYPES,
  SOURCE_TYPES,
} from "@/types/onboard-settings";

type EditableField = OnboardSettingField & {
  client_id: string;
  is_new?: boolean;
};

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-[310px] space-y-3 border-r bg-white p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-36" />

        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-6 w-36" />

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
        checked
          ? "border-brand-800 bg-brand-50 text-brand-900"
          : "border-gray-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      <span className="mr-2 text-xs font-semibold">{label}</span>

      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
      />
    </button>
  );
}

function getTagStyles(tag: string) {
  switch (tag) {
    case "nadra":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "eobi":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "fbr":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "safety":
      return "border-red-200 bg-red-50 text-red-700";
    case "ss":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-gray-200 bg-slate-50 text-slate-600";
  }
}

function getFieldIcon() {
  return <Zap className="h-4 w-4 text-brand-800" />;
}

function needsOptions(type: FieldType) {
  return ["select", "multiselect", "radio"].includes(type);
}

function mapBackendFieldToEditable(field: OnboardSettingField): EditableField {
  return {
    ...field,
    client_id: String(field.id),
    label: field.label ?? "",
    placeholder: field.placeholder ?? "",
    source_type: field.source_type ?? "static",
    source_table: field.source_table ?? null,
    source_label_col: field.source_label_col ?? null,
    source_value_col: field.source_value_col ?? null,
    source_filter_col: field.source_filter_col ?? null,
    options: field.options ?? [],
    validation_rules: field.validation_rules ?? [],
    tags: field.tags ?? [],
    column_span: field.column_span ?? 1,
    show_in_quick: Boolean(field.show_in_quick),
    show_in_detail: Boolean(field.show_in_detail),
    required_in_quick: Boolean(field.required_in_quick),
    required_in_detail: Boolean(field.required_in_detail),
    is_login_email: Boolean(field.is_login_email),
  };
}

function makeNewField(stepId: number): EditableField {
  const tempId = `new-${Date.now()}`;

  return {
    id: 0,
    client_id: tempId,
    is_new: true,
    step_id: stepId,
    label: "New Field",
    system_key: undefined,
    type: "text",
    column_span: 1,
    column_span_label: "Normal",
    placeholder: "",
    source_type: "static",
    source_table: null,
    source_label_col: null,
    source_value_col: null,
    source_filter_col: null,
    options: [],
    show_in_quick: true,
    show_in_detail: true,
    required_in_quick: false,
    required_in_detail: false,
    validation_rules: [],
    tags: [],
    is_login_email: false,
  };
}

function normalizeSourceOption(source: DataSourceItem) {
  const value =
    source.value ??
    source.table ??
    source.key ??
    source.name ??
    source.label ??
    "";

  const label =
    source.label ?? source.name ?? source.table ?? source.key ?? value;

  return {
    label,
    value,
    description: source.category ? `Category: ${source.category}` : null,
  };
}

function normalizeParamValue(value: string, paramType?: string | null) {
  if (paramType === "integer") return value === "" ? "" : Number(value);
  return value;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();

  const companyUuid = searchParams.get("company_uuid") ?? undefined;
  const formBuilderId = searchParams.get("form_builder_id") ?? undefined;

  const {
    data: settingsData,
    isPending,
    isError,
  } = useOnboardSettings(companyUuid, formBuilderId);

  const { data: dataSources = [], isLoading: isDataSourcesLoading } =
    useOnboardDataSources("company");

  const { data: validationRules = [], isLoading: isValidationRulesLoading } =
    useValidationRules();

  const steps: OnboardSettingStep[] = settingsData?.data ?? [];

  const addStepMut = useAddStep(companyUuid, formBuilderId);
  const updateStepMut = useUpdateStepMutation(companyUuid, formBuilderId);
  const deleteStepMut = useDeleteStepMutation(companyUuid, formBuilderId);
  const reorderMut = useReorderSteps(companyUuid, formBuilderId);

  const saveFieldMut = useSaveOnboardField(companyUuid, formBuilderId);
  const updateFieldMut = useUpdateOnboardField(companyUuid, formBuilderId);
  const deleteFieldMut = useDeleteOnboardField(companyUuid, formBuilderId);
  const reorderFieldsMut = useReorderOnboardFields(companyUuid, formBuilderId);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [editName, setEditName] = useState("");

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepName, setNewStepName] = useState("");

  const [deleteStepId, setDeleteStepId] = useState<number | null>(null);

  const [fields, setFields] = useState<EditableField[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const activeStep = steps[activeStepIndex];

  const selectedField = useMemo(() => {
    return fields.find((field) => field.client_id === selectedClientId) ?? null;
  }, [fields, selectedClientId]);

  const sourceOptions = useMemo(() => {
    return dataSources
      .map(normalizeSourceOption)
      .filter((item) => Boolean(item.value));
  }, [dataSources]);

  const validationRuleOptions = useMemo(() => {
    return validationRules.map((rule: ValidationRuleCatalogItem) => ({
      label: rule.label,
      value: rule.key,
      description: rule.description ?? "",
    }));
  }, [validationRules]);

  useEffect(() => {
    if (steps[activeStepIndex]) {
      setEditName(steps[activeStepIndex].name);
    }
  }, [activeStepIndex, steps]);

  useEffect(() => {
    if (activeStepIndex >= steps.length) {
      setActiveStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, activeStepIndex]);

  useEffect(() => {
    const nextFields = (activeStep?.fields ?? []).map(
      mapBackendFieldToEditable,
    );

    setFields(nextFields);
    setSelectedClientId(nextFields[0]?.client_id ?? null);
  }, [activeStep?.id, activeStep?.fields]);

  const updateField = (clientId: string, updates: Partial<EditableField>) => {
    setFields((previous) =>
      previous.map((field) =>
        field.client_id === clientId ? { ...field, ...updates } : field,
      ),
    );
  };

  const updateFieldOption = (
    clientId: string,
    optionIndex: number,
    updates: Partial<{ label: string; value: string | number }>,
  ) => {
    setFields((previous) =>
      previous.map((field) => {
        if (field.client_id !== clientId) return field;

        return {
          ...field,
          options: field.options.map((option, index) =>
            index === optionIndex ? { ...option, ...updates } : option,
          ),
        };
      }),
    );
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }

    const currentField = fields[index];

    if (currentField.is_new || currentField.id === 0) {
      toast.error("Please save this field before reordering.");
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];

    const hasUnsavedFields = newFields.some(
      (field) => field.is_new || field.id === 0,
    );

    if (hasUnsavedFields) {
      toast.error("Please save new fields before reordering.");
      return;
    }

    if (!activeStep?.id) {
      toast.error("Step not found.");
      return;
    }

    setFields(newFields);

    reorderFieldsMut.mutate(
      {
        step_id: activeStep.id,
        ordered_ids: newFields.map((field) => field.id),
      },
      {
        onSuccess: () => {
          toast.success("Fields reordered.");
        },
        onError: (error: any) => {
          showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to reorder fields." });
        },
      },
    );
  };

  const addFieldOption = (clientId: string) => {
    setFields((previous) =>
      previous.map((field) => {
        if (field.client_id !== clientId) return field;

        return {
          ...field,
          options: [
            ...field.options,
            {
              label: "",
              value: "",
            },
          ],
        };
      }),
    );
  };

  const removeFieldOption = (clientId: string, optionIndex: number) => {
    setFields((previous) =>
      previous.map((field) => {
        if (field.client_id !== clientId) return field;

        return {
          ...field,
          options: field.options.filter((_, index) => index !== optionIndex),
        };
      }),
    );
  };

  const toggleFieldTag = (clientId: string, tag: FieldTag) => {
    const field = fields.find((item) => item.client_id === clientId);
    if (!field) return;

    const nextTags = field.tags.includes(tag)
      ? field.tags.filter((item) => item !== tag)
      : [...field.tags, tag];

    updateField(clientId, {
      tags: nextTags,
    });
  };

  const handleValidationRulesChange = (selectedKeys: string[]) => {
    if (!selectedField) return;

    const existingRules = selectedField.validation_rules ?? [];

    const nextRules: FieldValidationRule[] = selectedKeys.map((key) => {
      const existingRule = existingRules.find((rule) => rule.rule === key);

      if (existingRule) return existingRule;

      const catalogRule = validationRules.find(
        (rule: ValidationRuleCatalogItem) => rule.key === key,
      );

      return {
        rule: key,
        label: catalogRule?.label ?? key,
        description: catalogRule?.description ?? null,
        category: catalogRule?.category ?? null,
        has_param: Boolean(catalogRule?.has_param),
        param_label: catalogRule?.param_label ?? null,
        param_type: catalogRule?.param_type ?? null,
        params: catalogRule?.has_param ? { value: "" } : {},
      };
    });

    updateField(selectedField.client_id, {
      validation_rules: nextRules,
    });
  };

  const handleRuleParamChange = (
    targetRule: string,
    value: string,
    paramType?: string | null,
  ) => {
    if (!selectedField) return;

    const nextRules = selectedField.validation_rules.map((rule) => {
      if (rule.rule !== targetRule) return rule;

      return {
        ...rule,
        params: {
          value: normalizeParamValue(value, paramType),
        },
      };
    });

    updateField(selectedField.client_id, {
      validation_rules: nextRules,
    });
  };

  const removeValidationRule = (ruleKey: string) => {
    if (!selectedField) return;

    updateField(selectedField.client_id, {
      validation_rules: selectedField.validation_rules.filter(
        (rule) => rule.rule !== ruleKey,
      ),
    });
  };

  const buildPayload = (field: EditableField): SaveOnboardFieldPayload => {
    return {
      step_id: field.step_id,
      label: field.label.trim(),
      type: field.type,
      column_span: field.column_span,
      placeholder: field.placeholder?.trim() || null,

      source_type: field.source_type,
      options: field.source_type === "static" ? (field.options ?? []) : [],
      source_table: field.source_type === "dynamic" ? field.source_table : null,
      source_label_col: field.source_label_col ?? null,
      source_value_col: field.source_value_col ?? null,
      source_filter_col: field.source_filter_col ?? null,

      show_in_quick: field.show_in_quick,
      show_in_detail: field.show_in_detail,
      required_in_quick: field.required_in_quick,
      required_in_detail: field.required_in_detail,

      validation_rules: field.validation_rules.map((rule) => ({
        rule: rule.rule,
        params:
          rule.params && !Array.isArray(rule.params)
            ? {
                ...rule.params,
              }
            : {},
      })),

      tags: field.tags,
      is_login_email: field.is_login_email,
    };
  };

  const handleSaveField = () => {
    if (!selectedField) return;

    if (!selectedField.label.trim()) {
      toast.error("Field label is required.");
      return;
    }

    if (
      needsOptions(selectedField.type) &&
      selectedField.source_type === "static" &&
      selectedField.options.length === 0
    ) {
      toast.error("Static select, multiselect, and radio fields need options.");
      return;
    }

    if (
      needsOptions(selectedField.type) &&
      selectedField.source_type === "dynamic" &&
      !selectedField.source_table
    ) {
      toast.error("Please select dynamic source table.");
      return;
    }

    const invalidParamRule = selectedField.validation_rules.find((rule) => {
      if (!rule.has_param) return false;
      if (Array.isArray(rule.params)) return true;
      return rule.params?.value === "" || rule.params?.value === undefined;
    });

    if (invalidParamRule) {
      toast.error(
        `${invalidParamRule.label ?? invalidParamRule.rule} value is required.`,
      );
      return;
    }

    const payload = buildPayload(selectedField);

    if (selectedField.is_new || selectedField.id === 0) {
      saveFieldMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Field created successfully.");
        },
        onError: (error: any) => {
          showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to create field." });
        },
      });

      return;
    }

    updateFieldMut.mutate(
      {
        fieldId: selectedField.id,
        payload,
      },
      {
        onSuccess: () => {
          toast.success("Field updated successfully.");
        },
        onError: (error: any) => {
          showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to update field." });
        },
      },
    );
  };

  const handleSaveStep = () => {
    if (!activeStep) return;

    updateStepMut.mutate(
      {
        stepId: activeStep.id,
        data: {
          name: editName,
          icon: activeStep.icon,
        },
      },
      {
        onSuccess: () => toast.success("Step updated."),
        onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to update step." }),
      },
    );
  };

  const handleDeleteStep = () => {
    if (deleteStepId === null) return;

    deleteStepMut.mutate(deleteStepId, {
      onSuccess: () => toast.success("Step deleted."),
      onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to delete step." }),
    });

    setDeleteStepId(null);
  };

  const handleAddStep = () => {
    if (!companyUuid || !formBuilderId) {
      toast.error("Company UUID and form builder ID are required.");
      return;
    }

    addStepMut.mutate(
      {
        name: newStepName || "New Step",
        icon: "user",
      },
      {
        onSuccess: () => {
          toast.success("Step added.");
          setIsAddStepOpen(false);
          setNewStepName("");
        },
        onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to add step." }),
      },
    );
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ];

    reorderMut.mutate(
      newSteps.map((step) => step.id),
      {
        onSuccess: () => toast.success("Steps reordered."),
        onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to reorder steps." }),
      },
    );
  };

  const handleAddField = () => {
    if (!activeStep) return;

    const newField = makeNewField(activeStep.id);

    setFields((previous) => [...previous, newField]);
    setSelectedClientId(newField.client_id);
  };

  const handleRemoveField = (field: EditableField) => {
    const nextField = fields.find((item) => item.client_id !== field.client_id);

    if (field.is_new || field.id === 0) {
      setFields((previous) =>
        previous.filter((item) => item.client_id !== field.client_id),
      );

      if (selectedClientId === field.client_id) {
        setSelectedClientId(nextField?.client_id ?? null);
      }

      return;
    }

    deleteFieldMut.mutate(field.id, {
      onSuccess: () => {
        toast.success("Field deleted successfully.");

        setFields((previous) =>
          previous.filter((item) => item.client_id !== field.client_id),
        );

        if (selectedClientId === field.client_id) {
          setSelectedClientId(nextField?.client_id ?? null);
        }
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to delete field." });
      },
    });
  };

  if (isPending) return <LoadingSkeleton />;

  if (isError || !settingsData?.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-brand-800">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[85vh] max-h-[85vh] min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="grid min-h-0 flex-1 grid-cols-1 bg-slate-50 lg:grid-cols-[310px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-gray-200 bg-white">
          <div className="shrink-0 border-b p-4">
            <h3 className="text-sm font-bold">Form Steps</h3>
            <p className="text-xs text-muted-foreground">
              Select step to edit fields.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {steps.map((step, index) => (
              <div key={step.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  className={`w-full rounded-xl border p-3 pr-20 text-left transition ${
                    index === activeStepIndex
                      ? "border-brand-800 bg-brand-100"
                      : "border-gray-200 hover:border-brand-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.fields_count} fields
                      </p>
                    </div>

                    {index === activeStepIndex && (
                      <CheckCircle2 className="h-4 w-4 text-brand-800" />
                    )}
                  </div>
                </button>

                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveStep(index, "down")}
                    disabled={index === steps.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => setDeleteStepId(step.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddStepOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col">
          {activeStep ? (
            <>
              <div className="shrink-0 border-b bg-white p-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-bold uppercase">
                      Step Name
                    </Label>

                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleSaveStep}
                    disabled={updateStepMut.isPending}
                    className="mb-1"
                  >
                    {updateStepMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px]">
                <section className="min-h-0 overflow-y-auto border-r border-gray-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-brand-900">
                        Step Fields
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Click any field to open settings on the right.
                      </p>
                    </div>

                    <Badge className="rounded-full bg-brand-100 text-brand-800">
                      {fields.length} fields
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const isSelected = selectedClientId === field.client_id;

                      return (
                        <Card
                          key={field.client_id}
                          onClick={() => setSelectedClientId(field.client_id)}
                          className={`cursor-pointer rounded-xl border bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm ${
                            isSelected
                              ? "border-[#e8837a] shadow-[0_0_0_3px_rgba(232,131,122,0.12)]"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex shrink-0 items-center gap-1">
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:bg-brand-50 hover:text-brand-800"
                                  disabled={
                                    index === 0 || reorderFieldsMut.isPending
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveField(index, "up");
                                  }}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:bg-brand-50 hover:text-brand-800"
                                  disabled={
                                    index === fields.length - 1 ||
                                    reorderFieldsMut.isPending
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveField(index, "down");
                                  }}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>

                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                              {getFieldIcon()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-brand-900">
                                {field.label || "Untitled Field"}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{field.type}</span>

                                {field.source_type === "dynamic" &&
                                  field.source_table && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                      {field.source_table}
                                    </span>
                                  )}

                                {field.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className={`rounded-full px-2 py-0 text-[10px] font-bold uppercase ${getTagStyles(
                                      tag,
                                    )}`}
                                  >
                                    {tag}
                                  </Badge>
                                ))}

                                {field.validation_rules?.length > 0 && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                    {field.validation_rules.length} rules
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={
                                deleteFieldMut.isPending ||
                                reorderFieldsMut.isPending
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveField(field);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleAddField}
                      className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-sm font-semibold text-gray-400 transition hover:border-[#e8837a] hover:bg-[#fff7f6] hover:text-[#e8837a]"
                    >
                      + Add Field to this Step
                    </button>
                  </div>
                </section>

                <aside className="flex min-h-0 flex-col bg-white">
                  {selectedField ? (
                    <>
                      <div className="shrink-0 border-b border-gray-100 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-brand-900">
                              {selectedField.label || "Untitled Field"}
                            </h3>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {selectedField.type} field · {activeStep.name}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                            <FileText className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Core
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Label <span className="text-red-500">*</span>
                              </Label>

                              <Input
                                value={selectedField.label}
                                onChange={(event) =>
                                  updateField(selectedField.client_id, {
                                    label: event.target.value,
                                  })
                                }
                                placeholder="e.g. CNIC Number"
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Type <span className="text-red-500">*</span>
                              </Label>

                              <Select
                                value={selectedField.type}
                                onValueChange={(value) =>
                                  updateField(selectedField.client_id, {
                                    type: value as FieldType,
                                    options: needsOptions(value as FieldType)
                                      ? selectedField.options
                                      : [],
                                    source_type: needsOptions(
                                      value as FieldType,
                                    )
                                      ? selectedField.source_type
                                      : "static",
                                    source_table: needsOptions(
                                      value as FieldType,
                                    )
                                      ? selectedField.source_table
                                      : null,
                                    validation_rules: [],
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1 w-full">
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  {FIELD_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Display
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Placeholder
                              </Label>

                              <Input
                                value={selectedField.placeholder ?? ""}
                                onChange={(event) =>
                                  updateField(selectedField.client_id, {
                                    placeholder: event.target.value,
                                  })
                                }
                                placeholder="Enter placeholder"
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Column Width
                              </Label>

                              <div className="mt-1 grid grid-cols-5 gap-2">
                                {[
                                  { value: 1, label: "Col 1" },
                                  { value: 2, label: "Col 2" },
                                  { value: 3, label: "Col 3" },
                                  { value: 4, label: "Col 4" },
                                  { value: 5, label: "Col 5" },
                                  { value: 6, label: "Col 6" },
                                  { value: 7, label: "Col 7" },
                                  { value: 8, label: "Col 8" },
                                  { value: 9, label: "Col 9" },
                                  { value: 10, label: "Col 10" },
                                  { value: 11, label: "Col 11" },
                                  { value: 12, label: "Col 12" },
                                ].map((item) => (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                      updateField(selectedField.client_id, {
                                        column_span: item.value as
                                          | 1
                                          | 2
                                          | 3
                                          | 4
                                          | 5,
                                      })
                                    }
                                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                                      selectedField.column_span === item.value
                                        ? "border-brand-800 bg-brand-50 text-brand-900"
                                        : "border-gray-200 text-gray-500 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>

                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Form layout uses a 12-column grid. Select how
                                many columns this field should cover.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Source
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Source Type
                              </Label>

                              <Select
                                value={selectedField.source_type}
                                onValueChange={(value) =>
                                  updateField(selectedField.client_id, {
                                    source_type: value as SourceType,
                                    source_table:
                                      value === "dynamic"
                                        ? selectedField.source_table
                                        : null,
                                    options:
                                      value === "static"
                                        ? selectedField.options
                                        : [],
                                  })
                                }
                                disabled={!needsOptions(selectedField.type)}
                              >
                                <SelectTrigger className="mt-1 w-full">
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  {SOURCE_TYPES.map((sourceType) => (
                                    <SelectItem
                                      key={sourceType}
                                      value={sourceType}
                                    >
                                      {sourceType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {!needsOptions(selectedField.type) && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Source is only used for select, multiselect,
                                  and radio fields.
                                </p>
                              )}
                            </div>

                            {needsOptions(selectedField.type) &&
                              selectedField.source_type === "static" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-gray-600">
                                      Static Options
                                    </Label>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        addFieldOption(selectedField.client_id)
                                      }
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      Add
                                    </Button>
                                  </div>

                                  {selectedField.options.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-muted-foreground">
                                      No options added yet.
                                    </p>
                                  )}

                                  {selectedField.options.map(
                                    (option, index) => (
                                      <div
                                        key={index}
                                        className="grid grid-cols-[1fr_1fr_32px] gap-2"
                                      >
                                        <Input
                                          value={option.label}
                                          onChange={(event) =>
                                            updateFieldOption(
                                              selectedField.client_id,
                                              index,
                                              {
                                                label: event.target.value,
                                              },
                                            )
                                          }
                                          placeholder="Label"
                                        />

                                        <Input
                                          value={option.value}
                                          onChange={(event) =>
                                            updateFieldOption(
                                              selectedField.client_id,
                                              index,
                                              {
                                                value: event.target.value,
                                              },
                                            )
                                          }
                                          placeholder="Value"
                                        />

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 text-red-500"
                                          onClick={() =>
                                            removeFieldOption(
                                              selectedField.client_id,
                                              index,
                                            )
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                            {needsOptions(selectedField.type) &&
                              selectedField.source_type === "dynamic" && (
                                <div>
                                  <Label className="text-xs font-semibold text-gray-600">
                                    Source Table
                                  </Label>

                                  <div className="mt-1">
                                    <SearchSelect
                                      value={selectedField.source_table ?? ""}
                                      onChange={(value) =>
                                        updateField(selectedField.client_id, {
                                          source_table: String(value),
                                        })
                                      }
                                      allowAll={false}
                                      widthClass="w-full"
                                      options={sourceOptions}
                                      placeholder={
                                        isDataSourcesLoading
                                          ? "Loading sources..."
                                          : "Search and select source table"
                                      }
                                      searchPlaceholder="Search source table..."
                                      emptyText="No source table found."
                                    />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Visibility
                          </h4>

                          <div className="grid grid-cols-2 gap-2">
                            <ToggleBox
                              label="Show Quick"
                              checked={selectedField.show_in_quick}
                              onChange={(checked) =>
                                updateField(selectedField.client_id, {
                                  show_in_quick: checked,
                                })
                              }
                            />

                            <ToggleBox
                              label="Show Detail"
                              checked={selectedField.show_in_detail}
                              onChange={(checked) =>
                                updateField(selectedField.client_id, {
                                  show_in_detail: checked,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Required Per Mode
                          </h4>

                          <div className="grid grid-cols-2 gap-2">
                            <ToggleBox
                              label="Required Quick"
                              checked={selectedField.required_in_quick}
                              onChange={(checked) =>
                                updateField(selectedField.client_id, {
                                  required_in_quick: checked,
                                })
                              }
                            />

                            <ToggleBox
                              label="Required Detail"
                              checked={selectedField.required_in_detail}
                              onChange={(checked) =>
                                updateField(selectedField.client_id, {
                                  required_in_detail: checked,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Validation Rules
                            </h4>

                            {selectedField.validation_rules.length > 0 && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                {selectedField.validation_rules.length} applied
                              </span>
                            )}
                          </div>

                          <SearchSelect
                            multiple
                            allowAll={false}
                            value={selectedField.validation_rules.map(
                              (rule) => rule.rule,
                            )}
                            onChange={(value) =>
                              handleValidationRulesChange(value as string[])
                            }
                            options={validationRuleOptions}
                            placeholder={
                              isValidationRulesLoading
                                ? "Loading validation rules..."
                                : "Search and select validation rules"
                            }
                            widthClass="w-full"
                            searchPlaceholder="Search validation rule..."
                            emptyText="No validation rule found for this field type."
                          />

                          {selectedField.validation_rules.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {selectedField.validation_rules.map((rule) => {
                                const paramValue =
                                  !Array.isArray(rule.params) &&
                                  rule.params?.value !== undefined
                                    ? String(rule.params.value)
                                    : "";

                                return (
                                  <div
                                    key={rule.rule}
                                    className="rounded-lg border border-gray-200 bg-white p-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-brand-900">
                                          {rule.label ?? rule.rule}
                                        </p>

                                        {rule.description && (
                                          <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                                            {rule.description}
                                          </p>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeValidationRule(rule.rule)
                                        }
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {rule.has_param && (
                                      <div className="mt-3">
                                        <Label className="text-[11px] font-semibold text-gray-500">
                                          {rule.param_label ?? "Value"}
                                        </Label>

                                        <Input
                                          type={
                                            rule.param_type === "integer"
                                              ? "number"
                                              : "text"
                                          }
                                          value={paramValue}
                                          onChange={(event) =>
                                            handleRuleParamChange(
                                              rule.rule,
                                              event.target.value,
                                              rule.param_type,
                                            )
                                          }
                                          placeholder={
                                            rule.param_label ?? "Enter value"
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="border-b border-gray-100 px-5 py-4">
                          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Compliance
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">
                                Tags
                              </Label>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {FIELD_TAGS.map((tag) => {
                                  const isActive =
                                    selectedField.tags.includes(tag);

                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        toggleFieldTag(
                                          selectedField.client_id,
                                          tag,
                                        )
                                      }
                                      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase transition ${
                                        isActive
                                          ? getTagStyles(tag)
                                          : "border-gray-200 bg-white text-gray-400 hover:bg-slate-50"
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <ToggleBox
                              label="Use as Login Email"
                              checked={selectedField.is_login_email}
                              onChange={(checked) =>
                                updateField(selectedField.client_id, {
                                  is_login_email: checked,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3">
                        <Button
                          type="button"
                          className="h-10 w-full bg-brand-800 text-white hover:bg-brand-900"
                          onClick={handleSaveField}
                          disabled={
                            saveFieldMut.isPending || updateFieldMut.isPending
                          }
                        >
                          {saveFieldMut.isPending ||
                          updateFieldMut.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Field
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center">
                      <div>
                        <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No field selected
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Click any field from the left side to open settings.
                        </p>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No step selected.
            </div>
          )}
        </main>
      </div>

      <AlertDialog
        open={deleteStepId !== null}
        onOpenChange={() => setDeleteStepId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the step and all its fields. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteStep}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Step</DialogTitle>
            <DialogDescription>Enter a name for the step.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>

              <Input
                value={newStepName}
                onChange={(event) => setNewStepName(event.target.value)}
                placeholder="e.g. Personal Info"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleAddStep} disabled={addStepMut.isPending}>
              {addStepMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
