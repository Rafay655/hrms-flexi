"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileStack, Loader2, Plus, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBulkBatches } from "@/hooks/use-bulk-upload";
import type {
  BulkBatch,
  BulkBatchStatus,
} from "@/services/bulk-upload.service";
import { CreateBatchModal } from "@/components/create-batch-modal";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BulkBatchStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: BulkBatchStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BulkUploadListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: batches = [],
    isLoading,
    isFetching,
    refetch,
  } = useBulkBatches({
    search: search || undefined,
    status: status === "all" ? undefined : (status as BulkBatchStatus),
  });

  const list: BulkBatch[] = Array.isArray(batches) ? batches : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Bulk Upload</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage document upload batches
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
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New batch
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search batches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileStack className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No batches found</p>
              <p className="text-sm text-muted-foreground">
                Create your first bulk upload batch to get started.
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((batch) => (
            <Card
              key={batch.uuid}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dms/bulk-upload/${batch.uuid}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/dms/bulk-upload/${batch.uuid}`);
                }
              }}
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">
                    {batch.batch_name}
                  </CardTitle>
                  <StatusBadge status={batch.status} />
                </div>
                <CardDescription className="text-xs">
                  Created {formatDate(batch.created_at)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{batch.total_files}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Processed</p>
                    <p className="font-semibold text-emerald-600">
                      {batch.processed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="font-semibold text-red-600">
                      {batch.failed}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{batch.progress_percentage}%</span>
                  </div>
                  <Progress value={batch.progress_percentage} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateBatchModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}