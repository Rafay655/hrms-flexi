import { describe, expect, it } from "vitest";
import {
  isProjectEdgePathActive,
  visibleProjectEdgeNavigation,
  visibleProjectEdgeProjectTabs,
} from "./projectedge-navigation";

describe("ProjectEdge permission-aware navigation", () => {
  it("exposes Reports only with report-view permission", () => {
    expect(
      visibleProjectEdgeNavigation(["projectedge.report.view"]).map(
        (i) => i.key,
      ),
    ).toEqual(["reports"]);
    expect(
      visibleProjectEdgeNavigation(["projectedge.budget.view"]).map(
        (i) => i.key,
      ),
    ).not.toContain("reports");
  });
  it("shows employees only the routes their permissions authorize", () => {
    expect(
      visibleProjectEdgeNavigation([
        "projectedge.project.view",
        "projectedge.task.view",
        "projectedge.time.log",
      ]).map((item) => item.key),
    ).toEqual(["overview", "projects", "my-tasks", "timesheets"]);
  });

  it("keeps cost and audit tabs hidden without their explicit permissions", () => {
    const tabs = visibleProjectEdgeProjectTabs([
      "projectedge.project.view",
      "projectedge.task.view",
      "projectedge.gantt.view",
    ]).map((item) => item.key);

    expect(tabs).toEqual(["overview", "gantt", "board", "tasks", "milestones"]);
    expect(tabs).not.toContain("budget");
    expect(tabs).not.toContain("activity");
  });

  it("fails closed when no ProjectEdge permission is present", () => {
    expect(visibleProjectEdgeNavigation([])).toEqual([]);
    expect(visibleProjectEdgeProjectTabs(["peoplehub.employee.view"])).toEqual(
      [],
    );
  });
});

describe("isProjectEdgePathActive", () => {
  it("keeps the overview exact while matching nested module routes", () => {
    expect(isProjectEdgePathActive("/projectedge", "/projectedge")).toBe(true);
    expect(
      isProjectEdgePathActive("/projectedge/projects", "/projectedge"),
    ).toBe(false);
    expect(
      isProjectEdgePathActive(
        "/projectedge/projects/42",
        "/projectedge/projects",
      ),
    ).toBe(true);
    expect(
      isProjectEdgePathActive("/projectedge/my-tasks", "/projectedge/projects"),
    ).toBe(false);
  });
});
