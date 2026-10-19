'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { amsService } from '@/services/ams.service';

export default function HandoverNotesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'handover-notes', page],
    queryFn: () => amsService.getHandoverNotes({ page, per_page: 15 }),
  });

  const notes = data?.data ?? [];
  const meta = data?.meta;
  const currentPage = meta?.current_page ?? 1;
  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="p-3">
      <Card>
        <CardHeader><CardTitle className="text-2xl">Handover Notes</CardTitle></CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Assets</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-500">Loading...</td></tr>
                ) : notes.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-500">No handover notes yet.</td></tr>
                ) : (
                  notes.map((n) => (
                    <tr key={n.uuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/ams/handover-notes/${n.uuid}`)}>
                      <td className="py-4 px-6 text-sm capitalize">{n.note_type}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{n.note_date}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{n.asset_ids.length} asset(s)</td>
                      <td className="py-4 px-6 text-sm">
                        <Badge className={n.is_acknowledged ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                          {n.is_acknowledged ? 'Acknowledged' : 'Pending signature'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && notes.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 mt-0">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1} className="border-gray-300">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="border-gray-300">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="border-gray-300">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="border-gray-300">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
