import { describe, expect, it } from "vitest";

import {
  canReassignFrom,
  workloadLabel,
  exportFilename,
  REPORT_CATALOGUE,
  defaultReportWindow,
  formatReportValue,
  heatLevel,
  reportWindowError,
  flattenFieldErrors,
  moveItem,
  validateSlaForm,
  slaCoverageLabel,
  validateRoutingRuleForm,
  routingRuleSummary,
  ATTACHMENT_LIMITS,
  FIELD_LIMITS,
  attachmentProblem,
  MAX_FILES_PER_TICKET,
  canEscalateFrom,
  escalationTriggerLabel,
  formatFileSize,
  mapReplyServerErrors,
  nextWorkStatuses,
  remainingFileSlots,
  slaStateLabel,
  validateReason,
  validateReply,
  GRIEVANCE_STAGES,
  appealDaysLeft,
  evidenceProblem,
  filerNextStep,
  grievanceStatusLabel,
  grievanceTypeLabel,
  mapGrievanceServerErrors,
  stageState,
  validateCaseText,
  validateGrievanceForm,
  validateRevealReason,
  caseRoleLabel,
  formatReportCell,
  formatReportMetric,
  revocationKindLabel,
  validateRevocationReason,
  accessSourceLabel,
  csatRowLabel,
  formatNotHelpful,
  parseTags,
  publishBlockers,
  ratingLabel,
  shouldSuggest,
  validateCsat,
  validateKbArticle,
  newClientRequestId,
  priorityLabel,
  ticketStatusLabel,
  ticketStatusTone,
  validateTicketForm,
} from "./flexi-desk";

const file = (name: string, sizeKb: number): { name: string; size: number } => ({ name, size: sizeKb * 1024 });

const valid = {
  categoryUuid: "0b7c1c8e-1111-4111-8111-111111111111",
  subject: "Cannot connect to the office VPN",
  description: "Since this morning the VPN client refuses my credentials and I cannot work.",
  files: [] as { name: string; size: number }[],
};

describe("field limits mirror the backend (Rules V1-V3)", () => {
  it("exposes the documented numbers", () => {
    expect(FIELD_LIMITS).toEqual({ subjectMin: 10, subjectMax: 255, descriptionMin: 30, descriptionMax: 5000 });
    expect(ATTACHMENT_LIMITS.maxFiles).toBe(3);
    expect(ATTACHMENT_LIMITS.maxSizeKb).toBe(10240);
    expect(ATTACHMENT_LIMITS.extensions).toEqual(["pdf", "docx", "xlsx", "png", "jpg", "jpeg", "zip"]);
  });
});

describe("validateTicketForm", () => {
  it("accepts a valid form", () => {
    expect(validateTicketForm(valid)).toEqual({});
  });

  it("requires a category", () => {
    expect(validateTicketForm({ ...valid, categoryUuid: "" }).categoryUuid).toBeDefined();
  });

  it("enforces subject length at both boundaries", () => {
    expect(validateTicketForm({ ...valid, subject: "a".repeat(9) }).subject).toBeDefined();
    expect(validateTicketForm({ ...valid, subject: "a".repeat(10) }).subject).toBeUndefined();
    expect(validateTicketForm({ ...valid, subject: "a".repeat(255) }).subject).toBeUndefined();
    expect(validateTicketForm({ ...valid, subject: "a".repeat(256) }).subject).toBeDefined();
  });

  it("enforces description length at both boundaries", () => {
    expect(validateTicketForm({ ...valid, description: "a".repeat(29) }).description).toBeDefined();
    expect(validateTicketForm({ ...valid, description: "a".repeat(30) }).description).toBeUndefined();
    expect(validateTicketForm({ ...valid, description: "a".repeat(5000) }).description).toBeUndefined();
    expect(validateTicketForm({ ...valid, description: "a".repeat(5001) }).description).toBeDefined();
  });

  it("counts trimmed text, so padding cannot satisfy the minimum", () => {
    expect(validateTicketForm({ ...valid, subject: "   short   " }).subject).toBeDefined();
  });

  it("limits the number of attachments to three", () => {
    const four = [file("a.pdf", 1), file("b.pdf", 1), file("c.pdf", 1), file("d.pdf", 1)];
    expect(validateTicketForm({ ...valid, files: four }).files).toBeDefined();
    expect(validateTicketForm({ ...valid, files: four.slice(0, 3) }).files).toBeUndefined();
  });

  it("reports the first bad attachment", () => {
    expect(validateTicketForm({ ...valid, files: [file("ok.pdf", 5), file("bad.exe", 5)] }).files).toMatch(/bad\.exe/);
  });
});

