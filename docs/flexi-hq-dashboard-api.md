> Integration update: the dashboard now uses the existing service/hook and authenticated GET endpoint. `attention` includes `available: boolean` and `count: number | null`; unavailable metrics show the server note without a numeric count. Unpublished-form and mandatory-extra-validation metrics are unavailable in the current backend. Query keys include user and company; the live path no longer uses preview fixtures. The older proposal below is historical where it differs from this confirmed contract.

# Flexi HQ Dashboard — Backend API Handoff

Frontend route: `/flexi-hq`  
Status: proposed contract for the current dummy dashboard; backend implementation required.  
Date: 28 November 2026

## Endpoint and scope

```http
GET {{base_url}}/flexi-hq/dashboard
Authorization: Bearer {{authToken}}
Accept: application/json
X-Company-ID: {{selected_company_uuid}}
```

`base_url` ends in `/api/v1`. No request body, month filter or date filter is needed: this dashboard is a current configuration snapshot.

An existing dashboard endpoint/hook already exists in the frontend. Extend or adapt that endpoint rather than creating another dashboard route. The page currently reads local fixtures and will be connected after this contract is available.

Resolve company scope from the authenticated user and selected company header. Return only companies the user may access within that context; never return unrelated tenants. If the application scope permits only the selected company, `total_companies` and `org_snapshot` must reflect that single company. Enforce existing backend authorization. Do not accept client-supplied employee IDs to determine scope.

## Success response

All numbers below are illustrative. Return actual persisted data.

```json
{
  "success": true,
  "message": "Flexi HQ dashboard retrieved successfully.",
  "data": {
    "stats": {
      "total_companies": 3,
      "active_branches": 8,
      "total_departments": 18,
      "total_positions": 42,
      "total_divisions": 7
    },
    "org_snapshot": [
      {
        "company": { "id": 1, "company_name": "Flexi HR Solutions", "company_code": "FLEXI" },
        "divisions_count": 3,
        "dept_count": 8,
        "desig_count": 19,
        "branches_count": 4
      },
      {
        "company": { "id": 2, "company_name": "HRPSP Services", "company_code": "HRPSP" },
        "divisions_count": 2,
        "dept_count": 6,
        "desig_count": 14,
        "branches_count": 3
      },
      {
        "company": { "id": 3, "company_name": "Flexi Technologies", "company_code": "FLEXI-TECH" },
        "divisions_count": 2,
        "dept_count": 4,
        "desig_count": 9,
        "branches_count": 2
      }
    ],
    "branch_distribution": [
      { "type": "head_office", "label": "Head offices", "count": 3 },
      { "type": "branch", "label": "Branches", "count": 6 }
    ],
    "headcount_by_grade": [
      { "grade_id": 1, "grade_name": "Leadership", "grade_code": "G1", "headcount": 8 },
      { "grade_id": 2, "grade_name": "Management", "grade_code": "G2", "headcount": 24 },
      { "grade_id": 3, "grade_name": "Senior professionals", "grade_code": "G3", "headcount": 46 },
      { "grade_id": 4, "grade_name": "Professionals", "grade_code": "G4", "headcount": 78 },
      { "grade_id": 5, "grade_name": "Associates", "grade_code": "G5", "headcount": 36 }
    ],
    "attention": [
      { "key": "incomplete_company_setup", "label": "Incomplete company setup", "note": "Review missing company details.", "count": 1, "href": "/flexi-hq/companies" },
      { "key": "fields_without_validation", "label": "Fields without validation", "note": "Review rules for onboarding fields.", "count": 4, "href": "/flexi-hq/validation-catalog" },
      { "key": "unpublished_form_changes", "label": "Unpublished form changes", "note": "Review changes before publishing.", "count": 2, "href": "/flexi-hq/form-builder" },
      { "key": "draft_workflows", "label": "Draft workflows", "note": "Complete approval stage configuration.", "count": 2, "href": "/flexi-hq/workflows" }
    ],
    "forms": {
      "total_fields": 68,
      "breakdown": [
        { "key": "quick", "label": "Quick onboarding fields", "count": 18 },
        { "key": "detailed", "label": "Detailed onboarding fields", "count": 68 },
        { "key": "required", "label": "Required fields", "count": 24 },
        { "key": "conditional", "label": "Conditional fields", "count": 9 }
      ]
    },
    "workflows": {
      "active": 6,
      "items": [
        { "name": "Employee onboarding", "steps": 2, "status": "Active" },
        { "name": "Profile changes", "steps": 1, "status": "Active" },
        { "name": "Organisation changes", "steps": 3, "status": "Draft" }
      ]
    }
  }
}
```

## Metrics and UI mapping

