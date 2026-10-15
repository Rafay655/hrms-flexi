"use client";

import { showApiError } from "@/lib/error-toast";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

interface WorkflowCreateResponse {
  uuid: string;
  run_type: string;
  selection_mode: string;
  selected_groups: any[];
  processing_step: string;
  period: { uuid: string; label: string; /* ... */ };
}

interface WorkflowSelectData {
  workflow: {
    uuid: string;
    run_type: string;
    selection_mode: "whole_company" | "groups";
    selected_groups: { type: string; id: number; name: string }[];
  };
  period: {
    uuid: string;
    label: string;
    start_date: string;
    end_date: string;
  };
  available_groups: {
    divisions: { id: number; name: string; code: string; employee_count: number }[];
  };
  total_employees: number;
  run_type_options: string[];
  selection_mode_options: string[];
}

interface Step1Props {
  workflowUuid?: string;
  onWorkflowCreated: (uuid: string) => void;
}

/* ----------------------------------------------------------------------- */
/* Small presentational helpers (kept local so the file stays drop-in)      */
/* ----------------------------------------------------------------------- */

/** Section wrapper: consistent title + spacing for every block on the step. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Consistent field label with the same required-asterisk treatment everywhere. */
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

/** Read-only key/value pair used in the workflow overview card. */
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Component                                                                */
/* ----------------------------------------------------------------------- */

