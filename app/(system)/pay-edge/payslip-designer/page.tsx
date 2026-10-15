"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  X,
  Save,
  Layout,
  Image as ImageIcon,
  User,
  Wallet,
  BarChart3,
  Palette,
  GripVertical,
  Eye,
  Trash2,
  Plus,
  QrCode,
  Smartphone,
  ShieldCheck,
  Info,
  FileText,
  Printer,
  Pencil,
  Search,
  Building2,
  CalendarDays,
  Layers,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ConfigSection =
  | "HEADER"
  | "EMPLOYEE"
  | "COMPONENTS"
  | "SUMMARY"
  | "FOOTER"
  | "STYLING";

type PayslipComponentType = "EARNING" | "DEDUCTION";

type TemplateStatus = "Draft" | "Published";

type PayslipComponent = {
  id: string;
  name: string;
  type: PayslipComponentType;
  amount: number;
};

type DesignerConfig = {
  companyName: string;
  companyAddress: string;
  companyNTN: string;
  payslipTitle: string;
  cycleLabel: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  bankLabel: string;
  showLogo: boolean;
  showAddress: boolean;
  showNTN: boolean;
  showEmployeeCode: boolean;
  showDept: boolean;
  showDesignation: boolean;
  showBank: boolean;
  showYTD: boolean;
  showEmployerShare: boolean;
  showQR: boolean;
  showSignature: boolean;
  fontFamily: string;
  paperSize: string;
  complianceText: string;
};

type PayslipTemplate = {
  id: string;
  name: string;
  code: string;
  status: TemplateStatus;
  version: string;
  updatedAt: string;
  primaryColor: string;
  config: DesignerConfig;
  components: PayslipComponent[];
};

const SECTION_ITEMS: {
  id: ConfigSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "HEADER", icon: Layout, label: "Header" },
  { id: "EMPLOYEE", icon: User, label: "Employee" },
  { id: "COMPONENTS", icon: Wallet, label: "Salary" },
  { id: "SUMMARY", icon: BarChart3, label: "YTD / CTC" },
  { id: "FOOTER", icon: Smartphone, label: "Footer" },
  { id: "STYLING", icon: Palette, label: "Branding" },
];

const DEFAULT_CONFIG: DesignerConfig = {
  companyName: "Flexi HRMS Pvt. Ltd.",
  companyAddress: "Software Technology Park, Islamabad, Pakistan",
  companyNTN: "1234567-8",
  payslipTitle: "Payslip",
  cycleLabel: "January 2025 Cycle",
  employeeName: "Sample Employee Name",
  employeeCode: "EMP-00127",
  department: "Engineering & Technology",
  designation: "Senior Professional Lead (G18)",
  bankLabel: "HBL • **** 7890",
  showLogo: true,
  showAddress: true,
  showNTN: true,
  showEmployeeCode: true,
  showDept: true,
  showDesignation: true,
  showBank: true,
  showYTD: true,
  showEmployerShare: false,
  showQR: true,
  showSignature: true,
  fontFamily: "Inter",
  paperSize: "A4 Portrait",
  complianceText:
    "Compliance verified against FBR slabs 2024-2025. This is a system generated document and does not require a physical stamp.",
};

const DEFAULT_COMPONENTS: PayslipComponent[] = [
  { id: "1", name: "Basic Salary", type: "EARNING", amount: 107500 },
  { id: "2", name: "House Rent Allowance", type: "EARNING", amount: 48375 },
  { id: "3", name: "Utilities", type: "EARNING", amount: 10750 },
  { id: "4", name: "Income Tax", type: "DEDUCTION", amount: 22500 },
  { id: "5", name: "Provident Fund", type: "DEDUCTION", amount: 7500 },
];

function cloneTemplate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateLabel() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTemplateTotals(template: PayslipTemplate) {
  const gross = template.components
    .filter((item) => item.type === "EARNING")
    .reduce((sum, item) => sum + item.amount, 0);

  const deductions = template.components
    .filter((item) => item.type === "DEDUCTION")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    gross,
    deductions,
    net: gross - deductions,
  };
}

function createTemplateCode(index: number) {
  return `PAY-${String(index).padStart(4, "0")}`;
}

function createDefaultTemplate(index = 1): PayslipTemplate {
  const now = Date.now().toString();

  return {
    id: now,
    name: "Corporate Standard",
    code: createTemplateCode(index),
    status: "Draft",
    version: "v1.0",
    updatedAt: formatDateLabel(),
    primaryColor: "#1E1B4B",
    config: cloneTemplate(DEFAULT_CONFIG),
    components: cloneTemplate(DEFAULT_COMPONENTS),
  };
}

