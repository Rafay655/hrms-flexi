export type PerformProCycleState =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED"
  | "CANCELLED";

export type PerformProParticipantStatus = "ENROLLED" | "WITHDRAWN";

export type PerformProCyclePhaseType =
  | "GOAL_SETTING"
  | "CHECK_INS"
  | "SELF_REVIEW"
  | "MANAGER_REVIEW"
  | "FEEDBACK_360"
  | "CALIBRATION"
  | "OUTCOME_APPROVAL"
  | "RELEASE";

export type PerformProReadiness = {
  ready: boolean;
  blockers: string[];
  missing_required_bindings: string[];
  participant_count: number;
  enrolled_participant_count: number;
  phase_count: number;
};

export type PerformProCycle = {
  uuid: string;
  code: string;
  name: string;
  cycle_type: string;
  period_start: string;
  period_end: string;
  timezone: string;
  state: PerformProCycleState;
  active_phase: PerformProCyclePhaseType | null;
  lock_version: number;
  population_finalized: boolean;
  published_at: string | null;
  activated_at: string | null;
  phase_count: number;
  participant_count: number;
  enrolled_participant_count: number;
  withdrawn_participant_count: number;
};

export type PerformProPhase = {
  uuid: string;
  type: PerformProCyclePhaseType;
  sequence: number;
  opens_at: string;
  due_at: string;
  grace_ends_at: string | null;
  status: "PENDING" | "OPEN" | "CLOSED" | "SKIPPED";
  transition_mode: "MANUAL" | "AUTOMATIC";
  lock_version: number;
  opened_at: string | null;
  closed_at: string | null;
};

export type PerformProPhaseProgressionResult = PerformProCycle & {
  closed_phase: PerformProPhase;
  opened_phase: PerformProPhase | null;
  opened_task_count: number;
  cancelled_task_count: number;
  replayed: boolean;
};

export type PerformProPhaseTransition = {
  uuid: string;
  command: "ADVANCE" | "CLOSE";
  trigger: "MANUAL" | "AUTOMATIC";
  from_phase: PerformProCyclePhaseType;
  to_phase: PerformProCyclePhaseType | null;
  expected_cycle_version: number;
  resulting_cycle_version: number;
  opened_task_count: number;
  cancelled_task_count: number;
  occurred_at: string;
};

export type PerformProTemplateBinding = {
  uuid: string;
  type: string;
  key: string;
  source_uuid: string;
  source_version: number;
  content_hash: string;
  source_snapshot: Record<string, unknown>;
  required: boolean;
  lock_version: number;
};

export type PerformProCycleDetail = PerformProCycle & {
  configuration_hash: string | null;
  finalization_hash: string | null;
  population_finalization_hash: string | null;
  population_policy_version: number | null;
  population_as_of: string | null;
  readiness: PerformProReadiness | null;
  phases: PerformProPhase[];
  phase_transitions: PerformProPhaseTransition[];
  template_bindings: PerformProTemplateBinding[];
};

export type PerformProParticipant = {
  id: number;
  uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  status: PerformProParticipantStatus;
  organization: Record<string, unknown>;
  enrolled_at: string;
  status_changed_at: string;
  status_reason_code: string | null;
  lock_version: number;
};

export type PerformProReason = { code: string; label: string };

export type PerformProReviewTask = {
  uuid: string;
  cycle_uuid: string;
  cycle_name?: string;
  phase_uuid: string;
  participant_uuid: string;
  subject_employee_uuid: string;
  subject?: Record<string, unknown>;
  assignee_employee_uuid: string;
  task_type: string;
  assignee_role: "EMPLOYEE" | "MANAGER" | "REVIEWER";
  status: "OPEN" | "COMPLETED" | "WAIVED" | "CANCELLED";
  opens_at: string;
  due_at: string;
  opened_at: string;
  completed_at: string | null;
  waived_at?: string | null;
  cancelled_at?: string | null;
  review_round?: number;
  source_review_task_uuid?: string | null;
  lock_version: number;
  has_submission?: boolean | null;
};

export type PerformProSelfReviewGoal = {
  uuid: string;
  goal_type: PerformProGoal["goal_type"];
  title: string;
  description: string | null;
  weightage_pct: number;
  start_value: number;
  target_value: number | null;
  current_value: number;
  target_unit: string | null;
  due_date: string | null;
  status: PerformProGoal["status"];
  progress_pct: number | null;
  expected_progress_pct: number | null;
  confidence_score: number | null;
  goal_version: number;
  latest_checkin_at: string | null;
  rollup_evidence_hash: string | null;
  key_results: PerformProSelfReviewGoal[];
};

export type PerformProSelfReviewAnswer = {
  goal_uuid: string;
  rating: number;
  comment: string;
};

export type PerformProSelfReviewSnapshot = {
  uuid: string;
  source_task_version: number;
  source_cycle_version: number;
  source_goal_count: number;
  goals: PerformProSelfReviewGoal[];
  goals_hash: string;
  snapshot_version: string;
  captured_at: string;
};

export type PerformProSelfReviewDraft = {
  uuid: string;
  draft_version: number;
  expected_task_version: number;
  answers: PerformProSelfReviewAnswer[];
  answers_hash: string;
  overall_summary: string | null;
  achievements: string | null;
  challenges: string | null;
  occurred_at: string;
};

export type PerformProSelfReviewSubmission = {
  uuid: string;
  source_draft_version: number;
  answers: PerformProSelfReviewAnswer[];
  answers_hash: string;
  overall_summary: string | null;
  achievements: string | null;
  challenges: string | null;
  weighted_score: number | null;
  expected_task_version: number;
  resulting_task_version: number;
  occurred_at: string;
};

export type PerformProSelfReviewDetail = {
  task: PerformProReviewTask;
  snapshot: PerformProSelfReviewSnapshot;
  draft: PerformProSelfReviewDraft | null;
  submission: PerformProSelfReviewSubmission | null;
  can_edit: boolean;
};

export type PerformProSaveSelfReviewDraftInput = {
  detail: PerformProSelfReviewDetail;
  answers: PerformProSelfReviewAnswer[];
  overallSummary: string;
  achievements: string;
  challenges: string;
};

export type PerformProManagerReviewEmployeeSubmission = {
  uuid: string;
  source_draft_version: number;
  answers: PerformProSelfReviewAnswer[];
  answers_hash: string;
  overall_summary: string | null;
  achievements: string | null;
  challenges: string | null;
  weighted_score: number | null;
  occurred_at: string;
};

export type PerformProManagerReviewSnapshot = {
  uuid: string;
  source_task_version: number;
  source_cycle_version: number;
  source_goal_count: number;
  goals: PerformProSelfReviewGoal[];
  employee_evidence_status: "SUBMITTED" | "NOT_SUBMITTED";
  employee_submission: PerformProManagerReviewEmployeeSubmission | null;
  evidence_hash: string;
  snapshot_version: string;
  captured_at: string;
};

export type PerformProManagerReviewDraft = {
  uuid: string;
  draft_version: number;
  expected_task_version: number;
  answers: PerformProSelfReviewAnswer[];
  answers_hash: string;
  overall_summary: string | null;
  strengths: string | null;
  development_areas: string | null;
  manager_weighted_score: number | null;
  score_variance: number | null;
  occurred_at: string;
};

export type PerformProManagerReviewSubmission = {
  uuid: string;
  source_draft_version: number;
  answers: PerformProSelfReviewAnswer[];
  answers_hash: string;
  overall_summary: string;
  strengths: string | null;
  development_areas: string | null;
  manager_weighted_score: number;
  employee_weighted_score: number | null;
  score_variance: number | null;
  expected_task_version: number;
  resulting_task_version: number;
  occurred_at: string;
};

export type PerformProManagerGoalComparison = {
  goal_uuid: string;
  employee_rating: number | null;
  manager_rating: number | null;
  variance: number | null;
};

export type PerformProManagerScoreComparison = {
  employee_score: number | null;
  manager_score: number | null;
  variance: number | null;
  goal_comparisons: PerformProManagerGoalComparison[];
};

export type PerformProManagerReviewDetail = {
  task: PerformProReviewTask;
  snapshot: PerformProManagerReviewSnapshot;
  draft: PerformProManagerReviewDraft | null;
  submission: PerformProManagerReviewSubmission | null;
  score_comparison: PerformProManagerScoreComparison;
  can_edit: boolean;
};

export type PerformProSaveManagerReviewDraftInput = {
  detail: PerformProManagerReviewDetail;
  answers: PerformProSelfReviewAnswer[];
  overallSummary: string;
  strengths: string;
  developmentAreas: string;
};

export type PerformProReviewWorkflowAction =
  | "RETURN_TO_EMPLOYEE"
  | "REOPEN"
  | "WAIVE";

export type PerformProReviewWaiverExceptionCode =
  | "EMPLOYEE_UNAVAILABLE"
  | "MANAGER_UNAVAILABLE"
  | "LEAVE_OF_ABSENCE"
  | "ROLE_VACANT"
  | "PROCESS_EXCEPTION"
  | "OTHER";

