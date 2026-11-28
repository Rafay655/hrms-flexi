> Current integration (28 November 2026): My Profile uses the authenticated live profile, corrections and document APIs. No frontend ESS permission gates are applied. Backend authorization and returned field capabilities remain in effect. Demo adapters and sample module summaries have been removed; the workspace summary endpoint below remains a proposal.

# ESS Profile API — Backend Handoff

Frontend: `/people-hub/ess-profile`  
Updated: 28 November 2026

## Current frontend status

The profile currently runs with dummy data and a local avatar. All signed-in users can open this demo without ESS permissions. Corrections and cancellations stay in memory and reset on reload. No profile API requests are made by the demo page.

The real adapter is retained in `services/ess-profile.service.ts`. The separate HR review page at `/people-hub/profile-change-requests` uses the confirmed HR endpoints and requires `employees.edit`.

The employee endpoints below are confirmed by the backend handoff. The workspace-summary endpoint is a proposal and still needs backend confirmation. When connecting the real profile, replace the dummy adapter and restore the required ESS checks. Demo accessibility must not remove backend authorization.

## Authentication and scope

Base URL: `{{base_url}}`, including `/api/v1`.

```http
Authorization: Bearer {{token}}
Accept: application/json
X-Company-ID: {{selected_company_uuid}}
Content-Type: application/json
```

The server also accepts the authenticated company's numeric ID in the company header. Resolve employee identity from the authenticated session. Do not accept employee_id or company_id in self-service request bodies.

Read permissions: both `ess.access` and `ess.profile.view-own`. Submit/cancel additionally require `ess.profile.edit-own`. Permissions apply to any role; do not hard-code role names. Profile JSON and downloads must return `Cache-Control: private, no-store`.

## Confirmed endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/people-hub/ess/profile` | Employee identity, sections, completion, document counts, capabilities |
| GET | `/people-hub/ess/profile/change-requests` | Own paginated correction history |
| POST | `/people-hub/ess/profile/change-requests` | Submit a correction for approval |
| POST | `/people-hub/ess/profile/change-requests/{uuid}/cancel` | Cancel an own pending request |
| GET | `/people-hub/ess/profile/documents` | Employee-visible documents and missing requirements |
| GET | `/people-hub/ess/profile/documents/{uuid}/download` | Authenticated document stream |
| GET | `/people-hub/profile-change-requests` | HR review queue |
| POST | `/people-hub/profile-change-requests/{uuid}/decision` | HR approves or rejects a correction |

## 1. Read my profile

```http
GET {{base_url}}/people-hub/ess/profile
```

Illustrative response matching the frontend model; confirm the exact resource with backend before integration:

```json
{
  "success": true,
  "message": "Employee profile retrieved successfully.",
  "data": {
    "employee": {
      "uuid": "c4f68ad5-0b29-424d-937f-86e4db1709f9",
      "employee_code": "FLEXI-IT-0009",
      "name": "Abdul Rafay",
      "official_email": "rafay@example.com",
      "avatar_url": null,
      "employment_status": "active",
      "joining_date": "2025-01-06",
      "designation": {"name": "Software Engineer"},
      "department": {"name": "Software Development"},
      "branch": {"name": "Lahore head office"},
      "reporting_manager": {"name": "Muhammad Yousaf"},
      "employment_type": {"name": "Permanent"}
    },
    "sections": [
      {
        "id": "contact",
        "title": "Contact & emergency",
        "description": "Keep your contact information up to date.",
        "fields": [
          {
            "field_key": "field_mb1",
            "label": "Mobile Number",
            "type": "text",
            "value": "+923001234567",
            "display_value": "+923001234567",
            "sensitive": false,
            "required": true,
            "can_request_change": true,
            "pending_request_uuid": null,
            "validation": {"max_length": 25}
          }
        ]
      },
      {
        "id": "bank",
        "title": "Bank details",
        "description": "Contact HR for bank corrections.",
        "fields": [
          {
            "field_key": "actual_iban_field_key",
            "label": "IBAN",
            "type": "text",
            "value": null,
            "display_value": "•••• 0012",
            "sensitive": true,
            "required": false,
            "can_request_change": false,
            "pending_request_uuid": null,
            "validation": null
          }
        ]
      }
    ],
    "completion": {
      "percentage": 96,
      "completed": 23,
      "total": 24,
      "missing_fields": [
        {"field_key": "actual_emergency_phone_key", "label": "Emergency phone", "section_id": "contact", "can_request_change": true}
      ]
    },
    "documents_summary": {"verified": 2, "under_review": 1, "missing": 1},
    "capabilities": {"can_view_documents": true, "can_request_change": true, "can_upload_documents": false}
  }
}
```

