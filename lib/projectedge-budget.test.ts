import { describe, expect, it } from "vitest";
import { budgetMoney, burndownGeometry } from "./projectedge-budget";
import { budgetFixture } from "@/components/projectedge/budget.fixture";

describe("budget presentation", () => {
  it("uses the configured currency while preserving signed values and zero", () => {
    expect(budgetMoney("pkr").format("-250.00")).toMatch(/PKR.*250\.00/);
    expect(budgetMoney("USD").format("0.00")).toMatch(/USD.*0\.00/);
    expect(budgetMoney(null).label).toBe("Currency not configured");
    expect(budgetMoney("rupees").format("1000.10")).toBe("1,000.10");
  });
  it("renders authoritative balances as steps rather than interpolating spending", () => {
    const points = budgetFixture.summary.burndown.points;
    const geometry = burndownGeometry(points, "1000.00");
    expect(geometry.coordinates[0].x).toBe(76);
    expect(geometry.coordinates.at(-1)?.x).toBe(676);
    expect(geometry.path).toContain("H ");
    expect(geometry.path).toContain("V ");
    expect(geometry.coordinates.at(-1)?.remaining).toBe("250.00");
    expect(geometry.plannedY).toBe(20);
    expect(geometry.zeroY).toBe(220);
  });
  it("retains negative balances and safely scales zero-valued reports", () => {
    const geometry = burndownGeometry(
      [
        {
          date: "2026-10-01",
          actual: "250.00",
          remaining: "-250.00",
          kind: "approved_cost",
        },
      ],
      "0.00",
    );
    expect(geometry.low).toBe(-250);
    expect(geometry.coordinates[0].y).toBe(220);
    expect(geometry.plannedY).toBe(20);
    const zero = burndownGeometry(
      [
        {
          date: "2026-10-01",
          actual: "0.00",
          remaining: "0.00",
          kind: "opening_balance",
        },
      ],
      "0.00",
    );
    expect(zero.path).not.toMatch(/NaN|Infinity/);
    expect(burndownGeometry([], "0.00").path).toBe("");
  });
});
