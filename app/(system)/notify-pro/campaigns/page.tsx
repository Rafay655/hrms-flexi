"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Plus,
  Megaphone,
  MoreHorizontal,
  Archive,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Copy,
  PlayCircle,
  PauseCircle,
  Search,
  Inbox,
  Filter,
  Zap,
  Square,
  LayoutTemplate,
  GalleryHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import type { Campaign } from "@/types/campaigns";
import {
  useCampaigns,
  usePublishCampaign,
  useUnpublishCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
} from "@/hooks/useCampaigns";
import { CAMPAIGN_TYPES } from "@/constants/campaigns";

// Import modal components
import {
  CampaignModal,
  ViewCampaignDialog,
  ConfirmActionDialog,
} from "./components/CampaignModals";

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const CAMPAIGN_TYPE_ICONS: Record<string, React.ElementType> = {
  splash_banner: Zap,
  popup_modal: Square,
  home_banner: LayoutTemplate,
  carousel: GalleryHorizontal,
};

const CAMPAIGN_TYPE_STYLES: Record<string, string> = {
  splash_banner: "bg-amber-50 text-amber-700 border-amber-200",
  popup_modal: "bg-violet-50 text-violet-700 border-violet-200",
  home_banner: "bg-blue-50 text-blue-700 border-blue-200",
  carousel: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function getTypeMeta(type: string) {
  return {
    label: CAMPAIGN_TYPES.find((t) => t.value === type)?.label ?? type,
    icon: CAMPAIGN_TYPE_ICONS[type] ?? Megaphone,
    className: CAMPAIGN_TYPE_STYLES[type] ?? "bg-slate-50 text-slate-600 border-slate-200",
  };
}

// ── CampaignRow ───────────────────────────────────────────────────────────────

interface CampaignRowProps {
  serial: number;
  campaign: Campaign;
  onEdit: () => void;
  onView: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const CampaignRow: React.FC<CampaignRowProps> = ({
  serial,
  campaign,
  onEdit,
  onView,
  onPublish,
  onUnpublish,
  onDuplicate,
  onDelete,
}) => {
  const typeMeta = getTypeMeta(campaign.type);
  const TypeIcon = typeMeta.icon;

  const statusDot = campaign.is_draft
    ? "bg-slate-300"
    : campaign.is_active
    ? "bg-emerald-500"
    : "bg-slate-300";
  const statusLabel = campaign.is_draft ? "Draft" : campaign.is_active ? "Active" : "Inactive";
  const statusTextClass = campaign.is_draft
    ? "text-slate-500"
    : campaign.is_active
    ? "text-emerald-700"
    : "text-slate-400";

  return (
    <tr className="group transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-3.5 text-xs text-slate-400">{serial}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              typeMeta.className
            )}
          >
            <TypeIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {campaign.title || "No title"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {campaign.description || "No description"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <Badge className={cn("border text-xs font-medium", typeMeta.className)}>
          {typeMeta.label}
        </Badge>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", statusTextClass)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
        {format(new Date(campaign.start_at), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
        {format(new Date(campaign.end_at), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 opacity-0 transition-opacity hover:text-slate-700 group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for "${campaign.title || campaign.type}"`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </DropdownMenuItem>
            {campaign.is_draft && (
              <>
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPublish} className="gap-2">
                  <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Publish
                </DropdownMenuItem>
              </>
            )}
            {!campaign.is_draft && campaign.is_active && (
              <DropdownMenuItem onClick={onUnpublish} className="gap-2">
                <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Unpublish
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-rose-600 focus:text-rose-700"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

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
        <span className="font-medium text-slate-700">{total}</span> campaigns
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

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => (
  <div aria-label="Loading campaigns" className="divide-y divide-slate-50">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-4 w-28 rounded bg-slate-100" />
        <div className="h-8 w-8 rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onNew: () => void; hasSearch: boolean }> = ({ onNew, hasSearch }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
      {hasSearch ? (
        <Filter className="h-8 w-8 text-slate-400" aria-hidden="true" />
      ) : (
        <Megaphone className="h-8 w-8 text-slate-400" aria-hidden="true" />
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-700">
        {hasSearch ? "No campaigns match your search" : "No campaigns found"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {hasSearch ? "Try a different search term." : "Create your first campaign to engage your team."}
      </p>
    </div>
    {!hasSearch && (
      <Button onClick={onNew} className="mt-2 gap-2 bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
        <Plus className="h-4 w-4" aria-hidden="true" />
        New Campaign
      </Button>
    )}
  </div>
);

// ── Page Component ─────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter();
  const permissions = useSelector((state: RootState) => state.auth.permissions);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUuid, setEditUuid] = useState<string | null>(null);
  const [viewUuid, setViewUuid] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "unpublish" | "delete" | "duplicate";
    campaign: Campaign;
  } | null>(null);

  const hasPermission = permissions.includes("manage-campaigns");

  useEffect(() => {
    if (!hasPermission) {
      toast.error("You don't have permission to manage campaigns.");
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

  const { data, isLoading } = useCampaigns(page, debouncedSearch, perPage);
  const campaigns = data?.data ?? [];
  const meta = data?.meta;

  const { mutateAsync: publishAsync } = usePublishCampaign();
  const { mutateAsync: unpublishAsync } = useUnpublishCampaign();
  const { mutateAsync: deleteAsync } = useDeleteCampaign();
  const { mutateAsync: duplicateAsync } = useDuplicateCampaign();

  const openCreate = () => {
    setEditUuid(null);
    setModalOpen(true);
  };
  const openEdit = (uuid: string) => {
    setEditUuid(uuid);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditUuid(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, campaign } = confirmAction;
    setConfirmAction(null);

    try {
      switch (type) {
        case "publish":
          await toast.promise(publishAsync(campaign.uuid), {
            loading: `Publishing "${campaign.title || campaign.type}"…`,
            success: "Campaign published.",
            error: "Failed to publish.",
          });
          break;
        case "unpublish":
          await toast.promise(unpublishAsync(campaign.uuid), {
            loading: `Unpublishing "${campaign.title || campaign.type}"…`,
            success: "Campaign unpublished.",
            error: "Failed to unpublish.",
          });
          break;
        case "delete":
          await toast.promise(deleteAsync(campaign.uuid), {
            loading: `Deleting "${campaign.title || campaign.type}"…`,
            success: "Campaign deleted.",
            error: "Failed to delete.",
          });
          break;
        case "duplicate":
          await toast.promise(duplicateAsync(campaign.uuid), {
            loading: `Duplicating "${campaign.title || campaign.type}"…`,
            success: "Campaign duplicated.",
            error: "Failed to duplicate.",
          });
          break;
      }
    } catch {
    
    }
  };

  if (!hasPermission) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B]">Campaigns</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage banners, popups, and carousel campaigns.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 self-start bg-[#1E1B4B] text-white shadow-sm hover:bg-[#2d2a6e] sm:self-auto"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Campaign
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search campaigns…"
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
            <LoadingSkeleton />
          ) : campaigns.length === 0 ? (
            <EmptyState onNew={openCreate} hasSearch={!!debouncedSearch} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((campaign, index) => {
                    const serial =
                      ((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? perPage) + index + 1;
                    return (
                      <CampaignRow
                        key={campaign.uuid}
                        serial={serial}
                        campaign={campaign}
                        onEdit={() => openEdit(campaign.uuid)}
                        onView={() => setViewUuid(campaign.uuid)}
                        onPublish={() => setConfirmAction({ type: "publish", campaign })}
                        onUnpublish={() => setConfirmAction({ type: "unpublish", campaign })}
                        onDuplicate={() => setConfirmAction({ type: "duplicate", campaign })}
                        onDelete={() => setConfirmAction({ type: "delete", campaign })}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && campaigns.length > 0 && meta && (
            <TablePagination
              page={meta.current_page ?? page}
              lastPage={meta.last_page ?? 1}
              total={meta.total ?? campaigns.length}
              perPage={meta.per_page ?? perPage}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CampaignModal
        open={modalOpen}
        editUuid={editUuid}
        onClose={closeModal}
        onSaved={closeModal}
      />

      {/* View Dialog */}
      <ViewCampaignDialog uuid={viewUuid} onClose={() => setViewUuid(null)} />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </TooltipProvider>
  );
}