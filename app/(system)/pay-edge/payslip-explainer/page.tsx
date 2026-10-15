"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  HelpCircle,
  Calculator,
  Info,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Shield,
  Building,
  Clock,
  Wallet,
  BarChart3,
  Percent,
  ChevronRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Design tokens                                                             */
/* -------------------------------------------------------------------------- */

const CHART = {
  navy: "#1E1B4B",
  navySoft: "#312E81",
  surface: "#E0E7FF",
  rose: "#9F1239",
  roseSoft: "#FCE7F3",
};

const earningChartColors = ["#1E1B4B", "#312E81", "#4338CA", "#6366F1", "#818CF8"];
const deductionChartColors = ["#7F1D1D", "#991B1B", "#BE123C", "#E11D48", "#FB7185"];

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface EarningComponent {
  name: string;
  amount: number;
  description: string;
  formula: string;
  statutory: boolean;
  taxable: boolean;
  icon: React.ElementType;
}

interface DeductionComponent {
  name: string;
  amount: number;
  description: string;
  formula: string;
  statutory: boolean;
  mandatory: boolean;
  icon: React.ElementType;
}

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                 */
/* -------------------------------------------------------------------------- */

const earnings: EarningComponent[] = [
  {
    name: "Basic Salary",
    amount: 120000,
    description: "Fixed component and main base used for other salary calculations.",
    formula: "As per employment contract (usually 40–50% of CTC)",
    statutory: false,
    taxable: true,
    icon: Briefcase,
  },
  {
    name: "HRA (House Rent Allowance)",
    amount: 60000,
    description: "Allowance paid to support house rent expenses.",
    formula: "Based on company structure and rent rules",
    statutory: false,
    taxable: true,
    icon: Building,
  },
  {
    name: "Special Allowance",
    amount: 25000,
    description: "Flexible fixed allowance given as part of compensation.",
    formula: "Fixed amount as per company policy",
    statutory: false,
    taxable: true,
    icon: TrendingUp,
  },
  {
    name: "Overtime",
    amount: 8000,
    description: "Extra payment for additional approved working hours.",
    formula: "Hourly rate × overtime hours × overtime multiplier",
    statutory: true,
    taxable: true,
    icon: Clock,
  },
  {
    name: "Performance Bonus",
    amount: 15000,
    description: "Bonus based on performance or business targets.",
    formula: "Based on rating / company policy",
    statutory: false,
    taxable: true,
    icon: TrendingUp,
  },
];

