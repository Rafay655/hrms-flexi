import { api } from "@/lib/api";
import type {
  ProjectEdgeReport,
  ReportId,
  ReportFilters,
  ReportExportJob,
  ReportExportFormat,
} from "@/types/projectedge-reports";
import type { PersonalTask } from "@/types/projectedge-my-tasks";
import type { DelayTask, TaskDelay } from "@/types/projectedge-delays";
import type {
  BudgetReport,
  BudgetLine,
  BudgetLineInput,
} from "@/types/projectedge-budget";
import type { ResourceMatrix } from "@/types/projectedge-resources";
import type { TimeEntry, TimeEntryInput } from "@/types/projectedge-time";
import type {
  MilestoneReport,
  MilestoneInput,
  ProjectMilestone,
} from "@/types/projectedge-milestones";
import type { TaskDetail } from "@/types/projectedge-detail";
import type {
  BoardMove,
  BoardTask,
  TaskBlockState,
} from "@/types/projectedge-board";
import type {
  ProjectEdgeGantt,
  DependencyType,
} from "@/types/projectedge-gantt";
import type {
  CreateProjectEdgeProject,
  ProjectEdgePaginated,
  ProjectEdgePageMeta,
  ProjectEdgeProject,
  ProjectEdgeProjectFilters,
  ProjectEdgeTask,
  ProjectEdgeTaskInput,
} from "@/types/projectedge";

const BASE = "/projectedge";

type Envelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: ProjectEdgePageMeta;
};

const fallbackMeta = (length: number): ProjectEdgePageMeta => ({
  current_page: 1,
  last_page: 1,
  per_page: length,
  total: length,
  from: length ? 1 : null,
  to: length || null,
});

const paginate = <T>(payload: Envelope<T[]>): ProjectEdgePaginated<T> => ({
  items: payload.data ?? [],
  meta: payload.meta ?? fallbackMeta(payload.data?.length ?? 0),
});

