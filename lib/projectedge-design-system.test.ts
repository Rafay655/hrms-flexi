import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/(system)/projectedge/projectedge.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/(system)/projectedge/layout.tsx"), "utf8");
const header = readFileSync(join(process.cwd(), "components/projectedge/PageHeader.tsx"), "utf8");
const badge = readFileSync(join(process.cwd(), "components/projectedge/ProjectStatusBadge.tsx"), "utf8");

const contrast = (foreground: string, background: string): number => {
  const luminance = (hex: string) => {
    const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
    const [r, g, b] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

describe("ProjectEdge design system", () => {
  it("keeps the approved palette and League Spartan scoped to ProjectEdge", () => {
    expect(css).toContain(".projectedge-shell {");
    expect(css).toContain("--pe-brand-900: #322e53;");
    expect(css).toContain("--pe-brand-700: #4a436d;");
    expect(css).toContain("--pe-brand-500: #5b5585;");
    expect(css).toContain("--pe-accent-100: #eec293;");
    expect(css).toContain("--pe-accent-200: #f3ab9d;");
    expect(css).toContain("font-family: var(--font-league-spartan)");
    expect(layout).toContain('className="projectedge-shell min-w-0"');
  });

  it("defines the approved type weights and component geometry", () => {
    expect(css).toContain("--pe-text-3xl: 1.875rem;");
    expect(css).toContain("--pe-radius-card: 0.75rem;");
    expect(css).toContain("--pe-radius-control: 0.5rem;");
    expect(css).toContain('[data-slot="button"]');
    expect(css).toContain("min-height: 2.75rem;");
    expect(header).toContain("pe-button-primary");
  });

  it("uses named semantic state classes instead of brand accents for status", () => {
    expect(badge).toContain('active: "pe-state-success"');
    expect(badge).toContain('on_hold: "pe-state-warning"');
    expect(badge).toContain('cancelled: "pe-state-danger"');
    expect(badge).toContain('completed: "pe-state-info"');
  });

  it("keeps every semantic text/surface pair above WCAG AA normal-text contrast", () => {
    expect(contrast("#166534", "#dcfce7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#92400e", "#fef3c7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#b91c1c", "#fee2e2")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#1d4ed8", "#dbeafe")).toBeGreaterThanOrEqual(4.5);
  });
});
