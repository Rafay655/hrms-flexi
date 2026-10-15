"use client";
import { ApiFieldErrors } from "@/components/api-field-errors";
import { showApiError } from "@/lib/error-toast";
import { getLetterForgeError } from "@/services/letter-forge";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  Bold, Braces, Check, Code2, Copy, FileText, Hash, Heading2, Heading3,
  Italic, Link as LinkIcon, List, ListOrdered, Loader2, Lock, PenLine,
  Redo2, RemoveFormatting, Search, ShieldCheck, Undo2, UserCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/searchable-select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateLetterTemplate, useLetterTemplate, useUpdateLetterTemplate,
  usePreviewLetterTemplate, useActivateLetterTemplate, useDeactivateLetterTemplate,
  useDeleteLetterTemplate, useTemplatePublishing,
} from "@/hooks/use-letter-forge";
import { validateTemplateBody } from "@/lib/template-validation";
import {
  CreateLetterTemplatePayload, LetterLanguage, LetterTemplate,
  REGISTERED_TEMPLATE_KEYS, TemplateEngine, UpdateLetterTemplatePayload,
  VariableSchema, VariableType, SignaturePolicy,
} from "@/types/letter-forge";

/* =========================================================
   Shared constants + helpers
   ========================================================= */

export const LANGUAGES: Record<LetterLanguage, string> = {
  en: "English", ur: "Urdu", ar: "Arabic",
};

export function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function variableLabel(value: string) {
  return value.trim().replace(/^\{\{\s*(.*?)\s*\}\}$/, "$1").trim();
}

const dirFor = (lang: LetterLanguage) => (lang === "en" ? "ltr" : "rtl");

/* ---------- Mustache helpers ---------- */