const Step1SelectPeriod = forwardRef<StepHandle, Step1Props>(
  function Step1SelectPeriod({ workflowUuid, onWorkflowCreated }, ref) {
    const [periodUuid, setPeriodUuid] = useState("");
    const [runType, setRunType] = useState("regular");
    const [selectionMode, setSelectionMode] = useState<"whole_company" | "groups">("whole_company");
    const [selectedDivisions, setSelectedDivisions] = useState<{ id: number; name: string }[]>([]);
    const [divisionPopoverOpen, setDivisionPopoverOpen] = useState(false);

    // ── Fetch available periods (for creation dropdown) ──
    const { data: periodsData } = useQuery({
      queryKey: ["payroll-periods-for-select"],
      queryFn: async () => {
        const { data } = await api.get("/pay-edge/payroll-periods", {
          params: { per_page: 100},
        });
        return data.data; // array of periods
      },
      enabled: !workflowUuid, // only needed when creating
    });

    // ── Fetch existing selection if editing ──
    const { data: selectionData, isLoading: isLoadingSelection } = useQuery({
      queryKey: ["workflow-select", workflowUuid],
      queryFn: async () => {
        const { data } = await api.get(`/pay-edge/payroll-workflows/${workflowUuid}/select`);
        return data.data as WorkflowSelectData;
      },
      enabled: !!workflowUuid,
    });

    // Pre‑fill when selection data loads
    useEffect(() => {
      if (selectionData) {
        setRunType(selectionData.workflow.run_type);
        setSelectionMode(selectionData.workflow.selection_mode);
        setSelectedDivisions(
          (selectionData.workflow.selected_groups ?? []).map((g) => ({ id: g.id, name: g.name }))
        );
      }
    }, [selectionData]);

    // ── Create workflow mutation ──
    const createWorkflow = useMutation({
      mutationFn: async () => {
        const { data } = await api.post("/pay-edge/payroll-workflows", {
          period_uuid: periodUuid,
          run_type: runType,
        });
        return data.data as WorkflowCreateResponse;
      },
      onSuccess: (res) => {
        toast.success("Workflow created.");
        onWorkflowCreated(res.uuid);
        // After creation, the parent will re-render with workflowUuid,
        // and this component will automatically load the selection form.
      },
      onError: (err: any) => {
        const responseData = err?.response?.data;
        const existingUuid = responseData?.context?.existing_workflow?.uuid;

        if (responseData?.error === "duplicate_active_workflow" && existingUuid) {
          toast(
            responseData?.message ??
              "An active workflow already exists for this period. Loading it instead.",
            { icon: "ℹ️" }
          );
          // Jump straight into the existing workflow's selection form,
          // same as if we had just created it.
          onWorkflowCreated(existingUuid);
          return;
        }

        showApiError(err, { fallbackMessage: responseData?.message ?? "Could not create workflow." });
      },
    });

    // ── Save selection mutation ──
    const saveSelection = useMutation({
      mutationFn: async () => {
        const payload: any = {
          selection_mode: selectionMode,
        };
        if (selectionMode === "groups") {
          payload.selected_groups = selectedDivisions.map((d) => ({
            type: "division",
            id: d.id,
            name: d.name,
          }));
        }
        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/select`,
          payload
        );
        return data.data;
      },
      onError: (err: any) => {
        showApiError(err, { fallbackMessage: err?.response?.data?.message ?? "Could not save selection." });
      },
    });

    // ── Division options from API ──
    const divisionOptions = useMemo(() => {
      const divs = selectionData?.available_groups?.divisions ?? [];
      return divs.map((d) => ({ value: d.id, label: d.name }));
    }, [selectionData]);

    const toggleDivision = (id: number, name: string) => {
      setSelectedDivisions((prev) =>
        prev.some((d) => d.id === id)
          ? prev.filter((d) => d.id !== id)
          : [...prev, { id, name }]
      );
    };

    // ── beforeNext for stepper ──
    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        if (!workflowUuid) {
          // Creation mode
          if (!periodUuid) {
            toast.error("Please select a payroll period.");
            throw new Error("No period selected");
          }
          await createWorkflow.mutateAsync();
          // The parent's setWorkflowUuid will be called on success,
          // but the stepper might already try to advance? We need to prevent it.
          // We'll stop the next step by throwing after successful creation
          // (the stepper will not move forward because we threw an error).
          // Instead, after successful creation, the step should not advance yet.
          // We'll return false / throw to keep the user on the same step,
          // because the component will reload with workflowUuid.
          throw new Error("Workflow created – please review the selection form.");
        } else {
          // Edit mode – save selection
          if (selectionMode === "groups" && selectedDivisions.length === 0) {
            toast.error("Please select at least one division.");
            throw new Error("No divisions selected");
          }
          await saveSelection.mutateAsync();
          toast.success("Selection saved.");
        }
      },
    }), [workflowUuid, periodUuid, runType, selectionMode, selectedDivisions, createWorkflow, saveSelection]);

    /* ----------------------------------------------------------------- */
    /* Render                                                             */
    /* ----------------------------------------------------------------- */

    if (workflowUuid) {
      // --- Existing workflow (edit mode) ---
      if (isLoadingSelection || !selectionData) {
        return (
          <div className="space-y-4 py-6">
            <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        );
      }

      const runTypeOptions = selectionData.selection_mode_options; // kept as-is below for mode options
      const modeLabel = (mode: string) => mode.replace("_", " ");

      return (
        <div className="space-y-8">
          {/* Workflow overview – read‑only summary card */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoItem label="Payroll Period" value={selectionData.period.label} />
              <InfoItem
                label="Period Dates"
                value={`${selectionData.period.start_date} → ${selectionData.period.end_date}`}
              />
              <InfoItem
                label="Run Type"
                value={
                  <span className="capitalize">{selectionData.workflow.run_type}</span>
                }
              />
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3">
              <InfoItem
                label="Employees in Scope"
                value={selectionData.total_employees.toLocaleString()}
              />
            </div>
          </div>

          {/* Selection mode */}
          <Section
            title="Selection mode"
            description="Choose whether this run applies to everyone or specific divisions."
          >
            <div className="flex flex-wrap gap-3">
              {selectionData.selection_mode_options.map((mode) => {
                const active = selectionMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectionMode(mode as "whole_company" | "groups")}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                      active
                        ? "border-[#1E1B4B] bg-[#1E1B4B] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                    aria-pressed={active}
                  >
                    {modeLabel(mode)}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Divisions – only when groups mode */}
          {selectionMode === "groups" && (
            <Section title="Divisions" description="Pick one or more divisions to target.">
              <div>
                <FieldLabel required>Target divisions</FieldLabel>
                <Popover open={divisionPopoverOpen} onOpenChange={setDivisionPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className={selectedDivisions.length ? "text-gray-900" : "text-gray-500"}>
                        {selectedDivisions.length > 0
                          ? `${selectedDivisions.length} division${selectedDivisions.length > 1 ? "s" : ""} selected`
                          : "Select divisions"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search divisions..." />
                      <CommandList>
                        <CommandEmpty>No division found.</CommandEmpty>
                        <CommandGroup>
                          {divisionOptions.map((opt) => (
                            <CommandItem
                              key={opt.value}
                              value={opt.label}
                              onSelect={() => toggleDivision(opt.value, opt.label)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedDivisions.some((d) => d.id === opt.value)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedDivisions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selectedDivisions.map((d) => (
                      <Badge
                        key={d.id}
                        variant="secondary"
                        className="gap-1 rounded-full pl-3 pr-1.5 py-1 hover:bg-gray-200"
                      >
                        {d.name}
                        <button
                          onClick={() => toggleDivision(d.id, d.name)}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-300"
                          aria-label={`Remove ${d.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      );
    }

    // --- New workflow creation form ---
    return (
      <div className="space-y-8">
        <Section
          title="Start a new workflow"
          description="Choose the pay period and run type to begin."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Payroll period</FieldLabel>
              <Select value={periodUuid} onValueChange={setPeriodUuid}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {(periodsData ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.period_label} ({p.start_date} → {p.end_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel required>Run type</FieldLabel>
              <Select value={runType} onValueChange={setRunType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select run type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="supplementary">Supplementary</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
      </div>
    );
  }
);

export default Step1SelectPeriod;