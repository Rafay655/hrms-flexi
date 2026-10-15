import { describe, it, expect } from "vitest";
import {
  normalizeFieldDefinition,
  rowErrorsToMap,
  toPreviewRow,
  cellErrorFor,
  rowErrorSummary,
  autoMatchColumns,
  flexiMetaEntityUniverse,
  entityBadgeFor,
  fieldMatchesEntity,
  type FieldDefinition,
  type PreviewRow,
  type ImportRowApi,
} from "./flexi-import";

// ── normalizeFieldDefinition (FE↔BE shape reconciliation) ───────────────────────
describe("normalizeFieldDefinition", () => {
  it("maps the backend processor shape (field_key/available_values/note/entities)", () => {
    const out = normalizeFieldDefinition({
      field_key: "entity_type",
      label: "Entity Type",
      type: "text",
      required: true,
      available_values: ["departments", "designations"],
      note: "Which reference table this row imports into.",
      entities: ["departments", "designations"],
    });
    expect(out).toEqual({
      key: "entity_type",
      label: "Entity Type",
      type: "text",
      required: true,
      description: "Which reference table this row imports into.",
      allowed_values: ["departments", "designations"],
      entities: ["departments", "designations"],
    });
  });

  it("passes through the alternate shape (key/allowed_values/description)", () => {
    const out = normalizeFieldDefinition({
      key: "name",
      label: "Name",
      type: "text",
      required: true,
      allowed_values: ["a"],
      description: "Display name",
    });
    expect(out.key).toBe("name");
    expect(out.allowed_values).toEqual(["a"]);
    expect(out.description).toBe("Display name");
  });

  it("never produces an undefined key (guards autoMatchColumns' toLowerCase)", () => {
    const out = normalizeFieldDefinition({ label: "Orphan" });
    expect(out.key).toBe("");
    expect(typeof out.key).toBe("string");
    expect(out.required).toBe(false);
    expect(out.type).toBe("text");
  });
});

// ── rowErrorsToMap ──────────────────────────────────────────────────────────────
describe("rowErrorsToMap", () => {
  it("returns undefined for null/empty error lists", () => {
    expect(rowErrorsToMap(null)).toBeUndefined();
    expect(rowErrorsToMap([])).toBeUndefined();
  });

  it("keys messages by field and defaults a missing message", () => {
    expect(
      rowErrorsToMap([
        { field: "cnic", message: "Invalid CNIC" },
        { field: "name" },
      ])
    ).toEqual({ cnic: "Invalid CNIC", name: "Invalid value" });
  });

  it("ignores entries without a field", () => {
    expect(rowErrorsToMap([{ message: "no field" }])).toBeUndefined();
  });
});

// ── toPreviewRow ────────────────────────────────────────────────────────────────
describe("toPreviewRow", () => {
  const base: ImportRowApi = {
    row_number: 1,
    raw_data: { name: "Ada" },
    status: "valid",
    validation_errors: null,
    processing_error: null,
  };

  it("treats valid and committed as the correct (valid) status", () => {
    expect(toPreviewRow({ ...base, status: "valid" }).status).toBe("valid");
    expect(toPreviewRow({ ...base, status: "committed" }).status).toBe("valid");
  });

  it("treats invalid and failed as incorrect", () => {
    expect(toPreviewRow({ ...base, status: "invalid" }).status).toBe("invalid");
    expect(toPreviewRow({ ...base, status: "failed" }).status).toBe("invalid");
  });

  it("prefers field-level validation errors over the row-level processing error", () => {
    const row = toPreviewRow({
      ...base,
      status: "invalid",
      validation_errors: [{ field: "name", message: "Required" }],
      processing_error: "db write failed",
    });
    expect(row.errors).toEqual({ name: "Required" });
  });

  it("falls back to the processing error under the _row key", () => {
    const row = toPreviewRow({
      ...base,
      status: "failed",
      validation_errors: null,
      processing_error: "duplicate CNIC",
    });
    expect(row.errors).toEqual({ _row: "duplicate CNIC" });
  });

  it("defaults missing raw_data to an empty object", () => {
    expect(toPreviewRow({ ...base, raw_data: null }).fields).toEqual({});
  });
});

