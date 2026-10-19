'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { amsService } from '@/services/ams.service';
import type { BundleApplicationStatus } from '@/types/ams.types';

// Status color/label maps — duplicated from
// app/(system)/ams/bundle-applications/[uuid]/page.tsx rather than extracted
// to a shared constant; matches this codebase's general style of not
// over-abstracting small per-page constants.
const STATUS_COLORS: Record<BundleApplicationStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<BundleApplicationStatus, string> = {
  open: 'Open',
  partially_fulfilled: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

// Outstanding bundle fulfillments queue (Phase 3B, design spec §3) — every
// bundle application still awaiting one or more lines to be fulfilled.
// "Continue Fulfillment" links to the same detail page built in Task 10;
// this is the same operation as initial confirmation, not a retry of a
// failure, so the wording must not say "Retry".
export default function OutstandingBundlesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'bundle-applications', 'outstanding', page],
    queryFn: () => amsService.getBundleApplications({
      status: 'open,partially_fulfilled',
      page,
      per_page: 15,
    }),
  });
  const applications = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Outstanding Bundle Fulfillments</CardTitle>
          <p className="text-sm text-gray-500">
            Onboarding bundle applications still awaiting fulfillment.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Bundle</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase">Outstanding</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">No outstanding bundle fulfillments.</td></tr>
                ) : (
                  applications.map((app) => {
                    const outstanding = (app.items ?? []).reduce((sum, item) => sum + item.outstanding, 0);
                    return (
                      <tr key={app.uuid} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                          {app.employee?.name ?? `Employee ${app.employee?.uuid.slice(0, 8) ?? '—'}`}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">{app.bundle_name_snapshot}</td>
                        <td className="py-4 px-6 text-sm">
                          <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-right">{outstanding}</td>
                        <td className="py-4 px-6 text-sm text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/ams/bundle-applications/${app.uuid}`}>Continue Fulfillment</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>Page {meta.current_page} of {meta.last_page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
