# Letter Forge dashboard API

The dashboard uses GET /letter-forge/dashboard?month=YYYY-MM through the existing authenticated Axios client. The response is the normal success/message/data envelope, typed by LetterDashboard in types/generated-letters.ts.

The month selector defaults to the current month and offers the last 24 months. Queries are scoped by company and month, support cancellation, and show loading, error/retry, and empty states without demo fallback.

KPI values, status totals, attention counts and hints, trend series, top types (including Other), channel percentages, acknowledgement totals, template inventory, recent batches and recent letters come from the API. Batch remaining and committable fields are authoritative; a committed dry run is not shown as awaiting commit. Search and status filtering apply to the returned recent letters.