Return all applicable sections, normally personal, contact, employment and bank. Use actual configured field_key values. Labels are for display; keys are for requests. Apply existing onboarding visibility conditions using stored parent values. Hidden fields must not block profile completion or corrections.

Return null for missing values. Preserve phone, CNIC, account and IBAN strings, including leading zeros. Sensitive fields must have value=null and only a masked display_value. Never send full values for frontend-only masking.

Show a correction control only if the user has edit-own permission, profile capabilities allow it, the field allows it, and pending_request_uuid is null. Document upload is unavailable.

## 2. Change history

```http
GET {{base_url}}/people-hub/ess/profile/change-requests?page=1&per_page=15&status=pending
```

Omit status to list every status. Use pending, approved, rejected or cancelled.

```json
{
  "success": true,
  "message": "Profile change requests retrieved successfully.",
  "data": [
    {
      "uuid": "d4d3bbbd-0191-43b4-bb80-f690d69943dd",
      "field_key": "field_mb1",
      "field_label": "Mobile Number",
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

## 3. Submit a correction

```http
POST {{base_url}}/people-hub/ess/profile/change-requests
```

```json
{
  "field_key": "field_mb1",
  "requested_value": "+923009876543",
  "reason": "My contact number has changed."
}
```

Return HTTP 201 with success/message/data, where data is the request resource shown above. Official profile values remain unchanged until approval.

Validate against the latest field policy and configured rules. Enforce company/employee scope, allowed field, applicable visibility, valid value and duplicate-pending policy on the server. Return field errors rather than trusting client controls. Agree on exact length/nullable rules with backend; the frontend should use returned validation metadata.

On success refresh profile and request queries. For HTTP 409, refresh both and require review of the latest state before retrying. Preserve the draft when a request is rejected.

## 4. Cancel a pending request

```http
POST {{base_url}}/people-hub/ess/profile/change-requests/{request_uuid}/cancel
```

Optional JSON:

```json
{"reason": "No longer required."}
```

Use can_cancel and pending status to show the action. Server must enforce ownership and current state. Return the updated request resource, then refresh profile/history. Do not delete the audit trail.

## 5. Documents

```http
GET {{base_url}}/people-hub/ess/profile/documents?page=1&per_page=15
```

Illustrative collection:

```json
{
  "success": true,
  "message": "Employee documents retrieved successfully.",
  "data": [
    {"uuid": "7fdcf367-d99a-480b-bec4-c47d191a013d", "name": "Employment contract", "category": "Employment", "status": "verified", "uploaded_at": "2025-01-06T10:00:00+05:00", "can_view": true},
    {"uuid": null, "requirement_key": "actual_cnic_back_field_key", "name": "CNIC back", "category": "Identity", "status": "missing", "uploaded_at": null, "can_view": false}
  ],
  "meta": {"current_page": 1, "last_page": 1, "per_page": 15, "total": 2}
}
```

Only employee-visible DMS documents are included. Exclude HR-only files and unlinked legacy files. Missing requirements have uuid=null and a requirement_key.

```http
GET {{base_url}}/people-hub/ess/profile/documents/{document_uuid}/download
```

Call only when can_view=true and uuid exists. Use an authenticated binary request, read Content-Disposition for the filename and revoke the temporary browser object URL after download. Return a streamed attachment; never expose internal storage paths. Do not add upload controls.

## 6. HR review

Permission: `employees.edit` plus company scope. Neither the submitter nor the affected employee may decide the request. Backend must enforce this restriction even if an action is visible in the UI.

```http
GET {{base_url}}/people-hub/profile-change-requests?page=1&per_page=15&status=pending
```

Default status is pending. Return paginated request resources with employee identity for the queue, for example employee.uuid, employee.name and employee.employee_code. Confirm those identity fields in the response resource.

```http
POST {{base_url}}/people-hub/profile-change-requests/{request_uuid}/decision
```

```json
{"decision": "approved", "decision_note": "Verified with employee."}
```

The other allowed decision is rejected. Approval must recheck field policy and original value within the transaction, update the owning employee field, and audit the decision. Return HTTP 409 when the original value has changed and reconciliation is needed. Do not silently overwrite newer HR changes.

## 7. Workspace summaries — proposed API, not yet confirmed

The dummy overview includes LeaveEase balances, TimeSync attendance, PayEdge payroll, Loan Hub repayments and Expense Hub claims. The confirmed handoff has no aggregate endpoint for these cards.

Proposed:

```http
GET {{base_url}}/people-hub/ess/profile/summary?month=2026-11&year=2026
```

```json
{
  "success": true,
  "message": "Profile workspace summary retrieved successfully.",
  "data": {
    "month": "2026-11",
    "year": 2026,
    "timezone": "Asia/Karachi",
    "as_of": "2026-11-28T12:00:00+05:00",
    "leave_ease": {
      "state": "available",
      "balances": [
        {"name": "Annual leave", "code": "AL", "total_entitlement": 14, "available_balance": 12, "used_balance": 2, "pending_deduction": 1, "projected_balance": 11}
      ]
    },
    "time_sync": {
      "state": "available",
      "today": {"date": "2026-11-28", "punch_state": "on_duty", "clock_in_at": "2026-11-28T09:28:00+05:00", "clock_out_at": null, "worked_minutes": 252, "target_minutes": 540, "shift": {"name": "Regular shift", "start_time": "09:30", "end_time": "18:30"}},
      "monthly": {"month": "2026-11", "present": 19, "late": 2, "absent": 0, "on_leave": 1}
    },
    "pay_edge": {
      "state": "available",
      "latest_payslip": {"period": "2026-10", "currency": "PKR", "gross_pay": "150000.00", "deductions": "7500.00", "net_pay": "142500.00", "payment_status": "paid", "payment_date": "2026-11-05"}
    },
    "loan_hub": {
      "state": "available", "currency": "PKR", "active_count": 1, "outstanding_balance": "60000.00", "monthly_installment": "10000.00", "next_due_date": "2026-12-05", "remaining_installments": 6, "pending_applications": 0
    },
    "expense_hub": {
      "state": "available", "month": "2026-11", "currency": "PKR", "awaiting_reimbursement": "12500.00", "pending_approval_count": 2, "approved_unpaid_count": 1, "reimbursed_this_month": "18000.00", "draft_count": 1
    }
  }
}
```

Backend should confirm paths, field names and money/currency semantics before integration. Reuse the owning module's services; do not maintain parallel summary balances.

Each module needs an explicit state: available, empty, forbidden, unavailable or not_enabled. Non-available states must not return unauthorized values or fabricated zeros. One module's failure should not prevent the profile from loading.

- Leave: available is before pending deductions; projected reflects pending. Do not subtract pending twice. Support fractional days.
- Attendance: today is the current company-local date; monthly data uses the selected month. Present/late may overlap; do not sum them as distinct attendance totals.
- Payroll: latest employee-visible published payslip only. Published and paid are different statuses. Exclude drafts and other employees' pay.
- Loans: use current repayment-ledger outstanding amounts, not original approved principal. Return null where combined installment counts are not meaningful.
- Expenses: awaiting reimbursement includes approved unpaid amounts and partial-payment remainders. Reimbursed this month uses settlement dates, not approval dates.
- Amounts: decimal strings with currency. Never add incompatible currencies without an agreed conversion policy.
- Access: apply existing own-record permissions for every module. Profile viewing alone must not grant payroll, loan or expense access.

## Validation and errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "This field is unavailable for self-service changes.",
    "field_errors": {"field_key": ["This field is unavailable for self-service changes."]}
  },
  "errors": {"field_key": ["This field is unavailable for self-service changes."]}
}
```