describe("attachmentProblem", () => {
  it("accepts allowed types up to 10 MB, case-insensitively", () => {
    expect(attachmentProblem(file("Scan.PDF", 10240))).toBeNull();
    expect(attachmentProblem(file("photo.JPG", 1))).toBeNull();
  });

  it("rejects other extensions, oversize files and files without an extension", () => {
    expect(attachmentProblem(file("run.exe", 1))).not.toBeNull();
    expect(attachmentProblem(file("big.pdf", 10241))).not.toBeNull();
    expect(attachmentProblem(file("noextension", 1))).not.toBeNull();
  });
});

describe("status and priority wording", () => {
  it("uses employee-friendly wording for pending_info", () => {
    expect(ticketStatusLabel("pending_info", "employee")).toBe("Waiting for your response");
    expect(ticketStatusLabel("pending_info", "resolver")).toBe("Pending information");
  });

  it("labels every status", () => {
    const expected: Record<string, string> = {
      open: "Open", in_progress: "In progress", escalated: "Escalated", resolved: "Resolved", closed: "Closed", reopened: "Reopened",
    };
    for (const [status, label] of Object.entries(expected)) {
      expect(ticketStatusLabel(status as never, "employee")).toBe(label);
    }
  });

  it("never relies on colour alone: every status has a tone AND a text label", () => {
    for (const s of ["open", "in_progress", "escalated", "pending_info", "resolved", "closed", "reopened"] as const) {
      expect(ticketStatusTone(s)).toMatch(/bg-/);
      expect(ticketStatusLabel(s, "employee").length).toBeGreaterThan(0);
    }
  });

  it("labels priorities", () => {
    expect(priorityLabel("critical")).toBe("Critical");
    expect(priorityLabel("low")).toBe("Low");
  });
});

describe("newClientRequestId", () => {
  it("returns a unique id that fits the backend limit of 64 characters", () => {
    const a = newClientRequestId();
    const b = newClientRequestId();
    expect(a).not.toBe(b);
    expect(a.length).toBeLessThanOrEqual(64);
    expect(a.length).toBeGreaterThan(10);
  });
});

import { mapServerFieldErrors, parseApiError } from "./flexi-desk";

describe("parseApiError (platform error envelope)", () => {
  const axiosLike = (data: unknown) => ({ isAxiosError: true, response: { status: 422, data } });

  it("extracts code, message and field errors from error.*", () => {
    const parsed = parseApiError(
      axiosLike({ success: false, error: { code: "VALIDATION_FAILED", message: "The subject is too short.", field_errors: { subject: ["Too short."] } } }),
    );
    expect(parsed).toEqual({ code: "VALIDATION_FAILED", message: "The subject is too short.", hint: null, field_errors: { subject: ["Too short."] } });
  });

  it("surfaces domain errors such as the open-ticket limit with their hint", () => {
    const parsed = parseApiError(
      axiosLike({ success: false, error: { code: "FLEXIDESK_OPEN_TICKET_LIMIT", message: "You already have 5 open tickets.", hint: "Wait for one to be resolved." } }),
    );
    expect(parsed?.code).toBe("FLEXIDESK_OPEN_TICKET_LIMIT");
    expect(parsed?.hint).toBe("Wait for one to be resolved.");
  });

  it("returns null for anything that is not the envelope", () => {
    expect(parseApiError(new Error("network down"))).toBeNull();
    expect(parseApiError(axiosLike({ message: "plain" }))).toBeNull();
    expect(parseApiError(undefined)).toBeNull();
  });
});

