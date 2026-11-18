"use client";

/**
 * app/(system)/flexi-import/new/page.tsx
 * FlexiImport — New Import Wizard
 *
 * 4-step wizard:
 *   1. Select Import Type
 *   2. Upload File + server-side validation polling
 *   3. Map Columns (DnD + dropdown fallback, @dnd-kit/core)
 *   4. Preview & Confirm
 *
 * Navigation guard:
 *   • beforeunload — browser close/refresh/tab switch while wizard is dirty
 *   • popstate — intercepts browser back button (App Router has no
 *     router.beforePopState; popstate + history.pushState is the equivalent)
 *   • LeaveDialog — in-app confirm dialog for the Cancel button
 *
 * Accessibility:
 *   • role="alert" / aria-live="polite" on error regions
 *   • aria-label on all icon-only buttons
 *   • Labels on every form control
 *   • Color + icon + text for status indicators (never color alone)
 *   • prefers-reduced-motion: AnimatePresence exits skipped at OS level
 */

import { showApiError } from "@/lib/error-toast";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileText,
  GripVertical,
  Info,
  Loader2,
  RefreshCw,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { flexiImportService } from "@/services/flexi-import.service";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  allowed_values?: string[];
}

interface SavedColumnMap {
  id: string;
  name: string;
  mapping: Record<string, string>;
  is_default: boolean;
}

interface PreviewRow {
  row_number: number;
  fields: Record<string, string>;
  status: "valid" | "invalid";
  errors?: Record<string, string>;
}

interface BatchResponse {
  uuid: string;
  status: string;
  csv_headers?: string[];
  error_message?: string | null;
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
  requires_approval?: boolean;
  approval_threshold?: number;
  import_mode?: "skip_errors" | "all_or_nothing";
}

// FI-D7: the rows endpoint returns ImportRowResource objects
// ({ row_number, raw_data, status, validation_errors, processing_error }) inside a
// paginated collection — map them to the PreviewRow shape the wizard renders.
interface ImportRowApi {
  row_number: number;
  raw_data: Record<string, string> | null;
  status: string;
  validation_errors: Array<{ field?: string; message?: string }> | null;
  processing_error: string | null;
}

function rowErrorsToMap(
  errs: ImportRowApi["validation_errors"]
): Record<string, string> | undefined {
  if (!Array.isArray(errs) || errs.length === 0) return undefined;
  const out: Record<string, string> = {};
  for (const e of errs) {
    if (e?.field) out[e.field] = e.message ?? "Invalid value";
  }
  return Object.keys(out).length ? out : undefined;
}

function toPreviewRow(r: ImportRowApi): PreviewRow {
  return {
    row_number: r.row_number,
    fields: r.raw_data ?? {},
    status: r.status === "valid" ? "valid" : "invalid",
    errors: rowErrorsToMap(r.validation_errors),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: "Select Type" },
  { id: 2, label: "Upload File" },
  { id: 3, label: "Map Columns" },
  { id: 4, label: "Preview & Confirm" },
];

const IMPORT_TYPES = [
  {
    id: "employees",
    label: "Employee Import",
    description:
      "Import new employees with all profile data.",
    note:
      "Your template columns are generated from your company's employee form — they may look different from another company's template.",
    icon: Users,
    templatePath: "/templates/employees/download",
  },
  {
    id: "flexi_meta_entities",
    label: "FlexiMeta Reference Data",
    description:
      "Bulk seed departments, designations, grade bands, and other reference tables.",
    note: null,
    icon: Database,
    templatePath: "/templates/flexi_meta_entities/download",
  },
];

// CSV-only: the backend UploadImportBatchRequest accepts only text/csv, text/plain,
// and application/csv. Listing xlsx/xls here let Excel files pass the dropzone guard
// and then 422 at the backend with a confusing error (A-081). Phase 1 is CSV-only.
const ACCEPTED_MIME: Record<string, string[]> = {
  "text/csv": [".csv"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const POLL_INTERVAL_MS = 3_000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/** Parse only the first line of a CSV to extract column headers. */
async function parseCSVFirstLine(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const first = text.split(/\r?\n/)[0] ?? "";
      const headers = first
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, "").trim())
        .filter(Boolean);
      resolve(headers);
    };
    // Only read the first 16 KB — we only need the header row.
    reader.readAsText(file.slice(0, 16_384), "utf-8");
  });
}

