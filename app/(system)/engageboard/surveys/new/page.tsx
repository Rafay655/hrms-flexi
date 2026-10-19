"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SurveyBuilder, type DraftQuestion } from "@/components/engageboard/SurveyBuilder";
import { pulseCheckService } from "@/services/engageboard-pulsecheck.service";
import { departmentService } from "@/services/department.service";
import { locationService } from "@/services/location.service";
import { gradeBandService } from "@/services/grade-band.service";
import type { SurveyAnonymity, SurveyType, TargetAudienceType } from "@/types/engageboard-pulsecheck.types";

const SURVEY_TYPES: Array<{ value: SurveyType; label: string }> = [
  { value: "pulse", label: "Pulse Check" },
  { value: "onboarding", label: "Onboarding" },
  { value: "exit", label: "Exit" },
  { value: "custom", label: "Custom" },
];

const ANONYMITY_LEVELS: Array<{ value: SurveyAnonymity; label: string }> = [
  { value: "named", label: "Named" },
  { value: "semi_anonymous", label: "Semi-Anonymous" },
  { value: "fully_anonymous", label: "Fully Anonymous" },
];

const AUDIENCE_TYPES: Array<{ value: TargetAudienceType; label: string; disabled?: boolean }> = [
  { value: "all", label: "All employees" },
  { value: "department", label: "Specific departments" },
  { value: "location", label: "Specific locations" },
  { value: "grade", label: "Specific grade bands" },
  // Round-1 review (Defect 1): no numeric-employee-id search endpoint exists
  // to build a safe custom_group picker against (the only employee-search
  // service in this codebase, services/letterforge-employee-search.ts,
  // exposes uuid, not the numeric id SurveyService::resolveTargetAudience()
  // needs for a custom_group values[] match) — disabled rather than shipped
  // silently broken, per the reviewer's explicit fallback.
  { value: "custom_group", label: "Custom group (not yet supported)", disabled: true },
];

/**
 * Round-1 review, Defect 1 (gating): this page previously sent
 * `target_audience: { type, values: [] }` for department/location/grade with
 * no UI to actually pick values — `SurveyService.php:483` treats an empty
 * `values` array identically to `'all'`, so "Specific departments" silently
 * targeted the whole company. This picker wires real multi-select lists
 * against the existing FlexiMeta lookup services (`department.service.ts`,
 * `location.service.ts`, `grade-band.service.ts` — the same numeric `id`s
 * `EmployeeFieldResolver::getDepartmentId/getLocationId/getGradeBandId()`
 * resolve from `profile_data`, confirmed by reading that class directly), so
 * the ids submitted here actually match what the backend's
 * `resolveTargetAudience()` filters employees on.
 */
function AudienceValuesPicker({
  audienceType,
  selectedIds,
  onChange,
}: {
  audienceType: TargetAudienceType;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: ["flexi-meta", "departments", "audience-picker"],
    queryFn: () => departmentService.getAll({ per_page: 200 }),
    enabled: audienceType === "department",
    staleTime: 5 * 60_000,
  });
  const { data: locations, isLoading: loadingLocations } = useQuery({
    queryKey: ["flexi-meta", "locations", "audience-picker"],
    queryFn: () => locationService.getAll({ per_page: 200 }),
    enabled: audienceType === "location",
    staleTime: 5 * 60_000,
  });
  const { data: gradeBands, isLoading: loadingGradeBands } = useQuery({
    queryKey: ["flexi-meta", "grade-bands", "audience-picker"],
    queryFn: () => gradeBandService.getAll({ per_page: 200 }),
    enabled: audienceType === "grade",
    staleTime: 5 * 60_000,
  });

  if (audienceType === "all") return null;

  const options =
    audienceType === "department"
      ? (departments?.data ?? []).map((d) => ({ id: d.id, name: d.name }))
      : audienceType === "location"
        ? (locations?.data ?? []).map((l) => ({ id: l.id, name: l.name }))
        : (gradeBands?.data ?? []).map((g) => ({ id: g.id, name: g.name }));
  const loading = loadingDepartments || loadingLocations || loadingGradeBands;

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]);
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {audienceType === "department" ? "Departments" : audienceType === "location" ? "Locations" : "Grade bands"}
      </label>
      <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 p-1.5">
        {loading ? (
          <p className="px-2 py-3 text-xs text-gray-400">Loading options...</p>
        ) : options.length === 0 ? (
          <p className="px-2 py-3 text-xs text-gray-400">No options found.</p>
        ) : (
          options.map((opt) => (
            <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
              <Checkbox checked={selectedIds.includes(opt.id)} onCheckedChange={() => toggle(opt.id)} />
              {opt.name}
            </label>
          ))
        )}
      </div>
      {!loading && selectedIds.length === 0 && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          Select at least one — this survey cannot be created targeted to zero items.
        </p>
      )}
    </div>
  );
}

