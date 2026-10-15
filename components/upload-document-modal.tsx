"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  CalendarIcon,
  File as FileIcon,
  Folder as FolderIcon,
  FileText,
  Loader2,
  Lock,
  Upload,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useDmsFolderTree } from "@/hooks/use-dms-folder-tree";
import { useUploadDocument } from "@/hooks/use-dms-documents";
import { useEmployees } from "@/hooks/useEmployees";
import type { AccessLevel } from "@/services/dms-documents.service";

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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED_MIME = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
};

const ACCESS_LEVELS: Option[] = [
  { value: "public", label: "Public" },
  { value: "hr_only", label: "HR Only" },
  { value: "employee_only", label: "Employee Only" },
  { value: "manager_team", label: "Manager Team" },
  { value: "finance_only", label: "Finance Only" },
];

// ── Schema ────────────────────────────────────────────────────────────────────

const uploadSchema = z.object({
  title: z.string().max(255).optional(),
  folder_id: z.string().optional(),
  document_type_id: z.string().optional(),
  employee_id: z.string().optional(),
  expiry_date: z.string().optional(),
  description: z.string().max(2000).optional(),
  access_level: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export function UploadDocumentModal({
  open,
  onOpenChange,
}: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // ── Lookups ─────────────────────────────────────────────────────────────────
  const { data: documentTypesRaw, isLoading: loadingTypes } = useDocumentTypes({
    per_page: 100,
  });

  // ← system folders only
  const { options: folderOptions, isLoading: loadingFolders } =
    useDmsFolderTree({ rootOnly: true });

  // ← employees with required params
  const { data: employeesRaw, isLoading: loadingEmployees } = useEmployees({
    per_page: 1000,
    detailed: 0,
  });

  const typeOptions: Option[] = useMemo(() => {
    const list = unwrapList<Record<string, unknown>>(documentTypesRaw);
    return list
      .map((t) => ({
        value: String(t.id),
        label: String(t.name ?? "Untitled"),
      }))
      .filter((o) => o.value !== "undefined");
  }, [documentTypesRaw]);

  const folderSelectOptions: Option[] = useMemo(
    () =>
      folderOptions.map((f) => ({
        value: String(f.id),
        label: f.label || f.name,
      })),
    [folderOptions],
  );

  const employeeOptions: Option[] = useMemo(() => {
    const list = unwrapList<Record<string, unknown>>(employeesRaw);
    return list
      .map((e) => {
        const code = String(e.employee_code ?? "");
        const name = String(e.name ?? "");
        return {
          value: String(e.id),
          label: code && name ? `${name} (${code})` : name || `#${e.id}`,
        };
      })
      .filter((o) => o.value !== "undefined");
  }, [employeesRaw]);

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      folder_id: "",
      document_type_id: "",
      employee_id: "",
      expiry_date: "",
      description: "",
      access_level: "hr_only",
    },
  });

  useEffect(() => {
    if (open) {
      setFile(null);
      setTags([]);
      setTagInput("");
      setProgress(0);
      form.reset({
        title: "",
        folder_id: "",
        document_type_id: "",
        employee_id: "",
        expiry_date: "",
        description: "",
        access_level: "hr_only",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Dropzone ────────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      const suggested = f.name.replace(/\.[^/.]+$/, "");
      form.setValue("title", form.getValues("title") || suggested);
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  // ── Tags ────────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (t.length > 50) {
      toast.error("Tag too long (max 50).");
      return;
    }
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  // ── Mutation ────────────────────────────────────────────────────────────────
  const uploadMutation = useUploadDocument();

  const handleSubmit = async (values: UploadFormValues) => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    await uploadMutation.mutateAsync(
      {
        payload: {
          file,
          title: values.title || undefined,
          folder_id: values.folder_id ? Number(values.folder_id) : undefined,
          document_type_id: values.document_type_id
            ? Number(values.document_type_id)
            : undefined,
          employee_id: values.employee_id
            ? Number(values.employee_id)
            : undefined,
          expiry_date: values.expiry_date || undefined,
          description: values.description || undefined,
          access_level: (values.access_level as AccessLevel) || undefined,
          tags,
        },
        onProgress: setProgress,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const isPending = uploadMutation.isPending;

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
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file and attach metadata. Only system folders are shown in
            the folder list.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* File dropzone */}
            <div>
              <p className="mb-2 text-sm font-medium">File *</p>
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{file.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
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
                  <p className="font-medium">
                    Drag &amp; drop a file, or{" "}
                    <span className="text-primary underline">
                      click to browse
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX — up to 20 MB
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Employment Contract — Ahmed Raza"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Document type */}
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

              {/* Folder — system only */}
              <FormField
                control={form.control}
                name="folder_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1">
                      Folder
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" />
                        System only
                      </span>
                    </FormLabel>
                    <SearchableSelect
                      options={folderSelectOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select folder…"
                      searchPlaceholder="Search folders…"
                      groupLabel="System folders"
                      emptyText="No system folders available"
                      icon={FolderIcon}
                      allowAll={false}
                      isLoading={loadingFolders}
                      widthClass="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee */}
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Employee</FormLabel>
                    <SearchableSelect
                      options={employeeOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select employee…"
                      searchPlaceholder="Search by name or code…"
                      groupLabel="Employees"
                      emptyText="No employees found"
                      icon={User}
                      allowAll={false}
                      isLoading={loadingEmployees}
                      widthClass="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access level */}
              <FormField
                control={form.control}
                name="access_level"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Access level</FormLabel>
                    <SearchableSelect
                      options={ACCESS_LEVELS}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select access…"
                      searchPlaceholder="Search access levels…"
                      groupLabel="Access levels"
                      emptyText="No access levels"
                      icon={Building2}
                      allowAll={false}
                      widthClass="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expiry date */}
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-9"
                        min={new Date().toISOString().slice(0, 10)}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Must be a future date. Leave blank if it doesn&apos;t
                    expire.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Optional notes about this document…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  maxLength={50}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Progress */}
            {isPending && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !file}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
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