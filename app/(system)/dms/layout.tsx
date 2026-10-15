import React from 'react';

export const metadata = { title: 'Document Management — Flexi HRMS' };

export default function DmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {children}
    </div>
  );
}
