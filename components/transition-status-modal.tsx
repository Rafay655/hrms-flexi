"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTransitionDocument } from "@/hooks/use-dms-documents";
import type { TransitionStatus } from "@/services/dms-documents.service";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: TransitionStatus;
  label: string;
  badge: string;
  dot: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  {
    value: "under_review",
    label: "Under Review",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  {
    value: "approved",
    label: "Approved",
    badge: "bg-indigo-100 text-indigo-800",
    dot: "bg-indigo-500",
  },
  {
    value: "published",
    label: "Published",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  {
    value: "archived",
    label: "Archived",
    badge: "bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-400",
  },
];

const NOTE_MAX_LENGTH = 500;

interface TransitionStatusModalProps {
  documentUuid: string;
  documentTitle: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransitionStatusModal({
  documentUuid,
  documentTitle,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: TransitionStatusModalProps) {
  const [status, setStatus] = useState<TransitionStatus>("draft");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setStatus((currentStatus as TransitionStatus) || "draft");
      setNote("");
    }
  }, [open, currentStatus]);

  const mutation = useTransitionDocument(documentUuid);
  const isPending = mutation.isPending;

  const handleSubmit = async () => {
    if (status === currentStatus) {
      toast.error("Please choose a different status.");
      return;
    }

    await mutation.mutateAsync(
      { status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  const currentOption = STATUS_OPTIONS.find((s) => s.value === currentStatus);
  const nextOption = STATUS_OPTIONS.find((s) => s.value === status);
  const isUnchanged = status === currentStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription className="truncate">
            {documentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Transition preview */}
          <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/30 py-4">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                currentOption?.badge ?? "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${currentOption?.dot ?? "bg-muted-foreground"}`}
              />
              {currentStatus.replace(/_/g, " ")}
            </span>

            <ArrowRight
              className={`h-4 w-4 shrink-0 ${
                isUnchanged ? "text-muted-foreground/40" : "text-foreground"
              }`}
            />

            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize transition-opacity ${
                nextOption?.badge ?? "bg-muted text-muted-foreground"
              } ${isUnchanged ? "opacity-40" : ""}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${nextOption?.dot ?? "bg-muted-foreground"}`}
              />
              {nextOption?.label}
            </span>
          </div>

          {/* New status */}
          <div>
            <p className="mb-2 text-sm font-medium">New status *</p>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TransitionStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      {s.label}
                      {s.value === currentStatus && (
                        <span className="text-xs text-muted-foreground">
                          (current)
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUnchanged && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Select a different status to continue.
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Note</p>
              <span className="text-xs text-muted-foreground">
                {note.length}/{NOTE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Submitted for HR review after edit"
              maxLength={NOTE_MAX_LENGTH}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || isUnchanged}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Change status"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}