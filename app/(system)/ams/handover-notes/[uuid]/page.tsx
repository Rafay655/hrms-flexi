'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignaturePad } from '@/components/ams/SignaturePad';
import { amsService } from '@/services/ams.service';
import { useAppSelector } from '@/store/hooks';

export default function HandoverNoteDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();

  // Adaptation (disclosed): the HandoverNoteResource does not expose which employee
  // the note belongs to, so the frontend cannot tell whether the current viewer is
  // the assigned employee — the employee-signature panel is shown to any viewer per
  // the brief, and the backend's HandoverNotePolicy::sign() (requires
  // note.employee.user_id === current user + ams.handovernote.sign) is the real
  // gate; a mismatched signer gets a toasted 403. The HR countersign button, however,
  // CAN be soft-gated client-side: HandoverNotePolicy::hrSign() requires the
  // 'ams.assignment.manage' permission, which is already available in Redux auth
  // state and already used this same way elsewhere in the app (e.g.
  // frontend/app/(system)/flexi-import/new/page.tsx). Hiding the button for users who
  // lack that permission avoids showing a control that would always 403, with no
  // security implication either way since the backend enforces it regardless.
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canHrSign = permissions.includes('ams.assignment.manage');

  const { data: note, isLoading } = useQuery({
    queryKey: ['ams', 'handover-notes', uuid],
    queryFn: () => amsService.getHandoverNote(uuid),
  });

  const signMutation = useMutation({
    mutationFn: (signature: string) => amsService.signHandoverNote(uuid, signature),
    onSuccess: () => {
      toast.success('Signature recorded.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'handover-notes', uuid] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not save signature.'),
  });

  const hrSignMutation = useMutation({
    mutationFn: () => amsService.hrSignHandoverNote(uuid),
    onSuccess: () => {
      toast.success('Countersigned as HR/Admin.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'handover-notes', uuid] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not countersign.'),
  });

  // The PDF route requires auth:sanctum, so it must go through the authenticated
  // axios instance (blob fetch + client-side save) rather than a plain <a href> —
  // see amsService.downloadHandoverNotePdf.
  const downloadPdfMutation = useMutation({
    mutationFn: () => amsService.downloadHandoverNotePdf(uuid),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not download PDF.'),
  });

  if (isLoading || !note) {
    return <div className="p-6 text-center text-gray-500">Loading handover note...</div>;
  }

  return (
    <div className="p-3 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="capitalize">{note.note_type} Handover Note</CardTitle>
          <Badge className={note.is_acknowledged ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
            {note.is_acknowledged ? 'Acknowledged' : 'Pending signature'}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="text-sm text-gray-600">{note.asset_ids.length} asset(s) covered by this note, dated {note.note_date}.</p>

          {note.is_acknowledged && note.pdf_path && (
            <button
              type="button"
              onClick={() => downloadPdfMutation.mutate()}
              disabled={downloadPdfMutation.isPending}
              className="text-[#1E1B4B] underline text-sm text-left w-fit disabled:opacity-50"
            >
              {downloadPdfMutation.isPending ? 'Downloading...' : 'Download signed PDF'}
            </button>
          )}

          {!note.employee_signed_at && (
            <div>
              <p className="text-sm font-medium mb-2">Employee Signature</p>
              <SignaturePad onSave={(dataUrl) => signMutation.mutate(dataUrl)} disabled={signMutation.isPending} />
            </div>
          )}
          {note.employee_signed_at && <p className="text-sm text-green-700">✓ Employee signed on {new Date(note.employee_signed_at).toLocaleString()}</p>}

          {!note.hr_signed_at && canHrSign && (
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] w-fit"
              disabled={hrSignMutation.isPending}
              onClick={() => hrSignMutation.mutate()}
            >
              {hrSignMutation.isPending ? 'Signing...' : 'Countersign as HR/Admin'}
            </Button>
          )}
          {note.hr_signed_at && <p className="text-sm text-green-700">✓ HR/Admin signed on {new Date(note.hr_signed_at).toLocaleString()}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
