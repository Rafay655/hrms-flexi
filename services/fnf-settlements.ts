// services/fnf-settlements.ts

import { api } from "@/lib/api";
import type {
  FnfSettlementsResponse,
  ExitsResponse,
  FnfSettlement
} from "@/types/fnf-settlement";

/**
 * Fetch the list of Full & Final settlements.
 */
export async function fetchFnfSettlements(params: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}): Promise<FnfSettlementsResponse> {
  const { data } = await api.get("/pay-edge/fnf-settlements", { params });
  return data;
}

/**
 * Create a new FnF settlement.
 */
export async function createFnfSettlement(payload: {
  employee_id: string;
  separation_id: string;
  last_working_date: string;
  settlement_date: string;
  notes?: string;
}) {
  const { data } = await api.post("/pay-edge/fnf-settlements", payload);
  return data;
}

/**
 * Fetch the list of active exits (for the employee dropdown in the create form).
 */
export async function fetchExits(params?: {
  page?: number;
  per_page?: number;
}): Promise<ExitsResponse> {
  const { data } = await api.get("/people-hub/exits", { params });
  return data;
}


export async function fetchFnfSettlement(id: string): Promise<FnfSettlement> {
  const { data } = await api.get(`/pay-edge/fnf-settlements/${id}`);
  return data.data;
}

 
export interface CalculateFnfSettlementResponse {
  success: boolean;
  message: string;
  data: FnfSettlement;
}

export async function calculateFnfSettlement(
  id: string
): Promise<CalculateFnfSettlementResponse> {
  const response = await api.post<CalculateFnfSettlementResponse>(
    `/pay-edge/fnf-settlements/${id}/calculate`
  );
  return response.data;
}



export interface FnfSettlementAdjustmentsPayload {
  gratuity_amount?: number;
  leave_encashment_amount?: number;
  notice_period_recovery?: number;
  pending_loan_balance?: number;
  pending_advances?: number;
  pending_expense_claims?: number;
  bonus_proration?: number;
  other_recoveries?: number;
  other_earnings?: number;
  final_eobi_employee?: number;
  final_eobi_employer?: number;
  final_tax_deduction?: number;
  notes?: string;
}

export interface FnfSettlementAdjustmentsResponse {
  success: boolean;
  message: string;
  data: FnfSettlement;
}

export async function updateFnfSettlementAdjustments(
  id: string,
  payload: FnfSettlementAdjustmentsPayload
): Promise<FnfSettlementAdjustmentsResponse> {
  const response = await api.put<FnfSettlementAdjustmentsResponse>(
    `/pay-edge/fnf-settlements/${id}/adjustments`,
    payload
  );
  return response.data;
}

export async function submitFnfSettlement(id: string) {
  const response = await api.post<{ success: boolean; message: string; data: FnfSettlement }>(
    `/pay-edge/fnf-settlements/${id}/submit`
  );
  return response.data;
}

export async function approveFnfSettlement(id: string) {
  const { data } = await api.post(`/pay-edge/fnf-settlements/${id}/approve`);
  return data;
}

export async function payFnfSettlement(id: string, payload: { payment_reference: string }) {
  const { data } = await api.post(`/pay-edge/fnf-settlements/${id}/pay`, payload);
  return data;
}

export async function getFnfSettlementStatement(id: string) {
  const { data } = await api.get(`/pay-edge/fnf-settlements/${id}/statement`);
  return data;
}