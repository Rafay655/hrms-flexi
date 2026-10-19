import { describe, expect, it } from "vitest";
import { REPORTS, canReadReport, reportValue } from "./projectedge-reports";

describe("report catalog and source permissions", () => {
  it("contains exactly nine distinct reports", () => {
    expect(REPORTS).toHaveLength(9);
    expect(new Set(REPORTS.map((r) => r.id)).size).toBe(9);
  });
  it("report access alone never unlocks financial or source data", () => {
    for (const report of REPORTS)
      expect(canReadReport(report.id, ["projectedge.report.view"])).toBe(false);
    expect(
      canReadReport("cost-burn", [
        "projectedge.report.view",
        "projectedge.project.view",
      ]),
    ).toBe(false);
    expect(
      canReadReport("cost-burn", [
        "projectedge.report.view",
        "projectedge.project.view",
        "projectedge.budget.view",
      ]),
    ).toBe(true);
  });
  it("personal reports require task, time and delay access without granting other employees' data", () => {
    expect(
      canReadReport("my-productivity", [
        "projectedge.report.view",
        "projectedge.task.view",
        "projectedge.time.log",
      ]),
    ).toBe(false);
    expect(
      canReadReport("my-productivity", [
        "projectedge.report.view",
        "projectedge.task.view",
        "projectedge.time.log",
        "projectedge.delay.submit",
      ]),
    ).toBe(true);
  });
  it("does not turn undefined denominators into zero", () => {
    expect(reportValue(null)).toBe("Unavailable");
    expect(reportValue(0)).toBe("0");
    expect(reportValue(false)).toBe("No");
    expect(reportValue(true)).toBe("Yes");
  });
});
