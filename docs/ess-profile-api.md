> Current UI mode: ESS Profile is now an in-memory demo accessible to all signed-in users, without ESS permission checks. It uses a local avatar and sample LeaveEase, TimeSync, PayEdge, Loan Hub and Expense Hub summaries. No employee profile API is called by this demo page. The real API service and HR review queue remain available for later integration. The contract below describes that backend integration, not the current demo runtime.

# ESS profile integration status — 27 November 2026

The confirmed employee endpoints are now connected at `/people-hub/ess-profile`. Access requires both `ess.access` and `ess.profile.view-own`; correction and cancellation also require `ess.profile.edit-own`. Login permissions are read from Redux, independent of role names.

The HR review queue is connected at `/people-hub/profile-change-requests` with `employees.edit`. Backend authorization must reject the submitter and the affected employee from deciding, and revalidate policy/original values transactionally.

Profile, history and document queries are scoped by signed-in user and selected company, use zero inactive cache retention, and are not stored in browser storage. Downloads use authenticated binary requests and attachment filenames. Upload is not offered. Sensitive fields use server display_value and never reveal raw values. The backend must send `Cache-Control: private, no-store`.

Correction errors stay in the modal. A 409 refreshes profile/history and blocks retry from the stale dialog. The same reconciliation behavior is applied to HR decisions. No official field is optimistically modified.

The workspace summary endpoint in section 6 below is still a **proposal**, not part of the confirmed handoff. Financial/attendance/leave sample figures have been removed and these cards show unavailable until a summary API is confirmed.

Deployment remains a backend task: run `2026_11_27_130000_create_employee_profile_change_requests.php`, the additive `EssPermissionSeeder`, and refresh the route cache using the commands in the backend handoff. No migrations or seeding were executed by this frontend change.

The rest of this document preserves the earlier design proposal. Where it differs, the backend handoff above takes precedence: exact permissions are `ess.access`, `ess.profile.view-own`, `ess.profile.edit-own`; document upload is unavailable; HR review uses the separate confirmed endpoints.

---

# Employee self-service profile — backend API contract

Frontend route: `/people-hub/ess-profile`
Status: proposed contract for backend implementation. These routes have not been verified or connected. The redesigned frontend currently uses sample employee data and local change-request state. The signed-in name, email and avatar come from Redux.

## Purpose and ownership

Provide the authenticated employee's own profile using the existing HRMS records. Resolve the employee from the Sanctum user and company scope. Do not require employee_id in self-service requests. Never fetch the employee directory to locate the signed-in employee.

Reuse these existing sources:

| Information | Existing owner |
| --- | --- |
| Identity, contact, emergency, employment, bank details | People Hub onboarding employee record and saved dynamic fields |
| Field labels, visibility and validation | Flexi HQ onboarding form builder |
| Division, department, designation, branch, employment type, grade band | Company/FlexiMeta lookup records |
| Reporting manager | Employee reporting hierarchy |
| Shift | Current TimeSync shift/roster resolution |
| Attendance and schedule | Existing TimeSync self-service pages |
| Leave balances and requests | Existing LeaveEase self-service pages |
| Documents | Employee document associations and DMS |
| Login email and avatar | Authenticated user record |

Include authorized self-service leave, attendance, payroll, loan and expense summaries using their owning module services. Do not duplicate their records or include disciplinary records in this aggregate. The UI links to relevant existing modules for full details. Summary values currently shown in the frontend are sample data. Do not calculate tenure from created_at. Use joining_date.

## Common contract

Base URL: `{{base_url}}` already includes `/api/v1`.

Headers:

```http
Authorization: Bearer {{token}}
Accept: application/json
X-Company-ID: {{selected_company_uuid}}
Content-Type: application/json
```

Use the project's company resolver and existing error envelope. Company scope is a header, never a body field. Dates use `YYYY-MM-DD`; timestamps use ISO 8601 with timezone. IDs are UUID strings unless a lookup explicitly uses integer IDs. Null means missing. Preserve CNIC, phone, account number and IBAN as strings, including leading zeros.

All self-service routes require an authenticated active employee linked to the selected company. Use the backend's existing self-service authorization when available. Proposed new permissions, only if no equivalent exists: `employee-profile.view_self` and `employee-profile.request_change`. These names are proposals, not keys confirmed in the supplied permission matrix. Do not require a named admin or HR role. Review actions belong to an authorized HR workflow, not this employee page.

## 1. Read my profile

`GET {{base_url}}/people-hub/ess/profile`

