"use client";

/**
 * app/(system)/system-flex/backup/page.tsx
 * SystemFlex — VaultGuard Backup Job Management
 *
 * Access: super_admin only (manage-backup permission).
 * Non-authorised users are redirected to /dashboard with an error toast.
 *
 * Section 1: Backup Jobs  — card-based list with inline status + manual run
 * Section 2: Run History  — right Sheet showing last 30 runs for a job
 *
 * Manual Run polling:
 *   POST /backup/jobs/:uuid/run            → { data: { run_uuid } }
 *   Poll GET /backup/runs/:runUuid/status  every 3 s until success | failed
 *
 * Error codes:
 *   429 → "Rate limit reached. Max 3 manual runs per hour."
 *   409 → "A backup is already running for this job."
 */

import { showApiError } from "@/lib/error-toast";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Edit2,
  HardDrive,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Server,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  getBackupJobs,
  createBackupJob,
  updateBackupJob,
  deleteBackupJob,
  getBackupRuns,
  getBackupRunStatus,
  runBackupJob,
} from "@/services/system-flex.service";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store/store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type RunStatus = "success" | "failed" | "running" | null;

interface BackupJob {
  uuid: string;
  name: string;
  is_active: boolean;
  backup_type: "db" | "full";
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  destination_disk: "local" | "s3" | "sftp" | "gcs";
  scheduled_at: string;
  retention_daily: number;
  retention_weekly: number;
  retention_monthly: number;
  last_run_at: string | null;
  last_status: RunStatus;
  last_file_size_mb: number | null;
}

interface BackupRun {
  uuid: string;
  status: "success" | "failed" | "running" | "pending";
  started_at: string;
  completed_at: string | null;
  file_size_mb: number | null;
  triggered_by: string;
  error_message: string | null;
}

interface RunStatusResponse {
  status: "success" | "failed" | "running" | "pending";
  file_size_mb: number | null;
  completed_at: string | null;
  error_message: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BACKUP_TYPES = {
  db: "Database",
  full: "Full",
} as const;

const FREQUENCIES = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
} as const;

const DESTINATION_DISKS = {
  local: "Local Disk",
  s3: "Amazon S3",
  sftp: "SFTP",
  gcs: "Google Cloud",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAge(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function formatSize(mb: number | null): string {
  if (mb == null) return "—";
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: RunStatus;
  isRunning?: boolean; // override when manual run is in progress
}

function StatusBadge({ status, isRunning }: StatusBadgeProps) {
  if (isRunning || status === "running") {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  }
  if (status === "success") {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
      >
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground bg-muted/50"
    >
      Never Run
    </Badge>
  );
}

// ── MetaChip ──────────────────────────────────────────────────────────────────

function MetaChip({ label, variant }: { label: string; variant: "blue" | "violet" | "slate" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border",
        variant === "blue" &&
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
        variant === "violet" &&
          "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/50",
        variant === "slate" &&
          "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-700"
      )}
    >
      {label}
    </span>
  );
}

// ── JobCard ───────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: BackupJob;
  isRunning: boolean;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
}

function JobCard({ job, isRunning, onRun, onEdit, onDelete, onViewHistory }: JobCardProps) {
  const stop = (e: React.MouseEvent | React.KeyboardEvent) =>
    e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onViewHistory}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onViewHistory()
      }
      aria-label={`View run history for ${job.name}`}
      className="group relative rounded-xl border border-border bg-background p-5 cursor-pointer transition-all duration-200 hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row: name + active badge + history hint */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <HardDrive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {job.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled {job.scheduled_at}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={job.is_active ? "default" : "secondary"}
            className={cn(
              "text-[10px] py-0 px-1.5",
              job.is_active
                ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                : ""
            )}
          >
            {job.is_active ? "Active" : "Inactive"}
          </Badge>

          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Last run: {formatAge(job.last_run_at)}
        </span>
        <span className="flex items-center gap-1">
          <Archive className="h-3 w-3" aria-hidden="true" />
          {formatSize(job.last_file_size_mb)}
        </span>
        <StatusBadge status={job.last_status} isRunning={isRunning} />
      </div>

      {/* Meta chips row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <MetaChip
          label={BACKUP_TYPES[job.backup_type]}
          variant="blue"
        />
        <MetaChip
          label={FREQUENCIES[job.frequency]}
          variant="violet"
        />
        <MetaChip
          label={DESTINATION_DISKS[job.destination_disk]}
          variant="slate"
        />
        <MetaChip
          label={`${job.retention_daily}d / ${job.retention_weekly}w / ${job.retention_monthly}m retention`}
          variant="slate"
        />
      </div>

      {/* Actions row — stopPropagation so card click doesn't fire */}
      <div
        className="flex items-center gap-2 pt-3 border-t border-border/60"
        onClick={stop}
        onKeyDown={stop}
      >
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={isRunning}
          onClick={onRun}
          aria-label={`Manually run ${job.name}`}
          style={
            isRunning
              ? {}
              : {
                  backgroundColor: "var(--brand-500)",
                  color: "var(--brand-800)",
                }
          }
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Run Now
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={onEdit}
          aria-label={`Edit ${job.name}`}
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          onClick={onDelete}
          aria-label={`Delete ${job.name}`}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// ── Form schema ───────────────────────────────────────────────────────────────

