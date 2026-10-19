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

export default function AmsWarrantyExpiryReportPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data: categories } = useQuery({
    queryKey: ['ams', 'categories', 'all'],
    queryFn: () => amsService.getCategories({ per_page: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'reports', 'warranty-expiry', categoryId],
    queryFn: () => amsService.getWarrantyExpiryReport(categoryId),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Warranty Expiry</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Every asset with a warranty on file, soonest first</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => amsService.downloadReportCsv('warranty-expiry', categoryId)}
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Warranty Expiry</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Days Remaining</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">No warranties on file.</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.asset_uuid} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm font-mono text-gray-700">{row.asset_tag}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{row.name}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{row.category_name ?? '—'}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{row.warranty_expiry}</td>
                        <td className={`py-4 px-6 text-sm text-right font-medium ${row.days_remaining < 0 ? 'text-red-600' : row.days_remaining <= 30 ? 'text-amber-700' : 'text-gray-900'}`}>
                          {row.days_remaining}
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
