import { redirect } from "next/navigation";

/**
 * Insight360 had two competing front doors: this redirect sent users to the
 * Dashboard, while /overview was the page actually built as the hub — it opens
 * with "Start Here" cards pointing at Reports, Dashboard and My Reports, plus a
 * quick find and recent activity. Landing on the Dashboard made those cards
 * unreachable-by-default and gave the module two search experiences over the
 * same report set.
 *
 * Overview is now the landing page and the Dashboard is one destination from
 * it. Dashboard additionally requires insight360.dashboard.view, which not
 * every Insight360 user holds — so it was also the wrong default for them.
 */
export default function Insight360Page() {
  redirect("/insight360/overview");
}
