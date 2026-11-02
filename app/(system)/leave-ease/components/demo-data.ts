export type DemoLeaveStatus = 'Approved' | 'Pending' | 'Rejected';
export const demoBalances = [
    { name: 'Annual leave', code: 'AL', entitlement: 14, used: 5, pending: 2, carried: 0, color: '#1E1B4B' },
    { name: 'Casual leave', code: 'CL', entitlement: 10, used: 3, pending: 0.5, carried: 0, color: '#8876B5' },
    { name: 'Sick leave', code: 'SL', entitlement: 8, used: 2, pending: 0, carried: 0, color: '#658B78' },
    { name: 'Comp off', code: 'CO', entitlement: 2, used: 0, pending: 0, carried: 0, color: '#B17E43' },
];
export function demoMonthEvents(year: number, month: number) {
    const date = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return [
        { id: 'annual', title: 'Family time', type: 'Annual leave', start: date(10), end: date(11), days: 2, status: 'Pending' as const, halfDay: false, holiday: false, note: 'A short family break.' },
        { id: 'casual', title: 'Personal appointment', type: 'Casual leave', start: date(18), end: date(18), days: 0.5, status: 'Pending' as const, halfDay: true, holiday: false, note: 'Morning half-day appointment.' },
        { id: 'sick', title: 'Medical leave', type: 'Sick leave', start: date(6), end: date(6), days: 1, status: 'Approved' as const, halfDay: false, holiday: false, note: 'Approved medical leave.' },
        { id: 'holiday', title: 'Company holiday', type: 'Holiday', start: date(23), end: date(23), days: 1, status: 'Approved' as const, halfDay: false, holiday: true, note: 'Illustrative company holiday; not an official holiday calendar.' },
        { id: 'declined', title: 'Personal leave', type: 'Casual leave', start: date(26), end: date(26), days: 1, status: 'Rejected' as const, halfDay: false, holiday: false, note: 'Sample rejected request. No balance deduction.' },
    ];
}
export type DemoLeaveEvent = ReturnType<typeof demoMonthEvents>[number];
export const demoStatusClass = { Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', Pending: 'border-amber-200 bg-amber-50 text-amber-700', Rejected: 'border-rose-200 bg-rose-50 text-rose-700' };
