"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { insight360Service } from "@/services/insight360";
import { useAppSelector } from "@/store/hooks";
import type { Insight360ReleaseCheck } from "@/types/insight360";
import { ErrorPanel, LoadingPanel, PageHeader } from "../_components/Insight360Ui";

function StatusBadge({ value }: { value: string }) {
  const style = value === "passed" || value === "released" || value === "success"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : value === "failed" || value === "blocked"
      ? "bg-red-50 text-red-800 ring-red-200"
      : value === "waived" || value === "replaced"
        ? "bg-slate-100 text-slate-800 ring-slate-300"
        : "bg-amber-50 text-amber-900 ring-amber-200";
  const labels: Record<string, string> = { passed: "Complete", success: "Complete", released: "Available", failed: "Needs attention", blocked: "Needs attention", waived: "Accepted exception", replaced: "Replaced", pending: "Not complete", running: "Running", approved: "Approved", pending_sme: "Awaiting approval" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>{labels[value] ?? value.replaceAll("_", " ")}</span>;
}

export default function Insight360ReleasePage() {
  const client = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [releaseStatus, setReleaseStatus] = useState("all");
  const [editing, setEditing] = useState<Insight360ReleaseCheck | null>(null);
  const [checkStatus, setCheckStatus] = useState<"passed" | "failed" | "waived">("passed");
  const [evidence, setEvidence] = useState("");
  const [signoffNote, setSignoffNote] = useState("");
  const [sampleSize, setSampleSize] = useState(5);
  const canViewRefreshJobs = permissions.includes("insight360.snapshot.manage");

  const inventory = useQuery({ queryKey: ["insight360", "release-inventory"], queryFn: insight360Service.releaseInventory });
  const readiness = useQuery({ queryKey: ["insight360", "release-readiness"], queryFn: insight360Service.releaseReadiness, refetchInterval: 30000 });
  const finalWave = useQuery({ queryKey: ["insight360", "catalogue-wave-3"], queryFn: insight360Service.catalogueWaveThree });
  const audits = useQuery({ queryKey: ["insight360", "release-audits"], queryFn: insight360Service.releaseAudits, refetchInterval: 15000 });
  const refreshJobs = useQuery({ queryKey: ["insight360", "analytics", "refresh-jobs"], queryFn: () => insight360Service.refreshJobs({ per_page: 10 }), enabled: canViewRefreshJobs, refetchInterval: 15000 });
  const updateCheck = useMutation({
    mutationFn: ({ key, status, note }: { key: string; status: "passed" | "failed" | "waived"; note: string }) => insight360Service.updateReleaseCheck(key, { status, evidence: note }),
    onSuccess: () => { setEditing(null); setEvidence(""); client.invalidateQueries({ queryKey: ["insight360", "release-readiness"] }); },
  });
  const refreshFinal = useMutation({
    mutationFn: () => insight360Service.refreshCatalogueWaveThree("graphs_employees_joining_vs_exit"),
    onSuccess: () => client.invalidateQueries({ queryKey: ["insight360", "catalogue-wave-3"] }),
  });
  const signoffFinal = useMutation({
    mutationFn: () => insight360Service.signOffCatalogueWaveThreeReport("graphs_employees_joining_vs_exit", signoffNote.trim()),
    onSuccess: () => { setSignoffNote(""); client.invalidateQueries({ queryKey: ["insight360", "catalogue-wave-3"] }); client.invalidateQueries({ queryKey: ["insight360", "release-readiness"] }); },
  });
  const runAudit = useMutation({
    mutationFn: () => insight360Service.runReleaseAudit(sampleSize),
    onSuccess: () => { client.invalidateQueries({ queryKey: ["insight360", "release-audits"] }); client.invalidateQueries({ queryKey: ["insight360", "release-readiness"] }); },
  });

  const reports = useMemo(() => (inventory.data?.reports ?? []).filter((report) => {
    const needle = query.trim().toLowerCase();
    return (category === "all" || report.category === category)
      && (releaseStatus === "all" || report.release_status === releaseStatus)
      && (!needle || `${report.name} ${report.key} ${report.category} ${report.dependency ?? ""}`.toLowerCase().includes(needle));
  }), [category, inventory.data?.reports, query, releaseStatus]);

  if (inventory.isLoading || readiness.isLoading || finalWave.isLoading || audits.isLoading) return <div className="min-h-full bg-brand-100 p-6"><LoadingPanel label="Loading data quality" /></div>;
  if (inventory.error || readiness.error || finalWave.error || audits.error || !inventory.data || !readiness.data || !finalWave.data || !audits.data) return <div className="min-h-full bg-brand-100 p-6"><ErrorPanel message="Data quality information is not available right now." /></div>;

  const gate = readiness.data.summary;
  const finalReport = finalWave.data.reports.find((report) => report.key === "graphs_employees_joining_vs_exit") ?? finalWave.data.reports[0];
  const latestAudit = audits.data.runs[0];
  const auditActive = audits.data.runs.some((run) => run.status === "pending" || run.status === "running");
  const cards = [
    ["Report inventory", `${inventory.data.summary.closed}/${inventory.data.summary.total}`, "Reports accounted for"],
    ["Ready to use", `${inventory.data.summary.executable_launch_reports}/${inventory.data.summary.launch_candidates}`, "Priority reports available"],
    ["Checks complete", `${gate.passed}/${gate.total}`, "Quality checks recorded"],
    ["Needs attention", gate.open_release_blockers, gate.release_ready ? "Everything is ready" : "Review or evidence required"],
  ];

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader eyebrow="Administration" title="Data quality and availability" description="See which reports are ready to use, what has been checked and what still needs attention." />

        <section aria-label="Data quality summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, detail]) => <article key={String(label)} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-brand-900">{value}</p><p className="mt-1 text-xs text-gray-600">{detail}</p></article>)}
        </section>

        <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${gate.release_ready ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
          {gate.release_ready ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />}
          <p><strong>{gate.release_ready ? "All required checks are complete." : "Some checks still need attention."}</strong> Open the readiness checklist below to see what is missing and who needs to act.</p>
        </div>

        {canViewRefreshJobs && <section aria-labelledby="refresh-job-history" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-200 p-5"><h2 id="refresh-job-history" className="text-lg font-semibold text-brand-900">Data refresh history</h2><p className="mt-1 text-sm leading-6 text-gray-600">Recent snapshot, catalogue and attrition refreshes with real processing outcomes.</p></div>{refreshJobs.isLoading ? <div className="p-5"><LoadingPanel label="Loading refresh history" /></div> : refreshJobs.error || !refreshJobs.data ? <div className="p-5"><ErrorPanel message="Refresh history is unavailable." /></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Insight360 refresh job history</caption><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600"><tr><th className="px-5 py-3">Refresh</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Records</th><th className="px-5 py-3 text-right">Duration</th><th className="px-5 py-3">Started</th></tr></thead><tbody className="divide-y divide-gray-100">{refreshJobs.data.items.map((run) => <tr key={run.uuid} className="transition-colors hover:bg-brand-50/70"><td className="px-5 py-4 font-semibold capitalize text-gray-900">{run.job_type.replaceAll("_", " ")}</td><td className="px-5 py-4"><StatusBadge value={run.status} />{run.error_message && <p className="mt-1 max-w-xs text-xs text-red-700">{run.error_message}</p>}</td><td className="px-5 py-4 text-right text-gray-700">{run.records_processed.toLocaleString()}</td><td className="px-5 py-4 text-right text-gray-700">{run.duration_ms === null ? "—" : `${run.duration_ms.toLocaleString()} ms`}</td><td className="px-5 py-4 text-gray-700">{new Date(run.started_at).toLocaleString()}</td></tr>)}</tbody></table></div>{refreshJobs.data.items.length === 0 && <p className="p-6 text-sm text-gray-600">No refresh jobs have run yet.</p>}</>}</section>}

        <section aria-labelledby="final-launch-report" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Recently added report</p><h2 id="final-launch-report" className="mt-2 text-xl font-semibold text-brand-900">{finalReport.name}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">Monthly joiners, completed exits and net workforce movement.</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge value={finalReport.technical_status} /><StatusBadge value={finalReport.signoff_status} /></div></div>
            <div className="flex flex-wrap gap-2">{finalReport.definition_uuid && <Link href={`/insight360/definitions/${finalReport.definition_uuid}`} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open report <ExternalLink aria-hidden="true" className="h-4 w-4" /></Link>}{finalReport.can_manage && <button type="button" disabled={refreshFinal.isPending} onClick={() => refreshFinal.mutate()} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshFinal.isPending ? "animate-spin motion-reduce:animate-none" : ""}`} />{refreshFinal.isPending ? "Checking…" : "Check data"}</button>}</div>
          </div>
          {finalReport.can_signoff && finalReport.technical_status === "passed" && finalReport.signoff_status !== "approved" && <div className="mt-5 border-t border-gray-200 pt-5"><label htmlFor="final-report-signoff" className="text-sm font-semibold text-gray-900">Business approval note</label><textarea id="final-report-signoff" rows={3} value={signoffNote} onChange={(event) => setSignoffNote(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-base outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-200" /><button type="button" disabled={signoffNote.trim().length < 10 || signoffFinal.isPending} onClick={() => signoffFinal.mutate()} className="transition-colors mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Approve report</button></div>}
        </section>

        <details className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <summary className="min-h-11 cursor-pointer text-lg font-semibold text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Technical system checks</summary>
          <section aria-labelledby="production-audit" className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="production-audit" className="text-xl font-semibold text-brand-900">System health test</h2><p className="mt-1 max-w-3xl text-sm text-gray-600">Check report speed, company-data separation and background processing. This section is intended for administrators.</p></div>{readiness.data.permissions.can_manage && <div className="flex flex-wrap items-end gap-2"><label htmlFor="audit-samples" className="text-sm font-semibold text-gray-900">Reports to test<select id="audit-samples" value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} disabled={auditActive || runAudit.isPending} className="mt-1 block min-h-11 rounded-xl border border-gray-300 bg-white px-3 disabled:opacity-60">{[3, 5, 10, 15, 20].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" disabled={auditActive || runAudit.isPending} onClick={() => runAudit.mutate()} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"><Activity aria-hidden="true" className={`h-4 w-4 ${runAudit.isPending ? "animate-pulse motion-reduce:animate-none" : ""}`} />{auditActive ? "Test running" : runAudit.isPending ? "Starting…" : "Run system test"}</button></div>}</div>
          {runAudit.isSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">The system test has started. Results update automatically.</p>}
          {runAudit.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">The system test could not start. Another test may already be running.</p>}
          {latestAudit?.metrics && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dashboard p95</p><p className="mt-2 text-2xl font-bold text-brand-900">{latestAudit.metrics.dashboard.p95_ms} ms</p><p className="mt-1 text-xs text-gray-600">{latestAudit.metrics.dashboard.samples} cached samples</p></article><article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview p95</p><p className="mt-2 text-2xl font-bold text-brand-900">{latestAudit.metrics.preview.p95_ms} ms</p><p className="mt-1 text-xs text-gray-600">10-row bounded preview</p></article><article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tenant mismatches</p><p className="mt-2 text-2xl font-bold text-brand-900">{latestAudit.metrics.integrity.tenant_linkage_mismatches}</p><p className="mt-1 text-xs text-gray-600">Cross-company relational links</p></article><article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Queue exceptions</p><p className="mt-2 text-2xl font-bold text-brand-900">{latestAudit.metrics.queue.failed_jobs + latestAudit.metrics.queue.stale_jobs}</p><p className="mt-1 text-xs text-gray-600">Failed or waiting over 15 minutes</p></article></div>}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><caption className="sr-only">Insight360 system test history</caption><thead className="bg-brand-800 text-white"><tr><th className="px-4 py-4 font-semibold">Test</th><th className="px-4 py-4 font-semibold">Status</th><th className="px-4 py-4 font-semibold">Response time</th><th className="px-4 py-4 font-semibold">Checks</th><th className="px-4 py-4 font-semibold">Started by</th></tr></thead><tbody className="divide-y divide-gray-100">{audits.data.runs.map((run) => <tr key={run.uuid} className="transition-colors align-top hover:bg-brand-50/70"><td className="px-4 py-4"><p className="font-semibold text-gray-950">{run.uuid.slice(0, 8)}</p><p className="mt-1 text-xs text-gray-500">{run.sample_size} reports</p></td><td className="px-4 py-4"><StatusBadge value={run.status} />{run.error_message && <p className="mt-2 max-w-xs text-xs text-red-700">{run.error_message}</p>}</td><td className="px-4 py-4 text-gray-700">{run.metrics ? <><p>Dashboard {run.metrics.dashboard.p95_ms} ms</p><p className="mt-1">Report {run.metrics.preview.p95_ms} ms</p></> : "Waiting for results"}</td><td className="px-4 py-4 text-gray-700">{run.checks ? `${Object.values(run.checks).filter((check) => check.status === "passed").length}/${Object.keys(run.checks).length} complete` : "In progress"}</td><td className="px-4 py-4 text-gray-700"><p>{run.requested_by ?? "Scheduled"}</p><p className="mt-1 text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</p></td></tr>)}</tbody></table></div>{audits.data.runs.length === 0 && <p className="p-8 text-center text-sm text-gray-600">No system tests have run yet.</p>}</div>
          </section>
        </details>

        <section aria-labelledby="hardening-checks" className="space-y-3">
          <div><h2 id="hardening-checks" className="text-xl font-semibold text-brand-900">Readiness checklist</h2><p className="mt-1 text-sm text-gray-600">Complete each required check or record an approved exception before wider use.</p></div>
          <div className="grid gap-3 lg:grid-cols-2">{readiness.data.checks.map((check) => <article key={check.key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{check.category} · {check.is_automated ? "Automated" : "Evidence required"}</p><h3 className="mt-1 font-semibold text-gray-950">{check.label}</h3></div><StatusBadge value={check.status} /></div><p className="mt-2 text-sm text-gray-700">Target: {check.target}</p><p className="mt-2 text-xs leading-5 text-gray-600">{check.evidence ?? "No evidence recorded yet."}</p>{check.verified_at && <p className="mt-2 text-xs text-gray-500">Verified {new Date(check.verified_at).toLocaleString()}{check.verified_by ? ` by ${check.verified_by}` : ""}</p>}{readiness.data.permissions.can_manage && !check.is_automated && <button type="button" onClick={() => { setEditing(check); setEvidence(check.evidence ?? ""); setCheckStatus(check.status === "pending" ? "passed" : check.status); }} className="transition-colors mt-3 min-h-11 cursor-pointer rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Record evidence</button>}</article>)}</div>
        </section>

        {editing && <section aria-labelledby="release-evidence" className="rounded-xl border border-brand-300 bg-white p-5 shadow-sm"><h2 id="release-evidence" className="text-lg font-semibold text-brand-900">Update {editing.label}</h2><div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]"><label className="text-sm font-semibold text-gray-900">Result<select value={checkStatus} onChange={(event) => setCheckStatus(event.target.value as "passed" | "failed" | "waived")} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3"><option value="passed">Complete</option><option value="failed">Needs attention</option><option value="waived">Approved exception</option></select></label><label className="text-sm font-semibold text-gray-900">Supporting note<textarea rows={4} value={evidence} onChange={(event) => setEvidence(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-base outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-200" /></label></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={evidence.trim().length < 10 || updateCheck.isPending} onClick={() => updateCheck.mutate({ key: editing.key, status: checkStatus, note: evidence.trim() })} className="transition-colors min-h-11 cursor-pointer rounded-xl bg-brand-800 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{updateCheck.isPending ? "Saving…" : "Save update"}</button><button type="button" onClick={() => { setEditing(null); setEvidence(""); }} className="transition-colors min-h-11 cursor-pointer rounded-xl border border-gray-300 px-5 py-2 font-semibold text-gray-800 hover:bg-gray-50">Cancel</button></div>{updateCheck.error && <p role="alert" className="mt-3 text-sm text-red-700">The update could not be saved.</p>}</section>}

        <section aria-labelledby="master-catalogue" className="space-y-4">
          <div><h2 id="master-catalogue" className="text-xl font-semibold text-brand-900">Report inventory</h2><p className="mt-1 text-sm text-gray-600">Review every requested report and whether it is available, needs attention or has been replaced.</p></div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]"><label className="relative block"><span className="sr-only">Search reports</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports or notes" className="min-h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-base outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-200" /></label><label><span className="sr-only">Filter category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3"><option value="all">All categories</option>{Object.keys(inventory.data.categories).map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span className="sr-only">Filter availability</span><select value={releaseStatus} onChange={(event) => setReleaseStatus(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3"><option value="all">All statuses</option><option value="released">Available</option><option value="blocked">Needs attention</option><option value="replaced">Replaced</option></select></label></div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><caption className="sr-only">Insight360 report inventory</caption><thead className="bg-brand-800 text-white"><tr><th className="px-4 py-4 font-semibold">Report</th><th className="px-4 py-4 font-semibold">Category</th><th className="px-4 py-4 font-semibold">Status</th><th className="px-4 py-4 font-semibold">Availability</th><th className="px-4 py-4 font-semibold">Notes</th></tr></thead><tbody className="divide-y divide-gray-100">{reports.map((report) => <tr key={report.key} className="transition-colors align-top hover:bg-brand-50/70"><td className="px-4 py-4"><p className="font-semibold text-gray-950">{report.name}</p></td><td className="px-4 py-4 text-gray-700">{report.category}</td><td className="px-4 py-4"><StatusBadge value={report.release_status} /></td><td className="px-4 py-4 text-gray-700">{report.launch_candidate ? (report.executable ? "Ready to use" : "Not ready yet") : "Planned"}</td><td className="max-w-md px-4 py-4 text-gray-700">{report.dependency ?? (report.replaced_by ? `Replaced by ${report.replaced_by}` : "No open issues")}</td></tr>)}</tbody></table></div>{reports.length === 0 && <p className="p-10 text-center text-sm text-gray-600">No reports match these filters.</p>}</div>
        </section>
      </div>
    </div>
  );
}
