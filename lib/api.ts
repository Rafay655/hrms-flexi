// lib/api.ts
import axios, { InternalAxiosRequestConfig } from "axios";
import { store } from "@/store/store";
import { clearAuth } from "@/store/authSlice";
import { parseApiError } from "@/lib/api-error";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoints that should NOT trigger a full logout/redirect if they 401.
// Add any "best-effort" background calls here (e.g. device token registration,
// analytics pings) so a failure there doesn't nuke the user's session.
const silentFailEndpoints = ["/device-tokens"];
let sessionRedirecting = false;

api.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const publicEndpoints = ["/auth/login", "/auth/refresh"];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (isPublicEndpoint) {
      return config;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      const companyId = localStorage.getItem("companyId");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (companyId) {
        config.headers["X-Company-ID"] = companyId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Download endpoints return JSON errors as blobs. Preserve the Axios error
    // and HTTP metadata so callers can still inspect status/code and retry.
    if (typeof Blob !== "undefined" && error?.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Non-JSON errors use safe fallbacks. */ }
    }
    const status = error?.response?.status;
    const url = error?.config?.url ?? "";

    const isSilent = silentFailEndpoints.some((endpoint) =>
      url.includes(endpoint)
    );

    const isLogin = url.includes("/auth/login");
    if (status === 401 && !isLogin && !isSilent && typeof window !== "undefined") {
     
      store.dispatch(clearAuth());

     
      if (!sessionRedirecting && !window.location.pathname.startsWith("/auth/login")) {
        sessionRedirecting = true;
        try { sessionStorage.setItem("api-session-expired", "1"); } catch { /* Storage may be unavailable. */ }
        window.location.href = "/auth/login";
      }
    }

    // Preserve original errors; consumers outside Letter Forge can migrate gradually.
    if (error && typeof error === "object") {
      const parsed = parseApiError(error);
      error.apiError = parsed;
      // Legacy forms read top-level message/errors. Keep the unified envelope
      // and every other response field intact while supplying compatible aliases.
      const body = error.response?.data;
      if (body && typeof body === "object" && !(typeof Blob !== "undefined" && body instanceof Blob) && !Array.isArray(body)) {
        error.response.data = { ...body, message: parsed.message,
          ...(Object.keys(parsed.fieldErrors).length ? { errors: body.errors ?? parsed.fieldErrors } : {}),
        };
      }
    }
    return Promise.reject(error);
  }
);
