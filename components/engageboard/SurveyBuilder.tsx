"use client";

import { useId } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StoreSurveyQuestionInput, SurveyQuestionType } from "@/types/engageboard-pulsecheck.types";

const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  scale_1_5: "Scale (1-5)",
  scale_1_10: "Scale (1-10)",
  scale_0_10: "Scale (0-10)",
  emoji: "Emoji scale",
  yes_no: "Yes / No",
  text: "Free text",
  mcq: "Multiple choice",
};

export interface DraftQuestion extends StoreSurveyQuestionInput {
  key: string;
}

/**
 * <SurveyBuilder/> — 03-design-system.md §4 row 4. Drag-drop question list
 * (`@dnd-kit`, precedent: `app/(system)/insight360/dashboard/page.tsx`'s
 * DndContext/SortableContext wiring), progressive disclosure by question type
 * (a Scale question never shows MCQ-option inputs, per ui-ux-pro-max's
 * `progressive-disclosure`). Per §7's `dragging-alternative`, up/down buttons
 * are provided alongside drag-and-drop as a non-drag reorder path.
 */
export function SurveyBuilder({
  questions,
  onChange,
}: {
  questions: DraftQuestion[];
  onChange: (next: DraftQuestion[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addQuestion() {
    onChange([
      ...questions,
      {
        key: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        question_text: "",
        question_type: "scale_1_10",
        is_required: true,
        allow_comment: false,
        options: [],
      },
    ]);
  }

  function updateQuestion(key: string, patch: Partial<DraftQuestion>) {
    onChange(questions.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }

  function removeQuestion(key: string) {
    onChange(questions.filter((q) => q.key !== key));
  }

  function move(key: string, direction: -1 | 1) {
    const index = questions.findIndex((q) => q.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= questions.length) return;
    onChange(arrayMove(questions, index, target));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.key === active.id);
    const newIndex = questions.findIndex((q) => q.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(questions, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.key)} strategy={verticalListSortingStrategy}>
          {questions.map((question, index) => (
            <SortableQuestionCard
              key={question.key}
              question={question}
              index={index}
              total={questions.length}
              onUpdate={(patch) => updateQuestion(question.key, patch)}
              onRemove={() => removeQuestion(question.key)}
              onMove={(dir) => move(question.key, dir)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
          No questions yet. Add your first question to start building this survey.
        </p>
      )}

      <Button type="button" variant="outline" onClick={addQuestion} className="w-fit">
        <Plus className="mr-1.5 h-4 w-4" /> Add Question
      </Button>
    </div>
  );
}

function SortableQuestionCard({
  question,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  question: DraftQuestion;
  index: number;
  total: number;
  onUpdate: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.key });
  const uid = useId();
  const isScale = question.question_type === "scale_1_5" || question.question_type === "scale_1_10" || question.question_type === "scale_0_10";
  const isMcq = question.question_type === "mcq";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-xs ${isDragging ? "z-20 opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder question ${index + 1}`}
          className="mt-2 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Question {index + 1}</span>
            <div className="ml-auto flex items-center gap-1">
              {/* Non-drag reorder alternative, per §7's dragging-alternative requirement. */}
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Move question up"
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                aria-label="Move question down"
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                aria-label="Remove question"
                className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <Textarea
            value={question.question_text}
            onChange={(e) => onUpdate({ question_text: e.target.value })}
            placeholder="Question text"
            className="min-h-[60px]"
            aria-label={`Question ${index + 1} text`}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-type`} className="mb-1 block text-xs font-medium text-gray-500">
                Question type
              </label>
              <Select value={question.question_type} onValueChange={(v) => onUpdate({ question_type: v as SurveyQuestionType, options: [] })}>
                <SelectTrigger id={`${uid}-type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Switch checked={question.is_required ?? true} onCheckedChange={(v) => onUpdate({ is_required: v })} />
                Required
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Switch checked={question.allow_comment ?? false} onCheckedChange={(v) => onUpdate({ allow_comment: v })} />
                Allow comment
              </label>
            </div>
          </div>

          {/* Progressive disclosure: only the fields relevant to this question type are shown. */}
          {isScale && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="Low-end label (e.g. Not likely)"
                value={question.scale_min_label ?? ""}
                onChange={(e) => onUpdate({ scale_min_label: e.target.value })}
              />
              <Input
                placeholder="High-end label (e.g. Very likely)"
                value={question.scale_max_label ?? ""}
                onChange={(e) => onUpdate({ scale_max_label: e.target.value })}
              />
            </div>
          )}

          {isMcq && (
            <McqOptionsEditor
              options={question.options ?? []}
              onChange={(options) => onUpdate({ options })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function McqOptionsEditor({
  options,
  onChange,
}: {
  options: Array<{ option_text: string } | string>;
  onChange: (options: Array<{ option_text: string }>) => void;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { option_text: o } : o));

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">Answer options</p>
      {normalized.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={opt.option_text}
            onChange={(e) => {
              const next = [...normalized];
              next[i] = { option_text: e.target.value };
              onChange(next);
            }}
            placeholder={`Option ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(normalized.filter((_, j) => j !== i))}
            aria-label={`Remove option ${i + 1}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-400 hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...normalized, { option_text: "" }])}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Option
      </Button>
    </div>
  );
}

export default SurveyBuilder;
