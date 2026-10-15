// services/calculation.service.ts
import { api } from '@/lib/api';
import type {
  EmployeeSalary,
  TaxCalculationPayload,
  TaxCalculationResult,
  EOBICalculationPayload,
  EOBICalculationResult,
  SocialSecurityCalculationPayload,
  SocialSecurityCalculationResult,
  GratuityCalculationPayload,
  GratuityCalculationResult,
  AllCalculationsPayload,
  AllCalculationsResult,
} from '@/types/calculation.types';

export const calculationApi = {
  getEmployeeSalary: (employeeUuid: string) =>
    api.get<{ data: EmployeeSalary }>(`/compliance/employee-profiles/${employeeUuid}/salary`),

  calculateTax: (payload: TaxCalculationPayload) =>
    api.post<{ data: TaxCalculationResult }>('/compliance/calculate/tax', payload),

  calculateEOBI: (payload: EOBICalculationPayload) =>
    api.post<{ data: EOBICalculationResult }>('/compliance/calculate/eobi', payload),

  calculateSocialSecurity: (payload: SocialSecurityCalculationPayload) =>
    api.post<{ data: SocialSecurityCalculationResult }>('/compliance/calculate/social-security', payload),

  calculateGratuity: (payload: GratuityCalculationPayload) =>
    api.post<{ data: GratuityCalculationResult }>('/compliance/calculate/gratuity', payload),

  calculateAll: (payload: AllCalculationsPayload) =>
    api.post<{ data: AllCalculationsResult }>('/compliance/calculate/all', payload),
};