# LeaveEase screen-map implementation

## Navigation

- My Leave: balances, live requests, calendar, encashment preview, live Comp Off.
- Team & Approvals: explicitly labelled demo inbox, team leave calendar and team balances.
- Leave Setup: live Leave Policy, Holiday Calendar, Leave Types and Accrual Rules.
- Balance Operations: adjustment and opening-balance previews; existing live Unpaid Leave and HR Encashments.
- Insights: sample reports, analytics and a link to the real Audit Trail filtered to LeaveEase.
- Settings: Planned Features, keeping backend-dependent work out of the everyday menu.
- No separate Automation section: duplicate workflow/notification screens no longer appear.

## Implemented preview workflows

| Route | Preview behavior |
|---|---|
| `/leave-ease/approvals-inbox` | Unified leave, comp-off and encashment filters; view; approve/reject sample records with a rejection reason. |
| `/leave-ease/team-calendar` | Approved leave and holiday events by employee and month. No attendance, overtime or punch data. |
| `/leave-ease/team-balances` | Search a fixed sample team and compare leave-type balances. |
| `/leave-ease/balance-adjustments` | Employee, leave type, year, signed amount, reason; no fabricated server history or pending-approval step. |
| `/leave-ease/opening-balances` | Dynamic leave-type rows, opening and carried-forward amounts. Local rows only. |
| `/leave-ease/encashment` | Days, sample rate, computed amount and status; excludes tax, net pay, payslips and invented retention rules. |
| `/leave-ease/reports` | Balance summary and leave taken, search/filter and real download of a DEMO CSV. |
| `/leave-ease/analytics` | Totals derived from the shared sample team. |
| `/leave-ease/planned-features` | Preview catalogue for missing backend operations. |

Planned previews include accrual runs, delegation, carry forward, year-end close, ledger, payroll periods, blackout dates, rejection reasons, optional adjustment approvals, short leave and on-behalf applications. Forms validate inputs and only keep local state. They do not run jobs, lock payroll, modify balances or call approval APIs.

## Consolidation

- The 55 legacy `/leaveease` route pages now forward to `/leave-ease`; duplicate screen implementations have been replaced with small redirects.
- Guide-labelled Hide routes forward to the relevant retained screen. Pending Approvals opens the unified leave inbox instead of attendance fixes. Credits and All Credits open the retained live Comp Off screen.
- Extra AI, simulator, incentive, on-duty, notification and workflow interfaces have been removed from these routes and the sidebar. Shared components and the backup folder are retained to avoid deleting imports used elsewhere.
- Existing live services and setup pages have not been replaced with dummy APIs.

## Remaining backend work

Manager authorization, workflow selection/publishing, employee matching, accrual scheduling, history, payroll locks, carry-forward execution, report APIs and missing short-leave/on-behalf endpoints are not implemented by this frontend preview. The guide's backend findings are not verified against live server responses here.

## Review

1. Open each visible menu item and check the distinction between live pages and demo previews.
2. In Approvals Inbox, filter each type, view a record, reject with a reason and confirm local status changes.
3. In Team Calendar, change months, search employees and open a leave/holiday event.
4. Open Planned Features and review each form; submit valid/invalid ranges and values.
5. Export demo reports and confirm the file name and sample contents.
6. Check old `/leaveease` bookmarks redirect correctly.

No live approvals or HR mutations were performed during implementation.

## Sidebar revision

The sidebar now follows the supplied screen map literally: all 33 Works, Wire up and Missing entries are visible using their exact names; every Hide entry is excluded. Missing features are directly accessible in their listed groups rather than being accessible only through Planned Features. The standalone Planned Features page remains available by URL.

Comp-Off Approvals and Encashment Approvals open the unified inbox with the corresponding filter. Comp-Off Credits and Comp-Off All open the retained Comp Off page in its My or All tab. Automation is omitted because all of its entries are marked Hide.
