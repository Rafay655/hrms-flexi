"use client";

import { useMemo } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Lightweight markdown editor with a live text preview.
 * We intentionally do NOT convert to HTML here — the backend (CommonMark)
 * is the single source of truth for HTML rendering and escaping.
 */
export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Write Markdown + Mustache…"}
          spellCheck
          className="h-[280px] w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm leading-6 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{lineCount} lines</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Raw preview</p>
        <pre className="h-[280px] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 text-xs">
{value || "// Live preview of the raw template"}
        </pre>
      </div>
    </div>
  );
}