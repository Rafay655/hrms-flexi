"use client";

/**
 * FlexiDesk (system shell) — Knowledge Base article editor (flexidesk.kb.manage).
 * Draft first, publish deliberately: a live article needs a category and at least 100 characters (Rules V19). The body is stored
 * as plain text/Markdown and shown to employees as text. The address (slug) can be set until the article is published.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { KB_LIMITS, formatTicketDate, parseApiError, parseTags, publishBlockers, validateKbArticle, type KbFormErrors } from "@/lib/flexi-desk";
import type { KbArticle } from "@/types/flexi-desk.types";

const input = "w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const primary = "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const secondary = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-50";

export function KbEditor({ article }: { article?: KbArticle }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState(article?.title ?? "");
  const [summary, setSummary] = React.useState(article?.summary ?? "");
  const [body, setBody] = React.useState(article?.body ?? "");
  const [tagsText, setTagsText] = React.useState((article?.tags ?? []).join(", "));
  const [category, setCategory] = React.useState(article?.category?.uuid ?? "");
  const [slug, setSlug] = React.useState(article?.slug ?? "");
  const [errors, setErrors] = React.useState<KbFormErrors>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const categories = useQuery({ queryKey: flexiDeskKeys.categories(), queryFn: flexiDeskService.getCategoryOptions, staleTime: 300_000, retry: false });

  const refresh = () => queryClient.invalidateQueries({ queryKey: [...flexiDeskKeys.all, "kb"] });
  const fail = (err: unknown) => {
    setMessage(null);
    setError(parseApiError(err)?.message ?? "That did not work. Please try again.");
  };

  const payload = () => ({
    title: title.trim(),
    summary: summary.trim() || null,
    body,
    tags: parseTags(tagsText),
    category_uuid: category || null,
    ...(slug.trim() && slug !== article?.slug ? { slug: slug.trim() } : {}),
  });

  const validate = () => {
    const found = validateKbArticle({ title, body, summary, tags: parseTags(tagsText) });
    setErrors(found);
    setError(null);

    return Object.keys(found).length === 0;
  };

  const save = useMutation({
    mutationFn: () => (article ? flexiDeskService.updateKbArticle(article.uuid, payload()) : flexiDeskService.createKbArticle(payload())),
    onSuccess: (saved) => {
      refresh();
      setMessage("Saved.");
      if (!article) {
        router.replace(`/flexi-desk/knowledge-base/${saved.uuid}`);
      }
    },
    onError: fail,
  });

  const act = useMutation({
    mutationFn: (action: "publish" | "archive" | "unarchive" | "reviewed") => flexiDeskService.kbAction(article!.uuid, action),
    onSuccess: () => {
      refresh();
      setMessage("Done.");
      router.refresh();
    },
    onError: fail,
  });

  // Publishing acts on the saved article, so the form is saved first: otherwise Publish would be enabled from edits the server has not seen.
  const publish = async () => {
    if (!validate()) return;
    try {
      await save.mutateAsync();
      act.mutate("publish");
    } catch {
      // save.onError already shows the reason
    }
  };

  const blockers = publishBlockers({ category: category || null, body });
  const isPublished = article?.status === "published";

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label htmlFor="kb-title" className="mb-1 block text-xs text-gray-500">Title</label>
          <input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={KB_LIMITS.titleMax} aria-invalid={!!errors.title} className={input} />
          {errors.title && <p role="alert" className="mt-1 text-xs text-red-700">{errors.title}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kb-category" className="mb-1 block text-xs text-gray-500">Category (needed to publish)</label>
            <select id="kb-category" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              <option value="">No category</option>
              {categories.data?.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="kb-slug" className="mb-1 block text-xs text-gray-500">Address {isPublished ? "(fixed once published)" : "(optional, generated from the title)"}</label>
            <input id="kb-slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isPublished} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="kb-summary" className="mb-1 block text-xs text-gray-500">Summary (shown in lists and suggestions)</label>
          <input id="kb-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={KB_LIMITS.summaryMax} className={input} />
          {errors.summary && <p role="alert" className="mt-1 text-xs text-red-700">{errors.summary}</p>}
        </div>
        <div>
          <label htmlFor="kb-tags" className="mb-1 block text-xs text-gray-500">Tags (comma separated; they help suggestions find this article)</label>
          <input id="kb-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={input} />
          {errors.tags && <p role="alert" className="mt-1 text-xs text-red-700">{errors.tags}</p>}
        </div>
        <div>
          <label htmlFor="kb-body" className="mb-1 block text-xs text-gray-500">Content</label>
          <textarea id="kb-body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} aria-invalid={!!errors.body} className={`${input} font-mono`} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{errors.body ?? ""}</span>
            <span>{body.trim().length} characters</span>
          </div>
        </div>
      </div>

      {article && (
        <p className="text-xs text-gray-500">
          {article.status === "published" ? "Published" : article.status === "archived" ? "Archived" : "Draft"} · updated {formatTicketDate(article.updated_at)}
          {article.last_reviewed_at ? ` · last reviewed ${formatTicketDate(article.last_reviewed_at)}` : ""} · {article.views ?? 0} views
        </p>
      )}
      {(!article || article.status === "draft") && blockers.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-amber-800" aria-label="Before this can be published">
          {blockers.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {article?.status === "published" && (
          <>
            <button type="button" disabled={act.isPending} onClick={() => act.mutate("reviewed")} className={secondary}>Mark as reviewed</button>
            <button type="button" disabled={act.isPending} onClick={() => act.mutate("archive")} className={secondary}>Archive</button>
          </>
        )}
        {article?.status === "archived" && <button type="button" disabled={act.isPending} onClick={() => act.mutate("unarchive")} className={secondary}>Move back to draft</button>}
        {article && article.status !== "published" && (
          <button type="button" disabled={act.isPending || blockers.length > 0 || save.isPending} onClick={publish} className={secondary}>Publish</button>
        )}
        <button type="button" disabled={save.isPending} onClick={() => validate() && save.mutate()} className={primary}>{save.isPending ? "Saving…" : article ? "Save changes" : "Save as draft"}</button>
      </div>
    </div>
  );
}
