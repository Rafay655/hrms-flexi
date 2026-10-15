# Letter Forge code study — 2026-09-24

Scope: current working files in `D:/hrms-flexi` and `C:/Users/abdul/OneDrive/Documents/flexi/Flexi-HRMS-3.0-/backend`. This is a source review, not a claim of production readiness. Existing local edits/deletions were preserved. Older audit documents contain claims that no longer match this checkout.

## Current frontend

Next.js 16 / React 19 / TypeScript, with Axios and TanStack Query.

Only `app/(system)/letter-forge/templates/page.tsx` currently remains in the module route tree. Git reports the dashboard, generation, letter list/detail, self-service, trigger rules, template editor/new page, and shared editor/signing/bulk components as locally deleted. These exist in Git HEAD, but are not current runnable screens. The shared sidebar still links to the missing routes.

Current flow:

1. Root `app/layout.tsx` installs `lib/QueryProvider.tsx` above the Redux provider.
2. The template page debounces search/category by 350 ms, maintains language/page/size/sort filters, and calls `hooks/use-letter-forge.ts`.
3. Hooks call `services/letter-forge.ts` for list/create; Axios in `lib/api.ts` supplies bearer authentication and `X-Company-ID` from local storage. API base URL must include `/api/v1`.
4. The list displays template metadata; a details dialog displays HTML as source text, not a rendered preview.
5. `components/create-template-modal.tsx` collects HTML, paper options, variables, JSON samples, approval/series flags and signature policy. Successful creation invalidates the template query family.
6. A second service, `services/letter-forge.service.ts`, duplicates list/create operations but currently supplies only error extraction to this UI.

There are no current frontend calls for update/delete/preview/publish/review/generation/dispatch/batches. The shared `services/letterforge-employee-search.ts` remains in use by other modules, so it must not be removed as apparently orphaned Letter Forge code.

## Backend map

Laravel 12 / PHP 8.2+, Sanctum, Spatie permissions, Eloquent, DomPDF, queue jobs and NotifyPro.

`bootstrap/app.php` mounts `routes/letter-forge.php` under `/api`; the route file supplies `/v1/letter-forge` and `auth:sanctum`, `cc.active`, `cc.scope`, `cc.track` middleware. Controllers use the authenticated user's company and company-scoped queries. Expensive operations also use `lf.rate`.

| Area | Main implementation | Behavior |
| --- | --- | --- |
| Templates | LetterTemplateController, LetterTemplateService, LetterTypeRegistry | Registered template keys; category/default flags derived server-side; company override before shared system default; language fallback |
| Publication | LetterTemplateVersion and template service | Frozen content versions, draft/review/publish/retire; sensitive categories require separate maker/checker |
| Manual generation | GeneratedLetterController::generate | Resolves employee/template/language, creates letter, parks for approval or queues PDF rendering |
| Shared issuance | LetterIssuanceService | Used by trigger/bulk paths; issuing-entity resolution, policy checks and series allocation with unique-key retries |
| Rendering | GenerateLetterPdfJob, LetterGeneratorService | Variables, published content, approval binding, legacy HTML or Mustache Markdown, DomPDF, content hash/context evidence, artifact storage |
| Delivery | LetterDispatchService, LetterOutbox, ProcessLetterOutboxJob | Transactional state/log/audit/outbox write, then asynchronous NotifyPro delivery; retry/recovery services |
| Signature | LetterSignatureService and controller | OTP verification, pending_signature → signed; controller enforces employee ownership |
| Acknowledgement | LetterDispatchService::acknowledge | Employee confirms receipt after delivery; separate timestamps/state, not a dispatch blocker |
| Revocation/replacement | LetterDispatchService | Revoke removes self-service access; supersede links original/replacement; recall is a compatibility alias |
| Batches | LetterGenerationBatchController, LetterBatchService, BulkGenerateLetterJob | Persisted eligibility preview, commit, item progress, failed-item retries, tenant limits |
| Automatic triggers | LetterTriggerService, LetterEventEnvelope, LetterEventInbox | Versioned event/condition contract, company override rules, event dedupe, immediate/delayed dispatch |
| Operations | LetterOpsController, recovery/retention services and scheduled jobs | Queue/backlog metrics, outbox recovery and artifact expiry |
| AI | AiAssistController/AiAssistService | Draft/stream routes are feature-flagged; disabled by default |

Important tables: letter_templates, letter_template_versions, generated_letters, letter_context_snapshots, letter_trigger_rules, letter_event_inbox, letter_dispatch_logs, letter_outbox, letter_generation_batches and batch items. Generated letters are intended to remain audit records; retention deletes artifacts rather than removing the letter through product APIs.

The `letters` worker is required. `routes/console.php` now schedules delayed dispatch, queue health, outbox recovery and artifact retention. Their presence does not prove that workers or the scheduler are running in a deployed environment.

