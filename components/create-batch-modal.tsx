"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  File as FileIcon,
  FileSpreadsheet,
  Folder as FolderIcon,       // ← NEW
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useDmsFolders } from "@/hooks/useDmsFolders";           // ← NEW (adjust path)
import {
  useCreateBulkBatch,
  useProcessBulkBatch,
  useUploadBulkFiles,
} from "@/hooks/use-bulk-upload";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ── Local types ───────────────────────────────────────────────────────────────

interface DocumentTypeOption {
  id: number;
  name: string;
}

interface FolderOption {
  id: number;
  name: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectedFile {
  file: File;
  id: string;
}

interface CreateBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  batch_name: z.string().min(2, "Batch name is required").max(100),
  document_type_id: z.string().min(1, "Document type is required"),
  default_folder_id: z.string().optional(),               // ← NEW
  default_access_level: z.string().optional(),
  filename_col: z.string().optional(),
  emp_id_col: z.string().optional(),
  title_col: z.string().optional(),
  expiry_col: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Batch details" },
  { id: 2, label: "Upload files" },
  { id: 3, label: "Review" },
];

const ACCEPTED_MIME = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

const CSV_ACCEPT =
  ".csv,text/csv,text/plain,application/csv,application/vnd.ms-excel";

const ACCESS_LEVELS = [
  { value: "public", label: "Public" },
  { value: "hr_only", label: "HR Only" },
  { value: "employee_only", label: "Employee Only" },
  { value: "manager_team", label: "Manager Team" },
  { value: "finance_only", label: "Finance Only" },
] as const;

const DEFAULT_MAPPING = {
  filename_col: "filename",
  emp_id_col: "emp_id",
  title_col: "title",
  expiry_col: "expiry_date",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isCsv(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "text/plain" ||
    file.type === "application/vnd.ms-excel"
  );
}

function toDocumentTypeOptions(raw: unknown): DocumentTypeOption[] {
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

  if (!Array.isArray(candidate)) return [];

  return (candidate as Array<Record<string, unknown>>)
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name ?? "Untitled"),
    }))
    .filter((item) => Number.isFinite(item.id));
}

