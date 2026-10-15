import { api } from "@/lib/api";
import type {
  PerformProCommandResult,
  PerformProBindTemplateInput,
  PerformProCalibrationSession,
  PerformProCalibrationSetupContext,
  PerformProCalibrationSetupCycle,
  PerformProAdjustCalibrationScoreInput,
  PerformProCreateCalibrationSessionInput,
  PerformProCreateCycleInput,
  PerformProCompensationQueue,
  PerformProCompensationRound,
  PerformProCompensationSyncBatch,
  PerformProCompensationSyncItem,
  PerformProCreateCompensationRoundInput,
  PerformProRecommendCompensationInput,
  PerformProCreateGoalInput,
  PerformProCycle,
  PerformProCycleDetail,
  PerformProParticipant,
  PerformProParticipantStatus,
  PerformProPopulationPolicyInput,
  PerformProPopulationPreview,
  PerformProPopulationPublication,
  PerformProReason,
  PerformProReviewTask,
  PerformProReviewWorkflow,
  PerformProReviewWorkflowInput,
  PerformProReviewWorkflowResult,
  PerformProManagerReviewDetail,
  PerformProSaveManagerReviewDraftInput,
  PerformProSaveSelfReviewDraftInput,
  PerformProSelfReviewDetail,
  PerformProGoal,
  PerformProFeedback360EligibleReviewer,
  PerformProFeedback360ResponseDetail,
  PerformProFeedback360ResponseTask,
  PerformProFeedback360Result,
  PerformProFeedback360NominationInput,
  PerformProFeedback360Roster,
  PerformProSaveFeedback360DraftInput,
  PerformProGoalCheckin,
  PerformProGoalCheckinInput,
  PerformProOkrRollup,
  PerformProOutcomeAssemblyRun,
  PerformProOutcomeQueue,
  PerformProOutcomeReleaseBatch,
  PerformProOutcomeDispute,
  PerformProOutcomeDisputeCategory,
  PerformProOutcomeDisputeQueue,
  PerformProOutcomeDisputeResolution,
  PerformProDisputeEvidenceInput,
  PerformProDisputeEligibleOutcome,
  PerformProCreateDevelopmentPlanInput,
  PerformProDevelopmentEvidenceInput,
  PerformProDevelopmentPlan,
  PerformProDevelopmentPlanQueue,
  PerformProDevelopmentUpdateInput,
  PerformProInitiatePipInput,
  PerformProPipCase,
  PerformProPipCheckInInput,
  PerformProPipClosureInput,
  PerformProPipExtensionInput,
  PerformProPipQueue,
  PerformProPipReviewInput,
  PerformProPerformanceOutcome,
  PerformProPhase,
  PerformProPhaseProgressionResult,
  PerformProReviseGoalInput,
  PerformProReportExport,
  PerformProReportScope,
  PerformProReportSnapshot,
  PerformProReportingContext,
  PerformProReportSchedulingContext,
  PerformProReportConfiguration,
  PerformProReportSchedule,
  PerformProReportRun,
  PerformProCreateReportConfigurationInput,
  PerformProCreateReportScheduleInput,
  PerformProContinuousFeedback,
  PerformProContinuousFeedbackWorkspace,
  PerformProCreateContinuousFeedbackInput,
  PerformProOneToOneMeeting,
  PerformProOneToOneSeries,
  PerformProOneToOneWorkspace,
  PerformProCreateOneToOneSeriesInput,
  PerformProScheduleOneToOneMeetingInput,
  PerformProAppendOneToOneContentInput,
} from "@/types/performpro";

const BASE = "/perform-pro";

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function commandIdentity(prefix: string) {
  const uuid = crypto.randomUUID();
  return {
    command_uuid: uuid,
    idempotencyKey: `${prefix}:${uuid}`,
    occurred_at: new Date().toISOString(),
  };
}

