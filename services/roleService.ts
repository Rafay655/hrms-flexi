// services/roleService.ts
import { api } from "@/lib/api"; // adjust to your http client

export const roleService = {
  getAll: async () => {
    const { data } = await api.get("connect-central/access/roles", {
      params: { detailed: 0 },
    });
    return data as { success: boolean; message: string; data: { id: number; name: string }[] };
  },
};