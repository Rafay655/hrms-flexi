"use client";

/**
 * app/(system)/dms/documents/_components/DocumentViewer.tsx
 * DMS — Document Viewer Panel
 *
 * Slide-in Sheet (right, 480 px) with two tabs:
 *   Details  — metadata grid, tags, description, verify section, request-signature
 *   Versions — version history timeline
 *
 * Props:
 *   uuid: string | null   — when null the Sheet is closed
 *   onClose: () => void   — called on Sheet close / after destructive actions
 *
 * Queries:
 *   ['dms', 'document', uuid]  → getDocument(uuid)
 *   ['dms', 'versions', uuid]  → getDocumentVersions(uuid) (lazy — only on Versions tab)
 *
 * Actions (Details tab):
 *   Download         → GET /documents/:uuid/download → anchor click
 *   Verify           → approve/reject + note (pending docs only)
 *   Request Signature → Dialog → POST /documents/:uuid/sign/request
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *   • Tabs use <TabsList> / <TabsTrigger> / <TabsContent> from shadcn
 *   • All form inputs labelled
 *   • AlertDialog for destructive confirm flows
 *   • aria-busy on submit buttons while pending
 */

import { showApiError } from "@/lib/error-toast";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  Info,
  Loader2,
  PenLine,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  downloadDocument,
  getDocument,
  getDocumentVersions,
  verifyDocument,
} from "@/services/dms.service";
import type { DmsDocument, DmsVersionHistory } from "@/types/dms";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import SignatureRequestModal from "./SignatureRequestModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type VerifyStatus = "verified" | "rejected";