export type PerformProReviewWorkflowTransition = {
  uuid: string;
  action: PerformProReviewWorkflowAction;
  exception_code: PerformProReviewWaiverExceptionCode | null;
  reason: string;
  source_task_uuid: string;
  resulting_task_uuid: string | null;
  source_status_before: PerformProReviewTask["status"];
  source_status_after: PerformProReviewTask["status"];
  expected_source_task_version: number;
  resulting_source_task_version: number;
  resulting_review_round: number | null;
  evidence_hash: string;
  notification_template_key: string | null;
  occurred_at: string;
};

export type PerformProReviewWorkflow = {
  capabilities: {
    can_return: boolean;
    can_reopen: boolean;
    can_waive: boolean;
  };
  history: PerformProReviewWorkflowTransition[];
};

export type PerformProReviewWorkflowResult = {
  source_task: {
    uuid: string;
    task_type: string;
    assignee_role: "EMPLOYEE" | "MANAGER" | "REVIEWER";
    status: PerformProReviewTask["status"];
    review_round: number;
    source_review_task_uuid: string | null;
    lock_version: number;
    completed_at: string | null;
    waived_at: string | null;
    cancelled_at: string | null;
  };
  resulting_task: {
    uuid: string;
    task_type: string;
    assignee_role: "EMPLOYEE" | "MANAGER" | "REVIEWER";
    status: PerformProReviewTask["status"];
    review_round: number;
    source_review_task_uuid: string | null;
    lock_version: number;
    completed_at: string | null;
    waived_at: string | null;
    cancelled_at: string | null;
  } | null;
  transition: PerformProReviewWorkflowTransition;
};

export type PerformProReviewWorkflowInput = {
  task: PerformProReviewTask;
  action: "return" | "reopen" | "waive";
  reason: string;
  exceptionCode?: PerformProReviewWaiverExceptionCode | null;
};

export type PerformProFeedback360Relationship =
  | "MANAGER"
  | "PEER"
  | "DIRECT_REPORT"
  | "CROSS_FUNCTIONAL"
  | "INTERNAL_CUSTOMER"
  | "OTHER";

export type PerformProFeedback360Nomination = {
  uuid: string;
  reviewer_employee_uuid: string | null;
  display_name: string;
  relationship_category: PerformProFeedback360Relationship;
  nomination_source: "EMPLOYEE" | "MANAGER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  identity_redacted: boolean;
};

export type PerformProFeedback360Policy = {
  binding_uuid: string;
  binding_version: number;
  review_form_binding_uuid: string;
  review_form_version: number;
  anonymity_mode: "IDENTIFIED" | "CONFIDENTIAL" | "ANONYMOUS";
  minimum_reviewers: number;
  maximum_reviewers: number;
  minimum_peer_reviewers: number;
  minimum_anonymous_group_size: number;
  manager_approval_required: boolean;
  employee_nominations_allowed: boolean;
  relationship_categories: PerformProFeedback360Relationship[];
};

export type PerformProFeedback360Roster = {
  participant_uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  phase_uuid: string;
  subject_employee_uuid: string;
  subject: Record<string, unknown>;
  manager_employee_uuid: string | null;
  roster_uuid: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "FINALIZED";
  lock_version: number;
  policy: PerformProFeedback360Policy;
  nominations: PerformProFeedback360Nomination[];
  counts: { total: number; peers: number };
  capabilities: {
    can_nominate: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_finalize: boolean;
    is_manager_view: boolean;
  };
  submitted_at: string | null;
  approved_at: string | null;
  finalized_at: string | null;
  evidence: {
    uuid: string;
    policy_hash: string;
    roster_hash: string;
    source_roster_version: number;
    occurred_at: string;
  } | null;
};

export type PerformProFeedback360EligibleReviewer = {
  employee_uuid: string;
  participant_uuid: string;
  display_name: string;
  employee_code: string | null;
  organization: Record<string, unknown>;
  relationship_categories: PerformProFeedback360Relationship[];
  nomination_source: "EMPLOYEE" | "MANAGER";
  eligible: boolean;
  conflicts: string[];
};

export type PerformProFeedback360NominationInput = {
  reviewer_employee_uuid: string;
  relationship_category: PerformProFeedback360Relationship;
};

export type PerformProFeedback360ResponseTask = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  participant_uuid: string;
  subject_employee_uuid: string;
  subject_name: string;
  task_type: "FEEDBACK_360";
  assignee_role: "REVIEWER";
  status: "OPEN" | "COMPLETED" | "WAIVED" | "CANCELLED";
  opens_at: string;
  due_at: string;
  completed_at: string | null;
  lock_version: number;
  has_submission: boolean | null;
};

export type PerformProFeedback360RatingLevel = {
  value: number;
  label: string;
};

export type PerformProFeedback360Question = {
  key: string;
  prompt: string;
  help_text: string | null;
  section_key: string;
  section_label: string;
  required: boolean;
  rating_required: boolean;
  comment_required: boolean;
};

export type PerformProFeedback360QuestionnaireSnapshot = {
  uuid: string;
  relationship_category: PerformProFeedback360Relationship;
  anonymity_mode: "IDENTIFIED" | "CONFIDENTIAL" | "ANONYMOUS";
  questionnaire: {
    title: string;
    instructions: string | null;
    questions: PerformProFeedback360Question[];
    rating_scale: {
      title: string;
      levels: PerformProFeedback360RatingLevel[];
    };
  };
  questionnaire_hash: string;
  snapshot_version: string;
  source_task_version: number;
  captured_at: string;
};

export type PerformProFeedback360Answer = {
  question_key: string;
  rating: number | null;
  comment: string;
};

export type PerformProFeedback360Draft = {
  uuid: string;
  draft_version: number;
  expected_task_version: number;
  answers: PerformProFeedback360Answer[];
  answers_hash: string;
  overall_comment: string | null;
  occurred_at: string;
};

export type PerformProFeedback360Submission = {
  uuid: string;
  source_draft_version: number;
  answers: PerformProFeedback360Answer[];
  answers_hash: string;
  overall_comment: string | null;
  response_hash: string;
  anonymity_mode: "IDENTIFIED" | "CONFIDENTIAL" | "ANONYMOUS";
  identity_visibility: "IDENTIFIED" | "RESTRICTED";
  expected_task_version: number;
  resulting_task_version: number;
  occurred_at: string;
};

export type PerformProFeedback360ResponseDetail = {
  task: PerformProFeedback360ResponseTask;
  snapshot: PerformProFeedback360QuestionnaireSnapshot;
  draft: PerformProFeedback360Draft | null;
  submission: PerformProFeedback360Submission | null;
  can_edit: boolean;
  privacy: {
    content_access: "ASSIGNED_REVIEWER_ONLY";
    identity_handling: "IDENTIFIED" | "CONFIDENTIAL" | "ANONYMOUS";
    notice: string;
  };
};

export type PerformProSaveFeedback360DraftInput = {
  detail: PerformProFeedback360ResponseDetail;
  answers: PerformProFeedback360Answer[];
  overallComment: string;
};

export type PerformProFeedback360ResultState =
  | "NOT_CALCULATED"
  | "BLOCKED"
  | "READY_FOR_RELEASE"
  | "RELEASED";

export type PerformProFeedback360AggregateComment = {
  comment_id: string;
  relationship_category: PerformProFeedback360Relationship;
  text: string;
};

export type PerformProFeedback360RelationshipResult = {
  relationship_category: PerformProFeedback360Relationship;
  response_count: number | null;
  suppressed: boolean;
  suppression_reason:
    | "AGGREGATION_BLOCKED"
    | "MINIMUM_GROUP_SIZE_NOT_MET"
    | null;
  average_rating: number | null;
};

export type PerformProFeedback360QuestionResult = {
  key: string;
  prompt: string;
  section_key: string;
  section_label: string;
  response_count: number;
  average_rating: number | null;
  distribution: Record<string, number>;
  comments: PerformProFeedback360AggregateComment[];
};

export type PerformProFeedback360AggregationRun = {
  uuid: string;
  run_version: number;
  status: "READY" | "BLOCKED";
  anonymity_mode: "IDENTIFIED" | "CONFIDENTIAL" | "ANONYMOUS";
  minimum_group_size: number;
  source_task_count: number;
  source_submission_count: number;
  source_waived_count: number;
  source_cancelled_count: number;
  aggregation: {
    identity_disclosure: "NONE";
    overall_score: number | null;
    question_count: number;
    questions: PerformProFeedback360QuestionResult[];
    rating_scale: {
      title?: string;
      levels: PerformProFeedback360RatingLevel[];
    };
    relationship_summary: PerformProFeedback360RelationshipResult[];
    response_count: number;
    overall_comments: PerformProFeedback360AggregateComment[];
  };
  suppression: {
    blocked_reasons: string[];
    minimum_group_size: number;
    suppressed_group_count: number;
  };
  aggregate_hash: string;
  occurred_at: string;
};

export type PerformProFeedback360ResultRelease = {
  uuid: string;
  aggregation_run_uuid: string;
  audience: {
    identity_disclosure: "NONE";
    review_admin: boolean;
    snapshotted_manager: boolean;
    subject_employee: boolean;
  };
  release_hash: string;
  occurred_at: string;
};

