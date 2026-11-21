# Flexi Import Studio frontend handoff — 19 November 2026

Contract: updated Desktop copy of FlexiImport-Studio-Frontend-Integration.md supplied by the user. Existing authenticated API client and project theme are retained.

## Connected (updated 21 November)

- GET import-types drives New Import, schema designer and history scope options. No fixed seven-scope allowlist is used in the picker.
- GET schemas/{type} drives available fields, operations and schema versions. fields/{type} supplies review metadata.
- GET/POST importer-templates, exact-version GET importer-templates/{uuid}?version=N and POST importer-templates/{uuid}/versions support paginated listing, use and new immutable configuration versions. Payloads use selected_field_keys; Version creation includes expected_version and current schema_version. A 409 refreshes schema/configuration and offers Load latest template version, avoiding silent overwrites.
- Required fields and controlling columns must be included before saving. GET importer-templates/{uuid}/download?version=N exports the exact selected-column XLSX snapshot. Old versions without download_available and a field snapshot cannot be uploaded or exported until a new version is saved.
- All discovered scopes use the shared file-first upload, paginated preview, approval, processing/results and audit UI. auto_process=0 is explicit. Employee form mode and credential options remain employee-specific.
- Authenticated blob downloads use Content-Disposition filenames and preserve JSON errors. Unpinned uploads can apply existing column maps. Saved-version uploads send template_uuid and template_version together, freeze the saved form mode, and omit upload-level mapping overrides. Batch editing metadata comes from status preview_fields, including the pinned snapshot; read-only grids can fall back to saved metadata and uploaded values.
- GET lookups/{sourceKey} supports server search, parent_id and pagination. Corrections send the selected label rather than the database ID. A parent change clears dependent local choices.
- GET batches/{uuid}/audit reads actual events and has_more; no fabricated audit events are displayed.
- Gap creation extra fields use nested extra objects, server defaults and returned option values. Complete successful resolution queues revalidation; partial failures remain visible for correction.
- Server-authorized valid/invalid row corrections across scopes, manager dependency revalidation, frozen workflow decisions, failed-row retry and binary error reports are retained.
- Loan batches are approval-only in the UI. No import_mode override or direct processing action is exposed for them; editable previews submit for approval with all-or-nothing controls. Salary, attendance, leave and expense results explain their downstream module state.
- Rollback is restricted to completed employee batches with both eligibility flags. Financial correction and compensation belong to their owning modules.

## Still outside the contract

Blank manual-entry batches, staged-only master creation and universal recovery-preview/restore remain unavailable. They must not be represented as functioning APIs.

## Validation limits

Local service/component regression tests, TypeScript and scoped lint verify request construction and UI guards. No authenticated production imports, approvals, loan changes, financial mutations or deployments were performed. Real CSV/XLSX round trips for each enabled scope, distinct-user loan approval, cross-company denial and 1,000+ employee load testing still require the deployed staging environment and workers.

## Flow audit follow-up

- Saving a template returns to the template library. Its Use version action opens a pinned upload; returning to standard import selection clears saved-template reuse.
- The workspace gives a plain-language current state and next action. Processing outcomes now live under Results; duplicate recovery controls and unsupported range-paste/direct-entry buttons were removed from the primary flow.
- Status transitions invalidate detail, preview rows, summary/gaps and audit together, so newly created approval tasks and committed row statuses do not remain stale.
- Fields returned as sensitive are not automatically treated as forbidden. Server visibility and editability remain authoritative; explicitly hidden/denied fields stay excluded.
- Correction undo/redo restores lookup IDs as well as labels. Known hidden conditional edits are omitted; unresolved lookup labels remain subject to authoritative backend revalidation rather than guessed IDs.
- A complete mocked-backend journey test uses the actual frontend API adapters across template save, pinned upload, invalid correction, revalidation, manual confirmation and committed results. This complements the component/service checks; it is not a live deployment round trip.

## Saved-template file validation fix

A saved-template upload returning status=failed, processed_rows=0 and a file-level column mismatch is a validation failure, not proof that processing ran. Such a batch opens Review and displays data.validation_errors, including row 0 file errors. Misleading row-result metrics are suppressed until file structure validation succeeds. The correction-upload link preserves the template UUID and version.

Saved uploads pre-check the selected columns: generated XLSX files use their hidden row-2 field keys, while CSV/custom headers are matched to the saved fields or saved header mapping. Mismatches stay on the upload screen and do not create a batch. Users can download the exact saved version or explicitly switch to a standard import; the client never silently drops version pinning.

## Lookup interaction adjustment

Lookup correction fields use one editable combobox: typing searches the authenticated paginated endpoint and options appear directly below the same field. There is no separate Search button or second search input. Selection preserves the server option ID for dependencies while submitting its spreadsheet label. Arrow/Enter/Escape controls and existing pagination remain available. Template save and revision actions return to the template listing.


### FlexiMeta destinations (20 November)
- New Import keeps one FlexiMeta card, then groups the server-provided destinations by category. No master-table list is hardcoded.
- The selected destination's exact `import_type` is used for schema, mapping, download, upload, saved template versions, and history filters. Existing mixed-entity saved templates retain their pinned snapshot.
- Schema notes, fixed options and reference guidance are shown in template design and the upload field-guidance panel. Parent records must exist before importing dependent records.
- The service supports destination-specific schema lookups with server search, pagination and numeric parent IDs; returned spreadsheet values stay separate from display labels and record IDs. Non-employee preview rows remain read-only under the current correction contract.


### Editable spreadsheet preview (21 November)
- The shared `ImportRows` grid serves both the upload review and Batch Details. It loads all row statuses by default, builds an ordered union of uploaded headers, retains wide-sheet scrolling, and uses server pagination or the 50-row size plus batch total.
- Status `can_edit_preview` controls editing and Re-check. The editor receives status `preview_fields` (including pinned fields) and `column_mapping`; valid and invalid rows are editable for all import scopes while permitted. Raw uploaded columns remain visible/read-only when metadata cannot be loaded.
- Changed values only are PATCHed to the same batch. PATCH itself queues validation; the frontend does not issue another revalidate. Queued changes close the dialog, show “Checking the spreadsheet…”, and refresh rows, counts, gaps and approval information after status advances. Rejected edits retain the dialog and local values. A frozen preview disables saving without losing the local draft.
- Both wizard upload adapters now send `auto_process=0` and `review_before_approval=1`. An approval-required validated preview offers Submit for approval only with valid rows, zero invalid rows and no unresolved gaps; it calls process with all-or-nothing controls. Existing workflow decisions are displayed after submission. Submitted, approved, processing and terminal batches remain read-only.
- Re-check calls the revalidate endpoint without a request body and shares the same polling lifecycle. HTTP 409 messages are shown and current batch data is refreshed.
