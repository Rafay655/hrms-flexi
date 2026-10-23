import { AppLoader } from '@/components/ui/app-loader';

export default function Loading() {
  return <AppLoader variant="page" label="Loading attendance…" description="Getting your punch status and history." />;
}
