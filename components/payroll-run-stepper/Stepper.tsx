// components/payroll-run-stepper/Stepper.tsx (updated)
"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { StepIndicator } from "@/components/payroll-run-stepper/StepIndicator";
import type { StepConfig, StepHandle } from "@/types/stepper";

export function Stepper({
  steps,
  onComplete,
}: {
  steps: StepConfig[];
  onComplete?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ref to whatever step component is currently mounted. Steps that expose
  // beforeNext via useImperativeHandle get called here — no window globals.
  const activeStepRef = useRef<StepHandle | null>(null);

  const activeIndex = steps.findIndex((s) => s.id === currentStep);
  const activeStep = steps[activeIndex];
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === steps.length - 1;
  const ActiveComponent = activeStep.component;

  const goNext = async () => {
    // If the current step exposes a beforeNext handle, run it and wait.
    if (activeStepRef.current?.beforeNext) {
      setIsTransitioning(true);
      try {
        await activeStepRef.current.beforeNext();
      } catch (err) {
        // The step is expected to show its own error toasts
        setIsTransitioning(false);
        return; // don't advance
      }
      setIsTransitioning(false);
    }

    if (isLastStep) {
      setCompleted(true);
      onComplete?.();
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  const goToStep = (stepId: number) => {
    if (stepId <= currentStep) setCurrentStep(stepId);
  };

  if (completed) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">All steps completed</h3>
          <p className="max-w-sm text-sm text-gray-500">
            Every step in the workflow has been filled out. Review the details
            before final submission.
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setCompleted(false);
              setCurrentStep(1);
            }}
          >
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="border-b">
        <StepIndicator steps={steps} currentStep={currentStep} onStepClick={goToStep} />
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-6">
          <CardTitle className="text-xl font-bold text-gray-900">
            {activeStep.title}
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-gray-500">
            {activeStep.description}
          </CardDescription>
        </div>

        {/* key={activeStep.id} ensures ref resets cleanly when steps swap */}
        <ActiveComponent key={activeStep.id} ref={activeStepRef} {...activeStep.props} />

        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={isFirstStep}
            className="gap-2 border-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-sm text-gray-500">
            Step {activeIndex + 1} of {steps.length}
          </span>
          <Button
            onClick={goNext}
            disabled={isTransitioning}
            className="gap-2 bg-[#1E1B4B] hover:bg-[#2A2675]"
          >
            {isTransitioning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isLastStep ? (
              "Finish"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}