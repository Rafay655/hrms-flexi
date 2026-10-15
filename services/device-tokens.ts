import { api } from "@/lib/api";

export interface DeviceTokenPayload {
  token: string;
  platform: "web" | "android" | "ios";
    device_name?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
}

export async function registerDeviceToken(payload: DeviceTokenPayload) {
  const { data } = await api.post("/notify-pro/device-tokens", payload);
  return data;
}

export async function unregisterDeviceToken(tokenUuid: string) {
  await api.delete(`/notify-pro/device-tokens/${tokenUuid}`);
}