export type PerformProFeedback360Result = {
  participant_uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  subject_employee_uuid: string;
  subject: Record<string, unknown>;
  phase_status: "PENDING" | "OPEN" | "CLOSED" | "SKIPPED";
  aggregate: PerformProFeedback360AggregationRun | null;
  release: PerformProFeedback360ResultRelease | null;
  result_state: PerformProFeedback360ResultState;
  capabilities: {
    can_recalculate: boolean;
    can_release: boolean;
    is_subject_view: boolean;
    is_manager_view: boolean;
  };
  privacy: {
    identity_disclosure: "NONE";
    notice: string;
  };
};

export type PerformProGoal = {
  uuid: string;
  participant_uuid: string;
  employee_uuid: string;
  parent_goal_uuid: string | null;
  goal_type: "KPI" | "KRA" | "OKR_OBJECTIVE" | "OKR_KEY_RESULT";
  cascade_level: "COMPANY" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
  title: string;
  description: string | null;
  weightage_pct: number;
  start_value: number;
  target_value: number | null;
  current_value: number;
  target_unit: string | null;
  confidence_score: number | null;
  due_date: string | null;
  status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "BEHIND" | "COMPLETED" | "CANCELLED";
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason: string | null;
  can_revise: boolean;
  progress_pct: number | null;
  expected_progress_pct: number | null;
  latest_checkin_at: string | null;
  okr_rollup: PerformProOkrRollup | null;
  auto_score: boolean;
  lock_version: number;
  key_results: PerformProGoal[];
};

export type PerformProOkrRollupComponent = {
  goal_uuid: string;
  title: string;
  approval_status: PerformProGoal["approval_status"];
  status: Exclude<PerformProGoal["status"], "CANCELLED">;
  included: boolean;
  exclusion_reason: "CANCELLED" | "NOT_APPROVED" | null;
  weightage_pct: number;
  progress_pct: number | null;
  expected_progress_pct: number;
  weighted_contribution_pct: number;
  confidence_score: number | null;
  goal_version: number;
  latest_checkin_uuid: string | null;
  latest_checkin_at: string | null;
};

export type PerformProOkrRollup = {
  uuid: string | null;
  certified: boolean;
  formula_version: string;
  progress_pct: number | null;
  expected_progress_pct: number | null;
  health_status: Exclude<PerformProGoal["status"], "CANCELLED">;
  confidence_score: number | null;
  configured_weight_pct: number;
  included_weight_pct: number;
  key_result_count: number;
  included_key_result_count: number;
  expected_objective_version: number | null;
  resulting_objective_version: number | null;
  component_hash: string | null;
  components: PerformProOkrRollupComponent[];
  source_checkin_uuid: string | null;
  occurred_at: string | null;
};

export type PerformProGoalCheckin = {
  uuid: string;
  previous_value: number;
  current_value: number;
  progress_pct: number | null;
  expected_progress_pct: number | null;
  health_status: Exclude<PerformProGoal["status"], "CANCELLED">;
  confidence_score: number | null;
  expected_goal_version: number;
  resulting_goal_version: number;
  note: string | null;
  blockers: string[];
  occurred_at: string;
};

export type PerformProGoalCheckinInput = {
  goal: PerformProGoal;
  currentValue: number;
  confidenceScore: number | null;
  note: string | null;
  blockers: string[];
};

export type PerformProCreateGoalInput = {
  cycleUuid: string;
  participantUuid: string;
  parentGoalUuid: string | null;
  goalType: PerformProGoal["goal_type"];
  cascadeLevel: PerformProGoal["cascade_level"];
  title: string;
  description: string | null;
  weightagePct: number;
  startValue: number;
  targetValue: number | null;
  targetUnit: string | null;
  dueDate: string | null;
  autoScore: boolean;
};

export type PerformProReviseGoalInput = {
  goal: PerformProGoal;
  title: string;
  description: string | null;
  weightagePct: number;
  startValue: number;
  targetValue: number | null;
  targetUnit: string | null;
  dueDate: string | null;
  autoScore: boolean;
  revisionNote: string;
};

export type PerformProCommandResult<T> = T & { replayed: boolean };

export type PerformProCreatePhaseInput = {
  type: string;
  opens_at: string;
  due_at: string;
  grace_ends_at: string | null;
  transition_mode: "MANUAL" | "AUTOMATIC";
};

export type PerformProCreateCycleInput = {
  code: string;
  name: string;
  cycle_type: string;
  period_start: string;
  period_end: string;
  timezone: string;
  default_locale: string;
  phases: PerformProCreatePhaseInput[];
};

export type PerformProPopulationRuleInput = {
  code: string;
  name: string;
  effect: "INCLUDE" | "EXCLUDE";
  field: string;
  operator: "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN" | "EXISTS" | "NOT_EXISTS";
  values: string[];
};

export type PerformProPopulationPolicyInput = {
  cycleUuid: string;
  expectedCycleVersion: number;
  populationAsOf: string;
  rules: PerformProPopulationRuleInput[];
};

export type PerformProPopulationPreview = {
  uuid: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  policy_version: number;
  expected_cycle_version: number;
  population_as_of: string;
  candidate_count: number;
  included_count: number;
  excluded_count: number;
  not_included_count: number;
  blocked_count: number;
  processed_count: number;
  attempt_count: number;
  failure_code: string | null;
  started_at: string | null;
  completed_at: string | null;
  lock_version: number;
};

export type PerformProPopulationPublication = {
  uuid: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  expected_cycle_version: number;
  policy_version: number;
  expected_participant_count: number;
  processed_count: number;
  attempt_count: number;
  failure_code: string | null;
  started_at: string | null;
  completed_at: string | null;
  lock_version: number;
};

export type PerformProBindTemplateInput = {
  cycleUuid: string;
  expectedCycleVersion: number;
  bindingType: string;
  bindingKey: string;
  sourceUuid: string;
  sourceVersion: number;
  sourceSnapshot: Record<string, unknown>;
  required: boolean;
};

export type PerformProCalibrationSetupCycle = {
  uuid: string;
  name: string;
  active_phase: string | null;
  calibration_phase_status: string | null;
  manager_review_phase_status: string | null;
  ready_for_setup: boolean;
};

export type PerformProCalibrationPolicy = {
  binding_uuid: string;
  binding_version: number;
  binding_hash: string;
  cohort_strategy: "CUSTOM" | "DEPARTMENT" | "GRADE_BAND" | "MANAGER";
  minimum_cohort_size: number;
  maximum_cohort_size: number;
  minimum_facilitators_per_cohort: number;
  require_complete_manager_review: boolean;
  score_source: "MANAGER_REVIEW_FINAL";
  facilitator_participant_conflict: "DISALLOW_SAME_COHORT";
};

export type PerformProCalibrationParticipantCandidate = {
  participant_uuid: string;
  employee_uuid: string;
  display_name: string;
  organization: Record<string, unknown>;
  pre_calibration_score: number | null;
  employee_score: number | null;
  score_variance: number | null;
  eligible: boolean;
  conflicts: string[];
  cohort_scope_values: Record<"DEPARTMENT" | "GRADE_BAND" | "MANAGER", string[]>;
};

export type PerformProCalibrationFacilitatorCandidate = {
  employee_uuid: string;
  display_name: string;
};

export type PerformProCalibrationSetupContext = {
  cycle: {
    uuid: string;
    name: string;
    state: string;
    active_phase: string | null;
  };
  phase: {
    uuid: string;
    status: string;
    opens_at: string;
    due_at: string;
  };
  manager_review_phase_status: string;
  policy: PerformProCalibrationPolicy;
  participants: PerformProCalibrationParticipantCandidate[];
  facilitators: PerformProCalibrationFacilitatorCandidate[];
  scope_options: Array<{
    value: string;
    label: string;
    eligible_count: number;
  }>;
  capabilities: {
    can_create: boolean;
  };
};

export type PerformProCalibrationParticipantSnapshot = {
  uuid: string;
  participant_uuid: string;
  employee_uuid: string;
  display_name: string;
  organization: Record<string, unknown>;
  pre_calibration_score: number;
  current_score: number;
  calibration_variance: number;
  adjusted: boolean;
  employee_score: number | null;
  score_variance: number | null;
  score_source: string | null;
  source_hash: string;
  captured_at: string;
  capabilities: {
    can_adjust: boolean;
  };
  latest_adjustment: PerformProCalibrationScoreAdjustment | null;
  adjustment_history: PerformProCalibrationScoreAdjustment[];
};

export type PerformProCalibrationAdjustmentReason =
  | "EVIDENCE_REASSESSMENT"
  | "CONSISTENCY_ALIGNMENT"
  | "ROLE_COMPLEXITY"
  | "PERFORMANCE_CONTEXT"
  | "RATING_SCALE_ALIGNMENT"
  | "OTHER";

export type PerformProCalibrationReviewFlag =
  | "PERFORMANCE_EVIDENCE"
  | "MANAGER_BIAS_REVIEW"
  | "CROSS_COHORT_CONSISTENCY"
  | "ROLE_SCOPE_CHANGE"
  | "DATA_QUALITY"
  | "EXCEPTION";

