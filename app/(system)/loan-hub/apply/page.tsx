"use client";

/**
 * ESS — Apply for a loan / advance (self-service). Reuses the shared ApplyForm.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplyForm } from "../_components/ApplyForm";

export default function EssApply() {
  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <Link href="/loan-hub/my-loans" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> My Loans
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Apply for a Loan or Advance</h1>
        <p className="text-sm text-gray-500">Check your eligibility and submit an application.</p>
      </div>
      <ApplyForm />
    </div>
  );
}
