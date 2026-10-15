"use client";

/**
 * app/(system)/notify-pro/whatsapp-config/page.tsx
 * NotifyPro — WhatsApp Configuration (per-company Meta Cloud API credentials)
 *
 * Access gate: requires `manage-notifications`. Unauthorized users are redirected
 * to /flexi-hq with a toast (same pattern as the other notify-pro admin pages).
 *
 * Data flow:
 *   GET  /notify-pro/whatsapp-config        → current config (null if none; access_token
 *                                             and webhook_verify_token are write-only)
 *   POST /notify-pro/whatsapp-config        → create
 *   PUT  /notify-pro/whatsapp-config        → update (rotating the token resets is_active)
 *   POST /notify-pro/whatsapp-config/test   → test + activate (meta only in Phase 1)
 *
 * Secrets (access_token, webhook_verify_token) are never returned by the API, so
 * their fields are write-only: empty by default, and only sent when the admin types
 * a new value.
 */

import { showApiError } from "@/lib/error-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  MessageSquare,
  KeyRound,
  Loader2,
  Save,
  PlugZap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import type { RootState } from "@/store/store";
import { notifyProService } from "@/services/notify-pro.service";
import type { WhatsAppProvider } from "@/types/notify-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDERS: { value: WhatsAppProvider; label: string }[] = [
  { value: "meta", label: "Meta Cloud API" },
  { value: "twilio", label: "Twilio" },
  { value: "custom", label: "Custom endpoint" },
];

function errorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ?? fallback
    );
  }
  return fallback;
}

export default function WhatsAppConfigPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const permissions = useSelector((s: RootState) => s.auth.permissions);
  const canManage = (permissions ?? []).includes("manage-notifications");

  // ── Data ────────────────────────────────────────────────────────────────────
  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notify-pro", "whatsapp-config"],
    queryFn: () => notifyProService.getWhatsAppConfig(),
    enabled: canManage,
    staleTime: 60_000,
  });

  const isEditing = !!config;

  // ── Form state (secrets are write-only — never seeded from the response) ──────
  const [provider, setProvider] = useState<WhatsAppProvider>("meta");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [webhookToken, setWebhookToken] = useState("");

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setPhoneNumberId(config.phone_number_id);
    }
  }, [config]);

  // ── Save (create or update) ───────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      const token = accessToken.trim();
      const webhook = webhookToken.trim();

      if (isEditing) {
        return notifyProService.updateWhatsAppConfig({
          provider,
          phone_number_id: phoneNumberId.trim(),
          // Secrets only sent when the admin typed a new value.
          ...(token ? { access_token: token } : {}),
          ...(webhook ? { webhook_verify_token: webhook } : {}),
        });
      }

      return notifyProService.saveWhatsAppConfig({
        provider,
        phone_number_id: phoneNumberId.trim(),
        access_token: token,
        webhook_verify_token: webhook || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notify-pro", "whatsapp-config"],
      });
      setAccessToken("");
      setWebhookToken("");
      toast.success(
        isEditing
          ? "WhatsApp configuration updated."
          : "WhatsApp configuration created.",
      );
    },
    onError: (err) =>
      showApiError(err, { fallbackMessage: errorMessage(err, "Could not save the configuration.") }),
  });

  // ── Test connection (meta only; success activates the channel) ────────────────
  const testMutation = useMutation({
    mutationFn: () => notifyProService.testWhatsAppConnection(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notify-pro", "whatsapp-config"],
      });
      toast.success("Connection test passed. The channel is now active.");
    },
    onError: (err) =>
      showApiError(err, { fallbackMessage: errorMessage(err, "Connection test failed.") }),
  });

  // ── Gate (after all hooks) ────────────────────────────────────────────────────
  useEffect(() => {
    if (!canManage) {
      toast.error("You do not have access to WhatsApp configuration.");
      router.push("/flexi-hq");
    }
  }, [canManage, router]);

  if (!canManage) return null;

  // Create requires the secret; update keeps the existing one if left blank.
  const canSave =
    phoneNumberId.trim().length > 0 &&
    (isEditing || accessToken.trim().length > 0) &&
    !saveMutation.isPending;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            WhatsApp Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-prose">
            Per-company WhatsApp Business credentials. The access token is stored
            encrypted and never shown again. Updating credentials deactivates the
            channel until a successful test.
          </p>
        </div>
      </div>

      {isError ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Failed to load the WhatsApp configuration.{" "}
            <button
              type="button"
              className="underline hover:no-underline font-medium"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["notify-pro", "whatsapp-config"],
                })
              }
            >
              Try again
            </button>
          </span>
        </div>
      ) : isLoading ? (
        <div className="space-y-4 rounded-xl border border-border bg-background p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          {/* Status row */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">
              {isEditing ? "Current configuration" : "No configuration yet"}
            </span>
            {isEditing && (
              <Badge
                variant="outline"
                className={
                  config!.is_active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                }
              >
                {config!.is_active ? "Active" : "Inactive — needs a successful test"}
              </Badge>
            )}
          </div>

          {/* Form */}
          <form
            className="space-y-5 px-6 py-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave) saveMutation.mutate();
            }}
          >
            {/* Provider */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as WhatsAppProvider)}
              >
                <SelectTrigger id="wa-provider" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Connection testing currently supports Meta Cloud API only.
              </p>
            </div>

            {/* Phone number ID */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone">Phone number ID</Label>
              <Input
                id="wa-phone"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 1234567890"
                className="h-9"
                autoComplete="off"
              />
            </div>

            {/* Access token (write-only) */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-token" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Access token
              </Label>
              <Input
                id="wa-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  isEditing ? "•••••••• (enter a new token to replace)" : "Bearer token"
                }
                className="h-9"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Leave blank to keep the current token. Entering a new one deactivates the channel until it is re-tested."
                  : "Stored encrypted and never displayed again."}
              </p>
            </div>

            {/* Webhook verify token (write-only, optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-webhook">Webhook verify token (optional)</Label>
              <Input
                id="wa-webhook"
                type="password"
                value={webhookToken}
                onChange={(e) => setWebhookToken(e.target.value)}
                placeholder={isEditing ? "•••••••• (enter to replace)" : "Optional"}
                className="h-9"
                autoComplete="new-password"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={!canSave} className="gap-1.5">
                {saveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isEditing ? "Save changes" : "Create configuration"}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  disabled={testMutation.isPending}
                  onClick={() => testMutation.mutate()}
                >
                  {testMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : config!.is_active ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <PlugZap className="h-3.5 w-3.5" />
                  )}
                  Test connection
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
