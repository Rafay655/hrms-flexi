"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplyForm } from "../../_components/ApplyForm";

export default function NewLoanApplication() {
  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <Link href="/loan-hub/applications" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Applications
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">New Loan Application</h1>
        <p className="text-sm text-gray-500">Create an application on behalf of an employee.</p>
      </div>
      <ApplyForm />
    </div>
  );
}
