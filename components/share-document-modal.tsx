"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarIcon, Loader2, Share2, User } from "lucide-react";
import { toast } from "sonner";

import { useShareDocument } from "@/hooks/use-dms-documents";
import { useEmployees } from "@/hooks/useEmployees";
import type { ShareAccessLevel } from "@/services/dms-documents.service";

import SearchableSelect, {
  type Option,
} from "@/components/ui/searchable-select";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShareDocumentModalProps {
  documentUuid: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCESS_LEVELS: Option[] = [
  { value: "view", label: "View only" },
  { value: "download", label: "View & Download" },
  { value: "sign", label: "View, Download & Sign" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrapList<T>(raw: unknown): T[] {
  if (!raw) return [];
  let candidate: unknown = raw;
  if (
    candidate &&
    typeof candidate === "object" &&
    "data" in (candidate as Record<string, unknown>)
  ) {
    candidate = (candidate as Record<string, unknown>).data;
  }
  if (
    candidate &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    "data" in (candidate as Record<string, unknown>)
  ) {
    candidate = (candidate as Record<string, unknown>).data;
  }
  return Array.isArray(candidate) ? (candidate as T[]) : [];
}

/** Default expiry: 30 days from today, at end of day local time */
function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(23, 59, 0, 0);
  // datetime-local format: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareDocumentModal({
  documentUuid,
  documentTitle,
  open,
  onOpenChange,
  onSuccess,
}: ShareDocumentModalProps) {
  const [userId, setUserId] = useState("");
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>("view");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());

  // ── Employees ───────────────────────────────────────────────────────────────
  const { data: employeesRaw, isLoading: loadingEmployees } = useEmployees({
    per_page: 1000,
    detailed: 0,
  });

  const employeeOptions: Option[] = useMemo(() => {
    const list = unwrapList<Record<string, unknown>>(employeesRaw);
    return list
      .map((e) => {
        const code = String(e.employee_code ?? "");
        const name = String(e.name ?? "");
        return {
          value: String(e.user_id),
          label: code && name ? `${name} (${code})` : name || `#${e.user_id}`,
        };
      })
      .filter((o) => o.value !== "undefined");
  }, [employeesRaw]);

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUserId("");
      setAccessLevel("view");
      setExpiresAt(defaultExpiry());
    }
  }, [open]);

  const mutation = useShareDocument(documentUuid);
  const isPending = mutation.isPending;

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Please select a person to share with.");
      return;
    }
    if (!expiresAt) {
      toast.error("Please choose an expiry date.");
      return;
    }

    // datetime-local gives "YYYY-MM-DDTHH:mm" — append ":00" for backend
    const isoExpiry = expiresAt.length === 16 ? `${expiresAt}:00` : expiresAt;

    await mutation.mutateAsync(
      {
        shared_with_user_id: Number(userId),
        access_level: accessLevel,
        expires_at: isoExpiry,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Share Document</DialogTitle>
              <DialogDescription className="break-all">
                {documentTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee picker */}
          <div className="flex flex-col">
            <p className="mb-2 text-sm font-medium">Share with *</p>
            <SearchableSelect
              options={employeeOptions}
              value={userId}
              onChange={setUserId}
              placeholder="Select person…"
              searchPlaceholder="Search by name or code…"
              groupLabel="Employees"
              emptyText="No employees found"
              icon={User}
              allowAll={false}
              isLoading={loadingEmployees}
              widthClass="w-full"
            />
          </div>

          {/* Access level */}
          <div>
            <p className="mb-2 text-sm font-medium">Access level *</p>
            <Select
              value={accessLevel}
              onValueChange={(v) => setAccessLevel(v as ShareAccessLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="download">View &amp; Download</SelectItem>
                <SelectItem value="sign">
                  View, Download &amp; Sign
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiry */}
          <div>
            <p className="mb-2 text-sm font-medium">Expires at *</p>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="datetime-local"
                className="pl-9"
                min={new Date().toISOString().slice(0, 16)}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Access will be revoked automatically after this date.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !userId}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing…
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}