const INITIAL_TEMPLATES: PayslipTemplate[] = [
  {
    id: "temp-1",
    name: "Corporate Standard",
    code: "PAY-0001",
    status: "Published",
    version: "v2.0",
    updatedAt: "Apr 02, 2026",
    primaryColor: "#1E1B4B",
    config: cloneTemplate(DEFAULT_CONFIG),
    components: cloneTemplate(DEFAULT_COMPONENTS),
  },
  {
    id: "temp-2",
    name: "Blue Executive Layout",
    code: "PAY-0002",
    status: "Draft",
    version: "v1.1",
    updatedAt: "Apr 01, 2026",
    primaryColor: "#2563EB",
    config: {
      ...cloneTemplate(DEFAULT_CONFIG),
      cycleLabel: "February 2025 Cycle",
      employeeName: "Bilal Khan",
      department: "Operations",
      designation: "Senior Executive",
    },
    components: cloneTemplate(DEFAULT_COMPONENTS),
  },
];

function StatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "Published"
          ? "border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 hover:bg-green-50"
          : "border-gray-200 bg-gray-100 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
      }
    >
      {status}
    </Badge>
  );
}

function ComponentTypeBadge({ type }: { type: PayslipComponentType }) {
  return (
    <Badge
      variant="outline"
      className={
        type === "EARNING"
          ? "border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 hover:bg-green-50"
          : "border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-50"
      }
    >
      {type}
    </Badge>
  );
}

function SectionButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[78px] flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
        active
          ? "border-brand-800 bg-brand-800 text-white shadow-sm"
          : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
      }`}
    >
      <Icon className="mb-1.5 h-4 w-4" />
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}

function ToggleRow({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-brand-200 bg-brand-100"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="pr-4">
        <div className="text-sm font-semibold text-brand-900">{label}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-brand-700">{description}</div>
        ) : null}
      </div>

      <div
        className={`relative h-5 w-10 rounded-full transition-all ${
          active ? "bg-brand-800" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            active ? "left-[22px]" : "left-[2px]"
          }`}
        />
      </div>
    </button>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-700">
      <span className="font-semibold text-brand-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function buildPrintHtml(template: PayslipTemplate) {
  const { gross, deductions, net } = getTemplateTotals(template);
  const earnings = template.components.filter((item) => item.type === "EARNING");
  const deductionRows = template.components.filter(
    (item) => item.type === "DEDUCTION"
  );

  const earningsHtml = earnings
    .map(
      (item) => `
        <div class="row">
          <span>${item.name}</span>
          <span>${formatCurrency(item.amount)}</span>
        </div>
      `
    )
    .join("");

  const deductionsHtml = deductionRows
    .map(
      (item) => `
        <div class="row">
          <span>${item.name}</span>
          <span>${formatCurrency(item.amount)}</span>
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${template.name}</title>
        <style>
          body {
            font-family: ${template.config.fontFamily}, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 28px;
          }
          .sheet {
            max-width: 860px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 36px;
          }
          .top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            border-bottom: 2px solid ${template.primaryColor};
            padding-bottom: 20px;
          }
          .company-title {
            font-size: 28px;
            font-weight: 700;
            color: ${template.primaryColor};
            margin: 0 0 6px 0;
          }
          .meta {
            font-size: 12px;
            color: #475569;
            margin: 4px 0;
            line-height: 1.6;
          }
          .title-box {
            text-align: right;
          }
          .title-box h2 {
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
          }
          .title-box p {
            margin: 6px 0 0;
            font-size: 13px;
            color: ${template.primaryColor};
            font-weight: 600;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-top: 28px;
          }
          .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: #64748b;
            font-weight: 600;
          }
          .value {
            font-size: 14px;
            font-weight: 600;
            margin-top: 6px;
            color: #0f172a;
          }
          .panel-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 28px;
          }
          .panel {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 18px;
          }
          .panel h4 {
            margin: 0 0 14px 0;
            font-size: 14px;
            font-weight: 700;
          }
          .row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            padding: 6px 0;
            color: #334155;
          }
          .total {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #e5e7eb;
            margin-top: 12px;
            padding-top: 12px;
            font-size: 13px;
            font-weight: 700;
          }
          .net-block {
            margin-top: 28px;
            background: ${template.primaryColor};
            color: white;
            border-radius: 16px;
            padding: 22px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 18px;
          }
          .net-block .small {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: rgba(255,255,255,.75);
            font-weight: 700;
          }
          .net-block .big {
            font-size: 34px;
            font-weight: 800;
            margin-top: 8px;
          }
          .footer {
            margin-top: 32px;
            border-top: 1px dashed #d1d5db;
            padding-top: 24px;
            display: flex;
            justify-content: space-between;
            gap: 24px;
          }
          .footer-text {
            font-size: 11px;
            color: #475569;
            line-height: 1.8;
            max-width: 440px;
          }
          .qr {
            width: 72px;
            height: 72px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #94a3b8;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
            .sheet {
              border: none;
              border-radius: 0;
              padding: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="top">
            <div>
              <h1 class="company-title">${template.config.companyName}</h1>
              ${
                template.config.showAddress
                  ? `<div class="meta">${template.config.companyAddress}</div>`
                  : ""
              }
              ${
                template.config.showNTN
                  ? `<div class="meta"><strong>NTN:</strong> ${template.config.companyNTN}</div>`
                  : ""
              }
            </div>

            <div class="title-box">
              <h2>${template.config.payslipTitle}</h2>
              <p>${template.config.cycleLabel}</p>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="label">Employee Name</div>
              <div class="value">${template.config.employeeName}</div>

              ${
                template.config.showEmployeeCode
                  ? `
                    <div style="margin-top:18px">
                      <div class="label">Employee Code</div>
                      <div class="value">${template.config.employeeCode}</div>
                    </div>
                  `
                  : ""
              }

              ${
                template.config.showDesignation
                  ? `
                    <div style="margin-top:18px">
                      <div class="label">Designation</div>
                      <div class="value">${template.config.designation}</div>
                    </div>
                  `
                  : ""
              }
            </div>

            <div>
              ${
                template.config.showDept
                  ? `
                    <div>
                      <div class="label">Department</div>
                      <div class="value">${template.config.department}</div>
                    </div>
                  `
                  : ""
              }

              ${
                template.config.showBank
                  ? `
                    <div style="margin-top:18px">
                      <div class="label">Bank Detail</div>
                      <div class="value">${template.config.bankLabel}</div>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="panel-grid">
            <div class="panel">
              <h4 style="color:#15803d">Earnings</h4>
              ${earningsHtml}
              <div class="total">
                <span>Gross Total</span>
                <span>${formatCurrency(gross)}</span>
              </div>
            </div>

            <div class="panel">
              <h4 style="color:#b91c1c">Deductions</h4>
              ${deductionsHtml}
              <div class="total">
                <span>Total Deductions</span>
                <span>(${formatCurrency(deductions)})</span>
              </div>
            </div>
          </div>

          <div class="net-block">
            <div>
              <div class="small">Net Payable Amount</div>
              <div class="big">PKR ${formatCurrency(net)}</div>
            </div>
            <div style="font-size:12px; color:rgba(255,255,255,.82); max-width:220px; text-align:right;">
              Generated from ${template.name}
            </div>
          </div>

          <div class="footer">
            <div>
              <div class="footer-text">${template.config.complianceText}</div>
              ${
                template.config.showSignature
                  ? `
                    <div style="margin-top:20px; color:${template.primaryColor}; font-style:italic; font-size:20px;">
                      Authorized Signatory
                    </div>
                    <div style="width:110px; height:1px; background:#d1d5db; margin-top:6px;"></div>
                  `
                  : ""
              }
            </div>

            ${
              template.config.showQR
                ? `
                  <div style="text-align:right">
                    <div class="qr">QR</div>
                    <div style="font-size:10px; color:#64748b; margin-top:8px;">
                      Verif Code: ${template.code}
                    </div>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      </body>
    </html>
  `;
}

function printTemplate(template: PayslipTemplate) {
  const html = buildPrintHtml(template);
  const win = window.open("", "_blank", "width=1100,height=900");

  if (!win) {
    alert("Unable to open print preview. Please allow popups for this site.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();

  setTimeout(() => {
    win.print();
  }, 300);
}

async function downloadPdfTemplate(template: PayslipTemplate) {
  const printHtml = buildPrintHtml(template);

  // Hidden iframe rendered at A4 width (794px @ 96dpi) so html2canvas can snapshot it
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not access iframe document");
    doc.open();
    doc.write(printHtml);
    doc.close();

    // Let fonts/images settle
    await new Promise((resolve) => setTimeout(resolve, 500));

    const body = doc.body;
    if (!body) throw new Error("Iframe body not ready");

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${template.name}-payslip.pdf`);

    toast.success("Payslip PDF downloaded");
  } catch (err) {
    console.error("downloadPdfTemplate failed", err);
    showApiError(err, { fallbackMessage: "Could not generate PDF. Please try again." });
  } finally {
    document.body.removeChild(iframe);
  }
}

