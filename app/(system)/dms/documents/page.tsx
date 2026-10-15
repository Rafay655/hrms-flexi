"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FileUp,
  Folder as FolderIcon,
  GitBranch,
  History,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useDeleteDocument,
  useDownloadDocument,
  useDmsDocuments,
} from "@/hooks/use-dms-documents";
import type {
  DmsDocument,
  DocumentStatus,
} from "@/services/dms-documents.service";

import { UploadDocumentModal } from "@/components/upload-document-modal";
import { EditDocumentModal } from "@/components/edit-document-modal";
import { ViewDocumentModal } from "@/components/view-document-modal";
import { UploadVersionModal } from "@/components/upload-version-modal";
import { VersionHistoryModal } from "@/components/version-history-modal";
import { TransitionStatusModal } from "@/components/transition-status-modal";
import { VerifyDocumentModal } from "@/components/verify-document-modal";
import { RollbackVersionModal } from "@/components/rollback-version-modal";
import { ShareDocumentModal } from "@/components/share-document-modal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(v: string) {
  return new Date(v).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  // Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DmsDocument | null>(null);
  const [editDoc, setEditDoc] = useState<DmsDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DmsDocument | null>(null);

  // Version + lifecycle modal targets
  const [versionUploadDoc, setVersionUploadDoc] = useState<DmsDocument | null>(
    null,
  );
  const [versionHistoryDoc, setVersionHistoryDoc] =
    useState<DmsDocument | null>(null);
  const [transitionDoc, setTransitionDoc] = useState<DmsDocument | null>(null);
  const [verifyDoc, setVerifyDoc] = useState<DmsDocument | null>(null);
  const [rollbackDoc, setRollbackDoc] = useState<DmsDocument | null>(null);
  const [shareDoc, setShareDoc] = useState<DmsDocument | null>(null);

  const {
    data: documents = [],
    isLoading,
    isFetching,
    refetch,
  } = useDmsDocuments({
    search: search || undefined,
    status: status === "all" ? undefined : (status as DocumentStatus),
  });

  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const list: DmsDocument[] = useMemo(
    () => (Array.isArray(documents) ? documents : []),
    [documents],
  );

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    await deleteMutation.mutateAsync(deleteDoc.uuid, {
      onSuccess: () => setDeleteDoc(null),
    });
  };

  const handleDownload = (doc: DmsDocument) => {
    downloadMutation.mutate({
      uuid: doc.uuid,
      filename: doc.original_name || doc.title || "document",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="border shadow-sm">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-semibold">
                Documents
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse, upload and manage company documents
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
                />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload document
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="w-12 px-4 py-3">SR</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Folder</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="w-12 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading documents…
                        </p>
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-medium">No documents found</p>
                        <p className="text-sm text-muted-foreground">
                          {search
                            ? "Try a different search term."
                            : "Upload your first document to get started."}
                        </p>
                        {!search && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => setIsUploadOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Upload document
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    list.map((doc, idx) => {
                      const isVerified =
                        doc.verification_status === "verified";
                      const isDownloading = downloadMutation.isDownloading(
                        doc.uuid,
                      );

                      return (
                        <tr
                          key={doc.uuid}
                          className="cursor-pointer text-sm transition-colors hover:bg-muted/30"
                          onClick={() => setViewDoc(doc)}
                        >
                         <td className="px-4 py-3 font-medium text-muted-foreground">
        {idx + 1}
      </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {doc.title}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {doc.original_name}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3 text-muted-foreground">
                            {doc.document_type?.name ?? "—"}
                          </td>

                          {/* Folder */}
                          <td className="px-4 py-3">
                            {doc.folder ? (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <FolderIcon className="h-3.5 w-3.5" />
                                {doc.folder.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Tags */}
                          <td className="px-4 py-3">
                            {doc.tags.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.slice(0, 2).map((t) => (
                                  <Badge
                                    key={t}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t}
                                  </Badge>
                                ))}
                                {doc.tags.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{doc.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Size */}
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {doc.file_size_human}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <StatusBadge status={doc.status} />
                          </td>

                          {/* Created */}
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </td>

                          {/* Actions — 3-dot dropdown */}
                          <td
                            className="px-4 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 bg-white"
                              >
                                <DropdownMenuItem
                                  onClick={() => setViewDoc(doc)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => setEditDoc(doc)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleDownload(doc)}
                                  disabled={isDownloading}
                                >
                                  {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                  )}
                                  {isDownloading
                                    ? "Downloading…"
                                    : "Download"}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => setVersionUploadDoc(doc)}
                                >
                                  <FileUp className="mr-2 h-4 w-4" />
                                  Upload New Version
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => setVersionHistoryDoc(doc)}
                                >
                                  <History className="mr-2 h-4 w-4" />
                                  Version History
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => setRollbackDoc(doc)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Rollback Version
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => setShareDoc(doc)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Not verified → Verify; verified → Change Status */}
                                {!isVerified ? (
                                  <DropdownMenuItem
                                    onClick={() => setVerifyDoc(doc)}
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Verify
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setTransitionDoc(doc)}
                                  >
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Change Status
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => setDeleteDoc(doc)}
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer count */}
          {!isLoading && list.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {list.length} document{list.length !== 1 ? "s" : ""}
              </span>
              {isFetching && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing…
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      <UploadDocumentModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />

      <ViewDocumentModal
        document={viewDoc}
        open={!!viewDoc}
        onOpenChange={(o) => !o && setViewDoc(null)}
        onEdit={(d) => setEditDoc(d)}
        onDelete={(d) => setDeleteDoc(d)}
        isDeleting={deleteMutation.isPending}
      />

      {editDoc && (
        <EditDocumentModal
          document={editDoc}
          open={!!editDoc}
          onOpenChange={(o) => !o && setEditDoc(null)}
        />
      )}

      {versionUploadDoc && (
        <UploadVersionModal
          documentUuid={versionUploadDoc.uuid}
          documentTitle={versionUploadDoc.title}
          open={!!versionUploadDoc}
          onOpenChange={(o) => !o && setVersionUploadDoc(null)}
          onSuccess={refetch}
        />
      )}

      {versionHistoryDoc && (
        <VersionHistoryModal
          documentUuid={versionHistoryDoc.uuid}
          documentTitle={versionHistoryDoc.title}
          currentVersion={versionHistoryDoc.version}
          open={!!versionHistoryDoc}
          onOpenChange={(o) => !o && setVersionHistoryDoc(null)}
        />
      )}

      {rollbackDoc && (
        <RollbackVersionModal
          documentUuid={rollbackDoc.uuid}
          documentTitle={rollbackDoc.title}
          currentVersion={rollbackDoc.version}
          open={!!rollbackDoc}
          onOpenChange={(o) => !o && setRollbackDoc(null)}
          onSuccess={refetch}
        />
      )}

      {shareDoc && (
        <ShareDocumentModal
          documentUuid={shareDoc.uuid}
          documentTitle={shareDoc.title}
          open={!!shareDoc}
          onOpenChange={(o) => !o && setShareDoc(null)}
          onSuccess={refetch}
        />
      )}

      {transitionDoc && (
        <TransitionStatusModal
          documentUuid={transitionDoc.uuid}
          documentTitle={transitionDoc.title}
          currentStatus={transitionDoc.status}
          open={!!transitionDoc}
          onOpenChange={(o) => !o && setTransitionDoc(null)}
          onSuccess={refetch}
        />
      )}

      {verifyDoc && (
        <VerifyDocumentModal
          documentUuid={verifyDoc.uuid}
          documentTitle={verifyDoc.title}
          open={!!verifyDoc}
          onOpenChange={(o) => !o && setVerifyDoc(null)}
          onSuccess={refetch}
        />
      )}

      <AlertDialog
        open={!!deleteDoc}
        onOpenChange={(o) => !o && setDeleteDoc(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteDoc?.title}&rdquo;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}