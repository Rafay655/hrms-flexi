export const previewPeople = [
    { id: 'demo-rafay', name: 'Abdul Rafay', code: 'FLEXI-IT-0009', department: 'Software Development', annual: 9, casual: 7, sick: 6 },
    { id: 'demo-humza', name: 'Humza Yousaf', code: 'FLEXI-IT-0005', department: 'Software Development', annual: 11, casual: 6, sick: 7 },
    { id: 'demo-shaban', name: 'Muhammad Shaban', code: 'FLEXI-IT-0001', department: 'Software Development', annual: 8, casual: 9, sick: 5 },
];
export type PreviewApproval = {
    id: string;
    employee: string;
    type: 'Leave' | 'Comp off' | 'Encashment';
    detail: string;
    date: string;
    quantity: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
};
export const previewApprovals: PreviewApproval[] = [
    { id: 'preview-a1', employee: 'Abdul Rafay', type: 'Leave', detail: 'Annual leave', date: '2026-11-10 – 2026-11-11', quantity: '2 days', status: 'Pending', reason: 'Family commitment.' },
    { id: 'preview-a2', employee: 'Muhammad Shaban', type: 'Comp off', detail: 'Weekend support', date: '2026-11-07', quantity: '1 credit day · 8 hours', status: 'Pending', reason: 'Demo weekend support credit.' },
    { id: 'preview-a3', employee: 'Humza Yousaf', type: 'Encashment', detail: 'Annual leave · PKR 3,500/day', date: '2026-11-01', quantity: '2 days · PKR 7,000', status: 'Pending', reason: 'Sample encashment request.' },
];
