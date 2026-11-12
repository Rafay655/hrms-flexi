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
const date: PreviewField = { key: 'From', label: 'From', type: 'date', required: true };
const reason: PreviewField = { key: 'Reason', label: 'Reason (at least 10 characters)', required: true };
export const previewDefinitions: Record<string, PreviewDefinition> = {
    'short-leave': { title: 'Short Leave', description: 'Preview a time-based short-leave request.', action: 'Preview short leave', dependency: 'Short-leave application, approval and policy-edit APIs. This is a local form only.', columns: ['Date','Start time','End time','Minutes','Reason'], fields: [{key:'Date',label:'Leave date',type:'date',required:true},{key:'Start time',label:'Start time',type:'time',required:true},{key:'End time',label:'End time',type:'time',required:true},reason], rows: [] },
    'on-behalf': { title: 'Apply on Behalf', description: 'Explore an HR-assisted leave application without sending a request.', action: 'Preview application', dependency: 'Explicit on-behalf authorization and an employee-scoped application endpoint.', columns: ['Employee','Leave type','From','To','Reason'], fields: [person,leave,date,{key:'To',label:'To',type:'date',required:true},reason], rows: [] },

    'encashment': { title: 'Encashment', description: 'Preview an encashment request using days and a rate per day.', action: 'Preview request', columns: ['Leave type', 'Days', 'Rate per day', 'Amount', 'Status', 'Payroll included'], fields: [leave, { key: 'Days', label: 'Days to encash', type: 'number', min: 0.1, max: 9, step: 0.1, required: true }, { key: 'Rate per day', label: 'Rate per day (PKR)', type: 'number', min: 0, max: 999999, step: 0.01, required: true }], rows: [{ 'Leave type': 'Annual leave', Days: '2', 'Rate per day': '3500', Amount: '7000', Status: 'Pending', 'Payroll included': 'No' }] },
    'balance-ledger': { title: 'Balance Ledger', description: 'A preview of the balance history needed from the backend.', action: '', dependency: 'Balance-history API and an auditable source of balance changes are required.', columns: ['Date', 'Leave type', 'Event', 'Change', 'Balance'], fields: [], rows: [{ Date: '2026-10-01', 'Leave type': 'Annual leave', Event: 'Opening allocation', Change: '+14', Balance: '14' }, { Date: '2026-10-06', 'Leave type': 'Annual leave', Event: 'Approved leave', Change: '-1', Balance: '13' }] },
    'delegations': { title: 'Delegations', description: 'Preview who can review leave while a manager is away.', action: 'Add demo delegation', dependency: 'Backend delegation rules, date overlap checks and delegated approval authorization.', columns: ['Delegate', 'From', 'To', 'Status'], fields: [{ ...person, key: 'Delegate', label: 'Delegate' }, date, { key: 'To', label: 'To', type: 'date', required: true }], rows: [] },
};
