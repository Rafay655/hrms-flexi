# Flexi Import dashboard — backend handoff

Status: connected to the backend dashboard response supplied on 20 November 2026. The frontend uses the existing authenticated API client, company/user/month query keys, shared loading and retry states, and real batch links. No demo fallback is used.

Frontend: `/flexi-import`  
Endpoint: `GET {{base_url}}/flexi-import/dashboard?month=2026-11`  
`{{base_url}}` already includes `/api/v1`; do not append it again.

## Authentication and scope

Use the existing authenticated Axios/API client and company-selection mechanism:

```http
Authorization: Bearer {{authToken}}
Accept: application/json
X-Company-ID: {{selected_company_uuid}}
```

Use the existing import access gate, history visibility, template access and scope-specific permissions. Enforce company scope and record visibility on the backend. Do not expose inaccessible scopes, employee details, file names or approval counts. No new role-name checks are required.

For unauthorized template/approval aggregates return `null`, not zero; hide the corresponding frontend section. `needs_attention[].count` can also be null. The demo has access to all sections. Apply row-level visibility consistently across every count, chart and list. Never put `company_id` in query parameters or the request body.

## Query parameters

| Parameter | Type | Behavior |
| --- | --- | --- |
| `month` | Optional string `YYYY-MM` | Defaults to the current month in the company's reporting timezone. Reject invalid formats/months with 422. |

No employee filter is needed. Search and status controls filter only the returned recent-import table locally. The main history screen handles full pagination. A single dashboard response provides all sections below.

## Reporting rules

1. Return `timezone` as a valid IANA zone and `snapshot_at` as an ISO 8601 timestamp with an offset. Resolve month boundaries in that zone using an inclusive month start and exclusive next-month start, then query stored timestamps correctly. Current-month totals run through `snapshot_at`.
2. Monthly cohort means batches **created** in the selected month, regardless of when processing occurred. Row totals, statuses, scope breakdown and recent imports all use this cohort. This is different from counting processing events during the month.
3. `status_breakdown` is mutually exclusive: each visible batch contributes once using its current status. Its counts sum to `status_total`, which equals `kpi.batches_created`. Include all supported statuses; zero-count entries are allowed. Do not convert `validation_complete` into completed or successful.
4. Row outcomes count current stored processing outcomes for rows in the cohort, not validation-invalid rows or unprocessed valid rows. `successful + failed + skipped = total = kpi.processed_rows`. Failed means failed **during processing**. Retries update a row's current outcome; do not count each attempt as another row. Derive outcomes from authoritative row processing states if batch counters mix validation errors with processing failures.
5. Success records the import operation's result, not downstream business approval. Expense imports can create drafts; salary revisions and leave adjustments can await owning-module approval. Historical processing outcomes remain historical after rollback; the batch status must still show `rolled_back`. These totals must not imply that rolled-back records remain applied.
6. Pending approvals, attention items, active batches and template inventory are current snapshots across all months. They do not change with the selected month. Attention categories can overlap and must not be summed into a unique batch count.
7. Trend returns exactly six chronological months ending with the selected month, including zero months. Each point counts created batches in that month's cohort and how many of those batches currently have `completed` status. The last point equals the selected-month created and completed batch counts.
8. Group all `flexi_meta_*` destination keys plus legacy mixed-entity imports under one chart category: `import_type: "flexi_meta"`, label `FlexiMeta`. This is an aggregate label only. Recent/active batch records must retain their exact immutable destination key, such as `flexi_meta_departments`.
9. Counts must be finite nonnegative JSON numbers, never numeric strings. Return empty arrays and zero aggregates for an empty cohort. Unknown actor means `initiated_by: null`; never send an object where a label string is expected.

## Response sections and UI mapping

The complete valid example is in [flexi-import-dashboard-response.example.json](./flexi-import-dashboard-response.example.json). Values and identities are fictitious.

