
export type ShiftType = "fixed" | "rotational" | "flexible" | "split";
export type RosterStatus = "draft" | "published" | "locked";
export type SwapStatus =
  | "pending_target"
  | "pending_manager"
  | "approved"
  | "rejected"
  | "cancelled";
export type AssignmentType = "default" | "temporary" | "override";
export type RuleCategory =
  | "attendance"
  | "break"
  | "overtime"
  | "premium"
  | "compliance"
  | "weekoff";

export type Employee = {
  id: number;
  code: string;
  name: string;
  department: string;
  location: string;
  entity_id: number;
  is_active: boolean;
};

export type ShiftRulePreset = {
  id: number;
  name: string;
  category: RuleCategory;
  description: string;
};

export type Shift = {
  id: number;
  entity_id: number;
  shift_code: string;
  shift_name: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  is_cross_day: boolean;
  break_start: string;
  break_end: string;
  break_minutes: number;
  working_minutes: number;
  grace_in_minutes: number;
  grace_out_minutes: number;
  buffer_in_minutes: number;
  buffer_out_minutes: number;
  overtime_allowed: boolean;
  max_ot_minutes: number | null;
  ot_requires_approval: boolean;
  night_premium_applicable: boolean;
  night_premium_rate: number | null;
  working_days: number[];
  weekly_off_days: number[];
  late_mark_after_minutes: number;
  half_day_threshold_minutes: number;
  absent_threshold_minutes: number;
  min_rest_between_shifts_hours: number;
  max_consecutive_days: number;
  early_clock_in_rounding_minutes: number;
  late_clock_out_rounding_minutes: number;
  paid_break_minutes: number;
  unpaid_break_minutes: number;
  geo_fence_required: boolean;
  requires_biometric: boolean;
  requires_manager_override: boolean;
  color_code: string;
  is_active: boolean;
  rules: number[];
};

export type RosterTemplateDay = {
  day: number;
  shift_id: number | null;
};

export type RosterTemplate = {
  id: number;
  entity_id: number;
  template_name: string;
  rotation_cycle_days: number;
  pattern: RosterTemplateDay[];
  auto_rotate: boolean;
  is_active: boolean;
  created_by: string;
};

export type Roster = {
  id: number;
  entity_id: number;
  roster_name: string;
  start_date: string;
  end_date: string;
  template_id: number | null;
  status: RosterStatus;
  total_employees: number;
  published_at: string | null;
  published_by: string | null;
  created_by: string;
};

export type RosterEntry = {
  id: number;
  roster_id: number;
  employee_id: number;
  roster_date: string;
  shift_id: number | null;
  is_weekly_off: boolean;
  is_holiday: boolean;
  notes: string;
};

export type ShiftSwapRequest = {
  id: number;
  roster_id: number;
  requester_id: number;
  target_id: number;
  requester_entry_id: number;
  target_entry_id: number;
  swap_date: string;
  reason: string;
  status: SwapStatus;
  target_response_at: string | null;
  manager_id: string | null;
  manager_response_at: string | null;
  rejection_reason: string;
};

export type EmployeeShiftAssignment = {
  id: number;
  employee_id: number;
  shift_id: number;
  valid_from: string;
  valid_to: string;
  assignment_type: AssignmentType;
  assigned_by: string;
};

export type ModuleData = {
  shifts: Shift[];
  templates: RosterTemplate[];
  rosters: Roster[];
  entries: RosterEntry[];
  swaps: ShiftSwapRequest[];
  assignments: EmployeeShiftAssignment[];
  rulePresets: ShiftRulePreset[];
};