export type PerformProCalibrationScoreAdjustment = {
  uuid: string;
  adjustment_sequence: number;
  expected_execution_version: number;
  resulting_execution_version: number;
  previous_score: number;
  adjusted_score: number;
  variance_from_pre: number;
  delta_from_previous: number;
  reason_code: PerformProCalibrationAdjustmentReason;
  reason_detail: string;
  review_flags: PerformProCalibrationReviewFlag[];
  adjustment_hash: string;
  adjusted_by: string;
  occurred_at: string;
};

export type PerformProCalibrationFacilitatorAssignment = {
  uuid: string;
  employee_uuid: string;
  display_name: string;
  role: "LEAD" | "CO_FACILITATOR";
  assignment_hash: string;
};

export type PerformProCalibrationCohort = {
  uuid: string;
  name: string;
  cohort_key: string;
  sequence: number;
  scope_type: PerformProCalibrationPolicy["cohort_strategy"];
  scope_value: string | null;
  participant_count: number;
  facilitator_count: number;
  cohort_hash: string;
  capabilities: {
    can_adjust: boolean;
    is_assigned_facilitator: boolean;
  };
  facilitators: PerformProCalibrationFacilitatorAssignment[];
  participants: PerformProCalibrationParticipantSnapshot[];
};

export type PerformProCalibrationSession = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  phase_uuid: string;
  name: string;
  status: "READY";
  scheduled_at: string;
  duration_minutes: number;
  policy: PerformProCalibrationPolicy;
  cohort_count: number;
  participant_count: number;
  facilitator_count: number;
  setup_hash: string;
  occurred_at: string;
  execution: PerformProCalibrationExecution | null;
  capabilities: {
    can_facilitate: boolean;
    can_approve: boolean;
    is_assigned_facilitator: boolean;
    can_open: boolean;
    can_complete: boolean;
  };
  cohorts?: PerformProCalibrationCohort[];
};

export type PerformProCalibrationExecutionTransition = {
  uuid: string;
  from_status: "READY" | "OPEN";
  to_status: "OPEN" | "COMPLETED";
  expected_execution_version: number;
  resulting_execution_version: number;
  transition_hash: string;
  occurred_at: string;
};

export type PerformProCalibrationCompletion = {
  uuid: string;
  participant_count: number;
  adjusted_participant_count: number;
  adjustment_count: number;
  final_score_hash: string;
  adjustment_evidence_hash: string;
  completion_note: string;
  completion_hash: string;
  occurred_at: string;
};

export type PerformProCalibrationExecution = {
  uuid: string;
  status: "OPEN" | "COMPLETED";
  lock_version: number;
  adjustment_count: number;
  adjusted_participant_count: number;
  current_evidence_hash: string;
  opened_at: string;
  completed_at: string | null;
  transitions?: PerformProCalibrationExecutionTransition[];
  completion?: PerformProCalibrationCompletion | null;
};

export type PerformProCalibrationCohortInput = {
  name: string;
  cohort_key: string;
  scope_type: PerformProCalibrationPolicy["cohort_strategy"];
  scope_value: string | null;
  participant_uuids: string[];
  lead_facilitator_employee_uuid: string;
  co_facilitator_employee_uuids: string[];
};

export type PerformProCreateCalibrationSessionInput = {
  cycleUuid: string;
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  cohorts: PerformProCalibrationCohortInput[];
};

export type PerformProAdjustCalibrationScoreInput = {
  sessionUuid: string;
  participantSnapshotUuid: string;
  expectedExecutionVersion: number;
  adjustedScore: number;
  reasonCode: PerformProCalibrationAdjustmentReason;
  reasonDetail: string;
  reviewFlags: PerformProCalibrationReviewFlag[];
};

export type PerformProOutcomeStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type PerformProOutcomeReleaseStatus =
  | "NOT_RELEASED"
  | "RELEASED"
  | "ACKNOWLEDGED";

export type PerformProOutcomeScorecard = {
  subject: {
    participant_uuid: string;
    employee_uuid: string;
    manager_employee_uuid: string | null;
    display_name: string;
    organization: Record<string, unknown>;
  };
  scores: {
    pre_calibration_score: number;
    calibrated_score: number;
    calibration_variance: number;
    was_adjusted: boolean;
    final_score: number;
  };
  rating: {
    value: number;
    code: string;
    label: string;
  };
  policies: {
    rating_scale_binding_uuid: string;
    rating_scale_hash: string;
    scoring_policy_binding_uuid: string;
    scoring_policy_hash: string;
    approval_workflow_binding_uuid: string | null;
    approval_workflow_hash: string | null;
    rounding_precision: number;
  };
  provenance: {
    calibration_session_uuid: string;
    calibration_completion_uuid: string;
    calibration_completion_hash: string;
    calibration_final_score_hash: string;
    participant_snapshot_uuid: string;
    participant_snapshot_source_hash: string;
    latest_adjustment_uuid: string | null;
    latest_adjustment_hash: string | null;
    calibration_source_hash: string;
  };
};

export type PerformProOutcomeDecisionEvidence = {
  uuid: string;
  from_status: "PENDING_APPROVAL";
  to_status: "APPROVED" | "REJECTED";
  expected_outcome_version: number;
  resulting_outcome_version: number;
  reason: string | null;
  previous_evidence_hash: string;
  decision_hash: string;
  occurred_at: string;
};

export type PerformProOutcomeReleaseEvidence = {
  uuid: string;
  batch_uuid: string;
  release_mode: "INDIVIDUAL" | "BATCH";
  expected_outcome_version: number;
  resulting_outcome_version: number;
  source_scorecard_hash: string;
  source_approval_hash: string;
  release_hash: string;
  audience: {
    employee?: boolean;
    snapshotted_manager?: boolean;
    outcome_approver?: boolean;
    review_admin?: boolean;
  };
  occurred_at: string;
};

export type PerformProOutcomeAcknowledgementEvidence = {
  uuid: string;
  statement_version: string;
  expected_outcome_version: number;
  resulting_outcome_version: number;
  source_release_hash: string;
  acknowledgement_hash: string;
  occurred_at: string;
};

export type PerformProPerformanceOutcome = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  phase_uuid: string;
  participant_uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  display_name: string;
  organization: Record<string, unknown>;
  status: PerformProOutcomeStatus;
  release_status: PerformProOutcomeReleaseStatus;
  lock_version: number;
  scores: PerformProOutcomeScorecard["scores"];
  rating: PerformProOutcomeScorecard["rating"];
  evidence: {
    scorecard_hash: string;
    calibration_source_hash: string;
    current_evidence_hash: string;
    assembly_run_uuid: string;
    assembly_hash: string;
    rating_scale_hash: string;
    scoring_policy_hash: string;
    approval_workflow_hash: string | null;
  };
  assembled_at: string;
  decided_at: string | null;
  released_at: string | null;
  acknowledged_at: string | null;
  capabilities: {
    can_approve: boolean;
    can_reject: boolean;
    can_release: boolean;
    can_acknowledge: boolean;
    is_subject_view: boolean;
  };
  release: PerformProOutcomeReleaseEvidence | null;
  acknowledgement: PerformProOutcomeAcknowledgementEvidence | null;
  scorecard?: PerformProOutcomeScorecard;
  decisions?: PerformProOutcomeDecisionEvidence[];
};

export type PerformProOutcomeQueue = {
  summary: {
    total: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    released: number;
    awaiting_acknowledgement: number;
    acknowledged: number;
  };
  capabilities: {
    can_assemble: boolean;
    can_approve: boolean;
    can_release: boolean;
    pre_release_confidential: boolean;
  };
  outcomes: PerformProPerformanceOutcome[];
};

export type PerformProOutcomeReleaseBatch = {
  uuid: string;
  cycle_uuid: string;
  release_mode: "INDIVIDUAL" | "BATCH";
  requested_count: number;
  released_count: number;
  outcome_versions: {
    outcome_uuid: string;
    expected_outcome_version: number;
    resulting_outcome_version: number;
  }[];
  outcome_versions_hash: string;
  batch_hash: string;
  release_uuids: string[];
  outcome_uuids: string[];
  occurred_at: string;
  replayed: boolean;
};

export type PerformProOutcomeDisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "WITHDRAWN";

export type PerformProOutcomeDisputeCategory =
  | "RATING"
  | "SCORE"
  | "PROCESS"
  | "EVIDENCE"
  | "OTHER";

export type PerformProOutcomeDisputeResolution =
  | "UPHELD"
  | "PARTIALLY_UPHELD"
  | "NOT_UPHELD"
  | "ADMINISTRATIVE_CORRECTION"
  | "OTHER";

export type PerformProOutcomeDisputeEvidence = {
  type: "DOCUMENT" | "LINK" | "NOTE";
  title: string;
  description: string | null;
  url?: string;
  document?: {
    uuid: string;
    title: string;
    original_name: string;
    mime_type: string | null;
    file_size: number | null;
    version: number;
    verification_status: string;
  };
};

