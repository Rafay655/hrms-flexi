import React, { useMemo, useState } from "react";
import {
  Save,
  AlertTriangle,
  Settings2,
  Calculator,
  ShieldCheck,
  Percent,
  Layers,
  Link2,
  MinusCircle,
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

interface DeductionComponentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
   initialData?: any; 
}

type FormTab = "BASIC" | "CALCULATION" | "RECOVERY" | "FLAGS";

type DeductionFormData = {
  code: string;
  name: string;
  category: string;
  status: "Active" | "Inactive";
  calculationType: "Fixed Amount" | "% of Gross" | "Slab-based" | "Custom Formula";
  value: string;
  frequency: "Monthly" | "Annual" | "Ad-hoc";
  slabThreshold: string;
  slabRate: string;
  slabFixedAmount: string;
  recoveryPriority: string;
  maxPercentOfGross: string;
  capAtNetSalary: boolean;
  stopWhenZero: boolean;
  isStatutory: boolean;
  linkToLoanModule: boolean;
  linkToTaxEngine: boolean;
  preTaxDeduction: boolean;
  description: string;
};

const defaultForm: DeductionFormData = {
  code: "",
  name: "",
  category: "Statutory (Tax/EOBI)",
  status: "Active",
  calculationType: "Fixed Amount",
  value: "",
  frequency: "Monthly",
  slabThreshold: "",
  slabRate: "",
  slabFixedAmount: "",
  recoveryPriority: "1",
  maxPercentOfGross: "50",
  capAtNetSalary: true,
  stopWhenZero: true,
  isStatutory: true,
  linkToLoanModule: false,
  linkToTaxEngine: true,
  preTaxDeduction: false,
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

export const DeductionComponentForm: React.FC<DeductionComponentFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<FormTab>("BASIC");
  const [form, setForm] = useState<DeductionFormData>(defaultForm);

  const tabs: FormTab[] = ["BASIC", "CALCULATION", "RECOVERY", "FLAGS"];

  const calculationPreview = useMemo(() => {
    if (form.calculationType === "Fixed Amount") {
      return form.value ? `Fixed value: ${form.value}` : "Fixed deduction";
    }
    if (form.calculationType === "% of Gross") {
      return form.value ? `${form.value}% of Gross Salary` : "% of Gross Salary";
    }
    if (form.calculationType === "Slab-based") {
      return "Calculated using configured slab thresholds";
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
              <MinusCircle className="h-4 w-4 opacity-80" />
              Add Deduction Component
            </DialogTitle>
            <DialogDescription className="text-brand-200 text-xs">
              Configure statutory and non-statutory deduction components using modal flow.
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
                    placeholder="e.g. TAX01"
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
                  placeholder="e.g. Income Tax"
                  className="border-gray-200 text-brand-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Deduction Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Statutory (Tax/EOBI)">Statutory (Tax/EOBI)</option>
                    <option value="Loan Recovery">Loan Recovery</option>
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Disciplinary Penalty">Disciplinary Penalty</option>
                    <option value="Voluntary Contribution">Voluntary Contribution</option>
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
                <AlertTriangle className="h-4 w-4 text-brand-800 mt-0.5 shrink-0" />
                <p className="text-sm text-brand-800">
                  Statutory deductions may directly affect compliance and payroll audit reports.
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
                    { id: "% of Gross", label: "% of Gross", icon: Percent },
                    { id: "Slab-based", label: "Slab-based", icon: Layers },
                    { id: "Custom Formula", label: "Custom Formula", icon: Settings2 },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          calculationType: type.id as DeductionFormData["calculationType"],
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
                        frequency: e.target.value as DeductionFormData["frequency"],
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <p className="text-sm font-semibold text-brand-900 mb-2">Calculation Preview</p>
                <p className="text-sm text-brand-700">{calculationPreview}</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-4">
                <p className="text-sm font-semibold text-brand-900">Slab Configuration</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800">Threshold</label>
                    <Input
                      value={form.slabThreshold}
                      onChange={(e) => setForm((p) => ({ ...p, slabThreshold: e.target.value }))}
                      placeholder="e.g. 600000"
                      className="border-gray-200 text-brand-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800">Rate %</label>
                    <Input
                      value={form.slabRate}
                      onChange={(e) => setForm((p) => ({ ...p, slabRate: e.target.value }))}
                      placeholder="e.g. 5"
                      className="border-gray-200 text-brand-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800">Fixed PKR</label>
                    <Input
                      value={form.slabFixedAmount}
                      onChange={(e) => setForm((p) => ({ ...p, slabFixedAmount: e.target.value }))}
                      placeholder="e.g. 0"
                      className="border-gray-200 text-brand-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "RECOVERY" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Recovery Priority</label>
                  <Input
                    value={form.recoveryPriority}
                    onChange={(e) => setForm((p) => ({ ...p, recoveryPriority: e.target.value }))}
                    placeholder="1 = highest"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Max % of Gross</label>
                  <Input
                    value={form.maxPercentOfGross}
                    onChange={(e) => setForm((p) => ({ ...p, maxPercentOfGross: e.target.value }))}
                    placeholder="e.g. 50"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <ToggleRow
                  title="Cap at Net Salary"
                  subtitle="Prevent payroll from going negative after deductions."
                  checked={form.capAtNetSalary}
                  onChange={() => setForm((p) => ({ ...p, capAtNetSalary: !p.capAtNetSalary }))}
                />
                <ToggleRow
                  title="Stop when balance is zero"
                  subtitle="Auto stop recovery once the outstanding amount is fully cleared."
                  checked={form.stopWhenZero}
                  onChange={() => setForm((p) => ({ ...p, stopWhenZero: !p.stopWhenZero }))}
                />
              </div>
            </div>
          )}

          {activeTab === "FLAGS" && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-900 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-brand-800" />
                  Module Integration
                </h4>
                <div className="space-y-3">
                  <ToggleRow
                    title="Is Statutory Deduction"
                    subtitle="Treat this component as a statutory deduction for exports and reporting."
                    checked={form.isStatutory}
                    onChange={() => setForm((p) => ({ ...p, isStatutory: !p.isStatutory }))}
                  />
                  <ToggleRow
                    title="Link to Loan Module"
                    subtitle="Use deduction values from outstanding loan schedules."
                    checked={form.linkToLoanModule}
                    onChange={() => setForm((p) => ({ ...p, linkToLoanModule: !p.linkToLoanModule }))}
                  />
                  <ToggleRow
                    title="Link to Tax Engine"
                    subtitle="Allow tax engine to control or update this component."
                    checked={form.linkToTaxEngine}
                    onChange={() => setForm((p) => ({ ...p, linkToTaxEngine: !p.linkToTaxEngine }))}
                  />
                  <ToggleRow
                    title="Pre-tax Deduction"
                    subtitle="Deduct from gross before tax calculation where policy applies."
                    checked={form.preTaxDeduction}
                    onChange={() => setForm((p) => ({ ...p, preTaxDeduction: !p.preTaxDeduction }))}
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