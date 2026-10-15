"use client";

import { showApiError } from "@/lib/error-toast";
import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expenseHubService } from "@/services/expense-hub";
import { pkr } from "@/lib/expense-hub";

export default function TravelDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  // Unwrap the Axios response to get the actual TravelRequest
  const { data: t, isLoading } = useQuery({
    queryKey: ["expense-hub", "travel", uuid],
    queryFn: () => expenseHubService.getTravelRequest(uuid).then((res) => res.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["expense-hub", "travel", uuid] });

  // Only cancel is supported (approve/reject are not in the service)
  const cancelMutation = useMutation({
    mutationFn: () => expenseHubService.cancelTravel(uuid),
    onSuccess: () => {
      toast.success("Cancelled.");
      refresh();
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Cancellation failed." }),
  });

  if (isLoading || !t) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <Link href="/expense-hub/travel" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to travel
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
            {t.request_number ?? "Travel request"}
          </h1>
          <p className="text-sm text-gray-500">
            {t.purpose} · {t.destination_city ?? t.destination_country} · {t.trip_type}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-sm font-medium capitalize text-brand-700">
          {t.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Dates", `${t.start_date} → ${t.end_date}`],
          ["Estimated", pkr(t.estimated_amount)],
          ["Per-diem est.", pkr(t.per_diem_estimate)],
          ["Advance", pkr(t.advance_amount)],
        ].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-brand-900">{val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Approve / Reject buttons removed because they aren't in the service */}
        {(t.status === "draft" ||
          t.status === "submitted" ||
          t.status === "under_review" ||
          t.status === "approved") && (
          <Button
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Cancel request
          </Button>
        )}
      </div>

      {t.rejection_reason && (
        <p className="max-w-xl rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          Rejected: {t.rejection_reason}
        </p>
      )}
    </div>
  );
}