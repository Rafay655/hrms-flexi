import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "@/services/announcements";
import type { Announcement } from "@/types/announcements";

export const useAnnouncements = (
  page: number = 1,
  search: string = "",
  perPage: number = 10
) => {
  return useQuery({
    queryKey: ["announcements", page, search, perPage],
    queryFn: () => fetchAnnouncements(page, search, perPage),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createAnnouncement(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, formData }: { uuid: string; formData: FormData }) =>
      updateAnnouncement(uuid, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};

export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => publishAnnouncement(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteAnnouncement(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};