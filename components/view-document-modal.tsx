"use client";

import React from "react";
import {
  Calendar,
  Download,
  FileText,
  Folder as FolderIcon,
  Hash,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DmsDocument } from "@/services/dms-documents.service";

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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const VERIFICATION_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
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

interface ViewDocumentModalProps {
  document: DmsDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (doc: DmsDocument) => void;
  onDelete: (doc: DmsDocument) => void;
  isDeleting?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ViewDocumentModal({
  document: doc,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeleting,
}: ViewDocumentModalProps) {
  if (!doc) return null;

  const handleDownload = () => {
    // Adjust if your backend exposes a different download route
    window.open(`/api/dms/documents/${doc.uuid}/download`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="break-words text-lg">
                {doc.title}
              </DialogTitle>
              <DialogDescription className="break-all text-xs">
                {doc.original_name} · {doc.file_size_human} · v{doc.version}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    STATUS_STYLES[doc.status] ?? "",
                  )}
                >
                  {doc.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    VERIFICATION_STYLES[doc.verification_status] ?? "",
                  )}
                >
                  {doc.verification_status}
                </Badge>
                {doc.is_expired && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {doc.is_encrypted && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Metadata */}
        <div className="divide-y">
          <Row icon={<FileText className="h-3.5 w-3.5" />} label="MIME type">
            <span className="break-all text-xs">{doc.mime_type}</span>
          </Row>
          <Row
            icon={<FolderIcon className="h-3.5 w-3.5" />}
            label="Folder"
          >
            {doc.folder?.name ?? "—"}
          </Row>
          <Row
            icon={<FileText className="h-3.5 w-3.5" />}
            label="Document type"
          >
            {doc.document_type?.name ?? "—"}
          </Row>
          <Row icon={<User className="h-3.5 w-3.5" />} label="Employee">
            {doc.employee_id ? `#${doc.employee_id}` : "—"}
          </Row>
          <Row icon={<Shield className="h-3.5 w-3.5" />} label="Access level">
            <span className="capitalize">
              {doc.access_level.replace(/_/g, " ")}
            </span>
          </Row>
          <Row
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Expiry date"
          >
            {doc.expiry_date ?? "—"}
          </Row>
          <Row icon={<Hash className="h-3.5 w-3.5" />} label="Uploaded by">
            #{doc.uploaded_by}
          </Row>
          <Row label="Created">{formatDate(doc.created_at)}</Row>
          <Row label="Updated">{formatDate(doc.updated_at)}</Row>
          {doc.description && (
            <Row label="Description">
              <span className="text-xs font-normal">{doc.description}</span>
            </Row>
          )}
          <Row label="Tags">
            {doc.tags.length === 0 ? (
              "—"
            ) : (
              <span className="flex flex-wrap justify-end gap-1">
                {doc.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </span>
            )}
          </Row>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEdit(doc);
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
              onDelete(doc);
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