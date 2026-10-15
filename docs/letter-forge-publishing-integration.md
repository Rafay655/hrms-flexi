# Letter Forge publishing integration

## Where to use it

- Templates → **Versions & publishing** opens `/letter-forge/templates/{uuid}/review`.
- **Review queue** checks the histories for the current page of ten templates; use Next to inspect further templates.
- An eligible checker sees **Approve & publish** and **Reject**. Reject requires a nonblank note, up to 1,000 characters.
- A draft can be published or, for sensitive categories, submitted for review. A publish HTTP 409 automatically submits for review; other failures remain errors.
- Published versions offer **Retire version** with confirmation.
- Active templates offer **Generate letter** to users with `generate-letters`. Enter the numeric employee ID, language, and optional flat JSON values.
- Generation preserves the language-fallback notice. Pending approval is displayed separately. PDF polling starts at 1.5 seconds, increases to an 8-second interval, and stops after one minute, on failure, or when a PDF path is available. Pause and Check status again never generate another letter.
- The generated letter has a persistent `/letter-forge/letters/{uuid}/status` URL for later checks. Refresh this screen after approval.

## Backend changes required alongside the frontend

The local backend was updated without adding routes or migrations:

- `GET /letter-forge/templates/{uuid}/versions` retains its envelope and adds maker/submitter UUIDs and names, `created_at`, and `can_review`. Frozen `content` is available only with `manage-letter-templates`.
- `POST /letter-forge/templates/{uuid}/preview` optionally accepts `{ "version_id": 123 }`. The version must belong to the already company-scoped template. Without this field, existing preview behavior is unchanged.
- Review rejects both the draft creator and the submitter, even when they are different users.

Deploy these backend changes before using frozen comparisons and approval controls. With an older backend, the UI keeps approval controls unavailable when checker eligibility cannot be verified and does not present the current staging template as a frozen preview.

## Verification

Frontend tests cover endpoint methods, publish fallback and errors, maker/checker restrictions, content comparison, extra-data validation, preview lifecycle, polling completion/failure/timeout, and resume. Backend feature tests were added for permissions, frozen preview scope, and creator self-review. PHP syntax was checked; backend feature tests require Composer dependencies and the configured test database.

The existing project-wide type errors in Compliance and `lib/letter-forge-contract.ts` remain outside this integration.
