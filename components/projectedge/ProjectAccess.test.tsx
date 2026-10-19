import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectListPage from "@/app/(system)/projectedge/projects/page";
import { ProjectEdgeProjectWorkspaceShell } from "./ProjectWorkspaceShell";
import { projectEdgeService } from "@/services/projectedge";

const auth = vi.hoisted(() => ({
  token: "qa-token" as string | null,
  user: { id: "1" } as { id: string } | null,
  company: { id: "1" } as { id: string } | null,
  permissions: ["projectedge.project.view", "projectedge.project.create", "projectedge.task.create"],
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) => select({ auth }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/projectedge/projects/7" }));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: { projects: vi.fn(), project: vi.fn() },
}));

const project = {
  id: 7, title: "Private project A", description: "Private header A",
  project_code: "PRJ-7", status: "active", priority: "high",
  completion_pct: 20, start_date: "2026-10-01", end_date: "2026-10-31",
};
const page = { items: [project], meta: { current_page: 1, last_page: 1, total: 1, per_page: 15, from: 1, to: 1 } };
const filters = { search: "", status: "", priority: "", page: 1 };
function scope() { return [auth.company?.id, auth.user?.id, [...auth.permissions].sort()]; }

beforeEach(() => {
  vi.resetAllMocks();
  auth.token = "qa-token";
  auth.user = { id: "1" };
  auth.company = { id: "1" };
  auth.permissions = ["projectedge.project.view", "projectedge.project.create", "projectedge.task.create"];
  vi.mocked(projectEdgeService.projects).mockResolvedValue(page as never);
  vi.mocked(projectEdgeService.project).mockResolvedValue(project as never);
});

describe.each(["list", "header"] as const)("ProjectEdge %s identity guards", (area) => {
  const read = () => area === "list" ? vi.mocked(projectEdgeService.projects) : vi.mocked(projectEdgeService.project);
  const result = () => area === "list" ? page : project;
  const key = () => area === "list"
    ? ["projectedge", "projects", scope(), filters]
    : ["projectedge", "project", 7, scope()];
  function mount(client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })) {
    const tree = () => <QueryClientProvider client={client}>{area === "list"
      ? <ProjectListPage />
      : <ProjectEdgeProjectWorkspaceShell projectId={7}><p>Private child A</p></ProjectEdgeProjectWorkspaceShell>}
    </QueryClientProvider>;
    const view = render(tree());
    return { ...view, client, refresh: () => view.rerender(tree()) };
  }

  it.each(["token", "user", "company", "grant"] as const)("fails closed with missing %s even with legacy cache", (missing) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(area === "list" ? ["projectedge", "projects", filters] : ["projectedge", "project", 7], result());
    if (missing === "grant") auth.permissions = ["projectedge.project.view-all", "projectedge.project.create"];
    else auth[missing] = null;
    mount(client);
    expect(screen.getByRole("heading", { name: "Project access required" })).toBeVisible();
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(screen.queryByText("Private child A")).not.toBeInTheDocument();
    expect(read()).not.toHaveBeenCalled();
  });

  it("hides cached data and children immediately on logout, with no new reads", async () => {
    const view = mount();
    await screen.findByText(project.title);
    expect(view.client.getQueryData(key())).toEqual(result());
    const calls = read().mock.calls.length;
    auth.token = null; // Guard also handles token loss before grants/user are cleared.
    view.refresh();
    expect(screen.getByText("Project access required")).toBeVisible();
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(screen.queryByText("Private child A")).not.toBeInTheDocument();
    expect(read()).toHaveBeenCalledTimes(calls);
  });

  it("does not reveal a late response after logout", async () => {
    let finish!: (value: never) => void;
    read().mockReturnValueOnce(new Promise<never>((resolve) => { finish = resolve; }));
    const view = mount();
    await waitFor(() => expect(read()).toHaveBeenCalledOnce());
    auth.token = null;
    auth.user = null;
    auth.company = null;
    auth.permissions = [];
    view.refresh();
    await act(async () => finish(result() as never));
    expect(screen.getByText("Project access required")).toBeVisible();
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(screen.queryByText("Private child A")).not.toBeInTheDocument();
    expect(read()).toHaveBeenCalledOnce();
  });

  it.each(["user", "company", "grants"] as const)("isolates same-client %s changes while the new read is pending", async (change) => {
    const view = mount();
    await screen.findByText(project.title);
    let finish!: (value: never) => void;
    const pending = new Promise<never>((resolve) => { finish = resolve; });
    read().mockReturnValueOnce(pending);
    if (change === "user") auth.user = { id: "2" };
    else if (change === "company") auth.company = { id: "2" };
    else auth.permissions = ["projectedge.project.view"];
    view.refresh();
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(screen.queryByText("Private child A")).not.toBeInTheDocument();
    await waitFor(() => expect(read()).toHaveBeenCalledTimes(2));
    const next = { ...project, title: "Project B", description: "Header B" };
    await act(async () => finish((area === "list" ? { ...page, items: [next] } : next) as never));
    await screen.findByText("Project B");
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(view.client.getQueryData(key())).toBeDefined();
    if (change === "grants") expect(screen.queryByRole("link", { name: area === "list" ? "Create project" : "Add task" })).not.toBeInTheDocument();
  });

  it("hides revoked-grant content without fetching even when a scoped cache exists", async () => {
    const view = mount();
    await screen.findByText(project.title);
    auth.permissions = [];
    view.client.setQueryData(key(), result());
    view.refresh();
    expect(screen.getByText("Project access required")).toBeVisible();
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(read()).toHaveBeenCalledOnce();
  });

  it("revalidates a fresh same-identity cache and hides it on access failure, then retries", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(key(), result());
    let reject!: (reason: Error) => void;
    read().mockReturnValueOnce(new Promise<never>((_, fail) => { reject = fail; }));
    mount(client);
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    await waitFor(() => expect(read()).toHaveBeenCalledOnce());
    await act(async () => reject(new Error("403 forbidden")));
    await screen.findByText(area === "list" ? "Projects are unavailable" : "Project unavailable");
    expect(screen.queryByText(project.title)).not.toBeInTheDocument();
    expect(screen.queryByText("Private child A")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText(project.title);
  });

  it("does not change cache scope for reordered permissions", async () => {
    const view = mount();
    await screen.findByText(project.title);
    auth.permissions.reverse();
    view.refresh();
    expect(screen.getByText(project.title)).toBeVisible();
    expect(read()).toHaveBeenCalledOnce();
  });
});
