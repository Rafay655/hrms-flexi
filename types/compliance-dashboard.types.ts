// types/compliance-dashboard.types.ts

export interface DashboardSummary {
  health_score: number; // 0-100
  health_status: 'good' | 'warning' | 'critical';
  active_tax_year: {
    id: string;
    label: string;
    end_date: string;
  } | null;
  pending_remittances: {
    eobi: number;
    ss: number;
    fbr: number;
    wwf: number;
    wppf: number;
  };
  min_wage_violations: number;
  missing_statutory_profiles: number;
  province_employer_cost: Record<
    string,
    {
      eobi: number;
      ss: number;
      pf: number;
      gratuity: number;
      total: number;
    }
  >;
  upcoming_deadlines: Array<{
    id: string;
    name: string;
    due_date: string;
    days_left: number;
  }>;
  certificates_pending: number;
}

export interface ComplianceAreaSummary {
  compliance_area: string;
  current_status: 'compliant' | 'pending' | 'overdue';
  pending_count: number;
  amount_pending: number;
  overdue_count: number;
  last_updated: string;
  action?: string;
}

export interface DashboardFilters {
  entity_id?: string;
  tax_year_id?: string;
  payroll_month?: string;
  province?: string;
  areas?: string[];
}