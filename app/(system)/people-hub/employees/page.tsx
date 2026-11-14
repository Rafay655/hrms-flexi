"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Download, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { api } from '@/lib/api';
import { showApiError } from '@/lib/error-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { Frame, Table, SearchBox, EntryCount, Count, Pager, cell, primary, Modal, usePagination } from '@/components/shared/directory-ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { mapEmployeeToRow, getInitials, formatDate, getStatusConfig, STATUS_CONFIG, type ApiOnboardingEmployee, type EmployeeRow } from '@/lib/employee-directory';

export default function EmployeeListing() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useEmployees<ApiOnboardingEmployee>({ per_page: 1000, detailed: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [viewing, setViewing] = useState<EmployeeRow | null>(null);
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null);
  const employees = useMemo(() => (query.data ?? []).map((row, index) => mapEmployeeToRow(row, index + 1)), [query.data]);
  const term = search.trim().toLowerCase();
  const filtered = employees.filter(row => (!status || row.status.toLowerCase() === status) && (!mode || row.form_mode === mode) && (!term || [row.name, row.emp_code, row.email, row.phone, row.department, row.designation, row.manager].join(' ').toLowerCase().includes(term)));
  const pagination = usePagination(filtered, 10);
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/people-hub/onboarding/${id}`),
    onSuccess: () => { toast.success('Employee draft deleted'); setDeleting(null); void client.invalidateQueries({ queryKey: ['employees'] }); },
    onError: (error: unknown) => showApiError(error),
  });
  function exportCSV() {
    const lines = [['Employee', 'Employee Code', 'Department', 'Designation', 'Email', 'Phone', 'Joining Date', 'Status', 'Mode'], ...filtered.map(row => [row.name, row.emp_code, row.department, row.designation, row.email, row.phone, row.join_date ?? '', row.status, row.form_mode])];
    const csv = lines.map(row => row.map(value => `"${String(value).replace(/^[=+@\t\r-]/, "'$&").replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'employees.csv'; link.click(); URL.revokeObjectURL(url);
  }
  return <Frame title="Employee Directory" description={`${employees.length.toLocaleString()} employees • Real-time data`} actions={<>
    <Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
    <Button variant="outline" size="sm" disabled={!filtered.length} onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export</Button>
    <Button size="sm" className={primary} onClick={() => router.push('/people-hub/onboarding')}><Plus className="mr-2 h-4 w-4" />Add employee</Button>
  </>}>
    <div className="flex flex-wrap items-center gap-3">
      <SearchBox value={search} onChange={value => { setSearch(value); pagination.setPage(1); }} placeholder="Search employees, codes, email or department…" />
      <EntryCount state={pagination} /><div className="basis-full" />
      <SearchableSelect aria-label="Employee status filter" widthClass="w-full sm:w-56" value={status} allLabel="All statuses" options={Object.entries(STATUS_CONFIG).map(([value, item]) => ({ value, label: item.label }))} onChange={value => { setStatus(value); pagination.setPage(1); }} />
      <SearchableSelect aria-label="Onboarding mode filter" widthClass="w-full sm:w-56" value={mode} allLabel="All modes" options={[{ value: 'quick', label: 'Quick' }, { value: 'detailed', label: 'Detailed' }]} onChange={value => { setMode(value); pagination.setPage(1); }} />
      {(search || status || mode) && <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setStatus(''); setMode(''); pagination.setPage(1); }}>Clear filters</Button>}
    </div>
    <Count state={pagination} />
    {query.isPending ? <AppLoader label="Loading employees…" /> : query.isError ? <ApiErrorState error={query.error} onRetry={() => void query.refetch()} /> : <>
      <Table headers={['SR. NO.', 'Employee', 'Department / designation', 'Contact', 'Joining date', 'Status', 'Actions']} empty={!pagination.rows.length}>
        {pagination.rows.map((row, index) => { const badge = getStatusConfig(row.status); return <tr key={row.id} className="transition-colors hover:bg-gray-50">
          <td className={cell}>{pagination.first + index}</td>
          <td className={cell}><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-900">{getInitials(row.name)}</span><div><p className="font-medium text-gray-900">{row.name}</p><p className="mt-1 text-xs text-gray-400">{row.emp_code} · <span className="capitalize">{row.form_mode}</span></p></div></div></td>
          <td className={cell}><p>{row.department}</p><p className="mt-1 text-xs text-gray-400">{row.designation}</p></td>
          <td className={cell}><p>{row.email}</p><p className="mt-1 text-xs text-gray-400">{row.phone}</p></td>
          <td className={cell + ' whitespace-nowrap'}>{formatDate(row.join_date)}</td>
          <td className={cell}><Badge variant="outline" className={badge.classes}>{badge.label}</Badge></td>
          <td className={cell + ' text-right'}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewing(row)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/people-hub/onboarding/${row.id}`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => { remove.reset(); setDeleting(row); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu></td>
        </tr>; })}
      </Table><Pager state={pagination} />
    </>}
    {viewing && <Modal title="Employee details" description={viewing.name} onClose={() => setViewing(null)} footer={<><Button variant="outline" onClick={() => setViewing(null)}>Close</Button><Button className={primary} onClick={() => router.push(`/people-hub/onboarding/${viewing.id}`)}>Edit employee</Button></>}><dl className="grid gap-5 sm:grid-cols-2">{[['Employee code', viewing.emp_code], ['Department', viewing.department], ['Designation', viewing.designation], ['Reporting manager', viewing.manager], ['Email', viewing.email], ['Phone', viewing.phone], ['Employment type', viewing.employment_type], ['Work mode', viewing.work_mode], ['Joining date', formatDate(viewing.join_date)], ['Status', viewing.status]].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-900">{value}</dd></div>)}</dl></Modal>}
    {deleting && <Modal title="Delete employee draft" description={deleting.name} busy={remove.isPending} onClose={() => setDeleting(null)} footer={<><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>Cancel</Button><Button className="bg-red-600 text-white hover:bg-red-700" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>{remove.isPending ? 'Deleting…' : 'Delete'}</Button></>}><p className="text-sm text-gray-600">Delete this employee onboarding record? This cannot be undone.</p>{!!remove.error && <ApiErrorState error={remove.error} />}</Modal>}
  </Frame>;
}
