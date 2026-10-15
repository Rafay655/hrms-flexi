"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { insight360Service } from "@/services/insight360";
import type { Insight360CatalogueWaveReport } from "@/types/insight360";
import {
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  reportDescription,
} from "../../_components/Insight360Ui";

const refreshLabels: Record<string, string> = {
  live: "Updates as changes happen",
  on_demand: "Updates when opened",
  cached_15m: "Updates every 15 minutes",
  nightly: "Updates nightly",
};

function StatusBadge({ value }: { value: string }) {
  const style = ["passed", "approved", "ready"].includes(value)
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : ["failed", "rejected", "blocked"].includes(value)
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-amber-50 text-amber-900 ring-amber-200";
  const labels: Record<string, string> = {
    ready: "Available",
    blocked: "Needs attention",
    passed: "Checked",
    failed: "Needs review",
    pending: "Not checked",
    pending_sme: "Awaiting approval",
    approved: "Approved",
    rejected: "Not approved",
    not_applicable: "Not required",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {labels[value] ?? value.replaceAll("_", " ")}
    </span>
  );
}

export default function CatalogueWaveTwoPage() {
  const client = useQueryClient();
  const [area, setArea] = useState<"all" | "operations" | "payroll">("all");
  const [signing, setSigning] = useState<Insight360CatalogueWaveReport | null>(
    null,
  );
  const [note, setNote] = useState("");
  const queryKey = ["insight360", "catalogue-wave-2"] as const;
  const query = useQuery({
    queryKey,
    queryFn: insight360Service.catalogueWaveTwo,
    refetchInterval: 15000,
  });
  const refresh = useMutation({
    mutationFn: (reportKey?: string) =>
      insight360Service.refreshCatalogueWaveTwo(reportKey),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const signOff = useMutation({
    mutationFn: ({
      reportKey,
      approvalNote,
    }: {
      reportKey: string;
      approvalNote: string;
    }) =>
      insight360Service.signOffCatalogueWaveTwoReport(reportKey, approvalNote),
    onSuccess: () => {
      setSigning(null);
      setNote("");
      client.invalidateQueries({ queryKey });
    },
  });
  const reports = useMemo(
    () =>
      (query.data?.reports ?? []).filter((report) => {
        if (area === "operations") return report.key.startsWith("timesheet_");
        if (area === "payroll") return report.key.startsWith("payroll_");
        return true;
      }),
    [area, query.data?.reports],
  );

  if (query.isLoading)
    return (
      <div className="min-h-full bg-brand-100 p-6">
        <LoadingPanel label="Loading attendance, leave and payroll reports" />
      </div>
    );
  if (query.error || !query.data)
    return (
      <div className="min-h-full bg-brand-100 p-6">
        <ErrorPanel message="Time, leave and payroll reports are not available right now." />
      </div>
    );

  const summary = query.data.summary;
  const cards = [
    ["Reports you can access", summary.total, "Based on your role"],
    ["Ready to run", summary.source_ready, "Data is connected"],
    ["Data checked", summary.technically_passed, "Latest totals match"],
    ["Business approved", summary.sme_approved, "Reviewed by an owner"],
  ];

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Report collection"
          title="Time, leave and payroll"
          description="Attendance, schedules, leave balances and payroll summaries available for your role."
          action={
            query.data.permissions.can_manage ? (
              <button
                type="button"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate(undefined)}
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${refresh.isPending ? "animate-spin motion-reduce:animate-none" : ""}`}
                />
                {refresh.isPending ? "Checking…" : "Check latest data"}
              </button>
            ) : undefined
          }
        />

        <section
          aria-label="Report collection status"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map(([label, value, detail]) => (
            <article
              key={String(label)}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
              <p className="mt-1 text-xs text-gray-600">{detail}</p>
            </article>
          ))}
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <p>
            <strong>Payroll privacy:</strong> payroll reports are only shown to
            people with salary access and still require finance approval.
          </p>
        </div>

        <section aria-labelledby="wave-two-contracts" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="wave-two-contracts"
                className="text-xl font-semibold text-brand-900"
              >
                Available reports
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Only reports allowed for your role are shown.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              aria-label="Filter report area"
            >
              {(["all", "operations", "payroll"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={area === value}
                  onClick={() => setArea(value)}
                  className={`min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${area === value ? "bg-brand-800 text-white ring-brand-800" : "bg-white text-brand-900 ring-gray-300 hover:bg-brand-50"}`}
                >
                  {
                    (
                      {
                        all: "All",
                        operations: "Time and leave",
                        payroll: "Payroll",
                      } as const
                    )[value]
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {reports.map((report) => (
              <article
                key={report.key}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-semibold text-gray-950">{report.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge value={report.readiness} />
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {refreshLabels[report.refresh_tier]}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {reportDescription(report.name, report.grain)}
                </p>
                {report.caveat && (
                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    {report.caveat}
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500">
                      Data check
                    </dt>
                    <dd className="mt-1">
                      <StatusBadge value={report.technical_status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">
                      Business approval
                    </dt>
                    <dd className="mt-1">
                      <StatusBadge value={report.signoff_status} />
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2">
                  {report.definition_uuid && (
                    <Link
                      href={`/insight360/definitions/${report.definition_uuid}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-300 px-3 py-2 font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                    >
                      Open report{" "}
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  )}
                  {report.can_manage && (
                    <button
                      type="button"
                      disabled={refresh.isPending}
                      onClick={() => refresh.mutate(report.key)}
                      className="min-h-11 rounded-xl border border-gray-300 px-3 py-2 font-semibold text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                    >
                      Check data
                    </button>
                  )}
                  {report.can_signoff &&
                    report.technical_status === "passed" &&
                    report.signoff_status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => setSigning(report)}
                        className="min-h-11 rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                      >
                        Approve
                      </button>
                    )}
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <caption className="sr-only">
                  Time, leave and payroll reports
                </caption>
                <thead className="bg-brand-800 text-white">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Report</th>
                    <th className="px-4 py-4 font-semibold">
                      What it includes
                    </th>
                    <th className="px-4 py-4 font-semibold">Data check</th>
                    <th className="px-4 py-4 font-semibold">
                      Business approval
                    </th>
                    <th className="px-4 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr
                      key={report.key}
                      className="align-top transition-colors hover:bg-brand-50/70"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-950">
                          {report.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusBadge value={report.readiness} />
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {refreshLabels[report.refresh_tier]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-sm text-gray-800">
                          {reportDescription(report.name, report.grain)}
                        </p>
                        {report.caveat && (
                          <p className="mt-2 max-w-sm text-xs leading-5 text-amber-800">
                            {report.caveat}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={report.technical_status} />
                        {report.reconciliation && (
                          <p className="mt-3 text-xs text-gray-600">
                            Checked{" "}
                            {new Date(
                              report.reconciliation.data_as_of,
                            ).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={report.signoff_status} />
                        {report.signed_off_at && (
                          <p className="mt-2 text-xs text-gray-600">
                            {new Date(report.signed_off_at).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-40 flex-col gap-2">
                          {report.definition_uuid && (
                            <Link
                              href={`/insight360/definitions/${report.definition_uuid}`}
                              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-300 px-3 py-2 font-semibold text-brand-800 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            >
                              Open report{" "}
                              <ExternalLink
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            </Link>
                          )}
                          {report.can_manage && (
                            <button
                              type="button"
                              disabled={refresh.isPending}
                              onClick={() => refresh.mutate(report.key)}
                              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            >
                              <RefreshCw
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                              Check data
                            </button>
                          )}
                          {report.can_signoff &&
                            report.technical_status === "passed" &&
                            report.signoff_status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => setSigning(report)}
                                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                              >
                                <ShieldCheck
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                />
                                Approve
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reports.length === 0 && (
              <p className="p-10 text-center text-sm text-gray-600">
                No reports are visible in this area for your role.
              </p>
            )}
          </div>
          {reports.length === 0 && (
            <p className="rounded-xl bg-white p-10 text-center text-sm text-gray-600 md:hidden">
              No reports are visible in this area for your role.
            </p>
          )}
        </section>

        {signing && (
          <section
            aria-labelledby="business-approval"
            className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm"
          >
            <h2
              id="business-approval"
              className="text-lg font-semibold text-gray-950"
            >
              Approve {signing.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Record the business or finance review used to approve this report.
            </p>
            <label
              htmlFor="business-approval-note"
              className="mt-4 block text-sm font-semibold text-gray-900"
            >
              Approval note
            </label>
            <textarea
              id="business-approval-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={note.trim().length < 10 || signOff.isPending}
                onClick={() =>
                  signOff.mutate({
                    reportKey: signing.key,
                    approvalNote: note.trim(),
                  })
                }
                className="transition-colors min-h-11 cursor-pointer rounded-xl bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                {signOff.isPending ? "Approving…" : "Approve report"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSigning(null);
                  setNote("");
                }}
                className="transition-colors min-h-11 cursor-pointer rounded-xl border border-gray-300 px-5 py-2 font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
              >
                Cancel
              </button>
            </div>
            {signOff.error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                Approval could not be recorded. Check the latest data check and
                your approval role.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
