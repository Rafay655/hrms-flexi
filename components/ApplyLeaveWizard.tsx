"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaveType } from "@/app/(system)/leave-ease/types";

type ApplyLeaveWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay: boolean;
    contactDuringLeave: string;
    handoverNotes: string;
  }) => void;
  selectedLeaveType?: string;
};

type StepKey = "type" | "dates" | "details" | "review";

const leaveTypeOptions = [
  LeaveType.ANNUAL,
  LeaveType.CASUAL,
  LeaveType.SICK,
  "Comp-Off",
  LeaveType.UNPAID,
  "Short Leave",
];

const stepList: { key: StepKey; label: string }[] = [
  { key: "type", label: "Leave Type" },
  { key: "dates", label: "Dates" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
];

function formatDateForPreview(date: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countDays(startDate: string, endDate: string, isHalfDay: boolean) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) return 0;
  return isHalfDay ? 0.5 : diffDays;
}

export function ApplyLeaveWizard({
  isOpen,
  onClose,
  onSubmit,
  selectedLeaveType,
}: ApplyLeaveWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const [leaveType, setLeaveType] = useState<string>(selectedLeaveType || LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [contactDuringLeave, setContactDuringLeave] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setLeaveType(selectedLeaveType || LeaveType.ANNUAL);
      setStartDate("");
      setEndDate("");
      setReason("");
      setIsHalfDay(false);
      setContactDuringLeave("");
      setHandoverNotes("");
    }
  }, [isOpen, selectedLeaveType]);

  const totalDays = useMemo(
    () => countDays(startDate, endDate, isHalfDay),
    [startDate, endDate, isHalfDay]
  );

  const canGoNext = useMemo(() => {
    if (currentStep === 0) return Boolean(leaveType);
    if (currentStep === 1) {
      if (!startDate || !endDate) return false;
      return new Date(endDate) >= new Date(startDate);
    }
    if (currentStep === 2) return reason.trim().length >= 5;
    return true;
  }, [currentStep, leaveType, startDate, endDate, reason]);

  const handleNext = () => {
    if (!canGoNext) return;
    setCurrentStep((prev) => Math.min(prev + 1, stepList.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    onSubmit({
      leaveType,
      startDate,
      endDate,
      reason,
      isHalfDay,
      contactDuringLeave,
      handoverNotes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-5xl max-w-7xl overflow-hidden border-gray-200 bg-white p-0 shadow-2xl">
        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left Panel */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1D38] via-[#3A3662] to-[#6E5A9E] px-6 py-6 text-white md:px-8 md:py-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <DialogHeader className="space-y-2 text-left">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  Apply Leave
                </div>

                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  Smooth leave application flow
                </DialogTitle>

                <DialogDescription className="max-w-md text-sm text-white/70">
                  Fill in the details, review everything, and submit your leave request in a clean step-by-step flow.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-3">
                {stepList.map((step, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                        isActive
                          ? "border-white/20 bg-white/15"
                          : isDone
                          ? "border-emerald-300/20 bg-emerald-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                          isActive
                            ? "bg-white text-[#3A3662]"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-white">{step.label}</p>
                        <p className="text-xs text-white/55">
                          {index === 0 && "Choose leave category"}
                          {index === 1 && "Set duration and dates"}
                          {index === 2 && "Add reason and notes"}
                          {index === 3 && "Review before submit"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Live Summary
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/70">Leave Type</span>
                      <Badge className="border-white/10 bg-white/10 text-white">{leaveType || "—"}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/70">Start</span>
                      <span className="text-sm font-medium text-white">
                        {formatDateForPreview(startDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/70">End</span>
                      <span className="text-sm font-medium text-white">
                        {formatDateForPreview(endDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/70">Duration</span>
                      <span className="text-sm font-semibold text-white">
                        {totalDays || 0} {totalDays === 0.5 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col bg-white">
            <div className="border-b border-gray-200 px-6 py-5 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Step {currentStep + 1} of {stepList.length}
                  </p>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-brand-900">
                    {stepList[currentStep].label}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {stepList.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2.5 rounded-full transition-all ${
                        index === currentStep
                          ? "w-8 bg-brand-900"
                          : index < currentStep
                          ? "w-6 bg-emerald-500"
                          : "w-2.5 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 px-6 py-6 md:px-8 md:py-7">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="type"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        Pick the leave type you want to apply for.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {leaveTypeOptions.map((option) => {
                        const active = leaveType === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setLeaveType(option)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              active
                                ? "border-brand-900 bg-brand-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{option}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Standard leave request option
                                </p>
                              </div>
                              {active && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-white">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="dates"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        Choose your leave dates and set whether this is a half-day request.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Start Date
                        </label>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-brand-900"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                          End Date
                        </label>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-brand-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Half Day Leave</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Turn this on if the request is only for half a day.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsHalfDay((prev) => !prev)}
                          className={`relative h-7 w-12 rounded-full transition ${
                            isHalfDay ? "bg-brand-900" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                              isHalfDay ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </label>
                    </div>

                    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-brand-800" />
                        <p className="text-sm font-semibold text-brand-900">Estimated Duration</p>
                      </div>
                      <p className="mt-2 text-sm text-brand-700">
                        This request will cover <span className="font-bold">{totalDays || 0}</span>{" "}
                        {totalDays === 0.5 ? "day" : "days"}.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        Add a short reason and any important handover details.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Reason
                      </label>
                      <div className="relative">
                        <FileText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={4}
                          placeholder="Write a short reason for this leave request..."
                          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 pt-3 text-sm outline-none transition focus:border-brand-900"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Contact During Leave
                      </label>
                      <input
                        type="text"
                        value={contactDuringLeave}
                        onChange={(e) => setContactDuringLeave(e.target.value)}
                        placeholder="Optional contact number or email"
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-brand-900"
                      />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Handover Notes
                      </label>
                      <div className="relative">
                        <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <textarea
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          rows={4}
                          placeholder="Optional handover notes for your manager or team"
                          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 pt-3 text-sm outline-none transition focus:border-brand-900"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        Please review everything before you submit the request.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Leave Type", value: leaveType },
                        { label: "Start Date", value: formatDateForPreview(startDate) },
                        { label: "End Date", value: formatDateForPreview(endDate) },
                        { label: "Duration", value: `${totalDays || 0} ${totalDays === 0.5 ? "day" : "days"}` },
                        { label: "Half Day", value: isHalfDay ? "Yes" : "No" },
                        { label: "Reason", value: reason || "—" },
                        { label: "Contact During Leave", value: contactDuringLeave || "—" },
                        { label: "Handover Notes", value: handoverNotes || "—" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 md:px-8">
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 0 ? onClose : handleBack}
                  className="border-gray-200 text-gray-700"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {currentStep === 0 ? "Cancel" : "Back"}
                </Button>

                {currentStep < stepList.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="bg-gradient-to-r from-[#443763] to-[#6E5A9E] text-white hover:opacity-95 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-[#443763] to-[#6E5A9E] text-white hover:opacity-95"
                  >
                    Submit Leave Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}