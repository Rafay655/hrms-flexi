'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { amsService } from '@/services/ams.service';
import type { AmsCategory } from '@/types/ams.types';

export default function AmsAgingReportPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data: categories } = useQuery({
    queryKey: ['ams', 'categories', 'all'],
    queryFn: () => amsService.getCategories({ per_page: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'reports', 'aging', categoryId],
    queryFn: () => amsService.getAgingReport(categoryId),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Asset Aging</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                % of useful life consumed per asset
                {!isLoading && data && data.excluded_count > 0 && (
                  <span className="ml-2 text-gray-400">
                    ({data.excluded_count} excluded — missing data, disposed, or lost)
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => amsService.downloadReportCsv('aging', categoryId)}
            >
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 max-w-xs">
            <Select
              value={categoryId ?? 'all'}
              onValueChange={(v) => setCategoryId(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="border-gray-300"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(categories?.data ?? []).map((c: AmsCategory) => (
                  <SelectItem key={c.uuid} value={c.uuid}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Asset Tag</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase Date</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Age (yrs)</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">% Life Consumed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">No assets found.</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.asset_uuid} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm font-mono text-gray-700">{row.asset_tag}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{row.name}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{row.category_name ?? '—'}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{row.purchase_date}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-700">{row.age_years}</td>
                        <td className={`py-4 px-6 text-sm text-right font-medium ${row.pct_life_consumed >= 90 ? 'text-amber-700' : 'text-gray-900'}`}>
                          {row.pct_life_consumed}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
