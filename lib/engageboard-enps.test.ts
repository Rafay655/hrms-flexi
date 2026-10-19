import { describe, expect, it } from "vitest";
// Relative import, not the "@/" alias: vitest.config.ts has no
// resolve.alias / tsconfig-paths plugin at all, so the "@/" alias resolves
// NO value-level import in this repo's vitest setup, regardless of
// extension (confirmed empirically with throwaway probe files: both a
// .ts and a .tsx target failed identically via "@/", while the same .tsx
// target resolved fine via a relative specifier). This project's other
// passing test files only *look* like they use "@/" successfully — they
// do so exclusively via `import type { ... } from "@/..."`, which
// TypeScript erases entirely before Vite ever attempts to resolve a
// runtime module, so those tests never actually exercise the resolver.
// Round-1 review caught an earlier, wrong version of this comment that
// claimed the alias worked for .ts but not .tsx — corrected here.
import { classifyEnpsScore } from "../components/engageboard/eNPSScoreGauge";

/**
 * eNPS score → band classifier — 03-design-system.md §1.1. Boundary values
 * matter here (this mirrors the backend's own boundary-value test convention
 * for EB-ENPS-001's Promoter/Passive/Detractor split, per
 * 00-requirements-matrix.md).
 */
describe("classifyEnpsScore", () => {
  it("classifies negative scores as at-risk", () => {
    expect(classifyEnpsScore(-1).band).toBe("at-risk");
    expect(classifyEnpsScore(-100).band).toBe("at-risk");
  });

  it("classifies 0-19 as needs-improvement", () => {
    expect(classifyEnpsScore(0).band).toBe("needs-improvement");
    expect(classifyEnpsScore(19).band).toBe("needs-improvement");
  });

  it("classifies 20-49 as good", () => {
    expect(classifyEnpsScore(20).band).toBe("good");
    expect(classifyEnpsScore(49).band).toBe("good");
  });

  it("classifies 50-70 as excellent", () => {
    expect(classifyEnpsScore(50).band).toBe("excellent");
    expect(classifyEnpsScore(70).band).toBe("excellent");
  });

  it("classifies scores above 70 as world-class", () => {
    expect(classifyEnpsScore(71).band).toBe("world-class");
    expect(classifyEnpsScore(100).band).toBe("world-class");
  });

  it("always returns a human-readable label alongside the band (never color-only)", () => {
    expect(classifyEnpsScore(-10).label).toBe("At Risk");
    expect(classifyEnpsScore(85).label).toBe("World Class");
  });
});
