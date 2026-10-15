"use client";

/**
 * Printable loan statement (gap #13). Renders the server-generated statement PDF
 * inline (also archived to DMS server-side) with Print + Download actions.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";

export default function LoanStatementPage() {
  const uuid = String(useParams().uuid);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    loanHubService
      .fetchStatementBlobUrl(uuid)
      .then((u) => {
        if (cancelled) {
          window.URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [uuid]);

  return (
    <div className="flex h-full flex-col gap-4 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/loan-hub/${uuid}`} className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Loan
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-brand-900">Loan Statement</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => document.querySelector<HTMLIFrameElement>("#stmt-frame")?.contentWindow?.print()}
            disabled={!url}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={() => loanHubService.downloadStatement(uuid, uuid)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        {error ? (
          <p className="px-5 py-14 text-center text-sm text-red-500">Could not load the statement.</p>
        ) : !url ? (
          <p className="px-5 py-14 text-center text-sm text-gray-400">Generating statement…</p>
        ) : (
          <iframe id="stmt-frame" src={url} title="Loan statement" className="h-[78vh] w-full" />
        )}
      </div>
    </div>
  );
}