export type PerformProOutcomeDisputeEvent = {
  uuid: string;
  event_type: "SUBMITTED" | "RESPONSE_ADDED" | "WITHDRAWN" | "RESOLVED";
  actor_role: "EMPLOYEE" | "MANAGER" | "HR";
  from_status: PerformProOutcomeDisputeStatus | null;
  to_status: PerformProOutcomeDisputeStatus;
  expected_dispute_version: number;
  resulting_dispute_version: number;
  reason_code: string;
  narrative: string;
  evidence: PerformProOutcomeDisputeEvidence[];
  evidence_hash: string;
  previous_evidence_hash: string | null;
  event_hash: string;
  occurred_at: string;
};

export type PerformProOutcomeDispute = {
  uuid: string;
  case_reference: string;
  case_sequence: number;
  cycle_uuid: string;
  cycle_name: string;
  outcome_uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  display_name: string;
  status: PerformProOutcomeDisputeStatus;
  lock_version: number;
  category: PerformProOutcomeDisputeCategory;
  reason: string;
  requested_resolution: string | null;
  evidence: PerformProOutcomeDisputeEvidence[];
  resolution: {
    code: PerformProOutcomeDisputeResolution;
    summary: string;
    resolved_at: string;
  } | null;
  submitted_at: string;
  withdrawn_at: string | null;
  evidence_chain: {
    source_outcome_version: number;
    source_outcome_evidence_hash: string;
    source_release_hash: string;
    dispute_hash: string;
    current_evidence_hash: string;
  };
  capabilities: {
    can_respond: boolean;
    can_resolve: boolean;
    can_withdraw: boolean;
    is_subject_view: boolean;
    is_manager_view: boolean;
  };
  events?: PerformProOutcomeDisputeEvent[];
};

export type PerformProDisputeEligibleOutcome = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  display_name: string;
  rating: {
    value: number;
    code: string;
    label: string;
  };
  final_score: number;
  lock_version: number;
  release_status: PerformProOutcomeReleaseStatus;
  released_at: string | null;
  release_hash: string;
};

export type PerformProOutcomeDisputeQueue = {
  summary: {
    total: number;
    open: number;
    under_review: number;
    resolved: number;
    withdrawn: number;
  };
  capabilities: {
    can_create: boolean;
    can_manage: boolean;
    can_resolve: boolean;
  };
  eligible_outcomes: PerformProDisputeEligibleOutcome[];
  disputes: PerformProOutcomeDispute[];
};

export type PerformProDisputeEvidenceInput = {
  type: "DOCUMENT" | "LINK" | "NOTE";
  title: string;
  description: string;
  document_uuid?: string;
  url?: string;
};

export type PerformProDevelopmentPlanStatus = "ACTIVE" | "COMPLETED";
export type PerformProDevelopmentPlanHealth =
  | "ON_TRACK"
  | "AT_RISK"
  | "OFF_TRACK"
  | "COMPLETED";
export type PerformProDevelopmentOwnerRole = "EMPLOYEE" | "MANAGER" | "SHARED";
export type PerformProDevelopmentActionType =
  | "TRAINING"
  | "PROJECT"
  | "COACHING"
  | "MENTORING"
  | "SELF_STUDY"
  | "OTHER";

export type PerformProDevelopmentNeed = {
  sequence: number;
  source_type: "OUTCOME" | "FEEDBACK" | "CAREER" | "OTHER";
  title: string;
  rationale: string;
};

export type PerformProDevelopmentAction = {
  uuid: string;
  sequence: number;
  action_type: PerformProDevelopmentActionType;
  owner_role: PerformProDevelopmentOwnerRole;
  title: string;
  description: string | null;
  due_date: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress_percentage: number;
  completed_at: string | null;
  definition_hash: string;
};

export type PerformProDevelopmentMilestone = {
  uuid: string;
  sequence: number;
  title: string;
  due_date: string;
  status: "PENDING" | "COMPLETED";
  completed_at: string | null;
  definition_hash: string;
};

export type PerformProDevelopmentGoal = {
  uuid: string;
  sequence: number;
  owner_role: PerformProDevelopmentOwnerRole;
  title: string;
  description: string;
  competency: string | null;
  success_measure: string;
  weight: number;
  target_date: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress_percentage: number;
  completed_at: string | null;
  definition_hash: string;
  actions: PerformProDevelopmentAction[];
  milestones: PerformProDevelopmentMilestone[];
};

export type PerformProDevelopmentCheckIn = {
  uuid: string;
  summary: string;
  blockers: string | null;
  support_needed: string | null;
  updates: {
    item_type: "GOAL" | "ACTION" | "MILESTONE";
    item_uuid: string;
    title: string;
    before: Record<string, string | number>;
    after: Record<string, string | number>;
  }[];
  evidence: PerformProOutcomeDisputeEvidence[];
  progress_before: number;
  progress_after: number;
  health_before: PerformProDevelopmentPlanHealth;
  health_after: PerformProDevelopmentPlanHealth;
  actor_role: "EMPLOYEE" | "MANAGER" | "HR";
  submitted_at: string;
  checkin_hash: string;
};

export type PerformProDevelopmentPlanEvent = {
  uuid: string;
  event_type: "CREATED" | "CHECK_IN" | "COMPLETED";
  actor_role: "EMPLOYEE" | "MANAGER" | "HR";
  from_status: PerformProDevelopmentPlanStatus | null;
  to_status: PerformProDevelopmentPlanStatus;
  expected_plan_version: number;
  resulting_plan_version: number;
  payload_hash: string;
  previous_evidence_hash: string | null;
  event_hash: string;
  occurred_at: string;
};

export type PerformProDevelopmentPlan = {
  uuid: string;
  plan_reference: string;
  cycle_uuid: string;
  cycle_name: string;
  outcome_uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  display_name: string;
  status: PerformProDevelopmentPlanStatus;
  lock_version: number;
  title: string;
  summary: string;
  target_completion_date: string;
  development_needs: PerformProDevelopmentNeed[];
  source_outcome: {
    outcome_uuid: string;
    cycle_uuid: string;
    cycle_name: string;
    rating: { value: number; code: string; label: string };
    final_score: number;
    scorecard_hash: string;
    release_status: PerformProOutcomeReleaseStatus;
    released_at: string | null;
    acknowledged_at: string | null;
  };
  progress_percentage: number;
  health: PerformProDevelopmentPlanHealth;
  started_at: string;
  completed_at: string | null;
  completion_summary: string | null;
  evidence_chain: {
    development_needs_hash: string;
    source_outcome_version: number;
    source_outcome_evidence_hash: string;
    source_release_hash: string;
    plan_hash: string;
    current_evidence_hash: string;
  };
  capabilities: {
    can_check_in: boolean;
    can_complete: boolean;
    is_subject_view: boolean;
    is_manager_view: boolean;
  };
  goals?: PerformProDevelopmentGoal[];
  check_ins?: PerformProDevelopmentCheckIn[];
  events?: PerformProDevelopmentPlanEvent[];
};

export type PerformProDevelopmentEligibleOutcome = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  employee_uuid: string;
  display_name: string;
  rating: { value: number; code: string; label: string };
  final_score: number;
  lock_version: number;
  release_status: PerformProOutcomeReleaseStatus;
  released_at: string | null;
  release_hash: string;
};

export type PerformProDevelopmentPlanQueue = {
  summary: {
    total: number;
    active: number;
    completed: number;
    on_track: number;
    at_risk: number;
    off_track: number;
  };
  capabilities: {
    can_manage_own: boolean;
    can_view_team: boolean;
    can_manage_team: boolean;
    can_admin: boolean;
  };
  eligible_outcomes: PerformProDevelopmentEligibleOutcome[];
  plans: PerformProDevelopmentPlan[];
};

export type PerformProDevelopmentEvidenceInput = PerformProDisputeEvidenceInput;

export type PerformProCreateDevelopmentPlanInput = {
  outcome: PerformProDevelopmentEligibleOutcome;
  title: string;
  summary: string;
  target_completion_date: string;
  development_needs: {
    source_type: "OUTCOME" | "FEEDBACK" | "CAREER" | "OTHER";
    title: string;
    rationale: string;
  }[];
  goals: {
    owner_role: PerformProDevelopmentOwnerRole;
    title: string;
    description: string;
    competency: string;
    success_measure: string;
    weight: number;
    target_date: string;
    actions: {
      action_type: PerformProDevelopmentActionType;
      owner_role: PerformProDevelopmentOwnerRole;
      title: string;
      description: string;
      due_date: string;
    }[];
    milestones: {
      title: string;
      due_date: string;
    }[];
  }[];
};

export type PerformProDevelopmentUpdateInput =
  | {
      item_type: "GOAL" | "ACTION";
      item_uuid: string;
      progress_percentage: number;
    }
  | {
      item_type: "MILESTONE";
      item_uuid: string;
      completed: boolean;
    };

export type PerformProPipStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "RELEASED"
  | "COMPLETED_SUCCESSFULLY"
  | "COMPLETED_UNSUCCESSFULLY"
  | "ESCALATED";
export type PerformProPipHealth =
  | "NOT_STARTED"
  | "ON_TRACK"
  | "AT_RISK"
  | "OFF_TRACK"
  | "SUCCESSFUL"
  | "UNSUCCESSFUL"
  | "ESCALATED";
export type PerformProPipItemStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PerformProPipClosureOutcome =
  | "SUCCESSFUL"
  | "UNSUCCESSFUL"
  | "ESCALATED";
