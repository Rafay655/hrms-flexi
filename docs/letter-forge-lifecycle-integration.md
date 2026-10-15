# Letter lifecycle integration

The frontend now uses authenticated `/letter-forge/letters` endpoints for listing, detail, dispatch, reminders, blob download, revoke and supersede. No recall action is offered.

Sidebar destinations: Dashboard, Templates, Generate, Letters, Letter Batches. Trigger Rules and Review Queue links stay removed. Template publishing is available directly on each row and in its action menu. Existing template and batch listing columns are preserved. Backend approval requirements still apply to publishing.

## Backend changes to deploy together

- `GeneratedLetterController::show` loads company-scoped predecessor/replacement relationships.
- `GeneratedLetterResource` exposes `supersedes_uuid`, `replacement_uuid`, revoke metadata and action flags.
- Download prefers `signed_pdf_path` when present and resolves it through `ArtifactStore`, retaining authentication and retention checks.
- `canBeDownloaded` accounts for signed artifacts and expiration.

The currently checked-out dispatch service can transition a generated/approved letter to `pending_signature`, rather than returning 422, when its internal-signature policy requires it. The frontend reports the actual returned status; it does not claim delivery occurred. Other server validation messages remain visible in the action dialog.

Reasons are validated at 10–1,000 characters and sent verbatim. Supersede accepts at most 50 scalar override values and opens the returned replacement UUID. Mutations are not automatically retried. Reminder success starts a three-minute cooldown saved per company/user/letter in browser storage. Download errors returned as JSON blobs are decoded for a useful message.

## Verification

Frontend service and component tests cover confirmation, 422 errors, audit reasons, channel payloads, replacement navigation, cooldown persistence, collection pagination and blob download cleanup. Backend regression tests cover signed artifact selection, expiry and bidirectional replacement links. Laravel tests require the backend's Composer dependencies to be installed; this checkout has no `vendor/autoload.php`.

Live dispatch, employee notifications, revocation and replacement issuance have not been performed during development. Validate those using a test employee in the deployed environment.