function PayslipPreview({
  template,
}: {
  template: PayslipTemplate;
}) {
  const earnings = template.components.filter((item) => item.type === "EARNING");
  const deductions = template.components.filter(
    (item) => item.type === "DEDUCTION"
  );
  const { gross, deductions: deductionTotal, net } = getTemplateTotals(template);

  return (
    <div
      className="space-y-8 p-8 md:p-10"
      style={{ fontFamily: template.config.fontFamily }}
    >
      <div
        className="flex flex-col gap-6 border-b pb-6 md:flex-row md:items-start md:justify-between"
        style={{ borderColor: template.primaryColor }}
      >
        <div className="flex items-start gap-4">
          {template.config.showLogo ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-brand-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          ) : null}

          <div className="space-y-1">
            <div
              className="text-2xl font-bold tracking-tight"
              style={{ color: template.primaryColor }}
            >
              {template.config.companyName}
            </div>

            {template.config.showAddress ? (
              <p className="max-w-[380px] text-xs leading-5 text-brand-700">
                {template.config.companyAddress}
              </p>
            ) : null}

            {template.config.showNTN ? (
              <p className="text-xs font-semibold text-brand-700">
                NTN: {template.config.companyNTN}
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-xl font-bold uppercase tracking-wide text-brand-900">
            {template.config.payslipTitle}
          </div>
          <div
            className="mt-1 text-sm font-semibold"
            style={{ color: template.primaryColor }}
          >
            {template.config.cycleLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Employee Name
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-900">
              {template.config.employeeName}
            </p>
          </div>

          {template.config.showEmployeeCode ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Employee Code
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-brand-900">
                {template.config.employeeCode}
              </p>
            </div>
          ) : null}

          {template.config.showDesignation ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Designation
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-900">
                {template.config.designation}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-l-0 md:border-l md:border-gray-200 md:pl-6">
          {template.config.showDept ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Department
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-900">
                {template.config.department}
              </p>
            </div>
          ) : null}

          {template.config.showBank ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Bank Detail
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-brand-900">
                {template.config.bankLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {earnings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-brand-700">{item.name}</span>
                <span className="font-mono font-semibold text-brand-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-brand-900">
              <span>Gross Total</span>
              <span className="font-mono">{formatCurrency(gross)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700">
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {deductions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-brand-700">{item.name}</span>
                <span className="font-mono font-semibold text-brand-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-brand-900">
              <span>Total Deductions</span>
              <span className="font-mono">({formatCurrency(deductionTotal)})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="flex flex-col gap-4 rounded-2xl p-6 text-white shadow-sm md:flex-row md:items-center md:justify-between"
        style={{ backgroundColor: template.primaryColor }}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Net Payable Amount
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            PKR {formatCurrency(net)}
          </p>
        </div>

        <div className="max-w-[220px] text-sm text-white/80 md:text-right">
          Generated from {template.name}
        </div>
      </div>

      {(template.config.showYTD || template.config.showEmployerShare) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {template.config.showYTD ? (
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-brand-900">
                  Year-to-Date (YTD)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-0 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-700">Tax Paid</span>
                  <span className="font-semibold text-brand-900">185K</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-700">Total Gross</span>
                  <span className="font-semibold text-brand-900">1.5M</span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {template.config.showEmployerShare ? (
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-brand-900">
                  Employer Contributions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-0 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-700">PF ER</span>
                  <span className="font-semibold text-brand-900">7.5K</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-700">EOBI ER</span>
                  <span className="font-semibold text-brand-900">540</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <div className="border-t border-dashed border-gray-200 pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-green-600" />
              <p className="max-w-[400px] text-xs leading-6 text-brand-700">
                {template.config.complianceText}
              </p>
            </div>

            {template.config.showSignature ? (
              <div className="pt-2">
                <p
                  className="text-xl italic opacity-70"
                  style={{ color: template.primaryColor }}
                >
                  Authorized Signatory
                </p>
                <div className="mt-1 h-px w-28 bg-gray-300" />
              </div>
            ) : null}
          </div>

          {template.config.showQR ? (
            <div className="space-y-2 text-right">
              <div className="ml-auto flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-brand-400">
                <QrCode className="h-10 w-10" strokeWidth={1.2} />
              </div>
              <p className="text-[10px] font-mono text-brand-700">
                Verif Code: {template.code}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TemplateDesignerDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  onSave,
  onPrint,
  onDownloadPdf,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: PayslipTemplate | null;
  setDraft: React.Dispatch<React.SetStateAction<PayslipTemplate | null>>;
  onSave: () => void;
  onPrint: (template: PayslipTemplate) => void;
  onDownloadPdf: (template: PayslipTemplate) => void;
  isEditing: boolean;
}) {
  const [activeSection, setActiveSection] =
    useState<ConfigSection>("HEADER");

  if (!draft) return null;

  const updateMeta = <K extends keyof PayslipTemplate>(
    key: K,
    value: PayslipTemplate[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateConfig = <K extends keyof DesignerConfig>(
    key: K,
    value: DesignerConfig[K]
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            config: {
              ...prev.config,
              [key]: value,
            },
          }
        : prev
    );
  };

  const updateComponent = (
    id: string,
    key: keyof PayslipComponent,
    value: string | number
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: prev.components.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          }
        : prev
    );
  };

  const addPlaceholder = () => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: [
              ...prev.components,
              {
                id: String(Date.now()),
                name: "New Component",
                type: "EARNING",
                amount: 0,
              },
            ],
          }
        : prev
    );
  };

  const removeComponent = (id: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: prev.components.filter((item) => item.id !== id),
          }
        : prev
    );
  };

  const totals = getTemplateTotals(draft);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[94vh] w-[98vw] min-w-[90vw] mx-auto overflow-y-auto  border border-gray-200 bg-white p-0"
        key={draft.id}
      >
        <div className="flex h-full flex-col">
          {/* modal header */}
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-200 text-brand-700 hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <FileText className="h-5 w-5 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-brand-900">
                      {isEditing ? "Edit Payslip Template" : "Create Payslip Template"}
                    </h2>
                    <Badge className="border-transparent bg-brand-100 text-[10px] font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-100">
                      Designer
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Configure template layout, preview, print, and save
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onPrint(draft)}
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onDownloadPdf(draft)}
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>

                <Button
                  variant="outline"
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>

                <Button
                  onClick={onSave}
                  className="bg-brand-800 text-white hover:bg-brand-900"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </div>
          </div>

          {/* main content */}
          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)]">
            {/* left panel */}
            <div className="overflow-y-auto border-r border-gray-200 bg-white p-4">
              <div className="space-y-6">
                {/* meta */}
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-base font-semibold text-brand-900">
                      Template Details
                    </CardTitle>
                    <CardDescription className="text-sm text-brand-700">
                      Basic identity shown in the listing
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 p-4">
                    <FieldBlock label="Template Name">
                      <Input
                        value={draft.name}
                        onChange={(e) => updateMeta("name", e.target.value)}
                        className="border-gray-200 w-full text-brand-900"
                      />
                    </FieldBlock>

                    <div className="grid grid-cols-2 gap-3">
                      <FieldBlock label="Template Code">
                        <Input
                          value={draft.code}
                          onChange={(e) => updateMeta("code", e.target.value)}
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Version">
                        <Input
                          value={draft.version}
                          onChange={(e) => updateMeta("version", e.target.value)}
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>
                    </div>

                    <FieldBlock label="Status">
                      <Select
                        value={draft.status}
                        onValueChange={(value) =>
                          updateMeta("status", value as TemplateStatus)
                        }
                      >
                        <SelectTrigger className="border-gray-200 w-full text-brand-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                  </CardContent>
                </Card>

                {/* section selector */}
                <div className="grid grid-cols-3 gap-2">
                  {SECTION_ITEMS.map((section) => (
                    <SectionButton
                      key={section.id}
                      active={activeSection === section.id}
                      icon={section.icon}
                      label={section.label}
                      onClick={() => setActiveSection(section.id)}
                    />
                  ))}
                </div>

                {/* summary */}
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatPill
                        label="Components"
                        value={draft.components.length}
                      />
                      <div className="h-3 w-px bg-brand-300" />
                      <StatPill
                        label="Net Pay"
                        value={`PKR ${formatCurrency(totals.net)}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* dynamic config */}
                <div className="space-y-5">
                  {activeSection === "HEADER" && (
                    <>
                      <Card className="border border-dashed border-gray-200 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center gap-2 p-5 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div className="text-sm font-semibold text-brand-900">
                            Upload Company Logo
                          </div>
                          <div className="text-xs text-brand-700">
                            PNG / JPG · Max 2MB
                          </div>
                          <Button
                            variant="outline"
                            className="mt-2 border-gray-200 text-brand-800 hover:bg-brand-100"
                          >
                            Choose File
                          </Button>
                        </CardContent>
                      </Card>

                      <FieldBlock label="Company Name">
                        <Input
                          value={draft.config.companyName}
                          onChange={(e) =>
                            updateConfig("companyName", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Payslip Title">
                        <Input
                          value={draft.config.payslipTitle}
                          onChange={(e) =>
                            updateConfig("payslipTitle", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Cycle Label">
                        <Input
                          value={draft.config.cycleLabel}
                          onChange={(e) =>
                            updateConfig("cycleLabel", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Company Address">
                        <Textarea
                          value={draft.config.companyAddress}
                          onChange={(e) =>
                            updateConfig("companyAddress", e.target.value)
                          }
                          className="min-h-[90px] border-gray-200 text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="NTN Number">
                        <Input
                          value={draft.config.companyNTN}
                          onChange={(e) =>
                            updateConfig("companyNTN", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <div className="space-y-2">
                        <ToggleRow
                          label="Show Logo"
                          active={draft.config.showLogo}
                          onClick={() =>
                            updateConfig("showLogo", !draft.config.showLogo)
                          }
                        />
                        <ToggleRow
                          label="Show Company Address"
                          active={draft.config.showAddress}
                          onClick={() =>
                            updateConfig(
                              "showAddress",
                              !draft.config.showAddress
                            )
                          }
                        />
                        <ToggleRow
                          label="Show NTN Number"
                          active={draft.config.showNTN}
                          onClick={() =>
                            updateConfig("showNTN", !draft.config.showNTN)
                          }
                        />
                      </div>
                    </>
                  )}

                  {activeSection === "EMPLOYEE" && (
                    <>
                      <FieldBlock label="Employee Name">
                        <Input
                          value={draft.config.employeeName}
                          onChange={(e) =>
                            updateConfig("employeeName", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Employee Code">
                        <Input
                          value={draft.config.employeeCode}
                          onChange={(e) =>
                            updateConfig("employeeCode", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Department">
                        <Input
                          value={draft.config.department}
                          onChange={(e) =>
                            updateConfig("department", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Designation">
                        <Input
                          value={draft.config.designation}
                          onChange={(e) =>
                            updateConfig("designation", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <FieldBlock label="Bank Detail">
                        <Input
                          value={draft.config.bankLabel}
                          onChange={(e) =>
                            updateConfig("bankLabel", e.target.value)
                          }
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>

                      <div className="space-y-2">
                        <ToggleRow
                          label="Show Employee Code"
                          active={draft.config.showEmployeeCode}
                          onClick={() =>
                            updateConfig(
                              "showEmployeeCode",
                              !draft.config.showEmployeeCode
                            )
                          }
                        />
                        <ToggleRow
                          label="Show Department"
                          active={draft.config.showDept}
                          onClick={() =>
                            updateConfig("showDept", !draft.config.showDept)
                          }
                        />
                        <ToggleRow
                          label="Show Designation"
                          active={draft.config.showDesignation}
                          onClick={() =>
                            updateConfig(
                              "showDesignation",
                              !draft.config.showDesignation
                            )
                          }
                        />
                        <ToggleRow
                          label="Show Bank Account"
                          active={draft.config.showBank}
                          onClick={() =>
                            updateConfig("showBank", !draft.config.showBank)
                          }
                        />
                      </div>
                    </>
                  )}

                  {activeSection === "COMPONENTS" && (
                    <>
                      <Card className="border border-blue-100 bg-blue-50 shadow-none">
                        <CardContent className="flex items-start gap-3 p-4">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          <p className="text-sm leading-6 text-blue-800">
                            Add earnings and deductions here. These values are
                            reflected instantly in the preview and in printed
                            output.
                          </p>
                        </CardContent>
                      </Card>

                      <div className="space-y-3">
                        {draft.components.map((item) => (
                          <Card
                            key={item.id}
                            className="border border-gray-200 shadow-none"
                          >
                            <CardContent className="space-y-3 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-brand-400" />
                                  <ComponentTypeBadge type={item.type} />
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeComponent(item.id)}
                                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <FieldBlock label="Component Name">
                                <Input
                                  value={item.name}
                                  onChange={(e) =>
                                    updateComponent(
                                      item.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="border-gray-200 w-full text-brand-900"
                                />
                              </FieldBlock>

                              <div className="grid grid-cols-2 gap-3">
                                <FieldBlock label="Type">
                                  <Select
                                    value={item.type}
                                    onValueChange={(value) =>
                                      updateComponent(
                                        item.id,
                                        "type",
                                        value as PayslipComponentType
                                      )
                                    }
                                  >
                                    <SelectTrigger className="border-gray-200 w-full text-brand-900">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EARNING">
                                        Earning
                                      </SelectItem>
                                      <SelectItem value="DEDUCTION">
                                        Deduction
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FieldBlock>

                                <FieldBlock label="Amount">
                                  <Input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) =>
                                      updateComponent(
                                        item.id,
                                        "amount",
                                        Number(e.target.value || 0)
                                      )
                                    }
                                    className="border-gray-200 w-full text-brand-900"
                                  />
                                </FieldBlock>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={addPlaceholder}
                        className="w-full border-dashed border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Placeholder
                      </Button>
                    </>
                  )}

                  {activeSection === "SUMMARY" && (
                    <>
                      <Card className="border border-gray-200 shadow-none">
                        <CardContent className="grid grid-cols-2 gap-3 p-4">
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                              Gross Total
                            </div>
                            <div className="mt-1 text-sm font-semibold text-brand-900">
                              PKR {formatCurrency(totals.gross)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                              Net Pay
                            </div>
                            <div className="mt-1 text-sm font-semibold text-brand-900">
                              PKR {formatCurrency(totals.net)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <ToggleRow
                          label="Show YTD Totals"
                          active={draft.config.showYTD}
                          onClick={() =>
                            updateConfig("showYTD", !draft.config.showYTD)
                          }
                        />
                        <ToggleRow
                          label="Show Employer Contributions"
                          active={draft.config.showEmployerShare}
                          onClick={() =>
                            updateConfig(
                              "showEmployerShare",
                              !draft.config.showEmployerShare
                            )
                          }
                        />
                      </div>
                    </>
                  )}

                  {activeSection === "FOOTER" && (
                    <>
                      <FieldBlock label="Footer Compliance Text">
                        <Textarea
                          value={draft.config.complianceText}
                          onChange={(e) =>
                            updateConfig("complianceText", e.target.value)
                          }
                          className="min-h-[120px] border-gray-200 text-brand-900"
                        />
                      </FieldBlock>

                      <div className="space-y-2">
                        <ToggleRow
                          label="Include QR Verification"
                          active={draft.config.showQR}
                          onClick={() =>
                            updateConfig("showQR", !draft.config.showQR)
                          }
                        />
                        <ToggleRow
                          label="Include Digital Signature"
                          active={draft.config.showSignature}
                          onClick={() =>
                            updateConfig(
                              "showSignature",
                              !draft.config.showSignature
                            )
                          }
                        />
                      </div>
                    </>
                  )}

                  {activeSection === "STYLING" && (
                    <>
                      <FieldBlock label="Primary Brand Color">
                        <div className="flex flex-wrap gap-2">
                          {[
                            "#1E1B4B",
                            "#0F766E",
                            "#2563EB",
                            "#7C3AED",
                            "#B45309",
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateMeta("primaryColor", color)}
                              className={`h-9 w-9 rounded-full border-4 ${
                                draft.primaryColor === color
                                  ? "border-gray-300"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </FieldBlock>

                      <div className="grid grid-cols-2 gap-3">
                        <FieldBlock label="Paper Size">
                          <Select
                            value={draft.config.paperSize}
                            onValueChange={(value) =>
                              updateConfig("paperSize", value)
                            }
                          >
                            <SelectTrigger className="border-gray-200 w-full text-brand-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4 Portrait">
                                A4 Portrait
                              </SelectItem>
                              <SelectItem value="A5 Landscape">
                                A5 Landscape
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldBlock>

                        <FieldBlock label="Base Font">
                          <Select
                            value={draft.config.fontFamily}
                            onValueChange={(value) =>
                              updateConfig("fontFamily", value)
                            }
                          >
                            <SelectTrigger className="border-gray-200 w-full text-brand-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldBlock>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* right preview */}
            <div className="overflow-y-auto bg-gray-100 p-6">
              <div className="mx-auto max-w-[820px] rounded-xl border border-gray-200 bg-white shadow-sm">
                <PayslipPreview template={draft} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayslipTemplateManagementPage() {
  const [templates, setTemplates] =
    useState<PayslipTemplate[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [designerOpen, setDesignerOpen] = useState(false);
  const [draft, setDraft] = useState<PayslipTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(q) ||
        template.code.toLowerCase().includes(q) ||
        template.status.toLowerCase().includes(q) ||
        template.config.paperSize.toLowerCase().includes(q) ||
        template.config.fontFamily.toLowerCase().includes(q)
    );
  }, [search, templates]);

  const stats = useMemo(() => {
    const published = templates.filter((item) => item.status === "Published").length;
    const draftCount = templates.filter((item) => item.status === "Draft").length;

    return {
      total: templates.length,
      published,
      draft: draftCount,
    };
  }, [templates]);

  const openCreate = () => {
    const newTemplate = createDefaultTemplate(templates.length + 1);
    setDraft(newTemplate);
    setEditingId(null);
    setDesignerOpen(true);
  };

  const openEdit = (template: PayslipTemplate) => {
    setDraft(cloneTemplate(template));
    setEditingId(template.id);
    setDesignerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!draft) return;

    if (!draft.name.trim()) {
      alert("Template name is required.");
      return;
    }

    if (!draft.code.trim()) {
      alert("Template code is required.");
      return;
    }

    const updatedDraft: PayslipTemplate = {
      ...draft,
      updatedAt: formatDateLabel(),
    };

    if (editingId) {
      setTemplates((prev) =>
        prev.map((item) => (item.id === editingId ? updatedDraft : item))
      );
    } else {
      setTemplates((prev) => [updatedDraft, ...prev]);
    }

    setDesignerOpen(false);
    setDraft(null);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* header */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <FileText className="h-5 w-5 text-white" />
                </div>

                <div>
                  <CardTitle className="text-2xl font-bold text-brand-900">
                    Payslip Templates
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-sm text-brand-700">
                    Create, manage, edit, delete, and print payslip designs
                  </CardDescription>
                </div>
              </div>

              <Button
                onClick={openCreate}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* search + stats */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by template name, code, status, paper size..."
                  className="border-gray-200 pl-10 text-brand-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  All Templates
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Latest First
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {filteredTemplates.length}
                  </span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">
                    {templates.length}
                  </span>
                  <span className="text-brand-700"> templates</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatPill label="Total" value={stats.total} />
                  <div className="h-3 w-px bg-brand-300" />
                  <StatPill label="Published" value={stats.published} />
                  <div className="h-3 w-px bg-brand-300" />
                  <StatPill label="Draft" value={stats.draft} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* listing */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="border-b border-gray-200 hover:bg-white">
                  <TableHead className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Sr.
                  </TableHead>
                  <TableHead className="min-w-[240px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Template
                  </TableHead>
                  <TableHead className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Code
                  </TableHead>
                  <TableHead className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Paper / Font
                  </TableHead>
                  <TableHead className="w-[110px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Components
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Net Pay
                  </TableHead>
                  <TableHead className="w-[130px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Updated
                  </TableHead>
                  <TableHead className="w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="bg-white">
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <FileText className="h-6 w-6 text-brand-700" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No payslip templates found
                        </p>
                        <p className="text-sm text-brand-700">
                          Create a new template to get started.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template, index) => {
                    const totals = getTemplateTotals(template);

                    return (
                      <TableRow
                        key={template.id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-brand-100"
                      >
                        <TableCell className="px-4 py-3.5 text-sm font-semibold text-brand-900">
                          {String(index + 1).padStart(2, "0")}
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                              style={{ backgroundColor: template.primaryColor }}
                            >
                              <Building2 className="h-4 w-4" />
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-brand-900">
                                {template.name}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                {template.config.companyName}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <span className="inline-flex rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-brand-900">
                            {template.code}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-brand-900">
                              {template.config.paperSize}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {template.config.fontFamily}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center">
                          <span className="text-sm font-semibold text-brand-900">
                            {template.components.length}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          <span className="font-mono text-sm font-semibold text-brand-900">
                            PKR {formatCurrency(totals.net)}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="text-sm font-semibold text-brand-900">
                            {template.updatedAt}
                          </div>
                          <div className="text-[11px] text-brand-700">
                            {template.version}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <StatusBadge status={template.status} />
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => printTemplate(template)}
                              className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadPdfTemplate(template)}
                              className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(template)}
                              className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(template.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <TemplateDesignerDialog
        open={designerOpen}
        onOpenChange={(open) => {
          setDesignerOpen(open);
          if (!open) {
            setDraft(null);
            setEditingId(null);
          }
        }}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onPrint={printTemplate}
        onDownloadPdf={downloadPdfTemplate}
        isEditing={Boolean(editingId)}
      />
    </div>
  );
}