// lib/authApi.ts
import { api } from "./api";

export type ApiError = {
  status?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type LoginResponse = any; // because response shape not fully provided
export type ForgotResponse = {
  status: boolean;
  message: string;
  data: null;
};

export type VerifyOtpResponse = {
  status: boolean;
  message: string;
  data: { reset_token: string };
};

export type ResetPasswordResponse = {
  status: boolean;
  message: string;
  data: null;
};

export async function loginApi(payload: {
  email: string;
  password: string;
  device_name?: string;
}) {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function forgotPasswordApi(payload: { email: string }) {
  const { data } = await api.post<ForgotResponse>("/auth/forgot-password", payload);
  return data;
}

export async function verifyOtpApi(payload: { email: string; otp: string }) {
  const { data } = await api.post<VerifyOtpResponse>("/auth/verify-otp", payload);
  return data;
}

export async function resetPasswordApi(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password", payload);
  return data;
}

export const sendLoginOtpApi = (payload: { email: string }) =>
  api.post("/auth/otp/send", payload).then((r) => r.data);

export const verifyLoginOtpApi = (payload: {
  email: string;
  otp: string;
  device_name?: string;
}) => api.post("/auth/otp/verify", payload).then((r) => r.data);