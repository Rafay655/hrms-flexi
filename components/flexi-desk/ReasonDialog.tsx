"use client";

import React from "react";
import { validateReason } from "@/lib/flexi-desk";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  /** Server-side problem to show (e.g. no escalation target, level ceiling). */
  serverError?: string | null;
  /** Overrides the default 20-2000 character rule (e.g. the identity-reveal reason is capped at 500). */
  validate?: (reason: string) => string | null;
  helpText?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

/** Escalate / de-escalate: a real reason (20+ characters) is mandatory, checked here and again by the API. */
export function ReasonDialog({ open, title, description, confirmLabel, busy, serverError, validate = validateReason, helpText, onCancel, onConfirm }: Props) {
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
      textareaRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const problem = validate(reason);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!problem) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) {
          onCancel();
        }
      }}
    >
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl">
        <h2 id="reason-dialog-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
        <div>
          <label htmlFor="reason-text" className="mb-1 block text-sm font-medium text-gray-800">Reason</label>
          <textarea
            id="reason-text"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={4}
            aria-invalid={touched && !!problem}
            aria-describedby="reason-help"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
          <p id="reason-help" className={`mt-1 text-xs ${touched && problem ? "text-red-700" : "text-gray-500"}`}>
            {touched && problem ? problem : (helpText ?? "Explain why. This is recorded on the ticket history and is never shown to the requester.")}
          </p>
        </div>
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{serverError}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
