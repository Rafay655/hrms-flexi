"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { KbEditor } from "@/components/flexi-desk/KbEditor";

export default function EditKbArticlePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const article = useQuery({ queryKey: flexiDeskKeys.kbArticle(uuid), queryFn: () => flexiDeskService.getKbArticleForEdit(uuid), retry: false });
  const status = (article.error as { response?: { status?: number } } | null)?.response?.status;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/flexi-desk/knowledge-base" className="text-sm text-gray-500 hover:underline">← Knowledge base</Link>
      {article.isPending ? (
        <div className="text-sm text-gray-500" aria-busy="true">Loading…</div>
      ) : article.isError || !article.data ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          {status === 403 ? "You do not have permission to edit articles." : status === 404 ? "We could not find that article." : "Could not load this article."}
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-gray-900">{article.data.title}</h1>
          <div className="rounded-lg border border-gray-200 bg-white p-5"><KbEditor key={article.data.updated_at} article={article.data} /></div>
        </>
      )}
    </div>
  );
}