export type PerformProPipTriggerType = "OUTCOME" | "MANAGER";
export type PerformProPipOwnerRole = "EMPLOYEE" | "MANAGER" | "SHARED";
export type PerformProPipActionType =
  | "DELIVERABLE"
  | "TRAINING"
  | "COACHING"
  | "SUPPORT"
  | "OTHER";
export type PerformProPipReviewerRole = "MANAGER" | "HR" | "BOTH";

export type PerformProPipAction = {
  uuid: string;
  sequence: number;
  owner_role: PerformProPipOwnerRole;
  action_type: PerformProPipActionType;
  title: string;
  description: string | null;
  due_date: string;
  definition_hash: string;
  progress_percentage: number;
  status: PerformProPipItemStatus;
};

export type PerformProPipObjective = {
  uuid: string;
  sequence: number;
  title: string;
  issue_description: string;
  success_criteria: string;
  measurement_method: string;
  baseline: string;
  target: string;
  weight: number;
  target_date: string;
  definition_hash: string;
  progress_percentage: number;
  status: PerformProPipItemStatus;
  actions: PerformProPipAction[];
};

export type PerformProPipReview = {
  uuid: string;
  sequence: number;
  review_date: string;
  reviewer_role: PerformProPipReviewerRole;
  title: string;
  agenda: string;
  definition_hash: string;
  completed: boolean;
  record_uuid: string | null;
};

export type PerformProPipExtensionReview = PerformProPipReview & {
  extension_uuid: string;
};

export type PerformProPipCheckIn = {
  uuid: string;
  case_version: number;
  summary: string;
  blockers: string | null;
  support_needed: string | null;
  evidence: PerformProOutcomeDisputeEvidence[];
  progress_before: number;
  progress_after: number;
  health_before: PerformProPipHealth;
  health_after: PerformProPipHealth;
  actor_role: "EMPLOYEE" | "MANAGER" | "HR";
  submitted_at: string;
  checkin_hash: string;
  updates: {
    uuid: string;
    item_type: "OBJECTIVE" | "ACTION";
    item_uuid: string;
    title: string;
    progress_before: number;
    progress_after: number;
    status_before: PerformProPipItemStatus;
    status_after: PerformProPipItemStatus;
    update_hash: string;
  }[];
};

export type PerformProPipReviewRecord = {
  uuid: string;
  review_uuid: string;
  review_title: string;
  review_outcome: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  summary: string;
  employee_comments: string | null;
  manager_assessment: string;
  hr_comments: string | null;
  support_actions: string;
  evidence: PerformProOutcomeDisputeEvidence[];
  actor_role: "MANAGER" | "HR";
  submitted_at: string;
  review_hash: string;
};

export type PerformProPipExtension = {
  uuid: string;
  extension_sequence: number;
  previous_end_date: string;
  new_end_date: string;
  reason: string;
  extended_at: string;
  extension_hash: string;
};

export type PerformProPipEvent = {
  uuid: string;
  event_type:
    | "INITIATED"
    | "APPROVED"
    | "REJECTED"
    | "RELEASED"
    | "CHECK_IN"
    | "REVIEW_RECORDED"
    | "EXTENDED"
    | "CLOSED_SUCCESSFULLY"
    | "CLOSED_UNSUCCESSFULLY"
    | "ESCALATED"
    | "ACKNOWLEDGED";
  actor_role: "EMPLOYEE" | "MANAGER" | "HR";
  from_status: PerformProPipStatus | null;
  to_status: PerformProPipStatus;
  expected_case_version: number;
  resulting_case_version: number;
  reason_code: string;
  reason: string;
  payload_hash: string;
  previous_evidence_hash: string | null;
  event_hash: string;
  occurred_at: string;
};

export type PerformProPipCase = {
  uuid: string;
  case_reference: string;
  cycle_uuid: string;
  cycle_name: string;
  outcome_uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  display_name: string;
  status: PerformProPipStatus;
  lock_version: number;
  trigger_type: PerformProPipTriggerType;
  trigger_reason: string;
  title: string;
  summary: string;
  start_date: string;
  end_date: string;
  effective_end_date: string;
  progress_percentage: number;
  health: PerformProPipHealth;
  last_checkin_at: string | null;
  next_review_date: string | null;
  extension_count: number;
  expectations: string;
  support_commitment: string;
  consequences_statement: string;
  evidence: PerformProOutcomeDisputeEvidence[];
  source_outcome: {
    outcome_uuid: string;
    cycle_uuid: string;
    cycle_name: string;
    final_score: number;
    rating: { value: number; code: string; label: string };
    scorecard_hash: string;
    release_status: PerformProOutcomeReleaseStatus;
    released_at: string | null;
  };
  initiated_at: string;
  decision: {
    decision: "APPROVED" | "REJECTED";
    reason: string;
    decided_at: string;
  } | null;
  release: {
    statement_version: string;
    release_hash: string;
    released_at: string;
  } | null;
  evidence_chain: {
    source_outcome_version: number;
    source_outcome_evidence_hash: string;
    source_release_hash: string;
    case_hash: string;
    current_evidence_hash: string;
    closure_hash: string | null;
    acknowledgement_hash: string | null;
  };
  capabilities: {
    can_approve: boolean;
    can_reject: boolean;
    can_release: boolean;
    can_check_in: boolean;
    can_review: boolean;
    can_extend: boolean;
    can_close: boolean;
    can_acknowledge: boolean;
    is_subject_view: boolean;
    is_manager_view: boolean;
  };
  objectives?: PerformProPipObjective[];
  reviews?: PerformProPipReview[];
  extension_reviews?: PerformProPipExtensionReview[];
  check_ins?: PerformProPipCheckIn[];
  review_records?: PerformProPipReviewRecord[];
  extensions?: PerformProPipExtension[];
  closure?: {
    uuid: string;
    outcome: PerformProPipClosureOutcome;
    summary: string;
    reason: string;
    evidence: PerformProOutcomeDisputeEvidence[];
    final_progress_percentage: number;
    final_health: PerformProPipHealth;
    closed_at: string;
    closure_hash: string;
  } | null;
  acknowledgement?: {
    uuid: string;
    statement_version: string;
    statement: string;
    acknowledged_at: string;
    acknowledgement_hash: string;
  } | null;
  events?: PerformProPipEvent[];
};

export type PerformProPipEligibleOutcome = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  employee_uuid: string;
  display_name: string;
  rating: { value: number; code: string; label: string };
  final_score: number;
  lock_version: number;
  release_status: PerformProOutcomeReleaseStatus;
  released_at: string | null;
};

export type PerformProPipQueue = {
  summary: {
    total: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    released: number;
    completed_successfully: number;
    completed_unsuccessfully: number;
    escalated: number;
    on_track: number;
    at_risk: number;
    off_track: number;
  };
  capabilities: {
    can_view_own: boolean;
    can_view_case: boolean;
    can_manage: boolean;
    can_approve: boolean;
    can_release: boolean;
    can_check_in: boolean;
    can_review: boolean;
    can_extend: boolean;
    can_complete: boolean;
    can_acknowledge: boolean;
  };
  eligible_outcomes: PerformProPipEligibleOutcome[];
  cases: PerformProPipCase[];
};

export type PerformProInitiatePipInput = {
  outcome: PerformProPipEligibleOutcome;
  trigger_type: PerformProPipTriggerType;
  trigger_reason: string;
  title: string;
  summary: string;
  start_date: string;
  end_date: string;
  expectations: string;
  support_commitment: string;
  consequences_statement: string;
  objectives: {
    title: string;
    issue_description: string;
    success_criteria: string;
    measurement_method: string;
    baseline: string;
    target: string;
    weight: number;
    target_date: string;
    actions: {
      owner_role: PerformProPipOwnerRole;
      action_type: PerformProPipActionType;
      title: string;
      description: string;
      due_date: string;
    }[];
  }[];
  reviews: {
    review_date: string;
    reviewer_role: PerformProPipReviewerRole;
    title: string;
    agenda: string;
  }[];
  evidence: PerformProDisputeEvidenceInput[];
};

export type PerformProPipProgressUpdateInput = {
  item_type: "OBJECTIVE" | "ACTION";
  item_uuid: string;
  progress_percentage: number;
};

export type PerformProPipCheckInInput = {
  pipCase: PerformProPipCase;
  summary: string;
  blockers: string;
  supportNeeded: string;
  updates: PerformProPipProgressUpdateInput[];
  evidence: PerformProDisputeEvidenceInput[];
};

export type PerformProPipReviewInput = {
  pipCase: PerformProPipCase;
  reviewUuid: string;
  reviewOutcome: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  summary: string;
  employeeComments: string;
  managerAssessment: string;
  hrComments: string;
  supportActions: string;
  evidence: PerformProDisputeEvidenceInput[];
};

export type PerformProPipExtensionInput = {
  pipCase: PerformProPipCase;
  newEndDate: string;
  reason: string;
  reviews: {
    review_date: string;
    reviewer_role: PerformProPipReviewerRole;
    title: string;
    agenda: string;
  }[];
};

export type PerformProPipClosureInput = {
  pipCase: PerformProPipCase;
  outcome: PerformProPipClosureOutcome;
  summary: string;
  reason: string;
  evidence: PerformProDisputeEvidenceInput[];
};

