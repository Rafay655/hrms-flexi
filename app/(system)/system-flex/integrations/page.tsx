"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Database,
  HardDrive,
  KeyRound,
  Loader2,
  Mail,
  PlugZap,
  RefreshCw,
  Server,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import {
  getIntegrationHealth,
  type IntegrationHealth,
} from "@/services/system-flex.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatusTone = "ok" | "warning" | "error";

type IntegrationItem = {
  id: keyof IntegrationHealth;
  title: string;
  owner: string;
  icon: React.ElementType;
  tone: StatusTone;
  statusLabel: string;
  primary: string;
  secondary: string;
  facts: Array<{ label: string; value: React.ReactNode }>;
};

function toneFor(status: string): StatusTone {
  if (["ok", "configured", "reachable"].includes(status)) return "ok";
  if (["missing_config", "not_configured", "miss", "configured_unreachable"].includes(status)) return "warning";
  return "error";
}

const TONE_CLASS: Record<StatusTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400",
  error: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400",
};

function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "warning" ? ShieldAlert : XCircle;

  return (
    <Badge variant="outline" className={cn("gap-1.5", TONE_CLASS[tone])}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function buildItems(data: IntegrationHealth): IntegrationItem[] {
  return [
    {
      id: "mail",
      title: "SMTP Mail",
      owner: "Laravel Mailer",
      icon: Mail,
      tone: toneFor(data.mail.status),
      statusLabel:
        data.mail.status === "reachable"
          ? "Reachable"
          : data.mail.status === "configured_unreachable"
          ? "Configured, not reachable"
          : "Missing config",
      primary:
        data.mail.status === "reachable"
          ? "SMTP configuration is present and the host accepted a live TCP connection."
          : data.mail.status === "configured_unreachable"
          ? "SMTP configuration is present, but the host did not accept the reachability probe."
          : "Outbound mail cannot be trusted until SMTP configuration is complete.",
      secondary: "This page does not send a message or authenticate to SMTP. Use the explicit mail test flow for delivery.",
      facts: [
        { label: "Mailer", value: data.mail.mailer },
        { label: "Host", value: data.mail.host ?? "Not set" },
        { label: "Port", value: data.mail.port ?? "Not set" },
        { label: "Username", value: data.mail.username_configured ? "Configured" : "Not set" },
        { label: "TCP probe", value: data.mail.smtp_reachable ? "Reachable" : "Not reachable" },
        { label: "Probe time", value: data.mail.smtp_response_ms === null ? "-" : `${data.mail.smtp_response_ms} ms` },
      ],
    },
    {
      id: "queue",
      title: "Queues",
      owner: "Database Queue",
      icon: Server,
      tone: toneFor(data.queue.status),
      statusLabel: data.queue.status === "ok" ? "Healthy" : "Degraded",
      primary:
        data.queue.failed_jobs === 0
          ? "No failed jobs are currently blocking workers."
          : `${data.queue.failed_jobs} failed job${data.queue.failed_jobs === 1 ? "" : "s"} need operator attention.`,
      secondary: "Pending jobs should drain when a queue worker is active.",
      facts: [
        { label: "Connection", value: data.queue.connection },
        { label: "Pending", value: data.queue.pending_jobs },
        { label: "Failed", value: data.queue.failed_jobs },
      ],
    },
    {
      id: "database",
      title: "Database",
      owner: "MySQL",
      icon: Database,
      tone: toneFor(data.database.status),
      statusLabel: data.database.status === "ok" ? "Reachable" : "Error",
      primary:
        data.database.status === "ok"
          ? "The API can complete a live database probe."
          : "The API database probe failed.",
      secondary: "Response time is measured from a trivial SELECT 1 probe.",
      facts: [
        { label: "Connection", value: data.database.connection },
        { label: "Response", value: `${data.database.response_ms} ms` },
      ],
    },
    {
      id: "cache",
      title: "Cache",
      owner: "Laravel Cache",
      icon: HardDrive,
      tone: toneFor(data.cache.status),
      statusLabel: data.cache.status === "ok" ? "Writable" : data.cache.status,
      primary:
        data.cache.status === "ok"
          ? "The cache store accepted and returned a live probe value."
          : "The cache store probe did not return cleanly.",
      secondary: "SystemFlex uses this for health snapshots and settings cache.",
      facts: [{ label: "Store", value: data.cache.store }],
    },
    {
      id: "storage",
      title: "Storage",
      owner: "Filesystem",
      icon: HardDrive,
      tone: toneFor(data.storage.status),
      statusLabel: data.storage.status === "ok" ? "Writable" : data.storage.status,
      primary:
        data.storage.status === "ok"
          ? "The default disk accepted a write/read/delete probe."
          : "The default disk probe failed.",
      secondary: "Backups and generated artifacts depend on this path.",
      facts: [{ label: "Default disk", value: data.storage.default_disk }],
    },
    {
      id: "ldap",
      title: "LDAP Runtime",
      owner: "ConnectCentral",
      icon: KeyRound,
      tone: toneFor(data.ldap.status),
      statusLabel:
        data.ldap.status === "configured"
          ? "Configured"
          : data.ldap.status === "not_configured"
          ? "Not configured"
          : "Extension missing",
      primary:
        data.ldap.status === "configured"
          ? "At least one active LDAP provider exists. A bind test still requires the explicit ConnectCentral test action."
          : data.ldap.status === "not_configured"
          ? "PHP can load LDAP functions, but no active LDAP provider is configured."
          : "PHP LDAP extension is not available.",
      secondary: "Provider credentials live in ConnectCentral, not SystemFlex.",
      facts: [
        { label: "Extension", value: data.ldap.extension_loaded ? "Loaded" : "Missing" },
        { label: "Configured", value: data.ldap.configured_providers },
        { label: "Active", value: data.ldap.active_providers },
        { label: "Verification", value: data.ldap.verification_level === "not_verifiable" ? "Not verifiable" : "Config only" },
      ],
    },
    {
      id: "oauth",
      title: "OAuth / SSO",
      owner: "ConnectCentral",
      icon: PlugZap,
      tone: toneFor(data.oauth.status),
      statusLabel: data.oauth.status === "configured" ? "Configured" : "No active provider",
      primary:
        data.oauth.active_providers > 0
          ? "At least one SSO provider is active."
          : "No active OAuth/SSO providers are configured for this company.",
      secondary: "A real callback test requires provider credentials and redirect registration.",
      facts: [
        { label: "Configured", value: data.oauth.configured_providers },
        { label: "Active", value: data.oauth.active_providers },
        { label: "Verification", value: data.oauth.verification_level === "not_verifiable" ? "Not verifiable" : "Config only" },
      ],
    },
    {
      id: "notify_pro",
      title: "NotifyPro Delivery",
      owner: "NotifyPro",
      icon: Bell,
      tone: toneFor(data.notify_pro.status),
      statusLabel: data.notify_pro.status === "ok" ? "No failed deliveries" : "Delivery failures",
      primary:
        data.notify_pro.failed_deliveries === 0
          ? "No failed notification delivery records are currently present."
          : `${data.notify_pro.failed_deliveries} failed delivery record${data.notify_pro.failed_deliveries === 1 ? "" : "s"} found.`,
      secondary: "Template authoring belongs in NotifyPro; SystemFlex only reports delivery health.",
      facts: [
        { label: "Templates", value: data.notify_pro.templates },
        { label: "Active", value: data.notify_pro.active_templates },
        { label: "Pending", value: data.notify_pro.pending_deliveries },
        { label: "Failed", value: data.notify_pro.failed_deliveries },
      ],
    },
  ];
}

function IntegrationCard({ item }: { item: IntegrationItem }) {
  const Icon = item.icon;

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.owner}</p>
          </div>
        </div>
        <StatusBadge tone={item.tone} label={item.statusLabel} />
      </div>

      <p className="mt-4 text-sm text-foreground">{item.primary}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.secondary}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {item.facts.map((fact) => (
          <div key={fact.label} className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="mt-1 truncate font-medium text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function SystemFlexIntegrationsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["system-flex", "integration-health"],
    queryFn: getIntegrationHealth,
    staleTime: 30_000,
  });

  const items = React.useMemo(() => (data ? buildItems(data) : []), [data]);

  return (
    <main className="mx-auto max-w-[1440px] space-y-6 p-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <PlugZap className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            Integration Health
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Read-only operational status for dependencies SystemFlex must monitor across the platform.
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Refresh
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <h2 className="text-sm font-semibold">Integration health failed to load</h2>
          <p className="mt-1 text-sm">The operations API did not return a usable status snapshot.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Integration health checks">
          {items.map((item) => (
            <IntegrationCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </main>
  );
}