```json
{
  "success": true,
  "message": "Employee profile retrieved successfully.",
  "data": {
    "employee": {
      "uuid": "c4f68ad5-0b29-424d-937f-86e4db1709f9",
      "employee_code": "FLEXI-IT-0009",
      "name": "Abdul Rafay",
      "official_email": "rafay@company.example",
      "avatar_url": null,
      "employment_status": "active",
      "joining_date": "2025-01-06",
      "designation": {"id": 12, "name": "Software Engineer"},
      "department": {"id": 3, "name": "Software Development"},
      "division": {"id": 2, "name": "Technology"},
      "branch": {"uuid": "54be7468-3a09-4f26-9f7d-df59717cb1bc", "name": "Lahore head office"},
      "reporting_manager": {"uuid": "ecbf5a30-052a-4ccc-9538-c0bd908b8ec8", "name": "Muhammad Yousaf"},
      "employment_type": {"id": 1, "name": "Permanent"},
      "grade_band": {"id": 4, "name": "G-4"},
      "shift": {"uuid": "87bbb1cd-a27d-4c79-8fbe-76c4533ec6eb", "name": "Regular shift", "start_time": "09:30", "end_time": "18:30"}
    },
    "completion": {
      "percentage": 90,
      "completed": 9,
      "total": 10,
      "missing_fields": [{"field_key": "actual_emergency_phone_key", "label": "Emergency phone", "section_id": "contact", "can_request_change": true}]
    },
    "sections": [
      {
        "id": "contact",
        "title": "Contact & emergency",
        "description": "Keep your contact information up to date.",
        "fields": [
          {"field_key": "actual_phone_key", "label": "Mobile number", "type": "text", "value": "+923001234567", "display_value": "+923001234567", "sensitive": false, "can_request_change": true, "required": true, "validation": {"max_length": 25}, "pending_request_uuid": null},
          {"field_key": "actual_emergency_phone_key", "label": "Emergency phone", "type": "text", "value": null, "display_value": null, "sensitive": false, "can_request_change": true, "required": false, "validation": {"max_length": 25}, "pending_request_uuid": null}
        ]
      },
      {
        "id": "bank",
        "title": "Bank details",
        "description": "Contact HR for verified bank account corrections.",
        "fields": [
          {"field_key": "actual_iban_key", "label": "IBAN", "type": "text", "value": null, "display_value": "•••• 0000", "sensitive": true, "can_request_change": false, "required": false, "validation": null, "pending_request_uuid": null}
        ]
      }
    ],
    "documents_summary": {"verified": 2, "under_review": 1, "missing": 1},
    "capabilities": {"can_view_documents": true, "can_upload_documents": false, "can_request_change": true},
    "updated_at": "2026-11-27T09:00:00+05:00"
  }
}
```

Return section IDs `personal`, `contact`, `employment`, `bank` in display order. The example abbreviates sections and fields; return all applicable saved fields. Use actual configured system keys, not the illustrative keys above. Field labels are shown to employees; database column names are not.

Apply onboarding mode visibility and conditional rules before returning fields. Omit hidden spouse/children/contract fields unless applicable. Do not put hidden fields in completion calculations. Completion includes only configured applicable fields; define the same numerator and denominator for percentage and missing_fields. Missing documents are counted separately. When the denominator is zero return percentage 0 and an empty list.

Sensitive values must be masked on the server. Do not send a complete CNIC or bank account in value merely because the frontend masks it. A future reveal action needs separate authorization; none is required for this screen. Null lookups should display Not provided, without fabricated names.

## 2. List my profile changes

`GET {{base_url}}/people-hub/ess/profile/change-requests?page=1&per_page=15&status=pending`

Allowed statuses: `pending`, `approved`, `rejected`, `cancelled`. Omit status to list all. Scope to the authenticated employee.

```json
{
  "success": true,
  "message": "Profile change requests retrieved successfully.",
  "data": [
    {
      "uuid": "d4d3bbbd-0191-43b4-bb80-f690d69943dd",
      "field_key": "actual_phone_key",
      "field_label": "Mobile number",
      "previous_display_value": "+923001234567",
      "requested_display_value": "+923009876543",
      "reason": "My contact number has changed.",
      "status": "pending",
      "submitted_at": "2026-11-27T10:00:00+05:00",
      "decided_at": null,
      "decision_note": null,
      "can_cancel": true
    }
  ],
  "meta": {"current_page": 1, "last_page": 1, "per_page": 15, "total": 1}
}
```

## 3. Request a profile correction

`POST {{base_url}}/people-hub/ess/profile/change-requests`

```json
{
  "field_key": "actual_phone_key",
  "requested_value": "+923009876543",
  "reason": "My contact number has changed."
}
```

Validate the selected field against current form-builder rules and employee self-service edit policy. Reject hidden, read-only, unknown, login-email, employment, identity and bank fields unless specifically authorized for correction. A typical initial allowlist is personal email, mobile, current/permanent address and emergency contact information. Do not trust can_request_change from the client.

