/**
 * Flexi HRMS — Error Codes (AUTO-GENERATED)
 *
 * Source of truth: config/error-catalog.php
 * Generated:       2026-10-03T16:52:51+05:00
 * Regenerate:      php artisan errors:export-ts
 *
 * DO NOT EDIT BY HAND — changes will be overwritten.
 */

/** Every stable error code the API can return in error.code. */
export const ERROR_CODES = {
  c_c__u_s_e_r__i_n_a_c_t_i_v_e: 'CC_USER_INACTIVE',
  c_c__a_c_c_o_u_n_t__l_o_c_k_e_d: 'CC_ACCOUNT_LOCKED',
  c_c__i_n_v_a_l_i_d__c_r_e_d_e_n_t_i_a_l_s: 'CC_INVALID_CREDENTIALS',
  c_c__t_o_o__m_a_n_y__a_t_t_e_m_p_t_s: 'CC_TOO_MANY_ATTEMPTS',
  c_c_2_f_a__r_e_q_u_i_r_e_d: 'CC_2FA_REQUIRED',
  c_c__s_e_s_s_i_o_n__e_x_p_i_r_e_d: 'CC_SESSION_EXPIRED',
  c_c__s_e_s_s_i_o_n__l_i_m_i_t: 'CC_SESSION_LIMIT',
  c_c__i_p__n_o_t__a_l_l_o_w_e_d: 'CC_IP_NOT_ALLOWED',
  c_c__c_o_m_p_a_n_y__s_c_o_p_e: 'CC_COMPANY_SCOPE',
  c_c__s_e_s_s_i_o_n__s_e_l_f__r_e_v_o_k_e: 'CC_SESSION_SELF_REVOKE',
  c_c_2_f_a__i_n_v_a_l_i_d__c_o_d_e: 'CC_2FA_INVALID_CODE',
  c_c__r_e_c_o_v_e_r_y__c_o_d_e__i_n_v_a_l_i_d: 'CC_RECOVERY_CODE_INVALID',
  c_c__r_e_s_e_t__t_o_k_e_n__i_n_v_a_l_i_d: 'CC_RESET_TOKEN_INVALID',
  c_c__p_a_s_s_w_o_r_d__t_o_o__w_e_a_k: 'CC_PASSWORD_TOO_WEAK',
  c_c__p_a_s_s_w_o_r_d__r_e_u_s_e: 'CC_PASSWORD_REUSE',
  c_c__o_a_u_t_h__c_a_l_l_b_a_c_k__f_a_i_l_e_d: 'CC_OAUTH_CALLBACK_FAILED',
  p_a_y_e_d_g_e__p_r_e_c_h_e_c_k__f_a_i_l_e_d: 'PAYEDGE_PRECHECK_FAILED',
  p_a_y_e_d_g_e__p_r_e_c_h_e_c_k__b_l_o_c_k_e_d: 'PAYEDGE_PRECHECK_BLOCKED',
  p_a_y_e_d_g_e__p_e_r_i_o_d__l_o_c_k_e_d: 'PAYEDGE_PERIOD_LOCKED',
  p_a_y_e_d_g_e__a_l_r_e_a_d_y__p_r_o_c_e_s_s_e_d: 'PAYEDGE_ALREADY_PROCESSED',
  p_a_y_e_d_g_e__s_a_l_a_r_y__a_s_s_i_g_n_m_e_n_t__m_i_s_s_i_n_g: 'PAYEDGE_SALARY_ASSIGNMENT_MISSING',
  p_a_y_e_d_g_e__a_t_t_e_n_d_a_n_c_e__m_i_s_s_i_n_g: 'PAYEDGE_ATTENDANCE_MISSING',
  p_a_y_e_d_g_e__n_e_t__p_a_y__n_e_g_a_t_i_v_e: 'PAYEDGE_NET_PAY_NEGATIVE',
  p_a_y_e_d_g_e__b_u_l_k__r_e_v_i_s_i_o_n__l_i_m_i_t: 'PAYEDGE_BULK_REVISION_LIMIT',
  p_a_y_e_d_g_e__s_n_a_p_s_h_o_t__f_a_i_l_e_d: 'PAYEDGE_SNAPSHOT_FAILED',
  p_a_y_e_d_g_e__p_e_r_i_o_d__n_o_t__l_o_c_k_a_b_l_e: 'PAYEDGE_PERIOD_NOT_LOCKABLE',
  p_a_y_e_d_g_e__p_e_r_i_o_d__n_o_t__p_a_i_d: 'PAYEDGE_PERIOD_NOT_PAID',
  p_a_y_e_d_g_e__i_n_v_a_l_i_d__s_t_a_t_u_s__t_r_a_n_s_i_t_i_o_n: 'PAYEDGE_INVALID_STATUS_TRANSITION',
  p_a_y_e_d_g_e__w_o_r_k_f_l_o_w__i_n_v_a_l_i_d__s_t_e_p: 'PAYEDGE_WORKFLOW_INVALID_STEP',
  p_a_y_e_d_g_e__d_u_p_l_i_c_a_t_e__w_o_r_k_f_l_o_w: 'PAYEDGE_DUPLICATE_WORKFLOW',
  p_a_y_e_d_g_e__l_i_n_e__i_t_e_m__o_v_e_r_r_i_d_e__f_a_i_l_e_d: 'PAYEDGE_LINE_ITEM_OVERRIDE_FAILED',
  p_a_y_e_d_g_e__c_a_l_c_u_l_a_t_i_o_n__f_a_i_l_e_d: 'PAYEDGE_CALCULATION_FAILED',
  p_a_y_e_d_g_e__f_n_f__c_a_l_c_u_l_a_t_i_o_n__f_a_i_l_e_d: 'PAYEDGE_FNF_CALCULATION_FAILED',
  p_a_y_e_d_g_e__a_r_r_e_a_r__c_a_l_c_u_l_a_t_i_o_n__f_a_i_l_e_d: 'PAYEDGE_ARREAR_CALCULATION_FAILED',
  p_a_y_e_d_g_e__r_e_v_e_r_s_a_l__f_a_i_l_e_d: 'PAYEDGE_REVERSAL_FAILED',
  p_a_y_e_d_g_e__m_i_s_s_i_n_g__f_x__r_a_t_e: 'PAYEDGE_MISSING_FX_RATE',
  t_i_m_e_s_y_n_c__m_o_c_k__l_o_c_a_t_i_o_n__r_e_j_e_c_t_e_d: 'TIMESYNC_MOCK_LOCATION_REJECTED',
  t_i_m_e_s_y_n_c__g_e_o_f_e_n_c_e__o_u_t_s_i_d_e: 'TIMESYNC_GEOFENCE_OUTSIDE',
  d_m_s__s_h_a_r_e__e_x_p_i_r_e_d: 'DMS_SHARE_EXPIRED',
  d_m_s__v_a_u_l_t__l_o_c_k_e_d: 'DMS_VAULT_LOCKED',
  l_e_t_t_e_r_f_o_r_g_e__t_e_m_p_l_a_t_e__r_e_n_d_e_r: 'LETTERFORGE_TEMPLATE_RENDER',
  l_e_t_t_e_r_f_o_r_g_e__p_d_f__g_e_n_e_r_a_t_i_o_n: 'LETTERFORGE_PDF_GENERATION',
  l_o_a_n_h_u_b__e_l_i_g_i_b_i_l_i_t_y__f_a_i_l_e_d: 'LOANHUB_ELIGIBILITY_FAILED',
  l_o_a_n_h_u_b__e_m_i__c_a_l_c_u_l_a_t_i_o_n__f_a_i_l_e_d: 'LOANHUB_EMI_CALCULATION_FAILED',
  l_e_t_t_e_r_f_o_r_g_e__l_e_t_t_e_r__n_o_t__r_e_a_d_y: 'LETTERFORGE_LETTER_NOT_READY',
  l_e_t_t_e_r_f_o_r_g_e__l_e_t_t_e_r__r_e_c_a_l_l: 'LETTERFORGE_LETTER_RECALL',
  l_e_t_t_e_r_f_o_r_g_e__l_e_t_t_e_r__r_e_v_o_k_e: 'LETTERFORGE_LETTER_REVOKE',
  l_e_t_t_e_r_f_o_r_g_e__s_i_g_n_a_t_u_r_e__i_n_v_a_l_i_d: 'LETTERFORGE_SIGNATURE_INVALID',
  l_e_t_t_e_r_f_o_r_g_e__v_a_r_i_a_b_l_e_s__m_i_s_s_i_n_g: 'LETTERFORGE_VARIABLES_MISSING',
  l_e_t_t_e_r_f_o_r_g_e__t_e_m_p_l_a_t_e__u_n_p_u_b_l_i_s_h_e_d: 'LETTERFORGE_TEMPLATE_UNPUBLISHED',
  l_e_t_t_e_r_f_o_r_g_e__a_p_p_r_o_v_a_l__m_i_s_m_a_t_c_h: 'LETTERFORGE_APPROVAL_MISMATCH',
  l_e_t_t_e_r_f_o_r_g_e__a_i__n_o_t__c_o_n_f_i_g_u_r_e_d: 'LETTERFORGE_AI_NOT_CONFIGURED',
  l_e_t_t_e_r_f_o_r_g_e__a_i__r_e_q_u_e_s_t__f_a_i_l_e_d: 'LETTERFORGE_AI_REQUEST_FAILED',
  l_e_t_t_e_r_f_o_r_g_e__b_a_t_c_h__b_a_c_k_p_r_e_s_s_u_r_e: 'LETTERFORGE_BATCH_BACKPRESSURE',
  l_e_t_t_e_r_f_o_r_g_e__b_a_t_c_h__i_n_v_a_l_i_d__s_t_a_t_e: 'LETTERFORGE_BATCH_INVALID_STATE',
  l_e_t_t_e_r_f_o_r_g_e__b_a_t_c_h__e_m_p_t_y__e_m_p_l_o_y_e_e_s: 'LETTERFORGE_BATCH_EMPTY_EMPLOYEES',
  l_e_t_t_e_r_f_o_r_g_e__t_e_m_p_l_a_t_e__i_n__u_s_e: 'LETTERFORGE_TEMPLATE_IN_USE',
  c_o_m_p_l_i_a_n_c_e__r_e_c_o_r_d__l_o_c_k_e_d: 'COMPLIANCE_RECORD_LOCKED',
  l_o_a_n_h_u_b__i_n_v_a_l_i_d__s_t_a_t_e: 'LOANHUB_INVALID_STATE',
  l_o_a_n_h_u_b__a_p_p_r_o_v_a_l__n_o_t__a_l_l_o_w_e_d: 'LOANHUB_APPROVAL_NOT_ALLOWED',
  l_o_a_n_h_u_b__s_e_p_a_r_a_t_i_o_n__o_f__d_u_t_i_e_s: 'LOANHUB_SEPARATION_OF_DUTIES',
  l_o_a_n_h_u_b__l_o_a_n__t_y_p_e__i_n__u_s_e: 'LOANHUB_LOAN_TYPE_IN_USE',
  e_x_p_e_n_s_e_h_u_b__i_n_v_a_l_i_d__s_t_a_t_e: 'EXPENSEHUB_INVALID_STATE',
  e_x_p_e_n_s_e_h_u_b__d_u_p_l_i_c_a_t_e__r_e_c_e_i_p_t: 'EXPENSEHUB_DUPLICATE_RECEIPT',
  e_x_p_e_n_s_e_h_u_b__p_o_l_i_c_y__v_i_o_l_a_t_i_o_n: 'EXPENSEHUB_POLICY_VIOLATION',
  s_h_a_r_e_d__d_u_p_l_i_c_a_t_e__e_n_t_r_y: 'SHARED_DUPLICATE_ENTRY',
  w_f__t_a_s_k__a_l_r_e_a_d_y__d_e_c_i_d_e_d: 'WF_TASK_ALREADY_DECIDED',
  w_f__a_c_t_o_r__n_o_t__c_a_n_d_i_d_a_t_e: 'WF_ACTOR_NOT_CANDIDATE',
  w_f__s_o_d__s_e_l_f__a_p_p_r_o_v_a_l: 'WF_SOD_SELF_APPROVAL',
  w_f__t_e_n_a_n_t__m_i_s_m_a_t_c_h: 'WF_TENANT_MISMATCH',
  w_f__a_c_t_i_o_n__i_d_e_m_p_o_t_e_n_c_y__c_o_n_f_l_i_c_t: 'WF_ACTION_IDEMPOTENCY_CONFLICT',
  w_f__d_e_f_i_n_i_t_i_o_n__i_n_v_a_l_i_d: 'WF_DEFINITION_INVALID',
  w_f__r_e_g_i_s_t_r_y__r_e_f_e_r_e_n_c_e__m_i_s_s_i_n_g: 'WF_REGISTRY_REFERENCE_MISSING',
  w_f__v_e_r_s_i_o_n__i_m_m_u_t_a_b_l_e: 'WF_VERSION_IMMUTABLE',
  r_e_s_o_u_r_c_e__n_o_t__f_o_u_n_d: 'RESOURCE_NOT_FOUND',
  r_e_s_o_u_r_c_e__c_o_n_f_l_i_c_t: 'RESOURCE_CONFLICT',
  i_n_t_e_r_n_a_l__e_r_r_o_r: 'INTERNAL_ERROR',
  v_a_l_i_d_a_t_i_o_n__f_a_i_l_e_d: 'VALIDATION_FAILED',
  p_e_r_m_i_s_s_i_o_n__d_e_n_i_e_d: 'PERMISSION_DENIED',
  r_a_t_e__l_i_m_i_t_e_d: 'RATE_LIMITED',
  d_b__e_r_r_o_r: 'DB_ERROR',
} as const;