describe("mapServerFieldErrors", () => {
  it("maps API field names onto the form's field names and keeps the first message", () => {
    expect(
      mapServerFieldErrors({
        category_uuid: ["The selected category is invalid.", "second"],
        subject: ["Too short."],
        "attachments.0": ["Not allowed."],
      }),
    ).toEqual({ categoryUuid: "The selected category is invalid.", subject: "Too short.", files: "Not allowed." });
  });

  it("ignores fields the form does not have", () => {
    expect(mapServerFieldErrors({ client_request_id: ["x"] })).toEqual({});
    expect(mapServerFieldErrors(undefined)).toEqual({});
  });
});

describe("validateReply", () => {
  it("rejects empty and whitespace-only messages", () => {
    expect(validateReply({ message: "", files: [] }).message).toBeTruthy();
    expect(validateReply({ message: "   \n ", files: [] }).message).toBeTruthy();
  });

  it("accepts a normal message with an allowed file", () => {
    expect(validateReply({ message: "Please see the attached log.", files: [file("log.pdf", 20)] })).toEqual({});
  });

  it("enforces the 5000 character ceiling after trimming", () => {
    expect(validateReply({ message: "a".repeat(5000), files: [] })).toEqual({});
    expect(validateReply({ message: "a".repeat(5001), files: [] }).message).toBeTruthy();
    expect(validateReply({ message: ` ${"a".repeat(5000)} `, files: [] })).toEqual({});
  });

  it("applies the same file rules as ticket creation", () => {
    expect(validateReply({ message: "ok", files: [file("run.exe", 1)] }).files).toBeTruthy();
    expect(validateReply({ message: "ok", files: [file("big.pdf", 10241)] }).files).toBeTruthy();
    expect(validateReply({ message: "ok", files: Array.from({ length: 4 }, (_, i) => file(`${i}.pdf`, 1)) }).files).toBeTruthy();
  });
});

describe("validateReason (escalate / de-escalate)", () => {
  it("needs twenty real characters, not padding", () => {
    expect(validateReason("too short")).toContain("at least 20");
    expect(validateReason(`${" ".repeat(30)}short`)).toContain("at least 20");
    expect(validateReason("VPN outage affects the whole finance team.")).toBeNull();
  });

  it("caps the reason at 2000 characters", () => {
    expect(validateReason("x".repeat(2000))).toBeNull();
    expect(validateReason("x".repeat(2001))).toContain("at most 2000");
  });
});

describe("status control", () => {
  it("offers working transitions only, never close/reopen/escalate", () => {
    expect(nextWorkStatuses("open")).toEqual(["in_progress"]);
    expect(nextWorkStatuses("in_progress")).toEqual(["pending_info", "resolved"]);
    expect(nextWorkStatuses("escalated")).toContain("in_progress");
    for (const s of ["open", "in_progress", "pending_info", "escalated", "resolved", "reopened", "closed"] as const) {
      expect(nextWorkStatuses(s)).not.toContain("escalated");
      expect(nextWorkStatuses(s)).not.toContain("closed");
      expect(nextWorkStatuses(s)).not.toContain("reopened");
    }
    expect(nextWorkStatuses("closed")).toEqual([]);
  });

  it("does not offer escalation on finished tickets", () => {
    expect(canEscalateFrom("in_progress")).toBe(true);
    expect(canEscalateFrom("escalated")).toBe(true);
    expect(canEscalateFrom("resolved")).toBe(false);
    expect(canEscalateFrom("closed")).toBe(false);
  });
});

describe("escalation wording", () => {
  it("always states the trigger", () => {
    expect(escalationTriggerLabel({ kind: "escalate", triggered_by: "sla_breach" })).toBe("Escalated automatically (SLA breach)");
    expect(escalationTriggerLabel({ kind: "escalate", triggered_by: "manual" })).toBe("Escalated manually");
    expect(escalationTriggerLabel({ kind: "deescalate", triggered_by: "manual" })).toBe("De-escalated manually");
  });

  it("labels every SLA state in words", () => {
    expect(slaStateLabel("breached")).toBe("SLA breached");
    expect(slaStateLabel("none")).toBe("No SLA");
  });
});

