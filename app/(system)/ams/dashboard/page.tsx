'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { amsService } from '@/services/ams.service';
import type { AssetAlertItem } from '@/types/ams.types';

function AlertList({ title, count, items }: { title: string; count: number; items: AssetAlertItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <Badge variant={count > 0 ? 'default' : 'secondary'} className={count > 0 ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}>
          {count}
        </Badge>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.asset_uuid} className="text-sm">
              <Link href={`/ams/assets/${item.asset_uuid}`} className="text-blue-700 hover:underline">
                {item.name}
              </Link>
              <span className="text-gray-500"> — {item.metric}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AmsDashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['ams', 'dashboard', 'summary'],
    queryFn: () => amsService.getDashboardSummary(),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['ams', 'dashboard', 'alerts'],
    queryFn: () => amsService.getDashboardAlerts(),
  });

  const cards = [
    { label: 'Total Assets', value: summary?.total_assets ?? 0, color: 'text-gray-900' },
    { label: 'Assigned', value: summary?.assigned ?? 0, color: 'text-blue-700' },
    { label: 'Available', value: summary?.available ?? 0, color: 'text-green-700' },
    { label: 'In Repair', value: summary?.in_repair ?? 0, color: 'text-amber-700' },
    { label: 'Disposed', value: summary?.disposed ?? 0, color: 'text-gray-500' },
    { label: 'Total Value (PKR)', value: (summary?.total_asset_value ?? 0).toLocaleString(), color: 'text-[#1E1B4B]' },
    { label: 'Current Book Value (PKR)', value: (summary?.total_book_value ?? 0).toLocaleString(), color: 'text-[#1E1B4B]' },
  ];

  const excludedCount = summary?.assets_excluded_from_book_value ?? 0;

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Asset Management Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{c.label}</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${c.color}`}>{isLoading ? '—' : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && excludedCount > 0 && (
        <p className="text-sm text-gray-500 mt-3">
          {excludedCount} asset{excludedCount === 1 ? '' : 's'} excluded from book value (incomplete purchase data, invalid depreciation configuration, or a future purchase date).
        </p>
      )}

      <Card className="mt-6 border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {alertsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AlertList
                title="Warranty Expiring"
                count={alerts?.warranty_expiring.count ?? 0}
                items={alerts?.warranty_expiring.items ?? []}
              />
              <AlertList
                title="Aging Outliers"
                count={alerts?.aging_outliers.count ?? 0}
                items={alerts?.aging_outliers.items ?? []}
              />
              <AlertList
                title="Near End-of-Life"
                count={alerts?.near_end_of_life.count ?? 0}
                items={alerts?.near_end_of_life.items ?? []}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