/** Union of all valid error code strings. */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Severity levels used by the API. */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Catalog metadata (module, http status, default message) per code. */
export const ERROR_CATALOG: Record<ErrorCode, {
  module: string;
  httpStatus: number;
  severity: ErrorSeverity;
  message: string;
}> = {
  'CC_USER_INACTIVE': { module: 'connect-central', httpStatus: 403, severity: 'warning', message: 'Your account is inactive. Please contact your administrator.' },
  'CC_ACCOUNT_LOCKED': { module: 'connect-central', httpStatus: 423, severity: 'warning', message: 'Account locked due to repeated failed logins.' },
  'CC_INVALID_CREDENTIALS': { module: 'connect-central', httpStatus: 401, severity: 'info', message: 'Invalid email or password.' },
  'CC_TOO_MANY_ATTEMPTS': { module: 'connect-central', httpStatus: 429, severity: 'warning', message: 'Too many attempts. Please wait before trying again.' },
  'CC_2FA_REQUIRED': { module: 'connect-central', httpStatus: 403, severity: 'info', message: 'Two-factor authentication is required.' },
  'CC_SESSION_EXPIRED': { module: 'connect-central', httpStatus: 401, severity: 'info', message: 'Your session has expired. Please log in again.' },
  'CC_SESSION_LIMIT': { module: 'connect-central', httpStatus: 422, severity: 'info', message: 'Concurrent session limit reached. Another session was disconnected.' },
  'CC_IP_NOT_ALLOWED': { module: 'connect-central', httpStatus: 403, severity: 'warning', message: 'Your IP address is not permitted to access this resource.' },
  'CC_COMPANY_SCOPE': { module: 'connect-central', httpStatus: 403, severity: 'warning', message: 'You do not have access to this company\'s data.' },
  'CC_SESSION_SELF_REVOKE': { module: 'connect-central', httpStatus: 422, severity: 'error', message: 'Cannot revoke your own current active session.' },
  'CC_2FA_INVALID_CODE': { module: 'connect-central', httpStatus: 422, severity: 'info', message: 'Invalid authentication code.' },
  'CC_RECOVERY_CODE_INVALID': { module: 'connect-central', httpStatus: 422, severity: 'info', message: 'Invalid recovery code.' },
  'CC_RESET_TOKEN_INVALID': { module: 'connect-central', httpStatus: 422, severity: 'info', message: 'Invalid or expired token.' },
  'CC_PASSWORD_TOO_WEAK': { module: 'connect-central', httpStatus: 422, severity: 'error', message: 'Password does not meet complexity requirements.' },
  'CC_PASSWORD_REUSE': { module: 'connect-central', httpStatus: 422, severity: 'error', message: 'Password has been used recently.' },
  'CC_OAUTH_CALLBACK_FAILED': { module: 'connect-central', httpStatus: 422, severity: 'warning', message: 'OAuth authentication failed. Please try again.' },
  'PAYEDGE_PRECHECK_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Payroll pre-check validation failed.' },
  'PAYEDGE_PRECHECK_BLOCKED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Pre-check found blocking errors. Force-processing is not allowed.' },
  'PAYEDGE_PERIOD_LOCKED': { module: 'payedge', httpStatus: 409, severity: 'error', message: 'Payroll period is locked and cannot be modified.' },
  'PAYEDGE_ALREADY_PROCESSED': { module: 'payedge', httpStatus: 409, severity: 'error', message: 'Payroll has already been processed for this period.' },
  'PAYEDGE_SALARY_ASSIGNMENT_MISSING': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'No active salary assignment found for employee.' },
  'PAYEDGE_ATTENDANCE_MISSING': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'No attendance records found for the employee in this period.' },
  'PAYEDGE_NET_PAY_NEGATIVE': { module: 'payedge', httpStatus: 422, severity: 'critical', message: 'Calculated net pay is negative for one or more employees.' },
  'PAYEDGE_BULK_REVISION_LIMIT': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Bulk salary revision cannot exceed 500 employees per batch.' },
  'PAYEDGE_SNAPSHOT_FAILED': { module: 'payedge', httpStatus: 500, severity: 'critical', message: 'Failed to capture or load the payroll snapshot.' },
  'PAYEDGE_PERIOD_NOT_LOCKABLE': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Period cannot be locked in its current state.' },
  'PAYEDGE_PERIOD_NOT_PAID': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Only locked periods can be marked as paid.' },
  'PAYEDGE_INVALID_STATUS_TRANSITION': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Status transition is not allowed for this payroll record.' },
  'PAYEDGE_WORKFLOW_INVALID_STEP': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'This workflow action is not allowed in the current step.' },
  'PAYEDGE_DUPLICATE_WORKFLOW': { module: 'payedge', httpStatus: 409, severity: 'error', message: 'An active payroll workflow already exists for this period.' },
  'PAYEDGE_LINE_ITEM_OVERRIDE_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Line item override failed validation.' },
  'PAYEDGE_CALCULATION_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Payroll calculation failed for one or more employees.' },
  'PAYEDGE_FNF_CALCULATION_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'F&F settlement calculation failed.' },
  'PAYEDGE_ARREAR_CALCULATION_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Arrear calculation failed.' },
  'PAYEDGE_REVERSAL_FAILED': { module: 'payedge', httpStatus: 422, severity: 'error', message: 'Payroll reversal operation failed.' },
  'PAYEDGE_MISSING_FX_RATE': { module: 'payedge', httpStatus: 422, severity: 'critical', message: 'No exchange rate found for the payroll period start date.' },
  'TIMESYNC_MOCK_LOCATION_REJECTED': { module: 'timesync', httpStatus: 422, severity: 'warning', message: 'Punch rejected: simulated GPS location detected.' },
  'TIMESYNC_GEOFENCE_OUTSIDE': { module: 'timesync', httpStatus: 422, severity: 'warning', message: 'You are outside the allowed punch location.' },
  'DMS_SHARE_EXPIRED': { module: 'dms', httpStatus: 410, severity: 'info', message: 'This share link has expired.' },
  'DMS_VAULT_LOCKED': { module: 'dms', httpStatus: 423, severity: 'error', message: 'The document vault is locked for this operation.' },
  'LETTERFORGE_TEMPLATE_RENDER': { module: 'letterforge', httpStatus: 422, severity: 'error', message: 'Letter template could not be rendered.' },
  'LETTERFORGE_PDF_GENERATION': { module: 'letterforge', httpStatus: 500, severity: 'critical', message: 'PDF generation service is temporarily unavailable.' },
  'LOANHUB_ELIGIBILITY_FAILED': { module: 'loanhub', httpStatus: 422, severity: 'info', message: 'You are not currently eligible for this loan request.' },
  'LOANHUB_EMI_CALCULATION_FAILED': { module: 'loanhub', httpStatus: 422, severity: 'info', message: 'These loan parameters cannot produce a valid EMI schedule.' },
  'LETTERFORGE_LETTER_NOT_READY': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'This letter is not ready for dispatch in its current state.' },
  'LETTERFORGE_LETTER_RECALL': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'This letter cannot be recalled right now.' },
  'LETTERFORGE_LETTER_REVOKE': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'This revoke/supersede action is not allowed for the letter.' },
  'LETTERFORGE_SIGNATURE_INVALID': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'This e-signature action is not allowed in the current state.' },
  'LETTERFORGE_VARIABLES_MISSING': { module: 'letterforge', httpStatus: 422, severity: 'error', message: 'Letter generation blocked: required template variables resolved to empty.' },
  'LETTERFORGE_TEMPLATE_UNPUBLISHED': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'Letter generation blocked: the template has no published version yet.' },
  'LETTERFORGE_APPROVAL_MISMATCH': { module: 'letterforge', httpStatus: 409, severity: 'error', message: 'The template changed after approval — the letter must be re-approved.' },
  'LETTERFORGE_AI_NOT_CONFIGURED': { module: 'letterforge', httpStatus: 503, severity: 'warning', message: 'The AI assistant is not configured on this system.' },
  'LETTERFORGE_AI_REQUEST_FAILED': { module: 'letterforge', httpStatus: 502, severity: 'error', message: 'The AI assistant could not be reached. Please try again.' },
  'LETTERFORGE_BATCH_BACKPRESSURE': { module: 'letterforge', httpStatus: 429, severity: 'warning', message: 'Too many concurrent letter batches are running. Please retry shortly.' },
  'LETTERFORGE_BATCH_INVALID_STATE': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'This batch action is not allowed in its current state.' },
  'LETTERFORGE_BATCH_EMPTY_EMPLOYEES': { module: 'letterforge', httpStatus: 422, severity: 'warning', message: 'Batch requires at least one employee id.' },
  'LETTERFORGE_TEMPLATE_IN_USE': { module: 'letterforge', httpStatus: 409, severity: 'error', message: 'This template cannot be deleted: dispatched letters still reference it.' },
  'COMPLIANCE_RECORD_LOCKED': { module: 'compliance', httpStatus: 422, severity: 'warning', message: 'This record belongs to a locked payroll period and cannot be edited.' },
  'LOANHUB_INVALID_STATE': { module: 'loanhub', httpStatus: 422, severity: 'warning', message: 'This action is not allowed in the current state.' },
  'LOANHUB_APPROVAL_NOT_ALLOWED': { module: 'loanhub', httpStatus: 422, severity: 'warning', message: 'Approval action not allowed.' },
  'LOANHUB_SEPARATION_OF_DUTIES': { module: 'loanhub', httpStatus: 403, severity: 'warning', message: 'You cannot action your own loan application.' },
  'LOANHUB_LOAN_TYPE_IN_USE': { module: 'loanhub', httpStatus: 409, severity: 'error', message: 'Cannot delete a loan type that has active or pending loans.' },
  'EXPENSEHUB_INVALID_STATE': { module: 'expensehub', httpStatus: 422, severity: 'warning', message: 'This action is not allowed in the current state.' },
  'EXPENSEHUB_DUPLICATE_RECEIPT': { module: 'expensehub', httpStatus: 422, severity: 'warning', message: 'A receipt with the same number, date and amount already exists.' },
  'EXPENSEHUB_POLICY_VIOLATION': { module: 'expensehub', httpStatus: 422, severity: 'error', message: 'The claim violates one or more expense policies.' },
  'SHARED_DUPLICATE_ENTRY': { module: 'shared', httpStatus: 409, severity: 'error', message: 'This record already exists — duplicate entry.' },
  'WF_TASK_ALREADY_DECIDED': { module: 'system-flex', httpStatus: 409, severity: 'error', message: 'This task has already been decided.' },
  'WF_ACTOR_NOT_CANDIDATE': { module: 'system-flex', httpStatus: 403, severity: 'error', message: 'You are not a candidate approver for this step.' },
  'WF_SOD_SELF_APPROVAL': { module: 'system-flex', httpStatus: 403, severity: 'error', message: 'Self-approval is prohibited on this workflow.' },
  'WF_TENANT_MISMATCH': { module: 'system-flex', httpStatus: 403, severity: 'error', message: 'Workflow object belongs to a different company.' },
  'WF_ACTION_IDEMPOTENCY_CONFLICT': { module: 'system-flex', httpStatus: 409, severity: 'warning', message: 'This action attempt is already running or finished.' },
  'WF_DEFINITION_INVALID': { module: 'system-flex', httpStatus: 422, severity: 'error', message: 'Workflow definition failed validation.' },
  'WF_REGISTRY_REFERENCE_MISSING': { module: 'system-flex', httpStatus: 422, severity: 'error', message: 'Definition references an unknown or inactive registry key.' },
  'WF_VERSION_IMMUTABLE': { module: 'system-flex', httpStatus: 409, severity: 'error', message: 'Published workflow versions are immutable.' },
  'RESOURCE_NOT_FOUND': { module: 'shared', httpStatus: 404, severity: 'info', message: 'The requested record was not found.' },
  'RESOURCE_CONFLICT': { module: 'shared', httpStatus: 409, severity: 'error', message: 'This record was modified by someone else. Refresh and try again.' },
  'INTERNAL_ERROR': { module: 'shared', httpStatus: 500, severity: 'critical', message: 'Something went wrong. Please try again.' },
  'VALIDATION_FAILED': { module: 'shared', httpStatus: 422, severity: 'info', message: 'The given data was invalid.' },
  'PERMISSION_DENIED': { module: 'shared', httpStatus: 403, severity: 'warning', message: 'You do not have permission to perform this action.' },
  'RATE_LIMITED': { module: 'shared', httpStatus: 429, severity: 'warning', message: 'Too many requests. Please slow down.' },
  'DB_ERROR': { module: 'shared', httpStatus: 500, severity: 'critical', message: 'A database error occurred. The team has been notified.' },
};

/** The unified error envelope returned by every API error response. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    module?: string;
    severity?: ErrorSeverity;
    hint?: string;
    context?: Record<string, unknown>;
    field_errors?: Record<string, string | string[]>;
    request_id: string;
    timestamp: string;
    status?: number;
  };
}

/** Success responses may carry non-fatal warnings in meta.warnings. */
export interface ApiWarning {
  code: ErrorCode;
  message: string;
  module?: string;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  request_id?: string;
  id?: string;
}

/** Type guard — is this response body a unified API error? */
export function isApiError(body: unknown): body is ApiErrorEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { success?: unknown }).success === false &&
    typeof (body as { error?: { code?: unknown } }).error?.code === 'string'
  );
}

/** Convenience — read error.code from an unknown thrown value. */
export function extractErrorCode(err: unknown): ErrorCode | undefined {
  return (err as { response?: { data?: ApiErrorEnvelope } })?.response?.data?.error?.code;
}
