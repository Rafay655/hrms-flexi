export type MilestoneHealth = "on_track" | "at_risk" | "missed" | "achieved";
export type ProjectMilestone = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string;
  status: "pending" | "deferred" | "missed" | "achieved";
  is_gate: boolean;
  sort_order: number;
  health: MilestoneHealth;
  progress: {
    total_tasks: number;
    completed_tasks: number;
    done_tasks: number;
    cancelled_tasks: number;
    progress_pct: number;
  };
  achieved_at: string | null;
  achieved_by: number | null;
};
export type MilestoneReport = {
  summary: Record<MilestoneHealth, number>;
  milestones: ProjectMilestone[];
  capabilities: { manage: boolean };
};
export type MilestoneInput = {
  title: string;
  description: string | null;
  due_date: string;
  is_gate: boolean;
  sort_order?: number;
};