/**
 * Auto-match CSV headers to field definitions by exact case-insensitive
 * comparison on both label and key.
 */
function autoMatchColumns(
  headers: string[],
  fields: FieldDefinition[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach((header) => {
    const lc = header.toLowerCase();
    const match = fields.find(
      (f) =>
        f.label.toLowerCase() === lc || f.key.toLowerCase() === lc
    );
    if (match) mapping[header] = match.key;
  });
  return mapping;
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaveDialog — navigation guard confirmation
// ─────────────────────────────────────────────────────────────────────────────

function LeaveDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave this import?</DialogTitle>
          <DialogDescription>
            Your progress will be lost. Any uploaded file and column mappings
            won't be saved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Stay
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StepNav — step indicator + progress bar
// ─────────────────────────────────────────────────────────────────────────────

function StepNav({ current }: { current: number }) {
  const progress = ((current - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <Progress
        value={progress}
        className="h-1.5"
        aria-label={`Step ${current} of ${WIZARD_STEPS.length}`}
      />
      {/* Step labels */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step) => {
          const done = step.id < current;
          const active = step.id === current;
          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "text-white"
                    : active
                    ? "border-2 bg-white text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                style={
                  done
                    ? { backgroundColor: "var(--brand-500)" }
                    : active
                    ? { borderColor: "var(--brand-500)", color: "var(--brand-500)" }
                    : {}
                }
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.id}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] sm:block",
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DnD sub-components (Step 3)
// ─────────────────────────────────────────────────────────────────────────────

/** Right-panel: a draggable field chip. */
function DraggableField({
  field,
  disabled = false,
}: {
  field: FieldDefinition;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `field-${field.key}`, disabled });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-shadow",
        isDragging
          ? "shadow-lg opacity-50 cursor-grabbing"
          : disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-brand hover:shadow-sm",
        field.required && "border-l-4"
      )}
      style={{
        ...(field.required ? { borderLeftColor: "var(--brand-500)" } : {}),
        transform: CSS.Translate.toString(transform),
      }}
      title={field.description ?? field.label}
    >
      <GripVertical
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
        aria-hidden="true"
      />
      <span className="flex-1 truncate font-medium">{field.label}</span>
      {field.required && (
        <span
          className="shrink-0 text-[10px] font-bold"
          style={{ color: "var(--brand-500)" }}
          aria-label="required"
        >
          *
        </span>
      )}
    </div>
  );
}