/**
 * `/engageboard/surveys/new` — 03-design-system.md §3.2. `<SurveyBuilder/>`
 * for the drag-drop question list; header fields call
 * `POST /engageboard/surveys` (EB-SUR-007) on submit, including any drafted
 * questions in the same request (SurveyService::create() accepts `questions[]`).
 */
export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyType>("pulse");
  const [anonymity, setAnonymity] = useState<SurveyAnonymity>("semi_anonymous");
  const [audienceType, setAudienceTypeRaw] = useState<TargetAudienceType>("all");
  const [audienceValues, setAudienceValues] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  // Values from one audience type never carry over to another (a department
  // id and a grade-band id are not interchangeable) — reset on every switch.
  function setAudienceType(next: TargetAudienceType) {
    setAudienceTypeRaw(next);
    setAudienceValues([]);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      pulseCheckService.createSurvey({
        title,
        survey_type: surveyType,
        anonymity,
        target_audience: { type: audienceType, values: audienceType === "all" ? [] : audienceValues },
        start_date: startDate,
        end_date: endDate || undefined,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          allow_comment: q.allow_comment,
          scale_min_label: q.scale_min_label,
          scale_max_label: q.scale_max_label,
          conditional_logic: q.conditional_logic,
          options: q.options,
        })),
      }),
    onSuccess: (survey) => {
      toast.success("Survey created.");
      router.push(`/engageboard/surveys/${survey.uuid}`);
    },
    onError: () => {
      toast.error("Could not create the survey. Please check the required fields and try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      toast.error("Title and start date are required.");
      return;
    }
    if (audienceType !== "all" && audienceValues.length === 0) {
      toast.error("Select at least one target for the chosen audience type.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · PulseCheck</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">New Survey</h1>
        <p className="text-sm text-gray-500">Build a pulse survey — header details, then questions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-500">
            Title
          </label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q1 Engagement Pulse" required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Survey type</label>
          <Select value={surveyType} onValueChange={(v) => setSurveyType(v as SurveyType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SURVEY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Anonymity</label>
          <Select value={anonymity} onValueChange={(v) => setAnonymity(v as SurveyAnonymity)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANONYMITY_LEVELS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-gray-400">Cannot be changed after the survey is published.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Target audience</label>
          <Select value={audienceType} onValueChange={(v) => setAudienceType(v as TargetAudienceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value} disabled={a.disabled}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AudienceValuesPicker audienceType={audienceType} selectedIds={audienceValues} onChange={setAudienceValues} />

        <div>
          <label htmlFor="start_date" className="mb-1 block text-xs font-medium text-gray-500">
            Start date
          </label>
          <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="end_date" className="mb-1 block text-xs font-medium text-gray-500">
            End date (optional)
          </label>
          <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Questions</h2>
        <SurveyBuilder questions={questions} onChange={setQuestions} />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={createMutation.isPending || (audienceType !== "all" && audienceValues.length === 0)}
        >
          {createMutation.isPending ? "Creating..." : "Create Survey"}
        </Button>
      </div>
    </form>
  );
}