export type PerformProCompensationRoundStatus =
  | "OPEN"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type PerformProCompensationItemStatus =
  | "PENDING_RECOMMENDATION"
  | "RECOMMENDED";

export type PerformProCompensationSyncBatchStatus =
  | "QUEUED"
  | "PROCESSING"
  | "PARTIALLY_SYNCED"
  | "SYNCED"
  | "RECONCILIATION_REQUIRED"
  | "REVERSED";

export type PerformProCompensationSyncItemStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SYNCED"
  | "FAILED"
  | "MATCHED"
  | "MISMATCHED"
  | "REVERSED";

export type PerformProCompensationSyncBatchSummary = {
  uuid: string;
  batch_reference: string;
  status: PerformProCompensationSyncBatchStatus;
  lock_version: number;
  effective_date: string;
  counts: {
    total: number;
    succeeded: number;
    failed: number;
    matched: number;
    mismatched: number;
  };
};

export type PerformProCompensationSyncItem = {
  uuid: string;
  compensation_item_uuid: string;
  employee_uuid: string;
  display_name: string;
  status: PerformProCompensationSyncItemStatus;
  lock_version: number;
  attempt_count: number;
  target_pay: {
    currency_code: string;
    measurement_basis: "BASIC" | "GROSS" | "CTC";
    amount: number;
    effective_from: string;
    hash: string;
  };
  target_salary_assignment_uuid: string | null;
  last_error_code: string | null;
  current_evidence_hash: string;
  synced_at: string | null;
  reconciled_at: string | null;
  reversed_at: string | null;
  capabilities: {
    can_retry: boolean;
    can_reverse: boolean;
  };
};

export type PerformProCompensationSyncBatch =
  PerformProCompensationSyncBatchSummary & {
    round_uuid: string;
    round_reference: string;
    cycle_name: string;
    counts: PerformProCompensationSyncBatchSummary["counts"] & {
      reversed: number;
    };
    evidence: {
      source_round_version: number;
      source_decision_hash: string;
      current_evidence_hash: string;
    };
    initiated_at: string;
    completed_at: string | null;
    reconciled_at: string | null;
    reversed_at: string | null;
    capabilities: { can_reconcile: boolean };
    items: PerformProCompensationSyncItem[];
    events: Array<{
      uuid: string;
      sync_item_uuid: string | null;
      event_type: string;
      state_before: string | null;
      state_after: string;
      attempt_number: number | null;
      payload_hash: string;
      event_hash: string;
      occurred_at: string;
    }>;
  };

export type PerformProCompensationItem = {
  uuid: string;
  outcome_uuid: string;
  employee_uuid: string;
  manager_employee_uuid: string | null;
  display_name: string;
  organization: Record<string, unknown>;
  status: PerformProCompensationItemStatus;
  lock_version: number;
  rating: {
    code: string;
    label: string;
    final_score: number;
  };
  current_pay: {
    amount: number;
    currency_code: string;
    measurement_basis: "BASIC" | "GROSS" | "CTC";
    salary_structure_name: string | null;
    effective_from: string | null;
    hash: string;
  };
  guideline: {
    min_pct: number;
    target_pct: number;
    max_pct: number;
  };
  recommendation: {
    increase_pct: number;
    increase_amount: number;
    new_pay_amount: number;
    reason: string;
    recommended_at: string;
  } | null;
  evidence: {
    source_outcome_version: number;
    source_outcome_evidence_hash: string;
    source_release_hash: string;
    current_pay_hash: string;
    current_evidence_hash: string;
  };
  capabilities: { can_recommend: boolean };
  recommendations?: Array<{
    uuid: string;
    sequence: number;
    resulting_item_version: number;
    increase_pct: number;
    increase_amount: number;
    new_pay_amount: number;
    reason: string;
    validation: Record<string, unknown>;
    recommendation_hash: string;
    recommended_at: string;
  }>;
};

export type PerformProCompensationRound = {
  uuid: string;
  round_reference: string;
  cycle_uuid: string;
  cycle_name: string;
  status: PerformProCompensationRoundStatus;
  lock_version: number;
  currency_code: string;
  measurement_basis: "BASIC" | "GROSS" | "CTC";
  effective_date: string;
  eligibility_as_of: string;
  eligible_count: number;
  ineligible_count: number | null;
  budget: {
    source_uuid: string;
    source_version: number;
    amount: number;
    recommended: number;
    remaining: number;
    utilization_pct: number;
    hash: string;
  };
  progress: {
    recommendation_count: number;
    pending_count: number;
    completion_pct: number;
  };
  policy: {
    binding_uuid: string;
    source_uuid: string;
    source_version: number;
    requires_outcome_acknowledgement: boolean;
    guidelines: Array<{
      rating_code: string;
      min_pct: number;
      target_pct: number;
      max_pct: number;
    }>;
    hash: string;
  };
  evidence: {
    population_hash: string;
    budget_hash: string;
    policy_hash: string;
    current_evidence_hash: string;
  };
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  capabilities: {
    can_recommend: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_reject: boolean;
    can_sync: boolean;
  };
  sync_batch: PerformProCompensationSyncBatchSummary | null;
  items: PerformProCompensationItem[];
  population_exceptions?: Array<{
    outcome_uuid: string;
    employee_uuid: string;
    display_name: string;
    reason_code: string;
  }>;
  events?: Array<{
    uuid: string;
    event_type: "CREATED" | "SUBMITTED";
    from_status: string | null;
    to_status: string;
    resulting_round_version: number;
    payload_hash: string;
    event_hash: string;
    occurred_at: string;
  }>;
  decision?: {
    uuid: string;
    decision: "APPROVED" | "REJECTED";
    reason: string;
    totals: Record<string, unknown>;
    totals_hash: string;
    decision_hash: string;
    decided_at: string;
  } | null;
};

export type PerformProCompensationEligibleCycle = {
  uuid: string;
  code: string;
  name: string;
  state: PerformProCycleState;
  period_end: string;
  released_outcome_count: number;
};

export type PerformProCompensationQueue = {
  summary: {
    total_rounds: number;
    open: number;
    submitted: number;
    approved: number;
    rejected: number;
    pending_recommendations: number;
  };
  capabilities: {
    can_view_all: boolean;
    can_create_round: boolean;
    can_recommend: boolean;
    can_approve: boolean;
    can_sync: boolean;
    can_reconcile: boolean;
    can_reverse: boolean;
    pay_data_confidential: true;
  };
  eligible_cycles: PerformProCompensationEligibleCycle[];
  rounds: PerformProCompensationRound[];
};

export type PerformProCreateCompensationRoundInput = {
  cycle_uuid: string;
  budget_source_uuid: string;
  budget_source_version: number;
  budget_amount: number;
  currency_code: string;
  effective_date: string;
};

export type PerformProRecommendCompensationInput = {
  item: PerformProCompensationItem;
  increase_pct: number;
  reason: string;
};

export type PerformProOutcomeAssemblyRun = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  participant_count: number;
  calibration_completion_count: number;
  calibration_evidence_hash: string;
  rating_scale_hash: string;
  scoring_policy_hash: string;
  approval_workflow_hash: string | null;
  scorecards_hash: string;
  assembly_hash: string;
  occurred_at: string;
};

export type PerformProReportScope = "SELF" | "TEAM" | "COMPANY";

export type PerformProReportDatasetRow = {
  label: string;
  count?: number;
  value?: number;
};

export type PerformProReportSnapshotSummary = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  scope: PerformProReportScope;
  sensitive_fields_included: boolean;
  snapshot_hash: string;
  captured_at: string;
};

export type PerformProReportSnapshot = PerformProReportSnapshotSummary & {
  filters: Record<string, unknown>;
  metrics: Record<string, number>;
  datasets: Record<string, PerformProReportDatasetRow[]>;
  source_versions: Record<string, { count: number; latest_at: string | null }>;
  evidence: {
    filters_hash: string;
    source_versions_hash: string;
    snapshot_hash: string;
    command_uuid: string;
    correlation_id: string;
  };
};

export type PerformProReportExportStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export type PerformProReportExport = {
  uuid: string;
  snapshot_uuid: string;
  report_run_uuid: string | null;
  cycle_name: string;
  scope: PerformProReportScope;
  format: "CSV";
  status: PerformProReportExportStatus;
  includes_sensitive_fields: boolean;
  file_name: string;
  file_size_bytes: number | null;
  file_hash: string | null;
  row_count: number;
  failure_code: string | null;
  requested_at: string;
  completed_at: string | null;
  expires_at: string;
  download_url: string | null;
  current_evidence_hash: string;
  events: Array<{
    uuid: string;
    event_type: string;
    state_before: string | null;
    state_after: string;
    payload_hash: string;
    event_hash: string;
    occurred_at: string;
  }>;
};

export type PerformProReportingContext = {
  capabilities: {
    maximum_scope: PerformProReportScope;
    can_export: boolean;
    can_include_sensitive: boolean;
  };
  cycles: Array<{
    uuid: string;
    code: string;
    name: string;
    state: string;
    period_start: string;
    period_end: string;
  }>;
  snapshots: PerformProReportSnapshotSummary[];
  exports: PerformProReportExport[];
};

