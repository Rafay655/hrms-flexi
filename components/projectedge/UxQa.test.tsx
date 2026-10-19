import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectEdgeStatePanel } from "./StatePanel";

describe("ProjectEdge UX QA guardrails", () => {
  it("contains long content in the module without disabling nested scrollers", () => {
    const css = readFileSync(resolve(process.cwd(), "app/(system)/projectedge/projectedge.css"), "utf8");
    const shell = css.match(/\.projectedge-shell\s*\{([\s\S]*?)\}/)?.[1];
    expect(shell).toContain("overflow-wrap: anywhere");
    expect(shell).toContain("overflow-x: clip");
    expect(css).toContain('.projectedge-shell:not([role="dialog"]) { position: relative; }');
    expect(shell).not.toContain("overflow: hidden");
    // Source guard only: real layout is verified in Chrome, not jsdom.
  });
  it.each(["todo", "in_progress", "in_review", "done", "on_hold", "cancelled"])("labels %s without relying on color", (status) => {
    render(<ProjectStatusBadge status={status} />);
    expect(screen.getByText(status.replaceAll("_", " "))).toBeVisible();
  });
  it("retains long empty-state copy and an accessible recovery action", () => {
    const title = "LongUnbrokenProjectTitle".repeat(9);
    render(<ProjectEdgeStatePanel kind="empty" title={title} description="No matching work." action={{ label: "Clear filters", onClick: vi.fn() }} />);
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeEnabled();
  });
  it("allows retrying an error without inventing successful data", () => {
    const retry = vi.fn();
    render(<ProjectEdgeStatePanel kind="error" title="Unable to load projects" description="Try again." action={{ label: "Retry", onClick: retry }} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Unable to load projects" })).toBeVisible();
  });
});
