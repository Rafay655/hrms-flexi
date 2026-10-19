import { describe, expect, it } from "vitest";
import { requestedDueDate } from "./projectedge-delays";
describe("requested delay date", () => {
  it("uses inclusive calendar-day additions across DST, leap and year boundaries", () => {
    expect(requestedDueDate("2026-03-07", "2")).toBe("2026-03-09");
    expect(requestedDueDate("2028-02-28", "1")).toBe("2028-02-29");
    expect(requestedDueDate("2026-12-31", "1")).toBe("2027-01-01");
  });
  it("rejects missing dates, zero, negative, fractional and oversized requests", () => {
    for (const days of ["", "0", "-1", "1.5", "366", "abc"])
      expect(requestedDueDate("2026-10-01", days)).toBeNull();
    expect(requestedDueDate(null, "2")).toBeNull();
  });
});
