import { redirect } from 'next/navigation';

export default function LegacyPolicyFormPage() {
  redirect('/time-sync/attendance-policies');
}