/** Left-panel: a droppable CSV header slot. */
function DroppableSlot({
  header,
  mappedField,
  allFields,
  onUnmap,
  onSelect,
  status,
}: {
  header: string;
  mappedField: FieldDefinition | undefined;
  allFields: FieldDefinition[];
  onUnmap: (header: string) => void;
  onSelect: (header: string, fieldKey: string) => void;
  status: "matched" | "unmatched-required" | "unmatched-optional";
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${header}` });

  const borderColor =
    status === "matched"
      ? "border-green-400 bg-green-50/40"
      : status === "unmatched-required"
      ? "border-orange-400 bg-orange-50/40"
      : "border-border bg-white";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-colors",
        borderColor,
        isOver && "border-blue-400 bg-blue-50/40 ring-2 ring-blue-200"
      )}
      aria-label={`CSV column: ${header}`}
    >
      {/* Status dot */}
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          status === "matched"
            ? "bg-green-500"
            : status === "unmatched-required"
            ? "bg-orange-500"
            : "bg-gray-300"
        )}
        aria-hidden="true"
      />

      {/* CSV header label */}
      <span className="w-28 shrink-0 truncate text-sm font-medium text-foreground">
        {header}
      </span>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />

      {/* Mapped field chip or dropdown */}
      {mappedField ? (
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">{mappedField.label}</span>
          <button
            type="button"
            onClick={() => onUnmap(header)}
            aria-label={`Remove mapping for ${header}`}
            className="shrink-0 rounded hover:text-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Select onValueChange={(v) => onSelect(header, v)}>
          <SelectTrigger
            className="h-7 flex-1 text-xs text-muted-foreground"
            aria-label={`Map ${header} to a field`}
          >
            <SelectValue placeholder="Drag a field or select…" />
          </SelectTrigger>
          <SelectContent>
            {allFields.map((f) => (
              <SelectItem key={f.key} value={f.key} className="text-xs">
                {f.label}
                {f.required && (
                  <span className="ml-1 text-orange-500">*</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LegacyImportWizard({ initialType }: { initialType?: string }) {
  const router = useRouter();

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(initialType ? 2 : 1);
  const [importType, setImportType] = useState<string | null>(initialType ?? null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchUuid, setBatchUuid] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  // Step 2 — upload / polling state
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{
    code: string;
    message: string;
    existingUuid?: string;
  } | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — mapping state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [mappingValidating, setMappingValidating] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Step 4 — preview + confirm state
  const [batchMeta, setBatchMeta] = useState<BatchResponse | null>(null);
  const [importMode, setImportMode] = useState<"skip_errors" | "all_or_nothing">(
    "skip_errors"
  );
  const [isConfirming, setIsConfirming] = useState(false);

  // ── Navigation guard ────────────────────────────────────────────────────────
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const isDirty = currentStep > 1 || importType !== null;
  const leaveTargetRef = useRef<string | null>(null);

  // Browser close/refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Browser back button (popstate — App Router equivalent of router.beforePopState)
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      setShowLeaveDialog(true);
      // Re-push state so the URL doesn't change while dialog is open
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isDirty]);

  const handleCancelNavigation = () => {
    setShowLeaveDialog(false);
    leaveTargetRef.current = null;
  };

  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    const target = leaveTargetRef.current ?? "/flexi-import";
    leaveTargetRef.current = null;
    router.push(target);
  };

  const safeNavigate = (path: string) => {
    if (isDirty) {
      leaveTargetRef.current = path;
      setShowLeaveDialog(true);
    } else {
      router.push(path);
    }
  };

  // ── Field definitions query ─────────────────────────────────────────────────
  // onSuccess removed (deprecated in TanStack Query v5) — side effect via useEffect.
  const { data: fieldDefs } = useQuery<FieldDefinition[]>({
    queryKey: ["flexi-import", "fields", importType],
    queryFn: () =>
      api
        .get(`/flexi-import/fields/${importType}`)
        .then((r) => r.data.data as FieldDefinition[]),
    enabled: !!importType && currentStep >= 2,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!fieldDefs) return;
    setFieldDefinitions(fieldDefs);
    // Re-apply auto-match if headers are already available
    if (csvHeaders.length > 0) {
      setColumnMapping((prev) =>
        Object.keys(prev).length === 0
          ? autoMatchColumns(csvHeaders, fieldDefs)
          : prev
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldDefs]);

  // ── Saved column maps ───────────────────────────────────────────────────────
  const { data: savedMaps = [] } = useQuery<SavedColumnMap[]>({
    queryKey: ["flexi-import", "column-maps", importType],
    queryFn: () =>
      api
        .get(`/flexi-import/column-maps?import_type=${importType}`)
        .then((r) => r.data.data as SavedColumnMap[]),
    enabled: !!importType && currentStep >= 2,
    staleTime: 60_000,
  });

  // ── Preview rows query ──────────────────────────────────────────────────────
  // onSuccess removed (deprecated in TanStack Query v5) — side effect via useEffect.
  const { data: previewData, isLoading: previewLoading } = useQuery<{
    rows: PreviewRow[];
    batch: BatchResponse;
  }>({
    queryKey: ["flexi-import", "preview", batchUuid],
    queryFn: async () => {
      // FI-D7: the rows endpoint returns a paginated ImportRowResource collection
      // and carries no batch object; the batch counts live on GET /batches/{uuid}
      // (at validation, successful_rows = valid and failed_rows = invalid). Fetch
      // both and assemble the { rows, batch } shape the wizard consumes.
      const [rowsRes, batchRes] = await Promise.all([
        api.get(`/flexi-import/batches/${batchUuid}/rows`),
        api.get(`/flexi-import/batches/${batchUuid}`),
      ]);

      const rowsPayload = rowsRes.data.data;
      const rawRows: ImportRowApi[] = Array.isArray(rowsPayload)
        ? rowsPayload
        : rowsPayload?.data ?? [];
      const rows = rawRows.slice(0, 10).map(toPreviewRow);

      const batchRaw = batchRes.data.data as BatchResponse & {
        successful_rows?: number;
        failed_rows?: number;
      };
      const batch: BatchResponse = {
        ...batchRaw,
        valid_rows: batchRaw.successful_rows ?? batchRaw.valid_rows,
        invalid_rows: batchRaw.failed_rows ?? batchRaw.invalid_rows,
      };

      return { rows, batch };
    },
    enabled: !!batchUuid && currentStep === 4,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!previewData) return;
    if (previewData.batch) setBatchMeta(previewData.batch);
    if (previewData.batch?.import_mode)
      setImportMode(previewData.batch.import_mode);
  }, [previewData]);

  // ── Polling helper ──────────────────────────────────────────────────────────
  const pollBatchStatus = useCallback(
    async (uuid: string) => {
      try {
        const res = await api.get(`/flexi-import/batches/${uuid}/status`);
        const { status, error_message, csv_headers } = res.data.data as BatchResponse;
        setPollStatus(status);

        if (status === "validation_complete") {
          setIsPolling(false);
          if (csv_headers) {
            setCsvHeaders(csv_headers);
            setColumnMapping(autoMatchColumns(csv_headers, fieldDefinitions));
          }
          setCurrentStep(3);
        } else if (status === "failed") {
          setIsPolling(false);
          setUploadError({
            code: "VALIDATION_FAILED",
            message: error_message ?? "File validation failed.",
          });
        } else {
          // Still validating — schedule next poll
          pollTimer.current = setTimeout(() => pollBatchStatus(uuid), POLL_INTERVAL_MS);
        }
      } catch {
        setIsPolling(false);
        setUploadError({
          code: "POLL_ERROR",
          message: "Lost connection while validating. Please try again.",
        });
      }
    },
    [fieldDefinitions]
  );

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  // ── Dropzone ────────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const code = rejections[0]?.errors[0]?.code;
        const msg =
          code === "file-too-large"
            ? `File exceeds the 10 MB limit. Please reduce the file size.`
            : `Only .csv and .xlsx files are accepted.`;
        toast.error(msg);
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      setUploadedFile(file);
      setUploadError(null);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadedFile || !importType) return;
    setIsUploading(true);
    setUploadError(null);

    // Parse CSV headers client-side (CSV only — XLSX headers come from server)
    let clientHeaders: string[] = [];
    if (uploadedFile.name.toLowerCase().endsWith(".csv")) {
      clientHeaders = await parseCSVFirstLine(uploadedFile);
    }

    const fd = new FormData();
    fd.append("file", uploadedFile);
    fd.append("import_type", importType);
    fd.append("column_mapping", JSON.stringify({}));
    if (savedTemplateId) fd.append("column_map_id", savedTemplateId);

    try {
      const res = await api.post("/flexi-import/batches", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data.data as BatchResponse;
      setBatchUuid(data.uuid);

      // Prefer server-side headers (handles xlsx + encoding normalisation)
      const headers = data.csv_headers?.length
        ? data.csv_headers
        : clientHeaders;
      setCsvHeaders(headers);
      if (fieldDefinitions.length > 0 && headers.length > 0) {
        setColumnMapping(autoMatchColumns(headers, fieldDefinitions));
      }

      // Start polling
      setIsPolling(true);
      setPollStatus("validating");
      pollBatchStatus(data.uuid);
    } catch (err) {
      const axErr = err as AxiosError<{
        code?: string;
        message?: string;
        existing_uuid?: string;
      }>;
      const code = axErr.response?.data?.code ?? "UNKNOWN";
      const message =
        axErr.response?.data?.message ?? "Upload failed. Please try again.";
      const existingUuid = axErr.response?.data?.existing_uuid;

      setUploadError({ code, message, existingUuid });
    } finally {
      setIsUploading(false);
    }
  };

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) =>
    setActiveDragId(e.active.id.toString());

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const dragId = active.id.toString();
    const overId = over.id.toString();
    if (!dragId.startsWith("field-") || !overId.startsWith("slot-")) return;

    const fieldKey = dragId.replace("field-", "");
    const csvHeader = overId.replace("slot-", "");

    setColumnMapping((prev) => {
      // Remove field from any existing mapping
      const cleaned = Object.fromEntries(
        Object.entries(prev).filter(([, v]) => v !== fieldKey)
      );
      return { ...cleaned, [csvHeader]: fieldKey };
    });
  };

  // ── Step 3 mapping helpers ──────────────────────────────────────────────────
  const mappedFieldKeys = new Set(Object.values(columnMapping));

  const getSlotStatus = (
    header: string
  ): "matched" | "unmatched-required" | "unmatched-optional" => {
    if (columnMapping[header]) return "matched";
    // Is this header expected to map to a required field?
    const couldBeRequired = fieldDefinitions.some(
      (f) =>
        f.required &&
        (f.label.toLowerCase() === header.toLowerCase() ||
          f.key.toLowerCase() === header.toLowerCase())
    );
    return couldBeRequired ? "unmatched-required" : "unmatched-optional";
  };

  const unmappedRequiredFields = fieldDefinitions.filter(
    (f) => f.required && !mappedFieldKeys.has(f.key)
  );

  const canAdvanceStep3 = unmappedRequiredFields.length === 0;

  const handleLoadTemplate = (mapId: string) => {
    const tpl = savedMaps.find((m) => m.id === mapId);
    if (!tpl) return;
    setSavedTemplateId(mapId);
    setColumnMapping(tpl.mapping);
    toast.success(`Loaded template: ${tpl.name}`);
  };

  const handleValidateMapping = async () => {
    if (!importType) return;
    setMappingValidating(true);
    setMappingError(null);
    try {
      // Stateless server-side validation (no batch uuid): import_type + the column
      // mapping + the CSV headers. Returns { valid, unmapped_required_fields,
      // unknown_csv_columns }.
      const { data } = await api.post(`/flexi-import/validate-mapping`, {
        import_type: importType,
        column_mapping: columnMapping,
        csv_headers: csvHeaders,
      });
      const result = data.data as {
        valid: boolean;
        unmapped_required_fields: string[];
        unknown_csv_columns: string[];
      };

      if (!result.valid) {
        setMappingError(
          `Map all required fields before continuing: ${result.unmapped_required_fields.join(", ")}`,
        );
        return;
      }

      // Optionally persist the mapping as a reusable template — a separate endpoint;
      // the validator does not save templates.
      if (saveAsTemplate && templateName) {
        await flexiImportService.createColumnMap({
          name: templateName,
          import_type: importType,
          column_mapping: columnMapping,
          is_default: setAsDefault,
        });
      }

      setCurrentStep(4);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setMappingError(
        axErr.response?.data?.message ?? "Mapping validation failed."
      );
    } finally {
      setMappingValidating(false);
    }
  };

  // ── Step 4 confirm ──────────────────────────────────────────────────────────
  const handleModeChange = (mode: "skip_errors" | "all_or_nothing") => {
    // import_mode is fixed at upload time; there is no PATCH endpoint to change it
    // post-upload (FI-D5), so keep this as a local UI preference only.
    setImportMode(mode);
  };

  const handleConfirm = async () => {
    if (!batchUuid) return;
    setIsConfirming(true);
    try {
      if (batchMeta?.requires_approval) {
        // Approval path — just redirect; backend already has the batch queued
        router.push(`/flexi-import/batches/${batchUuid}`);
      } else {
        await api.post(`/flexi-import/batches/${batchUuid}/process`);
        router.push(`/flexi-import/batches/${batchUuid}`);
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      showApiError(err, { fallbackMessage: axErr.response?.data?.message ?? "Failed to start import." });
      setIsConfirming(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** The "active drag" field definition for DragOverlay. */
  const activeDragField = activeDragId
    ? fieldDefinitions.find(
        (f) => `field-${f.key}` === activeDragId
      )
    : null;

  const validRows = previewData?.batch?.valid_rows ?? 0;
  const invalidRows = previewData?.batch?.invalid_rows ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Step panels
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Select Import Type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what you want to import. Download the blank template to see the
          expected column structure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {IMPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const selected = importType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setImportType(type.id)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all cursor-pointer",
                selected
                  ? "shadow-md"
                  : "border-border hover:border-gray-400 hover:bg-gray-50/50"
              )}
              style={
                selected
                  ? {
                      borderColor: "var(--brand-500)",
                      backgroundColor: "rgba(238,194,147,0.08)",
                    }
                  : {}
              }
            >
              <div className="flex w-full items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: selected
                      ? "rgba(238,194,147,0.2)"
                      : "var(--muted)",
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: selected ? "var(--brand-500)" : undefined }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{type.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </div>
                {selected && (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--brand-500)" }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {type.note && selected && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{type.note}</span>
                </div>
              )}

              <a
                href={`/api/v1${type.templatePath}`}
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                style={{ color: "var(--brand-500)" }}
                aria-label={`Download blank template for ${type.label}`}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download Blank Template
              </a>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload Your File</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a .csv or .xlsx file. Max file size: 10 MB.
        </p>
      </div>

      {/* Saved column map loader */}
      {savedMaps.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="saved-map-select">Load saved column mapping (optional)</Label>
          <Select
            onValueChange={handleLoadTemplate}
            value={savedTemplateId ?? ""}
          >
            <SelectTrigger id="saved-map-select" className="w-full sm:w-80">
              <SelectValue placeholder="None — map columns manually in Step 3" />
            </SelectTrigger>
            <SelectContent>
              {savedMaps.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {m.is_default && (
                    <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dropzone */}
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-border hover:border-gray-400 hover:bg-gray-50/60"
          )}
          role="button"
          aria-label="Drop a CSV or XLSX file here or click to browse"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            (e.currentTarget as HTMLElement).click()
          }
        >
          <input {...getInputProps()} aria-hidden="true" />
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(238,194,147,0.15)" }}
          >
            <Upload
              className="h-5 w-5"
              style={{ color: "var(--brand-500)" }}
              aria-hidden="true"
            />
          </div>
          {isDragActive ? (
            <p className="font-semibold text-blue-700">Drop the file here…</p>
          ) : (
            <>
              <p className="font-semibold text-foreground">
                Drag & drop your file here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or{" "}
                <span
                  className="font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--brand-500)" }}
                >
                  browse to choose a file
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                CSV or XLSX · max 10 MB
              </p>
            </>
          )}
        </div>
      ) : (
        /* File selected — info card */
        <div className="flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
          <FileText
            className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-green-800">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-green-700">
              {formatBytes(uploadedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadedFile(null);
              setUploadError(null);
            }}
            aria-label="Remove selected file and choose a different one"
            className="shrink-0 rounded text-green-700 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Upload error messages */}
      {uploadError && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
            uploadError.code === "DUPLICATE_IMPORT_DETECTED"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-red-300 bg-red-50 text-red-800"
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">
              {uploadError.code === "DUPLICATE_IMPORT_DETECTED"
                ? "Duplicate import detected"
                : uploadError.code === "FILE_ENCODING_ERROR"
                ? "File encoding error"
                : "Upload failed"}
            </p>
            <p className="mt-0.5 text-xs">{uploadError.message}</p>
            {uploadError.code === "FILE_ENCODING_ERROR" && (
              <p className="mt-1 text-xs">
                Save the file as UTF-8 CSV (File → Save As → CSV UTF-8) and
                try again.
              </p>
            )}
            {uploadError.existingUuid && (
              <a
                href={`/flexi-import/batches/${uploadError.existingUuid}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline"
              >
                View existing batch
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Validating spinner */}
      {isPolling && (
        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <span>
            <span className="font-semibold">Validating file…</span>
            {pollStatus && (
              <span className="ml-1 text-blue-600">({pollStatus})</span>
            )}
          </span>
        </div>
      )}

      {/* Upload button */}
      {!isPolling && (
        <Button
          onClick={handleUpload}
          disabled={!uploadedFile || isUploading}
          aria-busy={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload & Validate
            </>
          )}
        </Button>
      )}
    </div>
  );

  const renderStep3 = () => {
    const requiredFields = fieldDefinitions.filter((f) => f.required);
    const optionalFields = fieldDefinitions.filter((f) => !f.required);

    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Map Columns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Match your CSV columns to import fields. Required fields must all
              be mapped before you can proceed.
            </p>
          </div>

          {/* Saved template loader */}
          {savedMaps.length > 0 && (
            <div className="shrink-0">
              <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="Load saved mapping template">
                  <SelectValue placeholder="Load template…" />
                </SelectTrigger>
                <SelectContent>
                  {savedMaps.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Auto-matched
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
            Required — needs mapping
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300" aria-hidden="true" />
            Optional — may skip
          </span>
        </div>

        {/* DnD mapping area */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left: CSV header slots */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your CSV Columns
              </h3>
              {csvHeaders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No headers detected.
                </p>
              ) : (
                <div className="space-y-1.5" role="list" aria-label="CSV column slots">
                  {csvHeaders.map((header) => (
                    <div key={header} role="listitem">
                      <DroppableSlot
                        header={header}
                        mappedField={
                          columnMapping[header]
                            ? fieldDefinitions.find(
                                (f) => f.key === columnMapping[header]
                              )
                            : undefined
                        }
                        allFields={fieldDefinitions.filter(
                          (f) => !mappedFieldKeys.has(f.key) || columnMapping[header] === f.key
                        )}
                        onUnmap={(h) =>
                          setColumnMapping((prev) => {
                            const n = { ...prev };
                            delete n[h];
                            return n;
                          })
                        }
                        onSelect={(h, key) =>
                          setColumnMapping((prev) => {
                            const cleaned = Object.fromEntries(
                              Object.entries(prev).filter(([, v]) => v !== key)
                            );
                            return { ...cleaned, [h]: key };
                          })
                        }
                        status={getSlotStatus(header)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Draggable field definitions */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Required Fields
                  {unmappedRequiredFields.length > 0 && (
                    <span
                      className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] text-white"
                      style={{ backgroundColor: "var(--brand-500)" }}
                    >
                      {unmappedRequiredFields.length} unmapped
                    </span>
                  )}
                </h3>
                {requiredFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">None</p>
                ) : (
                  <div className="space-y-1.5" role="list" aria-label="Required fields to map">
                    {requiredFields.map((f) => (
                      <div key={f.key} role="listitem">
                        <DraggableField
                          field={f}
                          disabled={mappedFieldKeys.has(f.key)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {optionalFields.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Optional Fields
                  </h3>
                  <div className="space-y-1.5" role="list" aria-label="Optional fields to map">
                    {optionalFields.map((f) => (
                      <div key={f.key} role="listitem">
                        <DraggableField
                          field={f}
                          disabled={mappedFieldKeys.has(f.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                Drag a field from this panel onto a CSV column to map it.
              </p>
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeDragField ? (
              <div className="flex cursor-grabbing items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xl">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="font-medium">{activeDragField.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Mapping validation error */}
        {mappingError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {mappingError}
          </div>
        )}

        {/* Unmapped required fields warning */}
        {unmappedRequiredFields.length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>
                {unmappedRequiredFields.length} required field
                {unmappedRequiredFields.length > 1 ? "s" : ""} unmapped:
              </strong>{" "}
              {unmappedRequiredFields.map((f) => f.label).join(", ")}. All required
              fields must be mapped before proceeding.
            </span>
          </div>
        )}

        {/* Save as template */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-template"
              checked={saveAsTemplate}
              onCheckedChange={(v) => setSaveAsTemplate(!!v)}
            />
            <Label htmlFor="save-template" className="cursor-pointer text-sm">
              Save this mapping as a template for future imports
            </Label>
          </div>
          {saveAsTemplate && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  id="template-name"
                  placeholder="Template name…"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full sm:w-64"
                  aria-label="Column template name"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="set-default"
                  checked={setAsDefault}
                  onCheckedChange={(v) => setSetAsDefault(!!v)}
                />
                <Label htmlFor="set-default" className="cursor-pointer text-sm">
                  Set as default for {IMPORT_TYPES.find((t) => t.id === importType)?.label ?? "this import type"}
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const approvalThreshold = batchMeta?.approval_threshold;
    const requiresApproval = batchMeta?.requires_approval;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Preview & Confirm</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the first 10 rows. Check for errors before starting the
            import.
          </p>
        </div>

        {/* Summary banner */}
        {batchMeta && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-green-800">
                  {validRows.toLocaleString()} rows valid
                </p>
                <p className="text-xs text-green-700">Ready to import</p>
              </div>
            </div>
            {invalidRows > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-red-800">
                    {invalidRows.toLocaleString()} rows have errors
                  </p>
                  <p className="text-xs text-red-700">
                    {importMode === "skip_errors"
                      ? "Will be skipped"
                      : "Will fail the batch"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error row notice */}
        {invalidRows > 0 && importMode === "skip_errors" && (
          <p className="text-xs text-muted-foreground">
            These rows won't be imported. Download the error report after
            importing to fix and re-upload.
          </p>
        )}

        {/* Approval banner */}
        {requiresApproval && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold">Approval required</p>
              <p className="mt-0.5">
                Submitting will send an approval request to your HR Manager
                before processing begins.
              </p>
              {approvalThreshold && (
                <p className="mt-1 text-xs text-amber-700">
                  <strong>Why approval?</strong> Imports of more than{" "}
                  {approvalThreshold.toLocaleString()} rows require manager
                  sign-off to protect against accidental data changes.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import mode */}
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Import mode</Label>
            <div className="flex overflow-hidden rounded-lg border border-border text-sm">
              {(
                [
                  {
                    value: "skip_errors",
                    label: "Skip error rows",
                    description: "Recommended",
                  },
                  {
                    value: "all_or_nothing",
                    label: "Fail on any error",
                    description: "Strict",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleModeChange(opt.value)}
                  className={cn(
                    "flex flex-1 flex-col items-center px-4 py-2.5 transition-colors",
                    importMode === opt.value
                      ? "font-semibold text-white"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                  style={
                    importMode === opt.value
                      ? { backgroundColor: "var(--brand-500)" }
                      : {}
                  }
                  aria-pressed={importMode === opt.value}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-75">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>
        </>

        {/* Preview table */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">First 10 rows preview</h3>
          </div>

          {previewLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading preview…
            </div>
          ) : !previewData?.rows?.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No rows to preview.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" aria-label="Import preview rows">
                <thead>
                  <tr className="border-b border-border bg-gray-50/60">
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide w-10">
                      #
                    </th>
                    {Object.keys(previewData.rows[0]?.fields ?? {}).map(
                      (col) => (
                        <th
                          key={col}
                          className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          {col}
                        </th>
                      )
                    )}
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide w-16">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.rows.map((row) => (
                    <tr
                      key={row.row_number}
                      className={cn(
                        "group transition-colors",
                        row.status === "invalid"
                          ? "bg-red-50/40 hover:bg-red-50"
                          : "hover:bg-gray-50/60"
                      )}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                        {row.row_number}
                      </td>
                      {Object.entries(row.fields).map(([col, val]) => (
                        <td
                          key={col}
                          className="px-3 py-2.5"
                          title={
                            row.errors?.[col]
                              ? `Error: ${row.errors[col]}`
                              : undefined
                          }
                        >
                          {row.errors?.[col] ? (
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span
                                className="underline decoration-red-400 decoration-dashed"
                                aria-describedby={`err-${row.row_number}-${col}`}
                              >
                                {val || <em className="text-red-400">empty</em>}
                              </span>
                              <span
                                id={`err-${row.row_number}-${col}`}
                                className="sr-only"
                              >
                                Error: {row.errors[col]}
                              </span>
                            </span>
                          ) : (
                            <span className="text-foreground">
                              {val || (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        {row.status === "valid" ? (
                          <Check
                            className="ml-auto h-4 w-4 text-green-600"
                            aria-label="Valid row"
                          />
                        ) : (
                          <XCircle
                            className="ml-auto h-4 w-4 text-red-500"
                            aria-label="Row has errors"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────────────────────────────────

  const canGoNext = () => {
    if (currentStep === 1) return !!importType;
    if (currentStep === 2) return false; // Next handled by upload + poll
    if (currentStep === 3) return canAdvanceStep3;
    return false;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      handleValidateMapping();
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <LeaveDialog
        open={showLeaveDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelNavigation}
      />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">New Import</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Import employee or reference data into Flexi HRMS in bulk.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => safeNavigate("/flexi-import")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </Button>
        </div>

        {/* Step navigator */}
        <Card className="rounded-2xl border border-border/60">
          <CardContent className="pt-5 pb-4">
            <StepNav current={currentStep} />
          </CardContent>
        </Card>

        {/* Step content */}
        <Card className="rounded-2xl border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "var(--brand-500)" }}
                aria-hidden="true"
              >
                {currentStep}
              </span>
              {WIZARD_STEPS[currentStep - 1]?.label}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation footer */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => safeNavigate("/flexi-import") : handleBack}
            disabled={isPolling || isUploading}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>

          {/* Step 4: Confirm button */}
          {currentStep === 4 ? (
            <Button
              onClick={handleConfirm}
              disabled={validRows === 0 || isConfirming}
              aria-busy={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : batchMeta?.requires_approval ? (
                <>
                  <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                  Submit for Approval
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Start Import
                </>
              )}
            </Button>
          ) : currentStep === 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canAdvanceStep3 || mappingValidating}
              aria-busy={mappingValidating}
            >
              {mappingValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Validating…
                </>
              ) : (
                <>
                  Preview
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          ) : currentStep === 2 ? null /* Next is triggered by upload */ : (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
