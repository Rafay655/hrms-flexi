import React, { useMemo, useState } from "react";
import { Save, Percent, HandCoins, TrendingUp, ShieldCheck, Settings2 } from "lucide-react";
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

interface ContributionComponentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
   initialData?: any; 
}

type FormTab = "BASIC" | "CONFIG" | "CAPS" | "FLAGS";

type ContributionFormData = {
  code: string;
  name: string;
  category: string;
  status: "Active" | "Inactive";
  employeeShare: string;
  employerShare: string;
  matchRatio: string;
  base: string;
  maxWageLimit: string;
  maxEmployerAmount: string;
  includeInCtc: boolean;
  showOnPayslip: boolean;
  isAccruableProvision: boolean;
  linkToStatutoryReturn: boolean;
  description: string;
};

const defaultForm: ContributionFormData = {
  code: "",
  name: "",
  category: "Provident Fund (Employer)",
  status: "Active",
  employeeShare: "1",
  employerShare: "5",
  matchRatio: "5",
  base: "Basic Salary",
  maxWageLimit: "",
  maxEmployerAmount: "",
  includeInCtc: true,
  showOnPayslip: true,
  isAccruableProvision: false,
  linkToStatutoryReturn: true,
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

export const ContributionComponentForm: React.FC<ContributionComponentFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<FormTab>("BASIC");
  const [form, setForm] = useState<ContributionFormData>(defaultForm);

  const tabs: FormTab[] = ["BASIC", "CONFIG", "CAPS", "FLAGS"];

  const matchPreview = useMemo(() => {
    const ee = form.employeeShare || "0";
    const er = form.employerShare || "0";
    return `Employee ${ee}% : Employer ${er}%`;
  }, [form.employeeShare, form.employerShare]);

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
              <HandCoins className="h-4 w-4 opacity-80" />
              Add Employer Contribution
            </DialogTitle>
            <DialogDescription className="text-brand-200 text-xs">
              Configure employer-side payroll liabilities and contribution rules.
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
                    placeholder="e.g. ER_EOBI"
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
                  placeholder="e.g. EOBI Employer Share"
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
                    <option value="EOBI (Employer)">EOBI (Employer)</option>
                    <option value="PESSI / SESSI (Employer)">PESSI / SESSI (Employer)</option>
                    <option value="Provident Fund (Employer)">Provident Fund (Employer)</option>
                    <option value="Gratuity Provision">Gratuity Provision</option>
                    <option value="Group Insurance Premium">Group Insurance Premium</option>
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
                <HandCoins className="h-4 w-4 text-brand-800 mt-0.5 shrink-0" />
                <p className="text-sm text-brand-800">
                  Employer contributions usually follow statutory rules or company-side policy matching.
                </p>
              </div>
            </div>
          )}

          {activeTab === "CONFIG" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-4">
                <p className="text-sm font-semibold text-brand-900">Matching Configuration</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800">Employee Share %</label>
                    <Input
                      value={form.employeeShare}
                      onChange={(e) => setForm((p) => ({ ...p, employeeShare: e.target.value }))}
                      placeholder="1"
                      className="border-gray-200 text-brand-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800">Employer Share %</label>
                    <Input
                      value={form.employerShare}
                      onChange={(e) => setForm((p) => ({ ...p, employerShare: e.target.value }))}
                      placeholder="5"
                      className="border-gray-200 text-brand-900"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                  <p className="text-sm font-semibold text-brand-900 mb-2">Match Preview</p>
                  <p className="text-sm text-brand-700">{matchPreview}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Match Ratio</label>
                  <Input
                    value={form.matchRatio}
                    onChange={(e) => setForm((p) => ({ ...p, matchRatio: e.target.value }))}
                    placeholder="5"
                    className="border-gray-200 text-brand-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Calculation Base</label>
                  <select
                    value={form.base}
                    onChange={(e) => setForm((p) => ({ ...p, base: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none"
                  >
                    <option value="Basic Salary">Basic Salary</option>
                    <option value="Gross Salary">Gross Salary</option>
                    <option value="Minimum Wage (Statutory)">Minimum Wage (Statutory)</option>
                    <option value="Fixed Monthly Amount">Fixed Monthly Amount</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "CAPS" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-4">
                <p className="text-sm font-semibold text-brand-900">Contribution Caps</p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Maximum Wage Limit</label>
                  <Input
                    value={form.maxWageLimit}
                    onChange={(e) => setForm((p) => ({ ...p, maxWageLimit: e.target.value }))}
                    placeholder="e.g. 31000"
                    className="border-gray-200 text-brand-900"
                  />
                  <p className="text-xs text-brand-700">
                    Example: contribution stops increasing after a fixed wage ceiling.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-800">Max Employer Amount</label>
                  <Input
                    value={form.maxEmployerAmount}
                    onChange={(e) => setForm((p) => ({ ...p, maxEmployerAmount: e.target.value }))}
                    placeholder="Fixed cap amount"
                    className="border-gray-200 text-brand-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "FLAGS" && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-800" />
                  Financial Impact
                </h4>
                <div className="space-y-3">
                  <ToggleRow
                    title="Include in CTC"
                    subtitle="Count this contribution in total cost to company."
                    checked={form.includeInCtc}
                    onChange={() => setForm((p) => ({ ...p, includeInCtc: !p.includeInCtc }))}
                  />
                  <ToggleRow
                    title="Show on Payslip"
                    subtitle="Display this employer-side amount on the employee payslip."
                    checked={form.showOnPayslip}
                    onChange={() => setForm((p) => ({ ...p, showOnPayslip: !p.showOnPayslip }))}
                  />
                  <ToggleRow
                    title="Is Accruable Provision"
                    subtitle="Track this as a payroll provision or liability."
                    checked={form.isAccruableProvision}
                    onChange={() =>
                      setForm((p) => ({ ...p, isAccruableProvision: !p.isAccruableProvision }))
                    }
                  />
                  <ToggleRow
                    title="Link to Statutory Return"
                    subtitle="Include this contribution in statutory challan/export logic."
                    checked={form.linkToStatutoryReturn}
                    onChange={() =>
                      setForm((p) => ({ ...p, linkToStatutoryReturn: !p.linkToStatutoryReturn }))
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