401: expired login. 403: missing permission. 404: unavailable employee/document/request. 409: duplicate, stale or already-decided state. 422: field validation. Show server errors beneath the corresponding input and keep the modal draft intact.

Use ISO 8601 timestamps with timezone and YYYY-MM-DD dates. Query keys must include company and user identity. Clear modal drafts on identity/company changes. Do not store profile values, bank identifiers or correction drafts in cookies/localStorage or logs.

## Deployment

Backend team runs:

```bash
php artisan migrate --path=database/migrations/2026_11_27_130000_create_employee_profile_change_requests.php --force
php artisan db:seed --class='Database\Seeders\EssPermissionSeeder' --force
php artisan route:cache
```

The ESS seeder is additive. Run it if these permissions are not installed. Refresh the affected user's login session after changing grants; this frontend reads login permissions from Redux.

## Integration acceptance checklist

- Employee identity is resolved from session and company header, never client-selected employee_id.
- Employee A cannot read or change employee B's profile, requests or documents.
- Any role with the required keys works; named roles are not assumed.
- Sensitive values arrive masked and no file upload control is exposed.
- Pending correction does not modify the official record; duplicate submission is handled safely.
- HR cannot decide their own/affected-employee requests; stale approval returns 409.
- Request/document pagination, empty/error states and authenticated filenames work.
- Conditional fields and profile completion agree with the stored onboarding configuration.
- All five summary cards use real authorized module calculations, with explicit unavailable/empty states.
- Remove dummy adapter and sample labels together when enabling the live profile.
