# LeaveEase UI implementation plan — pending user approval

## Review findings

The current sidebar uses `/leave-ease`, but the module tile registry, PeopleHub employee links and a PayEdge link still reference `/leaveease`. Do not delete the legacy route folder until these are migrated or redirected. The legacy folder currently contains 55 files; `.backup-leaveease-old` also exists.

The dashboard, My Balance and My Calendar contain sample data. Existing services already expose self balances, requests and comp-off; types, policies and holidays have separate services. These are integration starting points, not confirmation of live backend behavior.

The supplied guides describe backend manager-scoping and approval-chain gaps. Their claims have not been verified against a current backend checkout or live responses. The frontend alone cannot enforce team authorization or select/repair a backend workflow engine.

## Phase 1: navigation and route consolidation

- Use `/leave-ease` as the canonical route and migrate known legacy links.
- Keep Dashboard and My Leave: My Balances, My Requests, My Calendar, Encashment, Comp Off.
- Rename Policy Studio to Leave Setup. Keep Leave Policy before Holiday Calendar, then Leave Types and Accrual Rules. Verify whether `/accrual` or `/accrual-rules` is the API-backed implementation before choosing one link.
- Add Balance Operations for Balance Adjustments, Opening Balances, Unpaid Leave and HR Encashments; retain only usable operations as wiring proceeds.
- Remove guide-labelled Hide entries from the sidebar: rewards, attendance Pending Approvals, eligibility, assignments, duplicate accrual/entitlements, proration, duplicate encashment list, on-duty/travel, incentives, simulator/SLA, notification/workflow/integration screens and AI/report placeholders.
- Remove Missing features from the working sidebar until backend support is confirmed: ledger, delegations, adjustment approvals, accrual jobs, carry-forward/year-end, blackout, rejection reasons, payroll periods and unsupported insights.
- Consolidate Comp Off/Credits/All/Approvals rather than removing access to connected comp-off functionality.
- Keep Team and Approvals out of the working sidebar until the backend access rules and chosen approval path are confirmed. Existing routes are not security boundaries.
- Preserve page files in this phase. Delete duplicate folders only if separately approved after checking imports and redirecting legacy URLs.
- Check sidebar identifiers for duplicates while regrouping.

## Phase 2: employee screens

- Connect Dashboard to real self balances, pending requests and upcoming holidays; remove unsupported metrics/charts.
- Connect My Balance; remove invented expiry/history/hours/unlimited figures.
- Build My Calendar from real requests and holidays, including half-days and empty/loading/error states.
- Preserve and align connected request, comp-off and encashment flows; show only actual returned fields.
- Follow the current LetterForge listing style, sorted Leave Type modal sections, shared AppLoader and React Hot Toast.
- Derive counts only from complete pagination or server totals. Scope queries to company and user.

## Phase 3: HR screens

- Wire Balance Adjustments and Opening Balances using confirmed endpoint contracts. No fake history or pending-approval states.
- Use employee IDs and dynamic leave types for opening balances.
- Align existing Holiday Calendar, Accrual Rules, Unpaid Leave and HR Encashment screens.
- Surface policy scope using stored grade/department rules; do not invent employee matching results.

## Backend-dependent decisions

- Confirm manager-scoped requests/balances and manager authorization for approve/reject.
- Choose direct approval or routed workflow tasks; do not create a frontend bypass.
- Decide whether short leave and adjustment approval are required for closing.
- Request current API contracts for missing operations and report backend work separately.

## Approval checkpoints

1. Approve Phase 1 menu/route cleanup with page files preserved, or additionally approve deletion of verified unused legacy/backup code.
2. Approve Phase 2 employee screens using existing API contracts.
3. Approve Team/Approvals only after backend access behavior and approval path are confirmed.

No implementation or deletion has been performed as part of this review. Only this plan has been added.


## Implementation update — demo-first approval

The user approved continuing with dummy data. Dashboard, My Balance and My Calendar now use one explicit, shared demo fixture. They do not submit mutations. Existing live requests, comp-off, policy/type/holiday/accrual screens retain their API connections. Employee demo pages link to the real request page, with a notice that their sample records are separate.

The sidebar has been reduced to My Leave, Leave Setup and Balance Operations, with the Dashboard retained. Team and Approvals await a separate decision; no backend security claims were verified. Unsupported pages, legacy route copies and backups have not been deleted. Known module tile and cross-module links have been moved to canonical routes. No fake backend history, reports or accrual execution has been added.
