// hooks/useCalculations.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { calculationApi } from '@/services/calculation.service';
import type {
  EmployeeSalary,
  TaxCalculationPayload,
  EOBICalculationPayload,
  SocialSecurityCalculationPayload,
  GratuityCalculationPayload,
  AllCalculationsPayload,
} from '@/types/calculation.types';

export const CALCULATION_QUERY_KEY = 'calculation';

export function useEmployeeSalary(employeeUuid: string) {
  return useQuery({
    queryKey: [CALCULATION_QUERY_KEY, 'salary', employeeUuid],
    queryFn: async () => {
      const { data } = await calculationApi.getEmployeeSalary(employeeUuid);
      return data.data;
    },
    enabled: !!employeeUuid,
  });
}

export function useCalculateTax() {
  return useMutation({
    mutationFn: (payload: TaxCalculationPayload) => calculationApi.calculateTax(payload),
  });
}

export function useCalculateEOBI() {
  return useMutation({
    mutationFn: (payload: EOBICalculationPayload) => calculationApi.calculateEOBI(payload),
  });
}

export function useCalculateSocialSecurity() {
  return useMutation({
    mutationFn: (payload: SocialSecurityCalculationPayload) => calculationApi.calculateSocialSecurity(payload),
  });
}

export function useCalculateGratuity() {
  return useMutation({
    mutationFn: (payload: GratuityCalculationPayload) => calculationApi.calculateGratuity(payload),
  });
}

export function useCalculateAll() {
  return useMutation({
    mutationFn: (payload: AllCalculationsPayload) => calculationApi.calculateAll(payload),
  });
}