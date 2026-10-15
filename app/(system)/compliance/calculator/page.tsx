'use client';

import { showApiError } from "@/lib/error-toast";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calculator, TrendingUp, TrendingDown, Wallet, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types & Hooks ──────────────────────────────────────
import { useEmployees } from '@/hooks/useEmployees';
import {
  useEmployeeSalary,
  useCalculateTax,
  useCalculateEOBI,
  useCalculateSocialSecurity,
  useCalculateGratuity,
  useCalculateAll,
} from '@/hooks/useCalculations';
import type {
  EmployeeSalary,
  TaxCalculationResult,
  EOBICalculationResult,
  SocialSecurityCalculationResult,
  GratuityCalculationResult,
  AllCalculationsResult,
} from '@/types/calculation.types';

// ── Helper ─────────────────────────────────────────────
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value);
};

// ── Main Component ────────────────────────────────────
export default function CalculatorPage() {
  // ── State ──────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [netTaxableMonthly, setNetTaxableMonthly] = useState<number>(0);
  const [completedYears, setCompletedYears] = useState<number>(0);
  const [fiscalYear, setFiscalYear] = useState<string>('');

  // ── Results state ──────────────────────────────────
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const [eobiResult, setEobiResult] = useState<EOBICalculationResult | null>(null);
  const [ssResult, setSsResult] = useState<SocialSecurityCalculationResult | null>(null);
  const [gratuityResult, setGratuityResult] = useState<GratuityCalculationResult | null>(null);
  const [allResult, setAllResult] = useState<AllCalculationsResult | null>(null);

  // ── Hooks ──────────────────────────────────────────
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const employeeList = Array.isArray(employees) ? employees : employees?.data || [];

  const { data: salaryData, isLoading: salaryLoading, refetch: refetchSalary } = useEmployeeSalary(selectedEmployee);
  const calculateTax = useCalculateTax();
  const calculateEOBI = useCalculateEOBI();
  const calculateSS = useCalculateSocialSecurity();
  const calculateGratuity = useCalculateGratuity();
  const calculateAll = useCalculateAll();

  // ── Auto-fill when employee selected ─────────────────
  useEffect(() => {
    if (salaryData) {
      setGrossSalary(salaryData.gross_salary);
      setBasicSalary(salaryData.basic_salary);
      setNetTaxableMonthly(salaryData.net_taxable_monthly);
      setFiscalYear(salaryData.fiscal_year);
    }
  }, [salaryData]);

  // ── Handlers ────────────────────────────────────────
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    // Clear results
    setTaxResult(null);
    setEobiResult(null);
    setSsResult(null);
    setGratuityResult(null);
    setAllResult(null);
  };

  const handleCalculateTax = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee.');
      return;
    }
    if (!netTaxableMonthly) {
      toast.error('Please enter net taxable monthly income.');
      return;
    }
    try {
      const res = await calculateTax.mutateAsync({
        employee_uuid: selectedEmployee,
        net_taxable_monthly: netTaxableMonthly,
        fiscal_year: fiscalYear || 'FY 2026-27',
      });
      setTaxResult(res.data.data);
      toast.success('Tax calculated.');
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to calculate tax.' });
    }
  };

  const handleCalculateEOBI = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee.');
      return;
    }
    if (!grossSalary) {
      toast.error('Please enter gross salary.');
      return;
    }
    try {
      const res = await calculateEOBI.mutateAsync({
        employee_uuid: selectedEmployee,
        gross_salary: grossSalary,
      });
      setEobiResult(res.data.data);
      toast.success('EOBI calculated.');
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to calculate EOBI.' });
    }
  };

  const handleCalculateSS = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee.');
      return;
    }
    if (!grossSalary) {
      toast.error('Please enter gross salary.');
      return;
    }
    try {
      const res = await calculateSS.mutateAsync({
        employee_uuid: selectedEmployee,
        gross_salary: grossSalary,
      });
      setSsResult(res.data.data);
      toast.success('Social security calculated.');
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to calculate social security.' });
    }
  };

  const handleCalculateGratuity = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee.');
      return;
    }
    if (!basicSalary) {
      toast.error('Please enter basic salary.');
      return;
    }
    if (!completedYears || completedYears <= 0) {
      toast.error('Please enter completed years.');
      return;
    }
    try {
      const res = await calculateGratuity.mutateAsync({
        employee_uuid: selectedEmployee,
        basis_salary: basicSalary,
        completed_years: completedYears,
      });
      setGratuityResult(res.data.data);
      toast.success('Gratuity calculated.');
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to calculate gratuity.' });
    }
  };

  const handleCalculateAll = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee.');
      return;
    }
    if (!grossSalary || !netTaxableMonthly || !basicSalary || !completedYears) {
      toast.error('Please fill all required fields.');
      return;
    }
    try {
      const res = await calculateAll.mutateAsync({
        employee_uuid: selectedEmployee,
        gross_salary: grossSalary,
        net_taxable_monthly: netTaxableMonthly,
        basis_salary: basicSalary,
        completed_years: completedYears,
      });
      setAllResult(res.data.data);
      toast.success('All calculations completed.');
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to calculate.' });
    }
  };

  // ── Loading states ──────────────────────────────────
  const isSalaryLoading = salaryLoading;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statutory Calculator</h1>
        <p className="text-sm text-muted-foreground">Calculate employee statutory deductions (Tax, EOBI, SS, Gratuity)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel – Employee & Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee &amp; Inputs</CardTitle>
              <CardDescription>Select employee and enter salary details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employee dropdown */}
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeList.map((emp: any) => (
                      <SelectItem key={emp.uuid} value={emp.uuid}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Salary fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="grossSalary">Gross Salary</Label>
                  <Input
                    id="grossSalary"
                    type="number"
                    value={grossSalary || ''}
                    onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 200000"
                    disabled={isSalaryLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="basicSalary">Basic Salary</Label>
                  <Input
                    id="basicSalary"
                    type="number"
                    value={basicSalary || ''}
                    onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 100000"
                    disabled={isSalaryLoading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="netTaxable">Net Taxable Monthly</Label>
                  <Input
                    id="netTaxable"
                    type="number"
                    value={netTaxableMonthly || ''}
                    onChange={(e) => setNetTaxableMonthly(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 180000"
                    disabled={isSalaryLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="completedYears">Completed Years</Label>
                  <Input
                    id="completedYears"
                    type="number"
                    step="0.5"
                    value={completedYears || ''}
                    onChange={(e) => setCompletedYears(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fiscalYear">Fiscal Year</Label>
                <Input
                  id="fiscalYear"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder="e.g. FY 2026-27"
                  disabled={isSalaryLoading}
                />
              </div>

              {isSalaryLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading salary details...
                </div>
              )}

              <Separator />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCalculateTax} disabled={calculateTax.isPending || !selectedEmployee}>
                  {calculateTax.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Tax
                </Button>
                <Button onClick={handleCalculateEOBI} disabled={calculateEOBI.isPending || !selectedEmployee}>
                  {calculateEOBI.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  EOBI
                </Button>
                <Button onClick={handleCalculateSS} disabled={calculateSS.isPending || !selectedEmployee}>
                  {calculateSS.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Social Security
                </Button>
                <Button onClick={handleCalculateGratuity} disabled={calculateGratuity.isPending || !selectedEmployee}>
                  {calculateGratuity.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Gratuity
                </Button>
                <Button
                  variant="default"
                  className="col-span-2 bg-[#1E1B4B] hover:bg-[#2A2675]"
                  onClick={handleCalculateAll}
                  disabled={calculateAll.isPending || !selectedEmployee}
                >
                  {calculateAll.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                  Calculate All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee summary (if salary data fetched) */}
          {salaryData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Employee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Salary:</span>
                  <span className="font-medium">{formatCurrency(salaryData.gross_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary:</span>
                  <span className="font-medium">{formatCurrency(salaryData.basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Taxable Monthly:</span>
                  <span className="font-medium">{formatCurrency(salaryData.net_taxable_monthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fiscal Year:</span>
                  <span className="font-medium">{salaryData.fiscal_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Date:</span>
                  <span className="font-medium">{salaryData.effective_date}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel – Results */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="tax" className="w-full">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="tax">Tax</TabsTrigger>
              <TabsTrigger value="eobi">EOBI</TabsTrigger>
              <TabsTrigger value="ss">Social Security</TabsTrigger>
              <TabsTrigger value="gratuity">Gratuity</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {/* Tax Result */}
            <TabsContent value="tax">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Tax Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {taxResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Monthly Tax</p>
                          <p className="text-xl font-bold">{formatCurrency(taxResult.monthly_tax)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Annual Tax</p>
                          <p className="text-xl font-bold">{formatCurrency(taxResult.annual_tax)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Projected Annual Income</p>
                          <p className="text-xl font-bold">{formatCurrency(taxResult.projected_annual)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Tax Still Owed</p>
                          <p className="text-xl font-bold">{formatCurrency(taxResult.tax_still_owed)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Slab: {taxResult.slab_label}</p>
                        <p className="text-sm text-muted-foreground">Rate: {taxResult.slab_rate * 100}%</p>
                        <p className="text-sm text-muted-foreground">Fixed: {formatCurrency(taxResult.slab_fixed)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Slab Breakdown</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {taxResult.slab_breakdown.map((slab, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b py-1">
                              <span>{slab.label}</span>
                              <span className="font-medium">{formatCurrency(slab.tax_in_slab)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Click "Tax" to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EOBI Result */}
            <TabsContent value="eobi">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    EOBI Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eobiResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employee Share</p>
                          <p className="text-xl font-bold">{formatCurrency(eobiResult.employee_share)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employer Share</p>
                          <p className="text-xl font-bold">{formatCurrency(eobiResult.employer_share)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm">Notified Wage Base: {formatCurrency(eobiResult.notified_wage_base)}</p>
                        <p className="text-sm">Employer Rate: {eobiResult.employer_contribution_rate}%</p>
                        <p className="text-sm">Employee Rate: {eobiResult.employee_contribution_rate}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Click "EOBI" to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Security Result */}
            <TabsContent value="ss">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Social Security Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ssResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employer Share</p>
                          <p className="text-xl font-bold">{formatCurrency(ssResult.employer_share)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employee Share</p>
                          <p className="text-xl font-bold">{formatCurrency(ssResult.employee_share)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm">State: {ssResult.state_name} ({ssResult.scheme})</p>
                        <p className="text-sm">Status: <Badge variant={ssResult.status === 'no_scheme' ? 'secondary' : 'default'}>{ssResult.status}</Badge></p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Click "Social Security" to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gratuity Result */}
            <TabsContent value="gratuity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Gratuity Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gratuityResult ? (
                    <div className="space-y-4">
                      <div>
                        <Badge variant={gratuityResult.eligible ? 'default' : 'secondary'}>
                          {gratuityResult.eligible ? 'Eligible' : 'Not Eligible'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Gross Gratuity</p>
                          <p className="text-xl font-bold">{formatCurrency(gratuityResult.gross_gratuity)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Exempt Amount</p>
                          <p className="text-xl font-bold">{formatCurrency(gratuityResult.exempt_amount)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Taxable Amount</p>
                          <p className="text-xl font-bold">{formatCurrency(gratuityResult.taxable_amount)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Completed Years</p>
                          <p className="text-xl font-bold">{gratuityResult.completed_years}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm">Salary Basis: {gratuityResult.salary_basis}</p>
                        <p className="text-sm">Formula: {gratuityResult.formula_type}</p>
                        <p className="text-sm">Days/Year: {gratuityResult.days_per_year}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Click "Gratuity" to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Results */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    All Calculations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allResult ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employee Total Deduction</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(allResult.employee_total_deduction)}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Employer Total Cost</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(allResult.employer_total_cost)}</p>
                        </div>
                      </div>

                      {/* Line items */}
                      <div>
                        <p className="text-sm font-medium mb-2">Line Items</p>
                        <div className="space-y-1">
                          {allResult.line_items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b py-1">
                              <span>
                                {item.pay_head}
                                <Badge variant="secondary" className="ml-2 text-xs">{item.type}</Badge>
                              </span>
                              <span className="font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EOBI */}
                      <div>
                        <p className="text-sm font-medium">EOBI: Employee {formatCurrency(allResult.eobi.employee_share)} | Employer {formatCurrency(allResult.eobi.employer_share)}</p>
                      </div>

                      {/* Tax */}
                      <div>
                        <p className="text-sm font-medium">Tax: Monthly {formatCurrency(allResult.tax.monthly_tax)} | Annual {formatCurrency(allResult.tax.annual_tax)}</p>
                      </div>

                      {/* PF */}
                      {allResult.provident_fund.applicable && (
                        <div>
                          <p className="text-sm font-medium">PF: Employee {formatCurrency(allResult.provident_fund.employee_contribution)} | Employer {formatCurrency(allResult.provident_fund.employer_contribution)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Click "Calculate All" to see all deductions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}