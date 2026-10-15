"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LetterPageHeader } from "../../components/letter-ui";
import {
  useLetterTemplates,
  letterTemplateKeys,
} from "@/hooks/use-letter-forge";
import {
  getTemplateVersions,
  getLetterForgeError,
} from "@/services/letter-forge";

export default function TemplateReviewQueue() {
  const [page, setPage] = useState(1);
  const templates = useLetterTemplates({
    page,
    per_page: 10,
    sort: "updated_at",
    sort_dir: "desc",
  });
  const rows = templates.data?.data ?? [];
  const histories = useQueries({
    queries: rows.map((template) => ({
      queryKey: [...letterTemplateKeys.all, "versions", template.uuid],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getTemplateVersions(template.uuid, signal),
      retry: false,
    })),
  });
  const loading =
    templates.isFetching || histories.some((query) => query.isPending);
  const entries = rows.flatMap((template, i) =>
    (histories[i].data?.data.versions ?? [])
      .filter((version) => version.status === "review_required")
      .map((version) => ({ template, version })),
  );
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <LetterPageHeader title="Template review queue" description="Review submitted versions before they become available for letter generation." back={{ href: "/letter-forge/templates", label: "Back to templates" }} />
      <p className="text-sm text-muted-foreground">
        Pending reviews among templates on this page. Open a review to compare
        content and approve or reject.
      </p>
      {loading && <p role="status">Checking version histories…</p>}
      {templates.error && (
        <p className="text-destructive">
          {getLetterForgeError(templates.error).message}
        </p>
      )}
      {histories.some((query) => query.isError) && (
        <p className="text-destructive">
          Some histories could not be loaded. Open a template to retry its
          history.
        </p>
      )}
      {!loading && !entries.length && (
        <p>No pending reviews found on this page.</p>
      )}
      {entries.map(({ template, version }) => (
        <div
          key={`${template.uuid}-${version.id}`}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="font-semibold">
              {template.name} · Version {version.version}
            </h2>
            <p className="text-sm text-muted-foreground">
              Maker:{" "}
              {version.maker?.name ??
                `User #${version.created_by ?? "unknown"}`}{" "}
              · Submitted:{" "}
              {version.submitted_at
                ? new Date(version.submitted_at).toLocaleString()
                : "—"}
            </p>
          </div>
          <Button asChild>
            <Link href={`/letter-forge/templates/${template.uuid}/review`}>
              Open review
            </Link>
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span>
          Template page {page} of{" "}
          {Math.max(1, templates.data?.meta?.last_page ?? 1)}
        </span>
        <Button
          variant="outline"
          disabled={
            loading ||
            !templates.data?.meta ||
            page >= templates.data.meta.last_page
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
