import { redirect } from "next/navigation";

// NotifyPro has no standalone landing page; the module's real screens live under
// /notify-pro/{inbox,preferences,announcements,log,admin}. Land on the Inbox.
export default function Page() {
  redirect("/notify-pro/inbox");
}
