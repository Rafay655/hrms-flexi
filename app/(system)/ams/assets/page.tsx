'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { amsService } from '@/services/ams.service';
import type { AmsAssetStatus } from '@/types/ams.types';

const STATUS_COLORS: Record<AmsAssetStatus, string> = {
  available: 'bg-green-100 text-green-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_repair: 'bg-amber-100 text-amber-800',
  disposed: 'bg-gray-100 text-gray-600',
  lost: 'bg-red-100 text-red-800',
};

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AssetRegisterPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'assets', { search: debouncedSearch, status, page }],
    queryFn: () => amsService.getAssets({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      page,
      per_page: 15,
    }),
  });

  const assets = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Asset Register</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{meta?.total ?? 0} assets tracked</p>
            </div>
            <Button className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2" onClick={() => router.push('/ams/assets/new')}>
              <Plus className="h-4 w-4" /> Register Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by tag, name, or serial number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Asset Tag</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Serial #</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Assigned To</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading assets...</td></tr>
                ) : assets.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">No assets found.</td></tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.uuid}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/ams/assets/${asset.uuid}`)}
                    >
                      <td className="py-4 px-6 text-sm font-mono font-medium text-[#1E1B4B]">{asset.asset_tag}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{asset.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{asset.category?.name ?? '—'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{asset.serial_number ?? '—'}</td>
                      <td className="py-4 px-6 text-sm">
                        <Badge className={STATUS_COLORS[asset.status]}>{asset.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{asset.current_assignment?.employee_name ?? '—'}</td>
                    </tr>
                  ))
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
