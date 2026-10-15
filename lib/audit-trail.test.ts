import { describe, it, expect } from "vitest";
import {
  mapCombinedFeed,
  applyTimelineFilters,
  eventBadgeClass,
  shortSubject,
  actorLabel,
  renderDiffValue,
  type CombinedFeedItem,
} from "./audit-trail";

const feed: CombinedFeedItem[] = [
  { stream: "security", id: 5, event_type: "login_failed", risk_level: "medium", causer_id: 7, module: "connect-central", ip_address: "10.0.0.1", created_at: "2026-06-19T10:00:00Z" },
  { stream: "activity", id: 5, event_type: "view_cnic_data", risk_level: null, causer_id: 7, module: "people-hub", ip_address: null, created_at: "2026-06-18T10:00:00Z" },
  { stream: "business", id: 9, event_type: null, risk_level: null, causer_id: null, module: null, ip_address: null, created_at: "2026-06-17T10:00:00Z" },
];

describe("mapCombinedFeed (the combined-feed flat-contract fix)", () => {
  it("maps the flat backend array to TimelineItem[] with composite keys", () => {
    const items = mapCombinedFeed(feed);
    expect(items).toHaveLength(3);
    // Composite id avoids cross-stream key collisions (security#5 vs activity#5).
    expect(items.map((i) => i.id)).toEqual(["security-5", "activity-5", "business-9"]);
    expect(items[0]).toMatchObject({
      stream: "security",
      event_type: "login_failed",
      risk_level: "medium",
      module: "connect-central",
      ip_address: "10.0.0.1",
      causer_id: 7,
    });
  });

  it("normalises a null event_type to an em dash", () => {
    expect(mapCombinedFeed(feed)[2].event_type).toBe("—");
  });

  it("returns [] for an empty feed (the post-flatten empty state)", () => {
    expect(mapCombinedFeed([])).toEqual([]);
  });
});

describe("applyTimelineFilters", () => {
  const items = mapCombinedFeed(feed);

  it("filters by stream", () => {
    expect(applyTimelineFilters(items, { stream: "security" }).map((i) => i.stream)).toEqual(["security"]);
  });

  it("treats stream 'all' as a no-op", () => {
    expect(applyTimelineFilters(items, { stream: "all" })).toHaveLength(3);
  });

  it("filters by module", () => {
    expect(applyTimelineFilters(items, { module: "people-hub" }).map((i) => i.id)).toEqual(["activity-5"]);
  });

  it("filters by user_id (and ignores non-numeric input)", () => {
    expect(applyTimelineFilters(items, { user_id: "7" })).toHaveLength(2);
    expect(applyTimelineFilters(items, { user_id: "999" })).toHaveLength(0);
    expect(applyTimelineFilters(items, { user_id: "abc" })).toHaveLength(3);
  });

  it("treats date_to as inclusive of the whole end-of-day", () => {
    const r = applyTimelineFilters(items, { date_from: "2026-06-18", date_to: "2026-06-19" });
    expect(r.map((i) => i.id).sort()).toEqual(["activity-5", "security-5"]);
  });
});

describe("business-audit helpers", () => {
  it("shortSubject takes the class basename", () => {
    expect(shortSubject("App\\Models\\PeopleHub\\Employee")).toBe("Employee");
    expect(shortSubject(null)).toBe("—");
  });

  it("eventBadgeClass maps known events (case-insensitive) and falls back", () => {
    expect(eventBadgeClass("created")).toContain("emerald");
    expect(eventBadgeClass("UPDATED")).toContain("amber");
    expect(eventBadgeClass("deleted")).toContain("red");
    expect(eventBadgeClass("weird")).toContain("gray");
    expect(eventBadgeClass(null)).toContain("gray");
  });

  it("actorLabel labels the causer or System", () => {
    expect(actorLabel(7)).toBe("User #7");
    expect(actorLabel(null)).toBe("System");
  });

  it("renderDiffValue handles null/empty/object/scalar", () => {
    expect(renderDiffValue(null)).toBe("∅");
    expect(renderDiffValue("")).toBe("∅");
    expect(renderDiffValue(50000)).toBe("50000");
    expect(renderDiffValue({ a: 1 })).toBe('{"a":1}');
  });
});
