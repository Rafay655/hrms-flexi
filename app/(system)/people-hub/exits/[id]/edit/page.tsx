// app/people-hub/exits/[id]/edit/page.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Loader2 } from "lucide-react";
import ExitCaseForm from "@/components/ExitCaseForm";   // <-- correct import
import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Local helpers for mapping API response → form values                       */
/* -------------------------------------------------------------------------- */

function toTitleCase(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function mapApiStatusToStage(status?: string | null) {
  switch (status) {
    case "initiated":
    case "notice_period":
      return "Notice Period";
    case "clearance_in_progress":
      return "Clearance";
    case "completed":
      return "Completed";
    default:
      return "Notice Period";
  }
}

function mapClearanceStatus(percentage: number) {
  if (percentage >= 100) return "Completed";
  if (percentage > 0) return "In Progress";
  return "Not Started";
}

function mapFnFStatus(status?: string | null) {
  return status === "completed" ? "Paid" : "Pending";
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

const EditExitPage = () => {
  const params = useParams();
  const exitId = params.id as string;

  const [initialValues, setInitialValues] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExit = async () => {
      try {
        const res = await api.get(`people-hub/exits/${exitId}`);
        const exit = res.data.data; // ApiExitItem shape

        const mapped = {
          employee_id: exit.employee?.uuid || exit.employee?.id || "",
          employee_name: exit.employee?.name || "",
          employee_code: exit.employee?.employee_code || "",
          designation: exit.employee?.designation?.name || "-",
          department: exit.employee?.department?.name || "-",
          location: exit.employee?.location?.name || "-",
          manager: exit.employee?.manager
            ? `${exit.employee.manager.name} (${exit.employee.manager.employee_code})`
            : "-",
          exit_type: toTitleCase(exit.exit_type) || "Resignation",
          exit_initiated_by: toTitleCase(exit.initiated_by) || "Employee",
          exit_reason_primary: toTitleCase(exit.exit_reason) || "Better Opportunity",
          resignation_date: exit.resignation_date || "",
          last_working_date: exit.last_working_date || "",
          notice_period_days: exit.notice_period_days ?? 0,
          notice_period_waived: exit.notice_period_waived ?? false,
          notice_waiver_reason: exit.notice_waiver_reason || "",
          process_stage: mapApiStatusToStage(exit.status),
          clearance_status: mapClearanceStatus(exit.clearance_percentage || 0),
          clearance_progress: exit.clearance_percentage || 0,
          fnf_status: mapFnFStatus(exit.status),
          fnf_progress: exit.status === "completed" ? 100 : 0,
          rehire_eligible: exit.rehire_eligible ?? true,
          blacklist_flag: exit.blacklisted ?? false,
          blacklist_reason: exit.blacklist_reason || "",
          experience_letter_issued: false,
          exit_interview_conducted: exit.exit_interview_scheduled ?? false,
          notes: exit.exit_reason_detail || "",
        };

        setInitialValues(mapped);
      } catch (error: any) {
        console.error(error);
        showApiError(error, { ...({
          description: error?.response?.data?.message || "Could not fetch exit data.",
        }), fallbackMessage: "Failed to load exit details" });
      } finally {
        setLoading(false);
      }
    };

    fetchExit();
  }, [exitId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-800" />
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="flex items-center justify-center min-h-screen text-brand-700">
        Exit record not found.
      </div>
    );
  }

  return (
    <ExitCaseForm
      mode="edit"
      exitId={exitId}
      initialValues={initialValues}
    />
  );
};

export default EditExitPage;