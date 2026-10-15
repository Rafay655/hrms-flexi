import {api} from "@/lib/api";
import type { CampaignsResponse, Campaign } from "@/types/campaigns";

export const fetchCampaigns = async (
  page: number = 1,
  search: string = "",
  perPage: number = 10
): Promise<CampaignsResponse> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (search.trim()) params.append("search", search.trim());
  params.append("per_page", perPage.toString());
  const response = await api.get(`/notify-pro/campaigns?${params.toString()}`);
  return response.data;
};

export const fetchCampaign = async (uuid: string): Promise<Campaign> => {
  const response = await api.get(`/notify-pro/campaigns/${uuid}`);
  return response.data.data;
};

export const createCampaign = async (formData: FormData): Promise<Campaign> => {
  const response = await api.post("/notify-pro/campaigns", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateCampaign = async (uuid: string, formData: FormData): Promise<Campaign> => {
  const response = await api.put(`/notify-pro/campaigns/${uuid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const deleteCampaign = async (uuid: string): Promise<void> => {
  await api.delete(`/notify-pro/campaigns/${uuid}`);
};

export const publishCampaign = async (uuid: string): Promise<Campaign> => {
  const response = await api.post(`/notify-pro/campaigns/${uuid}/publish`);
  return response.data.data;
};

export const unpublishCampaign = async (uuid: string): Promise<Campaign> => {
  const response = await api.post(`/notify-pro/campaigns/${uuid}/unpublish`);
  return response.data.data;
};

export const duplicateCampaign = async (uuid: string): Promise<Campaign> => {
  const response = await api.post(`/notify-pro/campaigns/${uuid}/duplicate`);
  return response.data.data;
};