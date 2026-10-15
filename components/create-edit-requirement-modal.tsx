"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2, Save } from "lucide-react";

import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import {
  useCreateComplianceRequirement,
  useUpdateComplianceRequirement,
} from "@/hooks/use-compliance-requirements";
import type {
  ComplianceFrequency,
  ComplianceRequirement,
} from "@/services/compliance-requirements.service";

import SearchableSelect, {
  type Option,
} from "@/components/ui/searchable-select";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constants ─────────────────────────────────────────────────────────────────

const FREQUENCIES: { value: ComplianceFrequency; label: string }[] = [
  { value: "annual", label: "Annual" },
  { value: "half_yearly", label: "Half-Yearly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "ad_hoc", label: "Ad-hoc" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrapList<T>(raw: unknown): T[] {
  if (!raw) return [];
  let candidate: unknown = raw;
  if (
    candidate &&
    typeof candidate === "object" &&
    "data" in (candidate as Record<string, unknown>)
  ) {
    candidate = (candidate as Record<string, unknown>).data;
  }
  if (
    candidate &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    "data" in (candidate as Record<string, unknown>)
  ) {
    candidate = (candidate as Record<string, unknown>).data;
  }
  return Array.isArray(candidate) ? (candidate as T[]) : [];
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  document_type_id: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  is_mandatory: z.boolean(),
  reminder_days_before: z
    .number({ error: "Enter a number" })
    .int()
    .min(0, "Cannot be negative")
    .max(365, "Max 365 days"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  requirement: ComplianceRequirement | null; // null → create
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateEditRequirementModal({
  requirement,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const isEdit = Boolean(requirement);

  const { data: typesRaw, isLoading: loadingTypes } = useDocumentTypes({
    per_page: 100,
  });

  const typeOptions: Option[] = useMemo(
    () =>
      unwrapList<Record<string, unknown>>(typesRaw)
        .map((t) => ({
          value: String(t.id),
          label: String(t.name ?? "Untitled"),
        }))
        .filter((o) => o.value !== "undefined"),
    [typesRaw],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      document_type_id: "",
      frequency: "annual",
      is_mandatory: true,
      reminder_days_before: 30,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (requirement) {
      form.reset({
        title: requirement.title,
        description: requirement.description ?? "",
        document_type_id: requirement.document_type_id
          ? String(requirement.document_type_id)
          : "",
        frequency: requirement.frequency,
        is_mandatory: requirement.is_mandatory,
        reminder_days_before: requirement.reminder_days_before,
        is_active: requirement.is_active,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        document_type_id: "",
        frequency: "annual",
        is_mandatory: true,
        reminder_days_before: 30,
        is_active: true,
      });
    }
  }, [open, requirement, form]);

  const createMutation = useCreateComplianceRequirement();
  const updateMutation = useUpdateComplianceRequirement(
    requirement?.uuid ?? "",
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      document_type_id: values.document_type_id
        ? Number(values.document_type_id)
        : null,
      frequency: values.frequency as ComplianceFrequency,
      is_mandatory: values.is_mandatory,
      reminder_days_before: Number(values.reminder_days_before),
      is_active: values.is_active,
    };

    if (isEdit && requirement) {
      await updateMutation.mutateAsync(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    } else {
      await createMutation.mutateAsync(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Compliance Requirement" : "New Compliance Requirement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details below."
              : "Define a compliance rule that applies to employees."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Annual CNIC Expiry Check"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Explain what this requirement means…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="document_type_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Document type</FormLabel>
                    <SearchableSelect
                      options={typeOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select type…"
                      searchPlaceholder="Search types…"
                      groupLabel="Document types"
                      emptyText="No types available"
                      icon={FileText}
                      allowAll={false}
                      isLoading={loadingTypes}
                      widthClass="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_days_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remind before (days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      How many days before expiry to send reminders.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="is_mandatory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mandatory</FormLabel>
                    <Select
                      value={field.value ? "yes" : "no"}
                      onValueChange={(v) => field.onChange(v === "yes")}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="yes">Yes — required</SelectItem>
                        <SelectItem value="no">No — optional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value ? "active" : "inactive"}
                      onValueChange={(v) => field.onChange(v === "active")}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Save changes" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}