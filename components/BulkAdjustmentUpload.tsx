import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Database,
  Download,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";

interface BulkAdjustmentUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface PreviewRow {
  rowNo: number;
  empId: string;
  empName: string;
  type: string;
  amount: number;
  period: string;
  reason: string;
  status: string;
}

const SAMPLE_ROWS: PreviewRow[] = [
  {
    rowNo: 1,
    empId: "EMP-1001",
    empName: "Arsalan Khan",
    type: "Bonus",
    amount: 12000,
    period: "Jan 2025",
    reason: "Performance Achievement",
    status: "Pending",
  },
  {
    rowNo: 2,
    empId: "EMP-1002",
    empName: "Saira Ahmed",
    type: "Penalty",
    amount: -3500,
    period: "Jan 2025",
    reason: "Attendance Penalty",
    status: "Pending",
  },
  {
    rowNo: 3,
    empId: "EMP-1003",
    empName: "Umar Farooq",
    type: "Reimbursement",
    amount: 5400,
    period: "Jan 2025",
    reason: "Fuel Reimbursement",
    status: "Approved",
  },
];

const REQUIRED_COLUMNS = [
  "empId",
  "empName",
  "type",
  "amount",
  "period",
  "reason",
  "status",
];

const escapeCsv = (value: string | number) => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const BulkAdjustmentUpload: React.FC<BulkAdjustmentUploadProps> = ({
  onComplete,
  onCancel,
}) => {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);

  const totalRows = SAMPLE_ROWS.length;
  const positiveRows = SAMPLE_ROWS.filter((row) => row.amount > 0).length;
  const negativeRows = SAMPLE_ROWS.filter((row) => row.amount < 0).length;

  const templateCsv = useMemo(() => {
    const headers = REQUIRED_COLUMNS;
    const sample = SAMPLE_ROWS.map((row) => [
      row.empId,
      row.empName,
      row.type,
      row.amount,
      row.period,
      row.reason,
      row.status,
    ]);

    return [headers, ...sample]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
  }, []);

  const handleTemplateDownload = () => {
    const blob = new Blob([templateCsv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "adjustment-upload-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setHasUploaded(true);
  };

  const handleCompleteUpload = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Database className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Bulk Adjustment Upload
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Upload multiple payroll adjustments using a CSV template
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={handleTemplateDownload}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Required Columns
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">
                {REQUIRED_COLUMNS.length}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Preview Rows
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">
                {totalRows}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Positive Entries
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">
                {positiveRows}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Negative Entries
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">
                {negativeRows}
              </p>
            </div>
          </div>
        </div>

        {/* Upload + Instructions */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-brand-900">
                  Upload File
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Select your CSV file and verify the preview before final import
                </p>
              </div>

              <div className="px-6 py-6">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-brand-100/20 px-6 py-12 text-center transition hover:bg-brand-100/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-brand-900">
                    Click to upload your CSV file
                  </p>
                  <p className="mt-1 text-sm text-brand-700">
                    Use the template format for the best results
                  </p>

                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFileName && (
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                      <FileUp className="h-4 w-4 text-brand-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        {selectedFileName}
                      </p>
                      <p className="text-sm text-brand-700">
                        File selected and ready for review
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-brand-900">
                  Preview
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Sample rows shown below before import
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Row
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Employee ID
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Employee Name
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Type
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Period
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Reason
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {SAMPLE_ROWS.map((row) => (
                      <tr key={row.rowNo} className="hover:bg-brand-100/50">
                        <td className="px-5 py-4 text-sm font-medium text-brand-900">
                          {row.rowNo}
                        </td>
                        <td className="px-5 py-4 text-sm text-brand-800">
                          {row.empId}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-brand-900">
                          {row.empName}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                            {row.type}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-4 text-right text-sm font-semibold ${
                            row.amount < 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {row.amount < 0 ? "" : "+"}PKR{" "}
                          {Math.abs(row.amount).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-800">
                            {row.period}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-brand-800">
                          {row.reason}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="xl:col-span-4 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-brand-900">
                  Upload Checklist
                </h3>
              </div>

              <div className="space-y-3 px-5 py-5">
                {[
                  "Use CSV format only",
                  "Keep column names exactly as template",
                  "Penalty amounts should be negative or will be normalized later",
                  "Check employee IDs before import",
                  "Review status values before processing",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-800" />
                    </div>
                    <p className="text-sm text-brand-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                <AlertCircle className="h-4 w-4 text-brand-800" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-900">
                  Import Note
                </h4>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  This screen is ready for bulk import flow. You can later connect
                  real CSV parsing and server validation without changing the UI
                  structure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteUpload}
            disabled={!hasUploaded}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Upload
          </button>
        </div>
      </div>
    </div>
  );
};