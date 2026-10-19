"use client";

/**
 * FlexiDesk — small shared pieces for the grievance screens (employee and staff shells):
 * a stage badge, the seven-stage timeline, and the evidence panel. No confidential text is rendered here.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import {
  GRIEVANCE_LIMITS,
  GRIEVANCE_STAGES,
  evidenceProblem,
  formatFileSize,
  formatTicketDate,
  grievanceStatusLabel,
  grievanceStatusTone,
  parseApiError,
  stageState,
} from "@/lib/flexi-desk";
import type { GrievanceAttachment, GrievanceStatus } from "@/types/flexi-desk.types";

/** Stage is always text; the tone is decoration only. */
export function GrievanceStatusBadge({ status }: { status: GrievanceStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", grievanceStatusTone(status))}>
      {grievanceStatusLabel(status)}
    </span>
  );
}

/** The seven stages, rendered from the fixed matrix so the UI can never invent one. */
export function GrievanceTimeline({ current }: { current: GrievanceStatus }) {
  return (
    <ol aria-label="Grievance progress" className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
      {GRIEVANCE_STAGES.map((stage) => {
        const state = stageState(stage, current);

        return (
          <li
            key={stage}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-1.5",
              state === "current" ? "font-semibold text-gray-900" : state === "done" ? "text-gray-600" : "text-gray-400",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                state === "current" ? "bg-indigo-600" : state === "done" ? "bg-emerald-500" : "border border-gray-300 bg-white",
              )}
            />
            {grievanceStatusLabel(stage)}
            <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current stage)" : " (upcoming)"}</span>
          </li>
        );
      })}
    </ol>
  );
}

type EvidenceProps = { grievanceUuid: string; canUpload: boolean };

/**
 * Evidence list + upload. Files are neutral-named by the server ("Evidence-1.pdf"); the original name is shown only
 * to the person who uploaded it. Downloads stream through the API and are audited on every read.
 */
export function EvidencePanel({ grievanceUuid, canUpload }: EvidenceProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);

  const evidence = useQuery({
    queryKey: flexiDeskKeys.grievanceEvidence(grievanceUuid),
    queryFn: () => flexiDeskService.getGrievanceEvidence(grievanceUuid),
    retry: false,
  });

  const upload = useMutation({
    mutationFn: () => flexiDeskService.addGrievanceEvidence(grievanceUuid, files),
    onSuccess: () => {
      setFiles([]);
      setError(null);
      if (input.current) {
        input.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievanceEvidence(grievanceUuid) });
    },
    onError: (err) => setError(parseApiError(err)?.message ?? "Could not add the files. Please try again."),
  });

  const choose = (list: File[]) => {
    setFiles(list);
    const problem = list.length > GRIEVANCE_LIMITS.maxFilesPerUpload
      ? `You can attach at most ${GRIEVANCE_LIMITS.maxFilesPerUpload} files at a time.`
      : list.map((f) => evidenceProblem(f)).find(Boolean) ?? null;
    setError(problem);
  };

  const download = async (a: GrievanceAttachment) => {
    setError(null);
    try {
      await flexiDeskService.downloadEvidence(grievanceUuid, a.uuid, a.original_name ?? a.display_name);
    } catch {
      setError("Could not download that file. Please try again.");
    }
  };

  const items = evidence.data ?? [];

  return (
    <section aria-labelledby="evidence-heading" className="space-y-3">
      <h2 id="evidence-heading" className="text-sm font-medium text-gray-900">Evidence</h2>

      {evidence.isPending ? (
        <p className="text-sm text-gray-500" aria-busy="true">Loading evidence…</p>
      ) : evidence.isError ? (
        <p role="alert" className="text-sm text-red-700">Could not load the evidence list.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No evidence has been added.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.uuid} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <span className="truncate">
                {a.original_name ?? a.display_name} <span className="text-xs text-gray-500">{formatFileSize(a.file_size)} · {formatTicketDate(a.created_at)}</span>
              </span>
              <button type="button" onClick={() => download(a)} className="ml-3 shrink-0 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                Download
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="space-y-2">
          <label className="cursor-pointer text-sm text-gray-700 underline hover:no-underline">
            Add evidence
            <input
              ref={input}
              type="file"
              multiple
              accept={GRIEVANCE_LIMITS.extensions.map((x) => `.${x}`).join(",")}
              className="sr-only"
              onChange={(e) => choose(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span>{files.map((f) => f.name).join(", ")}</span>
              <button
                type="button"
                disabled={upload.isPending || !!error}
                onClick={() => upload.mutate()}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
              >
                {upload.isPending ? "Uploading…" : "Upload"}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500">
            PDF, Word, Excel or image files up to 10 MB. Files are stored privately and are only ever opened after a permission check that is recorded.
          </p>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </section>
  );
}