// ── cellErrorFor (the inconsistent-key matcher) ────────────────────────────────
describe("cellErrorFor", () => {
  const fields: FieldDefinition[] = [
    { key: "first_name", label: "First Name", type: "text", required: true },
  ];
  const mapping = { "First Name": "first_name" };

  const rowWith = (errors: Record<string, string>): PreviewRow => ({
    row_number: 1,
    fields: {},
    status: "invalid",
    errors,
  });

  it("matches an error keyed by the raw CSV header", () => {
    expect(
      cellErrorFor(rowWith({ "First Name": "Required" }), "First Name", mapping, fields)
    ).toBe("Required");
  });

  it("matches an error keyed by the mapped field key", () => {
    expect(
      cellErrorFor(rowWith({ first_name: "Required" }), "First Name", mapping, fields)
    ).toBe("Required");
  });

  it("matches an error keyed by the field's human label", () => {
    expect(
      cellErrorFor(rowWith({ "First Name": "Required" }), "First Name", mapping, fields)
    ).toBe("Required");
  });

  it("returns undefined when no key matches or there are no errors", () => {
    expect(cellErrorFor(rowWith({ other: "x" }), "First Name", mapping, fields)).toBeUndefined();
    expect(
      cellErrorFor({ row_number: 1, fields: {}, status: "valid" }, "First Name", mapping, fields)
    ).toBeUndefined();
  });
});

// ── rowErrorSummary ─────────────────────────────────────────────────────────────
describe("rowErrorSummary", () => {
  it("joins field: message pairs by newline", () => {
    const summary = rowErrorSummary({
      row_number: 1,
      fields: {},
      status: "invalid",
      errors: { cnic: "bad", name: "missing" },
    });
    expect(summary).toBe("cnic: bad\nname: missing");
  });

  it("is empty when the row has no errors", () => {
    expect(rowErrorSummary({ row_number: 1, fields: {}, status: "valid" })).toBe("");
  });
});

// ── autoMatchColumns ────────────────────────────────────────────────────────────
describe("autoMatchColumns", () => {
  const fields: FieldDefinition[] = [
    { key: "employee_code", label: "Employee Code", type: "text", required: true },
    { key: "joining_date", label: "Joining Date", type: "date", required: true },
  ];

  it("matches headers case-insensitively against label or key", () => {
    expect(autoMatchColumns(["employee code", "JOINING_DATE"], fields)).toEqual({
      "employee code": "employee_code",
      JOINING_DATE: "joining_date",
    });
  });

  it("leaves unmatched headers out of the mapping", () => {
    expect(autoMatchColumns(["totally_unknown"], fields)).toEqual({});
  });

  it("does not throw on a field with an empty key (post-normalisation)", () => {
    const withEmpty: FieldDefinition[] = [
      { key: "", label: "Orphan", type: "text", required: false },
    ];
    expect(() => autoMatchColumns(["orphan"], withEmpty)).not.toThrow();
    expect(autoMatchColumns(["orphan"], withEmpty)).toEqual({ orphan: "" });
  });
});

// ── FI-33 entity helpers ────────────────────────────────────────────────────────
describe("FlexiMeta entity helpers", () => {
  // entity_type/name are universal (all 6 entities); division is departments-only;
  // currency spans grade_bands + cost_centers.
  const ALL = [
    "departments",
    "designations",
    "grade_bands",
    "branches",
    "cost_centers",
    "employee_types",
  ];
  const fields: FieldDefinition[] = [
    { key: "entity_type", label: "Entity Type", type: "text", required: true, entities: ALL },
    { key: "name", label: "Name", type: "text", required: true, entities: ALL },
    { key: "division", label: "Division", type: "text", required: false, entities: ["departments"] },
    {
      key: "currency",
      label: "Currency",
      type: "text",
      required: false,
      entities: ["grade_bands", "cost_centers"],
    },
  ];

  it("flexiMetaEntityUniverse returns the sorted union of all referenced entities", () => {
    expect(flexiMetaEntityUniverse(fields)).toEqual([...ALL].sort());
  });

  it("flexiMetaEntityUniverse is empty for fields without entity metadata", () => {
    expect(
      flexiMetaEntityUniverse([{ key: "x", label: "X", type: "text", required: false }])
    ).toEqual([]);
  });

  it("entityBadgeFor is empty for universal fields and joined for scoped ones", () => {
    const size = ALL.length;
    expect(entityBadgeFor(fields[0], size)).toBe(""); // entity_type — universal
    expect(entityBadgeFor(fields[2], size)).toBe("departments"); // division
    expect(entityBadgeFor(fields[3], size)).toBe("grade_bands, cost_centers"); // currency
  });

  it("fieldMatchesEntity shows universal + matching-scoped fields and hides others", () => {
    // "" = no filter → everything shows
    expect(fields.every((f) => fieldMatchesEntity(f, ""))).toBe(true);

    // departments selected: entity_type, name (universal) + division show; currency hidden
    expect(fieldMatchesEntity(fields[0], "departments")).toBe(true);
    expect(fieldMatchesEntity(fields[2], "departments")).toBe(true);
    expect(fieldMatchesEntity(fields[3], "departments")).toBe(false);

    // grade_bands selected: currency shows; division hidden
    expect(fieldMatchesEntity(fields[3], "grade_bands")).toBe(true);
    expect(fieldMatchesEntity(fields[2], "grade_bands")).toBe(false);
  });
});