Reason: required string, 3–1000 characters. Value: string or null where field rules allow clearing; enforce its actual field limits (the frontend preview currently allows 500 characters). Reject unchanged values. Enforce at most one pending request per employee and field in a transaction. Return 409 on duplicate pending requests. Disable repeated submits while saving.

Return HTTP 201 with `{ "success": true, "message": "Profile change request submitted.", "data": { ...request_resource } }`. Persist the request and audit actor, company, employee, original value and proposed value. Do not modify the official employee record on submission. On HR approval, revalidate and update the owning employee field in a transaction; invalidate the relevant employee/onboarding cache and preserve the decision history. A stale original value must be reconciled rather than silently overwriting a newer HR update.

After success the frontend refreshes profile and request queries. A rejected save leaves the modal open with its draft and inline errors. Permission revocation must be enforced by the server even if the modal is already open.

## 4. Cancel my pending correction

`POST {{base_url}}/people-hub/ess/profile/change-requests/{request_uuid}/cancel`

Optional body: `{ "reason": "No longer required." }` (max 1000 characters). Only the request owner can cancel, only while pending. Return the updated resource. Use 409 when another action already changed its status. Never delete the audit trail.

## 5. List employee documents

`GET {{base_url}}/people-hub/ess/profile/documents?page=1&per_page=15`

```json
{
  "success": true,
  "message": "Employee documents retrieved successfully.",
  "data": [
    {"uuid": "7fdcf367-d99a-480b-bec4-c47d191a013d", "name": "CNIC front", "category": "Identity", "status": "verified", "uploaded_at": "2026-10-14T10:00:00+05:00", "can_view": true, "can_replace": false},
    {"uuid": null, "requirement_key": "cnic_back", "name": "CNIC back", "category": "Identity", "status": "missing", "uploaded_at": null, "can_view": false, "can_replace": false}
  ],
  "meta": {"current_page": 1, "last_page": 1, "per_page": 15, "total": 2}
}
```

Use statuses `verified`, `uploaded`, `under_review`, `rejected`, `missing`. A missing requirement does not pretend to have a document UUID. Return only employee-visible records; internal HR documents must remain excluded.

Document viewing: reuse an existing authorized DMS endpoint if available. Otherwise propose `GET /people-hub/ess/profile/documents/{document_uuid}/download`, returning a streamed file after checking employee ownership. Do not expose storage paths or public permanent links. This UI does not require a new upload endpoint for the first release. If upload is enabled later, agree on requirement keys, MIME/size constraints, multipart payload and DMS ownership first.

## Error responses and UI states

Use the shared project envelope, including errors and error.field_errors:

```json
{
  "success": false,
  "error": {"code": "VALIDATION_FAILED", "message": "The requested value is invalid.", "field_errors": {"requested_value": ["Enter a valid phone number."]}},
  "errors": {"requested_value": ["Enter a valid phone number."]}
}
```

401: expired login. 403: self-service permission missing. 404: no linked employee or inaccessible resource (do not expose other employees). 409: pending duplicate, stale profile or already-decided request. 422: input validation. 500: retryable service failure; do not substitute sample data.

Frontend integration should use company/user-scoped query keys, the shared AppLoader and ApiErrorState, current Redux permissions, and server capabilities. Never persist personal or bank fields in cookies/localStorage. Clear request drafts on employee/company/logout changes. Only auth identity currently comes from Redux; sample business fields must be replaced together when integrating.

## Acceptance checks

1. Two signed-in employees receive only their own profile, requests and documents.
2. Any role with the configured permission works; role names are not hard-coded.
3. Changing company cannot show the previous company's cached employee profile.
4. Missing values and unlinked employees show intentional empty states.
5. Conditional fields follow the saved onboarding parent values and do not affect completion when hidden.
6. CNIC/bank numbers preserve zeros and full values are absent from the masked response.
7. A successful correction request remains pending and does not alter the official record before approval.
8. Duplicate/stale submissions return 409; validation errors remain below the relevant form control.
9. Pagination works for requests and documents; timestamps respect company timezone.
10. Attendance and leave links point to existing modules and honor their permissions.
11. Loading, failure, rejected, empty, read-only and pending states do not fabricate live data.

## Frontend files

- app/(system)/people-hub/ess-profile/page.tsx — compact profile UI and local request preview.
- app/(system)/people-hub/ess-profile/profile-data.ts — sample sections and validation helper.

Backend handoff: implement or confirm the proposed paths and field metadata, return one representative success/error response, then replace the sample adapter with real requests. No backend implementation or deployment is included in this frontend change.

## 6. Profile workspace summaries (added)

`GET {{base_url}}/people-hub/ess/profile/summary?month=2026-11&year=2026`