Main permissions: view-letter-templates, manage-letter-templates, generate-letters, view-generated-letters, manage-letters, approve-letters and view-own-letters. Template HTML fields are conditional on manage permission. Self-service actions have additional ownership restrictions.

## Lifecycle details for frontend work

- `generated` does not necessarily mean the PDF exists: rendering is asynchronous. Check readiness/status and download availability.
- Approval-required letters initially stop at `pending_approval`; manual approve/reject endpoints still exist. Approval and template publication are distinct workflows.
- Production rendering selects published content; a sensitive-category template can be active yet have no published version and be unusable for generation.
- Signature policy supports none, internal_signatory, employee_acknowledgement, multi_party and external_qualified. The last two are refused at generation until a provider adapter exists.
- Delivery supports email/in_app notifications plus local print/none flows. A dispatched state and successful external delivery are separate facts tracked through the outbox/attempt records.
- English, Urdu and Arabic are supported in the contract; Urdu/Arabic rendering selects RTL and Arabic fonts.
- Payroll/loan/performance context is supplied through integrations. Do not assume generic employee lookup supplies every letter variable.

## Confirmed integration gaps and source-level risks

1. **Frontend type exports are incomplete.** The modal imports CreateLetterTemplatePayload, Orientation, PaperSize and TemplateLanguage from `types/letter-forge.ts`, where they are absent. The duplicate service imports additional absent LaravelApiError and LetterTemplateListResponse types. The active service defines a different create payload with required category, although the backend derives category.
2. **Template list pagination contract differs.** The UI expects top-level `meta` and offers 10/25/50 plus sort options. `listTemplates()` hardcodes `orderBy('name')->paginate(25)`; controller wraps a resource collection in `ApiResponse::success` without passing pagination metadata. Confirm the actual HTTP envelope before finalizing the client contract.
3. **Inactive templates cannot be listed by the service as written.** It starts with `active()` and then adds an is_active condition, so requesting false creates contradictory predicates.
4. **Default create body contains an invalid variable.** The modal uses `{{date}}`; LetterTypeRegistry contains `{{letter_date}}` and `{{today_date}}`, not `{{date}}`. Unchanged default content is rejected by legacy validation.
5. **Frontend response types omit backend distinctions.** HTML may be withheld by permission, but body_html is typed as always present. Publication status/version data is absent from the current template resource/UI; acknowledgement configuration is not exposed by that resource either.
6. **Employee identifier mismatch matters when rebuilding generation.** The shared picker returns UUIDs; the current backend GenerateLetterRequest requires integer employee_id and the controller queries the numeric ID. The picker's claim that generation accepts UUIDs does not match these files.
7. **System-default header rendering can throw.** LetterGeneratorService::generatePdf passes nullable template.company_id to getDefaultHeader(int ...). A shared template without custom header reaches this call.
8. **Manual generation bypasses shared series allocation.** GeneratedLetterController::generate duplicates issuance and uses an unprotected count + 1. LetterIssuanceService has locking/duplicate-key retry logic, but the manual endpoint does not call it. Count-based numbering with excluded failed rows also needs targeted coverage.
9. **PDF retry state is inconsistent.** GenerateLetterPdfJob catches transient Throwable, marks the letter failed and rethrows; its next handle only accepts generated/approved, so a retry skips the failed row. Backoff declarations alone do not establish a working retry lifecycle.
10. **Mustache generation exists, but authoring/preview differs.** generate() has a Mustache branch. Store/update requests do not accept engine/variable_schema, and preview calls the shared plain template renderer rather than the Mustache pipeline. Do not assume authoring, preview and generated output have parity.

Follow-up checks: runtime ApprovalFlow/event registration (including discovery), DMS archive invocation, query-cache isolation across company/account changes, real PDF/font/letterhead output, signature concurrency/throttling, and end-to-end delivery. Listener/service files alone are not evidence of a wired integration.

## Validation boundaries and suggested order

Frontend TypeScript check completed with `tsc --noEmit --incremental false --pretty false`: 11 errors, including seven missing-export errors in the Letter Forge modal/duplicate service and four unrelated compliance errors. No application code was changed during this study.

Backend vendor/autoload.php is absent in this checkout, so PHPUnit and live route/event listings were not run. PHPUnit configuration targets a dedicated MySQL test database; avoid running migration-based suites against ordinary data. Existing tests cover templates, rendering, signatures, governance, evidence, batches/outbox, retention, languages/ops and policies, but this study does not certify that they pass.

Start by aligning template list/create types and API contracts, including valid sample variables, pagination and permission behavior. Then implement editing/preview/publication as one complete flow. Address generation-path defects before rebuilding generation/history/detail screens. Follow with delivery/signing/acknowledgement, batches and trigger rules, using the current backend endpoints rather than restoring old frontend assumptions blindly.
