"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  Search,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Announcement } from "@/types/announcements";
import {
  useAnnouncements,
  usePublishAnnouncement,
  useDeleteAnnouncement,
} from "@/hooks/useAnnouncements";

// Import extracted components
import { AnnouncementRow } from "./components/AnnouncementRow";
import { AnnouncementModal } from "./components/AnnouncementModal";
import { ViewAnnouncementDialog } from "./components/ViewAnnouncementDialog";
import { PublishConfirmDialog } from "./components/PublishConfirmDialog";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ── TablePagination ──────────────────────────────────────────────────────────

interface TablePaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

function getPageWindow(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

const PageIconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
);

const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pageWindow = useMemo(() => getPageWindow(page, lastPage), [page, lastPage]);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> announcements
      </p>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <PageIconButton onClick={() => onPageChange(1)} disabled={page <= 1} label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>

          <div className="mx-1 flex items-center gap-1">
            {pageWindow.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "h-8 min-w-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    p === page ? "bg-[#1E1B4B] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <PageIconButton onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} label="Next page">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(lastPage)} disabled={page >= lastPage} label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
        </div>
      )}
    </div>
  );
};

// ── Page Component ─────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const router = useRouter();
  const permissions = useSelector((state: RootState) => state.auth.permissions);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [publishTarget, setPublishTarget] = useState<Announcement | null>(null);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);

  const hasPermission = permissions.includes("manage-announcements");

  useEffect(() => {
    if (!hasPermission) {
      toast.error("You don't have permission to manage announcements.");
      router.replace("/flexi-hq");
    }
  }, [hasPermission, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const { data, isLoading } = useAnnouncements(page, debouncedSearch, perPage);
  const announcements = data?.data ?? [];
  const meta = data?.meta;

  const { mutateAsync: publishAsync } = usePublishAnnouncement();
  const { mutate: archiveMutate, isPending: isArchiving, variables: archivingUuid } = useDeleteAnnouncement();

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (ann: Announcement) => { setEditTarget(ann); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handlePublishConfirm = () => {
    if (!publishTarget) return;
    const { uuid, title } = publishTarget;
    setPublishTarget(null);
    toast.promise(publishAsync(uuid), {
      loading: `Publishing "${title}"…`,
      success: `"${title}" has been published.`,
      error: "Failed to publish. Please try again.",
    });
  };

  const hasSearch = !!debouncedSearch;

  if (!hasPermission) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B]">Announcements</h1>
            <p className="mt-1 text-sm text-slate-500">
              Broadcast messages to employees across selected channels.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 self-start bg-[#1E1B4B] text-white shadow-sm hover:bg-[#2d2a6e] sm:self-auto"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Announcement
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search announcements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-slate-200 pl-9"
            />
          </div>

          <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
            <SelectTrigger className="h-9 w-[112px] rounded-xl border-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={hasSearch ? Filter : Megaphone}
              title={hasSearch ? "No announcements match your search" : "No announcements found"}
              description={
                hasSearch
                  ? "Try a different search term."
                  : "Create your first announcement to broadcast to your team."
              }
              buttonLabel={hasSearch ? "Clear search" : "New Announcement"}
              onAction={hasSearch ? () => setSearch("") : openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Announcement</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Importance</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Target</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Read Rate</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Published</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {announcements.map((ann, index) => {
                    const serial = ((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? perPage) + index + 1;
                    return (
                      <AnnouncementRow
                        key={ann.uuid}
                        serial={serial}
                        announcement={ann}
                        onEdit={() => openEdit(ann)}
                        onPublish={() => setPublishTarget(ann)}
                        onArchive={() => archiveMutate(ann.uuid)}
                        onView={() => setViewTarget(ann)}
                        isArchiving={isArchiving && archivingUuid === ann.uuid}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && announcements.length > 0 && meta && (
            <TablePagination
              page={meta.current_page ?? page}
              lastPage={meta.last_page ?? 1}
              total={meta.total ?? announcements.length}
              perPage={meta.per_page ?? perPage}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnnouncementModal
        open={modalOpen}
        editTarget={editTarget}
        onClose={closeModal}
        onSaved={closeModal}
      />

      {/* Publish Confirmation */}
      <PublishConfirmDialog
        target={publishTarget}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublishConfirm}
      />

      {/* View Dialog */}
      <ViewAnnouncementDialog
        announcement={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </TooltipProvider>
  );
}