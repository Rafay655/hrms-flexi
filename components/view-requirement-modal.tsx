"use client";

import React from "react";
import {
  Calendar,
  FileText,
  Loader2,
  Pencil,
  Repeat,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ComplianceRequirement } from "@/services/compliance-requirements.service";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  annual: "Annual",
  half_yearly: "Half-Yearly",
  quarterly: "Quarterly",
  monthly: "Monthly",
  weekly: "Weekly",
  ad_hoc: "Ad-hoc",
};

function formatDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Row({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="max-w-[60%] break-words text-right font-medium">
        {children}
      </span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  requirement: ComplianceRequirement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (r: ComplianceRequirement) => void;
  onDelete: (r: ComplianceRequirement) => void;
  isDeleting?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ViewRequirementModal({
  requirement,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeleting,
}: Props) {
  if (!requirement) return null;

  const r = requirement;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="break-words text-lg">
                {r.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Created {formatDate(r.created_at)}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    r.is_active
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200",
                  )}
                >
                  {r.is_active ? "Active" : "Inactive"}
                </Badge>
                {r.is_mandatory && (
                  <Badge
                    variant="outline"
                    className="bg-red-100 text-red-700 border-red-200"
                  >
                    Mandatory
                  </Badge>
                )}
                <Badge variant="outline">
                  {FREQ_LABEL[r.frequency] ?? r.frequency}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="divide-y">
          <Row icon={<FileText className="h-3.5 w-3.5" />} label="Document type">
            {r.document_type?.name ?? "—"}
          </Row>
          <Row icon={<Repeat className="h-3.5 w-3.5" />} label="Frequency">
            {FREQ_LABEL[r.frequency] ?? r.frequency}
          </Row>
          <Row
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Reminder (days before)"
          >
            {r.reminder_days_before}
          </Row>
          <Row label="Mandatory">
            {r.is_mandatory ? "Yes" : "No"}
          </Row>
          <Row label="Status">
            {r.is_active ? "Active" : "Inactive"}
          </Row>
          {r.description && (
            <Row label="Description">
              <span className="text-xs font-normal">{r.description}</span>
            </Row>
          )}
          <Row label="Created">{formatDate(r.created_at)}</Row>
          <Row label="Updated">{formatDate(r.updated_at)}</Row>
        </div>

        <Separator />

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEdit(r);
            }}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(r);
            }}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}