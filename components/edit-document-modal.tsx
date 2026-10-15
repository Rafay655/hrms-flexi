"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  CalendarIcon,
  FileText,
  Folder as FolderIcon,
  Loader2,
  Lock,
  Save,
} from "lucide-react";

import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useDmsFolderTree } from "@/hooks/use-dms-folder-tree";
import { useUpdateDocument } from "@/hooks/use-dms-documents";
import type { DmsDocument } from "@/services/dms-documents.service";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCESS_LEVELS: Option[] = [
  { value: "public", label: "Public" },
  { value: "hr_only", label: "HR Only" },
  { value: "employee_only", label: "Employee Only" },
  { value: "manager_team", label: "Manager Team" },
  { value: "finance_only", label: "Finance Only" },
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

const editSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  folder_id: z.string().optional(),
  document_type_id: z.string().optional(),
  expiry_date: z.string().optional(),
  description: z.string().max(2000).optional(),
  access_level: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditDocumentModalProps {
  document: DmsDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditDocumentModal({
  document: doc,
  open,
  onOpenChange,
}: EditDocumentModalProps) {
  const { data: documentTypesRaw, isLoading: loadingTypes } = useDocumentTypes({
    per_page: 100,
  });
  const { options: folderOptions, isLoading: loadingFolders } =
    useDmsFolderTree({ rootOnly: true });

  const typeOptions: Option[] = useMemo(
    () =>
      unwrapList<Record<string, unknown>>(documentTypesRaw)
        .map((t) => ({
          value: String(t.id),
          label: String(t.name ?? "Untitled"),
        }))
        .filter((o) => o.value !== "undefined"),
    [documentTypesRaw],
  );

  const folderSelectOptions: Option[] = useMemo(
    () =>
      folderOptions.map((f) => ({
        value: String(f.id),
        label: f.label || f.name,
      })),
    [folderOptions],
  );

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      folder_id: "",
      document_type_id: "",
      expiry_date: "",
      description: "",
      access_level: "hr_only",
    },
  });

  useEffect(() => {
    if (open && doc) {
      form.reset({
        title: doc.title ?? "",
        folder_id: doc.folder?.id ? String(doc.folder.id) : "",
        document_type_id: doc.document_type?.id
          ? String(doc.document_type.id)
          : "",
        expiry_date: doc.expiry_date ? doc.expiry_date.slice(0, 10) : "",
        description: doc.description ?? "",
        access_level: doc.access_level ?? "hr_only",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc]);

  const updateMutation = useUpdateDocument(doc.uuid);
  const isPending = updateMutation.isPending;

  const handleSubmit = async (values: EditValues) => {
    await updateMutation.mutateAsync(
      {
        title: values.title,
        folder_id: values.folder_id ? Number(values.folder_id) : null,
        document_type_id: values.document_type_id
          ? Number(values.document_type_id)
          : null,
        expiry_date: values.expiry_date || null,
        description: values.description || null,
        access_level: values.access_level as
          | "public"
          | "hr_only"
          | "employee_only"
          | "manager_team"
          | "finance_only",
      },
      { onSuccess: () => onOpenChange(false) },
    );
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
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update metadata for &ldquo;{doc.title}&rdquo;. Only system folders
            are shown.
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
                    <Input {...field} />
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
                      emptyText="No system folders"
                      icon={FolderIcon}
                      allowAll={false}
                      isLoading={loadingFolders}
                      widthClass="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Save changes
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