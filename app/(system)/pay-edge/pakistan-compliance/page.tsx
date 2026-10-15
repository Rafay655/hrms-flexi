"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Calculator,
  HeartPulse,
  Award,
  Edit,
  Save,
  X,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─────────────── EOBI card ─────────────── */
function EobiCard() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState({
    empContrib: "1",
    emprContrib: "5",
    wageCeiling: "32000",
  });

  const monthlyLiability = Math.round(
    (parseFloat(state.wageCeiling) || 0) * (parseFloat(state.emprContrib) || 0) / 100
  );
  const monthlyEmpMax = Math.round(
    (parseFloat(state.wageCeiling) || 0) * (parseFloat(state.empContrib) || 0) / 100
  );

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      toast.success("EOBI configuration updated");
    }, 700);
  };

  return (
    <Card className="border-brand-300/40 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <Building2 className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <CardTitle className="text-base text-brand-900">
                EOBI Configuration
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Employees' Old-Age Benefits Institution
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Employee Contribution (% of basic wages)
            </Label>
            {editing ? (
              <Input
                type="number"
                value={state.empContrib}
                onChange={(e) => setState({ ...state, empContrib: e.target.value })}
              />
            ) : (
              <p className="text-sm font-semibold text-brand-900">{state.empContrib}%</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Employer Contribution (% of basic wages)
            </Label>
            {editing ? (
              <Input
                type="number"
                value={state.emprContrib}
                onChange={(e) => setState({ ...state, emprContrib: e.target.value })}
              />
            ) : (
              <p className="text-sm font-semibold text-brand-900">{state.emprContrib}%</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Wage Ceiling (PKR/month)</Label>
            {editing ? (
              <Input
                type="number"
                value={state.wageCeiling}
                onChange={(e) => setState({ ...state, wageCeiling: e.target.value })}
              />
            ) : (
              <p className="text-sm font-semibold text-brand-900">
                PKR {parseInt(state.wageCeiling).toLocaleString()}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-brand-100/50 border border-brand-300/40 p-3">
              <Label className="text-xs text-brand-700">
                Max Employee / month
              </Label>
              <p className="text-sm font-bold text-brand-800 mt-0.5">
                PKR {monthlyEmpMax.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-brand-100/50 border border-brand-300/40 p-3">
              <Label className="text-xs text-brand-700">
                Max Employer / month
              </Label>
              <p className="text-sm font-bold text-brand-800 mt-0.5">
                PKR {monthlyLiability.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
            <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900">
              <strong>EOBI 2024-25:</strong> Wage ceiling raised to PKR 32,000/month. Employee contribution at 1% (max PKR 320/month), employer at 5% (max PKR 1,600/month).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <p className="text-[10px] text-muted-foreground italic">
            Last updated by Ayesha Malik on 15 Mar 2026
          </p>
          {editing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="gap-1 border-gray-200"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving}
                className="bg-brand-800 text-white hover:bg-brand-900 gap-1"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1 border-brand-300 text-brand-800 hover:bg-brand-100"
            >
              <Edit className="h-3.5 w-3.5" />
              Update Configuration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── FBR tax slabs card ─────────────── */
const TAX_SLABS = [
  { range: "Up to 600K",      rate: "0%",  fixed: "0" },
  { range: "600K – 1.2M",     rate: "5%",  fixed: "0" },
  { range: "1.2M – 2.2M",     rate: "15%", fixed: "30,000" },
  { range: "2.2M – 3.2M",     rate: "25%", fixed: "180,000" },
  { range: "3.2M – 4.1M",     rate: "30%", fixed: "430,000" },
  { range: "Above 4.1M",      rate: "35%", fixed: "700,000" },
];

function FbrCard() {
  return (
    <Card className="border-brand-300/40 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <Calculator className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <CardTitle className="text-base text-brand-900">
                Income Tax / WHT (FBR)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Federal Board of Revenue salaried individuals
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Tax Year</Label>
          <Badge className="bg-brand-800 text-white border-transparent hover:bg-brand-800">
            2024-25
          </Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-brand-100/50 text-brand-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Income Range</th>
                <th className="px-3 py-2 text-right font-semibold">Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Fixed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {TAX_SLABS.map((slab) => (
                <tr key={slab.range} className="hover:bg-brand-50">
                  <td className="px-3 py-2 text-brand-900">{slab.range}</td>
                  <td className="px-3 py-2 text-right font-semibold text-brand-900">
                    {slab.rate}
                  </td>
                  <td className="px-3 py-2 text-right text-brand-700">
                    PKR {slab.fixed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Last updated: Finance Act 2024-25
        </p>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
          <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900">
            <strong>Non-Filer surcharge:</strong> Additional 100% surcharge on tax payable for non-filers (§100BA). Effective non-filer rate is <strong>2× the above</strong>.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-200 p-2.5">
          <Info className="h-3.5 w-3.5 text-sky-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-sky-900">
            WHT deposits via <strong>FBR IRIS portal</strong> using CPR (Computerized Payment Receipt). Due date: <strong>15th of the following month</strong>. Employees receive a <strong>Salary Tax Certificate (§149)</strong> — not "Form 16".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Provincial Social Security card (all 7 provinces) ─────────────── */
type Province = {
  key: string;
  province: string;
  institution: string;
  acronym: string;
  empRate: string;
  emprRate: string;
  ceiling: number;
};

const PROVINCES: Province[] = [
  { key: "punjab", province: "Punjab",              institution: "Punjab Employees Social Security Institution",           acronym: "PESSI",  empRate: "0.75", emprRate: "5", ceiling: 30000 },
  { key: "sindh",  province: "Sindh",               institution: "Sindh Employees Social Security Institution",            acronym: "SESSI",  empRate: "1",    emprRate: "5", ceiling: 30000 },
  { key: "kpk",    province: "KPK",                 institution: "Khyber Pakhtunkhwa Employees Social Security Programme", acronym: "KPESSP", empRate: "1",    emprRate: "5", ceiling: 30000 },
  { key: "bln",    province: "Baluchistan",         institution: "Baluchistan Employees Social Security Institution",      acronym: "BESSI",  empRate: "0.75", emprRate: "5", ceiling: 25000 },
  { key: "ajk",    province: "AJK",                 institution: "Azad Jammu & Kashmir Social Security",                   acronym: "AJKSS",  empRate: "1",    emprRate: "5", ceiling: 25000 },
  { key: "gb",     province: "Gilgit-Baltistan",    institution: "GB Social Security",                                     acronym: "GBSS",   empRate: "1",    emprRate: "5", ceiling: 25000 },
  { key: "fess",   province: "Federal / ICT",       institution: "Federal Employees Social Security",                      acronym: "FESS",   empRate: "0.75", emprRate: "5", ceiling: 30000 },
];

function ProvincialSocialSecurityCard() {
  const [registered, setRegistered] = useState<Record<string, boolean>>({
    punjab: true,
    sindh: true,
    kpk: false,
    bln: false,
    ajk: false,
    gb: false,
    fess: false,
  });

  const toggle = (key: string) => {
    setRegistered((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Registration status updated");
  };

  return (
    <Card className="border-brand-300/40 shadow-sm lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <HeartPulse className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <CardTitle className="text-base text-brand-900">
                Provincial Social Security
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Registration and contribution rates vary by province of employment
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registered provinces toggles */}
        <div>
          <Label className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
            Registered Provinces
          </Label>
          <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
            Toggle the provinces where this company is registered
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PROVINCES.map((p) => {
              const on = registered[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => toggle(p.key)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    on
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  <span className="truncate">{p.province}</span>
                  <span className="text-[9px] ml-1.5 opacity-80">{p.acronym}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rate table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-brand-100/50 text-brand-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Province</th>
                <th className="px-3 py-2 text-left font-semibold">Institution</th>
                <th className="px-3 py-2 text-right font-semibold">Employee %</th>
                <th className="px-3 py-2 text-right font-semibold">Employer %</th>
                <th className="px-3 py-2 text-right font-semibold">Wage Ceiling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {PROVINCES.map((p) => (
                <tr key={p.key} className="hover:bg-brand-50">
                  <td className="px-3 py-2 font-medium text-brand-900">{p.province}</td>
                  <td className="px-3 py-2 text-brand-700">{p.acronym}</td>
                  <td className="px-3 py-2 text-right font-semibold text-brand-900">{p.empRate}%</td>
                  <td className="px-3 py-2 text-right font-semibold text-brand-900">{p.emprRate}%</td>
                  <td className="px-3 py-2 text-right text-brand-700">
                    PKR {p.ceiling.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
          <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900">
            Employees are registered under the social security institution of the
            province where they are <strong>employed</strong>. Companies with
            multi-province operations must register separately in each province.
            Upload the registration certificate per active province from the HR
            → Documents module.
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Last updated by Ahmed Raza on 02 Apr 2026
        </p>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Gratuity card ─────────────── */
function GratuityCard() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fundingType, setFundingType] = useState("internal");

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      toast.success("Gratuity configuration updated");
    }, 700);
  };

  return (
    <Card className="border-brand-300/40 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <Award className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <CardTitle className="text-base text-brand-900">Gratuity</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Standing Orders Ordinance 1968
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-brand-300/40 bg-brand-100/40 p-3 font-mono text-xs text-brand-900">
          30 days basic wages × Years of Completed Service
        </div>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Minimum Eligibility</Label>
            <p className="text-sm font-semibold text-brand-900">1 year continuous service</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rate</Label>
            <p className="text-sm font-semibold text-brand-900">
              30 days wages per year throughout (no tiered reduction)
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Maximum Tax-Exempt</Label>
            <p className="text-sm font-semibold text-brand-900">PKR 600,000 (Finance Act 2024-25)</p>
            <p className="text-[10px] text-muted-foreground">
              Amount above PKR 600,000 is taxable at applicable slab rate.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-200 p-2.5">
            <Info className="h-3.5 w-3.5 text-sky-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-900">
              <strong>Provident Fund is voluntary in Pakistan</strong> (unlike India).
              EOBI is the mandatory pension contribution. Companies may offer an
              additional PF as a benefit — configure it under Salary Components if enabled.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Funding Type</Label>
            {editing ? (
              <Select value={fundingType} onValueChange={setFundingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="internal">Internal Fund</SelectItem>
                  <SelectItem value="external">External Fund</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-semibold text-brand-900">
                {fundingType === "internal" ? "Internal Fund" : "External Fund"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <p className="text-[10px] text-muted-foreground italic">
            Last updated by Ayesha Malik on 28 Feb 2026
          </p>
          {editing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="gap-1 border-gray-200"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving}
                className="bg-brand-800 text-white hover:bg-brand-900 gap-1"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1 border-brand-300 text-brand-800 hover:bg-brand-100"
            >
              <Edit className="h-3.5 w-3.5" />
              Update Configuration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Page ─────────────── */
export default function PakistanCompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
          <ShieldCheck className="h-5 w-5 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Pakistan Statutory Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage EOBI, PESSI, FBR and Gratuity configurations
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <EobiCard />
        <FbrCard />
        <ProvincialSocialSecurityCard />
        <GratuityCard />
      </div>
    </div>
  );
}
