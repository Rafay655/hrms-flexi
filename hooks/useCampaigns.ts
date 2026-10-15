import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCampaign,
  deleteCampaign,
  duplicateCampaign,
  fetchCampaign,
  fetchCampaigns,
  publishCampaign,
  unpublishCampaign,
  updateCampaign,
} from "@/services/campaigns";
import type { Campaign } from "@/types/campaigns";

export const useCampaigns = (page: number = 1, search: string = "", perPage: number = 10) => {
  return useQuery({
    queryKey: ["campaigns", page, search, perPage],
    queryFn: () => fetchCampaigns(page, search, perPage),
    placeholderData: (previousData) => previousData,
  });
};

export const useCampaign = (uuid: string) => {
  return useQuery({
    queryKey: ["campaign", uuid],
    queryFn: () => fetchCampaign(uuid),
    enabled: !!uuid,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createCampaign(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, formData }: { uuid: string; formData: FormData }) =>
      updateCampaign(uuid, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteCampaign(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const usePublishCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => publishCampaign(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useUnpublishCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => unpublishCampaign(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useDuplicateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => duplicateCampaign(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};