"use client";

import React from "react";
import { Check } from "lucide-react";
import type { StepConfig, StepStatus } from "@/types/stepper";

function getStatus(stepId: number, currentStep: number): StepStatus {
  if (stepId < currentStep) return "completed";
  if (stepId === currentStep) return "current";
  return "upcoming";
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max items-start sm:min-w-0">
        {steps.map((step, idx) => {
          const status = getStatus(step.id, currentStep);
          const isLast = idx === steps.length - 1;
          const clickable = Boolean(onStepClick) && status !== "upcoming";

          return (
            <div key={step.id} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(step.id)}
                  className={[
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    status === "completed"
                      ? "border-[#1E1B4B] bg-[#1E1B4B] text-white"
                      : status === "current"
                        ? "border-[#1E1B4B] bg-white text-[#1E1B4B]"
                        : "border-gray-300 bg-white text-gray-400",
                    clickable ? "cursor-pointer hover:opacity-80" : "cursor-default",
                  ].join(" ")}
                >
                  {status === "completed" ? <Check className="h-4 w-4" /> : step.id}
                </button>
                <div className="mt-2 w-24 text-center sm:w-28">
                  <p
                    className={[
                      "text-xs font-semibold leading-tight",
                      status === "upcoming" ? "text-gray-400" : "text-gray-900",
                    ].join(" ")}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {!isLast && (
                <div
                  className={[
                    "mt-5 h-0.5 flex-1",
                    status === "completed" ? "bg-[#1E1B4B]" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
