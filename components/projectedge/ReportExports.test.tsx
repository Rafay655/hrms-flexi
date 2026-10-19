import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectEdgeService } from "@/services/projectedge";
import { ReportExports } from "./ReportExports";
import type { ReportExportJob, ReportId } from "@/types/projectedge-reports";
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    requestReportExport: vi.fn(),
    reportExportStatus: vi.fn(),
    downloadReportExport: vi.fn(),
  },
}));
const job: ReportExportJob = {
  uuid: "private-export",
  report: "project-status",
  format: "xlsx",
  status: "pending",
  record_count: null,
  file_name: null,
  expires_at: "2026-10-08",
  error_message: null,
};
function mount(id: ReportId = "project-status") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ReportExports
          id={id}
          filters={{ from: "2026-10-01", to: "2026-10-02" }}
          scope="company-a-user-a"
        />
      </QueryClientProvider>,
    ),
  };
}
describe("ReportExports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(projectEdgeService.requestReportExport).mockResolvedValue(job);
    vi.mocked(projectEdgeService.reportExportStatus).mockResolvedValue(job);
  });
  afterEach(cleanup);
  it("offers PNG only for Gantt and queues the complete report", async () => {
    const view = mount();
    expect(
      screen.queryByRole("option", { name: /Gantt snapshot/ }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Export format"), {
      target: { value: "xlsx" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Queue export" }));
    await screen.findByText(/Export: pending/);
    expect(projectEdgeService.requestReportExport).toHaveBeenCalledWith(
      "project-status",
      { from: "2026-10-01", to: "2026-10-02" },
      "xlsx",
      expect.any(AbortSignal),
    );
    expect(screen.getByRole("button", { name: "Queue export" })).toBeDisabled();
    view.unmount();
    mount("gantt-progress");
    expect(
      screen.getByRole("option", { name: /Gantt snapshot/ }),
    ).toBeInTheDocument();
  });
  it("hides cached download after status access fails", async () => {
    vi.mocked(projectEdgeService.reportExportStatus).mockResolvedValue({
      ...job,
      status: "complete",
      record_count: 101,
    });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Queue export" }));
    await screen.findByRole("button", { name: "Download export" });
    vi.mocked(projectEdgeService.reportExportStatus).mockRejectedValue(
      new Error("403"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh export status" }),
    );
    await screen.findByText(/Cached downloads are hidden/);
    expect(
      screen.queryByRole("button", { name: "Download export" }),
    ).not.toBeInTheDocument();
  });
  it("aborts private downloads on context unmount without opening returned bytes", async () => {
    vi.mocked(projectEdgeService.reportExportStatus).mockResolvedValue({
      ...job,
      status: "complete",
      file_name: "report.xlsx",
    });
    let resolveDownload!: (value: Blob) => void;
    vi.mocked(projectEdgeService.downloadReportExport).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDownload = resolve;
        }),
    );
    const create = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    const view = mount();
    fireEvent.click(screen.getByRole("button", { name: "Queue export" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Download export" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.downloadReportExport).toHaveBeenCalled(),
    );
    const signal = vi.mocked(projectEdgeService.downloadReportExport).mock
      .calls[0][1]!;
    view.unmount();
    expect(signal.aborted).toBe(true);
    resolveDownload(new Blob(["private"]));
    await Promise.resolve();
    expect(create).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("shows failures and permits a new request", async () => {
    vi.mocked(projectEdgeService.reportExportStatus).mockResolvedValue({
      ...job,
      status: "failed",
      error_message: "Export generation failed.",
    });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Queue export" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Queue export" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Download export" }),
    ).not.toBeInTheDocument();
  });
});
