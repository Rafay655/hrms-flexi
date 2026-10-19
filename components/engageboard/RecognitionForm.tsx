"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  engageBoardRecognitionsService,
  searchEmployees,
} from "@/services/engageboard-recognitions.service";
import type { EmployeeOption, GiverRole } from "@/types/engageboard-recognitions.types";

/** Backend default for `config('engageboard.recognition.max_points_without_badge')`
 * — a client-side hint only; the real ceiling is enforced (and may be
 * tenant-configured differently) server-side regardless. */
const DEFAULT_MAX_POINTS_WITHOUT_BADGE = 500;

const schema = z.object({
  reason_message: z.string().min(1, "A recognition message is required.").max(500),
  visibility: z.enum(["public", "private"]),
  certificate_generated: z.boolean(),
  points: z.number().int().min(0, "Points cannot be negative."),
});

type FormValues = z.infer<typeof schema>;

export function RecognitionForm({
  giverRole,
  currentUserName,
  onGiven,
}: {
  giverRole: GiverRole;
  currentUserName?: string;
  onGiven?: () => void;
}) {
  const queryClient = useQueryClient();

  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipient, setRecipient] = useState<EmployeeOption | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(recipientQuery), 300);
    return () => clearTimeout(t);
  }, [recipientQuery]);

  const { data: employeeOptions = [], isFetching: searchingEmployees } = useQuery({
    queryKey: ["engageboard", "recognitions", "employee-search", debouncedQuery],
    queryFn: () => searchEmployees(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  // Best-effort UX-only self-exclusion (no reliable numeric self-id is
  // available client-side — see this component's usage docblock in
  // 20c-integration-snippet.md). The backend's SelfRecognitionException is
  // the real, authoritative guard regardless.
  const filteredOptions = useMemo(
    () =>
      employeeOptions.filter(
        (o) => !currentUserName || o.name.toLowerCase() !== currentUserName.toLowerCase(),
      ),
    [employeeOptions, currentUserName],
  );

  const { data: badges = [] } = useQuery({
    queryKey: ["engageboard", "recognitions", "badges"],
    queryFn: engageBoardRecognitionsService.listBadges,
    staleTime: 5 * 60_000,
  });

  // RecognitionBadge::canBeAwardedBy() — 'system' badges are never
  // human-awardable; the rest match the giver's resolved role.
  const awardableBadges = useMemo(
    () =>
      badges.filter((badge) => {
        if (badge.who_can_award === "system") return false;
        if (giverRole === "hr") return true;
        if (giverRole === "manager") return badge.who_can_award === "manager" || badge.who_can_award === "peer";
        return badge.who_can_award === "peer";
      }),
    [badges, giverRole],
  );

  const selectedBadge = awardableBadges.find((b) => b.uuid === selectedBadgeId) ?? null;
  const pointsCeiling = selectedBadge?.points_attached ?? DEFAULT_MAX_POINTS_WITHOUT_BADGE;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason_message: "",
      visibility: "public",
      certificate_generated: false,
      points: 0,
    },
  });

  // Points field is read-only + auto-set to the badge's fixed value whenever a
  // badge is selected — mirrors the backend's Round-1 security fix
  // (StoreRecognitionRequest::withValidator(): points capped at the badge's
  // points_attached when one is selected).
  useEffect(() => {
    if (selectedBadge) {
      setValue("points", selectedBadge.points_attached ?? 0);
    }
  }, [selectedBadge, setValue]);

  const points = watch("points");

  const giveMutation = useMutation({
    mutationFn: engageBoardRecognitionsService.give,
    onSuccess: () => {
      toast.success("Recognition given successfully.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "recognitions"] });
      reset();
      setRecipient(null);
      setRecipientQuery("");
      setSelectedBadgeId("");
      onGiven?.();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not give this recognition. Please try again.";
      toast.error(message);
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!recipient) {
      toast.error("Please choose who you're recognizing.");
      return;
    }

    // KNOWN BACKEND GAP (documented in 20c-integration-snippet.md):
    // RecognitionBadgeResource (GET/POST /recognitions/badges) never exposes a
    // badge's numeric `id` — only `uuid` — but
    // StoreRecognitionRequest.recognition_badge_id requires the numeric PK
    // (`Rule::exists('recognition_badges', 'id')`, plain `integer` rule; a
    // uuid string fails validation outright). There is no reachable endpoint
    // in this codebase that maps a badge uuid back to its numeric id, so a
    // badge-backed recognition genuinely cannot be submitted from any
    // frontend today. Rather than send a request guaranteed to fail
    // validation, block submission here with an explicit, actionable message
    // and let badge-less recognitions (which only need `points`) go through
    // normally.
    if (selectedBadge) {
      toast.error(
        "Giving recognition with a badge isn't available yet — the badge catalog API doesn't expose the field this form needs. Clear the badge to give points directly, or ask an admin to fix RecognitionBadgeResource.",
      );
      return;
    }

    giveMutation.mutate({
      recipient_id: recipient.id,
      recognition_badge_id: null,
      reason_message: values.reason_message,
      points: values.points,
      visibility: values.visibility,
      certificate_generated: values.certificate_generated,
    });
  };

  return (
    <Card className="gap-4 p-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Recognize</Label>
          <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="justify-between font-normal"
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <Search className="h-4 w-4 opacity-60" />
                  {recipient ? recipient.name : "Search for a colleague…"}
                </span>
                {recipient && (
                  <X
                    className="h-4 w-4 opacity-60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecipient(null);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type a name…"
                  value={recipientQuery}
                  onValueChange={setRecipientQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchingEmployees
                      ? "Searching…"
                      : recipientQuery.trim().length < 2
                        ? "Type at least 2 characters."
                        : "No employees found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => {
                          setRecipient(option);
                          setRecipientOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span>{option.name}</span>
                          <span className="text-xs text-gray-400">{option.employee_code}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Badge (optional)</Label>
          <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No badge — enter points manually" />
            </SelectTrigger>
            <SelectContent>
              {awardableBadges.map((badge) => (
                <SelectItem key={badge.uuid} value={badge.uuid}>
                  {badge.name} ({badge.points_attached ?? 0} pts)
                </SelectItem>
              ))}
              {awardableBadges.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-gray-400">
                  No badges available for your role.
                </div>
              )}
            </SelectContent>
          </Select>
          {selectedBadgeId && (
            <button
              type="button"
              className="w-fit text-xs text-gray-400 underline"
              onClick={() => setSelectedBadgeId("")}
            >
              Clear badge
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Points</Label>
          <Controller
            control={control}
            name="points"
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                max={selectedBadge ? undefined : pointsCeiling}
                readOnly={Boolean(selectedBadge)}
                disabled={Boolean(selectedBadge)}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={selectedBadge ? "bg-gray-50 text-gray-500" : ""}
              />
            )}
          />
          <p className="text-xs text-gray-400">
            {selectedBadge
              ? `Fixed by the "${selectedBadge.name}" badge — cannot be changed.`
              : `Up to ${pointsCeiling} points when no badge is selected.`}
          </p>
          {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Message</Label>
          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Tell them why you're recognizing them…"
            {...register("reason_message")}
          />
          {errors.reason_message && (
            <p className="text-xs text-destructive">{errors.reason_message.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" {...register("certificate_generated")} />
          Generate a downloadable certificate for this recognition
        </label>

        <div className="flex items-center justify-between gap-3">
          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <Button type="submit" disabled={isSubmitting || giveMutation.isPending}>
            {giveMutation.isPending ? "Giving recognition…" : "Give recognition"}
          </Button>
        </div>

        <p className="text-xs text-gray-400">Current points value: {points}</p>
      </form>
    </Card>
  );
}