| Response field | Dashboard section | Definition |
| --- | --- | --- |
| `stats.total_companies` | Companies KPI | Accessible, non-deleted companies in scope. |
| `stats.active_branches` | Active branches KPI | Non-deleted branches marked active. |
| `stats.total_departments` | Departments KPI | All non-deleted configured departments in scope. |
| `stats.total_positions` | Positions KPI | All non-deleted designations/positions; not employee count or vacancies. |
| `stats.total_divisions` | Divisions KPI | All non-deleted configured divisions. |
| `org_snapshot` | Structure chart and searchable company table | One row per scoped company, with distinct counts of its divisions, departments, positions and branches. Include companies with zero structure. |
| `branch_distribution` | Branch donut | All non-deleted branches grouped by type, including inactive branches. Its total equals the sum of `branches_count`, and can exceed `active_branches`. |
| `headcount_by_grade` | Grade headcount panel | Distinct active employees grouped by their current assigned grade band; count each employee once. Exclude inactive/exited employees. |
| `attention` | Needs attention | Actual configuration issues as defined below. |
| `forms` | Onboarding form setup | Configured field counts for the selected company's employee onboarding form. |
| `workflows.active` | Sixth KPI and workflow panel | Count of enabled, published approval workflow definitions in scope. |
| `workflows.items` | Workflow panel | Up to three recently updated workflow definitions, ordered newest first. This is a sample list, so its length does not equal the active total. |

The frontend builds the structure chart from `org_snapshot`, sums distribution values for the donut centre, and calculates grade bar widths from total returned headcount. Do not send a second copy of these derived values. Company search currently filters the complete returned snapshot locally; do not silently paginate this array.

### Attention rules

- `incomplete_company_setup`: number of scoped companies failing existing required company setup checks. Reuse existing validation/readiness logic.
- `fields_without_validation`: active input fields missing the validation configuration required for their field type. Exclude presentation-only fields and fields for which no additional validation is required. Reuse validation-catalog rules.
- `unpublished_form_changes`: number of forms with saved changes differing from their published version, not the number of changed fields.
- `draft_workflows`: non-deleted workflow definitions in draft state, not pending approval instances.
- Keep these stable keys even when counts are zero. `href` must be one of the internal paths shown above, never an external URL.
- If an underlying module does not support a metric (for example form publication tracking), flag that during implementation. Do not infer a count or return zero as if the feature had been measured. Agree an availability extension with frontend before connection.

### Onboarding field rules

Use the selected company's configured employee onboarding form, including saved configuration that the form builder manages. Count each field once per metric; exclude deleted fields, section headings and other layout-only elements.

- `total_fields`: total configured input fields.
- `quick`: fields enabled for quick onboarding.
- `detailed`: fields enabled for detailed onboarding.
- `required`: fields required in at least one enabled mode; do not count a field twice if required in both modes.
- `conditional`: fields with a non-null visibility condition.

These categories overlap and must not be added together. Counts describe configured fields, not the subset visible for a particular employee's answers.

### Grade and workflow rules

Include an `Ungraded` bucket for active employees without an assigned grade, using `grade_id: null` and `grade_code: "—"`. Grade IDs otherwise use the existing grade identifier type. The frontend adapter will handle the nullable bucket identifier. Sort grades by configured rank, with Ungraded last.

Workflow `status` labels currently displayed are `Active` and `Draft`. Return only these states in this initial recent-workflow list. `steps` counts configured approval stages, not approvers or processed requests. Do not invent workflow definitions for module names that are not configured.

## Response and failure requirements

- Use the standard success/message/data envelope and normal application error envelope.
- All counts are non-negative JSON integers, including zero. Avoid numeric strings, null counters and omitted required sections.
- Empty collections are `[]`. A legitimately empty company returns zero counts, an empty snapshot/grade list as applicable, empty workflow items and zero configuration counts.
- Keep all metrics in the same authorization scope and use consistent counting filters. Aggregate distinct records to avoid inflated counts from joined tables.
- Return HTTP 401 for an expired session, 403 for unavailable access, and the normal validation response for an invalid company header. Do not return partial cross-company results.
- Keep employee personal data out of this aggregate response.
- Use the existing backend dashboard permission/policy; this handoff does not request changes to role grants.

## Frontend integration notes

Current files:

- `components/flexi-hq/dashboard.tsx`: dashboard UI and local company search.
- `components/flexi-hq/dashboard-preview.ts`: dummy values to remove from live usage after API connection.
- `hooks/useFlexiHQDashboard.ts`: existing GET `/flexi-hq/dashboard` hook, currently unused by this preview.

On connection, extend the response types and replace fixtures with the authenticated request. Scope caching/refetching by company and signed-in user; refresh on company change. Add the shared loading state, retry/error state, and safe empty sections. Preserve existing UI shortcuts. Stable `key` values in attention/form items are additions to support mapping without depending on display text.

## Acceptance checklist

- All six KPI cards and every panel receive actual data without separate dashboard requests.
- Counts match the scoped company records and exclude unrelated tenants.
- Department, division and position sums match their company snapshot totals.
- Branch donut total equals all configured branches; active-branch KPI excludes inactive branches.
- Active employees without a grade are included once in Ungraded.
- Zero data and empty arrays render normally; no hardcoded fallback figures.
- Company switching refreshes the overview and does not retain another company's data.
- Workflow and form metrics use existing persisted configuration; unsupported metrics are reported before frontend integration.