export interface DocumentViewerProps {
  uuid: string | null;
  onClose: () => void;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META: Record<
  DmsDocument["verification_status"],
  { label: string; className: string }
> = {
  pending:  { label: "Pending",  className: "bg-amber-100 text-amber-700 border-amber-200" },
  verified: { label: "Verified", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-600 border-red-200" },
  expired:  { label: "Expired",  className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function VerificationBadge({
  status,
}: {
  status: DmsDocument["verification_status"];
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

// ── Meta row ──────────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </p>
      <p
        className={cn(
          "text-sm text-gray-700 truncate",
          mono && "font-mono text-xs",
          className,
        )}
      >
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  );
}

// ── Details tab ───────────────────────────────────────────────────────────────

interface DetailsTabProps {
  doc: DmsDocument;
}

function DetailsTab({ doc }: DetailsTabProps) {
  const queryClient = useQueryClient();
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("verified");
  const [verifyNote, setVerifyNote] = useState("");
  const [sigDialogOpen, setSigDialogOpen] = useState(false);

  const isPending = doc.verification_status === "pending";

  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyDocument(doc.uuid, verifyStatus, verifyNote.trim() || undefined),
    onSuccess: () => {
      toast.success(
        verifyStatus === "verified"
          ? "Document approved."
          : "Document rejected.",
      );
      queryClient.invalidateQueries({ queryKey: ["dms", "documents"] });
      queryClient.invalidateQueries({ queryKey: ["dms", "document", doc.uuid] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Verification failed." });
    },
  });

  const handleDownload = async () => {
    try {
      await downloadDocument(doc.uuid);
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Download failed." });
    }
  };

  return (
    <div className="space-y-5">
      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {doc.document_type && (
          <MetaRow label="Type" value={doc.document_type.name} />
        )}
        {doc.folder && (
          <MetaRow label="Folder" value={doc.folder.name} />
        )}
        <MetaRow label="File" value={doc.original_name} mono />
        <MetaRow label="Size" value={doc.file_size_human} />
        <MetaRow
          label="Version"
          value={`v${doc.version}`}
        />
        <MetaRow
          label="Uploaded"
          value={formatDistanceToNow(parseISO(doc.created_at), {
            addSuffix: true,
          })}
        />
        {doc.expiry_date && (
          <MetaRow
            label="Expiry"
            value={format(parseISO(doc.expiry_date), "d MMM yyyy")}
            className={doc.is_expired ? "text-red-600 font-medium" : undefined}
          />
        )}
        {doc.is_encrypted && (
          <MetaRow
            label="Encryption"
            value={
              <span className="text-green-700 font-medium">Encrypted</span>
            }
          />
        )}
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded border border-brand-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {doc.description && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Description
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {doc.description}
          </p>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="bg-brand-800 hover:bg-brand-700 text-white"
          onClick={handleDownload}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Download
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setSigDialogOpen(true)}
        >
          <PenLine className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Request Signature
        </Button>
      </div>

      {/* ── Verify section (pending only) ──────────────────────────────── */}
      {isPending && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verify this document
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="viewer-verify-status" className="text-sm font-medium text-gray-700">
              Decision *
            </Label>
            <Select
              value={verifyStatus}
              onValueChange={(v) => setVerifyStatus(v as VerifyStatus)}
            >
              <SelectTrigger id="viewer-verify-status" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Approve
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    Reject
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="viewer-verify-note" className="text-sm font-medium text-gray-700">
              Note{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="viewer-verify-note"
              placeholder={
                verifyStatus === "rejected"
                  ? "Reason for rejection…"
                  : "Add a verification note…"
              }
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              rows={2}
              className="bg-white resize-none"
            />
          </div>

          <Button
            className={cn(
              "w-full",
              verifyStatus === "verified"
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white",
            )}
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            aria-busy={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : verifyStatus === "verified" ? (
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {verifyMutation.isPending
              ? "Submitting…"
              : verifyStatus === "verified"
                ? "Approve document"
                : "Reject document"}
          </Button>
        </div>
      )}

      {/* Request Signature modal */}
      <SignatureRequestModal
        documentUuid={doc.uuid}
        open={sigDialogOpen}
        onOpenChange={setSigDialogOpen}
      />
    </div>
  );
}

// ── Versions tab ──────────────────────────────────────────────────────────────

interface VersionsTabProps {
  uuid: string;
}

function VersionsTab({ uuid }: VersionsTabProps) {
  const { data: versions = [], isLoading, isError } = useQuery({
    queryKey: ["dms", "versions", uuid],
    queryFn: () => getDocumentVersions(uuid),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="mt-1 h-5 w-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load version history.
      </p>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <History className="h-8 w-8 text-gray-200" aria-hidden="true" />
        <p className="text-sm text-gray-400">No version history yet.</p>
      </div>
    );
  }

  return (
    <ol
      className="relative border-l border-gray-200 space-y-0"
      aria-label="Version history"
    >
      {versions.map((v, idx) => (
        <VersionEntry key={v.uuid} version={v} isLatest={idx === 0} />
      ))}
    </ol>
  );
}

function VersionEntry({
  version,
  isLatest,
}: {
  version: DmsVersionHistory;
  isLatest: boolean;
}) {
  return (
    <li className="ml-4 pb-5 last:pb-0">
      {/* Timeline dot */}
      <span
        className={cn(
          "absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2",
          isLatest
            ? "border-brand-700 bg-brand-700"
            : "border-gray-300 bg-white",
        )}
        aria-hidden="true"
      />

      <div className="space-y-0.5">
        {/* Version number + latest chip */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            v{version.version}
          </span>
          {isLatest && (
            <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded border border-brand-200">
              Latest
            </span>
          )}
        </div>

        {/* Filename */}
        <p className="font-mono text-xs text-gray-500 truncate">
          {version.original_name}
        </p>

        {/* Change note */}
        {version.change_note && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {version.change_note}
          </p>
        )}

        {/* Date + uploader */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {format(parseISO(version.created_at), "d MMM yyyy, HH:mm")}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            User #{version.uploaded_by}
          </span>
          {version.file_size && (
            <span>
              {(version.file_size / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Document Viewer Sheet ─────────────────────────────────────────────────────

export default function DocumentViewer({ uuid, onClose }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Derived: reset to Details tab whenever a new document UUID is opened.
  // Uses the "bail-out during render" pattern (React docs §Storing information from prev renders).
  const [prevUuid, setPrevUuid] = useState(uuid);
  if (uuid !== prevUuid) {
    setPrevUuid(uuid);
    if (uuid) setActiveTab("details");
  }

  const {
    data: doc,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dms", "document", uuid],
    queryFn: () => getDocument(uuid!),
    enabled: !!uuid,
    staleTime: 30_000,
  });

  const isOpen = !!uuid;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-[480px] max-w-full flex flex-col p-0 gap-0"
        aria-label="Document viewer"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-gray-100 shrink-0 space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-36" />
            </>
          ) : doc ? (
            <>
              <SheetTitle className="text-base font-semibold text-gray-900 leading-snug pr-6">
                {doc.title}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge status={doc.verification_status} />
                {doc.document_type && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                    {doc.document_type.name}
                  </span>
                )}
                <span className="text-xs font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                  v{doc.version}
                </span>
                {doc.is_expired && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    Expired
                  </span>
                )}
              </div>
            </>
          ) : null}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isError && (
            <div className="flex flex-col items-center gap-3 py-12 px-6">
              <Info className="h-8 w-8 text-destructive" aria-hidden="true" />
              <p className="text-sm text-muted-foreground text-center">
                Failed to load document details.
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4 px-6 py-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}

          {doc && !isLoading && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col h-full"
            >
              {/* Tab bar */}
              <div className="border-b border-gray-100 px-6 pt-3 shrink-0">
                <TabsList variant="line" className="gap-4 p-0 h-9 w-full justify-start bg-transparent">
                  <TabsTrigger
                    value="details"
                    className="gap-1.5 px-0 pb-2 text-sm data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-brand-700 rounded-none"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="versions"
                    className="gap-1.5 px-0 pb-2 text-sm data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-brand-700 rounded-none"
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    Versions
                    {doc.version > 1 && (
                      <span className="ml-0.5 text-[10px] font-bold text-brand-700">
                        {doc.version}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Details tab */}
              <TabsContent value="details" className="px-6 py-5 flex-1">
                <DetailsTab doc={doc} />
              </TabsContent>

              {/* Versions tab — lazy; only mounts when tab is active */}
              <TabsContent value="versions" className="px-6 py-5 flex-1">
                {activeTab === "versions" && (
                  <VersionsTab uuid={doc.uuid} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer — Download shortcut (always visible when doc loaded) */}
        {doc && (
          <SheetFooter className="px-6 py-4 border-t border-gray-100 shrink-0">
            <Button
              className="flex-1 bg-brand-800 hover:bg-brand-700 text-white"
              onClick={async () => {
                try {
                  await downloadDocument(doc.uuid);
                } catch (apiFailure) {
                  showApiError(apiFailure, { fallbackMessage: "Download failed." });
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Download
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
