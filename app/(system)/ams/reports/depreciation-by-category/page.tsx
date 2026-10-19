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

export default function AmsDepreciationByCategoryReportPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data: categories } = useQuery({
    queryKey: ['ams', 'categories', 'all'],
    queryFn: () => amsService.getCategories({ per_page: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'reports', 'depreciation-by-category', categoryId],
    queryFn: () => amsService.getDepreciationByCategoryReport(categoryId),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Depreciation by Category</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Current book value and accumulated depreciation, grouped by category</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => amsService.downloadReportCsv('depreciation-by-category', categoryId)}
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Assets</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase Price</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Book Value</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Accumulated Depreciation</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Excluded</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">No assets found.</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.category_id ?? 'uncategorized'} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{row.category_name ?? 'Uncategorized'}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-700">{row.asset_count}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-700">{Number(row.total_purchase_price).toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-700">{Number(row.total_book_value).toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-700">{Number(row.total_accumulated_depreciation).toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-right text-gray-400">{row.excluded_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {!isLoading && rows.length > 0 && data && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                    <tr>
                      <td className="py-3 px-6 text-sm text-gray-900">Total</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-900">{data.totals.asset_count}</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-900">{Number(data.totals.total_purchase_price).toLocaleString()}</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-900">{Number(data.totals.total_book_value).toLocaleString()}</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-900">{Number(data.totals.total_accumulated_depreciation).toLocaleString()}</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-900">{data.totals.excluded_count}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