export type PerformProReportFrequency =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY";

export type PerformProReportRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "EXPORT_QUEUED"
  | "COMPLETED"
  | "FAILED";

export type PerformProReportRun = {
  uuid: string;
  configuration_uuid: string;
  configuration_name: string;
  schedule_uuid: string | null;
  schedule_name: string | null;
  parent_run_uuid: string | null;
  trigger_type: "SCHEDULED" | "MANUAL" | "RETRY";
  status: PerformProReportRunStatus;
  attempt_number: number;
  recipient_count: number;
  retention_days: number;
  snapshot_uuid: string | null;
  export_uuid: string | null;
  export_status: PerformProReportExportStatus | null;
  failure_code: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  current_evidence_hash: string;
  events: Array<{
    uuid: string;
    event_type: string;
    state_before: string | null;
    state_after: string;
    payload_hash: string;
    event_hash: string;
    occurred_at: string;
  }>;
};

export type PerformProReportSchedule = {
  uuid: string;
  configuration_uuid: string;
  name: string;
  frequency: PerformProReportFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  run_time: string;
  timezone: string;
  recipient_count: number;
  recipient_user_ids: number[];
  is_active: boolean;
  lock_version: number;
  last_run_at: string | null;
  last_run_status: string | null;
  next_run_at: string | null;
  current_evidence_hash: string;
  runs: PerformProReportRun[];
};

export type PerformProReportConfiguration = {
  uuid: string;
  cycle_uuid: string;
  cycle_name: string;
  name: string;
  description: string | null;
  scope: PerformProReportScope;
  include_sensitive_fields: boolean;
  format: "CSV";
  retention_days: number;
  is_active: boolean;
  lock_version: number;
  current_evidence_hash: string;
  updated_at: string;
  schedules: PerformProReportSchedule[];
};

export type PerformProReportSchedulingContext = {
  capabilities: PerformProReportingContext["capabilities"] & {
    can_manage_schedules: boolean;
    can_retry_runs: boolean;
    retention_days_min: number;
    retention_days_max: number;
  };
  cycles: PerformProReportingContext["cycles"];
  recipient_candidates: Array<{
    uuid: string;
    name: string;
    email: string;
    maximum_scope: PerformProReportScope;
    can_receive_sensitive: boolean;
  }>;
  configurations: PerformProReportConfiguration[];
};

export type PerformProCreateReportConfigurationInput = {
  cycleUuid: string;
  name: string;
  description: string;
  scope: PerformProReportScope;
  includeSensitiveFields: boolean;
  retentionDays: number;
};

export type PerformProCreateReportScheduleInput = {
  configurationUuid: string;
  name: string;
  frequency: PerformProReportFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  runTime: string;
  timezone: string;
  recipientUserUuids: string[];
};

export type PerformProContinuousFeedbackCategory = "RECOGNITION" | "COACHING";
export type PerformProContinuousFeedbackRelationship =
  | "MANAGER"
  | "DIRECT_REPORT"
  | "PEER";
export type PerformProContinuousFeedbackVisibility =
  | "SHARED"
  | "SHARED_WITH_MANAGER"
  | "MANAGER_CONFIDENTIAL";
export type PerformProContinuousFeedbackStatus = "VISIBLE" | "HIDDEN";

export type PerformProContinuousFeedback = {
  uuid: string;
  cycle_uuid: string | null;
  cycle_name: string | null;
  author_name: string;
  recipient_name: string;
  recipient_manager_name: string | null;
  category: PerformProContinuousFeedbackCategory;
  relationship: PerformProContinuousFeedbackRelationship;
  visibility: PerformProContinuousFeedbackVisibility;
  status: PerformProContinuousFeedbackStatus;
  lock_version: number;
  content: string;
  context: string | null;
  submitted_at: string;
  updated_at: string;
  evidence: {
    content_hash: string;
    context_hash: string | null;
    current_evidence_hash: string;
  };
  capabilities: {
    can_moderate: boolean;
    can_hide: boolean;
    can_restore: boolean;
  };
  events: Array<{
    uuid: string;
    event_type: string;
    state_before: string | null;
    state_after: string;
    reason: string | null;
    resulting_feedback_version: number;
    payload_hash: string;
    event_hash: string;
    occurred_at: string;
  }>;
};

export type PerformProContinuousFeedbackWorkspace = {
  summary: {
    received: number;
    authored: number;
    manager_visible: number;
    moderation_total: number;
    hidden: number;
  };
  capabilities: {
    can_create: boolean;
    can_view_received: boolean;
    can_view_authored: boolean;
    can_moderate: boolean;
  };
  cycles: Array<{
    uuid: string;
    name: string;
    state: string;
    period_start: string;
    period_end: string;
  }>;
  recipient_candidates: Array<{
    uuid: string;
    employee_code: string;
    name: string;
    has_manager: boolean;
  }>;
  received: PerformProContinuousFeedback[];
  authored: PerformProContinuousFeedback[];
  manager_visible: PerformProContinuousFeedback[];
  moderation: PerformProContinuousFeedback[];
};

export type PerformProCreateContinuousFeedbackInput = {
  recipientEmployeeUuid: string;
  cycleUuid: string | null;
  category: PerformProContinuousFeedbackCategory;
  visibility: PerformProContinuousFeedbackVisibility;
  content: string;
  context: string;
};

export type PerformProOneToOneCadence =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "CUSTOM";
export type PerformProOneToOneMeetingStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";
export type PerformProOneToOneActionStatus =
  | "OPEN"
  | "COMPLETED"
  | "CANCELLED"
  | "CARRIED_FORWARD";

export type PerformProOneToOneEntryInput = {
  entry_type: "AGENDA" | "NOTE";
  visibility: "SHARED" | "PRIVATE";
  content: string;
};

export type PerformProOneToOneActionInput = {
  owner_role: "MANAGER" | "EMPLOYEE";
  title: string;
  description: string;
  due_date: string | null;
};

export type PerformProOneToOneMeeting = {
  uuid: string;
  sequence: number;
  scheduled_start_at: string;
  scheduled_end_at: string;
  timezone: string;
  location: string | null;
  status: PerformProOneToOneMeetingStatus;
  lock_version: number;
  reminder_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  completion_summary: string | null;
  cancellation_reason: string | null;
  entries: Array<{
    uuid: string;
    author_name: string;
    entry_type: "AGENDA" | "NOTE";
    visibility: "SHARED" | "PRIVATE";
    content: string;
    content_hash: string;
    is_own_private: boolean;
    created_at: string;
  }>;
  actions: Array<{
    uuid: string;
    source_action_uuid: string | null;
    owner_role: "MANAGER" | "EMPLOYEE";
    owner_name: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: PerformProOneToOneActionStatus;
    completed_at: string | null;
  }>;
  capabilities: {
    can_add_content: boolean;
    can_complete: boolean;
    can_cancel: boolean;
  };
  evidence: { current_evidence_hash: string };
};

export type PerformProOneToOneSeries = {
  uuid: string;
  cycle_uuid: string | null;
  cycle_name: string | null;
  title: string;
  cadence: PerformProOneToOneCadence;
  timezone: string;
  default_duration_minutes: number;
  status: "ACTIVE" | "ENDED";
  lock_version: number;
  manager: { employee_uuid: string; name: string };
  employee: { employee_uuid: string; name: string };
  capabilities: {
    can_manage: boolean;
    can_schedule: boolean;
    can_admin_cancel: boolean;
  };
  evidence: { current_evidence_hash: string };
  created_at: string;
  updated_at: string;
  meetings: PerformProOneToOneMeeting[];
  events: Array<{
    uuid: string;
    meeting_uuid: string | null;
    event_type: string;
    state_before: string | null;
    state_after: string;
    resulting_version: number;
    reason: string | null;
    payload_hash: string;
    event_hash: string;
    occurred_at: string;
  }>;
};

export type PerformProOneToOneWorkspace = {
  summary: {
    series: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    open_actions: number;
  };
  capabilities: {
    can_manage: boolean;
    can_admin: boolean;
  };
  cycles: Array<{ uuid: string; name: string; state: string }>;
  direct_reports: Array<{
    uuid: string;
    employee_code: string;
    name: string;
  }>;
  series: PerformProOneToOneSeries[];
};

export type PerformProCreateOneToOneSeriesInput = {
  employeeUuid: string;
  cycleUuid: string | null;
  title: string;
  cadence: PerformProOneToOneCadence;
  timezone: string;
  durationMinutes: number;
  scheduledStartAt: string;
  location: string;
  entries: PerformProOneToOneEntryInput[];
  actions: PerformProOneToOneActionInput[];
};

export type PerformProScheduleOneToOneMeetingInput = {
  series: PerformProOneToOneSeries;
  scheduledStartAt: string;
  location: string;
  entries: PerformProOneToOneEntryInput[];
  actions: PerformProOneToOneActionInput[];
};

export type PerformProAppendOneToOneContentInput = {
  meeting: PerformProOneToOneMeeting;
  entries: PerformProOneToOneEntryInput[];
  actions: PerformProOneToOneActionInput[];
};
