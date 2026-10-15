"use client";

import React, { useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  ShieldCheck,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";

interface CompOffCreditRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type RequestType = "holiday" | "weekend" | "overtime" | "extra_shift";

interface FormState {
  employeeName: string;
  employeeId: string;
  requestType: RequestType;
  workedDate: string;
  startTime: string;
  endTime: string;
  hoursWorked: number | "";
  requestedCredit: number | "";
  reason: string;
  approverName: string;
  attachmentName: string;
  autoCalculate: boolean;
}

const initialForm: FormState = {
  employeeName: "Ahmed Khan",
  employeeId: "EMP-101",
  requestType: "holiday",
  workedDate: "",
  startTime: "09:00",
  endTime: "18:00",
  hoursWorked: "",
  requestedCredit: "",
  reason: "",
  approverName: "Sarah Manager",
  attachmentName: "",
  autoCalculate: true,
};

function formatRequestType(type: RequestType) {
  switch (type) {
    case "holiday":
      return "Worked Holiday";
    case "weekend":
      return "Weekend Work";
    case "overtime":
      return "Approved Overtime";
    case "extra_shift":
      return "Extra Shift";
    default:
      return type;
  }
}

export function CompOffCreditRequestForm({
  isOpen,
  onClose,
}: CompOffCreditRequestFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);

  const calculatedCredit = useMemo(() => {
    if (!form.autoCalculate) {
      return typeof form.requestedCredit === "number" ? form.requestedCredit : 0;
    }

    const hours =
      typeof form.hoursWorked === "number" && !Number.isNaN(form.hoursWorked)
        ? form.hoursWorked
        : 0;

    if (hours >= 8) return 1;
    if (hours >= 4) return 0.5;
    return 0;
  }, [form.autoCalculate, form.hoursWorked, form.requestedCredit]);

  const expiryPreview = useMemo(() => {
    if (!form.workedDate) return "--";
    const base = new Date(form.workedDate);
    if (Number.isNaN(base.getTime())) return "--";
    base.setDate(base.getDate() + 90);
    return base.toISOString().split("T")[0];
  }, [form.workedDate]);

  const totalWorkedTime = useMemo(() => {
    if (!form.startTime || !form.endTime) return "0h 00m";

    const [startHour, startMinute] = form.startTime.split(":").map(Number);
    const [endHour, endMinute] = form.endTime.split(":").map(Number);

    if (
      [startHour, startMinute, endHour, endMinute].some((val) =>
        Number.isNaN(val)
      )
    ) {
      return "0h 00m";
    }

    let start = startHour * 60 + startMinute;
    let end = endHour * 60 + endMinute;

    if (end < start) end += 24 * 60;

    const diff = Math.max(end - start, 0);
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h}h ${String(m).padStart(2, "0")}m`;
  }, [form.startTime, form.endTime]);

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = () => {
    if (
      !form.employeeName.trim() ||
      !form.employeeId.trim() ||
      !form.workedDate ||
      !form.reason.trim() ||
      !form.approverName.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (!form.autoCalculate && form.requestedCredit === "") {
      alert("Please enter requested credit.");
      return;
    }

    alert("Comp-Off credit request submitted successfully.");
    onClose();
    setForm(initialForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4 ">
      <div className="w-full max-w-6xl  rounded-2xl border border-gray-200 bg-white max-h-[800px]!  overflow-y-auto! ">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">
                Request Comp-Off Credit
              </h3>
              <p className="text-sm text-brand-700">
                Submit weekend, holiday, overtime, or extra shift work for review.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Left form */}
          <div className="border-b border-gray-200 p-6 lg:border-b-0 lg:border-r">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Employee Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    value={form.employeeName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        employeeName: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    placeholder="e.g. Ahmed Khan"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Employee ID *
                </label>
                <input
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  placeholder="e.g. EMP-101"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Request Type *
                </label>
                <select
                  value={form.requestType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      requestType: e.target.value as RequestType,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="holiday">Worked Holiday</option>
                  <option value="weekend">Weekend Work</option>
                  <option value="overtime">Approved Overtime</option>
                  <option value="extra_shift">Extra Shift</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Worked Date *
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="date"
                    value={form.workedDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        workedDate: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.hoursWorked}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      hoursWorked:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  placeholder="e.g. 8"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Requested Credit {!form.autoCalculate && "*"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.requestedCredit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      requestedCredit:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  disabled={form.autoCalculate}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="e.g. 1.0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Reason / Work Summary *
                </label>
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  placeholder="Explain why comp-off should be granted, what work was performed, and any relevant approval context..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Approver Name *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    value={form.approverName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        approverName: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    placeholder="e.g. Sarah Manager"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Attachment
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      attachmentName: prev.attachmentName
                        ? ""
                        : "timesheet-evidence.pdf",
                    }))
                  }
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <Upload className="h-4 w-4" />
                  {form.attachmentName ? form.attachmentName : "Upload Evidence"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <div className="text-sm font-semibold text-brand-900">
                    Auto Calculate Credit
                  </div>
                  <div className="text-[11px] text-brand-700">
                    Use hours worked to determine credit
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      autoCalculate: !prev.autoCalculate,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 rounded-full transition ${
                    form.autoCalculate ? "bg-brand-800" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      form.autoCalculate ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <div className="text-sm font-semibold text-brand-900">
                    Total Worked Duration
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-brand-700">
                    <Clock3 className="h-4 w-4" />
                    <span className="font-semibold text-brand-900">
                      {totalWorkedTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right preview panel */}
          <div className="bg-white p-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                  <Zap className="h-4 w-4" />
                  Credit Preview
                </h4>
              </div>

              <div className="grid gap-4 p-5">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Request Type
                  </div>
                  <div className="mt-2 text-sm font-semibold text-brand-900">
                    {formatRequestType(form.requestType)}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Hours Worked
                    </div>
                    <div className="mt-2 text-lg font-bold text-brand-900">
                      {form.hoursWorked === "" ? "0" : form.hoursWorked}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Expected Credit
                    </div>
                    <div className="mt-2 text-lg font-bold text-brand-900">
                      {calculatedCredit.toFixed(1)} day
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Expiry Preview
                  </div>
                  <div className="mt-2 text-2xl font-bold text-brand-900">
                    {expiryPreview}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-800" />
                    <div>
                      <div className="text-sm font-semibold text-brand-900">
                        Validation Note
                      </div>
                      <div className="mt-1 text-sm leading-6 text-brand-700">
                        Standard preview logic used:
                        <span className="font-semibold text-brand-900">
                          {" "}
                          8+ hours = 1.0 day, 4+ hours = 0.5 day, below 4 hours = 0.0 day.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-brand-800" />
                    <div>
                      <div className="text-sm font-semibold text-brand-900">
                        Review Flow
                      </div>
                      <div className="mt-1 text-sm leading-6 text-brand-700">
                        Submitted request will move to approval review before the credit is added to your available balance.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <FileText className="h-4 w-4" />
                    Evidence
                    <span className="font-semibold text-brand-900">
                      {form.attachmentName || "Not attached"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}