const jobSchema = z.object({
  name: z
    .string()
    .min(1, "Job name is required")
    .max(100, "Name must be under 100 characters"),
  backup_type: z.enum(["db", "full"]),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
  destination_disk: z.enum(["local", "s3", "sftp", "gcs"]),
  scheduled_at: z.string().min(1, "Scheduled time is required"),
  retention_daily: z.preprocess(
    (val) => Number(val),
    z.number().int("Whole number").min(1, "Min 1").max(365, "Max 365")
  ),
  retention_weekly: z.preprocess(
    (val) => Number(val),
    z.number().int("Whole number").min(1, "Min 1").max(52, "Max 52")
  ),
  retention_monthly: z.preprocess(
    (val) => Number(val),
    z.number().int("Whole number").min(1, "Min 1").max(24, "Max 24")
  ),
  is_active: z.boolean(),
});

type JobFormValues = z.infer<typeof jobSchema>;

// ── CreateEditModal ───────────────────────────────────────────────────────────

interface CreateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: BackupJob;
  onSuccess: () => void;
}

function CreateEditModal({
  open,
  onOpenChange,
  defaultValues,
  onSuccess,
}: CreateEditModalProps) {
  const isEditing = !!defaultValues;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          backup_type: defaultValues.backup_type,
          frequency: defaultValues.frequency,
          destination_disk: defaultValues.destination_disk,
          scheduled_at: defaultValues.scheduled_at.slice(0, 5),
          retention_daily: defaultValues.retention_daily,
          retention_weekly: defaultValues.retention_weekly,
          retention_monthly: defaultValues.retention_monthly,
          is_active: defaultValues.is_active,
        }
      : {
          name: "",
          backup_type: "full",
          frequency: "daily",
          destination_disk: "local",
          scheduled_at: "02:00",
          retention_daily: 30,
          retention_weekly: 4,
          retention_monthly: 12,
          is_active: true,
        },
  });

  // Reset form when modal opens/closes or target changes
  useEffect(() => {
    if (open) {
      form.reset(
        defaultValues
          ? {
              name: defaultValues.name,
              backup_type: defaultValues.backup_type,
              frequency: defaultValues.frequency,
              destination_disk: defaultValues.destination_disk,
              scheduled_at: defaultValues.scheduled_at.slice(0, 5),
              retention_daily: defaultValues.retention_daily,
              retention_weekly: defaultValues.retention_weekly,
              retention_monthly: defaultValues.retention_monthly,
              is_active: defaultValues.is_active,
            }
          : {
              name: "",
              backup_type: "full",
              frequency: "daily",
              destination_disk: "local",
              scheduled_at: "02:00",
              retention_daily: 30,
              retention_weekly: 4,
              retention_monthly: 12,
              is_active: true,
            }
      );
    }
  }, [open, defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduledAt = form.watch("scheduled_at");

  // Warn if scheduled_at is outside the recommended 01:00–04:00 maintenance window
  const showScheduleWarning = useMemo(() => {
    const m = scheduledAt?.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return false;
    const hour = parseInt(m[1], 10);
    return hour < 1 || hour > 4;
  }, [scheduledAt]);

  const saveMutation = useMutation({
    mutationFn: (values: JobFormValues) =>
      isEditing
        ? updateBackupJob(defaultValues!.uuid, values)
        : createBackupJob(values),
    onSuccess: () => {
      toast.success(
        isEditing ? "Backup job updated" : "Backup job created"
      );
      onOpenChange(false);
      onSuccess();
    },
    onError: (apiFailure) =>
      showApiError(apiFailure, { fallbackMessage: isEditing ? "Failed to update job" : "Failed to create job" }),
  });

  const onSubmit = (values: JobFormValues) => saveMutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Backup Job" : "Create Backup Job"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Job Name */}
          <div className="space-y-1.5">
            <Label htmlFor="bj-name">Job Name</Label>
            <Input
              id="bj-name"
              placeholder="e.g. Production DB Nightly"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Backup Type + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bj-type">Backup Type</Label>
              <Select
                value={form.watch("backup_type")}
                onValueChange={(v) =>
                  form.setValue(
                    "backup_type",
                    v as JobFormValues["backup_type"]
                  )
                }
              >
                <SelectTrigger id="bj-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BACKUP_TYPES).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bj-freq">Frequency</Label>
              <Select
                value={form.watch("frequency")}
                onValueChange={(v) =>
                  form.setValue("frequency", v as JobFormValues["frequency"])
                }
              >
                <SelectTrigger id="bj-freq" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCIES).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destination Disk */}
          <div className="space-y-1.5">
            <Label htmlFor="bj-disk">Destination</Label>
            <Select
              value={form.watch("destination_disk")}
              onValueChange={(v) =>
                form.setValue(
                  "destination_disk",
                  v as JobFormValues["destination_disk"]
                )
              }
            >
              <SelectTrigger id="bj-disk" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DESTINATION_DISKS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled At */}
          <div className="space-y-1.5">
            <Label htmlFor="bj-sched">Scheduled At (HH:MM)</Label>
            <Input
              id="bj-sched"
              placeholder="02:00"
              {...form.register("scheduled_at")}
              aria-invalid={!!form.formState.errors.scheduled_at}
            />
            {form.formState.errors.scheduled_at && (
              <p className="text-xs text-destructive">
                {form.formState.errors.scheduled_at.message}
              </p>
            )}
          </div>

          {/* Retention policy — snapshots kept per tier (backend requires all three) */}
          <div className="space-y-1.5">
            <Label>Retention (snapshots kept)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bj-ret-d" className="text-xs text-muted-foreground">
                  Daily
                </Label>
                <Input
                  id="bj-ret-d"
                  type="number"
                  min={1}
                  max={365}
                  {...form.register("retention_daily")}
                  aria-invalid={!!form.formState.errors.retention_daily}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bj-ret-w" className="text-xs text-muted-foreground">
                  Weekly
                </Label>
                <Input
                  id="bj-ret-w"
                  type="number"
                  min={1}
                  max={52}
                  {...form.register("retention_weekly")}
                  aria-invalid={!!form.formState.errors.retention_weekly}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bj-ret-m" className="text-xs text-muted-foreground">
                  Monthly
                </Label>
                <Input
                  id="bj-ret-m"
                  type="number"
                  min={1}
                  max={24}
                  {...form.register("retention_monthly")}
                  aria-invalid={!!form.formState.errors.retention_monthly}
                />
              </div>
            </div>
            {(form.formState.errors.retention_daily ||
              form.formState.errors.retention_weekly ||
              form.formState.errors.retention_monthly) && (
              <p className="text-xs text-destructive">
                Daily 1–365, weekly 1–52, monthly 1–24.
              </p>
            )}
          </div>

          {/* Schedule warning */}
          {showScheduleWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 px-3 py-2.5">
              <AlertTriangle
                className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <span className="font-semibold">Outside maintenance window.</span>{" "}
                Recommended backup time is{" "}
                <span className="font-medium">01:00 – 04:00</span> to minimise
                impact on active users and database load.
              </p>
            </div>
          )}

          {/* Active switch */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Enable this job
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive jobs are skipped by the scheduler but can still be
                triggered manually.
              </p>
            </div>
            <Switch
              id="bj-active"
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
              aria-label="Enable backup job"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              style={{
                backgroundColor: "var(--brand-500)",
                color: "var(--brand-800)",
              }}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              {isEditing ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── RunHistoryDrawer ──────────────────────────────────────────────────────────

interface RunHistoryDrawerProps {
  job: BackupJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RunHistoryDrawer({ job, open, onOpenChange }: RunHistoryDrawerProps) {
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { data: runs, isLoading } = useQuery<BackupRun[]>({
    queryKey: ["system-flex", "backup", "runs", job?.uuid],
    queryFn: () => getBackupRuns(job!.uuid),
    enabled: open && !!job,
    staleTime: 10_000,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full flex flex-col overflow-hidden p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Run History
          </SheetTitle>
          <SheetDescription>
            {job ? (
              <>
                Last 30 runs for{" "}
                <span className="font-medium text-foreground">{job.name}</span>
              </>
            ) : (
              "Backup run history"
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !runs || runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <Archive
                className="h-9 w-9 text-muted-foreground/30"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  No runs recorded yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use "Run Now" to trigger the first backup for this job.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead className="pr-6">Error</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {runs.map((run) => {
                  const hasLongError = (run.error_message?.length ?? 0) > 80;
                  const isExpanded = expandedError === run.uuid;

                  return (
                    <TableRow key={run.uuid}>
                      <TableCell className="pl-6">
                        <span
                          className="text-xs text-muted-foreground"
                          title={run.started_at}
                        >
                          {formatAge(run.started_at)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className="text-xs text-muted-foreground"
                          title={run.completed_at ?? undefined}
                        >
                          {run.completed_at
                            ? formatAge(run.completed_at)
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={
                            run.status === "pending"
                              ? "running"
                              : (run.status as RunStatus)
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <span className="text-xs">
                          {formatSize(run.file_size_mb)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-muted-foreground capitalize">
                          {run.triggered_by}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 max-w-[180px]">
                        {run.error_message ? (
                          <div>
                            <span
                              className={cn(
                                "text-xs text-destructive/80 font-mono",
                                !isExpanded && "line-clamp-1"
                              )}
                              title={
                                !isExpanded && hasLongError
                                  ? run.error_message
                                  : undefined
                              }
                            >
                              {isExpanded
                                ? run.error_message
                                : `${run.error_message.slice(0, 80)}${hasLongError ? "…" : ""}`}
                            </span>
                            {hasLongError && (
                              <button
                                type="button"
                                className="mt-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
                                onClick={() =>
                                  setExpandedError(
                                    isExpanded ? null : run.uuid
                                  )
                                }
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── BackupPage ────────────────────────────────────────────────────────────────

export default function BackupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = useSelector((s: RootState) => s.auth.permissions);
  const canAccess = permissions.includes("manage-backup");

  // ── Access guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for Redux rehydration (permissions may be empty on first paint)
    if (permissions.length === 0) return;
    if (!canAccess) {
      toast.error("Backup management requires super admin access.");
      router.replace("/dashboard");
    }
  }, [permissions, canAccess, router]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [historyJob, setHistoryJob] = useState<BackupJob | null>(null);
  const [editJob, setEditJob] = useState<BackupJob | null>(null);
  const [deleteJob, setDeleteJob] = useState<BackupJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // jobUuid → runUuid for jobs currently being manually run (driving Run button state)
  const [runningJobs, setRunningJobs] = useState<Record<string, string>>({});

  // ── Polling via intervals (avoids useQuery refetchInterval conflicts) ─────────
  const pollRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Clean up all intervals on unmount
  useEffect(() => {
    const polls = pollRef.current;
    return () => {
      Object.values(polls).forEach(clearInterval);
    };
  }, []);

  const startPoll = useCallback(
    (jobUuid: string, runUuid: string) => {
      // Stop any pre-existing poll for this job
      if (pollRef.current[jobUuid]) {
        clearInterval(pollRef.current[jobUuid]);
      }

      pollRef.current[jobUuid] = setInterval(async () => {
        try {
          const res = await getBackupRunStatus(runUuid);
          const { status, file_size_mb } = res;

          if (status === "success" || status === "failed") {
            clearInterval(pollRef.current[jobUuid]);
            delete pollRef.current[jobUuid];

            setRunningJobs((prev) => {
              const next = { ...prev };
              delete next[jobUuid];
              return next;
            });

            queryClient.invalidateQueries({
              queryKey: ["system-flex", "backup", "jobs"],
            });
            queryClient.invalidateQueries({
              queryKey: ["system-flex", "backup", "runs", jobUuid],
            });

            if (status === "success") {
              toast.success(
                `Backup completed — ${file_size_mb != null ? `${file_size_mb} MB` : "file saved"}`
              );
            } else {
              toast.error("Backup failed — check run history");
            }
          }
        } catch {
          // Silently ignore transient poll errors
        }
      }, 3_000);
    },
    [queryClient]
  );

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: jobs, isLoading, isError } = useQuery<BackupJob[]>({
    queryKey: ["system-flex", "backup", "jobs"],
    queryFn: getBackupJobs,
    staleTime: 30_000,
    enabled: canAccess,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  // Manual run — POST + start polling
  const runMutation = useMutation({
    mutationFn: (jobUuid: string) =>
      runBackupJob(jobUuid).then((d) => ({ runUuid: d.run_uuid, jobUuid })),
    onSuccess: ({ runUuid, jobUuid }) => {
      setRunningJobs((prev) => ({ ...prev, [jobUuid]: runUuid }));
      startPoll(jobUuid, runUuid);
    },
    onError: (err: AxiosError, jobUuid) => {
      const status = (err.response?.status as number | undefined);
      if (status === 429) {
        showApiError(err, { fallbackMessage: "Rate limit reached. Max 3 manual runs per hour." });
      } else if (status === 409) {
        showApiError(err, { fallbackMessage: "A backup is already running for this job." });
      } else {
        showApiError(err, { fallbackMessage: "Failed to start backup run." });
      }
      // Remove any stale running state
      setRunningJobs((prev) => {
        const next = { ...prev };
        delete next[jobUuid];
        return next;
      });
    },
  });

  // Delete job
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteBackupJob(uuid),
    onSuccess: () => {
      setDeleteJob(null);
      queryClient.invalidateQueries({
        queryKey: ["system-flex", "backup", "jobs"],
      });
      toast.success("Backup job deleted");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to delete backup job" }),
  });

  const invalidateJobs = () => {
    queryClient.invalidateQueries({ queryKey: ["system-flex", "backup", "jobs"] });
  };

  // ── Loading / access gate ─────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            VaultGuard Backups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Manage automated backup jobs and monitor run history. Super admin
            access only. Click any job card to view its run history.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 gap-1.5"
          style={{
            backgroundColor: "var(--brand-500)",
            color: "var(--brand-800)",
          }}
        >
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Failed to load backup jobs.{" "}
            <button
              type="button"
              className="underline hover:no-underline font-medium"
              onClick={invalidateJobs}
            >
              Try again
            </button>
          </span>
        </div>
      )}

      {/* Jobs list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-border/60">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        /* ── Empty state: orange warning card ── */
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/50 p-8">
          <div className="flex flex-col items-center text-center gap-4 max-w-md mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle
                className="h-7 w-7 text-orange-600 dark:text-orange-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-base font-bold text-orange-800 dark:text-orange-300">
                No backup jobs configured
              </p>
              <p className="mt-1.5 text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
                Your database is not being backed up. Data loss in the event of
                a failure would be{" "}
                <span className="font-semibold">unrecoverable</span>. Create a
                backup job immediately to protect company data.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-1 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Create Backup Job Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.uuid}
              job={job}
              isRunning={job.uuid in runningJobs}
              onRun={() => runMutation.mutate(job.uuid)}
              onEdit={() => setEditJob(job)}
              onDelete={() => setDeleteJob(job)}
              onViewHistory={() => setHistoryJob(job)}
            />
          ))}
        </div>
      )}

      {/* ── Modals + Drawers ── */}

      {/* Create modal */}
      <CreateEditModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={invalidateJobs}
      />

      {/* Edit modal */}
      <CreateEditModal
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        defaultValues={editJob ?? undefined}
        onSuccess={() => {
          setEditJob(null);
          invalidateJobs();
        }}
      />

      {/* Run History Drawer */}
      <RunHistoryDrawer
        job={historyJob}
        open={!!historyJob}
        onOpenChange={(open) => !open && setHistoryJob(null)}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteJob}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteJob(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete backup job?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {deleteJob?.name}
              </span>{" "}
              and all its run history will be permanently removed. Existing
              backup files on the destination disk are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Keep job
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteJob && deleteMutation.mutate(deleteJob.uuid)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