| Field | Meaning / UI |
| --- | --- |
| `month`, `month_label`, `is_current_month` | Selected period and human label; current-month flag computed in company timezone. |
| `timezone`, `snapshot_at` | Reporting timezone and one consistent aggregation time. |
| `kpi.batches_created` | Monthly import batches created. |
| `kpi.successful_rows` | Successful processing rows in selected-month batches; equals row outcomes successful. |
| `kpi.failed_processing_rows` | Failed processing rows in selected-month batches; equals row outcomes failed. |
| `kpi.processed_rows` | All processed outcomes, including skipped; equals row outcomes total. |
| `kpi.pending_approvals` | Current accessible pending-approval batches, or null if unauthorized. Count each batch once even if multiple workflow tasks exist. |
| `kpi.saved_templates` | Current accessible saved template identities, or null if unauthorized. Count templates, not all historical versions. |
| `status_total`, `status_breakdown[]` | Donut: `{status, label, count}`. Labels are plain strings. |
| `trend[]` | Area chart: `{month, label, batches_created, completed_batches}`. |
| `scope_breakdown[]` | Horizontal chart: `{import_type, label, count}`; mutually exclusive grouping, total equals batches created. Include only accessible scopes. |
| `row_outcomes` | `{successful, failed, skipped, total}`; frontend derives percentages and guards division by zero. |
| `needs_attention[]` | Current batch counts: `{key, label, count, hint}`. Plain text hints, no HTML. |
| `template_library` | `{total, ready, needs_revision}` or null if unauthorized. Latest version per identity; ready means complete downloadable field snapshot. `ready + needs_revision = total = kpi.saved_templates`. |
| `active_batches[]` | Up to five current processing batches, newest first. `{uuid, file_name, import_type, import_type_label, status, total_rows, processed_rows, progress}`. |
| `recent_batches[]` | Up to ten most recent visible batches in the selected month, ordered by created_at descending with a stable UUID tie-break. |

### Attention categories

| Key | Definition |
| --- | --- |
| `invalid_preview` | Editable/unsubmitted employee previews with invalid validation rows requiring correction; do not count frozen or processed previews. |
| `reference_gaps` | Unsubmitted actionable batches with unresolved reference gaps. May overlap invalid previews. |
| `pending_approval` | Same current accessible approval count as KPI. No self-approval implication; task availability stays server-owned. |
| `processing_failures` | Terminal completed/failed batches with at least one current failed processing row. This count does not mean all are retryable. |

### Batch fields

`uuid` is the real batch UUID; labels are display strings. `progress` is a finite number between 0 and 100 representing processing progress, not file-upload progress. `processed_rows <= total_rows`; a final failed batch may have zero processed rows. Do not invent processing counts for queued or validating batches.

Recent items include these additional fields:

```json
{
  "successful_rows": 46,
  "failed_rows": 0,
  "skipped_rows": 2,
  "initiated_by": {"id": "actor-uuid", "name": "Example HR Operator"},
  "created_at": "2026-11-11T14:00:00+05:00"
}
```

Here `failed_rows` must mean failed processing outcomes for this dashboard, not validation failures. `successful_rows + failed_rows + skipped_rows = processed_rows`. Actor ID is a string; use the existing actor UUID where available. Mask or omit inaccessible actor details. No raw spreadsheet data or validation messages are required by the overview.

Supported lifecycle statuses: `uploaded`, `validating`, `validation_complete`, `pending_approval`, `approved`, `processing`, `completed`, `failed`, `rejected`, `rolled_back`. Preserve any additional supported backend status with its display label instead of mapping it to success.

## Standard envelope and errors

```json
{
  "success": true,
  "message": "Flexi Import dashboard retrieved successfully.",
  "data": {}
}
```

Replace `data` with the complete response example. Use existing standard errors: 401 unauthenticated, 403 no permitted access/company context, 422 invalid month, 500 unexpected error. Do not return fabricated zeros for an error or permission denial. Maintain the existing structured `error.field_errors` and request ID behavior.

## Backend acceptance checks

- All monthly batch totals reconcile between cards, trend, donut and type chart.
- Row outcomes reconcile and exclude validation-only failures; repeated retries do not inflate totals.
- Company/permission scope is identical across sections, including FlexiMeta destination permissions and workflow visibility.
- Empty months, no available templates, missing actor, partial processing, zero-row failed uploads and rolled-back imports render without null-number errors.
- Separate current snapshot values from historical cohort values; use one consistent snapshot or transaction for aggregates.
- Aggregate in SQL/optimized queries rather than loading all import rows into memory. If caching, key by company, user/visibility scope and month; use a short TTL and invalidate after lifecycle/template changes.

## Frontend connection

`services/import-dashboard.service.ts` calls the endpoint and unwraps the standard envelope. `hooks/use-import-dashboard.ts` scopes the cache by company, user and month, passes cancellation signals, and polls every five seconds while returned active batches exist. The initial request omits month to use the company's backend default; subsequent selections send `month=YYYY-MM`.

The page hides access-controlled null KPI/template sections, uses the server's timezone and snapshot timestamp, and provides manual refresh, empty states, local recent-table filtering, and links to actual batch UUIDs. It never substitutes demo data for failures. The old compatibility totals may remain in the response but are not used by this new dashboard.

No new write endpoint, queue job or migration is required by the dashboard proposal itself. Existing import mutation and workflow APIs remain unchanged.
