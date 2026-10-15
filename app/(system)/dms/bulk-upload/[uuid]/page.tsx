"use client";

/**
 * app/(system)/dms/bulk-upload/[uuid]/page.tsx
 * DMS — Bulk Batch Detail & Progress
 *
 * Polls GET /v1/dms/bulk-batches/:uuid every 3 s until status is
 * 'completed' or 'failed'.  Shows a progress bar, per-item status table,
 * and a Retry button for failed batches.
 */

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getBulkBatch, processBulkBatch, retryBulkBatch } from "@/services/dms.service";
import type { DmsBulkBatch, DmsBulkBatchItem } from "@/types/dms";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Status helpers ────────────────────────────────────────────────────────────

const BATCH_STATUS_MAP: Record<
  DmsBulkBatch["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  created:    { label: "Created",    variant: "outline",     icon: <Clock className="h-3.5 w-3.5" /> },
  uploading:  { label: "Uploading",  variant: "secondary",   icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  processing: { label: "Processing", variant: "secondary",   icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  completed:  { label: "Completed",  variant: "default",     icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  failed:     { label: "Failed",     variant: "destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const ITEM_STATUS_MAP: Record<
  DmsBulkBatchItem["status"],
  { label: string; className: string }
> = {
  pending:  { label: "Pending",  className: "text-muted-foreground" },
  matched:  { label: "Matched",  className: "text-blue-600 dark:text-blue-400" },
  uploaded: { label: "Uploaded", className: "text-green-600 dark:text-green-400" },
  failed:   { label: "Failed",   className: "text-destructive" },
};

function BatchStatusBadge({ status }: { status: DmsBulkBatch["status"] }) {
  const cfg = BATCH_STATUS_MAP[status];
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1.5">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function progressFromBatch(batch: DmsBulkBatch): number {
  if (batch.total_files === 0) return 0;
  if (batch.status === "completed") return 100;
  return Math.round(
    ((batch.processed_count + batch.failed_count) / batch.total_files) * 100,
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function BatchSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-2 w-full" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BulkBatchDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

 
  const processedRef = useRef(false);
  const {
    data: batch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dms", "bulk-batch", uuid],
    queryFn: () => getBulkBatch(uuid),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 3_000;
    },
    staleTime: 0,
  });

  // ── Auto-trigger processing when batch is in 'created' / 'uploading' state ─

  const processMutation = useMutation({
    mutationFn: () => processBulkBatch(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dms", "bulk-batch", uuid] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to start processing." });
    },
  });

  useEffect(() => {
    if (
      batch &&
      (batch.status === "created" || batch.status === "uploading") &&
      !processedRef.current &&
      !processMutation.isPending
    ) {
      processedRef.current = true;
      processMutation.mutate();
    }
  }, [batch, processMutation]);

  // ── Retry mutation ──────────────────────────────────────────────────────────

  const retryMutation = useMutation({
    mutationFn: () => retryBulkBatch(uuid),
    onSuccess: () => {
      processedRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["dms", "bulk-batch", uuid] });
      toast.success("Retry started.");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Retry failed." });
    },
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dms/bulk-upload")}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Bulk Upload Progress</h1>
          <p className="font-mono text-xs text-muted-foreground">{uuid}</p>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <BatchSkeleton />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load batch. The batch may not exist.
            </p>
            <Button variant="outline" onClick={() => router.push("/dms/bulk-upload")}>
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      )}

      {batch && (
        <>
          {/* Summary card */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{batch.batch_name}</CardTitle>
                <CardDescription>
                  Started{" "}
                  {formatDistanceToNow(parseISO(batch.created_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </div>
              <BatchStatusBadge status={batch.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {batch.processed_count} processed ·{" "}
                    {batch.failed_count > 0 && (
                      <span className="text-destructive">
                        {batch.failed_count} failed ·{" "}
                      </span>
                    )}
                    {batch.total_files} total
                  </span>
                  <span>{progressFromBatch(batch)}%</span>
                </div>
                <Progress value={progressFromBatch(batch)} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x rounded-lg border text-center">
                <div className="py-3">
                  <p className="text-2xl font-bold">{batch.total_files}</p>
                  <p className="text-xs text-muted-foreground">Total files</p>
                </div>
                <div className="py-3">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {batch.processed_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
                <div className="py-3">
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      batch.failed_count > 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {batch.failed_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {/* Retry button — only show for failed batches */}
              {batch.status === "failed" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Retry failed items
                  </Button>
                </div>
              )}

              {/* Completed CTA */}
              {batch.status === "completed" && (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      All files processed successfully.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push("/dms/documents")}
                  >
                    View documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items table */}
          {batch.items && batch.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File details</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.items.map((item) => {
                      const statusCfg = ITEM_STATUS_MAP[item.status];
                      return (
                        <TableRow key={item.uuid}>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{item.filename}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.employee_name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.title ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-xs font-medium",
                                statusCfg.className,
                              )}
                            >
                              {statusCfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                            {item.error_message ?? ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
