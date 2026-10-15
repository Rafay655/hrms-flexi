"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  AlertTriangle,
  Loader2,
  Settings2,
  ChevronUp,
  ChevronDown,
  X,
  Clock,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  useApprovalChains,
  useCreateChain,
  useUpdateChain,
  useDeleteChain,
  useRoles,
} from "@/hooks/useApprovals";

import type {
  ApprovalChain,
  ChainModuleType,
  ChainStep,
} from "@/types/approval-chain";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MODULE_TABS: { key: ChainModuleType; label: string }[] = [
  { key: "career_event", label: "Career Events" },
  { key: "exit", label: "Exits" },
  { key: "leave", label: "Leave" },
  { key: "salary", label: "Salary" },
  { key: "loan", label: "Loans" },
  { key: "ess", label: "ESS" },
  { key: "overtime", label: "Overtime" },
];

const MODULE_BADGE_CLASS: Record<ChainModuleType, string> = {
  career_event: "bg-brand-800 text-white border-transparent",
  exit: "bg-brand-700 text-white border-transparent",
  leave: "bg-emerald-600 text-white border-transparent",
  salary: "bg-amber-600 text-white border-transparent",
  loan: "bg-indigo-600 text-white border-transparent",
  ess: "bg-sky-600 text-white border-transparent",
  overtime: "bg-rose-600 text-white border-transparent",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatRoleName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getModuleLabel(key: ChainModuleType): string {
  return MODULE_TABS.find((t) => t.key === key)?.label ?? key;
}

/* -------------------------------------------------------------------------- */
/*  Zod schema                                                                 */
/* -------------------------------------------------------------------------- */

const MODULE_TYPES = [
  "career_event",
  "exit",
  "leave",
  "salary",
  "loan",
  "ess",
  "overtime",
] as const;

const stepSchema = z.object({
  role_key: z.string().min(1, "Select a role"),
  role_label: z.string().min(1, "Label is required").max(100),
  sla_hours: z.coerce
    .number()
    .min(1, "Min 1 hour")
    .max(720, "Max 720 hours")
    .nullable()
    .optional(),
  is_required: z.boolean(),
});

const chainSchema = z.object({
  name: z.string().min(1, "Chain name is required").max(150),
  module_type: z.enum(MODULE_TYPES),
  sub_type: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

type ChainFormValues = z.infer<typeof chainSchema>;

/* -------------------------------------------------------------------------- */
/*  Chain card                                                                 */
/* -------------------------------------------------------------------------- */

interface ChainCardProps {
  chain: ApprovalChain;
  isTogglingActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
}

const ChainCard: React.FC<ChainCardProps> = ({
  chain,
  isTogglingActive,
  onEdit,
  onDelete,
  onToggleActive,
}) => (
  <Card className="border border-gray-200 shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold text-brand-900 leading-tight">
              {chain.name}
            </CardTitle>
            <Badge className={MODULE_BADGE_CLASS[chain.module_type]}>
              {getModuleLabel(chain.module_type)}
            </Badge>
            {chain.sub_type && (
              <Badge className="bg-brand-100 text-brand-800 border-gray-200">
                {chain.sub_type}
              </Badge>
            )}
          </div>
          {chain.description && (
            <CardDescription className="mt-1 text-xs text-brand-600 line-clamp-2">
              {chain.description}
            </CardDescription>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-700">
              {chain.is_active ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={chain.is_active}
              disabled={isTogglingActive}
              onCheckedChange={onToggleActive}
              className="data-[state=checked]:bg-brand-800"
            />
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pb-3">
      <div className="space-y-2">
        {chain.steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-brand-50/40 px-3 py-2"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-white text-[11px] font-bold flex-shrink-0">
              {step.step_number}
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-brand-900">
                {step.role_label}
              </span>
              <span className="ml-2 text-[11px] text-brand-600">
                ({step.role_key})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-brand-600">
              {step.sla_hours && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {step.sla_hours}h
                </span>
              )}
              {step.is_required && (
                <Badge className="bg-brand-100 text-brand-800 border-gray-200 text-[10px] py-0">
                  Required
                </Badge>
              )}
            </div>
          </div>
        ))}

        {chain.steps.length === 0 && (
          <p className="text-xs text-brand-500 italic text-center py-2">
            No steps configured
          </p>
        )}
      </div>
    </CardContent>

    <Separator />

    <CardFooter className="pt-3 flex items-center justify-between">
      <p className="text-[11px] text-brand-600">
        {chain.steps.length} step{chain.steps.length !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-brand-700 hover:text-brand-900 hover:bg-brand-100 gap-1"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </CardFooter>
  </Card>
);

/* -------------------------------------------------------------------------- */
/*  Skeleton cards                                                             */
/* -------------------------------------------------------------------------- */

const ChainSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2].map((j) => (
            <Skeleton key={j} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                */
/* -------------------------------------------------------------------------- */

const EmptyState: React.FC<{ moduleLabel: string; onAdd: () => void }> = ({
  moduleLabel,
  onAdd,
}) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
      <GitBranch className="h-7 w-7 text-brand-700" />
    </div>
    <p className="font-semibold text-brand-900">
      No approval chains for {moduleLabel}
    </p>
    <p className="text-sm text-brand-600 max-w-sm">
      Click &ldquo;Add Chain&rdquo; to define who approves{" "}
      {moduleLabel.toLowerCase()} requests.
    </p>
    <Button
      size="sm"
      className="mt-2 bg-brand-800 hover:bg-brand-900 text-white gap-1"
      onClick={onAdd}
    >
      <Plus className="h-4 w-4" /> Add Chain
    </Button>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Error state                                                                */
/* -------------------------------------------------------------------------- */

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
      <AlertTriangle className="h-7 w-7 text-amber-600" />
    </div>
    <p className="font-semibold text-brand-900">Failed to load approval chains</p>
    <p className="text-sm text-brand-600 max-w-sm">{message}</p>
    <Button
      size="sm"
      variant="outline"
      className="mt-2 border-gray-200 text-brand-800 hover:bg-brand-100"
      onClick={onRetry}
    >
      Retry
    </Button>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Create / Edit Dialog                                                       */
/* -------------------------------------------------------------------------- */

interface ChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModuleType: ChainModuleType;
  editTarget: ApprovalChain | null;
}

const ChainDialog: React.FC<ChainDialogProps> = ({
  open,
  onOpenChange,
  defaultModuleType,
  editTarget,
}) => {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const createChain = useCreateChain();
  const updateChain = useUpdateChain();

  const isEditing = editTarget !== null;
  const isSaving = createChain.isPending || updateChain.isPending;

  const buildDefaultValues = useCallback((): ChainFormValues => {
    if (editTarget) {
      return {
        name: editTarget.name,
        module_type: editTarget.module_type,
        sub_type: editTarget.sub_type ?? null,
        description: editTarget.description ?? null,
        is_active: editTarget.is_active,
        steps: editTarget.steps.map((s) => ({
          role_key: s.role_key,
          role_label: s.role_label,
          sla_hours: s.sla_hours ?? null,
          is_required: s.is_required,
        })),
      };
    }
    return {
      name: "",
      module_type: defaultModuleType,
      sub_type: null,
      description: null,
      is_active: true,
      steps: [{ role_key: "", role_label: "", sla_hours: null, is_required: true }],
    };
  }, [editTarget, defaultModuleType]);

  const form = useForm<ChainFormValues>({
    resolver: zodResolver(chainSchema as any),
    defaultValues: buildDefaultValues(),
  });

  // Re-populate form when dialog opens / editTarget changes
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues());
    }
  }, [open, editTarget, buildDefaultValues, form]);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const handleRoleSelect = (fieldIndex: number, roleKey: string) => {
    form.setValue(`steps.${fieldIndex}.role_key`, roleKey);
    // Auto-fill label from role name (user can override)
    const existing = form.getValues(`steps.${fieldIndex}.role_label`);
    if (!existing) {
      form.setValue(`steps.${fieldIndex}.role_label`, formatRoleName(roleKey));
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      ...values,
      steps: values.steps.map((s) => ({
        role_key: s.role_key,
        role_label: s.role_label,
        sla_hours: s.sla_hours || null,
        is_required: s.is_required,
      })),
    };

    if (isEditing && editTarget) {
      updateChain.mutate(
        { uuid: editTarget.uuid, payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createChain.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 bg-white p-0">
        {/* Header */}
        <div className="bg-brand-900 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 opacity-80" />
              {isEditing ? "Edit Approval Chain" : "Create Approval Chain"}
            </DialogTitle>
            <DialogDescription className="text-brand-300 text-xs mt-1">
              {isEditing
                ? "Update the chain name, settings, and steps."
                : "Define who approves requests at each stage."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">
              Chain Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Standard HR Approval"
              className="border-gray-200 text-brand-900 focus:border-brand-800"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Module Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-800">
                Module Type <span className="text-red-500">*</span>
              </label>
              <Controller
                control={form.control}
                name="module_type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEditing} // module type is immutable after creation
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {MODULE_TABS.map(({ key, label }) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isEditing && (
                <p className="text-[11px] text-brand-500">Module type cannot be changed after creation.</p>
              )}
            </div>

            {/* Sub-type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-800">
                Sub-type <span className="text-brand-500 font-normal">(optional)</span>
              </label>
              <Input
                {...form.register("sub_type")}
                placeholder="e.g. Promotion"
                className="border-gray-200 text-brand-900 focus:border-brand-800"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">
              Description <span className="text-brand-500 font-normal">(optional)</span>
            </label>
            <Textarea
              {...form.register("description")}
              placeholder="Brief description of when this chain applies..."
              className="border-gray-200 text-brand-900 focus:border-brand-800 resize-none"
              rows={2}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-900">Active</p>
              <p className="text-xs text-brand-600">Inactive chains are not applied to new requests.</p>
            </div>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-brand-800"
                />
              )}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-900">Approval Steps</p>
                <p className="text-xs text-brand-600">At least one step is required.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-brand-800 text-brand-800 hover:bg-brand-100 gap-1"
                onClick={() =>
                  append({ role_key: "", role_label: "", sla_hours: null, is_required: true })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Step
              </Button>
            </div>

            {form.formState.errors.steps?.root && (
              <p className="text-xs text-red-500">{form.formState.errors.steps.root.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 bg-brand-50/30 p-4 space-y-3"
                >
                  {/* Step header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-white text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-brand-800">Step {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-brand-600 hover:text-brand-800 hover:bg-brand-100"
                        disabled={idx === 0}
                        onClick={() => move(idx, idx - 1)}
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-brand-600 hover:text-brand-800 hover:bg-brand-100"
                        disabled={idx === fields.length - 1}
                        onClick={() => move(idx, idx + 1)}
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={fields.length === 1}
                        onClick={() => remove(idx)}
                        title="Remove step"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Role selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-brand-700">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        control={form.control}
                        name={`steps.${idx}.role_key`}
                        render={({ field: f }) => (
                          <Select
                            value={f.value}
                            onValueChange={(val) => handleRoleSelect(idx, val)}
                          >
                            <SelectTrigger className="border-gray-200 text-brand-800 text-sm">
                              <SelectValue placeholder={rolesLoading ? "Loading roles…" : "Select role"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {roles.map((role) => (
                                <SelectItem key={role.name} value={role.name}>
                                  {formatRoleName(role.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.steps?.[idx]?.role_key && (
                        <p className="text-[11px] text-red-500">
                          {form.formState.errors.steps[idx]?.role_key?.message}
                        </p>
                      )}
                    </div>

                    {/* Label */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-brand-700">
                        Step Label <span className="text-red-500">*</span>
                      </label>
                      <Input
                        {...form.register(`steps.${idx}.role_label`)}
                        placeholder="e.g. HR Manager Review"
                        className="border-gray-200 text-brand-900 text-sm focus:border-brand-800"
                      />
                      {form.formState.errors.steps?.[idx]?.role_label && (
                        <p className="text-[11px] text-red-500">
                          {form.formState.errors.steps[idx]?.role_label?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* SLA hours */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-brand-700">
                        SLA (hours) <span className="text-brand-500 font-normal">optional</span>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={720}
                        {...form.register(`steps.${idx}.sla_hours`)}
                        placeholder="e.g. 24"
                        className="border-gray-200 text-brand-900 text-sm focus:border-brand-800"
                      />
                    </div>

                    {/* Is required */}
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 self-end">
                      <div>
                        <p className="text-xs font-medium text-brand-800">Required</p>
                        <p className="text-[11px] text-brand-600">Cannot be skipped</p>
                      </div>
                      <Controller
                        control={form.control}
                        name={`steps.${idx}.is_required`}
                        render={({ field: f }) => (
                          <Switch
                            checked={f.value}
                            onCheckedChange={f.onChange}
                            className="data-[state=checked]:bg-brand-800"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 text-brand-800"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand-800 hover:bg-brand-900 text-white"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…</>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Chain"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/*  Delete AlertDialog                                                         */
/* -------------------------------------------------------------------------- */

interface DeleteDialogProps {
  chain: ApprovalChain | null;
  onOpenChange: (open: boolean) => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ chain, onOpenChange }) => {
  const deleteChain = useDeleteChain();

  return (
    <AlertDialog open={!!chain} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-gray-200 bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-brand-900">
            Delete this chain?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-600">
            <strong className="text-brand-900">{chain?.name}</strong> will be permanently
            removed. Existing approvals referencing it will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-gray-200 text-brand-800"
            disabled={deleteChain.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteChain.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              if (!chain) return;
              deleteChain.mutate(chain.uuid, {
                onSuccess: () => onOpenChange(false),
              });
            }}
          >
            {deleteChain.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Deleting…</>
            ) : (
              "Delete Chain"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                             */
/* -------------------------------------------------------------------------- */

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ChainModuleType>("career_event");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApprovalChain | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApprovalChain | null>(null);
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);

  const { data: chains = [], isLoading, isError, error, refetch } = useApprovalChains();
  const updateChain = useUpdateChain();

  const tabChains = chains.filter((c) => c.module_type === activeTab);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (chain: ApprovalChain) => {
    setEditTarget(chain);
    setDialogOpen(true);
  };

  const handleToggleActive = (chain: ApprovalChain, isActive: boolean) => {
    setTogglingUuid(chain.uuid);
    updateChain.mutate(
      { uuid: chain.uuid, payload: { is_active: isActive } },
      { onSettled: () => setTogglingUuid(null) }
    );
  };

  const errorMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error instanceof Error ? error.message : "An unexpected error occurred");

  return (
    <div className="p-3 bg-white min-h-screen">
      <div className="space-y-4">
        {/* Hero / Header */}
        <Card className="bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <GitBranch className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      Approval Chain Configuration
                    </h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      PeopleHub
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    Configure multi-step approval flows per event type. Changes apply to new requests only.
                  </p>
                </div>
              </div>

              <Button
                className="gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
                onClick={handleOpenCreate}
              >
                <Plus className="h-4 w-4" /> Add Chain
              </Button>
            </div>
          </div>
        </Card>

        {/* Module type tabs */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 pb-0 pt-5 px-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as ChainModuleType)}
            >
              <TabsList className="bg-brand-100 h-auto p-1 flex flex-wrap gap-1">
                {MODULE_TABS.map(({ key, label }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
                  >
                    {label}
                    {(() => {
                      const count = chains.filter((c) => c.module_type === key).length;
                      return count > 0 ? (
                        <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                          {count}
                        </span>
                      ) : null;
                    })()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab content panels */}
              <div className="pt-5 pb-5">
                {MODULE_TABS.map(({ key, label }) => (
                  <TabsContent key={key} value={key} className="mt-0">
                    {isLoading ? (
                      <ChainSkeleton />
                    ) : isError ? (
                      <ErrorState message={errorMsg} onRetry={refetch} />
                    ) : tabChains.length === 0 ? (
                      <EmptyState
                        moduleLabel={label}
                        onAdd={handleOpenCreate}
                      />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {tabChains.map((chain) => (
                          <ChainCard
                            key={chain.uuid}
                            chain={chain}
                            isTogglingActive={togglingUuid === chain.uuid}
                            onEdit={() => handleOpenEdit(chain)}
                            onDelete={() => setDeleteTarget(chain)}
                            onToggleActive={(isActive) =>
                              handleToggleActive(chain, isActive)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <ChainDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultModuleType={activeTab}
        editTarget={editTarget}
      />

      {/* Delete AlertDialog */}
      <DeleteDialog
        chain={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default Page;