export const projectEdgeService = {
  createTask: async (projectId: number, payload: ProjectEdgeTaskInput): Promise<BoardTask> => {
    const { data } = await api.post<Envelope<BoardTask>>(`${BASE}/tasks`, { ...payload, project_id: projectId });
    return data.data;
  },
  updateTask: async (id: number, payload: ProjectEdgeTaskInput): Promise<BoardTask> => {
    const { data } = await api.put<Envelope<BoardTask>>(`${BASE}/tasks/${id}`, payload);
    return data.data;
  },
  requestReportExport: async (
    id: ReportId,
    filters: ReportFilters,
    format: ReportExportFormat,
    signal?: AbortSignal,
  ): Promise<ReportExportJob> => {
    const { project_id, from, to } = filters;
    const { data } = await api.post<Envelope<ReportExportJob>>(
      `${BASE}/reports/${id}/exports`,
      { project_id, from, to, format },
      { signal },
    );
    return data.data;
  },
  reportExportStatus: async (
    uuid: string,
    signal?: AbortSignal,
  ): Promise<ReportExportJob> => {
    const { data } = await api.get<Envelope<ReportExportJob>>(
      `${BASE}/exports/${uuid}/status`,
      { signal },
    );
    return data.data;
  },
  downloadReportExport: async (
    uuid: string,
    signal?: AbortSignal,
  ): Promise<Blob> => {
    const { data } = await api.get<Blob>(`${BASE}/exports/${uuid}/download`, {
      responseType: "blob",
      signal,
    });
    return data;
  },
  report: async (
    id: ReportId,
    params: ReportFilters,
    signal?: AbortSignal,
  ): Promise<ProjectEdgeReport> => {
    const { data } = await api.get<Envelope<ProjectEdgeReport>>(
      `${BASE}/reports/${id}`,
      { params, signal },
    );
    return data.data;
  },
  allMyTasks: async (signal?: AbortSignal): Promise<PersonalTask[]> => {
    const tasks = new Map<number, PersonalTask>();
    let page = 1;
    let last = 1;
    do {
      const { data } = await api.get<Envelope<PersonalTask[]>>(
        `${BASE}/tasks/my`,
        { params: { page, per_page: 100 }, signal },
      );
      const result = paginate(data);
      result.items.forEach((task) => tasks.set(task.id, task));
      last = result.meta.last_page;
      page++;
    } while (page <= last);
    return [...tasks.values()];
  },
  pendingDelays: async (
    mine: boolean,
    page: number,
    signal?: AbortSignal,
  ): Promise<ProjectEdgePaginated<TaskDelay>> => {
    const { data } = await api.get<Envelope<TaskDelay[]>>(`${BASE}/delays`, {
      params: { mine: mine ? 1 : 0, page, per_page: 25 },
      signal,
    });
    return paginate(data);
  },
  delayTasks: async (
    search: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<ProjectEdgePaginated<DelayTask>> => {
    const { data } = await api.get<Envelope<DelayTask[]>>(`${BASE}/tasks`, {
      params: { search, page, per_page: 25 },
      signal,
    });
    return paginate(data);
  },
  submitDelay: async (
    taskId: number,
    payload: { delay_days: number; reason: string },
  ): Promise<TaskDelay> => {
    const { data } = await api.post<Envelope<TaskDelay>>(
      `${BASE}/tasks/${taskId}/delay`,
      payload,
    );
    return data.data;
  },
  reviewDelay: async (
    id: number,
    decision: "approve" | "reject",
    reviewerNote: string,
  ): Promise<TaskDelay> => {
    const { data } = await api.post<Envelope<TaskDelay>>(
      `${BASE}/delays/${id}/${decision}`,
      { reviewer_note: reviewerNote.trim() || null },
    );
    return data.data;
  },
  budgetReport: async (
    projectId: number,
    signal?: AbortSignal,
  ): Promise<BudgetReport> => {
    const { data } = await api.get<Envelope<BudgetReport>>(
      `${BASE}/projects/${projectId}/budget`,
      { signal },
    );
    return data.data;
  },
  saveBudgetLine: async (
    projectId: number,
    payload: BudgetLineInput,
    lineId?: number,
  ): Promise<BudgetLine> => {
    const { data } = lineId
      ? await api.put<Envelope<BudgetLine>>(
          `${BASE}/projects/${projectId}/budget/${lineId}`,
          payload,
        )
      : await api.post<Envelope<BudgetLine>>(
          `${BASE}/projects/${projectId}/budget`,
          payload,
        );
    return data.data;
  },
  resourceMatrices: async (
    weeks: string[],
    signal?: AbortSignal,
  ): Promise<ResourceMatrix[]> => {
    // The existing matrix route is weekly. A bounded all-or-nothing read keeps
    // unavailable weeks from being mistaken for zero utilization.
    if (weeks.length < 1 || weeks.length > 8)
      throw new Error("Choose between one and eight resource weeks.");
    return Promise.all(
      weeks.map(async (week) => {
        const { data } = await api.get<Envelope<ResourceMatrix>>(
          `${BASE}/resources/matrix`,
          { params: { week_start: week }, signal },
        );
        if (data.data.week_start !== week)
          throw new Error(
            "Resource matrix week does not match the requested week.",
          );
        return data.data;
      }),
    );
  },
  timeEntries: async (
    from: string,
    to: string,
    mine: boolean,
    signal?: AbortSignal,
  ): Promise<TimeEntry[]> => {
    const entries = new Map<number, TimeEntry>();
    let page = 1;
    let last = 1;
    do {
      const { data } = await api.get<Envelope<TimeEntry[]>>(`${BASE}/timelog`, {
        params: { from, to, mine: mine ? 1 : 0, page, per_page: 100 },
        signal,
      });
      const result = paginate(data);
      result.items.forEach((entry) => entries.set(entry.id, entry));
      last = result.meta.last_page;
      page++;
    } while (page <= last);
    return [...entries.values()];
  },
  saveTimeEntry: async (
    payload: TimeEntryInput,
    id?: number,
  ): Promise<TimeEntry> => {
    const { data } = id
      ? await api.put<Envelope<TimeEntry>>(`${BASE}/timelog/${id}`, payload)
      : await api.post<Envelope<TimeEntry>>(`${BASE}/timelog`, payload);
    return data.data;
  },
  timeEntryAction: async (
    id: number,
    action: "submit" | "approve" | "reject" | "delete",
    reason?: string,
  ): Promise<void> => {
    if (action === "delete") await api.delete(`${BASE}/timelog/${id}`);
    else
      await api.post(
        `${BASE}/timelog/${id}/${action}`,
        action === "reject" ? { reason } : undefined,
      );
  },
  milestoneReport: async (
    id: number,
    signal?: AbortSignal,
  ): Promise<MilestoneReport> => {
    const { data } = await api.get<Envelope<MilestoneReport>>(
      `${BASE}/projects/${id}/milestones`,
      { signal },
    );
    return data.data;
  },
  createMilestone: async (
    projectId: number,
    payload: MilestoneInput,
  ): Promise<ProjectMilestone> => {
    const { data } = await api.post<Envelope<ProjectMilestone>>(
      `${BASE}/projects/${projectId}/milestones`,
      payload,
    );
    return data.data;
  },
  updateMilestone: async (
    id: number,
    payload: Partial<MilestoneInput>,
  ): Promise<ProjectMilestone> => {
    const { data } = await api.put<Envelope<ProjectMilestone>>(
      `${BASE}/milestones/${id}`,
      payload,
    );
    return data.data;
  },
  achieveMilestone: async (id: number): Promise<ProjectMilestone> => {
    const { data } = await api.post<Envelope<ProjectMilestone>>(
      `${BASE}/milestones/${id}/achieve`,
    );
    return data.data;
  },
  deferMilestone: async (
    id: number,
    payload: { due_date: string; reason?: string },
  ): Promise<ProjectMilestone> => {
    const { data } = await api.post<Envelope<ProjectMilestone>>(
      `${BASE}/milestones/${id}/defer`,
      payload,
    );
    return data.data;
  },
  deleteMilestone: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/milestones/${id}`);
  },
  taskDetail: async (id: number, signal?: AbortSignal): Promise<TaskDetail> => {
    const { data } = await api.get<Envelope<TaskDetail>>(
      `${BASE}/tasks/${id}`,
      { signal },
    );
    return data.data;
  },
  addComment: async (
    id: number,
    payload: { body: string; parent_comment_id?: number; mentions: number[] },
  ): Promise<void> => {
    await api.post(`${BASE}/tasks/${id}/comments`, payload);
  },
  uploadAttachment: async (id: number, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await api.post(`${BASE}/tasks/${id}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteAttachment: async (id: number, attachmentId: number): Promise<void> => {
    await api.delete(`${BASE}/tasks/${id}/attachments/${attachmentId}`);
  },
  downloadAttachment: async (
    id: number,
    attachmentId: number,
  ): Promise<Blob> => {
    const { data } = await api.get<Blob>(`${BASE}/tasks/${id}`, {
      params: { attachment_id: attachmentId },
      responseType: "blob",
    });
    return data;
  },
  removeDependency: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/dependencies/${id}`);
  },
  boardTasks: async (
    projectId: number,
    signal?: AbortSignal,
  ): Promise<BoardTask[]> => {
    const tasks: BoardTask[] = [];
    for (let page = 1, lastPage = 1; page <= lastPage; page++) {
      const { data } = await api.get<Envelope<BoardTask[]>>(`${BASE}/tasks`, {
        params: { project_id: projectId, per_page: 100, page },
        signal,
      });
      const result = paginate(data);
      tasks.push(...result.items);
      lastPage = result.meta.last_page;
    }
    return [...new Map(tasks.map((task) => [task.id, task])).values()];
  },
  moveBoardTask: async (move: BoardMove): Promise<BoardTask> => {
    const { id, reorder, changeStatus, position, ...transition } = move;
    const { data } = await api.patch<Envelope<BoardTask>>(
      `${BASE}/tasks/${id}/${reorder ? "kanban-position" : "status"}`,
      reorder ? { ...(changeStatus ? transition : {}), position } : transition,
    );
    return data.data;
  },
  taskBlockState: async (id: number): Promise<TaskBlockState> => {
    const { data } = await api.get<Envelope<{ block_state: TaskBlockState }>>(
      `${BASE}/tasks/${id}/dependencies`,
    );
    return data.data.block_state;
  },
  projectMilestones: async (
    id: number,
  ): Promise<Array<{ id: number; title: string }>> => {
    const { data } = await api.get<
      Envelope<{ milestones: Array<{ id: number; title: string }> }>
    >(`${BASE}/projects/${id}/milestones`);
    return data.data.milestones;
  },
  gantt: async (id: number): Promise<ProjectEdgeGantt> => {
    const { data } = await api.get<Envelope<ProjectEdgeGantt>>(
      `${BASE}/projects/${id}/gantt`,
    );
    return data.data;
  },
  updateTaskDates: async (
    id: number,
    dates: { start_date: string; due_date: string },
  ): Promise<ProjectEdgeTask> => {
    const { data } = await api.put<Envelope<ProjectEdgeTask>>(
      `${BASE}/tasks/${id}`,
      dates,
    );
    return data.data;
  },
  addDependency: async (
    id: number,
    payload: {
      depends_on_task_id: number;
      dependency_type: DependencyType;
      lag_days: number;
    },
  ): Promise<void> => {
    await api.post(`${BASE}/tasks/${id}/dependencies`, payload);
  },
  projects: async (
    params?: ProjectEdgeProjectFilters,
    signal?: AbortSignal,
  ): Promise<ProjectEdgePaginated<ProjectEdgeProject>> => {
    const { data } = await api.get<Envelope<ProjectEdgeProject[]>>(
      `${BASE}/projects`,
      { params, signal },
    );
    return paginate(data);
  },

  project: async (id: number): Promise<ProjectEdgeProject> => {
    const { data } = await api.get<Envelope<ProjectEdgeProject>>(
      `${BASE}/projects/${id}`,
    );
    return data.data;
  },

  createProject: async (
    payload: CreateProjectEdgeProject,
  ): Promise<ProjectEdgeProject> => {
    const { data } = await api.post<Envelope<ProjectEdgeProject>>(
      `${BASE}/projects`,
      payload,
    );
    return data.data;
  },

  myTasks: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<ProjectEdgePaginated<ProjectEdgeTask>> => {
    const { data } = await api.get<Envelope<ProjectEdgeTask[]>>(
      `${BASE}/tasks/my`,
      { params },
    );
    return paginate(data);
  },
};
