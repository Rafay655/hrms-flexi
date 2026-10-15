import { redirect } from "next/navigation";

// SystemFlex has no standalone landing page; the module's real screens live
// under /system-flex/{health,backup,settings,notify-hub}. Land on System Health
// (broadly viewable — unlike /backup, which is super_admin-gated).
export default function Page() {
  redirect("/system-flex/health");
}
