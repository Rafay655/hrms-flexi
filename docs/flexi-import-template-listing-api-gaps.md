# Flexi Import template listing — backend handoff

The new listing at `/flexi-import/templates` uses the Table Preview style: Poppins, square corners, compact toolbar, fixed table height, row action menu, modal details and bottom pagination. Shared primitives are in `components/shared/listing-ui.tsx` for the next listings.

## Existing connected capabilities

- GET `/flexi-import/importer-templates`: q, import_type, status, version, page, per_page. Uses server-side search/filter/pagination, not page-only filtering.
- GET `/flexi-import/import-types`: supported importer names and destinations.
- GET `/flexi-import/importer-templates/{uuid}?version=N`: exact version details.
- GET `/flexi-import/importer-templates/{uuid}/download?version=N`: exact saved Excel export.
- Existing template designer handles create and immutable new revisions; the listing links to it. These do not become inline edits to a frozen version.
- Use version links preserve both template_uuid and version.
- No CRUD operation is simulated. Export success/error uses a modal. Field availability is shown as File export, not falsely presented as active/inactive status.

## Not defined in the current frontend API contract

These are gaps to discuss with backend, not connected endpoints:

1. Delete/archive: provide a supported endpoint and policy for templates pinned to existing batches. Specify soft archive vs permanent delete, response, permission and conflict errors. No Delete action is shown until this is agreed.
2. Bulk actions: no batch delete/archive/export contract. Therefore selection checkboxes and bulk action controls are omitted. For bulk export, define exact UUID/version pairs, archive format, limits and partial failure handling.
3. Status mutation: no activate/deactivate endpoint or per-row status field. Only the existing active filter is offered. Add status and allowed transitions/capabilities before introducing switches.
4. Server sorting: define allowed sort_by values and sort_direction, stable tie-breaker, and sorting across all pages. No misleading page-local sorting is shown.
5. Ownership filter: owner_id exists as a request field but there is no owner-options endpoint in the connected service. Supply authorized owner choices before showing this filter.
6. Standardized row metadata: owner and updated_at are optional; no guaranteed created_at or status. These columns are omitted until guaranteed. Return timestamps as ISO 8601 and owner as a documented object/label.
7. Pagination: return current_page, last_page, total and per_page consistently within the saved-template collection payload. per_page should describe the actual server page size after any cap. The UI uses it when available.
8. Field labels: return the pinned field snapshot in exact-version details. Without it the detail modal shows a clear unavailable state instead of exposing raw system keys to HR.

For future actions return explicit capabilities such as can_revise, can_archive and can_export if state-dependent; backend authorization remains mandatory. Preserve immutable versions and existing approved import references. Do not implement bulk/delete endpoints by silently rewriting or deleting referenced version snapshots.

## UI decisions

Create/revise uses the current designer because selecting fields, schema and operation is a multi-step configuration. View uses a modal. The reusable listing primitives can support future create/edit/delete modal flows once the corresponding backend action exists.

No new backend endpoints were assumed or called by this UI change. Existing frontend service definitions establish what is connected; they do not prove every optional filter is deployed. Verify deployed filter semantics with backend when testing.

## Saved-template-only entry

Standalone New Import navigation has been removed. Dashboard/history links now open the template library. `/flexi-import/new` requires both template_uuid and a positive exact version; without them it redirects to the library. Upload remains available through Use this version, and Back returns to templates. A server response for a different UUID/version blocks upload rather than silently falling back to latest or standard templates. Existing batch recovery links may retain the exact pinned version.