const titleCase = (s: string) =>
  s.replace(/[_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const isBoolName = (n: string) => /^(is|has|can)_/.test(n);

function guessType(name: string): VariableType {
  if (isBoolName(name)) return "boolean";
  if (/date|_at$|_on$/.test(name)) return "date";
  if (/days|count|amount|salary|total|years|months|number_of/.test(name)) return "number";
  return "string";
}

/** Every {{name}} and {{#section}} used in the body (closing tags and {{.}} ignored). */
function extractBodyNames(body: string): string[] {
  const names = new Set<string>();
  for (const m of body.matchAll(/\{\{\s*([#^/]?)\s*([A-Za-z_][\w.]*)\s*\}\}/g)) {
    if (m[1] !== "/") names.add(m[2]);
  }
  return [...names];
}

function missingVariables(schema: VariableSchema, body: string): string[] {
  const declared = new Set((schema.variables ?? []).map((v) => v.name));
  const derived = new Set(Object.keys(schema.derived ?? {}));
  return extractBodyNames(body).filter((n) => !declared.has(n) && !derived.has(n));
}

function mergeDetected(schema: VariableSchema, body: string): VariableSchema {
  const missing = missingVariables(schema, body);
  if (!missing.length) return schema;
  return {
    ...schema,
    variables: [
      ...(schema.variables ?? []),
      ...missing.map((name) => ({
        name, label: titleCase(name), type: guessType(name), required: true,
      })),
    ],
  };
}

const SAMPLE_TEXT: Record<string, string> = {
  employee_name: "Ahmed Khan",
  employee_code: "EMP-0142",
  employee_cnic: "42101-1234567-8",
  designation: "Senior Accountant",
  department: "Finance",
  grade_band: "M2",
  branch: "Karachi HQ",
  joining_date: "1 March 2026",
  employment_type: "Permanent",
  reporting_manager: "Bilal Ahmed",
  company_name: "Acme Pvt. Ltd.",
  company_address: "12 Clifton Block 5, Karachi",
  company_phone: "+92 21 111 222 333",
  company_email: "hr@acme.pk",
  authorized_signatory_name: "Sara Malik",
  authorized_signatory_title: "HR Manager",
  hr_manager_name: "Sara Malik",
  reference_number: "HR/2026/0142",
  reference_no: "HR/2026/0142",
  violation_type: "repeated late arrival",
  issuer_name: "Sara Malik",
  issuer_designation: "HR Manager",
  response_days: "7",
  warning_count: "1st",
  disciplinary_reason: "Repeated unauthorized absence",
  incident_date: "10 Sep 2026",
  letter_date: "24 Sep 2026",
  today_date: "24 Sep 2026",
  issue_date: "24 Sep 2026",
  letter_type_name: "Warning Letter",
  noc_purpose: "Visa application",
  training_name: "Advanced Excel",
  training_completion_date: "15 Aug 2026",
  asset_name: "Dell Latitude 5420",
  asset_serial: "DL-5420-0142",
  loan_type: "Personal",
  loan_amount: "150,000",
  emi_amount: "12,500",
  gross_salary: "150,000",
  basic_salary: "90,000",
  total_tax_deducted: "12,000",
  tax_year: "2026",
};

function sampleText(name: string, type?: VariableType): string {
  if (SAMPLE_TEXT[name]) return SAMPLE_TEXT[name];
  const t = type ?? guessType(name);
  if (t === "date") {
    return new Date().toLocaleDateString(undefined, { dateStyle: "long" });
  }
  if (t === "number") return "5";
  if (t === "boolean") return "Yes";
  return `Sample ${titleCase(name).toLowerCase()}`;
}

/** Tiny Mustache renderer for preview only. */
function renderSample(body: string, schema: VariableSchema): string {
  const types = Object.fromEntries((schema.variables ?? []).map((v) => [v.name, v.type]));
  const derived = new Set(Object.keys(schema.derived ?? {}));
  const isFlag = (n: string) => derived.has(n) || isBoolName(n) || types[n] === "boolean";

  let out = body.replace(
    /\{\{\s*([#^])\s*([\w.]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\2\s*\}\}/g,
    (_m, sigil: string, name: string, inner: string) => {
      if (sigil === "^") return "";
      if (isFlag(name)) return inner;
      return ["First sample item", "Second sample item"]
        .map((item) => inner.replace(/\{\{\s*\.\s*\}\}/g, item))
        .join("");
    },
  );
  out = out.replace(/\{\{\s*([A-Za-z_][\w.]*)\s*\}\}/g, (_m, n: string) => sampleText(n, types[n]));
  return out.replace(/\n{3,}/g, "\n\n");
}

/* =========================================================
   Variable registry (mirrors backend LetterTypeRegistry)
   ========================================================= */

export interface VariableDef {
  name: string;
  label: string;
  group: string;
}

export const REGISTERED_VARIABLES: VariableDef[] = [
  // Letter metadata
  { name: "letter_date", label: "Letter Date", group: "Letter metadata" },
  { name: "letter_type_name", label: "Letter Type Name", group: "Letter metadata" },
  { name: "reference_number", label: "Reference Number", group: "Letter metadata" },
  // Employee
  { name: "employee_name", label: "Employee Name", group: "Employee" },
  { name: "employee_code", label: "Employee Code", group: "Employee" },
  { name: "employee_cnic", label: "Employee CNIC", group: "Employee" },
  { name: "designation", label: "Designation", group: "Employee" },
  { name: "department", label: "Department", group: "Employee" },
  { name: "grade_band", label: "Grade Band", group: "Employee" },
  { name: "branch", label: "Branch", group: "Employee" },
  { name: "joining_date", label: "Joining Date", group: "Employee" },
  { name: "employment_type", label: "Employment Type", group: "Employee" },
  { name: "reporting_manager", label: "Reporting Manager", group: "Employee" },
  // Probation
  { name: "probation_end_date", label: "Probation End Date", group: "Probation" },
  { name: "confirmation_effective_date", label: "Confirmation Effective Date", group: "Probation" },
  { name: "extension_days", label: "Extension Days", group: "Probation" },
  { name: "extension_reason", label: "Extension Reason", group: "Probation" },
  // Career events
  { name: "new_designation", label: "New Designation", group: "Career events" },
  { name: "new_department", label: "New Department", group: "Career events" },
  { name: "new_grade", label: "New Grade", group: "Career events" },
  { name: "new_salary", label: "New Salary", group: "Career events" },
  { name: "effective_date", label: "Effective Date", group: "Career events" },
  // Payroll
  { name: "gross_salary", label: "Gross Salary", group: "Payroll" },
  { name: "basic_salary", label: "Basic Salary", group: "Payroll" },
  { name: "total_tax_deducted", label: "Total Tax Deducted", group: "Payroll" },
  { name: "tax_year", label: "Tax Year", group: "Payroll" },
  // Performance
  { name: "performance_outcome_reference", label: "Performance Outcome Reference", group: "Performance" },
  { name: "performance_cycle_name", label: "Performance Cycle Name", group: "Performance" },
  { name: "performance_final_score", label: "Performance Final Score", group: "Performance" },
  { name: "performance_rating_code", label: "Performance Rating Code", group: "Performance" },
  { name: "performance_rating_label", label: "Performance Rating Label", group: "Performance" },
  { name: "performance_released_at", label: "Performance Released At", group: "Performance" },
  { name: "performance_release_hash", label: "Performance Release Hash", group: "Performance" },
  // Finance
  { name: "loan_amount", label: "Loan Amount", group: "Finance" },
  { name: "loan_type", label: "Loan Type", group: "Finance" },
  { name: "emi_amount", label: "EMI Amount", group: "Finance" },
  // Disciplinary
  { name: "incident_date", label: "Incident Date", group: "Disciplinary" },
  { name: "warning_count", label: "Warning Count", group: "Disciplinary" },
  { name: "disciplinary_reason", label: "Disciplinary Reason", group: "Disciplinary" },
  // On-demand
  { name: "noc_purpose", label: "NOC Purpose", group: "On-demand" },
  // Training
  { name: "training_name", label: "Training Name", group: "Training" },
  { name: "training_completion_date", label: "Training Completion Date", group: "Training" },
  // Assets
  { name: "asset_name", label: "Asset Name", group: "Assets" },
  { name: "asset_serial", label: "Asset Serial", group: "Assets" },
  // Company
  { name: "company_name", label: "Company Name", group: "Company" },
  { name: "company_address", label: "Company Address", group: "Company" },
  { name: "company_phone", label: "Company Phone", group: "Company" },
  { name: "company_email", label: "Company Email", group: "Company" },
  { name: "company_logo_url", label: "Company Logo URL", group: "Company" },
  { name: "authorized_signatory_name", label: "Authorized Signatory Name", group: "Company" },
  { name: "authorized_signatory_title", label: "Authorized Signatory Title", group: "Company" },
  { name: "hr_manager_name", label: "HR Manager Name", group: "Company" },
  // System / event context
  { name: "today_date", label: "Today's Date", group: "System" },
  { name: "issue_date", label: "Issue Date", group: "System" },
  { name: "reference_no", label: "Reference No", group: "System" },
  { name: "violation_type", label: "Violation Type", group: "System" },
  { name: "previous_warning_date", label: "Previous Warning Date", group: "System" },
  { name: "response_days", label: "Response Days", group: "System" },
  { name: "issuer_name", label: "Issuer Name", group: "System" },
  { name: "issuer_designation", label: "Issuer Designation", group: "System" },
];

const GROUP_ORDER = [
  "Letter metadata", "Employee", "Probation", "Career events", "Payroll",
  "Performance", "Finance", "Disciplinary", "On-demand", "Training",
  "Assets", "Company", "System",
];

/* =========================================================
   Variable picker
   ========================================================= */

function VariablePicker({
  onInsert,
  onClose,
}: {
  onInsert: (token: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGISTERED_VARIABLES;
    return REGISTERED_VARIABLES.filter(
      (v) => v.name.includes(q) || v.label.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, VariableDef[]>();
    for (const v of filtered) {
      const arr = map.get(v.group) ?? [];
      arr.push(v);
      map.set(v.group, arr);
    }
    return GROUP_ORDER
      .filter((g) => map.has(g))
      .map((g) => [g, map.get(g)!] as const);
  }, [filtered]);

  return (
    <div className="border-b bg-muted/20">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search variables…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
        />
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {filtered.length}/{REGISTERED_VARIABLES.length}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 shrink-0 px-2 text-xs"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="max-h-52 overflow-y-auto px-3 py-2">
        {grouped.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No variable matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          grouped.map(([group, items]) => (
            <div key={group} className="mb-3 last:mb-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <div className="flex flex-wrap gap-1">
                {items.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    title={`Insert {{${v.name}}} — ${v.label}`}
                    onClick={() => onInsert(`{{${v.name}}}`)}
                    className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] leading-5 text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Layout primitives
   ========================================================= */

function Section({
  title, description, wide, children,
}: { title: string; description?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section
      className={cn(
        "grid gap-4 py-6 first:pt-0 last:pb-0",
        !wide && "lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8",
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-none">{title}</h3>
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Field({
  label, htmlFor, hint, children,
}: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  icon: Icon, label, description, checked, onChange,
}: {
  icon: typeof ShieldCheck;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        checked ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function EngineOption({
  icon: Icon, title, description, selected, disabled, onSelect,
}: {
  icon: typeof Code2;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
        disabled && !selected && "opacity-50",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{title}</span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
      {selected && (
        <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

/* =========================================================
   Editors
   ========================================================= */

function ToolbarButton({
  title, onClick, children,
}: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      aria-label={title}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Divider() { return <span className="mx-1 h-5 w-px bg-border" />; }

function RichTextEditor({
  value, onChange, placeholder, dir,
}: { value: string; onChange: (v: string) => void; placeholder?: string; dir?: "ltr" | "rtl" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertToken = (token: string) => {
    const el = ref.current;
    if (!el) {
      onChange((value || "") + token);
      return;
    }
    el.focus();
    const ok = document.execCommand("insertText", false, token);
    if (!ok) el.innerHTML = (el.innerHTML || "") + token;
    onChange(el.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
      {/* header bar */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />Rich text (HTML)
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-6 gap-1 px-2 text-xs", pickerOpen && "text-primary")}
            onClick={() => setPickerOpen((o) => !o)}
            title={pickerOpen ? "Hide variables" : "Insert variable"}
          >
            <Braces className="h-3 w-3" />
            Variables
          </Button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        <ToolbarButton title="Bold" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton title="Heading 2" onClick={() => exec("formatBlock", "h2")}><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => exec("formatBlock", "h3")}><Heading3 className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton
          title="Link"
          onClick={() => {
            const url = window.prompt("URL", "https://");
            if (url) exec("createLink", url);
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}><RemoveFormatting className="h-4 w-4" /></ToolbarButton>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton title="Undo" onClick={() => exec("undo")}><Undo2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => exec("redo")}><Redo2 className="h-4 w-4" /></ToolbarButton>
        </div>
      </div>

      {pickerOpen && (
        <VariablePicker onInsert={insertToken} onClose={() => setPickerOpen(false)} />
      )}

      <div
        ref={ref}
        dir={dir}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Template body"
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className={cn(
          "prose prose-sm max-w-none min-h-[260px] px-4 py-3 focus:outline-none",
          "empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}

function MarkdownEditor({
  value, onChange, placeholder, dir, schema,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  schema: VariableSchema;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<"sample" | "raw">("sample");

  const lines = value ? value.split("\n").length : 0;
  const preview = mode === "sample" ? renderSample(value, schema) : value;

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-3">
      {pickerOpen && (
        <div className="overflow-hidden rounded-lg border">
          <VariablePicker onInsert={insertToken} onClose={() => setPickerOpen(false)} />
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {/* editor */}
        <div className="flex flex-col overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Braces className="h-3.5 w-3.5" />Markdown + Mustache
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-6 gap-1 px-2 text-xs", pickerOpen && "text-primary")}
                onClick={() => setPickerOpen((o) => !o)}
                title={pickerOpen ? "Hide variables" : "Insert variable"}
              >
                <Braces className="h-3 w-3" />
                Variables
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">{lines} lines</span>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            dir={dir}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck
            aria-label="Template body"
            className="h-[300px] w-full resize-none bg-transparent px-3 py-2.5 font-mono text-[13px] leading-6 focus:outline-none"
          />
        </div>

        {/* preview */}
        <div className="flex flex-col overflow-hidden rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
            <div role="tablist" aria-label="Preview mode" className="flex rounded-md bg-muted p-0.5">
              {(["sample", "raw"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded px-2.5 py-0.5 text-xs font-medium transition-colors",
                    mode === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "sample" ? "Sample" : "Raw"}
                </button>
              ))}
            </div>
          </div>
          <pre
            dir={dir}
            className="h-[300px] overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[13px] leading-6 text-muted-foreground"
          >
            {preview || "Your template will appear here as you type."}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Create / edit modal
   ========================================================= */

interface FormState {
  template_key: string;
  name: string;
  language: LetterLanguage;
  engine: TemplateEngine;
  paper_size: string;
  orientation: string;
  body_html: string;
  header_html: string;
  footer_html: string;
  requires_approval: boolean;
  requires_e_signature: boolean;
  signature_policy: SignaturePolicy;
  signature_signatories: import("@/types/letter-forge").SignatureSignatoryPlan;
  series_tracking: boolean;
  requires_employee_acknowledgement: boolean;
}

const DEFAULT_FORM: FormState = {
  template_key: "",
  name: "",
  language: "en",
  engine: "legacy",
  paper_size: "A4",
  orientation: "portrait",
  body_html: "",
  header_html: "",
  footer_html: "",
  requires_approval: true,
  requires_e_signature: false,
  signature_policy: "none",
  signature_signatories: [],
  series_tracking: true,
  requires_employee_acknowledgement: false,
};

export function TemplateFormModal({
  mode, uuid, onClose, onSaved,
}: {
  mode: "create" | "edit";
  uuid?: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = mode === "edit";
  const { data, isPending: loadingTemplate } = useLetterTemplate(isEdit ? uuid! : null);
  const template = data?.data;

  const [submitError, setSubmitError] = useState<unknown>(null);
  const [form, setFormState] = useState<FormState>(DEFAULT_FORM);
  const [schema, setSchema] = useState<VariableSchema>({ variables: [], derived: {} });
  const [hydrated, setHydrated] = useState(!isEdit);

  const setForm = (patch: Partial<FormState>) =>
    setFormState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.requires_e_signature !== undefined) {
        if (patch.requires_e_signature) next.requires_employee_acknowledgement = false;
        next.signature_policy = next.requires_e_signature ? "internal_signatory" : next.requires_employee_acknowledgement ? "employee_acknowledgement" : "none";
      } else if (patch.requires_employee_acknowledgement !== undefined) {
        if (patch.requires_employee_acknowledgement) next.requires_e_signature = false;
        next.signature_policy = next.requires_employee_acknowledgement ? "employee_acknowledgement" : next.requires_e_signature ? "internal_signatory" : "none";
      }
      return next;
    });

  // Initialize once when the saved template arrives; later refetches must not overwrite edits.
  if (isEdit && template && !hydrated) {
    const signaturePolicy = template.signature_policy ?? (template.requires_e_signature ? "internal_signatory" : template.requires_employee_acknowledgement ? "employee_acknowledgement" : "none");
    setFormState({
      template_key: template.template_key,
      name: template.name,
      language: template.language,
      engine: (template.engine ?? "legacy") as TemplateEngine,
      paper_size: template.paper_size ?? "A4",
      orientation: template.orientation ?? "portrait",
      body_html: template.body_html ?? "",
      header_html: template.header_html ?? "",
      footer_html: template.footer_html ?? "",
      requires_approval: template.requires_approval,
      signature_policy: signaturePolicy,
      signature_signatories: template.signature_signatories ?? [],
      requires_e_signature: signaturePolicy === "internal_signatory",
      series_tracking: template.series_tracking,
      requires_employee_acknowledgement: signaturePolicy === "employee_acknowledgement",
    });
    setSchema(
      template.variable_schema ?? {
        variables: (template.variables ?? []).map((name) => ({
          name, label: name, type: "string" as const, required: false,
        })),
        derived: {},
      },
    );
    setHydrated(true);
  }

  const createMut = useCreateLetterTemplate();
  const updateMut = useUpdateLetterTemplate();
  const submitting = createMut.isPending || updateMut.isPending;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.body_html.trim()) {
      toast.error("Name and body are required.");
      return;
    }
    if (!isEdit && !form.template_key.trim()) {
      toast.error("Template key is required.");
      return;
    }

    if (form.requires_e_signature && form.signature_signatories.some((signer) => !Number.isInteger(signer.sign_order) || signer.sign_order < 1 || signer.sign_order > 10 || (signer.type === "role" && !signer.role?.trim()))) {
      toast.error("Each signer needs an order from 1 to 10, and role signers need a role key.");
      return;
    }
    const check = validateTemplateBody(form.body_html, form.engine);
    if (!check.ok) {
      toast.error(check.errors.join(" "));
      return;
    }

    const base = {
      template_key: form.template_key.trim(),
      name: form.name.trim(),
      language: form.language,
      body_html: form.body_html,
      header_html: form.header_html || null,
      footer_html: form.footer_html || null,
      requires_approval: form.requires_approval,
      signature_policy: form.signature_policy,
      signature_signatories: form.requires_e_signature && form.signature_signatories.length ? form.signature_signatories.map((signer) => signer.type === "role" ? { ...signer, role: signer.role?.trim() } : { type: signer.type, sign_order: signer.sign_order }) : null,
      series_tracking: form.series_tracking,
    };

    // Auto-detect schema from body — no manual editing required.
    const finalSchema = mergeDetected(schema, form.body_html);

    const payload: CreateLetterTemplatePayload | UpdateLetterTemplatePayload =
      form.engine === "legacy"
        ? { ...base, engine: "legacy", paper_size: form.paper_size, orientation: form.orientation }
        : {
            ...base,
            engine: "mustache",
            variable_schema: finalSchema,
            variables: finalSchema.variables.map((v) => v.name).filter(Boolean),
          };

    try {
      setSubmitError(null);
      if (isEdit) {
        await updateMut.mutateAsync({ uuid: uuid!, payload: payload as UpdateLetterTemplatePayload });
        onSaved("Template updated successfully.");
      } else {
        await createMut.mutateAsync(payload as CreateLetterTemplatePayload);
        onSaved("Template created successfully.");
      }
    } catch (err) {
      setSubmitError(err);
      showApiError(err);
    }
  };

  const busy = isEdit && (loadingTemplate || !hydrated);
  const dir = dirFor(form.language);

  const flags: Array<{
    key: keyof Pick<FormState, "requires_approval" | "requires_e_signature" | "series_tracking" | "requires_employee_acknowledgement">;
    icon: typeof ShieldCheck;
    label: string;
    description: string;
  }> = [
    { key: "requires_approval", icon: ShieldCheck, label: "Requires approval", description: "A manager reviews before the letter is issued." },
    { key: "requires_e_signature", icon: PenLine, label: "E-signature", description: "Sign through DMS before final delivery. Turns off employee acknowledgement." },
    { key: "series_tracking", icon: Hash, label: "Series tracking", description: "Number letters in sequence for records." },
    { key: "requires_employee_acknowledgement", icon: UserCheck, label: "Employee acknowledgement", description: "The employee confirms receipt after dispatch. Turns off e-signature." },
  ];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {/* header */}
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-5 pr-14 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg leading-tight">
                {isEdit ? (form.name || "Edit template") : "Create letter template"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {isEdit
                  ? <span className="font-mono text-xs">{form.template_key}</span>
                  : "Set up the basics, write the body, then choose how it's approved."}
              </DialogDescription>
            </div>
            {isEdit && (
              <Badge variant="outline" className="hidden shrink-0 gap-1 sm:inline-flex">
                <Lock className="h-3 w-3" />
                {form.engine === "mustache" ? "Mustache" : "Legacy"}
              </Badge>
            )}
          </div>
        </DialogHeader>
        <ApiFieldErrors error={submitError} />

        {/* body */}
        {busy ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="divide-y">
              <Section title="Basics" description="How this template is named and found.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Template key"
                    htmlFor="tpl-key"
                    hint={
                      isEdit
                        ? "The key can't be changed."
                        : "Must be one of the 21 registered letter types."
                    }
                  >
                    {isEdit ? (
                      <Input
                        id="tpl-key"
                        className="font-mono text-sm"
                        value={form.template_key}
                        disabled
                      />
                    ) : (
                      <SearchableSelect id="tpl-key" aria-label="Letter type" allowAll={false} widthClass="w-full" placeholder="Select a registered letter type…" searchPlaceholder="Search letter types…" value={form.template_key} options={REGISTERED_TEMPLATE_KEYS.map((entry) => ({ value: entry.key, label: entry.label }))} onChange={(key) => {
                        const selected = REGISTERED_TEMPLATE_KEYS.find((entry) => entry.key === key);
                        setForm({ template_key: key, name: form.name.trim() ? form.name : selected?.label ?? "" });
                      }} />
                    )}
                  </Field>
                  <Field label="Name" htmlFor="tpl-name">
                    <Input
                      id="tpl-name" aria-invalid={Boolean(getLetterForgeError(submitError).fieldErrors.name)}
                      value={form.name}
                      onChange={(e) => setForm({ name: e.target.value })}
                      placeholder="Warning letter — final"
                    />
                  </Field>
                  <Field label="Language" htmlFor="tpl-lang">
                    <SearchableSelect id="tpl-lang" allowAll={false} widthClass="w-full" value={form.language} onChange={(value) => setForm({ language: value as LetterLanguage })} options={Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))} />
                  </Field>
                </div>
              </Section>

              <Section
                title="Engine"
                description={isEdit ? "Locked after creation." : "Pick once. You can't switch later."}
              >
                <div role="radiogroup" aria-label="Template engine" className="grid gap-3 sm:grid-cols-2">
                  <EngineOption
                    icon={FileText}
                    title="Legacy (HTML)"
                    description="Rich text editor with registered tokens. Best for simple letters."
                    selected={form.engine === "legacy"}
                    disabled={isEdit}
                    onSelect={() => form.engine !== "legacy" && setForm({ engine: "legacy", body_html: "" })}
                  />
                  <EngineOption
                    icon={Braces}
                    title="Mustache (Markdown)"
                    description="Markdown with catalog keys, sections and derived conditions."
                    selected={form.engine === "mustache"}
                    disabled={isEdit}
                    onSelect={() => form.engine !== "mustache" && setForm({ engine: "mustache", body_html: "" })}
                  />
                </div>
              </Section>

              {form.engine === "legacy" && (
                <Section title="Page setup" description="Paper used when the letter is printed or exported.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Paper size" htmlFor="tpl-paper">
                      <SearchableSelect id="tpl-paper" allowAll={false} widthClass="w-full" value={form.paper_size} onChange={(value) => setForm({ paper_size: value })} options={["A4", "Letter", "Legal"].map((value) => ({ value, label: value }))} />
                    </Field>
                    <Field label="Orientation" htmlFor="tpl-orient">
                      <SearchableSelect id="tpl-orient" allowAll={false} widthClass="w-full" value={form.orientation} onChange={(value) => setForm({ orientation: value })} options={[{ value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
                    </Field>
                  </div>
                </Section>
              )}

              <Section
                title="Body"
                description="Write the letter. Click Variables to insert a token at the cursor."
                wide
              >
                {form.engine === "legacy" ? (
                  <RichTextEditor
                    dir={dir}
                    value={form.body_html}
                    onChange={(v) => setForm({ body_html: v })}
                    placeholder="Dear {{employee_name}}, …"
                  />
                ) : (
                  <MarkdownEditor
                    dir={dir}
                    schema={schema}
                    value={form.body_html}
                    onChange={(v) => setForm({ body_html: v })}
                    placeholder={"# Heading\n\nDear {{employee_name}},\n\n{{#charges}}\n- {{.}}\n{{/charges}}"}
                  />
                )}
              </Section>

              <Section title="Workflow" description="What happens before and after the letter is issued.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.requires_e_signature && <div className="col-span-full space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-semibold">Signing order</p>
                    <p className="text-xs text-muted-foreground">Leave empty for employee-only signing. Matching orders sign together. Role keys must match your configured roles.</p>
                    {form.signature_signatories.map((signer, index) => <div key={index} className="flex flex-wrap items-center gap-2">
                      <select aria-label={`Signer ${index + 1} type`} className="h-9 rounded-md border px-2 text-sm" value={signer.type} onChange={(event) => setForm({ signature_signatories: form.signature_signatories.map((item, i) => i === index ? { type: event.target.value as "employee" | "role", sign_order: item.sign_order } : item) })}><option value="employee">Employee</option><option value="role">Role</option></select>
                      {signer.type === "role" && <Input aria-label={`Signer ${index + 1} role`} placeholder="Role key, e.g. hr_manager" className="w-48" value={signer.role ?? ""} onChange={(event) => setForm({ signature_signatories: form.signature_signatories.map((item, i) => i === index ? { ...item, role: event.target.value } : item) })} />}
                      <Input aria-label={`Signer ${index + 1} order`} type="number" min={1} max={10} className="w-20" value={signer.sign_order} onChange={(event) => setForm({ signature_signatories: form.signature_signatories.map((item, i) => i === index ? { ...item, sign_order: Number(event.target.value) } : item) })} />
                      <Button type="button" variant="ghost" onClick={() => setForm({ signature_signatories: form.signature_signatories.filter((_, i) => i !== index) })}>Remove</Button>
                    </div>)}
                    <Button type="button" variant="outline" disabled={form.signature_signatories.length >= 10} onClick={() => setForm({ signature_signatories: [...form.signature_signatories, { type: "employee", sign_order: Math.min(10, form.signature_signatories.length + 1) }] })}>Add signer</Button>
                  </div>}
                  {flags.map((f) => (
                    <ToggleRow
                      key={f.key}
                      icon={f.icon}
                      label={f.label}
                      description={f.description}
                      checked={form[f.key]}
                      onChange={(v) => setForm({ [f.key]: v } as Partial<FormState>)}
                    />
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}


        <DialogFooter className="items-center gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-between sm:space-x-0">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {form.engine === "mustache" ? "Mustache template" : "Legacy HTML template"}
          </p>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || busy} className="min-w-32">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={copy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre
        dir="auto"
        className="max-h-56 overflow-auto whitespace-pre-wrap break-words bg-muted/20 p-3 font-mono text-xs leading-5"
      >
        {code}
      </pre>
    </div>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        on ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full",
          on ? "bg-emerald-600 text-white" : "bg-muted",
        )}
      >
        {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      {label}
    </div>
  );
}

export type TemplateAction = "preview" | "activate" | "deactivate" | "delete" | "publish";

export function TemplateActionModal({ template, action, onClose, onSaved }: {
  template: LetterTemplate;
  action: TemplateAction;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const preview = usePreviewLetterTemplate(action === "preview" ? template.uuid : null);
  const activate = useActivateLetterTemplate();
  const deactivate = useDeactivateLetterTemplate();
  const remove = useDeleteLetterTemplate();
  const { publish } = useTemplatePublishing(template.uuid);

  const mutation = action === "activate" ? activate : action === "deactivate" ? deactivate : remove;
  const saving = action === "publish" ? publish.isPending : action !== "preview" && mutation.isPending;
  const error = action === "preview" ? preview.error : action === "publish" ? publish.error : mutation.error;
  useEffect(() => {
    if (error) showApiError(error, { id: `template-${action}-${template.uuid}` });
  }, [error, action, template.uuid]);
  const title = { preview: "Preview template", activate: "Activate template", deactivate: "Deactivate template", delete: "Delete template", publish: "Publish template" }[action];

  async function confirm() {
    if (saving) return;
    try {
      if (action === "publish") {
        const response = await publish.mutateAsync();
        onSaved(response.routedToReview ? "Submitted for review. The server requires approval before publication." : "Template published successfully.");
        return;
      }
      await mutation.mutateAsync(template.uuid);
      onSaved(action === "delete" ? "Template deleted successfully." : action === "activate" ? "Template activated successfully." : "Template deactivated successfully.");
    } catch {
      // The error toast is handled above; keep the dialog open for retry.
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", action === "preview" && "sm:max-w-4xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {template.name}{action === "preview" ? " — saved template rendered with its sample values." : ""}
          </DialogDescription>
        </DialogHeader>
        {action === "preview" ? (
          <div className="space-y-4">
            {preview.isFetching && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading preview…</p>}
            {preview.isError && <Button variant="outline" disabled={preview.isFetching} onClick={() => void preview.refetch()}>Retry preview</Button>}
            {preview.isSuccess && (
              <>
                <iframe
                  title={`Preview of ${template.name}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  className="h-[50vh] w-full rounded-md border bg-white"
                  srcDoc={`<!doctype html><html dir="${dirFor(template.language)}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{padding:24px;color:#111;font-family:Arial,sans-serif;overflow-wrap:anywhere}img{max-width:100%}</style></head><body>${preview.data.data.html}</body></html>`}
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Variables used</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.data.data.variables_used.map((variable, index) => <Badge key={`${variable}-${index}`} variant="secondary">{variable}</Badge>)}
                    {!preview.data.data.variables_used.length && <p className="text-sm text-muted-foreground">No variables used.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm">
            {action === "publish" ? "Publish the latest saved draft for use in new letters? If approval is required by the server, the draft will be submitted for review." : action === "delete" ? "Delete this company template? It will be removed from the template list." : action === "activate" ? "Activate this template for use? The server will validate its content first." : "Deactivate this template to stop it being selected for new letters?"}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>{action === "preview" ? "Close" : "Cancel"}</Button>
          {action !== "preview" && <Button variant={action === "delete" ? "destructive" : "default"} disabled={saving} onClick={() => void confirm()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{title}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateDetails({
  template, onClose,
}: { template: LetterTemplate; onClose: () => void }) {
  const facts: Array<[string, string]> = [
    ["Category", (template.category ?? "—").replace(/_/g, " ")],
    ["Language", LANGUAGES[template.language] ?? template.language],
    ["Engine", template.engine === "mustache" ? "Mustache (Markdown)" : "Legacy (HTML)"],
    ["Paper", `${template.paper_size ?? "A4"}, ${template.orientation ?? "portrait"}`],
    ["Signature policy", template.signature_policy ?? "Default"],
    ["Source", template.is_system_default ? "System default" : "Company template"],
    ["Created", formatDate(template.created_at)],
    ["Updated", formatDate(template.updated_at)],
  ];

  const blocks: Array<[string, string | null | undefined]> = [
    ["Header HTML", template.header_html],
    ["Body", template.body_html],
    ["Footer HTML", template.footer_html],
  ];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-5 pr-14 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg leading-tight">{template.name}</DialogTitle>
              <DialogDescription className="mt-1 font-mono text-xs">{template.template_key}</DialogDescription>
            </div>
            <span
              className={cn(
                "hidden shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium sm:inline-flex",
                template.is_active
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "border-zinc-200 bg-zinc-100 text-zinc-600",
              )}
            >
              {template.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <dl className="grid gap-x-6 gap-y-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium" title={value}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Workflow</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Flag label="Requires approval" on={template.requires_approval} />
              <Flag label="E-signature" on={template.requires_e_signature} />
              <Flag label="Series tracking" on={template.series_tracking} />
              <Flag label="Employee acknowledgement" on={Boolean(template.requires_employee_acknowledgement)} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Variables</h3>
            <div className="flex flex-wrap gap-1.5">
              {template.variables?.length ? (
                template.variables.map((v, i) => (
                  <Badge key={`${v}-${i}`} variant="secondary" className="font-mono text-xs font-normal">
                    {variableLabel(v)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">This template has no variables.</span>
              )}
            </div>
          </div>

          {template.variable_schema && (
            <CodeBlock label="Variable schema" code={JSON.stringify(template.variable_schema, null, 2)} />
          )}
          {blocks.map(([label, value]) => (value ? <CodeBlock key={label} label={label} code={value} /> : null))}
          {template.sample_values && (
            <CodeBlock label="Sample values" code={JSON.stringify(template.sample_values, null, 2)} />
          )}
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
