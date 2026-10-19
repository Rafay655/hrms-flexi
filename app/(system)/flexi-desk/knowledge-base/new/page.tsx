"use client";

import React from "react";
import Link from "next/link";
import { KbEditor } from "@/components/flexi-desk/KbEditor";

export default function NewKbArticlePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/flexi-desk/knowledge-base" className="text-sm text-gray-500 hover:underline">← Knowledge base</Link>
      <h1 className="text-2xl font-semibold text-gray-900">New article</h1>
      <p className="text-sm text-gray-500">It is saved as a draft. Employees only see it after you publish it.</p>
      <div className="rounded-lg border border-gray-200 bg-white p-5"><KbEditor /></div>
    </div>
  );
}
