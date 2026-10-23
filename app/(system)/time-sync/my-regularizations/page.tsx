'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Plus, Eye, Pencil, X, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, FileClock, MoreVertical, 
  RefreshCw, Search, Users, User, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SearchableSelect from '@/components/ui/searchable-select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { useAppSelector } from '@/store/hooks';
import { attendanceTimelineService } from '@/services/attendance-timeline.service';
import { 
  myRegularizationsService as service, 
  correctionOptions, 
  type MyRegularization, 
  type RegularizationPayload 
} from '@/services/my-regularizations.service';
import { attendanceDate, attendanceTime } from '@/lib/attendance-timeline';
import { companyDate } from '@/lib/web-punch';
import { showApiError } from '@/lib/error-toast';

const typeLabel = (value: string) => correctionOptions.find(option => option.value === value)?.label ?? value.replaceAll('_', ' ');
const statusTone = (status: string) => status === 'approved' ? 'bg-emerald-50 text-emerald-700' : status === 'rejected' ? 'bg-rose-50 text-rose-700' : status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-700';

// Helper to extract HH:mm from a datetime string
function extractTime(value: string | null | undefined) {
  if (!value) return '';
  const parts = value.split(' ');
  if (parts.length > 1) return parts[1].slice(0, 5);
  const tParts = value.split('T');
  if (tParts.length > 1) return tParts[1].slice(0, 5);
  return value.slice(0, 5);
}

export default function MyRegularizationsPage() {
  const company = useAppSelector(state => state.auth.company);
  const user = useAppSelector(state => state.auth.user?.id);
  return <Directory key={`${company?.id}-${user}`} company={company?.id} user={user} timeZone={company?.timezone || 'Asia/Karachi'} />;
}

