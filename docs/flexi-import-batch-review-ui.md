# Batch review workspace

The batch detail page now uses a compact Poppins layout, square panels, shared section/modal components and four workspace tabs:

1. File & template: original file, batch UUID, pinned template version and server-authorized replacement.
2. Review data: server summary, paginated spreadsheet, row corrections, explicit re-check and missing references when there are gaps. The issues panel can be hidden to give wide sheets more space. Column visibility choices and audit lists have bounded scrolling.
3. Confirm import / Approval: processing policy or approval submission as appropriate to the server batch. Read-only stages have an explicit explanatory state. Final mutations retain confirmation dialogs and existing eligibility checks.
4. Results & history: actual processing totals, permitted failed-row retry/rollback, decisions and audit history. A queued request is never shown as a completed import.

The status header combines status, current guidance, last-check time and next action. The batch UUID is in the File tab rather than dominating every stage. There is no extra parent detail-fetch gate; the review component owns detail/status loading. Status polling uses the existing service envelope check and field normalizer.

Deferred row edits remain deferred: Save correction writes the changed fields; Re-check batch validates the saved draft. Pending drafts cannot be processed. Exact template/version, approval ownership, split-child, reconciliation, retry, replacement and rollback rules are unchanged. No new backend endpoints or unverified permissions were invented.

The suite's older API fixtures have been adapted to the ZIP's raw preview HTTP/deferred-recheck calls, and presentation assertions use the new navigation labels. These tests exercise workflow controls through mocks and one end-to-end adapter journey; they do not prove the named live batch's current state. No production API writes were made during this UI task.