// ← NEW: folders normalize (hook may return array, envelope, or paginated object)
function toFolderOptions(raw: unknown): FolderOption[] {
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

  if (!Array.isArray(candidate)) return [];

  return (candidate as Array<Record<string, unknown>>)
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name ?? "Untitled folder"),
    }))
    .filter((item) => Number.isFinite(item.id));
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: { id: number; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                current === step.id
                  ? "bg-primary text-primary-foreground"
                  : current > step.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {current > step.id ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:block",
                current === step.id
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="h-px flex-1 bg-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateBatchModal({
  open,
  onOpenChange,
}: CreateBatchModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [step1Values, setStep1Values] = useState<Step1Values | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Document types ──────────────────────────────────────────────────────────
  const { data: documentTypesRaw, isLoading: loadingTypes } = useDocumentTypes({
    per_page: 100,
  });

  const typeList: DocumentTypeOption[] = useMemo(
    () => toDocumentTypeOptions(documentTypesRaw),
    [documentTypesRaw],
  );

  // ── Folders ← NEW ───────────────────────────────────────────────────────────
  const { data: foldersRaw, isLoading: loadingFolders } = useDmsFolders();

  const folderList: FolderOption[] = useMemo(
    () => toFolderOptions(foldersRaw),
    [foldersRaw],
  );

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      batch_name: "",
      document_type_id: "",
      default_folder_id: "",                 // ← NEW
      default_access_level: "hr_only",
      ...DEFAULT_MAPPING,
    },
  });

  // ── Reset when modal opens/closes ───────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedFiles([]);
      setCsvFile(null);
      setUploadProgress(0);
      setShowAdvanced(false);
      setStep1Values(null);
      setSubmitError(null);
      form.reset({
        batch_name: "",
        document_type_id: "",
        default_folder_id: "",
        default_access_level: "hr_only",
        ...DEFAULT_MAPPING,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Dropzone ────────────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mapped: SelectedFile[] = acceptedFiles.map((f) => ({
      file: f,
      id: `${f.name}-${f.size}-${Math.random()}`,
    }));
    setSelectedFiles((prev) => {
      const existing = new Set(
        prev.map((p) => `${p.file.name}-${p.file.size}`),
      );
      const deduped = mapped.filter(
        (m) => !existing.has(`${m.file.name}-${m.file.size}`),
      );
      return [...prev, ...deduped];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (id: string) =>
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));

  // ── CSV picker ──────────────────────────────────────────────────────────────
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      return;
    }
    if (!isCsv(file)) {
      toast.error("Please select a valid CSV file.");
      e.target.value = "";
      return;
    }
    setCsvFile(file);
  };

  const clearCsv = () => setCsvFile(null);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useCreateBulkBatch();
  const uploadMutation = useUploadBulkFiles();
  const processMutation = useProcessBulkBatch();

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStep1Submit = (values: Step1Values) => {
    setStep1Values(values);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please add at least one document file.");
      return;
    }
    if (!csvFile) {
      toast.error("CSV mapping file is required.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!step1Values) return;
    if (!csvFile) {
      toast.error("CSV mapping file is required.");
      return;
    }

    setSubmitError(null);

    try {
      // ── 1. Create batch (NOW INCLUDES default_folder_id) ──────────────────
      const batch = await createMutation.mutateAsync({
        batch_name: step1Values.batch_name,
        document_type_id: Number(step1Values.document_type_id),
        default_access_level:
          (step1Values.default_access_level as
            | "public"
            | "hr_only"
            | "employee_only"
            | "manager_team"
            | "finance_only") || "hr_only",
        // ← NEW: send folder id (null if not selected)
        default_folder_id: step1Values.default_folder_id
          ? Number(step1Values.default_folder_id)
          : null,
        mapping_config: {
          filename_col:
            step1Values.filename_col || DEFAULT_MAPPING.filename_col,
          emp_id_col: step1Values.emp_id_col || DEFAULT_MAPPING.emp_id_col,
          title_col: step1Values.title_col || DEFAULT_MAPPING.title_col,
          expiry_col: step1Values.expiry_col || DEFAULT_MAPPING.expiry_col,
        },
      });

      // ── 2. Upload files + CSV ─────────────────────────────────────────────
      const fd = new FormData();
      selectedFiles.forEach(({ file }) => fd.append("files[]", file));
      fd.append("csv", csvFile);

      let uploadResult;
      try {
        uploadResult = await uploadMutation.mutateAsync({
          uuid: batch.uuid,
          formData: fd,
          onProgress: setUploadProgress,
        });
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const msg =
          axiosErr.response?.data?.message ??
          "Upload failed. Please check the files and CSV and try again.";
        setSubmitError(msg);
        showApiError(err, { fallbackMessage: msg });
        return;
      }

      // ── 3. Auto-process ───────────────────────────────────────────────────
      toast.success(
        `${uploadResult.matched} matched, ${uploadResult.unmatched} unmatched. Starting processing…`,
      );

      try {
        await processMutation.mutateAsync(batch.uuid);
        onOpenChange(false);

      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        showApiError(err, { fallbackMessage: axiosErr.response?.data?.message ??
            "Files uploaded but processing failed. Open the batch to retry." });
        onOpenChange(false);
       
      }
    } catch {
      
    }
  };

  const isSubmitting =
    createMutation.isPending ||
    uploadMutation.isPending ||
    processMutation.isPending;

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedTypeName =
    typeList.find((t) => String(t.id) === step1Values?.document_type_id)
      ?.name ?? "—";

  // ← NEW: for review step
  const selectedFolderName =
    folderList.find((f) => String(f.id) === step1Values?.default_folder_id)
      ?.name ?? "None";

  const totalSize =
    selectedFiles.reduce((sum, f) => sum + f.file.size, 0) +
    (csvFile?.size ?? 0);

  const statusText = createMutation.isPending
    ? "Creating batch…"
    : uploadMutation.isPending
      ? `Uploading… ${uploadProgress}%`
      : processMutation.isPending
        ? "Starting processing…"
        : "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>New Bulk Upload</DialogTitle>
          <DialogDescription>
            Upload documents with a CSV mapping file. Processing starts
            automatically after upload.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <StepIndicator current={step} steps={STEPS} />
        </div>

        <Separator />

        <div className="pt-2">
          {/* ── Step 1 ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleStep1Submit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="batch_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. September Onboarding Documents"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingTypes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingTypes
                                  ? "Loading document types…"
                                  : "Select document type…"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeList.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={String(type.id)}
                            >
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ← NEW: Folder dropdown ────────────────────────────── */}
                <FormField
                  control={form.control}
                  name="default_folder_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Destination folder
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (optional — per-employee subfolders created here)
                        </span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingFolders}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingFolders
                                  ? "Loading folders…"
                                  : "Select folder…"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {folderList.length === 0 && !loadingFolders && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              No folders available
                            </div>
                          )}
                          {folderList.map((folder) => (
                            <SelectItem
                              key={folder.id}
                              value={String(folder.id)}
                            >
                              <span className="flex items-center gap-2">
                                <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                {folder.name}
                              </span>
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
                  name="default_access_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default access level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCESS_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Advanced mapping config */}
                <div className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((s) => !s)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                  >
                    <span>Column mapping (advanced)</span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 border-t px-4 py-4">
                      <p className="text-xs text-muted-foreground">
                        These keys map columns in your CSV to document
                        metadata. Leave defaults unless your CSV differs.
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(
                          [
                            ["filename_col", "Filename column"],
                            ["emp_id_col", "Employee ID column"],
                            ["title_col", "Title column"],
                            ["expiry_col", "Expiry date column"],
                          ] as const
                        ).map(([name, label]) => (
                          <FormField
                            key={name}
                            control={form.control}
                            name={name}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {label}
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* ── Step 2 (unchanged) ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Document files *</p>
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="font-medium text-primary">
                      Drop files here…
                    </p>
                  ) : (
                    <>
                      <p className="font-medium">
                        Drag &amp; drop files here, or{" "}
                        <span className="text-primary underline">
                          click to browse
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, JPEG, PNG, DOC, DOCX — up to 20 MB each
                      </p>
                    </>
                  )}
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {selectedFiles.length} file
                    {selectedFiles.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="max-h-52 overflow-y-auto rounded-md border">
                    {selectedFiles.map(({ file, id }) => (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 px-3 py-2 even:bg-muted/20"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm">{file.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">
                  CSV mapping file *{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (required — maps filenames to employees)
                  </span>
                </p>

                {csvFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="truncate text-sm">{csvFile.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(csvFile.size)}
                      </span>
                      <button
                        type="button"
                        onClick={clearCsv}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove CSV"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="csv-upload"
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-colors",
                      "border-border hover:border-primary/50 hover:bg-muted/30",
                    )}
                  >
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <span>
                      Click to select CSV{" "}
                      <span className="text-xs text-muted-foreground">
                        (.csv)
                      </span>
                    </span>
                    <input
                      id="csv-upload"
                      type="file"
                      accept={CSV_ACCEPT}
                      onChange={handleCsvChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Next}
                  disabled={selectedFiles.length === 0 || !csvFile}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3 ─────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch name</span>
                  <span className="font-medium">
                    {step1Values?.batch_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document type</span>
                  <span className="font-medium">{selectedTypeName}</span>
                </div>

                {/* ← NEW: folder in review */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Destination folder
                  </span>
                  <span className="font-medium">{selectedFolderName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Default access level
                  </span>
                  <span className="font-medium">
                    {step1Values?.default_access_level
                      ? (ACCESS_LEVELS.find(
                          (l) => l.value === step1Values.default_access_level,
                        )?.label ?? step1Values.default_access_level)
                      : "HR Only"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">{selectedFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CSV file</span>
                  <span className="max-w-[220px] truncate font-medium">
                    {csvFile?.name ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total size</span>
                  <span className="font-medium">
                    {formatBytes(totalSize)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  After upload succeeds, batch processing will start
                  automatically. You&apos;ll be redirected to the batch detail
                  page to monitor progress.
                </span>
              </div>

              {isSubmitting && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{statusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !csvFile}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {createMutation.isPending
                        ? "Creating…"
                        : uploadMutation.isPending
                          ? "Uploading…"
                          : "Processing…"}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload &amp; Process
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}