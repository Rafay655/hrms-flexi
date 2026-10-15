"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText, History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  useDocumentVersions,
  useRollbackDocumentVersion,
} from "@/hooks/use-dms-documents";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";

interface RollbackVersionModalProps {
  documentUuid: string;
  documentTitle: string;
  currentVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function formatDate(v: string) {
  return new Date(v).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RollbackVersionModal({
  documentUuid,
  documentTitle,
  currentVersion,
  open,
  onOpenChange,
  onSuccess,
}: RollbackVersionModalProps) {
  const { data: versions = [], isLoading } = useDocumentVersions(
    documentUuid,
    open,
  );

  const list = useMemo(
    () => (Array.isArray(versions) ? versions : []),
    [versions],
  );

  // Only allow rolling back to versions OTHER than the current one
  const rollbackCandidates = useMemo(
    () =>
      list
        .filter((v) => v.version !== currentVersion)
        .sort((a, b) => b.version - a.version),
    [list, currentVersion],
  );

  const [selectedVersion, setSelectedVersion] = useState<string>("");

  useEffect(() => {
    if (open) setSelectedVersion("");
  }, [open]);

  const mutation = useRollbackDocumentVersion(documentUuid);
  const isPending = mutation.isPending;

  const selected = rollbackCandidates.find(
    (v) => String(v.version) === selectedVersion,
  );

  const handleSubmit = async () => {
    if (!selectedVersion) {
      toast.error("Please select a version to roll back to.");
      return;
    }

    await mutation.mutateAsync(
      { version: Number(selectedVersion) },
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Rollback Version</DialogTitle>
              <DialogDescription className="break-all">
                {documentTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {currentVersion != null && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Current version</span>
              <Badge variant="default">v{currentVersion}</Badge>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rollbackCandidates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No versions to roll back to</p>
              <p className="text-sm text-muted-foreground">
                Upload a new version first to create history.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">
                  Roll back to version *
                </p>
                <Select
                  value={selectedVersion}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version…" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {rollbackCandidates.map((v) => (
                      <SelectItem key={v.uuid} value={String(v.version)}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">v{v.version}</span>
                          <span className="text-xs text-muted-foreground">
                            · {v.file_size_human}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">
                      {selected.original_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Size</span>
                    <span>{selected.file_size_human}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Uploaded by</span>
                    <span>#{selected.uploaded_by}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Date</span>
                    <span>{formatDate(selected.created_at)}</span>
                  </div>
                  {selected.change_note && (
                    <div className="border-t pt-2 text-muted-foreground">
                      <p className="mb-1 font-medium text-foreground">
                        Change note
                      </p>
                      <p className="break-words">{selected.change_note}</p>
                    </div>
                  )}
                </div>
              )}
            </>
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
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !selectedVersion ||
                rollbackCandidates.length === 0
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rolling back…
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Rollback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}