function Directory({ company, user, timeZone }: { company?: string; user?: string; timeZone: string }) {
  const client = useQueryClient();
  
  // Tab State
  const [scope, setScope] = useState<'my' | 'team'>('my');
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [correction, setCorrection] = useState('');
  const [page, setPage] = useState(1);
  
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  
  const [perPage, setPerPage] = useState(10);
  const [editor, setEditor] = useState<MyRegularization | 'new' | null>(null);
  const [detail, setDetail] = useState<MyRegularization | null>(null);
  
  // Cancel State (My tab)
  const [cancel, setCancel] = useState<MyRegularization | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Reject State (Team tab)
  const [rejectRow, setRejectRow] = useState<MyRegularization | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Query
  const key = ['time-sync', 'regularizations', scope, company, user];
  const list = useQuery({ 
    queryKey: [...key, page, perPage, debouncedSearch, status, correction], 
    queryFn: ({ signal }) => service.list(page, perPage, signal, { 
      search: debouncedSearch || undefined, 
      status: status || undefined, 
      correction_type: correction || undefined,
      scope: scope
    }), 
    retry: false 
  });
  
  const profile = useQuery({ 
    queryKey: ['time-sync', 'my-timeline', company, user, 'today'], 
    queryFn: ({ signal }) => attendanceTimelineService.today(signal), 
    retry: false 
  });
  
  // Mutations
  const cancelMutation = useMutation({ 
    mutationFn: service.cancel, 
    retry: false, 
    onError: (error) => showApiError(error), 
    onSuccess: response => {
      toast.success(response.message); 
      setCancel(null); 
      setCancelReason('');
      if ((list.data?.data.length ?? 0) === 1 && page > 1) setPage(page - 1);
      void client.invalidateQueries({ queryKey: ['time-sync'] });
    } 
  });

  const approveMutation = useMutation({
    mutationFn: service.approve,
    retry: false,
    onError: (error) => showApiError(error),
    onSuccess: response => {
      toast.success(response.message || 'Request approved successfully.');
      void client.invalidateQueries({ queryKey: ['time-sync'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: service.reject,
    retry: false,
    onError: (error) => showApiError(error),
    onSuccess: response => {
      toast.success(response.message || 'Request rejected successfully.');
      setRejectRow(null);
      setRejectReason('');
      void client.invalidateQueries({ queryKey: ['time-sync'] });
    }
  });
  
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const pages = Math.max(1, meta?.last_page ?? 1);
  const first = rows.length ? (page - 1) * perPage + 1 : 0;
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(page - 2, pages - 4)) + index);
  const columnCount = scope === 'team' ? 8 : 7;

  return <div className="p-3">
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="border-b pb-0">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">Regularizations Directory</CardTitle>
            <p className="mt-1 text-sm text-gray-500">{(meta?.total ?? 0).toLocaleString()} requests • Real-time data</p>
          </div>
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Button variant="outline" size="sm" disabled={list.isFetching} onClick={() => void list.refetch()}>
              <RefreshCw className={`mr-2 h-4 w-4 ${list.isFetching ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={!profile.data?.data?.employee.uuid} onClick={() => setEditor('new')}>
              <Plus className="mr-2 h-4 w-4" />Create request
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 mt-4">
          <button
            onClick={() => { setScope('my'); setPage(1); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              scope === 'my' 
                ? 'border-[#1E1B4B] text-[#1E1B4B]' 
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4" />
            My Requests
          </button>
          <button
            onClick={() => { setScope('team'); setPage(1); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              scope === 'team' 
                ? 'border-[#1E1B4B] text-[#1E1B4B]' 
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Team Requests
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {profile.isError && <ApiErrorState error={profile.error} onRetry={() => void profile.refetch()} />}
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search regularizations" placeholder="Search regularizations…" value={search} onChange={event => setSearch(event.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <SearchableSelect aria-label="Requests per page" allowAll={false} widthClass="w-28" value={String(perPage)} options={[10, 25, 50, 100].map(size => ({ value: String(size), label: String(size) }))} onChange={value => { setPerPage(Number(value)); setPage(1); }} />
            <span>entries</span>
          </div>
          <div className="basis-full" />
          <SearchableSelect aria-label="Filter by status" allLabel="All statuses" value={status} onChange={value => { setStatus(value); setPage(1); }} options={['pending', 'approved', 'rejected', 'escalated'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} widthClass="w-full sm:w-56" />
          <SearchableSelect aria-label="Filter by correction type" allLabel="All correction types" value={correction} onChange={value => { setCorrection(value); setPage(1); }} options={correctionOptions} widthClass="w-full sm:w-56" />
          {(search || status || correction) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setDebouncedSearch(''); setStatus(''); setCorrection(''); setPage(1); }}>
              Clear filters
            </Button>
          )}
        </div>

        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">
          <span>Showing <strong className="text-gray-900">{first}</strong> to <strong className="text-gray-900">{rows.length ? first + rows.length - 1 : 0}</strong> of <strong className="text-gray-900">{(meta?.total ?? 0).toLocaleString()}</strong> entries</span>
          {list.isFetching && <AppLoader variant="inline" label="Loading…" />}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200" aria-busy={list.isFetching}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <caption className="sr-only">Attendance regularizations</caption>
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">SR. NO.</th>
                  {scope === 'team' && (
                    <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Employee</th>
                  )}
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Attendance date</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Correction</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Requested times</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Reason</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {list.isPending ? (
                  <tr><td colSpan={columnCount} className="py-12"><AppLoader label="Loading regularizations…" /></td></tr>
                ) : list.isError ? (
                  <tr><td colSpan={columnCount} className="px-6 py-12"><ApiErrorState error={list.error} onRetry={() => void list.refetch()} /></td></tr>
                ) : !rows.length ? (
                  <tr>
                    <td colSpan={columnCount} className="py-12 text-center">
                      <FileClock className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 font-medium">No requests found</p>
                      <p className="text-sm text-muted-foreground">{search || status || correction ? 'Try another search or clear your filters.' : 'No regularization requests to show.'}</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const isPending = row.status === 'pending';

                    return (
                      <tr key={row.id} className="group text-sm transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-muted-foreground">{first + index}</td>
                        
                        {scope === 'team' && (
                          <td className="px-6 py-4 align-top">
                            <p className="font-semibold text-gray-900">{row.employee?.name ?? 'Unknown'}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.employee?.employee_code ?? ''}</p>
                          </td>
                        )}

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{attendanceDate(row.attendance_date, 'short')}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.attendance_date.slice(0, 4)}</p>
                        </td>
                        <td className="px-6 py-4 align-top">{typeLabel(row.correction_type)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm tabular-nums text-muted-foreground">
                          <p>In: {attendanceTime(row.requested_in, timeZone)}</p>
                          <p className="mt-1">Out: {attendanceTime(row.requested_out, timeZone)}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="line-clamp-2 max-w-[240px] break-words text-muted-foreground" title={row.reason}>{row.reason}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusTone(row.status)}`}>
                            {row.status.replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.attendance_date}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onSelect={() => setDetail(row)}>
                                <Eye className="mr-2 h-4 w-4" />View details
                              </DropdownMenuItem>
                              
                              {/* "My" tab actions (Edit / Cancel) */}
                              {isPending && scope === 'my' && (
                                <>
                                  <DropdownMenuItem onSelect={() => setEditor(row)}>
                                    <Pencil className="mr-2 h-4 w-4" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => { setCancel(row); setCancelReason(''); }}>
                                    <X className="mr-2 h-4 w-4" />Cancel request
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* "Team" tab actions (Approve / Reject) */}
                              {isPending && scope === 'team' && (
                                <>
                                  <DropdownMenuItem onSelect={() => approveMutation.mutate(row.id)} disabled={approveMutation.isPending}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => { setRejectRow(row); setRejectReason(''); }}>
                                    <XCircle className="mr-2 h-4 w-4" />Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 md:flex-row">
          <span>Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{pages}</strong></span>
          <nav aria-label="Regularization pagination" className="flex flex-wrap items-center justify-center gap-2">
            {[{ label: 'First page', target: 1, icon: ChevronsLeft }, { label: 'Previous page', target: page - 1, icon: ChevronLeft }].map(item => (
              <Button key={item.label} variant="outline" size="sm" aria-label={item.label} disabled={!meta || list.isFetching || page <= 1} onClick={() => setPage(item.target)}>
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
            {numbers.map(number => (
              <Button key={number} size="sm" variant={number === page ? 'default' : 'outline'} className={`${number === page ? 'border-[#1E1B4B] bg-[#1E1B4B] text-white hover:bg-[#2A2675] hover:text-white' : ''}`} aria-current={number === page ? 'page' : undefined} disabled={!meta || list.isFetching} onClick={() => setPage(number)}>
                {number}
              </Button>
            ))}
            {[{ label: 'Next page', target: page + 1, icon: ChevronRight }, { label: 'Last page', target: pages, icon: ChevronsRight }].map(item => (
              <Button key={item.label} variant="outline" size="sm" aria-label={item.label} disabled={!meta || list.isFetching || page >= pages} onClick={() => setPage(item.target)}>
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </nav>
          <span>{first} – {rows.length ? first + rows.length - 1 : 0} of {(meta?.total ?? 0).toLocaleString()} entries</span>
        </footer>
      </CardContent>
    </Card>

    {/* Editor Modal (My Tab) */}
    {editor && (
      <RequestEditor 
        key={typeof editor === 'string' ? 'new' : editor.id} 
        row={editor === 'new' ? null : editor} 
        employeeId={profile.data?.data?.employee.uuid ?? ''} 
        timeZone={timeZone} 
        onClose={() => setEditor(null)} 
        onSaved={() => { setEditor(null); void client.invalidateQueries({ queryKey: ['time-sync'] }); }} 
      />
    )}

    {/* Detail Modal */}
    <Dialog open={Boolean(detail)} onOpenChange={open => { if (!open) setDetail(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-brand-900">Request details</DialogTitle>
          <DialogDescription>{detail ? attendanceDate(detail.attendance_date) : ''}</DialogDescription>
        </DialogHeader>
        {detail && (
          <div className="space-y-4 text-sm">
            {scope === 'team' && detail.employee && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-600 mb-1">Employee</p>
                <p className="font-semibold text-blue-900">{detail.employee.name}</p>
                <p className="text-xs text-blue-700">{detail.employee.employee_code}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span>{typeLabel(detail.correction_type)}</span>
              <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusTone(detail.status)}`}>{detail.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
              <div><p className="text-xs text-gray-500">Requested in</p><p className="mt-1">{detail.requested_in || '—'}</p></div>
              <div><p className="text-xs text-gray-500">Requested out</p><p className="mt-1">{detail.requested_out || '—'}</p></div>
            </div>
            <div><p className="mb-1 text-xs text-gray-500">Reason</p><p className="whitespace-pre-wrap break-words">{detail.reason}</p></div>
            {detail.supporting_doc_path && <div><p className="text-xs text-gray-500">Supporting document path</p><p className="mt-1 break-all">{detail.supporting_doc_path}</p></div>}
            {detail.decided_by_user && <p>Decision by {detail.decided_by_user.name}{detail.decided_at ? ` · ${detail.decided_at}` : ''}</p>}
            {detail.rejection_reason && <p className="rounded-lg bg-rose-50 p-3 text-rose-800">{detail.rejection_reason}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Cancel Modal (My Tab) */}
    <Dialog open={Boolean(cancel)} onOpenChange={open => { if (!open && !cancelMutation.isPending) setCancel(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel request?</DialogTitle>
          <DialogDescription>This will remove your pending correction request for {cancel?.attendance_date}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Cancellation reason (optional)</Label>
          <Textarea id="cancel-reason" maxLength={2000} value={cancelReason} onChange={event => setCancelReason(event.target.value)} disabled={cancelMutation.isPending} />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={cancelMutation.isPending} onClick={() => setCancel(null)}>Keep request</Button>
          <Button className="bg-rose-600 text-white hover:bg-rose-700" disabled={cancelMutation.isPending} onClick={() => cancel && cancelMutation.mutate({ id: cancel.id, reason: cancelReason })}>
            {cancelMutation.isPending ? <AppLoader variant="inline" label="Cancelling…" /> : 'Cancel request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Reject Modal (Team Tab) */}
    <Dialog open={Boolean(rejectRow)} onOpenChange={open => { if (!open && !rejectMutation.isPending) setRejectRow(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject request?</DialogTitle>
          <DialogDescription>This will reject the correction request for {rejectRow?.attendance_date}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Rejection reason <span className="text-red-500">*</span></Label>
          <Textarea 
            id="reject-reason" 
            required 
            maxLength={2000} 
            value={rejectReason} 
            onChange={event => setRejectReason(event.target.value)} 
            disabled={rejectMutation.isPending} 
            placeholder="Explain why this request is being rejected..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={rejectMutation.isPending} onClick={() => setRejectRow(null)}>Cancel</Button>
          <Button 
            className="bg-rose-600 text-white hover:bg-rose-700" 
            disabled={rejectMutation.isPending || !rejectReason.trim()} 
            onClick={() => rejectRow && rejectMutation.mutate({ id: rejectRow.id, reason: rejectReason })}
          >
            {rejectMutation.isPending ? <AppLoader variant="inline" label="Rejecting…" /> : 'Reject request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function RequestEditor({ row, employeeId, timeZone, onClose, onSaved }: { row: MyRegularization | null; employeeId: string; timeZone: string; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(row?.attendance_date.slice(0, 10) ?? companyDate(timeZone));
  const [type, setType] = useState(row?.correction_type ?? 'add_in');
  
  const [requestedIn, setIn] = useState(extractTime(row?.requested_in));
  const [requestedOut, setOut] = useState(extractTime(row?.requested_out));
  
  const [reason, setReason] = useState(row?.reason ?? '');
  const [path, setPath] = useState(row?.supporting_doc_path ?? '');

  const needsIn = ['add_in', 'modify_in', 'full_replacement'].includes(type);
  const needsOut = ['add_out', 'modify_out', 'full_replacement'].includes(type);

  // Fetch the day snapshot when the date changes
  const { data: dayData, isLoading: isLoadingDay } = useQuery({
    queryKey: ['time-sync', 'attendance-day', date],
    queryFn: ({ signal }) => service.getAttendanceDay(date, signal),
    enabled: !!date,
  });

  const snapshot = dayData?.data;
  
  const mutation = useMutation({ 
    mutationFn: service.save, 
    retry: false, 
    onError: (error) => showApiError(error), 
    onSuccess: response => { toast.success(response.message); onSaved(); } 
  });
  
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = row?.employee_id || employeeId;
    if (!id) { toast.error('Your employee profile is unavailable. Refresh and try again.'); return; }
    if (!reason.trim()) { toast.error('Please enter a reason.'); return; }
    
    // Validation: Compare HH:mm strings (e.g. "09:00" < "18:00")
    if (needsIn && needsOut && requestedOut < requestedIn) { 
      toast.error('Clock-out must be on or after clock-in.'); 
      return; 
    }
    
    // Helper to format time back to SQL datetime (YYYY-MM-DD HH:mm:ss)
    const sql = (timeValue: string) => {
      if (!timeValue) return null;
      const timeStr = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
      return `${date} ${timeStr}`;
    };

    const payload: RegularizationPayload = { 
      employee_id: id, 
      attendance_date: date, 
      correction_type: type, 
      requested_in: needsIn ? sql(requestedIn) : null, 
      requested_out: needsOut ? sql(requestedOut) : null, 
      reason: reason.trim(), 
      supporting_doc_path: path.trim() || null 
    };
    mutation.mutate({ id: row?.id, payload });
  }
  
  return (
    <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-5 pr-14 text-left">
          <DialogTitle className="text-brand-900">{row ? 'Edit regularization' : 'New regularization'}</DialogTitle>
          <DialogDescription>Request a correction to attendance.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={mutation.isPending} className="space-y-4 px-6 py-5">
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="request-date">Attendance date</Label>
                <Input id="request-date" type="date" required value={date} onChange={event => setDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="request-type">Correction type</Label>
                <select id="request-type" className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm" value={type} onChange={event => setType(event.target.value)}>
                  {correctionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            {/* System Snapshot Info */}
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">System Record for {date}</p>
              {isLoadingDay ? (
                <p className="text-blue-600">Loading system times…</p>
              ) : snapshot?.found ? (
                <div className="flex gap-4">
                  <p><span className="text-blue-600">Clock In:</span> {extractTime(snapshot.first_in) || '—'}</p>
                  <p><span className="text-blue-600">Clock Out:</span> {extractTime(snapshot.last_out) || '—'}</p>
                </div>
              ) : (
                <p className="text-blue-600">No system record found for this date.</p>
              )}
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {needsIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="requested-in">Requested clock-in</Label>
                  <Input id="requested-in" type="time" required value={requestedIn} onChange={event => setIn(event.target.value)} />
                </div>
              )}
              {needsOut && (
                <div className="space-y-1.5">
                  <Label htmlFor="requested-out">Requested clock-out</Label>
                  <Input id="requested-out" type="time" required min={needsIn ? requestedIn : undefined} value={requestedOut} onChange={event => setOut(event.target.value)} />
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-gray-500">Times are entered in {timeZone}. The date from above will be applied automatically.</p>
            
            <div className="space-y-1.5">
              <Label htmlFor="request-reason">Reason</Label>
              <Textarea id="request-reason" required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain the attendance correction…" />
              <p className="text-right text-[10px] text-gray-400">{reason.length}/2000</p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="request-document">Supporting document path (optional)</Label>
              <Input id="request-document" maxLength={500} value={path} onChange={event => setPath(event.target.value)} placeholder="Path of an already uploaded document" />
            </div>
          </fieldset>
          
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-[#1E1B4B] text-white hover:bg-[#2A2675]">
              {mutation.isPending ? <AppLoader variant="inline" label="Saving…" /> : row ? 'Save changes' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}