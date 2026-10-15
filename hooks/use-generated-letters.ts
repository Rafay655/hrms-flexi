"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dispatchLetter, getGeneratedLetter, getGeneratedLetters, getLetterDashboard, remindLetter, revokeLetter, supersedeLetter } from "@/services/generated-letters";
import type { CorrectionPayload, DispatchChannel, LetterFilters } from "@/types/generated-letters";
import { useAppSelector } from "@/store/hooks";
import { approveLetter, rejectLetter } from "@/services/generated-letters";
export function useLetterApproval(uuid: string) {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: generatedLetterKeys.all });
  const approve = useMutation({ mutationFn: () => approveLetter(uuid), retry: false, onSuccess });
  const reject = useMutation({ mutationFn: (reason: string) => rejectLetter(uuid, reason), retry: false, onSuccess });
  return { approve, reject };
}
export const generatedLetterKeys = { all: ["letter-forge", "letters"] as const, detail: (uuid: string) => ["letter-forge", "letters", "detail", uuid] as const };
export function useGeneratedLetters(filters: LetterFilters) {
  return useQuery({ queryKey: [...generatedLetterKeys.all, "list", filters], queryFn: ({ signal }) => getGeneratedLetters(filters, signal), placeholderData: (previous) => previous, retry: false });
}
export function useGeneratedLetter(uuid: string) {
  return useQuery({ queryKey: generatedLetterKeys.detail(uuid), queryFn: ({ signal }) => getGeneratedLetter(uuid, signal), enabled: Boolean(uuid), retry: false,
    refetchInterval: (query) => !query.state.error && query.state.data && ["generated", "approved"].includes(query.state.data.data.status) && !query.state.data.data.generated_pdf_path && query.state.dataUpdateCount < 20 ? 5000 : false });
}
export function useLetterDashboard(month?: string) {
  const companyId = useAppSelector((state) => state.auth.company?.id);
  return useQuery({ queryKey: [...generatedLetterKeys.all, "dashboard", companyId, month], queryFn: ({ signal }) => getLetterDashboard(signal, month), retry: false });
}
export function useGeneratedLetterActions(uuid: string) {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: generatedLetterKeys.all });
  const dispatch = useMutation({ mutationFn: (channel: DispatchChannel) => dispatchLetter(uuid, channel), retry: false, onSuccess });
  const remind = useMutation({ mutationFn: () => remindLetter(uuid), retry: false, onSuccess });
  const revoke = useMutation({ mutationFn: (reason: string) => revokeLetter(uuid, reason), retry: false, onSuccess });
  const supersede = useMutation({ mutationFn: (payload: CorrectionPayload) => supersedeLetter(uuid, payload), retry: false, onSuccess });
  return { dispatch, remind, revoke, supersede };
}
