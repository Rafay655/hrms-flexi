"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Stepper } from "@/components/payroll-run-stepper/Stepper";
import type { StepConfig } from "@/types/stepper";

import Step1SelectPeriod from "@/components/payroll-run-stepper/Step1SelectPeriod";
import Step3Validation from "@/components/payroll-run-stepper/Step3SalaryComputation";
import Step4Review from "@/components/payroll-run-stepper/Step4ExceptionReview";
import Step5TaxCompliance from "@/components/payroll-run-stepper/Step5TaxCompliance";
import Step6BankDisbursement from "@/components/payroll-run-stepper/Step6BankDisbursement";
import Step7ApproveLock from "@/components/payroll-run-stepper/Step7ApproveLock";
import Step2Ingest from "@/components/payroll-run-stepper/Step2Attendance";

export default function RunPayrollStepper() {
  const searchParams = useSearchParams();
  const urlWorkflowUuid = searchParams.get("workflowUuid") ?? undefined;

  const [workflowUuid, setWorkflowUuid] = useState<string | undefined>(urlWorkflowUuid);

  // Keep the state in sync if the URL changes (e.g., user manually edits the URL)
  useEffect(() => {
    setWorkflowUuid(urlWorkflowUuid);
  }, [urlWorkflowUuid]);

  const steps: StepConfig[] = [
    {
      id: 1,
      title: "Select Period",
      description: "Choose the payroll period, run type, and target groups.",
      component: Step1SelectPeriod,
      props: {
        workflowUuid,
        onWorkflowCreated: setWorkflowUuid,
      },
    },
  {
  id: 2,
  title: "Sync Modules",
  description: "Sync attendance, leave, loans, and expenses before computation.",
  component: Step2Ingest,
  props: { workflowUuid },
},
{
  id: 3,
  title: "Validation",
  description: "Run pre‑processing validations and review errors/warnings.",
  component: Step3Validation,
  props: { workflowUuid },
},
    {
      id: 4,
      title: "Exceptions",
      description: "Review and resolve exceptions.",
      component: Step4Review,
      props: { workflowUuid },
    },
    {
      id: 5,
      title: "Approve",
      description: "Verify and approve payroll.",
      component: Step5TaxCompliance,
      props: { workflowUuid },
    },
    {
      id: 6,
      title: "Finalize",
      description: "Finalize disbursement.",
      component: Step6BankDisbursement,
      props: { workflowUuid },
    },
    {
      id: 7,
      title: "Disburse & Lock",
      description: "Disburse funds and lock the payroll run.",
      component: Step7ApproveLock,
      props: { workflowUuid },
    },
  ];

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete all 7 steps to process and lock this payroll run.
          </p>
        </div>
        <Stepper
          steps={steps}
          onComplete={() => console.log("Payroll run locked and finalized")}
        />
      </div>
    </div>
  );
}