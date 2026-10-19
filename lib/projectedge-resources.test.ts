import { describe, expect, it } from "vitest";
import {
  filterResourceRows,
  resourceRows,
  resourceWeeks,
  utilizationState,
} from "./projectedge-resources";
import {
  resourceFixture,
  resourceMatricesFixture,
} from "@/components/projectedge/resource.fixture";

describe("resource heatmap presentation", () => {
  it("anchors Monday weeks across Sunday, DST, leap day and year boundaries", () => {
    expect(resourceWeeks("2026-10-04", 4)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
    ]);
    expect(resourceWeeks("2026-03-08", 4)).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-16",
      "2026-03-23",
    ]);
    expect(resourceWeeks("2024-02-29", 4)[1]).toBe("2024-03-04");
    expect(resourceWeeks("2026-12-31", 8)).toHaveLength(8);
    expect(resourceWeeks("2026-12-31", 8)[1]).toBe("2027-01-04");
  });
  it("uses exact healthy/caution/overload boundaries and the server's overload flag", () => {
    for (const [percent, state] of [
      [0, "healthy"],
      [79.99, "healthy"],
      [80, "caution"],
      [100, "caution"],
      [100.01, "overloaded"],
    ] as const) {
      expect(
        utilizationState({ ...resourceFixture, utilization_pct: percent }),
      ).toBe(state);
    }
    expect(
      utilizationState({
        ...resourceFixture,
        utilization_pct: 99,
        is_overallocated: true,
      }),
    ).toBe("overloaded");
  });
  it("does not invent healthy percentages for absent, unconfigured or zero capacity", () => {
    expect(utilizationState()).toBe("no_allocation");
    expect(
      utilizationState({
        ...resourceFixture,
        capacity_status: "unconfigured",
        utilization_pct: 0,
      }),
    ).toBe("unknown");
    expect(
      utilizationState({
        ...resourceFixture,
        utilization_pct: null,
        is_overallocated: true,
      }),
    ).toBe("overloaded");
    expect(
      utilizationState({ ...resourceFixture, utilization_pct: null }),
    ).toBe("unknown");
    expect(utilizationState({ ...resourceFixture, utilization_pct: NaN })).toBe(
      "unknown",
    );
  });
  it("joins employee UUIDs across weeks without inventing missing capacity", () => {
    const rows = resourceRows(resourceMatricesFixture);
    expect(rows).toHaveLength(2);
    expect(rows[0].weeks[1]?.utilization_pct).toBe(90);
    expect(rows[1].weeks[1]).toBeUndefined();
    expect(rows[0].weeks[3]).toBeUndefined();
  });
  it("filters rows without recalculating their company-wide utilization", () => {
    const rows = resourceRows(resourceMatricesFixture);
    const selected = filterResourceRows(rows, {
      search: " emp-001 ",
      projectId: 7,
      state: "overloaded",
    });
    expect(selected).toHaveLength(1);
    expect(selected[0].weeks[0]?.utilization_pct).toBe(50);
    expect(
      filterResourceRows(rows, { search: "", projectId: 8, state: "all" })[0]
        .employeeCode,
    ).toBe("EMP-002");
    expect(
      filterResourceRows(rows, { search: "", state: "no_allocation" }),
    ).toHaveLength(2);
    expect(
      filterResourceRows(rows, { search: "", projectId: 999, state: "all" }),
    ).toHaveLength(0);
  });
});
