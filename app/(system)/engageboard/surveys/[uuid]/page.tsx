"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pulseCheckService } from "@/services/engageboard-pulsecheck.service";

const STATUS_TONES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-emerald-100 text-emerald-800",
  closed: "bg-brand-100 text-brand-800",
  archived: "bg-gray-100 text-gray-400",
};

/**
 * `/engageboard/surveys/[uuid]` — detail + analytics/participation tabs +
 * export button. The Analytics tab and export button call the PulseCheck
 * endpoints directly (GET .../analytics, GET .../export —
 * `SurveyAnalyticsController`; verified as a 100% pass-through against
 * `SurveyReportService::resultsSummary()`, no data lost). The Participation
 * tab calls G22's report endpoint instead
 * (`GET /engageboard/reports/survey/{uuid}/participation`,
 * `SurveyReportService::participationReport()`, per this node's brief and
 * Round-1 review Defect 2) — a strict superset of the native
 * `SurveyService::participation()` payload, adding a per-department
 * response-rate heatmap.
 */
export default function SurveyDetailPage() {
  const params = useParams<{ uuid: string }>();
  const uuid = params.uuid;
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);

  const { data: survey, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "surveys", uuid],
    queryFn: () => pulseCheckService.getSurvey(uuid),
    staleTime: 30_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["engageboard", "surveys", uuid, "analytics"],
    queryFn: () => pulseCheckService.getAnalytics(uuid),
    enabled: !!survey && survey.status !== "draft",
  });

  const { data: participation } = useQuery({
    queryKey: ["engageboard", "surveys", uuid, "participation-report"],
    queryFn: () => pulseCheckService.getParticipationReport(uuid),
    enabled: !!survey && survey.status !== "draft",
  });

  const publishMutation = useMutation({
    mutationFn: () => pulseCheckService.publishSurvey(uuid),
    onSuccess: (result) => {
      toast.success(`Survey published — ${result.invitations_created} invitation(s) sent.`);
      queryClient.invalidateQueries({ queryKey: ["engageboard", "surveys", uuid] });
    },
    onError: () => toast.error("Could not publish this survey. Please refresh and try again."),
  });

  const remindMutation = useMutation({
    mutationFn: () => pulseCheckService.remind(uuid),
    onSuccess: (result) => toast.success(`${result.reminded} reminder(s) sent.`),
    onError: () => toast.error("Could not send reminders."),
  });

  async function handleExport(format: "csv" | "pdf") {
    if (!survey) return;
    setExporting(true);
    try {
      await pulseCheckService.exportSurvey(uuid, survey.title, format);
    } catch {
      toast.error("Could not export this survey. Please refresh and try again.");
    } finally {
      setExporting(false);
    }
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        Could not load this survey. Please refresh.
      </div>
    );
  }

  if (isLoading || !survey) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · PulseCheck</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{survey.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONES[survey.status]}`}>
              {survey.status}
            </span>
            <span className="text-xs text-gray-400">{survey.anonymity.replace("_", " ")}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {survey.status === "draft" && (
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Send className="mr-1.5 h-4 w-4" /> {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          )}
          {survey.status === "published" && (
            <Button variant="outline" onClick={() => remindMutation.mutate()} disabled={remindMutation.isPending}>
              <Users className="mr-1.5 h-4 w-4" /> {remindMutation.isPending ? "Sending..." : "Send Reminders"}
            </Button>
          )}
          {survey.status !== "draft" && (
            <>
              <Button variant="outline" onClick={() => handleExport("csv")} disabled={exporting}>
                <Download className="mr-1.5 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")} disabled={exporting}>
                <Download className="mr-1.5 h-4 w-4" /> Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
            {survey.questions && survey.questions.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {survey.questions
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((q, i) => (
                    <li key={q.id} className="px-5 py-3.5">
                      <p className="text-sm font-medium text-brand-900">
                        {i + 1}. {q.question_text}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {q.question_type} {q.is_required ? "· required" : "· optional"}
                      </p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-400">No questions on this survey.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {survey.status === "draft" ? (
            <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              Analytics are available once this survey is published.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {(analytics ?? []).map((row) => (
                <div key={row.question_id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                  <p className="text-sm font-semibold text-brand-900">{row.question_text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{row.response_count} response(s)</p>
                  {row.average !== undefined && row.average !== null && (
                    <p className="mt-2 text-sm text-gray-600">
                      Average: <span className="font-semibold tabular-nums">{row.average}</span> (min {row.min}, max {row.max})
                    </p>
                  )}
                  {row.distribution && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(row.distribution).map(([key, count]) => (
                        <span key={key} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                  {row.comments && row.comments.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {row.comments.map((c, i) => (
                        <li key={i} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          &ldquo;{c}&rdquo;
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {(!analytics || analytics.length === 0) && (
                <p className="px-5 py-10 text-center text-sm text-gray-400">No analytics yet.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="participation">
          {survey.status === "draft" ? (
            <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              Participation data is available once this survey is published.
            </p>
          ) : participation ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-xs">
                  <p className="text-2xl font-semibold tabular-nums text-brand-900">{participation.rate}%</p>
                  <p className="text-xs text-gray-400">Response rate</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-xs">
                  <p className="text-2xl font-semibold tabular-nums text-brand-900">{participation.invited}</p>
                  <p className="text-xs text-gray-400">Invited</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-xs">
                  <p className="text-2xl font-semibold tabular-nums text-brand-900">{participation.responded}</p>
                  <p className="text-xs text-gray-400">Responded</p>
                </div>
              </div>
              {participation.department_heatmap && participation.department_heatmap.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="border-b border-gray-100 px-5 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">Response Rate by Department</h3>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {participation.department_heatmap.map((row) => (
                      <li key={row.department_id ?? "unassigned"} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                        <span className="text-gray-600">
                          {row.department_id !== null ? `Department #${row.department_id}` : "Unassigned"}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {row.responded}/{row.invited}
                          </span>
                          <span className="font-semibold tabular-nums text-gray-800">{row.rate}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">Non-Responders</h3>
                </div>
                {participation.non_responders.length > 0 ? (
                  <ul className="divide-y divide-gray-50">
                    {participation.non_responders.map((nr) => (
                      <li key={nr.employee_id} className="px-5 py-2.5 text-sm text-gray-600">
                        {nr.employee_code ?? `Employee #${nr.employee_id}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">Everyone has responded.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
