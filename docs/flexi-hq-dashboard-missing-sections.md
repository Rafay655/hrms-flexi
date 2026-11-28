# Flexi HQ Dashboard — Three Missing Sections

Frontend: `/flexi-hq`  
Existing endpoint: `GET /api/v1/flexi-hq/dashboard`

## Required backend change

Extend the existing dashboard response with `data.attention`, `data.forms`, and `data.workflows`. Keep existing `stats`, `org_snapshot`, `branch_distribution`, and `headcount_by_grade` unchanged. No new endpoint or request filters are needed.

The frontend already reads these sections after the service unwraps `response.data.data`. Missing sections currently show an unavailable message. Adding TypeScript fields alone does not supply the data: the deployed controller/service must return these keys.

## Request

```http
GET {{base_url}}/flexi-hq/dashboard
Authorization: Bearer {{authToken}}
Accept: application/json
X-Company-ID: {{selected_company_uuid_or_numeric_id}}
```

`base_url` already ends in `/api/v1`. Resolve the selected company using existing authentication and company authorization. Return only that company's configuration. Reuse existing backend access checks.

## Response extension

Merge these sections into the existing `data` object. This example only shows the three additions; do not replace the full dashboard response with it. Numbers and workflow names are illustrative.

```json
{
  "success": true,
  "message": "Flexi HQ dashboard retrieved successfully.",
  "data": {
    "attention": [
      {
        "key": "incomplete_company_setup",
        "label": "Incomplete company setup",
        "note": "Review missing company setup steps.",
        "href": "/flexi-hq/companies",
        "available": true,
        "count": 1
      },
      {
        "key": "draft_workflows",
        "label": "Draft workflows",
        "note": "Complete approval stage configuration.",
        "href": "/flexi-hq/workflows",
        "available": true,
        "count": 2
      },
      {
        "key": "fields_without_validation",
        "label": "Fields without validation",
        "note": "Unavailable: no policy defines mandatory additional validation rules per input type.",
        "href": "/flexi-hq/validation-catalog",
        "available": false,
        "count": null
      },
      {
        "key": "unpublished_form_changes",
        "label": "Unpublished form changes",
        "note": "Unavailable: form configuration does not track a separate published version.",
        "href": "/flexi-hq/form-builder",
        "available": false,
        "count": null
      }
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

## 1. Needs attention: `attention`

Return an array with stable `key`, display `label`, explanatory `note`, internal `href`, boolean `available`, and integer-or-null `count`.

| Key | Source / counting rule | Availability |
| --- | --- | --- |
| `incomplete_company_setup` | Selected company's persisted three-step setup wizard. Count the company once if its setup is incomplete: 0 or 1, not a count of missing steps. | `true`; numeric count including 0 |
| `draft_workflows` | Count saved, non-deleted draft workflow definitions in the selected company. Do not count pending approval instances. | `true`; numeric count including 0 |
| `fields_without_validation` | Catalog describes compatible rules, but there is no policy defining which extra rules are mandatory per input type. | `false`; `count: null` |
| `unpublished_form_changes` | Form builder stores current configuration without a separate published revision. | `false`; `count: null` |

The frontend shows the supplied note and omits the numeric count for unavailable items. One unavailable item must not make the whole panel unavailable. Do not substitute zero for an unmeasurable metric. Use only the internal paths in the example.

## 2. Onboarding form setup: `forms`

Read the selected company's employee onboarding configuration. Exclude deleted fields, section headings and layout-only elements. Count each configured input field once within a category.

| Field / breakdown key | Counting rule |
| --- | --- |
| `total_fields` | Total configured input fields. |
| `quick` | Fields enabled for quick onboarding. |
| `detailed` | Fields enabled for detailed onboarding. |
| `required` | Fields required in at least one enabled onboarding mode; deduplicate fields required in both modes. |
| `conditional` | Fields with a non-null visibility condition. |

Categories overlap; their sum does not need to equal `total_fields`. These counts describe configured fields, rather than which fields happen to be visible for one employee's answers.

For a company without form fields, return `total_fields: 0` and all four breakdown rows with zero counts. Do not omit the section or return null.

## 3. Approval workflows: `workflows`

- `active`: count of non-deleted workflow definitions with active status for the selected company. This also supplies the sixth KPI card.
- `items`: up to three most recently updated Active or Draft definitions, newest first. Use a deterministic tie-break when update timestamps match.
- Each item returns `name`, integer `steps`, and display `status` exactly `Active` or `Draft`.
- `steps` counts configured approval stages, not individual approvers or processed requests.
- `items` is a recent sample; its length does not need to equal `active`.
- Read actual configured definitions; do not fabricate workflow records from module names.

A valid empty result is:

```json
{
  "active": 0,
  "items": []
}
```

Zero must render as `0`. If the section is omitted, the frontend displays a dash for the KPI and an unavailable state for the panel.

## Response types

```ts
attention: {
  key: string;
  label: string;
  note: string;
  href: string;
  available: boolean;
  count: number | null;
}[];
forms: {
  total_fields: number;
  breakdown: { key: "quick" | "detailed" | "required" | "conditional"; label: string; count: number }[];
};
workflows: {
  active: number;
  items: { name: string; steps: number; status: "Active" | "Draft" }[];
};
```

## Deployment and verification

1. Extend the dashboard aggregation service/controller and resource/serializer, ensuring none of these keys are dropped.
2. Deploy to the API host actually configured by the frontend's `NEXT_PUBLIC_API_URL`. An older deployment can still return HTTP 200 with only the original sections.
3. Inspect the authenticated Network response and confirm all three keys exist directly inside `data`.
4. Verify the selected company header and authorization scope. Switching company must return that company's own configuration.
5. Test workflow counts of zero and a positive number, empty workflow items, zero form fields, and mixed available/unavailable attention items.
6. Check `draft_workflows` against saved definitions and onboarding counts against the form builder.

No frontend permission changes, role-grant changes, new dashboard filters or new endpoints are requested. Existing shared authentication and company-context errors remain in effect.
