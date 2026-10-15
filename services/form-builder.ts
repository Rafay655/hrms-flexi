// services/form-builder.service.ts
import { api } from "@/lib/api";
import type { FormBuildersResponse, FormBuildersQueryParams } from "@/types/form-builder";

export const fetchFormBuilders = async (
  params: FormBuildersQueryParams = {}
): Promise<FormBuildersResponse> => {
  const { data } = await api.get<FormBuildersResponse>("/flexi-hq/form-builders", {
    params,
  });
  return data;
};