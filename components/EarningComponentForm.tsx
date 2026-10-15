import React, { useMemo, useState } from "react";
import {
  Save,
  Info,
  Settings2,
  Calculator,
  ShieldCheck,
  Calendar,
  Percent,
  Landmark,
  Layers,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EarningComponentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
   initialData?: any; 
}

type FormTab = "BASIC" | "CALCULATION" | "RULES" | "FLAGS";

type EarningFormData = {
  code: string;
  name: string;
  category: string;
  status: "Active" | "Inactive";
  calculationType: "Fixed Amount" | "% of Basic" | "% of Gross" | "Custom Formula";
  value: string;
  frequency: "Monthly" | "Quarterly" | "Annual" | "Ad-hoc";
  prorateOnAttendance: boolean;
  roundToNearest10: boolean;
  minCap: string;
  maxCap: string;
  effectiveFrom: string;
  eligibilityRules: string;
  taxable: boolean;
  impactEobi: boolean;
  impactSocialSecurity: boolean;
  impactPf: boolean;
  partOfOtBase: boolean;
  partOfGratuity: boolean;
  partOfLeaveEncashment: boolean;
  description: string;
};

const defaultForm: EarningFormData = {
  code: "",
  name: "",
  category: "Allowance",
  status: "Active",
  calculationType: "Fixed Amount",
  value: "",
  frequency: "Monthly",
  prorateOnAttendance: false,
  roundToNearest10: true,
  minCap: "",
  maxCap: "",
  effectiveFrom: "",
  eligibilityRules: "",
  taxable: true,
  impactEobi: true,
  impactSocialSecurity: false,
  impactPf: true,
  partOfOtBase: true,
  partOfGratuity: true,
  partOfLeaveEncashment: false,
  description: "",
};

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="text-xs text-brand-700 mt-1">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`w-11 h-6 rounded-full px-1 flex items-center transition-all ${
          checked ? "bg-brand-800 justify-end" : "bg-gray-200 justify-start"
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}

export const EarningComponentForm: React.FC<EarningComponentFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<FormTab>("BASIC");
  const [form, setForm] = useState<EarningFormData>(defaultForm);

  const tabs: FormTab[] = ["BASIC", "CALCULATION", "RULES", "FLAGS"];

  const calculationPreview = useMemo(() => {
    if (form.calculationType === "Fixed Amount") {
      return form.value ? `Fixed value: ${form.value}` : "Fixed value";
    }
    if (form.calculationType === "% of Basic") {
      return form.value ? `${form.value}% of Basic Salary` : "% of Basic Salary";
    }
    if (form.calculationType === "% of Gross") {
      return form.value ? `${form.value}% of Gross Salary` : "% of Gross Salary";
    }
    return "Custom payroll formula";
  }, [form.calculationType, form.value]);

  const handleSave = () => {
    onSave(form);
    setForm(defaultForm);
    setActiveTab("BASIC");
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm);
    setActiveTab("BASIC");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl border border-gray-200 bg-white p-0 overflow-hidden">
        <div className="bg-brand-900 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 opacity-80" />
              Add Earning Component
            </DialogTitle>
            <DialogDescription className="text-brand-200 text-xs">
              Configure a new earning component using your payroll design pattern.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-b border-gray-200 px-6 bg-white">
          <div className="flex items-center gap-2 flex-wrap py-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-brand-800 text-white"
                    : "text-brand-700 hover:bg-brand-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
          {activeTab === "BASIC" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Component Code</label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. HRA01"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value as "Active" | "Inactive" }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-800">Component Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. House Rent Allowance"
                  className="border-gray-200 text-brand-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Fixed Salary">Fixed Salary</option>
                    <option value="Variable / Performance">Variable / Performance</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Bonus / One-time">Bonus / One-time</option>
                    <option value="Reimbursement">Reimbursement</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Description</label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Short component description"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-brand-100 p-4 flex gap-3">
                <Info className="h-4 w-4 text-brand-800 mt-0.5 shrink-0" />
                <p className="text-sm text-brand-800">
                  This category controls where the earning is grouped in payroll, reporting, and summaries.
                </p>
              </div>
            </div>
          )}

          {activeTab === "CALCULATION" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-800">Calculation Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: "Fixed Amount", label: "Fixed Amount", icon: Calculator },
                    { id: "% of Basic", label: "% of Basic", icon: Percent },
                    { id: "% of Gross", label: "% of Gross", icon: Layers },
                    { id: "Custom Formula", label: "Custom Formula", icon: Settings2 },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          calculationType: type.id as EarningFormData["calculationType"],
                        }))
                      }
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                        form.calculationType === type.id
                          ? "border-brand-800 bg-brand-100"
                          : "border-gray-200 hover:bg-brand-50"
                      }`}
                    >
                      <type.icon className="h-4 w-4 text-brand-800" />
                      <span className="text-sm font-medium text-brand-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Value / Percentage</label>
                  <Input
                    value={form.value}
                    onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                    placeholder="0.00"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        frequency: e.target.value as EarningFormData["frequency"],
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <p className="text-sm font-semibold text-brand-900 mb-2">Calculation Preview</p>
                <p className="text-sm text-brand-700">{calculationPreview}</p>
              </div>

              <div className="space-y-3">
                <ToggleRow
                  title="Prorate based on attendance"
                  subtitle="Reduce component if attendance rules require proration."
                  checked={form.prorateOnAttendance}
                  onChange={() =>
                    setForm((p) => ({ ...p, prorateOnAttendance: !p.prorateOnAttendance }))
                  }
                />
                <ToggleRow
                  title="Round to nearest PKR 10"
                  subtitle="Apply a standard rounding rule during payroll processing."
                  checked={form.roundToNearest10}
                  onChange={() => setForm((p) => ({ ...p, roundToNearest10: !p.roundToNearest10 }))}
                />
              </div>
            </div>
          )}

          {activeTab === "RULES" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Minimum Cap</label>
                  <Input
                    value={form.minCap}
                    onChange={(e) => setForm((p) => ({ ...p, minCap: e.target.value }))}
                    placeholder="PKR amount"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Maximum Cap</label>
                  <Input
                    value={form.maxCap}
                    onChange={(e) => setForm((p) => ({ ...p, maxCap: e.target.value }))}
                    placeholder="PKR amount"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-800">Effective From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
                    className="pl-10 border-gray-200 text-brand-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-800">Eligibility Rules</label>
                <textarea
                  value={form.eligibilityRules}
                  onChange={(e) => setForm((p) => ({ ...p, eligibilityRules: e.target.value }))}
                  rows={5}
                  placeholder="Write eligibility conditions, grade rules, or employment criteria..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "FLAGS" && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                  Statutory Compliance
                </h4>
                <div className="space-y-3">
                  <ToggleRow
                    title="Taxable Component"
                    subtitle="Include this earning in income tax calculations."
                    checked={form.taxable}
                    onChange={() => setForm((p) => ({ ...p, taxable: !p.taxable }))}
                  />
                  <ToggleRow
                    title="Impact EOBI Contribution"
                    subtitle="Use this component in EOBI-related calculations."
                    checked={form.impactEobi}
                    onChange={() => setForm((p) => ({ ...p, impactEobi: !p.impactEobi }))}
                  />
                  <ToggleRow
                    title="Impact Social Security"
                    subtitle="Use this component for social security contribution logic."
                    checked={form.impactSocialSecurity}
                    onChange={() =>
                      setForm((p) => ({ ...p, impactSocialSecurity: !p.impactSocialSecurity }))
                    }
                  />
                  <ToggleRow
                    title="Impact Provident Fund"
                    subtitle="Use this component when PF contribution is calculated."
                    checked={form.impactPf}
                    onChange={() => setForm((p) => ({ ...p, impactPf: !p.impactPf }))}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-brand-800" />
                  Internal Policy Flags
                </h4>
                <div className="space-y-3">
                  <ToggleRow
                    title="Part of OT Base"
                    subtitle="Use this earning for overtime base calculations."
                    checked={form.partOfOtBase}
                    onChange={() => setForm((p) => ({ ...p, partOfOtBase: !p.partOfOtBase }))}
                  />
                  <ToggleRow
                    title="Part of Gratuity Base"
                    subtitle="Use this earning in gratuity-related calculations."
                    checked={form.partOfGratuity}
                    onChange={() => setForm((p) => ({ ...p, partOfGratuity: !p.partOfGratuity }))}
                  />
                  <ToggleRow
                    title="Part of Leave Encashment"
                    subtitle="Use this earning in leave encashment formulas."
                    checked={form.partOfLeaveEncashment}
                    onChange={() =>
                      setForm((p) => ({ ...p, partOfLeaveEncashment: !p.partOfLeaveEncashment }))
                    }
                  />
                </div>
              </section>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button className="bg-brand-800 text-white hover:bg-brand-900" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};