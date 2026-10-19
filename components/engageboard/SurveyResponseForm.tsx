"use client";

import { useMemo, useState } from "react";
import { Angry, Frown, Meh, Smile, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { SubmitSurveyResponseAnswer, SurveyPublic, SurveyQuestion } from "@/types/engageboard-pulsecheck.types";

type AnswerMap = Record<number, { value: string | number; comment?: string }>;

const EMOJI_SCALE = [
  { value: 1, label: "Very dissatisfied", Icon: Angry },
  { value: 2, label: "Dissatisfied", Icon: Frown },
  { value: 3, label: "Neutral", Icon: Meh },
  { value: 4, label: "Satisfied", Icon: Smile },
  { value: 5, label: "Very satisfied", Icon: SmilePlus },
];

/**
 * <SurveyResponseForm/> — 03-design-system.md §4 row 5. One question per
 * screen-section (not a giant single-page form), scale questions as a
 * slider not a raw number input, emoji-scale as a labeled icon row — each
 * icon is always paired with a text label, never emoji-as-icon alone
 * (ui-ux-pro-max's explicit anti-pattern, §7 "color/icon is never the sole
 * signal" carried into this component too).
 */
export function SurveyResponseForm({
  survey,
  onSubmit,
  submitting,
}: {
  survey: SurveyPublic;
  onSubmit: (answers: SubmitSurveyResponseAnswer[]) => void;
  submitting?: boolean;
}) {
  const questions = useMemo(
    () => [...survey.questions].sort((a, b) => a.sort_order - b.sort_order),
    [survey.questions],
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [error, setError] = useState<string | null>(null);

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const current = question ? answers[question.id] : undefined;

  function setAnswer(value: string | number, comment?: string) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: { value, comment: comment ?? prev[question.id]?.comment } }));
    setError(null);
  }

  function setComment(comment: string) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: { value: prev[question.id]?.value ?? "", comment } }));
  }

  function goNext() {
    if (!question) return;
    if (question.is_required && (current === undefined || current.value === "")) {
      setError("This question is required before you can continue.");
      return;
    }
    if (isLast) {
      const payload: SubmitSurveyResponseAnswer[] = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id].value !== "")
        .map((q) => ({
          question_id: q.id,
          value: answers[q.id].value,
          comment: answers[q.id].comment || undefined,
        }));
      onSubmit(payload);
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  if (!question) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
        This survey has no questions yet.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-400">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-800 transition-all"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs" aria-live="polite">
        <h2 className="text-lg font-semibold text-brand-900">
          {question.question_text}
          {question.is_required && <span className="ml-1 text-red-500">*</span>}
        </h2>

        <div className="mt-6">
          <QuestionInput question={question} value={current?.value} onChange={setAnswer} />
        </div>

        {question.allow_comment && (
          <div className="mt-5">
            <label htmlFor={`comment-${question.id}`} className="mb-1 block text-xs font-medium text-gray-500">
              Additional comments (optional)
            </label>
            <Textarea
              id={`comment-${question.id}`}
              value={current?.comment ?? ""}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything you'd like to add..."
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || submitting}>
          Back
        </Button>
        <Button type="button" onClick={goNext} disabled={submitting}>
          {isLast ? (submitting ? "Submitting..." : "Submit") : "Next"}
        </Button>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
}) {
  switch (question.question_type) {
    case "scale_1_5":
    case "scale_1_10":
    case "scale_0_10": {
      const min = question.question_type === "scale_0_10" ? 0 : 1;
      const max = question.question_type === "scale_1_5" ? 5 : 10;
      const current = typeof value === "number" ? value : Math.round((min + max) / 2);
      return (
        <div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-pressed={value === n}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
                  value === n
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-brand-100/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Slider value={[current]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} aria-label={question.question_text} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>{question.scale_min_label || min}</span>
            <span>{question.scale_max_label || max}</span>
          </div>
        </div>
      );
    }

    case "emoji":
      return (
        <div className="flex flex-wrap justify-center gap-3">
          {EMOJI_SCALE.map(({ value: v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={value === v}
              className={`flex w-20 flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                value === v ? "border-brand-800 bg-brand-100/60" : "border-gray-200 hover:border-brand-300 hover:bg-brand-100/30"
              }`}
            >
              <Icon aria-hidden="true" className={`h-6 w-6 ${value === v ? "text-brand-800" : "text-gray-400"}`} />
              <span className="text-[11px] font-medium leading-tight text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      );

    case "yes_no":
      return (
        <div className="flex justify-center gap-3">
          {[
            { v: "yes", label: "Yes" },
            { v: "no", label: "No" },
          ].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={value === v}
              className={`min-w-[100px] rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors ${
                value === v ? "border-brand-800 bg-brand-800 text-white" : "border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      );

    case "mcq":
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.option_text)}
              aria-pressed={value === opt.option_text}
              className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                value === opt.option_text
                  ? "border-brand-800 bg-brand-100/60 text-brand-900"
                  : "border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              {opt.option_text}
            </button>
          ))}
        </div>
      );

    case "text":
    default:
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          className="min-h-[100px]"
          aria-label={question.question_text}
        />
      );
  }
}

export default SurveyResponseForm;
