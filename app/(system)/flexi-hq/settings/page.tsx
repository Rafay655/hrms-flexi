import SettingsPage from "@/components/settings-page";
import { Suspense } from "react";
export default function Page() {
  return  <Suspense fallback={<div className="p-6 text-sm">Loading settings…</div>}>
      <SettingsPage />
    </Suspense>;
}