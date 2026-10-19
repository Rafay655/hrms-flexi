"use client";

/**
 * Satisfaction survey for a resolved TICKET, shown to the requester only. It is feedback: submitting it never changes the
 * ticket (no reopen, no close), and the page says so. The survey is open once, for seven days after resolution.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { CSAT_LIMITS, formatTicketDate, parseApiError, ratingLabel, validateCsat } from "@/lib/flexi-desk";

type Props = { ticketUuid: string; resolved: boolean };

export function CsatCard({ ticketUuid, resolved }: Props) {
  const queryClient = useQueryClient();
  const [rating, setRating] = React.useState(0);
  const [helpful, setHelpful] = React.useState<boolean | null>(null);
  const [speed, setSpeed] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const [errors, setErrors] = React.useState<{ rating?: string; feedback?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const survey = useQuery({
    queryKey: flexiDeskKeys.csat(ticketUuid),
    queryFn: () => flexiDeskService.getCsat(ticketUuid),
    enabled: resolved,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      flexiDeskService.submitCsat(ticketUuid, {
        rating,
        resolver_helpful: helpful,
        speed_rating: speed || null,
        feedback: feedback.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flexiDeskKeys.csat(ticketUuid) }),
    onError: (err) => setFormError(parseApiError(err)?.message ?? "Could not send your feedback. Please try again."),
  });

  if (!resolved || survey.isPending || survey.isError || !survey.data) {
    return null;
  }

  const s = survey.data;

  if (s.state === "submitted") {
    return (
      <section aria-label="Your feedback" className="rounded-lg bg-black/[0.03] p-4 text-sm text-[var(--brand-800)]/80">
        Thank you. You rated this {s.rating} out of 5 on {formatTicketDate(s.submitted_at)}.
      </section>
    );
  }
  if (s.state === "expired") {
    return (
      <section aria-label="Feedback closed" className="rounded-lg bg-black/[0.03] p-4 text-sm text-[var(--brand-800)]/60">
        The feedback survey for this ticket closed on {formatTicketDate(s.expires_at)}.
      </section>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCsat({ rating, feedback });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length === 0) {
      submit.mutate();
    }
  };

  return (
    <section aria-labelledby="csat-heading" className="space-y-3 rounded-lg border border-black/10 p-4">
      <div>
        <h2 id="csat-heading" className="text-sm font-medium text-[var(--brand-800)]">How did we do?</h2>
        <p className="text-xs text-[var(--brand-800)]/60">Open until {formatTicketDate(s.expires_at)}. Your answer is feedback only and does not change this ticket.</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <fieldset>
          <legend className="mb-1 text-xs text-[var(--brand-800)]/70">Overall, how satisfied are you?</legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Overall rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${rating === n ? "border-[var(--brand-800)] bg-[var(--brand-800)] text-white" : "border-black/10"}`}>
                <input type="radio" name="csat-rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
                {n}
                <span className="sr-only"> {ratingLabel(n)}</span>
              </label>
            ))}
          </div>
          {rating > 0 && <p className="mt-1 text-xs text-[var(--brand-800)]/60">{ratingLabel(rating)}</p>}
          {errors.rating && <p role="alert" className="mt-1 text-xs text-red-700">{errors.rating}</p>}
        </fieldset>

        <fieldset className="flex items-center gap-3 text-sm">
          <legend className="mb-1 text-xs text-[var(--brand-800)]/70">Was the person who helped you helpful? (optional)</legend>
          <label className="flex items-center gap-1"><input type="radio" name="csat-helpful" checked={helpful === true} onChange={() => setHelpful(true)} />Yes</label>
          <label className="flex items-center gap-1"><input type="radio" name="csat-helpful" checked={helpful === false} onChange={() => setHelpful(false)} />No</label>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs text-[var(--brand-800)]/70">How was the speed of the response? (optional)</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs ${speed === n ? "border-[var(--brand-800)] bg-[var(--brand-800)] text-white" : "border-black/10"}`}>
                <input type="radio" name="csat-speed" value={n} checked={speed === n} onChange={() => setSpeed(n)} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="csat-feedback" className="mb-1 block text-xs text-[var(--brand-800)]/70">Anything you would like to add? (optional)</label>
          <textarea
            id="csat-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={CSAT_LIMITS.feedbackMax}
            className="w-full rounded-lg border border-black/10 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]"
          />
          <div className="flex justify-between text-xs text-[var(--brand-800)]/50">
            <span>{errors.feedback ?? ""}</span>
            <span>{feedback.length}/{CSAT_LIMITS.feedbackMax}</span>
          </div>
        </div>

        {formError && <p role="alert" className="text-xs text-red-700">{formError}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={submit.isPending} className="rounded-lg bg-[var(--brand-800)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            {submit.isPending ? "Sending…" : "Send feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}