describe("file helpers", () => {
  it("formats sizes", () => {
    expect(formatFileSize(null)).toBe("");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("never reports negative room", () => {
    expect(remainingFileSlots(0)).toBe(MAX_FILES_PER_TICKET);
    expect(remainingFileSlots(MAX_FILES_PER_TICKET + 3)).toBe(0);
  });

  it("maps server reply errors to form fields", () => {
    expect(mapReplyServerErrors({ "attachments.0": ["bad file"], message: ["required"], other: ["x"] })).toEqual({ files: "bad file", message: "required" });
    expect(mapReplyServerErrors(undefined)).toEqual({});
  });
});

describe("grievance helpers", () => {
  const good = { grievanceType: "harassment", subject: "My manager keeps humiliating me", description: "x".repeat(40), files: [] as { name: string; size: number }[] };

  it("accepts a well-formed filing", () => {
    expect(validateGrievanceForm(good)).toEqual({});
  });

  it("measures text after trimming", () => {
    expect(validateGrievanceForm({ ...good, subject: "   short   " }).subject).toBeTruthy();
    expect(validateGrievanceForm({ ...good, description: ` ${"x".repeat(29)} ` }).description).toBeTruthy();
    expect(validateGrievanceForm({ ...good, description: "x".repeat(10001) }).description).toBeTruthy();
  });

  it("requires a real grievance type", () => {
    expect(validateGrievanceForm({ ...good, grievanceType: "" }).grievanceType).toBeTruthy();
    expect(validateGrievanceForm({ ...good, grievanceType: "nonsense" }).grievanceType).toBeTruthy();
  });

  it("rejects archives and executables as evidence, unlike ticket attachments", () => {
    expect(evidenceProblem(file("proof.zip", 10))).toBeTruthy();
    expect(evidenceProblem(file("run.exe", 10))).toBeTruthy();
    expect(evidenceProblem(file("proof.pdf", 10))).toBeNull();
    expect(evidenceProblem(file("big.pdf", 10241))).toBeTruthy();
    expect(validateGrievanceForm({ ...good, files: [file("a.zip", 1)] }).files).toBeTruthy();
    expect(validateGrievanceForm({ ...good, files: Array.from({ length: 4 }, (_, i) => file(`${i}.pdf`, 1)) }).files).toBeTruthy();
  });

  it("needs a real reason to reveal an identity", () => {
    expect(validateRevealReason("because")).toContain("at least 20");
    expect(validateRevealReason(`${" ".repeat(30)}short`)).toContain("at least 20");
    expect(validateRevealReason("The committee must notify the filer.")).toBeNull();
    expect(validateRevealReason("x".repeat(501))).toContain("at most 500");
  });

  it("checks case text is present and bounded", () => {
    expect(validateCaseText("   ")).toBeTruthy();
    expect(validateCaseText("The complaint is upheld.")).toBeNull();
    expect(validateCaseText("x".repeat(10001))).toBeTruthy();
  });

  it("builds the timeline from the seven stages in order", () => {
    expect(GRIEVANCE_STAGES).toHaveLength(7);
    expect(stageState("filed", "under_investigation")).toBe("done");
    expect(stageState("under_investigation", "under_investigation")).toBe("current");
    expect(stageState("closed", "under_investigation")).toBe("upcoming");
  });

  it("labels every stage and type in words", () => {
    for (const s of GRIEVANCE_STAGES) {
      expect(grievanceStatusLabel(s)).not.toBe("");
    }
    expect(grievanceTypeLabel("policy_violation")).toBe("Policy violation");
  });

  it("never promises a date the system does not hold", () => {
    for (const s of GRIEVANCE_STAGES) {
      expect(filerNextStep(s, true)).not.toMatch(/\d/);
    }
    expect(filerNextStep("ruling_issued", true)).toContain("appeal");
    expect(filerNextStep("ruling_issued", false)).toContain("closed");
  });

  it("counts the days left in the appeal window", () => {
    const now = new Date("2026-10-01T10:00:00Z");
    expect(appealDaysLeft("2026-10-08T18:59:59Z", now)).toBe(8);
    expect(appealDaysLeft("2026-10-01T18:00:00Z", now)).toBe(1);
    expect(appealDaysLeft("2026-09-30T10:00:00Z", now)).toBeNull();
    expect(appealDaysLeft(null, now)).toBeNull();
    expect(appealDaysLeft("not a date", now)).toBeNull();
  });

  it("maps server errors to the filing form", () => {
    expect(mapGrievanceServerErrors({ "attachments.0": ["bad file"], grievance_type: ["invalid"], other: ["x"] })).toEqual({ files: "bad file", grievanceType: "invalid" });
    expect(mapGrievanceServerErrors(undefined)).toEqual({});
  });
});

describe("access overlay and report helpers", () => {
  it("labels revocation kinds and case roles in words", () => {
    expect(revocationKindLabel("conflict_of_interest")).toBe("Conflict of interest");
    expect(caseRoleLabel("chairperson")).toBe("Chairperson");
    expect(caseRoleLabel("investigator")).toBe("Investigator");
    expect(caseRoleLabel("something_new")).toBe("something_new");
  });

  it("needs a real reason to revoke access", () => {
    expect(validateRevocationReason("short")).toContain("at least 20");
    expect(validateRevocationReason("Left the company on Friday; access must end.")).toBeNull();
  });

  it("shows a withheld cell as withheld, never as zero", () => {
    expect(formatReportCell({ count: null, suppressed: true })).toBe("Withheld (fewer than 5)");
    expect(formatReportCell({ count: 0, suppressed: false })).toBe("0");
    expect(formatReportCell({ count: 12, suppressed: false })).toBe("12");
    expect(formatReportCell(undefined)).toBe("—");
    expect(formatReportCell({ count: null, suppressed: true }, 3)).toBe("Withheld (fewer than 3)");
  });

  it("shows a withheld metric as not enough cases, never as zero", () => {
    expect(formatReportMetric(null)).toBe("Not enough cases");
    expect(formatReportMetric(undefined, "%")).toBe("Not enough cases");
    expect(formatReportMetric(0, "%")).toBe("0%");
    expect(formatReportMetric(42.5, "%")).toBe("42.5%");
  });
});

describe("knowledge base and CSAT helpers", () => {
  const okArticle = { title: "How to reset your VPN", body: "x".repeat(120), summary: "", tags: ["vpn"] };

  it("validates the editor form", () => {
    expect(validateKbArticle(okArticle)).toEqual({});
    expect(validateKbArticle({ ...okArticle, title: "abc" }).title).toBeTruthy();
    expect(validateKbArticle({ ...okArticle, body: "   " }).body).toBeTruthy();
    expect(validateKbArticle({ ...okArticle, body: "x".repeat(20001) }).body).toBeTruthy();
    expect(validateKbArticle({ ...okArticle, summary: "s".repeat(501) }).summary).toBeTruthy();
    expect(validateKbArticle({ ...okArticle, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).tags).toBeTruthy();
    expect(validateKbArticle({ ...okArticle, tags: ["x".repeat(31)] }).tags).toBeTruthy();
  });

  it("lists what blocks publishing: a category and 100 real characters", () => {
    expect(publishBlockers({ category: { uuid: "c" }, body: "x".repeat(100) })).toEqual([]);
    expect(publishBlockers({ category: null, body: "x".repeat(100) })).toHaveLength(1);
    expect(publishBlockers({ category: { uuid: "c" }, body: "short" })).toHaveLength(1);
    expect(publishBlockers({ category: null, body: "" })).toHaveLength(2);
    expect(publishBlockers({ category: { uuid: "c" }, body: `<p></p>${"<br>".repeat(60)}short` })).toHaveLength(1);
  });

  it("normalises tags", () => {
    expect(parseTags(" VPN, network , vpn,, ")).toEqual(["vpn", "network"]);
    expect(parseTags("")).toEqual([]);
  });

  it("shows a withheld not-helpful ratio as not enough votes, never zero", () => {
    expect(formatNotHelpful(null)).toBe("Not enough votes");
    expect(formatNotHelpful(0)).toBe("0% not helpful");
    expect(formatNotHelpful(0.4)).toBe("40% not helpful");
  });

  it("only asks for suggestions when there is something to ask", () => {
    expect(shouldSuggest("", "")).toBe(false);
    expect(shouldSuggest("", "ab")).toBe(false);
    expect(shouldSuggest("", "vpn")).toBe(true);
    expect(shouldSuggest("cat-uuid", "")).toBe(true);
  });

  it("validates a CSAT answer: rating 1-5, comments up to 500", () => {
    expect(validateCsat({ rating: 5, feedback: "" })).toEqual({});
    expect(validateCsat({ rating: 0, feedback: "" }).rating).toBeTruthy();
    expect(validateCsat({ rating: 6, feedback: "" }).rating).toBeTruthy();
    expect(validateCsat({ rating: 2.5, feedback: "" }).rating).toBeTruthy();
    expect(validateCsat({ rating: 3, feedback: "x".repeat(501) }).feedback).toBeTruthy();
    expect(validateCsat({ rating: 3, feedback: "x".repeat(500) })).toEqual({});
  });

  it("words the ratings and never names an under-sampled row", () => {
    expect(ratingLabel(1)).toBe("Very unhappy");
    expect(ratingLabel(5)).toBe("Very happy");
    expect(ratingLabel(9)).toBe("");
    expect(csatRowLabel({ insufficient_responses: true, resolver: { name: "Asha" } })).toBe("Insufficient responses");
    expect(csatRowLabel({ insufficient_responses: false, resolver: { name: "Asha" } })).toBe("Asha");
    expect(csatRowLabel({ insufficient_responses: false, category: { name: "IT" } })).toBe("IT");
    expect(csatRowLabel({ insufficient_responses: false })).toBe("Unassigned");
  });

  it("describes who has access and why", () => {
    expect(accessSourceLabel(["committee"], "chairperson")).toBe("Assigned: Chairperson");
    expect(accessSourceLabel(["global"], null)).toBe("Organisation-wide access");
    expect(accessSourceLabel(["committee", "global"], "member")).toBe("Assigned: Member · Organisation-wide access");
  });
});

describe("admin configuration helpers", () => {
  it("moves an item without mutating the list and clamps the target", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(list, 1, 99)).toEqual(["a", "c", "d", "b"]);
    expect(moveItem(list, 2, -5)).toEqual(["c", "a", "b", "d"]);
    expect(moveItem(list, 5, 0)).toEqual(list);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  const sla = { name: "IT standard", response_hours: 4, resolution_hours: 16, warning_at_percent: 80, working_hours_only: true, working_days: [1, 2, 3, 4, 5], workday_start: "09:00", workday_end: "18:00" };

  it("accepts a sound SLA and rejects response >= resolution", () => {
    expect(validateSlaForm(sla)).toEqual({});
    expect(validateSlaForm({ ...sla, response_hours: 16 }).resolution_hours).toMatch(/longer than the response/i);
    expect(validateSlaForm({ ...sla, response_hours: 20 }).resolution_hours).toBeDefined();
  });

  it("checks the name, hour ranges, warning percent, working days and the workday window", () => {
    expect(validateSlaForm({ ...sla, name: "  " }).name).toBeDefined();
    expect(validateSlaForm({ ...sla, response_hours: 0 }).response_hours).toBeDefined();
    expect(validateSlaForm({ ...sla, resolution_hours: 70000 }).resolution_hours).toBeDefined();
    expect(validateSlaForm({ ...sla, warning_at_percent: 100 }).warning_at_percent).toBeDefined();
    expect(validateSlaForm({ ...sla, warning_at_percent: 0 }).warning_at_percent).toBeDefined();
    expect(validateSlaForm({ ...sla, working_days: [] }).working_days).toBeDefined();
    expect(validateSlaForm({ ...sla, workday_end: "08:00" }).workday_end).toMatch(/after/i);
    // the working-hours window only matters when the clock is limited to working hours
    expect(validateSlaForm({ ...sla, working_hours_only: false, working_days: [], workday_end: "08:00" })).toEqual({});
  });

  it("says plainly when the SLA clock runs", () => {
    expect(slaCoverageLabel({ working_hours_only: false, working_days: [1], workday_start: "09:00", workday_end: "18:00", timezone: "Asia/Karachi" })).toBe("Runs around the clock, every day.");
    expect(slaCoverageLabel({ working_hours_only: true, working_days: [1, 2, 3, 4, 5], workday_start: "09:00", workday_end: "18:00", timezone: "Asia/Karachi" })).toBe("Runs Mon–Fri, 09:00–18:00 (Asia/Karachi).");
    expect(slaCoverageLabel({ working_hours_only: true, working_days: [1, 3, 6], workday_start: "10:00", workday_end: "14:00", timezone: "UTC" })).toBe("Runs Mon, Wed, Sat, 10:00–14:00 (UTC).");
    expect(slaCoverageLabel({ working_hours_only: true, working_days: [1, 2, 3, 4, 5, 6, 7], workday_start: "00:00", workday_end: "23:59", timezone: "UTC", holiday_provider: "leave_ease" })).toBe("Runs every day, 00:00–23:59 (UTC), skipping public holidays.");
  });

  const rule = { rule_name: "VPN to network team", match_category_uuid: "cat-1", match_sub_category_uuid: "", match_department_id: "", match_branch_uuid: "", match_priority: "", match_keywords: "", assign_to_user_uuid: "user-1", assign_to_department_id: "" };

  it("needs a name, one match condition and exactly one target", () => {
    expect(validateRoutingRuleForm(rule)).toEqual({});
    expect(validateRoutingRuleForm({ ...rule, rule_name: " " }).rule_name).toBeDefined();
    expect(validateRoutingRuleForm({ ...rule, match_category_uuid: "" }).match_category_uuid).toMatch(/at least one/i);
    expect(validateRoutingRuleForm({ ...rule, match_category_uuid: "", match_keywords: " , " }).match_category_uuid).toBeDefined();
    expect(validateRoutingRuleForm({ ...rule, match_category_uuid: "", match_keywords: "vpn" })).toEqual({});
    expect(validateRoutingRuleForm({ ...rule, assign_to_user_uuid: "" }).assign_to_user_uuid).toMatch(/exactly one/i);
    expect(validateRoutingRuleForm({ ...rule, assign_to_department_id: "7" }).assign_to_user_uuid).toMatch(/exactly one/i);
    expect(validateRoutingRuleForm({ ...rule, match_keywords: Array.from({ length: 21 }, (_, i) => `k${i}`).join(",") }).match_keywords).toBeDefined();
  });

  it("summarises a rule as when-and-then", () => {
    const lookups = { categories: { "cat-1": "IT" }, subCategories: { "sub-1": "VPN" }, departments: { "3": "Finance" }, branches: { "br-1": "Lahore" }, users: { "user-1": "Asha Khan" } };
    expect(routingRuleSummary({ match_category_uuid: "cat-1", match_sub_category_uuid: "sub-1", match_department_id: 3, match_branch_uuid: "br-1", match_priority: "high", match_keywords: ["vpn", "wifi"], assign_to_user_uuid: "user-1", assign_to_department_id: null, priority_override: "critical" }, lookups))
      .toEqual({ when: "Category IT · Sub-category VPN · Department Finance · Branch Lahore · Priority high · Keywords vpn, wifi", then: "Assign to Asha Khan · set priority to critical" });
    expect(routingRuleSummary({ match_priority: "low", assign_to_department_id: 3 }, lookups)).toEqual({ when: "Priority low", then: "Send to department Finance" });
    expect(routingRuleSummary({ match_category_uuid: "gone", assign_to_user_uuid: "ghost" }, lookups)).toEqual({ when: "Category (removed)", then: "Assign to (unknown person)" });
  });

  it("keeps the first API message per field and drops empty ones", () => {
    expect(flattenFieldErrors({ sort_order: ["Taken.", "Other."], name: [], "match_keywords.0": ["Too long."] })).toEqual({ sort_order: "Taken.", "match_keywords.0": "Too long." });
    expect(flattenFieldErrors(undefined)).toEqual({});
  });
});

describe("reports helpers", () => {
  const today = "2026-09-15";

  it("defaults to the last 30 days including today", () => {
    expect(defaultReportWindow(today)).toEqual({ from: "2026-08-17", to: "2026-09-15" });
  });

  it("validates the window the way the API does", () => {
    expect(reportWindowError("2026-08-17", "2026-09-15", today)).toBeNull();
    expect(reportWindowError("", "", today)).toBeNull();
    expect(reportWindowError("2026-09-10", "2026-09-01", today)).toMatch(/before/i);
    expect(reportWindowError("2026-09-01", "2026-09-30", today)).toMatch(/future/i);
    expect(reportWindowError("2025-01-01", "2026-09-15", today)).toMatch(/12 months/i);
    expect(reportWindowError("2025-09-15", "2026-09-15", today)).toBeNull();
    expect(reportWindowError("2025-09-14", "2026-09-15", today)).toMatch(/12 months/i);
    expect(reportWindowError("garbage", "2026-09-15", today)).toMatch(/valid date/i);
  });

  it("shows a withheld or empty figure as words, not as zero", () => {
    expect(formatReportValue(null, "percent")).toBe("Not enough data");
    expect(formatReportValue(66.7, "percent")).toBe("66.7%");
    expect(formatReportValue(100, "percent")).toBe("100%");
    expect(formatReportValue(13, "hours")).toBe("13.0 h");
    expect(formatReportValue(4.25, "hours")).toBe("4.3 h");
    expect(formatReportValue(0, "hours")).toBe("0.0 h");
    expect(formatReportValue(7, "count")).toBe("7");
    expect(formatReportValue(null, "count")).toBe("Not enough data");
    expect(formatReportValue(4.2, "rating")).toBe("4.2 / 5");
  });

  it("buckets a heatmap count into five levels relative to the busiest cell", () => {
    expect(heatLevel(0, 10)).toBe(0);
    expect(heatLevel(1, 10)).toBe(1);
    expect(heatLevel(10, 10)).toBe(4);
    expect(heatLevel(5, 10)).toBe(2);
    expect(heatLevel(3, 0)).toBe(0);
  });

  it("lists all ten reports; three live on their own screens", () => {
    expect(REPORT_CATALOGUE).toHaveLength(10);
    expect(REPORT_CATALOGUE.filter((r) => r.href)).toHaveLength(3);
    expect(REPORT_CATALOGUE.filter((r) => !r.href).map((r) => r.key)).toEqual([
      "ticket-volume", "sla-compliance", "escalation-rate", "resolution-time", "resolver-performance", "open-ticket-heatmap", "reopened-rate",
    ]);
    expect(new Set(REPORT_CATALOGUE.map((r) => r.key)).size).toBe(10);
  });

  it("names an export the way the server does, without needing to read its header", () => {
    expect(exportFilename("ticket-volume", "csv", "2026-08-17", "2026-09-15", "2026-09-15")).toBe("flexidesk-ticket-volume-2026-08-17_to_2026-09-15.csv");
    expect(exportFilename("sla-compliance", "pdf", "2026-07-01", "2026-09-15", "2026-09-15")).toBe("flexidesk-sla-compliance-2026-07-01_to_2026-09-15.pdf");
    expect(exportFilename("open-ticket-heatmap", "csv", "2026-08-17", "2026-09-15", "2026-09-15")).toBe("flexidesk-open-ticket-heatmap-2026-09-15.csv");
  });

  it("only an unfinished ticket can be reassigned", () => {
    for (const open of ["open", "in_progress", "escalated", "pending_info", "reopened"] as const) expect(canReassignFrom(open)).toBe(true);
    for (const done of ["resolved", "closed"] as const) expect(canReassignFrom(done)).toBe(false);
  });

  it("describes a person's workload for the assign picker", () => {
    expect(workloadLabel(0)).toBe("no open tickets");
    expect(workloadLabel(1)).toBe("1 open ticket");
    expect(workloadLabel(7)).toBe("7 open tickets");
  });
});