const deductions: DeductionComponent[] = [
  {
    name: "EOBI Contribution",
    amount: 370,
    description: "Employees' Old-Age Benefits Institution statutory contribution.",
    formula: "PKR 370/month (employee share)",
    statutory: true,
    mandatory: true,
    icon: Shield,
  },
  {
    name: "Provincial Social Security",
    amount: 1000,
    description: "PESSI / SESSI / KPESSP contribution based on province of employment.",
    formula: "As per provincial social security board",
    statutory: true,
    mandatory: true,
    icon: Shield,
  },
  {
    name: "Loan Recovery",
    amount: 5000,
    description: "Monthly installment against advance or loan.",
    formula: "Fixed deduction as per agreement",
    statutory: false,
    mandatory: false,
    icon: TrendingDown,
  },
  {
    name: "Other Deductions",
    amount: 1000,
    description: "Miscellaneous approved deductions.",
    formula: "As per employee authorization / policy",
    statutory: false,
    mandatory: false,
    icon: Info,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const totalGross = earnings.reduce((sum, e) => sum + e.amount, 0);
const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
const netPay = totalGross - totalDeductions;

const formatCurrency = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-brand-500 hover:text-brand-800 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function PayslipExplainer() {
  const [activeTab, setActiveTab] = useState<"breakdown" | "calculator">("breakdown");

  const [simulateBasic, setSimulateBasic] = useState(120000);
  const [simulateBonus, setSimulateBonus] = useState(15000);
  const [simulateHours, setSimulateHours] = useState(16);

  const hourlyRate = simulateBasic / 208;
  const calculatedOvertime = simulateHours * hourlyRate * 2;
  const simulatedGross = simulateBasic + 60000 + 25000 + calculatedOvertime + simulateBonus;
  const simulatedDeductions =
    simulateBasic * 0.12 + simulatedGross * 0.0075 + 200 + 5000 + 1000;
  const simulatedNet = simulatedGross - simulatedDeductions;
  const netChange = simulatedNet - netPay;
  const netChangePercent = (netChange / netPay) * 100;

  const earningsChartData = useMemo(
    () => earnings.map((e) => ({ name: e.name, value: e.amount })),
    []
  );

  const deductionsChartData = useMemo(
    () => deductions.map((d) => ({ name: d.name, value: d.amount })),
    []
  );

  const earningStatutoryCount = earnings.filter((e) => e.statutory).length;
  const earningTaxableCount = earnings.filter((e) => e.taxable).length;
  const deductionMandatoryCount = deductions.filter((d) => d.mandatory).length;
  const deductionStatutoryCount = deductions.filter((d) => d.statutory).length;

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Payslip Explainer
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Understand your salary structure, deductions, and net pay in a clean view.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "breakdown" ? "default" : "outline"}
                onClick={() => setActiveTab("breakdown")}
                className={
                  activeTab === "breakdown"
                    ? "bg-brand-800 hover:bg-brand-900 text-white"
                    : "border-gray-200 text-brand-800 hover:bg-brand-100"
                }
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Breakdown
              </Button>

              <Button
                variant={activeTab === "calculator" ? "default" : "outline"}
                onClick={() => setActiveTab("calculator")}
                className={
                  activeTab === "calculator"
                    ? "bg-brand-800 hover:bg-brand-900 text-white"
                    : "border-gray-200 text-brand-800 hover:bg-brand-100"
                }
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculator
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Gross Earnings
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {formatCurrency(totalGross)}
                    </p>
                    <p className="text-xs text-brand-700 mt-1">Before deductions</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <TrendingUp className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Total Deductions
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {formatCurrency(totalDeductions)}
                    </p>
                    <p className="text-xs text-brand-700 mt-1">All applicable deductions</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <TrendingDown className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Net Pay
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {formatCurrency(netPay)}
                    </p>
                    <p className="text-xs text-brand-700 mt-1">Take-home amount</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <Wallet className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats strip */}
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="text-sm">
              <span className="text-brand-700">This payslip contains </span>
              <span className="font-semibold text-brand-900">{earnings.length}</span>
              <span className="text-brand-700"> earnings and </span>
              <span className="font-semibold text-brand-900">{deductions.length}</span>
              <span className="text-brand-700"> deductions</span>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{earningTaxableCount}</span> Taxable
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{earningStatutoryCount}</span> Statutory Earnings
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{deductionMandatoryCount}</span> Mandatory
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{deductionStatutoryCount}</span> Statutory Deductions
              </div>
            </div>
          </div>

          {activeTab === "breakdown" && (
            <div className="space-y-4">
              {/* charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Earnings Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={earningsChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {earningsChartData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={earningChartColors[index % earningChartColors.length]}
                              />
                            ))}
                          </Pie>
                         <RechartsTooltip
  formatter={(value) =>
    formatCurrency(
      Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)
    )
  }
/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-2">
                      {earnings.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  earningChartColors[index % earningChartColors.length],
                              }}
                            />
                            <span className="text-sm text-brand-800">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-brand-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Deductions Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deductionsChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {deductionsChartData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={deductionChartColors[index % deductionChartColors.length]}
                              />
                            ))}
                          </Pie>
                         <RechartsTooltip
  formatter={(value) =>
    formatCurrency(
      Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)
    )
  }
/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-2">
                      {deductions.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  deductionChartColors[index % deductionChartColors.length],
                              }}
                            />
                            <span className="text-sm text-brand-800">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-brand-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* earnings list */}
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base">
                    Earnings Explained
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {earnings.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-brand-100 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800 flex-shrink-0">
                            <item.icon className="h-5 w-5" />
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-brand-900">
                                  {item.name}
                                </h3>
                                <InfoTooltip content={item.formula} />
                              </div>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="border-gray-200 text-brand-800"
                                >
                                  {item.taxable ? "Taxable" : "Non-Taxable"}
                                </Badge>

                                {item.statutory && (
                                  <Badge className="bg-brand-100 text-brand-800 border border-gray-200">
                                    Statutory
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-brand-700">{item.description}</p>

                            <div className="rounded-md bg-brand-100 border border-gray-200 px-3 py-2 text-xs text-brand-800 font-medium">
                              Formula: {item.formula}
                            </div>
                          </div>
                        </div>

                        <div className="lg:text-right flex-shrink-0">
                          <p className="text-lg font-bold text-brand-900">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-brand-700 mt-0.5">
                            {Math.round((item.amount / totalGross) * 100)}% of gross
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* deductions list */}
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base">
                    Deductions Explained
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {deductions.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-brand-100 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800 flex-shrink-0">
                            <item.icon className="h-5 w-5" />
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-brand-900">
                                  {item.name}
                                </h3>
                                <InfoTooltip content={item.formula} />
                              </div>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="border-gray-200 text-brand-800"
                                >
                                  {item.mandatory ? "Mandatory" : "Voluntary"}
                                </Badge>

                                {item.statutory && (
                                  <Badge className="bg-brand-100 text-brand-800 border border-gray-200">
                                    Statutory
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-brand-700">{item.description}</p>

                            <div className="rounded-md bg-brand-100 border border-gray-200 px-3 py-2 text-xs text-brand-800 font-medium">
                              Formula: {item.formula}
                            </div>
                          </div>
                        </div>

                        <div className="lg:text-right flex-shrink-0">
                          <p className="text-lg font-bold text-brand-900">
                            -{formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-brand-700 mt-0.5">
                            {Math.round((item.amount / totalDeductions) * 100)}% of deductions
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "calculator" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    What-If Calculator
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-brand-800">Basic Salary</Label>
                    <Input
                      type="number"
                      value={simulateBasic}
                      onChange={(e) => setSimulateBasic(Number(e.target.value) || 0)}
                      className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-brand-800">Performance Bonus</Label>
                    <Input
                      type="number"
                      value={simulateBonus}
                      onChange={(e) => setSimulateBonus(Number(e.target.value) || 0)}
                      className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-brand-800">Overtime Hours</Label>
                      <Badge
                        variant="outline"
                        className="border-gray-200 text-brand-800"
                      >
                        {simulateHours}h
                      </Badge>
                    </div>

                    <Slider
                      value={[simulateHours]}
                      onValueChange={(value: number[]) => setSimulateHours(value[0])}
                      max={50}
                      step={1}
                      className="w-full"
                    />

                    <p className="text-xs text-brand-700">
                      Hourly rate: <span className="font-semibold">{formatCurrency(hourlyRate)}</span>
                      {" · "}
                      Overtime rate:{" "}
                      <span className="font-semibold">{formatCurrency(hourlyRate * 2)}</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                    <p className="text-sm font-medium text-brand-900 mb-2">
                      Current assumptions
                    </p>
                    <div className="space-y-1 text-sm text-brand-700">
                      <div className="flex justify-between">
                        <span>HRA</span>
                        <span>{formatCurrency(60000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Allowance</span>
                        <span>{formatCurrency(25000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loan + other fixed deductions</span>
                        <span>{formatCurrency(6200)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base">
                    Projected Pay
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-brand-700">
                        Projected Gross
                      </p>
                      <p className="text-xl font-bold text-brand-900 mt-1">
                        {formatCurrency(simulatedGross)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-brand-700">
                        Projected Deductions
                      </p>
                      <p className="text-xl font-bold text-brand-900 mt-1">
                        {formatCurrency(simulatedDeductions)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-brand-700">
                        Projected Net
                      </p>
                      <p className="text-xl font-bold text-brand-900 mt-1">
                        {formatCurrency(simulatedNet)}
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-brand-700">Change from current net pay</p>
                        <p className="text-2xl font-bold text-brand-900 mt-1">
                          {netChange >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(netChange))}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                          <Percent className="h-4 w-4 text-brand-800" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-900">
                            {netChangePercent >= 0 ? "+" : ""}
                            {netChangePercent.toFixed(1)}%
                          </p>
                          <p className="text-xs text-brand-700">vs current take-home</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                    <p className="text-sm font-medium text-brand-900 mb-3">
                      Calculation preview
                    </p>

                    <div className="space-y-2 text-sm text-brand-700">
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        <span>{formatCurrency(simulateBasic)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRA</span>
                        <span>{formatCurrency(60000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Allowance</span>
                        <span>{formatCurrency(25000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime</span>
                        <span>{formatCurrency(calculatedOvertime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus</span>
                        <span>{formatCurrency(simulateBonus)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-brand-900">
                        <span>Gross</span>
                        <span>{formatCurrency(simulatedGross)}</span>
                      </div>

                      <div className="pt-1 flex justify-between">
                        <span>EOBI</span>
                        <span>{formatCurrency(370)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provincial Social Security</span>
                        <span>{formatCurrency(1000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loan Recovery</span>
                        <span>{formatCurrency(5000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Deductions</span>
                        <span>{formatCurrency(1000)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-brand-900">
                        <span>Net Pay</span>
                        <span>{formatCurrency(simulatedNet)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-brand-700 border-t border-gray-200 pt-4">
                    This is an estimated calculator for understanding impact only. Actual payroll
                    values can differ based on policy, tax handling, and payroll adjustments.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}