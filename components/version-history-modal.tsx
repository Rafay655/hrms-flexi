"use client";

import React from "react";
import { FileText, History, Loader2, User } from "lucide-react";

import { useDocumentVersions } from "@/hooks/use-dms-documents";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface VersionHistoryModalProps {
  documentUuid: string;
  documentTitle: string;
  currentVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(v: string) {
  return new Date(v).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function VersionHistoryModal({
  documentUuid,
  documentTitle,
  currentVersion,
  open,
  onOpenChange,
}: VersionHistoryModalProps) {
  const { data: versions = [], isLoading } = useDocumentVersions(
    documentUuid,
    open,
  );

  const list = Array.isArray(versions) ? versions : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription className="truncate">
                {documentTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <History className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No versions yet</p>
            <p className="text-sm text-muted-foreground">
              This document has no version history.
            </p>
          </div>
        ) : (
          <div className="relative mt-2 space-y-1">
            {list.map((v, i) => {
              const isCurrent = v.version === currentVersion;
              const isLast = i === list.length - 1;

              return (
                <div key={v.uuid} className="relative flex gap-4 pb-6">
                  {/* timeline line */}
                  {!isLast && (
                    <span className="absolute left-[15px] top-8 h-full w-px bg-border" />
                  )}

                  {/* timeline dot */}
                  <div
                    className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {v.version}
                  </div>

                  {/* content card */}
                  <div
                    className={`min-w-0 flex-1 rounded-lg border p-3 ${
                      isCurrent ? "border-primary/40 bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">
                          {v.original_name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isCurrent && (
                          <Badge className="text-[10px]">Current</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {v.file_size_human}
                        </span>
                      </div>
                    </div>

                    {v.change_note && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {v.change_note}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Uploaded by #{v.uploaded_by}
                      </span>
                      <span>{formatDate(v.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}