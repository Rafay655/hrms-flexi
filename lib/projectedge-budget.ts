import type { BudgetBurnPoint } from "@/types/projectedge-budget";
import { dayNumber } from "./projectedge-gantt";

export function budgetMoney(currency?: string | null): {
  label: string;
  format: (value: string) => string;
} {
  // Do not infer a financial denomination when the company has no valid ISO
  // currency. Keep values visible as amounts and explicitly mark the omission.
  if (currency && /^[A-Za-z]{3}$/.test(currency)) {
    try {
      const formatter = new Intl.NumberFormat("en", {
        style: "currency",
        currency: currency.toUpperCase(),
        currencyDisplay: "code",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return {
        label: currency.toUpperCase(),
        format: (value) => formatter.format(Number(value)),
      };
    } catch {
      /* Use the labelled, un-denominated fallback below. */
    }
  }
  const formatter = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return {
    label: "Currency not configured",
    format: (value) => formatter.format(Number(value)),
  };
}

// Rendering geometry only: all amounts and cumulative balances come from the
// budget endpoint, never from the frontend's differently scoped time-log cache.
export function burndownGeometry(points: BudgetBurnPoint[], planned: string) {
  const left = 76,
    top = 20,
    width = 600,
    height = 200;
  const values = [
    0,
    Number(planned),
    ...points.map((point) => Number(point.remaining)),
  ];
  const low = Math.min(...values),
    high = Math.max(...values);
  const span = high - low || 1;
  const first = dayNumber(points[0]?.date ?? "2000-01-01");
  const last = dayNumber(points.at(-1)?.date ?? "2000-01-01");
  const x = (date: string) =>
    left + ((dayNumber(date) - first) / (last - first || 1)) * width;
  const y = (amount: number) => top + ((high - amount) / span) * height;
  const coordinates = points.map((point) => ({
    ...point,
    x: x(point.date),
    y: y(Number(point.remaining)),
  }));
  // Step changes happen at approved work dates. Linear interpolation would
  // invent spending on dates with no contributing approved entries.
  const path = coordinates
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `H ${point.x} V ${point.y}`,
    )
    .join(" ");
  return {
    coordinates,
    path,
    plannedY: y(Number(planned)),
    zeroY: y(0),
    low,
    high,
    left,
    top,
    width,
    height,
  };
}