Proposed new aggregate endpoint. Resolve the employee from login and company scope. `month` defaults to the current company-local month; `year` defaults to that month's year. The chosen year controls leave balances; month controls attendance and expense activity. Today uses the actual company-local date, not the last date of a selected historical month. Payroll returns the latest employee-visible published payslip; loans are current outstanding as of the response timestamp. Return periods and as-of values explicitly.

```json
{
  "success": true,
  "message": "Profile workspace summary retrieved successfully.",
  "data": {
    "month": "2026-11",
    "year": 2026,
    "timezone": "Asia/Karachi",
    "as_of": "2026-11-27T13:40:00+05:00",
    "leave": {
      "state": "available",
      "balances": [
        {"leave_type_uuid": "735e56f3-9019-46af-816a-b96ef14e0cc2", "name": "Annual leave", "code": "AL", "total_entitlement": 14, "available_balance": 12, "used_balance": 2, "pending_deduction": 1, "projected_balance": 11}
      ]
    },
    "time_sync": {
      "state": "available",
      "today": {"date": "2026-11-27", "punch_state": "on_duty", "clock_in_at": "2026-11-27T09:28:00+05:00", "clock_out_at": null, "shift": {"name": "Regular shift", "start_time": "09:30", "end_time": "18:30"}, "progress": {"worked_minutes": 252, "target_minutes": 540}},
      "monthly": {"month": "2026-11", "present": 19, "late": 2, "absent": 0, "on_leave": 1, "working_days": 22}
    },
    "pay_edge": {
      "state": "available",
      "latest_payslip": {"uuid": "4f32803e-23fc-4b56-89ea-305af98170c9", "period": "2026-10", "period_label": "October 2026", "currency": "PKR", "gross_pay": "150000.00", "deductions": "7500.00", "net_pay": "142500.00", "payment_status": "paid", "payment_date": "2026-11-05", "payment_method": "bank_transfer"}
    },
    "loan_hub": {
      "state": "available",
      "currency": "PKR",
      "active_count": 1,
      "outstanding_balance": "60000.00",
      "monthly_installment": "10000.00",
      "next_due_date": "2026-12-05",
      "remaining_installments": 6,
      "pending_applications": 0
    },
    "expense_hub": {
      "state": "available",
      "month": "2026-11",
      "currency": "PKR",
      "awaiting_reimbursement": "12500.00",
      "pending_approval_count": 2,
      "approved_unpaid_count": 1,
      "reimbursed_this_month": "18000.00",
      "draft_count": 1
    }
  }
}
```

Each module returns `state`: `available`, `empty`, `forbidden`, `unavailable` or `not_enabled`. For non-available states return only `state` and an optional user-safe `message`; do not return unauthorized financial values. An empty loan summary means no loans, not a load failure. Empty payroll means no published payslip. A module failure should not stop the profile or other summaries from loading. Do not return fabricated zeros for forbidden/unavailable data.

Reuse LeaveEase's available/used/pending/projected definitions. Available is before pending deductions; projected reflects pending deductions according to the existing service. Never subtract pending twice. Clamp only the visual progress indicator to 0–100%, not the business balance. Handle fractional days and zero entitlement without division by zero.

TimeSync should reuse attendance/today and attendance/my/summary calculations, preserving punch_state and nullable clock values. A break, weekend, missing shift or no punch needs its own display; do not always show On duty. Present and late may overlap according to existing summary rules, so the UI must not sum them as distinct totals.

PayEdge must authorize self payslip viewing and return only published, employee-visible statements. Published and paid are distinct statuses. Do not include drafts, other employees' salaries or full banking details. Currency amounts are decimal strings. No client-side payroll recalculation.

Loan Hub should use its own repayment ledger, excluding rejected/cancelled applications. Outstanding is the current unpaid balance, including overdue scheduled amounts according to that module's accounting definition. Aggregate monthly installment and remaining installments only for compatible schedules; return null if that total is not meaningful across mixed loans. For multiple currencies return separate currency buckets rather than adding them together.

Expense Hub should derive awaiting_reimbursement from approved claims not fully reimbursed, including any unpaid remainder after partial settlement. Pending approval amounts are not included. Reimbursed this month is cash settled in the selected month, not merely approved claims. Counts and amounts must be scoped to this employee. Mixed currencies require separate buckets or an agreed reporting-currency conversion with rate/date metadata.

Permission checks must use the employee's effective permissions and existing module self-service scope, not role names. The profile page does not grant financial access merely because the employee can view their profile. Only display module navigation when access is authorized. `/expense-hub/claims` must itself enforce own-claim scope for employees.

Frontend: `profile-summaries.tsx` currently displays illustrative figures under the page's sample-data notice. Replace its sample adapter with this response and render all state variants before treating it as live. Existing module summary routes can be reused behind the aggregate; avoid multiple full employee list requests.
