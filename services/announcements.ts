import {api} from "@/lib/api"; // assuming you have an axios instance configured
import type { AnnouncementsResponse, Announcement } from "@/types/announcements";

export const fetchAnnouncements = async (
  page: number = 1,
  search: string = "",
  perPage: number = 10
): Promise<AnnouncementsResponse> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (search.trim()) params.append("search", search.trim());
  params.append("per_page", perPage.toString());
  const response = await api.get(`/notify-pro/announcements?${params.toString()}`);
  return response.data;
};

export const createAnnouncement = async (formData: FormData): Promise<Announcement> => {
  const response = await api.post("/notify-pro/announcements", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateAnnouncement = async (
  uuid: string,
  formData: FormData
): Promise<Announcement> => {
  formData.append("_method", "PUT");

  const response = await api.post(`/notify-pro/announcements/${uuid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const publishAnnouncement = async (uuid: string): Promise<Announcement> => {
  const response = await api.post(`/notify-pro/announcements/${uuid}/publish`);
  return response.data.data;
};

export const deleteAnnouncement = async (uuid: string): Promise<void> => {
  await api.delete(`/notify-pro/announcements/${uuid}`);
};