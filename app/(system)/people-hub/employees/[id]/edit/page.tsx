"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  Wallet,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Building2,
  CreditCard,
  ShieldCheck,
  Calendar,
  Phone,
  Fingerprint,
  Info,
  ChevronRight,
  Home,
  PencilLine,
  Save,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ComplianceTag } from "@/lib/onboarding-schema";

/* ──────────────────────────────────────────────────────────── */
/*  Compliance tag styles                                        */
/* ──────────────────────────────────────────────────────────── */
function getTagStyles(tag: ComplianceTag | "safety") {
  switch (tag) {
    case "nadra":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "eobi":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "fbr":
      return "bg-green-100 text-green-800 border-green-300";
    case "safety":
      return "bg-red-100 text-red-800 border-red-300";
    case "ss":
      return "bg-sky-100 text-sky-800 border-sky-300";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function TagBadge({ tag }: { tag: "NADRA" | "EOBI" | "Safety" | "FBR" }) {
  const map: Record<string, ComplianceTag | "safety"> = {
    NADRA: "nadra",
    EOBI: "eobi",
    Safety: "safety",
    FBR: "fbr",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0 h-4 ml-1.5 border",
        getTagStyles(map[tag])
      )}
    >
      {tag}
    </Badge>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Constants                                                    */
/* ──────────────────────────────────────────────────────────── */
const SALUTATIONS = ["Mr", "Ms", "Mrs", "Dr"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const EMERGENCY_RELATIONS = ["Father", "Mother", "Spouse", "Sibling", "Friend", "Other"] as const;
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Probation", "Intern", "Daily-Wage"] as const;
const DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Sales",
  "Operations",
  "Marketing",
  "Admin",
  "Compliance",
] as const;
const DESIGNATIONS = [
  "Officer",
  "Executive",
  "Sr. Executive",
  "Team Lead",
  "Asst. Manager",
  "Manager",
  "Sr. Manager",
  "GM",
  "Director",
] as const;
const GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"] as const;
const BRANCHES = [
  "Head Office",
  "Lahore",
  "Karachi",
  "Islamabad",
  "Faisalabad",
  "Multan",
] as const;
const BANKS = [
  "HBL",
  "MCB",
  "UBL",
  "Meezan Bank",
  "Bank Alfalah",
  "Allied Bank",
  "National Bank",
  "Standard Chartered",
  "Habib Metro",
  "Other",
] as const;
const TAX_CATEGORIES = ["Filer", "Non-Filer"] as const;

/* ──────────────────────────────────────────────────────────── */
/*  Zod Schema                                                   */
/* ──────────────────────────────────────────────────────────── */
const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
const IBAN_REGEX = /^PK\w{22}$/;
const MOBILE_REGEX = /^03\d{9}$/;

const formSchema = z.object({
  salutation: z.enum(SALUTATIONS, { message: "Select a salutation" }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(GENDERS, { message: "Select a gender" }),
  maritalStatus: z.enum(MARITAL_STATUSES, { message: "Select marital status" }),
  cnicNumber: z.string().regex(CNIC_REGEX, "CNIC must be in format XXXXX-XXXXXXX-X"),
  cnicIssueDate: z.string().min(1, "CNIC issue date is required"),
  cnicExpiryDate: z.string().min(1, "CNIC expiry date is required"),
  bloodGroup: z.enum(BLOOD_GROUPS, { message: "Select blood group" }),
  personalEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  mobile: z.string().regex(MOBILE_REGEX, "Format: 03XXXXXXXXX"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  emergencyContactRelation: z.enum(EMERGENCY_RELATIONS, { message: "Select a relation" }),

  employeeCode: z.string(),
  joiningDate: z.string().min(1, "Joining date is required"),
  employmentType: z.enum(EMPLOYMENT_TYPES, { message: "Select employment type" }),
  department: z.enum(DEPARTMENTS, { message: "Select department" }),
  designation: z.enum(DESIGNATIONS, { message: "Select designation" }),
  grade: z.enum(GRADES, { message: "Select grade" }),
  branch: z.enum(BRANCHES, { message: "Select branch" }),
  reportingManager: z.string().min(1, "Reporting manager is required"),
  probationMonths: z.coerce.number().min(0, "Must be 0 or greater"),
  noticeDays: z.coerce.number().min(0, "Must be 0 or greater"),
  costCenter: z.string().optional(),
  biometricDeviceId: z.string().optional(),

  basicSalary: z.coerce.number().min(20000, "Minimum salary is PKR 20,000"),
  housingAllowance: z.coerce.number().min(0).default(0),
  conveyanceAllowance: z.coerce.number().min(0).default(0),
  medicalAllowance: z.coerce.number().min(0).default(0),
  otherAllowance: z.coerce.number().min(0).default(0),
  bankName: z.enum(BANKS, { message: "Select a bank" }),
  accountTitle: z.string().min(1, "Account title is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  iban: z.string().regex(IBAN_REGEX, "Pakistani IBAN must start with PK and be 24 characters"),
  taxCategory: z.enum(TAX_CATEGORIES, { message: "Select tax category" }),
  eobiNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/* ──────────────────────────────────────────────────────────── */
/*  Mock employee loader (deterministic from id)                 */
/* ──────────────────────────────────────────────────────────── */
const MOCK_EMPLOYEES = [
  { first: "Sana", last: "Ahmed", father: "Muhammad Ahmed", dept: "Engineering", desig: "Sr. Manager", grade: "G7", branch: "Karachi", manager: "Imran Qureshi" },
  { first: "Muhammad", last: "Ali", father: "Tariq Ali", dept: "Finance", desig: "Manager", grade: "G6", branch: "Lahore", manager: "Fatima Sheikh" },
  { first: "Ayesha", last: "Malik", father: "Nadeem Malik", dept: "HR", desig: "Asst. Manager", grade: "G5", branch: "Head Office", manager: "Sana Ahmed" },
  { first: "Ahmed", last: "Raza", father: "Shahid Raza", dept: "Sales", desig: "Team Lead", grade: "G5", branch: "Lahore", manager: "Bilal Hussain" },
  { first: "Fatima", last: "Sheikh", father: "Kamran Sheikh", dept: "Operations", desig: "Sr. Executive", grade: "G4", branch: "Karachi", manager: "Ayesha Malik" },
  { first: "Usman", last: "Khan", father: "Rashid Khan", dept: "Operations", desig: "Officer", grade: "G2", branch: "Faisalabad", manager: "Fatima Sheikh" },
  { first: "Hina", last: "Iqbal", father: "Iqbal Hassan", dept: "HR", desig: "Executive", grade: "G3", branch: "Head Office", manager: "Sana Ahmed" },
  { first: "Bilal", last: "Hussain", father: "Zafar Hussain", dept: "Marketing", desig: "Manager", grade: "G6", branch: "Karachi", manager: "Ahmed Raza" },
];

function loadEmployeeMock(id: number): FormValues {
  const base = MOCK_EMPLOYEES[Math.abs(id) % MOCK_EMPLOYEES.length];
  const code = `EMP-${1000 + id}`;

  // Deterministic pseudo-random based on id (no Math.random for stable values)
  const seed = Math.abs(id);
  const cnicArea = 42101 + (seed % 899);
  const cnicMid = 1000000 + (seed * 137) % 8999999;
  const cnicLast = seed % 9;

  return {
    salutation: (seed % 2 === 0 ? "Mr" : "Ms") as (typeof SALUTATIONS)[number],
    firstName: base.first,
    lastName: base.last,
    fatherName: base.father,
    dateOfBirth: "1988-06-15",
    gender: (seed % 2 === 0 ? "Male" : "Female") as (typeof GENDERS)[number],
    maritalStatus: "Married" as (typeof MARITAL_STATUSES)[number],
    cnicNumber: `${cnicArea}-${cnicMid}-${cnicLast}`,
    cnicIssueDate: "2018-03-10",
    cnicExpiryDate: "2028-03-10",
    bloodGroup: "O+" as (typeof BLOOD_GROUPS)[number],
    personalEmail: `${base.first.toLowerCase()}.${base.last.toLowerCase()}@gmail.com`,
    mobile: `0300${(1000000 + seed * 71).toString().slice(0, 7)}`,
    emergencyContactName: base.father,
    emergencyContactPhone: `0321${(2000000 + seed * 53).toString().slice(0, 7)}`,
    emergencyContactRelation: "Father" as (typeof EMERGENCY_RELATIONS)[number],

    employeeCode: code,
    joiningDate: "2022-03-01",
    employmentType: "Permanent" as (typeof EMPLOYMENT_TYPES)[number],
    department: base.dept as (typeof DEPARTMENTS)[number],
    designation: base.desig as (typeof DESIGNATIONS)[number],
    grade: base.grade as (typeof GRADES)[number],
    branch: base.branch as (typeof BRANCHES)[number],
    reportingManager: base.manager,
    probationMonths: 3,
    noticeDays: 30,
    costCenter: `CC-${1000 + (seed % 20)}`,
    biometricDeviceId: `BIO-${10000 + seed}`,

    basicSalary: 80000 + (seed % 20) * 10000,
    housingAllowance: 30000 + (seed % 10) * 5000,
    conveyanceAllowance: 15000,
    medicalAllowance: 8000,
    otherAllowance: 5000,
    bankName: "HBL" as (typeof BANKS)[number],
    accountTitle: `${base.first} ${base.last}`,
    accountNumber: `${1000000000 + seed * 9137}`,
    iban: `PK36HABB${(1000000000000000 + seed * 9137).toString().slice(0, 16)}`,
    taxCategory: "Filer" as (typeof TAX_CATEGORIES)[number],
    eobiNumber: `EOBI-${100000 + seed * 7}`,
  };
}

/* ──────────────────────────────────────────────────────────── */
/*  Step definitions                                             */
/* ──────────────────────────────────────────────────────────── */
type StepDef = {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  fields: (keyof FormValues)[];
};

const STEPS: StepDef[] = [
  {
    key: "personal",
    label: "Personal Information",
    description: "Basic identity and contact details",
    icon: User,
    fields: [
      "salutation", "firstName", "lastName", "fatherName", "dateOfBirth", "gender",
      "maritalStatus", "cnicNumber", "cnicIssueDate", "cnicExpiryDate", "bloodGroup",
      "personalEmail", "mobile", "emergencyContactName", "emergencyContactPhone",
      "emergencyContactRelation",
    ],
  },
  {
    key: "employment",
    label: "Employment Details",
    description: "Role, department, and reporting structure",
    icon: Briefcase,
    fields: [
      "employeeCode", "joiningDate", "employmentType", "department", "designation",
      "grade", "branch", "reportingManager", "probationMonths", "noticeDays",
      "costCenter", "biometricDeviceId",
    ],
  },
  {
    key: "compensation",
    label: "Compensation & Banking",
    description: "Salary structure, bank details, and tax",
    icon: Wallet,
    fields: [
      "basicSalary", "housingAllowance", "conveyanceAllowance", "medicalAllowance",
      "otherAllowance", "bankName", "accountTitle", "accountNumber", "iban",
      "taxCategory", "eobiNumber",
    ],
  },
  {
    key: "review",
    label: "Review & Confirm",
    description: "Verify all information before saving",
    icon: ClipboardCheck,
    fields: [],
  },
];

/* ──────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ──────────────────────────────────────────────────────────── */
function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function formatPKR(n: number): string {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/* ──────────────────────────────────────────────────────────── */
/*  Stepper                                                      */
/* ──────────────────────────────────────────────────────────── */
function Stepper({
  steps,
  currentIndex,
}: {
  steps: StepDef[];
  currentIndex: number;
}) {
  const progress = steps.length > 1 ? currentIndex / (steps.length - 1) : 0;

  return (
    <div className="py-4">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-5 h-[2px] rounded-full bg-muted-foreground/20" />
        <motion.div
          className="pointer-events-none absolute left-[10%] right-[10%] top-5 h-[2px] rounded-full bg-brand-500 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex w-full justify-between">
          {steps.map((step, i) => {
            const active = i === currentIndex;
            const completed = i < currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center gap-2 text-center w-1/4">
                <motion.div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold z-10",
                    completed
                      ? "bg-brand-500 text-brand-900 border-brand-500"
                      : active
                      ? "bg-white text-brand-800 border-brand-500 ring-4 ring-brand-500/20"
                      : "bg-white text-muted-foreground border-muted-foreground/30"
                  )}
                  animate={{ scale: active ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  {completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </motion.div>
                <div>
                  <p
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      active
                        ? "text-brand-800"
                        : completed
                        ? "text-brand-500"
                        : "text-muted-foreground"
                    )}
                  >
                    Step {i + 1}
                  </p>
                  <p
                    className={cn(
                      "text-[12px] font-semibold mt-0.5",
                      active || completed ? "text-slate-900" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Field row                                                    */
/* ──────────────────────────────────────────────────────────── */
function FieldRow({
  label,
  required,
  tag,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  tag?: "NADRA" | "EOBI" | "Safety" | "FBR";
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-700 flex items-center flex-wrap">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {tag && <TagBadge tag={tag} />}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      ) : helper ? (
        <p className="text-[11px] text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Main Component                                               */
/* ──────────────────────────────────────────────────────────── */
export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam) || 1;

  const [stepIdx, setStepIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);

  // Load employee data (mock)
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = loadEmployeeMock(id);
      setInitialValues(data);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: initialValues ?? undefined,
    mode: "onBlur",
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    trigger,
    watch,
    setValue,
    getValues,
    reset,
  } = form;

  // Reset form when data loads
  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  // Watch allowances for CTC
  const basicSalary = watch("basicSalary") || 0;
  const housingAllowance = watch("housingAllowance") || 0;
  const conveyanceAllowance = watch("conveyanceAllowance") || 0;
  const medicalAllowance = watch("medicalAllowance") || 0;
  const otherAllowance = watch("otherAllowance") || 0;
  const totalCTC = useMemo(
    () =>
      Number(basicSalary) +
      Number(housingAllowance) +
      Number(conveyanceAllowance) +
      Number(medicalAllowance) +
      Number(otherAllowance),
    [basicSalary, housingAllowance, conveyanceAllowance, medicalAllowance, otherAllowance]
  );

  // CNIC expiry warning
  const cnicExpiryDate = watch("cnicExpiryDate");
  const cnicDaysUntilExpiry = cnicExpiryDate ? daysUntil(cnicExpiryDate) : Infinity;
  const cnicExpiringSoon = cnicDaysUntilExpiry < 180 && cnicDaysUntilExpiry >= 0;

  // Joining date warning
  const joiningDate = watch("joiningDate");
  const joinDaysAhead = joiningDate ? daysUntil(joiningDate) : 0;
  const joinDateTooFar = joinDaysAhead > 30;

  const currentStep = STEPS[stepIdx];
  const isReviewStep = currentStep.key === "review";

  // CNIC auto-format
  const cnicValue = watch("cnicNumber");
  useEffect(() => {
    if (cnicValue) {
      const formatted = formatCNIC(cnicValue);
      if (formatted !== cnicValue) {
        setValue("cnicNumber", formatted, { shouldValidate: false });
      }
    }
  }, [cnicValue, setValue]);

  const goNext = async () => {
    const stepFields = STEPS[stepIdx].fields;
    if (stepFields.length === 0) return;
    const valid = await trigger(stepFields as (keyof FormValues)[]);
    if (!valid) {
      toast.error("Please fix the errors before continuing");
      return;
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goPrev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const goToStep = (idx: number) => setStepIdx(idx);

  const onSubmit = async (_data: FormValues) => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast.success("Employee record updated", {
        description: "All changes have been saved successfully.",
      });
      router.push(`/people-hub/employees/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading skeleton ──
  if (isLoading || !initialValues) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 space-y-5">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const employeeFullName = `${initialValues.firstName} ${initialValues.lastName}`.trim();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6">
        {/* ─── Breadcrumb ─── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500"
        >
          <Link href="/" className="hover:text-slate-800 transition-colors flex items-center">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <Link
            href="/people-hub"
            className="hover:text-slate-800 transition-colors"
          >
            People Hub
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <Link
            href="/people-hub/employees"
            className="hover:text-slate-800 transition-colors"
          >
            Employees
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <Link
            href={`/people-hub/employees/${id}`}
            className="hover:text-slate-800 transition-colors max-w-[160px] truncate"
          >
            {employeeFullName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-medium text-slate-800">Edit</span>
        </nav>

        {/* ─── Header ─── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-800 border border-brand-500/40">
              <PencilLine className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Edit Employee
                </h1>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[10px] uppercase tracking-wider font-semibold">
                  Edit Mode
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Updating{" "}
                <span className="font-semibold text-slate-800">{employeeFullName}</span>{" "}
                <span className="font-mono text-xs text-slate-500">
                  ({initialValues.employeeCode})
                </span>
                {isDirty && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/people-hub/employees/${id}`)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        </div>

        {/* ─── Stepper ─── */}
        <Card className="border border-border/60 bg-background shadow-sm">
          <CardContent className="py-5">
            <Stepper steps={STEPS} currentIndex={stepIdx} />
          </CardContent>
        </Card>

        {/* ─── Form ─── */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border border-border/60 bg-background shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-brand-800">
                <currentStep.icon className="h-5 w-5" />
                {currentStep.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{currentStep.description}</p>
            </CardHeader>

            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ════════════ STEP 1: Personal ════════════ */}
                  {currentStep.key === "personal" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FieldRow label="Salutation" required error={errors.salutation?.message}>
                            <Controller
                              control={control}
                              name="salutation"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SALUTATIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="First Name" required tag="NADRA" error={errors.firstName?.message}>
                            <Input {...register("firstName")} placeholder="e.g. Ayesha" />
                          </FieldRow>
                          <FieldRow label="Last Name" required tag="NADRA" error={errors.lastName?.message}>
                            <Input {...register("lastName")} placeholder="e.g. Malik" />
                          </FieldRow>
                          <FieldRow label="Father's Name" required tag="EOBI" error={errors.fatherName?.message}>
                            <Input {...register("fatherName")} placeholder="e.g. Ahmed Malik" />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Demographics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FieldRow label="Date of Birth" required error={errors.dateOfBirth?.message}>
                            <Input type="date" {...register("dateOfBirth")} />
                          </FieldRow>
                          <FieldRow label="Gender" required error={errors.gender?.message}>
                            <Controller
                              control={control}
                              name="gender"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {GENDERS.map((g) => (
                                      <SelectItem key={g} value={g}>
                                        {g}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Marital Status" required error={errors.maritalStatus?.message}>
                            <Controller
                              control={control}
                              name="maritalStatus"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MARITAL_STATUSES.map((m) => (
                                      <SelectItem key={m} value={m}>
                                        {m}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Blood Group" required error={errors.bloodGroup?.message}>
                            <Controller
                              control={control}
                              name="bloodGroup"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BLOOD_GROUPS.map((b) => (
                                      <SelectItem key={b} value={b}>
                                        {b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          CNIC Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FieldRow label="CNIC Number" required tag="NADRA" error={errors.cnicNumber?.message}>
                            <Input
                              {...register("cnicNumber")}
                              placeholder="42101-1234567-1"
                              maxLength={15}
                              className="font-mono"
                            />
                          </FieldRow>
                          <FieldRow label="CNIC Issue Date" required error={errors.cnicIssueDate?.message}>
                            <Input type="date" {...register("cnicIssueDate")} />
                          </FieldRow>
                          <FieldRow
                            label="CNIC Expiry Date"
                            required
                            error={errors.cnicExpiryDate?.message}
                            helper={
                              cnicExpiringSoon
                                ? `⚠ Expires in ${cnicDaysUntilExpiry} days — renewal recommended`
                                : undefined
                            }
                          >
                            <Input
                              type="date"
                              {...register("cnicExpiryDate")}
                              className={cnicExpiringSoon ? "border-amber-400" : undefined}
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow label="Personal Email" error={errors.personalEmail?.message}>
                            <Input type="email" {...register("personalEmail")} placeholder="user@example.com" />
                          </FieldRow>
                          <FieldRow label="Mobile Number" required error={errors.mobile?.message}>
                            <Input
                              {...register("mobile")}
                              placeholder="03XX-XXXXXXXX"
                              maxLength={11}
                              className="font-mono"
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Emergency Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FieldRow label="Name" required tag="Safety" error={errors.emergencyContactName?.message}>
                            <Input {...register("emergencyContactName")} placeholder="e.g. Ahmed Malik" />
                          </FieldRow>
                          <FieldRow label="Phone" required error={errors.emergencyContactPhone?.message}>
                            <Input {...register("emergencyContactPhone")} placeholder="03XX-XXXXXXXX" />
                          </FieldRow>
                          <FieldRow label="Relation" required error={errors.emergencyContactRelation?.message}>
                            <Controller
                              control={control}
                              name="emergencyContactRelation"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EMERGENCY_RELATIONS.map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {r}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════ STEP 2: Employment ════════════ */}
                  {currentStep.key === "employment" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Role & Position
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FieldRow label="Employee Code" helper="Auto-generated (read-only)">
                            <Input
                              {...register("employeeCode")}
                              readOnly
                              className="bg-slate-50 font-mono text-slate-600"
                            />
                          </FieldRow>
                          <FieldRow
                            label="Date of Joining"
                            required
                            error={errors.joiningDate?.message}
                            helper={
                              joinDateTooFar
                                ? `⚠ Joining date is ${joinDaysAhead} days in the future — verify`
                                : undefined
                            }
                          >
                            <Input
                              type="date"
                              {...register("joiningDate")}
                              className={joinDateTooFar ? "border-amber-400" : undefined}
                            />
                          </FieldRow>
                          <FieldRow label="Employment Type" required error={errors.employmentType?.message}>
                            <Controller
                              control={control}
                              name="employmentType"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EMPLOYMENT_TYPES.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {t}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Organization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FieldRow label="Department" required error={errors.department?.message}>
                            <Controller
                              control={control}
                              name="department"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DEPARTMENTS.map((d) => (
                                      <SelectItem key={d} value={d}>
                                        {d}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Designation" required error={errors.designation?.message}>
                            <Controller
                              control={control}
                              name="designation"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DESIGNATIONS.map((d) => (
                                      <SelectItem key={d} value={d}>
                                        {d}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Grade" required error={errors.grade?.message}>
                            <Controller
                              control={control}
                              name="grade"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {GRADES.map((g) => (
                                      <SelectItem key={g} value={g}>
                                        {g}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Branch / Location" required error={errors.branch?.message}>
                            <Controller
                              control={control}
                              name="branch"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BRANCHES.map((b) => (
                                      <SelectItem key={b} value={b}>
                                        {b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" />
                          Reporting & Terms
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FieldRow label="Reporting Manager" required error={errors.reportingManager?.message}>
                            <Input {...register("reportingManager")} placeholder="Search or type name" />
                          </FieldRow>
                          <FieldRow label="Probation Period (months)" error={errors.probationMonths?.message}>
                            <Input type="number" min={0} {...register("probationMonths")} />
                          </FieldRow>
                          <FieldRow label="Notice Period (days)" error={errors.noticeDays?.message}>
                            <Input type="number" min={0} {...register("noticeDays")} />
                          </FieldRow>
                          <FieldRow label="Cost Center" error={errors.costCenter?.message}>
                            <Input {...register("costCenter")} placeholder="e.g. CC-1001" />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          Biometric
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow label="Biometric Device ID" error={errors.biometricDeviceId?.message}>
                            <Input {...register("biometricDeviceId")} placeholder="Device enrollment ID" />
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════ STEP 3: Compensation ════════════ */}
                  {currentStep.key === "compensation" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Salary Structure (Monthly, PKR)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FieldRow label="Basic Salary" required error={errors.basicSalary?.message}>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                                PKR
                              </span>
                              <Input type="number" {...register("basicSalary")} className="pl-11 font-mono" />
                            </div>
                          </FieldRow>
                          <FieldRow label="Housing Allowance" error={errors.housingAllowance?.message}>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                                PKR
                              </span>
                              <Input type="number" {...register("housingAllowance")} className="pl-11 font-mono" />
                            </div>
                          </FieldRow>
                          <FieldRow label="Conveyance Allowance" error={errors.conveyanceAllowance?.message}>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                                PKR
                              </span>
                              <Input type="number" {...register("conveyanceAllowance")} className="pl-11 font-mono" />
                            </div>
                          </FieldRow>
                          <FieldRow label="Medical Allowance" error={errors.medicalAllowance?.message}>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                                PKR
                              </span>
                              <Input type="number" {...register("medicalAllowance")} className="pl-11 font-mono" />
                            </div>
                          </FieldRow>
                          <FieldRow label="Other Allowance" error={errors.otherAllowance?.message}>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                                PKR
                              </span>
                              <Input type="number" {...register("otherAllowance")} className="pl-11 font-mono" />
                            </div>
                          </FieldRow>
                          <FieldRow label="Total CTC (auto)" helper="Sum of all components">
                            <div className="h-10 rounded-md border border-brand-500/40 bg-brand-500/10 px-3 flex items-center justify-between">
                              <span className="text-xs text-brand-800 font-medium">Monthly</span>
                              <span className="text-sm font-bold font-mono text-brand-800">
                                {formatPKR(totalCTC)}
                              </span>
                            </div>
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Bank Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow label="Bank Name" required error={errors.bankName?.message}>
                            <Controller
                              control={control}
                              name="bankName"
                              render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BANKS.map((b) => (
                                      <SelectItem key={b} value={b}>
                                        {b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FieldRow>
                          <FieldRow label="Account Title" required error={errors.accountTitle?.message}>
                            <Input {...register("accountTitle")} placeholder="As per bank record" />
                          </FieldRow>
                          <FieldRow label="Account Number" required error={errors.accountNumber?.message}>
                            <Input
                              {...register("accountNumber")}
                              placeholder="Bank account number"
                              className="font-mono"
                            />
                          </FieldRow>
                          <FieldRow
                            label="IBAN"
                            required
                            error={errors.iban?.message}
                            helper="PK + 22 characters (24 total)"
                          >
                            <Input
                              {...register("iban")}
                              placeholder="PK36HABB0001234567890012"
                              maxLength={24}
                              className="font-mono uppercase"
                            />
                          </FieldRow>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Compliance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow label="FBR Tax Category" required tag="FBR" error={errors.taxCategory?.message}>
                            <div className="flex items-center gap-2">
                              <Controller
                                control={control}
                                name="taxCategory"
                                render={({ field }) => (
                                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TAX_CATEGORIES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                          {t}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              <UiTooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700"
                                  >
                                    <Info className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">Filers pay lower WHT rate as per FBR</p>
                                </TooltipContent>
                              </UiTooltip>
                            </div>
                          </FieldRow>
                          <FieldRow label="EOBI Number" tag="EOBI" error={errors.eobiNumber?.message}>
                            <div className="flex items-center gap-2">
                              <Input
                                {...register("eobiNumber")}
                                placeholder="EOBI-XXXXXX"
                                className="flex-1 font-mono"
                              />
                              <UiTooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700"
                                  >
                                    <Info className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">Required for EOBI contribution tracking</p>
                                </TooltipContent>
                              </UiTooltip>
                            </div>
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════ STEP 4: Review ════════════ */}
                  {currentStep.key === "review" && (
                    <ReviewSummary values={getValues()} onEdit={goToStep} totalCTC={totalCTC} />
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {/* ─── Footer ─── */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={stepIdx === 0 || isSubmitting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>

              <div className="text-xs text-slate-500">
                Step <span className="font-semibold text-slate-900">{stepIdx + 1}</span> of{" "}
                <span className="font-semibold text-slate-900">{STEPS.length}</span>
              </div>

              {isReviewStep ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-800 hover:bg-brand-700 text-white gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-brand-800 hover:bg-brand-700 text-white gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
    </TooltipProvider>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Review Summary Component                                     */
/* ──────────────────────────────────────────────────────────── */
function ReviewSummary({
  values,
  onEdit,
  totalCTC,
}: {
  values: FormValues;
  onEdit: (idx: number) => void;
  totalCTC: number;
}) {
  const fullName = `${values.salutation} ${values.firstName} ${values.lastName}`.trim();

  const sections = [
    {
      title: "Personal Information",
      icon: User,
      stepIdx: 0,
      rows: [
        { label: "Full Name", value: fullName },
        { label: "Father's Name", value: values.fatherName },
        { label: "Date of Birth", value: values.dateOfBirth },
        { label: "Gender", value: values.gender },
        { label: "Marital Status", value: values.maritalStatus },
        { label: "Blood Group", value: values.bloodGroup },
        { label: "CNIC Number", value: values.cnicNumber, mono: true },
        { label: "CNIC Issue", value: values.cnicIssueDate },
        { label: "CNIC Expiry", value: values.cnicExpiryDate },
        { label: "Personal Email", value: values.personalEmail || "—" },
        { label: "Mobile", value: values.mobile, mono: true },
        {
          label: "Emergency Contact",
          value: `${values.emergencyContactName} (${values.emergencyContactRelation}) · ${values.emergencyContactPhone}`,
        },
      ],
    },
    {
      title: "Employment Details",
      icon: Briefcase,
      stepIdx: 1,
      rows: [
        { label: "Employee Code", value: values.employeeCode, mono: true },
        { label: "Joining Date", value: values.joiningDate },
        { label: "Employment Type", value: values.employmentType },
        { label: "Department", value: values.department },
        { label: "Designation", value: values.designation },
        { label: "Grade", value: values.grade },
        { label: "Branch", value: values.branch },
        { label: "Reporting Manager", value: values.reportingManager },
        { label: "Probation Period", value: `${values.probationMonths} months` },
        { label: "Notice Period", value: `${values.noticeDays} days` },
        { label: "Cost Center", value: values.costCenter || "—" },
        { label: "Biometric Device ID", value: values.biometricDeviceId || "—" },
      ],
    },
    {
      title: "Compensation & Banking",
      icon: Wallet,
      stepIdx: 2,
      rows: [
        { label: "Basic Salary", value: formatPKR(values.basicSalary), mono: true },
        { label: "Housing Allowance", value: formatPKR(values.housingAllowance), mono: true },
        { label: "Conveyance Allowance", value: formatPKR(values.conveyanceAllowance), mono: true },
        { label: "Medical Allowance", value: formatPKR(values.medicalAllowance), mono: true },
        { label: "Other Allowance", value: formatPKR(values.otherAllowance), mono: true },
        { label: "Total CTC", value: formatPKR(totalCTC), mono: true, highlight: true },
        { label: "Bank Name", value: values.bankName },
        { label: "Account Title", value: values.accountTitle },
        { label: "Account Number", value: values.accountNumber, mono: true },
        { label: "IBAN", value: values.iban, mono: true },
        { label: "FBR Tax Category", value: values.taxCategory },
        { label: "EOBI Number", value: values.eobiNumber || "—" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
        <PencilLine className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-900">Review your changes before saving</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Click Edit on any section to go back. Once saved, changes will be reflected across
            People Hub, PayEdge, and TimeSync modules immediately.
          </p>
        </div>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title} className="border border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-brand-800 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {section.title}
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onEdit(section.stepIdx)}
                className="h-7 text-xs gap-1"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs mt-0.5 truncate",
                        row.mono && "font-mono",
                        row.highlight
                          ? "text-brand-800 font-bold"
                          : "text-slate-800 font-medium"
                      )}
                    >
                      {row.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
