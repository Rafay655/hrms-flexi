"use client";

import React, { useMemo, useState } from "react";
import {
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  ShieldAlert,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useComplianceRequirements,
  useDeleteComplianceRequirement,
} from "@/hooks/use-compliance-requirements";
import type {
  ComplianceFrequency,
  ComplianceRequirement,
} from "@/services/compliance-requirements.service";

import { CreateEditRequirementModal } from "@/components/create-edit-requirement-modal";
import { ViewRequirementModal } from "@/components/view-requirement-modal";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  annual: "Annual",
  half_yearly: "Half-Yearly",
  quarterly: "Quarterly",
  monthly: "Monthly",
  weekly: "Weekly",
  ad_hoc: "Ad-hoc",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ComplianceRequirementsPage() {
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editReq, setEditReq] = useState<ComplianceRequirement | null>(null);
  const [viewReq, setViewReq] = useState<ComplianceRequirement | null>(null);
  const [deleteReq, setDeleteReq] = useState<ComplianceRequirement | null>(
    null,
  );

  const {
    data: requirements = [],
    isLoading,
    isFetching,
    refetch,
  } = useComplianceRequirements({
    search: search || undefined,
    frequency:
      frequency === "all" ? undefined : (frequency as ComplianceFrequency),
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
  });

  const deleteMutation = useDeleteComplianceRequirement();

  const list: ComplianceRequirement[] = useMemo(
    () => (Array.isArray(requirements) ? requirements : []),
    [requirements],
  );

  const confirmDelete = async () => {
    if (!deleteReq) return;
    await deleteMutation.mutateAsync(deleteReq.uuid, {
      onSuccess: () => setDeleteReq(null),
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
                Compliance Requirements
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Define rules that employees must follow for documents on file
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
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New requirement
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
                placeholder="Search requirements…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All frequencies</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="half_yearly">Half-Yearly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Document type</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Reminder</th>
                    <th className="px-4 py-3">Mandatory</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="w-12 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading requirements…
                        </p>
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-medium">
                          No compliance requirements found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {search
                            ? "Try a different search term."
                            : "Create your first requirement to get started."}
                        </p>
                        {!search && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => setIsCreateOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New requirement
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    list.map((r, idx) => (
                      <tr
                        key={r.uuid}
                        className="cursor-pointer text-sm transition-colors hover:bg-muted/30"
                        onClick={() => setViewReq(r)}
                      >
                        {/* SR */}
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          {idx + 1}
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {r.title}
                            </span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="line-clamp-2 max-w-[320px] text-xs">
                            {r.description || "—"}
                          </span>
                        </td>

                        {/* Document type */}
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.document_type?.name ?? "—"}
                        </td>

                        {/* Frequency */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Repeat className="h-3.5 w-3.5" />
                            {FREQ_LABEL[r.frequency] ?? r.frequency}
                          </span>
                        </td>

                        {/* Reminder */}
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {r.reminder_days_before} day
                          {r.reminder_days_before !== 1 ? "s" : ""}
                        </td>

                        {/* Mandatory */}
                        <td className="px-4 py-3">
                          {r.is_mandatory ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-700 border-red-200"
                            >
                              Mandatory
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-zinc-100 text-zinc-600 border-zinc-200"
                            >
                              Optional
                            </Badge>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              r.is_active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200",
                            )}
                          >
                            {r.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Actions */}
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
                              className="w-52 bg-white"
                            >
                              <DropdownMenuItem
                                onClick={() => setViewReq(r)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setEditReq(r)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setDeleteReq(r)}
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer count */}
          {!isLoading && list.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {list.length} requirement{list.length !== 1 ? "s" : ""}
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

      <CreateEditRequirementModal
        requirement={null}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refetch}
      />

      {editReq && (
        <CreateEditRequirementModal
          requirement={editReq}
          open={!!editReq}
          onOpenChange={(o) => !o && setEditReq(null)}
          onSuccess={refetch}
        />
      )}

      <ViewRequirementModal
        requirement={viewReq}
        open={!!viewReq}
        onOpenChange={(o) => !o && setViewReq(null)}
        onEdit={(r) => setEditReq(r)}
        onDelete={(r) => setDeleteReq(r)}
        isDeleting={deleteMutation.isPending}
      />

      <AlertDialog
        open={!!deleteReq}
        onOpenChange={(o) => !o && setDeleteReq(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this compliance requirement?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteReq?.title}&rdquo;.
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