export const performProService = {
  oneToOneWorkspace: (): Promise<PerformProOneToOneWorkspace> =>
    api.get<{ data: PerformProOneToOneWorkspace }>(
      `${BASE}/one-to-ones`,
    ).then(unwrap<PerformProOneToOneWorkspace>),

  createOneToOneSeries: (
    input: PerformProCreateOneToOneSeriesInput,
  ): Promise<PerformProOneToOneSeries> => {
    const identity = commandIdentity("one-to-one-create");
    return api.post<{ data: PerformProOneToOneSeries }>(
      `${BASE}/one-to-ones`,
      {
        employee_uuid: input.employeeUuid,
        cycle_uuid: input.cycleUuid,
        title: input.title,
        cadence: input.cadence,
        timezone: input.timezone,
        duration_minutes: input.durationMinutes,
        scheduled_start_at: input.scheduledStartAt,
        location: input.location.trim() || null,
        entries: input.entries,
        actions: input.actions.map((action) => ({
          ...action,
          description: action.description.trim() || null,
        })),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOneToOneSeries>);
  },

  scheduleOneToOneMeeting: (
    input: PerformProScheduleOneToOneMeetingInput,
  ): Promise<PerformProOneToOneSeries> => {
    const identity = commandIdentity("one-to-one-schedule");
    return api.post<{ data: PerformProOneToOneSeries }>(
      `${BASE}/one-to-ones/${input.series.uuid}/meetings`,
      {
        expected_series_version: input.series.lock_version,
        scheduled_start_at: input.scheduledStartAt,
        location: input.location.trim() || null,
        entries: input.entries,
        actions: input.actions.map((action) => ({
          ...action,
          description: action.description.trim() || null,
        })),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOneToOneSeries>);
  },

  appendOneToOneContent: (
    input: PerformProAppendOneToOneContentInput,
  ): Promise<PerformProOneToOneSeries> => {
    const identity = commandIdentity("one-to-one-content");
    return api.post<{ data: PerformProOneToOneSeries }>(
      `${BASE}/one-to-one-meetings/${input.meeting.uuid}/content`,
      {
        expected_meeting_version: input.meeting.lock_version,
        entries: input.entries,
        actions: input.actions.map((action) => ({
          ...action,
          description: action.description.trim() || null,
        })),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOneToOneSeries>);
  },

  completeOneToOneMeeting: (
    meeting: PerformProOneToOneMeeting,
    summary: string,
    completedActionUuids: string[],
    carriedActionUuids: string[],
    nextScheduledStartAt: string | null,
  ): Promise<PerformProOneToOneSeries> => {
    const identity = commandIdentity("one-to-one-complete");
    return api.post<{ data: PerformProOneToOneSeries }>(
      `${BASE}/one-to-one-meetings/${meeting.uuid}/complete`,
      {
        expected_meeting_version: meeting.lock_version,
        summary,
        completed_action_uuids: completedActionUuids,
        carried_action_uuids: carriedActionUuids,
        next_scheduled_start_at: nextScheduledStartAt,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOneToOneSeries>);
  },

  cancelOneToOneMeeting: (
    meeting: PerformProOneToOneMeeting,
    reason: string,
  ): Promise<PerformProOneToOneSeries> => {
    const identity = commandIdentity("one-to-one-cancel");
    return api.post<{ data: PerformProOneToOneSeries }>(
      `${BASE}/one-to-one-meetings/${meeting.uuid}/cancel`,
      {
        expected_meeting_version: meeting.lock_version,
        reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOneToOneSeries>);
  },

  continuousFeedbackWorkspace: (): Promise<PerformProContinuousFeedbackWorkspace> =>
    api.get<{ data: PerformProContinuousFeedbackWorkspace }>(
      `${BASE}/feedback`,
    ).then(unwrap<PerformProContinuousFeedbackWorkspace>),

  createContinuousFeedback: (
    input: PerformProCreateContinuousFeedbackInput,
  ): Promise<PerformProContinuousFeedback> => {
    const identity = commandIdentity("continuous-feedback-create");
    return api.post<{ data: PerformProContinuousFeedback }>(
      `${BASE}/feedback`,
      {
        recipient_employee_uuid: input.recipientEmployeeUuid,
        cycle_uuid: input.cycleUuid,
        category: input.category,
        visibility: input.visibility,
        content: input.content,
        context: input.context.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProContinuousFeedback>);
  },

  moderateContinuousFeedback: (
    feedback: PerformProContinuousFeedback,
    action: "HIDE" | "RESTORE",
    reason: string,
  ): Promise<PerformProContinuousFeedback> => {
    const identity = commandIdentity(`continuous-feedback-${action.toLowerCase()}`);
    return api.post<{ data: PerformProContinuousFeedback }>(
      `${BASE}/feedback/${feedback.uuid}/moderate`,
      {
        expected_feedback_version: feedback.lock_version,
        action,
        reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProContinuousFeedback>);
  },

  reportSchedulingContext: (): Promise<PerformProReportSchedulingContext> =>
    api.get<{ data: PerformProReportSchedulingContext }>(
      `${BASE}/reporting/configurations`,
    ).then(unwrap<PerformProReportSchedulingContext>),

  createReportConfiguration: (
    input: PerformProCreateReportConfigurationInput,
  ): Promise<PerformProReportConfiguration> => {
    const identity = commandIdentity("report-configuration-create");
    return api.post<{ data: PerformProReportConfiguration }>(
      `${BASE}/cycles/${input.cycleUuid}/reporting/configurations`,
      {
        name: input.name,
        description: input.description || null,
        scope: input.scope,
        include_sensitive_fields: input.includeSensitiveFields,
        retention_days: input.retentionDays,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportConfiguration>);
  },

  updateReportConfiguration: (
    configuration: PerformProReportConfiguration,
    changes: Partial<{
      name: string;
      description: string | null;
      scope: PerformProReportScope;
      include_sensitive_fields: boolean;
      retention_days: number;
      is_active: boolean;
    }>,
  ): Promise<PerformProReportConfiguration> => {
    const identity = commandIdentity("report-configuration-update");
    return api.patch<{ data: PerformProReportConfiguration }>(
      `${BASE}/reporting/configurations/${configuration.uuid}`,
      {
        expected_configuration_version: configuration.lock_version,
        ...changes,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportConfiguration>);
  },

  createReportSchedule: (
    input: PerformProCreateReportScheduleInput,
  ): Promise<PerformProReportSchedule> => {
    const identity = commandIdentity("report-schedule-create");
    return api.post<{ data: PerformProReportSchedule }>(
      `${BASE}/reporting/configurations/${input.configurationUuid}/schedules`,
      {
        name: input.name,
        frequency: input.frequency,
        day_of_week: input.dayOfWeek,
        day_of_month: input.dayOfMonth,
        run_time: input.runTime,
        timezone: input.timezone,
        recipient_user_uuids: input.recipientUserUuids,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportSchedule>);
  },

  updateReportSchedule: (
    schedule: PerformProReportSchedule,
    changes: Partial<{
      name: string;
      frequency: PerformProReportSchedule["frequency"];
      day_of_week: number | null;
      day_of_month: number | null;
      run_time: string;
      timezone: string;
      recipient_user_uuids: string[];
      is_active: boolean;
    }>,
  ): Promise<PerformProReportSchedule> => {
    const identity = commandIdentity("report-schedule-update");
    return api.patch<{ data: PerformProReportSchedule }>(
      `${BASE}/reporting/schedules/${schedule.uuid}`,
      {
        expected_schedule_version: schedule.lock_version,
        ...changes,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportSchedule>);
  },

  runReportSchedule: (scheduleUuid: string): Promise<PerformProReportRun> => {
    const identity = commandIdentity("report-schedule-run");
    return api.post<{ data: PerformProReportRun }>(
      `${BASE}/reporting/schedules/${scheduleUuid}/run`,
      {
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportRun>);
  },

  rerunReportRun: (runUuid: string): Promise<PerformProReportRun> => {
    const identity = commandIdentity("report-run-rerun");
    return api.post<{ data: PerformProReportRun }>(
      `${BASE}/reporting/runs/${runUuid}/rerun`,
      {
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportRun>);
  },

  reportingContext: (): Promise<PerformProReportingContext> =>
    api.get<{ data: PerformProReportingContext }>(`${BASE}/reporting/context`)
      .then(unwrap<PerformProReportingContext>),

  createReportSnapshot: (input: {
    cycleUuid: string;
    scope: PerformProReportScope;
    includeSensitive: boolean;
  }): Promise<PerformProReportSnapshot> => {
    const identity = commandIdentity("performance-report-snapshot");
    return api.post<{ data: PerformProReportSnapshot }>(
      `${BASE}/cycles/${input.cycleUuid}/reporting/snapshots`,
      {
        scope: input.scope,
        include_sensitive: input.includeSensitive,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportSnapshot>);
  },

  reportSnapshot: (snapshotUuid: string): Promise<PerformProReportSnapshot> =>
    api.get<{ data: PerformProReportSnapshot }>(
      `${BASE}/reporting/snapshots/${snapshotUuid}`,
    ).then(unwrap<PerformProReportSnapshot>),

  requestReportExport: (
    snapshotUuid: string,
  ): Promise<PerformProReportExport> => {
    const identity = commandIdentity("performance-report-export");
    return api.post<{ data: PerformProReportExport }>(
      `${BASE}/reporting/snapshots/${snapshotUuid}/exports`,
      {
        format: "CSV",
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReportExport>);
  },

  reportExport: (exportUuid: string): Promise<PerformProReportExport> =>
    api.get<{ data: PerformProReportExport }>(
      `${BASE}/reporting/exports/${exportUuid}`,
    ).then(unwrap<PerformProReportExport>),

  downloadReportExport: async (reportExport: PerformProReportExport) => {
    const response = await api.get<Blob>(
      `${BASE}/reporting/exports/${reportExport.uuid}/download`,
      { responseType: "blob" },
    );
    const href = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = reportExport.file_name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  },

  compensationQueue: (): Promise<PerformProCompensationQueue> =>
    api.get<{ data: PerformProCompensationQueue }>(`${BASE}/compensation/rounds`)
      .then(unwrap<PerformProCompensationQueue>),

  compensationRound: (roundUuid: string): Promise<PerformProCompensationRound> =>
    api.get<{ data: PerformProCompensationRound }>(
      `${BASE}/compensation/rounds/${roundUuid}`,
    ).then(unwrap<PerformProCompensationRound>),

  createCompensationRound: (
    input: PerformProCreateCompensationRoundInput,
  ): Promise<PerformProCompensationRound> => {
    const identity = commandIdentity("compensation-round-create");
    return api.post<{ data: PerformProCompensationRound }>(
      `${BASE}/cycles/${input.cycle_uuid}/compensation/rounds`,
      {
        budget_source_uuid: input.budget_source_uuid,
        budget_source_version: input.budget_source_version,
        budget_amount: input.budget_amount,
        currency_code: input.currency_code,
        effective_date: input.effective_date,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationRound>);
  },

  recommendCompensation: (
    input: PerformProRecommendCompensationInput,
  ): Promise<PerformProCompensationRound> => {
    const identity = commandIdentity("compensation-recommend");
    return api.post<{ data: PerformProCompensationRound }>(
      `${BASE}/compensation/items/${input.item.uuid}/recommend`,
      {
        expected_item_version: input.item.lock_version,
        increase_pct: input.increase_pct,
        reason: input.reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationRound>);
  },

  submitCompensationRound: (
    round: PerformProCompensationRound,
  ): Promise<PerformProCompensationRound> => {
    const identity = commandIdentity("compensation-round-submit");
    return api.post<{ data: PerformProCompensationRound }>(
      `${BASE}/compensation/rounds/${round.uuid}/submit`,
      {
        expected_round_version: round.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationRound>);
  },

  decideCompensationRound: (
    round: PerformProCompensationRound,
    decision: "approve" | "reject",
    reason: string,
  ): Promise<PerformProCompensationRound> => {
    const identity = commandIdentity(`compensation-round-${decision}`);
    return api.post<{ data: PerformProCompensationRound }>(
      `${BASE}/compensation/rounds/${round.uuid}/${decision}`,
      {
        expected_round_version: round.lock_version,
        reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationRound>);
  },

  compensationSyncBatch: (
    batchUuid: string,
  ): Promise<PerformProCompensationSyncBatch> =>
    api.get<{ data: PerformProCompensationSyncBatch }>(
      `${BASE}/compensation/sync-batches/${batchUuid}`,
    ).then(unwrap<PerformProCompensationSyncBatch>),

  synchronizeCompensationRound: (
    round: PerformProCompensationRound,
  ): Promise<PerformProCompensationSyncBatch> => {
    const identity = commandIdentity("compensation-payedge-sync");
    return api.post<{ data: PerformProCompensationSyncBatch }>(
      `${BASE}/compensation/rounds/${round.uuid}/synchronize`,
      {
        expected_round_version: round.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationSyncBatch>);
  },

  retryCompensationSync: (
    item: PerformProCompensationSyncItem,
  ): Promise<PerformProCompensationSyncBatch> => {
    const identity = commandIdentity("compensation-payedge-retry");
    return api.post<{ data: PerformProCompensationSyncBatch }>(
      `${BASE}/compensation/sync-items/${item.uuid}/retry`,
      {
        expected_item_version: item.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationSyncBatch>);
  },

  reconcileCompensationSync: (
    batch: PerformProCompensationSyncBatch,
  ): Promise<PerformProCompensationSyncBatch> => {
    const identity = commandIdentity("compensation-payedge-reconcile");
    return api.post<{ data: PerformProCompensationSyncBatch }>(
      `${BASE}/compensation/sync-batches/${batch.uuid}/reconcile`,
      {
        expected_batch_version: batch.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationSyncBatch>);
  },

  reverseCompensationSync: (
    item: PerformProCompensationSyncItem,
    reason: string,
  ): Promise<PerformProCompensationSyncBatch> => {
    const identity = commandIdentity("compensation-payedge-reverse");
    return api.post<{ data: PerformProCompensationSyncBatch }>(
      `${BASE}/compensation/sync-items/${item.uuid}/reverse`,
      {
        expected_item_version: item.lock_version,
        reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCompensationSyncBatch>);
  },

  outcomeQueue: (): Promise<PerformProOutcomeQueue> =>
    api.get<{ data: PerformProOutcomeQueue }>(`${BASE}/outcomes`)
      .then(unwrap<PerformProOutcomeQueue>),

  outcome: (outcomeUuid: string): Promise<PerformProPerformanceOutcome> =>
    api.get<{ data: PerformProPerformanceOutcome }>(
      `${BASE}/outcomes/${outcomeUuid}`,
    ).then(unwrap<PerformProPerformanceOutcome>),

  assembleOutcomes: (
    cycleUuid: string,
  ): Promise<PerformProOutcomeAssemblyRun> => {
    const identity = commandIdentity("outcome-assemble");
    return api.post<{ data: PerformProOutcomeAssemblyRun }>(
      `${BASE}/cycles/${cycleUuid}/outcomes/assemble`,
      {
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeAssemblyRun>);
  },

  decideOutcome: (
    outcome: PerformProPerformanceOutcome,
    decision: "approve" | "reject",
    reason: string,
  ): Promise<PerformProPerformanceOutcome> => {
    const identity = commandIdentity(`outcome-${decision}`);
    return api.post<{ data: PerformProPerformanceOutcome }>(
      `${BASE}/outcomes/${outcome.uuid}/${decision}`,
      {
        expected_outcome_version: outcome.lock_version,
        reason: reason.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPerformanceOutcome>);
  },

  releaseOutcome: (
    outcome: PerformProPerformanceOutcome,
  ): Promise<PerformProPerformanceOutcome> => {
    const identity = commandIdentity("outcome-release");
    return api.post<{ data: PerformProPerformanceOutcome }>(
      `${BASE}/outcomes/${outcome.uuid}/release`,
      {
        expected_outcome_version: outcome.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPerformanceOutcome>);
  },

  batchReleaseOutcomes: (
    outcomes: PerformProPerformanceOutcome[],
  ): Promise<PerformProOutcomeReleaseBatch> => {
    const identity = commandIdentity("outcome-batch-release");
    return api.post<{ data: PerformProOutcomeReleaseBatch }>(
      `${BASE}/outcomes/releases/batch`,
      {
        outcomes: outcomes.map((outcome) => ({
          outcome_uuid: outcome.uuid,
          expected_outcome_version: outcome.lock_version,
        })),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeReleaseBatch>);
  },

  acknowledgeOutcome: (
    outcome: PerformProPerformanceOutcome,
  ): Promise<PerformProPerformanceOutcome> => {
    const identity = commandIdentity("outcome-acknowledge");
    return api.post<{ data: PerformProPerformanceOutcome }>(
      `${BASE}/outcomes/${outcome.uuid}/acknowledge`,
      {
        expected_outcome_version: outcome.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPerformanceOutcome>);
  },

  outcomeDisputes: (): Promise<PerformProOutcomeDisputeQueue> =>
    api.get<{ data: PerformProOutcomeDisputeQueue }>(`${BASE}/disputes`)
      .then(unwrap<PerformProOutcomeDisputeQueue>),

  outcomeDispute: (
    disputeUuid: string,
  ): Promise<PerformProOutcomeDispute> =>
    api.get<{ data: PerformProOutcomeDispute }>(
      `${BASE}/disputes/${disputeUuid}`,
    ).then(unwrap<PerformProOutcomeDispute>),

  submitOutcomeDispute: (input: {
    outcome: PerformProDisputeEligibleOutcome;
    category: PerformProOutcomeDisputeCategory;
    reason: string;
    requestedResolution: string;
    evidence: PerformProDisputeEvidenceInput[];
  }): Promise<PerformProOutcomeDispute> => {
    const identity = commandIdentity("outcome-dispute-submit");
    return api.post<{ data: PerformProOutcomeDispute }>(
      `${BASE}/outcomes/${input.outcome.uuid}/disputes`,
      {
        expected_outcome_version: input.outcome.lock_version,
        category: input.category,
        reason: input.reason.trim(),
        requested_resolution: input.requestedResolution.trim() || null,
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeDispute>);
  },

  respondToOutcomeDispute: (input: {
    dispute: PerformProOutcomeDispute;
    response: string;
    evidence: PerformProDisputeEvidenceInput[];
  }): Promise<PerformProOutcomeDispute> => {
    const identity = commandIdentity("outcome-dispute-response");
    return api.post<{ data: PerformProOutcomeDispute }>(
      `${BASE}/disputes/${input.dispute.uuid}/responses`,
      {
        expected_dispute_version: input.dispute.lock_version,
        response: input.response.trim(),
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeDispute>);
  },

  withdrawOutcomeDispute: (
    dispute: PerformProOutcomeDispute,
    reason: string,
  ): Promise<PerformProOutcomeDispute> => {
    const identity = commandIdentity("outcome-dispute-withdraw");
    return api.post<{ data: PerformProOutcomeDispute }>(
      `${BASE}/disputes/${dispute.uuid}/withdraw`,
      {
        expected_dispute_version: dispute.lock_version,
        reason: reason.trim(),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeDispute>);
  },

  resolveOutcomeDispute: (input: {
    dispute: PerformProOutcomeDispute;
    resolution: PerformProOutcomeDisputeResolution;
    summary: string;
    evidence: PerformProDisputeEvidenceInput[];
  }): Promise<PerformProOutcomeDispute> => {
    const identity = commandIdentity("outcome-dispute-resolve");
    return api.post<{ data: PerformProOutcomeDispute }>(
      `${BASE}/disputes/${input.dispute.uuid}/resolve`,
      {
        expected_dispute_version: input.dispute.lock_version,
        resolution_code: input.resolution,
        summary: input.summary.trim(),
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProOutcomeDispute>);
  },

  developmentPlans: (): Promise<PerformProDevelopmentPlanQueue> =>
    api.get<{ data: PerformProDevelopmentPlanQueue }>(
      `${BASE}/development-plans`,
    ).then(unwrap<PerformProDevelopmentPlanQueue>),

  developmentPlan: (
    planUuid: string,
  ): Promise<PerformProDevelopmentPlan> =>
    api.get<{ data: PerformProDevelopmentPlan }>(
      `${BASE}/development-plans/${planUuid}`,
    ).then(unwrap<PerformProDevelopmentPlan>),

  createDevelopmentPlan: (
    input: PerformProCreateDevelopmentPlanInput,
  ): Promise<PerformProDevelopmentPlan> => {
    const identity = commandIdentity("development-plan-create");
    return api.post<{ data: PerformProDevelopmentPlan }>(
      `${BASE}/outcomes/${input.outcome.uuid}/development-plans`,
      {
        expected_outcome_version: input.outcome.lock_version,
        title: input.title.trim(),
        summary: input.summary.trim(),
        target_completion_date: input.target_completion_date,
        development_needs: input.development_needs,
        goals: input.goals,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProDevelopmentPlan>);
  },

  recordDevelopmentCheckIn: (input: {
    plan: PerformProDevelopmentPlan;
    summary: string;
    blockers: string;
    supportNeeded: string;
    updates: PerformProDevelopmentUpdateInput[];
    evidence: PerformProDevelopmentEvidenceInput[];
  }): Promise<PerformProDevelopmentPlan> => {
    const identity = commandIdentity("development-check-in");
    return api.post<{ data: PerformProDevelopmentPlan }>(
      `${BASE}/development-plans/${input.plan.uuid}/check-ins`,
      {
        expected_plan_version: input.plan.lock_version,
        summary: input.summary.trim(),
        blockers: input.blockers.trim() || null,
        support_needed: input.supportNeeded.trim() || null,
        updates: input.updates,
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProDevelopmentPlan>);
  },

  completeDevelopmentPlan: (input: {
    plan: PerformProDevelopmentPlan;
    summary: string;
    evidence: PerformProDevelopmentEvidenceInput[];
  }): Promise<PerformProDevelopmentPlan> => {
    const identity = commandIdentity("development-plan-complete");
    return api.post<{ data: PerformProDevelopmentPlan }>(
      `${BASE}/development-plans/${input.plan.uuid}/complete`,
      {
        expected_plan_version: input.plan.lock_version,
        summary: input.summary.trim(),
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProDevelopmentPlan>);
  },

  pipCases: (): Promise<PerformProPipQueue> =>
    api.get<{ data: PerformProPipQueue }>(`${BASE}/pip-cases`)
      .then(unwrap<PerformProPipQueue>),

  pipCase: (caseUuid: string): Promise<PerformProPipCase> =>
    api.get<{ data: PerformProPipCase }>(`${BASE}/pip-cases/${caseUuid}`)
      .then(unwrap<PerformProPipCase>),

  initiatePipCase: (
    input: PerformProInitiatePipInput,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-initiate");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/outcomes/${input.outcome.uuid}/pip-cases`,
      {
        expected_outcome_version: input.outcome.lock_version,
        trigger_type: input.trigger_type,
        trigger_reason: input.trigger_reason.trim(),
        title: input.title.trim(),
        summary: input.summary.trim(),
        start_date: input.start_date,
        end_date: input.end_date,
        expectations: input.expectations.trim(),
        support_commitment: input.support_commitment.trim(),
        consequences_statement: input.consequences_statement.trim(),
        objectives: input.objectives,
        reviews: input.reviews,
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  decidePipCase: (
    pipCase: PerformProPipCase,
    decision: "approve" | "reject",
    reason: string,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity(`pip-${decision}`);
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${pipCase.uuid}/${decision}`,
      {
        expected_case_version: pipCase.lock_version,
        reason: reason.trim(),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  releasePipCase: (
    pipCase: PerformProPipCase,
    releaseReason: string,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-release");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${pipCase.uuid}/release`,
      {
        expected_case_version: pipCase.lock_version,
        release_reason: releaseReason.trim(),
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  checkInPipCase: (
    input: PerformProPipCheckInInput,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-check-in");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${input.pipCase.uuid}/check-ins`,
      {
        expected_case_version: input.pipCase.lock_version,
        summary: input.summary.trim(),
        blockers: input.blockers.trim() || null,
        support_needed: input.supportNeeded.trim() || null,
        updates: input.updates,
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  reviewPipCase: (
    input: PerformProPipReviewInput,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-review");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${input.pipCase.uuid}/reviews`,
      {
        expected_case_version: input.pipCase.lock_version,
        review_uuid: input.reviewUuid,
        review_outcome: input.reviewOutcome,
        summary: input.summary.trim(),
        employee_comments: input.employeeComments.trim() || null,
        manager_assessment: input.managerAssessment.trim(),
        hr_comments: input.hrComments.trim() || null,
        support_actions: input.supportActions.trim(),
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  extendPipCase: (
    input: PerformProPipExtensionInput,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-extend");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${input.pipCase.uuid}/extend`,
      {
        expected_case_version: input.pipCase.lock_version,
        new_end_date: input.newEndDate,
        reason: input.reason.trim(),
        reviews: input.reviews,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  closePipCase: (
    input: PerformProPipClosureInput,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity(`pip-${input.outcome.toLowerCase()}`);
    const endpoint = input.outcome === "ESCALATED" ? "escalate" : "close";
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${input.pipCase.uuid}/${endpoint}`,
      {
        expected_case_version: input.pipCase.lock_version,
        ...(input.outcome === "ESCALATED" ? {} : { outcome: input.outcome }),
        summary: input.summary.trim(),
        reason: input.reason.trim(),
        evidence: input.evidence,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  acknowledgePipCase: (
    pipCase: PerformProPipCase,
  ): Promise<PerformProPipCase> => {
    const identity = commandIdentity("pip-acknowledge");
    return api.post<{ data: PerformProPipCase }>(
      `${BASE}/pip-cases/${pipCase.uuid}/acknowledge`,
      {
        expected_case_version: pipCase.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPipCase>);
  },

  calibrationSessions: (): Promise<PerformProCalibrationSession[]> =>
    api.get<{ data: PerformProCalibrationSession[] }>(
      `${BASE}/calibration/sessions`,
    ).then(unwrap<PerformProCalibrationSession[]>),

  calibrationSetupCycles: (): Promise<PerformProCalibrationSetupCycle[]> =>
    api.get<{ data: PerformProCalibrationSetupCycle[] }>(
      `${BASE}/calibration/setup-cycles`,
    ).then(unwrap<PerformProCalibrationSetupCycle[]>),

  calibrationSession: (
    sessionUuid: string,
  ): Promise<PerformProCalibrationSession> =>
    api.get<{ data: PerformProCalibrationSession }>(
      `${BASE}/calibration/sessions/${sessionUuid}`,
    ).then(unwrap<PerformProCalibrationSession>),

  calibrationSetupContext: (
    cycleUuid: string,
  ): Promise<PerformProCalibrationSetupContext> =>
    api.get<{ data: PerformProCalibrationSetupContext }>(
      `${BASE}/cycles/${cycleUuid}/calibration/setup-context`,
    ).then(unwrap<PerformProCalibrationSetupContext>),

  createCalibrationSession: (
    input: PerformProCreateCalibrationSessionInput,
  ): Promise<PerformProCalibrationSession> => {
    const identity = commandIdentity("calibration-session-create");
    return api.post<{ data: PerformProCalibrationSession }>(
      `${BASE}/cycles/${input.cycleUuid}/calibration/sessions`,
      {
        name: input.name,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes,
        cohorts: input.cohorts,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCalibrationSession>);
  },

  openCalibrationSession: (
    session: PerformProCalibrationSession,
  ): Promise<PerformProCalibrationSession> => {
    const identity = commandIdentity("calibration-session-open");
    return api.post<{ data: PerformProCalibrationSession }>(
      `${BASE}/calibration/sessions/${session.uuid}/open`,
      {
        expected_execution_version: session.execution?.lock_version ?? 0,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCalibrationSession>);
  },

  adjustCalibrationScore: (
    input: PerformProAdjustCalibrationScoreInput,
  ): Promise<PerformProCalibrationSession> => {
    const identity = commandIdentity("calibration-score-adjust");
    return api.post<{ data: PerformProCalibrationSession }>(
      `${BASE}/calibration/sessions/${input.sessionUuid}`
        + `/participants/${input.participantSnapshotUuid}/adjustments`,
      {
        expected_execution_version: input.expectedExecutionVersion,
        adjusted_score: input.adjustedScore,
        reason_code: input.reasonCode,
        reason_detail: input.reasonDetail,
        review_flags: input.reviewFlags,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCalibrationSession>);
  },

  completeCalibrationSession: (
    session: PerformProCalibrationSession,
    completionNote: string,
  ): Promise<PerformProCalibrationSession> => {
    const identity = commandIdentity("calibration-session-complete");
    return api.post<{ data: PerformProCalibrationSession }>(
      `${BASE}/calibration/sessions/${session.uuid}/complete`,
      {
        expected_execution_version: session.execution?.lock_version ?? 0,
        completion_note: completionNote,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCalibrationSession>);
  },

  cycles: (state?: string): Promise<PerformProCycle[]> =>
    api.get<{ data: PerformProCycle[] }>(`${BASE}/cycles`, {
      params: state ? { state } : undefined,
    }).then(unwrap<PerformProCycle[]>),

  cycle: (uuid: string): Promise<PerformProCycleDetail> =>
    api.get<{ data: PerformProCycleDetail }>(`${BASE}/cycles/${uuid}`)
      .then(unwrap<PerformProCycleDetail>),

  participants: (
    cycleUuid: string,
    status?: PerformProParticipantStatus,
  ): Promise<{ items: PerformProParticipant[]; next_after_id: number | null }> =>
    api.get<{ data: { items: PerformProParticipant[]; next_after_id: number | null } }>(
      `${BASE}/cycles/${cycleUuid}/participants`,
      { params: status ? { status, limit: 200 } : { limit: 200 } },
    ).then(unwrap<{ items: PerformProParticipant[]; next_after_id: number | null }>),

  overrideReasons: (): Promise<PerformProReason[]> =>
    api.get<{ data: PerformProReason[] }>(`${BASE}/participant-override-reasons`)
      .then(unwrap<PerformProReason[]>),

  createCycle: (
    input: PerformProCreateCycleInput,
  ): Promise<PerformProCommandResult<PerformProCycleDetail>> => {
    const identity = commandIdentity("cycle-create");
    return api.post<{ data: PerformProCommandResult<PerformProCycleDetail> }>(
      `${BASE}/cycles`,
      {
        ...input,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProCycleDetail>>);
  },

  replacePopulationPolicy: (
    input: PerformProPopulationPolicyInput,
  ): Promise<{ cycle_version: number; policy_version: number }> =>
    api.post<{ data: { cycle_version: number; policy_version: number } }>(
      `${BASE}/cycles/${input.cycleUuid}/population-policy`,
      {
        expected_cycle_version: input.expectedCycleVersion,
        population_as_of: input.populationAsOf,
        rules: input.rules,
        occurred_at: new Date().toISOString(),
      },
    ).then(unwrap<{ cycle_version: number; policy_version: number }>),

  bindTemplate: (
    input: PerformProBindTemplateInput,
  ): Promise<{ cycle_version: number; binding: unknown }> =>
    api.post<{ data: { cycle_version: number; binding: unknown } }>(
      `${BASE}/cycles/${input.cycleUuid}/template-bindings`,
      {
        expected_cycle_version: input.expectedCycleVersion,
        binding_type: input.bindingType,
        binding_key: input.bindingKey,
        source_uuid: input.sourceUuid,
        source_version: input.sourceVersion,
        source_snapshot: input.sourceSnapshot,
        required: input.required,
        occurred_at: new Date().toISOString(),
      },
    ).then(unwrap<{ cycle_version: number; binding: unknown }>),

  latestPopulationPreview: (cycleUuid: string): Promise<PerformProPopulationPreview | null> =>
    api.get<{ data: PerformProPopulationPreview | null }>(
      `${BASE}/cycles/${cycleUuid}/population-previews/latest`,
    ).then(unwrap<PerformProPopulationPreview | null>),

  requestPopulationPreview: (
    cycle: PerformProCycle,
  ): Promise<PerformProCommandResult<PerformProPopulationPreview>> => {
    const identity = commandIdentity("population-preview");
    return api.post<{ data: PerformProCommandResult<PerformProPopulationPreview> }>(
      `${BASE}/cycles/${cycle.uuid}/population-previews`,
      {
        expected_cycle_version: cycle.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProPopulationPreview>>);
  },

  latestPopulationPublication: (cycleUuid: string): Promise<PerformProPopulationPublication | null> =>
    api.get<{ data: PerformProPopulationPublication | null }>(
      `${BASE}/cycles/${cycleUuid}/population-publications/latest`,
    ).then(unwrap<PerformProPopulationPublication | null>),

  requestPopulationPublication: (
    cycle: PerformProCycle,
    previewUuid: string,
  ): Promise<PerformProCommandResult<PerformProPopulationPublication>> => {
    const identity = commandIdentity("population-publication");
    return api.post<{ data: PerformProCommandResult<PerformProPopulationPublication> }>(
      `${BASE}/cycles/${cycle.uuid}/population-publications`,
      {
        preview_uuid: previewUuid,
        expected_cycle_version: cycle.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProPopulationPublication>>);
  },

  publishCycle: (cycle: PerformProCycle): Promise<PerformProCommandResult<PerformProCycle>> => {
    const identity = commandIdentity("cycle-publish");
    return api.post<{ data: PerformProCommandResult<PerformProCycle> }>(
      `${BASE}/cycles/${cycle.uuid}/publish`,
      {
        expected_cycle_version: cycle.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProCycle>>);
  },

  activateCycle: (
    cycle: PerformProCycle,
  ): Promise<PerformProCommandResult<PerformProCycle> & { task_count: number }> => {
    const identity = commandIdentity("cycle-activate");
    return api.post<{
      data: PerformProCommandResult<PerformProCycle> & { task_count: number };
    }>(
      `${BASE}/cycles/${cycle.uuid}/activate`,
      {
        expected_cycle_version: cycle.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProCycle> & { task_count: number }>);
  },

  progressCyclePhase: (
    cycle: PerformProCycle,
    phase: PerformProPhase,
    command: "advance" | "close",
  ): Promise<PerformProPhaseProgressionResult> => {
    const identity = commandIdentity(`cycle-phase-${command}`);
    const path = command === "advance"
      ? `${BASE}/cycles/${cycle.uuid}/phases/advance`
      : `${BASE}/cycles/${cycle.uuid}/close`;

    return api.post<{ data: PerformProPhaseProgressionResult }>(
      path,
      {
        expected_cycle_version: cycle.lock_version,
        expected_phase_version: phase.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProPhaseProgressionResult>);
  },

  reviewTasks: (cycleUuid: string): Promise<PerformProReviewTask[]> =>
    api.get<{ data: PerformProReviewTask[] }>(
      `${BASE}/cycles/${cycleUuid}/tasks`,
      { params: { limit: 200 } },
    ).then(unwrap<PerformProReviewTask[]>),

  selfReviewTasks: (): Promise<PerformProReviewTask[]> =>
    api.get<{ data: PerformProReviewTask[] }>(`${BASE}/self-reviews`)
      .then(unwrap<PerformProReviewTask[]>),

  selfReview: (taskUuid: string): Promise<PerformProSelfReviewDetail> =>
    api.get<{ data: PerformProSelfReviewDetail }>(
      `${BASE}/self-reviews/${taskUuid}`,
    ).then(unwrap<PerformProSelfReviewDetail>),

  saveSelfReviewDraft: (
    input: PerformProSaveSelfReviewDraftInput,
  ): Promise<PerformProSelfReviewDetail> => {
    const identity = commandIdentity("self-review-draft");
    return api.post<{ data: PerformProSelfReviewDetail }>(
      `${BASE}/self-reviews/${input.detail.task.uuid}/drafts`,
      {
        expected_task_version: input.detail.task.lock_version,
        expected_draft_version: input.detail.draft?.draft_version ?? 0,
        answers: input.answers,
        overall_summary: input.overallSummary.trim() || null,
        achievements: input.achievements.trim() || null,
        challenges: input.challenges.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProSelfReviewDetail>);
  },

  submitSelfReview: (
    detail: PerformProSelfReviewDetail,
  ): Promise<PerformProSelfReviewDetail> => {
    if (!detail.draft) {
      return Promise.reject(new Error("Save a self-review draft before submission."));
    }
    const identity = commandIdentity("self-review-submit");
    return api.post<{ data: PerformProSelfReviewDetail }>(
      `${BASE}/self-reviews/${detail.task.uuid}/submit`,
      {
        expected_task_version: detail.task.lock_version,
        expected_draft_version: detail.draft.draft_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProSelfReviewDetail>);
  },

  managerReviewTasks: (): Promise<PerformProReviewTask[]> =>
    api.get<{ data: PerformProReviewTask[] }>(`${BASE}/manager-reviews`)
      .then(unwrap<PerformProReviewTask[]>),

  managerReview: (taskUuid: string): Promise<PerformProManagerReviewDetail> =>
    api.get<{ data: PerformProManagerReviewDetail }>(
      `${BASE}/manager-reviews/${taskUuid}`,
    ).then(unwrap<PerformProManagerReviewDetail>),

  saveManagerReviewDraft: (
    input: PerformProSaveManagerReviewDraftInput,
  ): Promise<PerformProManagerReviewDetail> => {
    const identity = commandIdentity("manager-review-draft");
    return api.post<{ data: PerformProManagerReviewDetail }>(
      `${BASE}/manager-reviews/${input.detail.task.uuid}/drafts`,
      {
        expected_task_version: input.detail.task.lock_version,
        expected_draft_version: input.detail.draft?.draft_version ?? 0,
        answers: input.answers,
        overall_summary: input.overallSummary.trim() || null,
        strengths: input.strengths.trim() || null,
        development_areas: input.developmentAreas.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProManagerReviewDetail>);
  },

  submitManagerReview: (
    detail: PerformProManagerReviewDetail,
  ): Promise<PerformProManagerReviewDetail> => {
    if (!detail.draft) {
      return Promise.reject(new Error("Save a manager-review draft before submission."));
    }
    const identity = commandIdentity("manager-review-submit");
    return api.post<{ data: PerformProManagerReviewDetail }>(
      `${BASE}/manager-reviews/${detail.task.uuid}/submit`,
      {
        expected_task_version: detail.task.lock_version,
        expected_draft_version: detail.draft.draft_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProManagerReviewDetail>);
  },

  reviewWorkflow: (taskUuid: string): Promise<PerformProReviewWorkflow> =>
    api.get<{ data: PerformProReviewWorkflow }>(
      `${BASE}/review-workflow/${taskUuid}`,
    ).then(unwrap<PerformProReviewWorkflow>),

  executeReviewWorkflow: (
    input: PerformProReviewWorkflowInput,
  ): Promise<PerformProReviewWorkflowResult> => {
    const identity = commandIdentity(`review-workflow-${input.action}`);
    return api.post<{ data: PerformProReviewWorkflowResult }>(
      `${BASE}/review-workflow/${input.task.uuid}/${input.action}`,
      {
        expected_task_version: input.task.lock_version,
        reason: input.reason.trim(),
        exception_code: input.action === "waive"
          ? input.exceptionCode ?? null
          : null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProReviewWorkflowResult>);
  },

  feedback360Rosters: (): Promise<PerformProFeedback360Roster[]> =>
    api.get<{ data: PerformProFeedback360Roster[] }>(
      `${BASE}/feedback360/rosters`,
    ).then(unwrap<PerformProFeedback360Roster[]>),

  feedback360Roster: (
    participantUuid: string,
  ): Promise<PerformProFeedback360Roster> =>
    api.get<{ data: PerformProFeedback360Roster }>(
      `${BASE}/feedback360/rosters/${participantUuid}`,
    ).then(unwrap<PerformProFeedback360Roster>),

  feedback360EligibleReviewers: (
    participantUuid: string,
  ): Promise<PerformProFeedback360EligibleReviewer[]> =>
    api.get<{ data: PerformProFeedback360EligibleReviewer[] }>(
      `${BASE}/feedback360/rosters/${participantUuid}/eligible-reviewers`,
    ).then(unwrap<PerformProFeedback360EligibleReviewer[]>),

  saveFeedback360Nominations: (
    roster: PerformProFeedback360Roster,
    nominations: PerformProFeedback360NominationInput[],
  ): Promise<PerformProFeedback360Roster> =>
    api.post<{ data: PerformProFeedback360Roster }>(
      `${BASE}/feedback360/rosters/${roster.participant_uuid}/nominations`,
      {
        expected_roster_version: roster.lock_version,
        nominations,
        occurred_at: new Date().toISOString(),
      },
    ).then(unwrap<PerformProFeedback360Roster>),

  transitionFeedback360Roster: (
    roster: PerformProFeedback360Roster,
    action: "submit" | "approve" | "finalize",
  ): Promise<PerformProFeedback360Roster> => {
    const identity = commandIdentity(`feedback360-${action}`);
    return api.post<{ data: PerformProFeedback360Roster }>(
      `${BASE}/feedback360/rosters/${roster.participant_uuid}/${action}`,
      action === "finalize"
        ? {
          expected_roster_version: roster.lock_version,
          command_uuid: identity.command_uuid,
          occurred_at: identity.occurred_at,
        }
        : {
          expected_roster_version: roster.lock_version,
          occurred_at: identity.occurred_at,
        },
      action === "finalize"
        ? { headers: { "Idempotency-Key": identity.idempotencyKey } }
        : undefined,
    ).then(unwrap<PerformProFeedback360Roster>);
  },

  feedback360ResponseTasks: (): Promise<PerformProFeedback360ResponseTask[]> =>
    api.get<{ data: PerformProFeedback360ResponseTask[] }>(
      `${BASE}/feedback360/responses`,
    ).then(unwrap<PerformProFeedback360ResponseTask[]>),

  feedback360Response: (
    taskUuid: string,
  ): Promise<PerformProFeedback360ResponseDetail> =>
    api.get<{ data: PerformProFeedback360ResponseDetail }>(
      `${BASE}/feedback360/responses/${taskUuid}`,
    ).then(unwrap<PerformProFeedback360ResponseDetail>),

  saveFeedback360Draft: (
    input: PerformProSaveFeedback360DraftInput,
  ): Promise<PerformProFeedback360ResponseDetail> => {
    const identity = commandIdentity("feedback360-response-draft");
    return api.post<{ data: PerformProFeedback360ResponseDetail }>(
      `${BASE}/feedback360/responses/${input.detail.task.uuid}/drafts`,
      {
        expected_task_version: input.detail.task.lock_version,
        expected_draft_version: input.detail.draft?.draft_version ?? 0,
        answers: input.answers,
        overall_comment: input.overallComment.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProFeedback360ResponseDetail>);
  },

  submitFeedback360Response: (
    detail: PerformProFeedback360ResponseDetail,
  ): Promise<PerformProFeedback360ResponseDetail> => {
    if (!detail.draft) {
      return Promise.reject(new Error("Save a 360-feedback draft before submission."));
    }
    const identity = commandIdentity("feedback360-response-submit");
    return api.post<{ data: PerformProFeedback360ResponseDetail }>(
      `${BASE}/feedback360/responses/${detail.task.uuid}/submit`,
      {
        expected_task_version: detail.task.lock_version,
        expected_draft_version: detail.draft.draft_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProFeedback360ResponseDetail>);
  },

  feedback360Results: (): Promise<PerformProFeedback360Result[]> =>
    api.get<{ data: PerformProFeedback360Result[] }>(
      `${BASE}/feedback360/results`,
    ).then(unwrap<PerformProFeedback360Result[]>),

  feedback360Result: (
    participantUuid: string,
  ): Promise<PerformProFeedback360Result> =>
    api.get<{ data: PerformProFeedback360Result }>(
      `${BASE}/feedback360/results/${participantUuid}`,
    ).then(unwrap<PerformProFeedback360Result>),

  recalculateFeedback360Result: (
    result: PerformProFeedback360Result,
  ): Promise<PerformProFeedback360Result> => {
    const identity = commandIdentity("feedback360-results-recalculate");
    return api.post<{ data: PerformProFeedback360Result }>(
      `${BASE}/feedback360/results/${result.participant_uuid}/recalculate`,
      {
        expected_run_version: result.aggregate?.run_version ?? 0,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProFeedback360Result>);
  },

  releaseFeedback360Result: (
    result: PerformProFeedback360Result,
  ): Promise<PerformProFeedback360Result> => {
    if (!result.aggregate) {
      return Promise.reject(new Error("Calculate the 360 result before release."));
    }
    const identity = commandIdentity("feedback360-results-release");
    return api.post<{ data: PerformProFeedback360Result }>(
      `${BASE}/feedback360/results/${result.participant_uuid}/release`,
      {
        expected_run_version: result.aggregate.run_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProFeedback360Result>);
  },

  goals: (cycleUuid: string): Promise<PerformProGoal[]> =>
    api.get<{ data: PerformProGoal[] }>(`${BASE}/cycles/${cycleUuid}/goals`)
      .then(unwrap<PerformProGoal[]>),

  createGoal: (input: PerformProCreateGoalInput): Promise<PerformProGoal> => {
    const identity = commandIdentity("goal-create");
    return api.post<{ data: PerformProGoal }>(
      `${BASE}/cycles/${input.cycleUuid}/goals`,
      {
        participant_uuid: input.participantUuid,
        parent_goal_uuid: input.parentGoalUuid,
        goal_type: input.goalType,
        cascade_level: input.cascadeLevel,
        title: input.title,
        description: input.description,
        weightage_pct: input.weightagePct,
        start_value: input.startValue,
        target_value: input.targetValue,
        target_unit: input.targetUnit,
        due_date: input.dueDate,
        auto_score: input.autoScore,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProGoal>);
  },

  approveGoal: (goal: PerformProGoal): Promise<PerformProGoal> => {
    const identity = commandIdentity("goal-approve");
    return api.post<{ data: PerformProGoal }>(
      `${BASE}/goals/${goal.uuid}/approve`,
      {
        expected_goal_version: goal.lock_version,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProGoal>);
  },

  rejectGoal: (goal: PerformProGoal, reason: string): Promise<PerformProGoal> => {
    const identity = commandIdentity("goal-reject");
    return api.post<{ data: PerformProGoal }>(
      `${BASE}/goals/${goal.uuid}/reject`,
      {
        expected_goal_version: goal.lock_version,
        reason,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProGoal>);
  },

  reviseGoal: (input: PerformProReviseGoalInput): Promise<PerformProGoal> => {
    const identity = commandIdentity("goal-revision");
    return api.post<{ data: PerformProGoal }>(
      `${BASE}/goals/${input.goal.uuid}/revise`,
      {
        expected_goal_version: input.goal.lock_version,
        title: input.title,
        description: input.description,
        weightage_pct: input.weightagePct,
        start_value: input.startValue,
        target_value: input.targetValue,
        target_unit: input.targetUnit,
        due_date: input.dueDate,
        auto_score: input.autoScore,
        revision_note: input.revisionNote,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProGoal>);
  },

  goalCheckins: (goalUuid: string): Promise<PerformProGoalCheckin[]> =>
    api.get<{ data: PerformProGoalCheckin[] }>(
      `${BASE}/goals/${goalUuid}/check-ins`,
    ).then(unwrap<PerformProGoalCheckin[]>),

  goalRollups: (goalUuid: string): Promise<PerformProOkrRollup[]> =>
    api.get<{ data: PerformProOkrRollup[] }>(
      `${BASE}/goals/${goalUuid}/rollups`,
    ).then(unwrap<PerformProOkrRollup[]>),

  checkinGoal: (
    input: PerformProGoalCheckinInput,
  ): Promise<{ checkin: PerformProGoalCheckin; goal: PerformProGoal }> => {
    const identity = commandIdentity("goal-checkin");
    return api.post<{
      data: { checkin: PerformProGoalCheckin; goal: PerformProGoal };
    }>(
      `${BASE}/goals/${input.goal.uuid}/check-ins`,
      {
        expected_goal_version: input.goal.lock_version,
        current_value: input.currentValue,
        confidence_score: input.confidenceScore,
        note: input.note,
        blockers: input.blockers,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<{ checkin: PerformProGoalCheckin; goal: PerformProGoal }>);
  },

  changeParticipant: (
    participant: PerformProParticipant,
    action: "withdraw" | "restore",
    reasonCode: string,
    reasonNote?: string,
  ): Promise<PerformProCommandResult<PerformProParticipant>> => {
    const identity = commandIdentity(`participant-${action}`);
    return api.post<{ data: PerformProCommandResult<PerformProParticipant> }>(
      `${BASE}/participants/${participant.uuid}/${action}`,
      {
        expected_participant_version: participant.lock_version,
        reason_code: reasonCode,
        reason_note: reasonNote?.trim() || null,
        command_uuid: identity.command_uuid,
        occurred_at: identity.occurred_at,
      },
      { headers: { "Idempotency-Key": identity.idempotencyKey } },
    ).then(unwrap<PerformProCommandResult<PerformProParticipant>>);
  },
};
