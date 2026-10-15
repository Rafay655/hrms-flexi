"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { File as FileIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useUploadDocumentVersion } from "@/hooks/use-dms-documents";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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

interface UploadVersionModalProps {
  documentUuid: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadVersionModal({
  documentUuid,
  documentTitle,
  open,
  onOpenChange,
  onSuccess,
}: UploadVersionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setFile(null);
      setChangeNote("");
      setProgress(0);
    }
  }, [open]);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const mutation = useUploadDocumentVersion(documentUuid);
  const isPending = mutation.isPending;

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    await mutation.mutateAsync(
      {
        file,
        changeNote: changeNote.trim() || undefined,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
          <DialogDescription className="break-all">
            For &ldquo;{documentTitle}&rdquo;. A new version will be created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* File */}
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
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop a file, or{" "}
                  <span className="text-primary underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX — up to 20 MB
                </p>
              </div>
            )}
          </div>

          {/* Change note */}
          <div>
            <p className="mb-2 text-sm font-medium">Change note</p>
            <Textarea
              rows={3}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Updated salary schedule — revision B"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional but recommended so reviewers know what changed.
            </p>
          </div>

          {isPending && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !file}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload version
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}