"use client";

/**
 * app/(system)/dms/documents/_components/DocumentUploadModal.tsx
 * DMS — Upload Document Modal
 *
 * Props:
 *   open         — controlled open state
 *   onOpenChange — shadcn Dialog close handler (also resets form)
 *   onUploaded   — optional callback after successful upload (parent can refresh)
 *
 * Flow:
 *   1. User drops / selects a file — title auto-fills from filename
 *   2. Fills document type (optional); expiry date appears when
 *      the selected type has requires_expiry = true
 *   3. Submit → POST /v1/dms/documents (multipart/form-data)
 *            → invalidate ['dms', 'documents'] cache
 *            → toast.success → close
 *
 * MIME allow-list: PDF, DOCX, DOC, JPEG, PNG, WebP — max 25 MB
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *   • All form inputs have an associated FormLabel / <Label htmlFor>.
 *   • Dropzone has role="button" + aria-label + keyboard activation.
 *   • File rejection errors surfaced via toast (not silent).
 *   • aria-busy on submit button while uploading.
 *   • File-removal button has aria-label.
 */

import { showApiError } from "@/lib/error-toast";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  CalendarDays,
  File as FileIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getDocumentTypes, uploadDocument } from "@/services/dms.service";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";

// ── Types & schema ────────────────────────────────────────────────────────────

const schema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title must be 255 characters or fewer"),
  document_type_id: z.string().optional(),
  expiry_date: z.string().optional(),
  description: z
    .string()
    .max(2000, "Description must be 2 000 characters or fewer")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ACCEPTED_MIME: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

const ACCEPTED_LABELS = "PDF, JPEG, PNG, WebP, DOC, DOCX";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Strip file extension and replace underscores/hyphens with spaces */
function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentUploadModal({
  open,
  onOpenChange,
  onUploaded,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      document_type_id: "",
      expiry_date: "",
      description: "",
    },
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const docTypeId = form.watch("document_type_id");

  // ── Document types query ──────────────────────────────────────────────────

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["dms", "document-types"],
    queryFn: getDocumentTypes,
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const selectedDocType = documentTypes.find(
    (dt) => String(dt.id) === docTypeId,
  );
  const requiresExpiry = selectedDocType?.requires_expiry ?? false;

  // Clear expiry_date when the selected type no longer requires it
  useEffect(() => {
    if (!requiresExpiry) {
      form.setValue("expiry_date", "");
    }
  }, [requiresExpiry, form]);

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        form.reset();
        setSelectedFile(null);
      }
      onOpenChange(isOpen);
    },
    [form, onOpenChange],
  );

  // ── Upload mutation ───────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success("Document uploaded successfully.");
      queryClient.invalidateQueries({ queryKey: ["dms", "documents"] });
      onUploaded?.();
      handleOpenChange(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ??
          "Upload failed — check file type and size." });
    },
  });

  // ── Dropzone ──────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setSelectedFile(file);
      // Auto-fill title only if the user hasn't typed something already
      if (!form.getValues("title")) {
        form.setValue("title", titleFromFilename(file.name), {
          shouldValidate: true,
        });
      }
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    accept: ACCEPTED_MIME,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === "file-too-large") {
        toast.error(
          `File exceeds the 25 MB limit (${formatBytes(rejections[0].file.size)}).`,
        );
      } else if (code === "file-invalid-type") {
        toast.error(
          `File type not supported. Allowed: ${ACCEPTED_LABELS}.`,
        );
      } else {
        toast.error("File rejected — check type and size.");
      }
    },
  });

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = (values: FormValues) => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("title", values.title);
    if (values.document_type_id) {
      fd.append("document_type_id", values.document_type_id);
    }
    if (requiresExpiry && values.expiry_date) {
      fd.append("expiry_date", values.expiry_date);
    }
    if (values.description?.trim()) {
      fd.append("description", values.description.trim());
    }

    uploadMutation.mutate(fd);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[540px]"
        aria-label="Upload document dialog"
      >
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Select a file and fill in the details below. Supported:{" "}
            {ACCEPTED_LABELS} — max 25 MB.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* ── Dropzone ─────────────────────────────────────────── */}
            {selectedFile ? (
              // File selected — show summary with remove option
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/60 px-4 py-3">
                <FileIcon
                  className="h-8 w-8 shrink-0 text-green-600"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              // No file — show dropzone
              <div
                {...getRootProps()}
                role="button"
                tabIndex={0}
                aria-label="Drop file here or click to browse"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                <input {...getInputProps()} />
                <Upload
                  className="mb-2 h-7 w-7 text-muted-foreground"
                  aria-hidden="true"
                />
                {isDragActive ? (
                  <p className="text-sm font-medium text-primary">
                    Drop it here…
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Drag &amp; drop, or{" "}
                      <span className="text-primary underline">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ACCEPTED_LABELS} · max 25 MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── Title ────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title{" "}
                    <span
                      className="text-red-500 font-normal"
                      aria-label="required"
                    >
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Employment Contract 2026"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Document type ─────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="document_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select document type">
                        <SelectValue placeholder="Select type (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((dt) => (
                        <SelectItem key={dt.id} value={String(dt.id)}>
                          <span className="flex items-center gap-2">
                            {dt.name}
                            {dt.requires_expiry && (
                              <CalendarDays
                                className="h-3.5 w-3.5 text-amber-500"
                                aria-label="Requires expiry date"
                              />
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Expiry date — conditional on requires_expiry ─────── */}
            {requiresExpiry && (
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <CalendarDays
                        className="h-3.5 w-3.5 text-amber-500"
                        aria-hidden="true"
                      />
                      Expiry date{" "}
                      <span
                        className="text-red-500 font-normal"
                        aria-label="required"
                      >
                        *
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        aria-required="true"
                        min={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ── Description ──────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this document…"
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Footer ───────────────────────────────────────────── */}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-800 hover:bg-brand-700 text-white"
                disabled={!selectedFile || uploadMutation.isPending}
                aria-busy={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
