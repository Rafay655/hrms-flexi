export type PreviewField = {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'time' | 'select';
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
};
export type PreviewDefinition = {
    title: string;
    description: string;
    action: string;
    dependency?: string;
    columns: string[];
    fields: PreviewField[];
    rows: Record<string, string>[];
};
const person: PreviewField = { key: 'Employee', label: 'Employee', type: 'select', required: true, options: ['FLEXI-IT-0009 · Abdul Rafay', 'FLEXI-IT-0005 · Humza Yousaf', 'FLEXI-IT-0001 · Muhammad Shaban'] };
const leave: PreviewField = { key: 'Leave type', label: 'Leave type', type: 'select', required: true, options: ['Annual leave', 'Casual leave', 'Sick leave', 'Comp off', 'Study leave'] };
const year: PreviewField = { key: 'Year', label: 'Year', type: 'number', min: 2000, max: 2100, step: 1, required: true };
const date: PreviewField = { key: 'From', label: 'From', type: 'date', required: true };
const reason: PreviewField = { key: 'Reason', label: 'Reason (at least 10 characters)', required: true };
export const previewDefinitions: Record<string, PreviewDefinition> = {
    'short-leave': { title: 'Short Leave', description: 'Preview a time-based short-leave request.', action: 'Preview short leave', dependency: 'Short-leave application, approval and policy-edit APIs. This is a local form only.', columns: ['Date','Start time','End time','Minutes','Reason'], fields: [{key:'Date',label:'Leave date',type:'date',required:true},{key:'Start time',label:'Start time',type:'time',required:true},{key:'End time',label:'End time',type:'time',required:true},reason], rows: [] },
    'on-behalf': { title: 'Apply on Behalf', description: 'Explore an HR-assisted leave application without sending a request.', action: 'Preview application', dependency: 'Explicit on-behalf authorization and an employee-scoped application endpoint.', columns: ['Employee','Leave type','From','To','Reason'], fields: [person,leave,date,{key:'To',label:'To',type:'date',required:true},reason], rows: [] },

    'balance-adjustments': { title: 'Balance Adjustments', description: 'Preview a signed balance correction with a clear reason.', action: 'Preview adjustment', columns: ['Employee', 'Leave type', 'Year', 'Amount', 'Reason'], fields: [person, leave, year, { key: 'Amount', label: 'Signed adjustment (days)', type: 'number', step: 0.1, required: true }, reason], rows: [] },
    'opening-balances': { title: 'Opening Balances', description: 'One row per employee and leave type, including carried-forward days.', action: 'Add opening row', columns: ['Employee', 'Leave type', 'Year', 'Opening days', 'Carried forward'], fields: [person, leave, year, { key: 'Opening days', label: 'Opening days', type: 'number', min: 0, step: 0.1, required: true }, { key: 'Carried forward', label: 'Carried forward', type: 'number', min: 0, step: 0.1, required: true }], rows: [] },
    'encashment': { title: 'Encashment', description: 'Preview an encashment request using days and a rate per day.', action: 'Preview request', columns: ['Leave type', 'Days', 'Rate per day', 'Amount', 'Status', 'Payroll included'], fields: [leave, { key: 'Days', label: 'Days to encash', type: 'number', min: 0.1, max: 9, step: 0.1, required: true }, { key: 'Rate per day', label: 'Rate per day (PKR)', type: 'number', min: 0, max: 999999, step: 0.01, required: true }], rows: [{ 'Leave type': 'Annual leave', Days: '2', 'Rate per day': '3500', Amount: '7000', Status: 'Pending', 'Payroll included': 'No' }] },
    'balance-ledger': { title: 'Balance Ledger', description: 'A preview of the balance history needed from the backend.', action: '', dependency: 'Balance-history API and an auditable source of balance changes are required.', columns: ['Date', 'Leave type', 'Event', 'Change', 'Balance'], fields: [], rows: [{ Date: '2026-10-01', 'Leave type': 'Annual leave', Event: 'Opening allocation', Change: '+14', Balance: '14' }, { Date: '2026-10-06', 'Leave type': 'Annual leave', Event: 'Approved leave', Change: '-1', Balance: '13' }] },
    'delegations': { title: 'Delegations', description: 'Preview who can review leave while a manager is away.', action: 'Add demo delegation', dependency: 'Backend delegation rules, date overlap checks and delegated approval authorization.', columns: ['Delegate', 'From', 'To', 'Status'], fields: [{ ...person, key: 'Delegate', label: 'Delegate' }, date, { key: 'To', label: 'To', type: 'date', required: true }], rows: [] },
    'carry-forward': { title: 'Carry Forward', description: 'Preview a year-end carry-forward run against policy limits.', action: 'Preview carry forward', dependency: 'An idempotent carry-forward engine and its run history.', columns: ['Year', 'Leave type', 'Limit', 'Status'], fields: [year, leave, { key: 'Limit', label: 'Carry-forward limit (days)', type: 'number', min: 0, max: 999.9, step: 0.1, required: true }], rows: [] },
    'year-end': { title: 'Year-End Close', description: 'Review the year and next-year opening balances before closing.', action: 'Preview year-end close', dependency: 'Year-end checks, carry-forward processing and server-side locking.', columns: ['Year', 'Status'], fields: [year], rows: [] },
    'accrual-jobs': { title: 'Accrual Jobs', description: 'Preview accrual runs without changing real employee balances.', action: 'Preview accrual run', dependency: 'A scheduled accrual job, duplicate-run protection and a run-history API.', columns: ['From', 'To', 'Leave type', 'Status'], fields: [date, { key: 'To', label: 'To', type: 'date', required: true }, leave], rows: [] },
    'payroll-periods': { title: 'Payroll Periods', description: 'Preview payroll periods and the leave lock boundary.', action: 'Add demo period', dependency: 'Server-side payroll-period locks on every leave mutation.', columns: ['Period', 'From', 'To', 'Status'], fields: [{ key: 'Period', label: 'Period name', required: true }, date, { key: 'To', label: 'To', type: 'date', required: true }], rows: [] },
    'blackout': { title: 'Blackout Dates', description: 'Preview date ranges when leave requests would be restricted.', action: 'Add demo blackout', dependency: 'Backend blackout validation during leave application.', columns: ['Name', 'From', 'To', 'Reason'], fields: [{ key: 'Name', label: 'Name', required: true }, date, { key: 'To', label: 'To', type: 'date', required: true }, reason], rows: [] },
    'rejection-reasons': { title: 'Rejection Reasons', description: 'Preview reusable reasons for reviewers.', action: 'Add demo reason', dependency: 'A managed rejection-reasons API and approval integration.', columns: ['Reason'], fields: [reason], rows: [{ Reason: 'Insufficient team coverage for these dates.' }, { Reason: 'Requested dates overlap an existing leave request.' }] },
    'adjustment-approvals': { title: 'Adjustment Approvals', description: 'Optional preview of a review step before applying balance changes.', action: '', dependency: 'A business decision and a backend pending-adjustment approval lifecycle.', columns: ['Employee', 'Leave type', 'Amount', 'Status'], fields: [], rows: [{ Employee: 'FLEXI-IT-0009 · Abdul Rafay', 'Leave type': 'Annual leave', Amount: '+1', Status: 'Awaiting backend' }] },
    'reports': { title: 'Leave Reports', description: 'Sample balance summary and leave-taken records for layout review.', action: '', dependency: 'Balance-summary and leave-taken report APIs.', columns: ['Employee', 'Report', 'Leave type', 'Days', 'Period'], fields: [], rows: [{ Employee: 'Abdul Rafay', Report: 'Balance summary', 'Leave type': 'Annual leave', Days: '9', Period: '2026' }, { Employee: 'Abdul Rafay', Report: 'Leave taken', 'Leave type': 'Annual leave', Days: '5', Period: '2026' }, { Employee: 'Humza Yousaf', Report: 'Balance summary', 'Leave type': 'Casual leave', Days: '6', Period: '2026' }] },
};
