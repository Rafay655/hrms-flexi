// CompanyStepper.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe2,
  FileText,
  type LucideIcon,
  ArrowBigLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";

import { cn } from "@/lib/utils";
import type { Company } from "@/types/company";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface WizardStep {
  key: string;
  title: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  render: (
    goNext: () => void,
    goPrev: () => void,
    isLast: boolean,
  ) => React.ReactNode;
}

interface SimpleStepperProps {
  steps: WizardStep[];
  currentIndex: number;
  onChange: (idx: number) => void;
}

interface CompanyStepperProps {
  isLoading?: boolean;

  // For edit page
  initialCompanyUuid?: string | null;
  initialData?: Company | null;
}

/* ------------------------------------------------------------------ */
/* Stepper                                                            */
/* ------------------------------------------------------------------ */

const SimpleStepper = ({ steps, currentIndex }: SimpleStepperProps) => {
  const progress = steps.length > 1 ? currentIndex / (steps.length - 1) : 0;

  return (
    <div className="py-4">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="pointer-events-none absolute left-20 right-20 top-5 h-[2px] rounded-full bg-muted-foreground/20" />

        <motion.div
          className="pointer-events-none absolute left-20 right-20 top-5 h-[2px] rounded-full bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.25 }}
        />

        <div className="relative flex w-full justify-between">
          {steps.map((step, index) => {
            const active = index === currentIndex;
            const completed = index < currentIndex;

            return (
              <button
                key={step.key}
                type="button"
                className="flex flex-col items-center gap-2 text-center"
                disabled
              >
                <motion.div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold",
                    completed
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                        ? "bg-white text-gray-700 border-primary"
                        : "bg-white text-gray-700 border-muted-foreground/40",
                  )}
                  initial={{ scale: 0.95, opacity: 0.9 }}
                  animate={{
                    scale: active ? 1.05 : 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                  }}
                >
                  <span>{step.title}</span>
                </motion.div>

                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>

                {step.description && (
                  <span className="max-w-[180px] text-[11px] leading-snug text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Skeleton UI                                                        */
/* ------------------------------------------------------------------ */

const CompanyStepperSkeleton = () => {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-28" />
      </div>

      <Card className="rounded-2xl border border-primary/15 bg-background shadow-sm">
        <CardContent className="pt-6 pb-7">
          <div className="relative w-full pt-2">
            <Skeleton className="absolute left-6 right-6 top-5 h-[2px] -translate-y-1/2 rounded-full" />

            <div className="relative flex items-start justify-between px-6 pt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex max-w-[190px] flex-col items-center gap-2 text-center"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 bg-background shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />

          <div className="grid gap-3 sm:grid-cols-2 mt-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mt-2">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

function CompanyStepperInner({
  isLoading = false,
  initialCompanyUuid = null,
  initialData = null,
}: CompanyStepperProps) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);

  const [companyUuid, setCompanyUuid] = useState<string | null>(
    initialCompanyUuid,
  );

  const [companyData, setCompanyData] = useState<Company | null>(initialData);

  React.useEffect(() => {
    if (initialCompanyUuid) {
      setCompanyUuid(initialCompanyUuid);
    }
  }, [initialCompanyUuid]);

  React.useEffect(() => {
    if (initialData) {
      setCompanyData(initialData);
    }
  }, [initialData]);

  const goNext = () => {
    setIdx((currentIndex) =>
      Math.min(currentIndex + 1, wizardSteps.length - 1),
    );
  };

  const goPrev = () => {
    setIdx((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const wizardSteps: WizardStep[] = useMemo(
    () => [
      {
        key: "company-basics",
        title: "1",
        label: "Company Basics",
        description: "Tell us who you are and where you operate.",
        icon: Building2,
        render: (goNextFn, goPrevFn, isLast) => (
          <Step1
            next={goNextFn}
            prev={goPrevFn}
            isLast={isLast}
            companyUuid={companyUuid}
            setCompanyUuid={setCompanyUuid}
            initialData={companyData}
            onCompanyUpdated={setCompanyData}
          />
        ),
      },
      {
        key: "digital-presence",
        title: "2",
        label: "Digital Presence",
        description: "Add website, socials and public-facing links.",
        icon: Globe2,
        render: (goNextFn, goPrevFn, isLast) => (
        <Step2
  next={goNextFn}
  prev={goPrevFn}
  isLast={isLast}
  companyUuid={companyUuid}
  initialData={companyData}
  onCompanyUpdated={setCompanyData}
/>
        ),
      },
      {
        key: "contact-legal",
        title: "3",
        label: "Contact & Legal",
        description: "Contacts, billing and compliance information.",
        icon: FileText,
        render: (goNextFn, goPrevFn, isLast) => (
          <Step3
          next={goNextFn}
  prev={goPrevFn}
  isLast={isLast}
  companyUuid={companyUuid}
  initialData={companyData}
  onCompanyUpdated={setCompanyData}
          />
        ),
      },
    ],
    [companyUuid, companyData],
  );

  const isLast = idx === wizardSteps.length - 1;
  const current = wizardSteps[idx];

  const progress = useMemo(
    () => Math.round(((idx + 1) / wizardSteps.length) * 100),
    [idx, wizardSteps.length],
  );

  if (isLoading) {
    return <CompanyStepperSkeleton />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Company Setup Wizard
          </h1>

          <p className="text-xs text-muted-foreground sm:text-sm">
            Fill these steps to get your company ready. You can always come back
            and edit.
          </p>

          {companyUuid && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Company UUID: {companyUuid}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
            {progress}% completed
          </span>

          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowBigLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <SimpleStepper steps={wizardSteps} currentIndex={idx} onChange={setIdx} />

      <Card className="rounded-2xl border border-border/60 bg-background shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-semibold">
              {idx + 1}
            </span>
            {current.label}
          </CardTitle>

          <p className="text-xs text-muted-foreground">{current.description}</p>
        </CardHeader>

        <CardContent className="pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {current.render(goNext, goPrev, isLast)}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompanyStepper(props: CompanyStepperProps) {
  return <CompanyStepperInner {...props} />;
}
