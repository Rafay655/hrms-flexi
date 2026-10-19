"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gauge, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { enpsService } from "@/services/engageboard-enps.service";
import { departmentService } from "@/services/department.service";
import { locationService } from "@/services/location.service";
import { gradeBandService } from "@/services/grade-band.service";
import type { EnpsFrequency, StoreEnpsCampaignInput } from "@/types/engageboard-enps.types";
import type { SurveyAnonymity, TargetAudienceType } from "@/types/engageboard-pulsecheck.types";

const FREQUENCIES: Array<{ value: EnpsFrequency; label: string }> = [
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "ad_hoc", label: "Ad Hoc" },
];

const AUDIENCE_TYPES: Array<{ value: TargetAudienceType; label: string; disabled?: boolean }> = [
  { value: "all", label: "All employees" },
  { value: "department", label: "Specific departments" },
  { value: "location", label: "Specific locations" },
  { value: "grade", label: "Specific grade bands" },
  // Round-1 review (Defect 1, same fix as surveys/new/page.tsx): no
  // numeric-employee-id search endpoint exists to build a safe custom_group
  // picker against — disabled rather than shipped silently broken.
  { value: "custom_group", label: "Custom group (not yet supported)", disabled: true },
];

/**
 * Round-1 review, Defect 1 (gating) — identical fix to
 * `surveys/new/page.tsx`'s `AudienceValuesPicker` (kept as a separate local
 * component here rather than a shared one, since this node's file-scope
 * allow-list enumerates named component files and neither page is meant to
 * import UI from the other). Real multi-select against the same FlexiMeta
 * lookup services, same numeric ids `EmployeeFieldResolver` resolves.
 */
function AudienceValuesPicker({
  audienceType,
  selectedIds,
  onChange,
}: {
  audienceType: TargetAudienceType;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: ["flexi-meta", "departments", "audience-picker"],
    queryFn: () => departmentService.getAll({ per_page: 200 }),
    enabled: audienceType === "department",
    staleTime: 5 * 60_000,
  });
  const { data: locations, isLoading: loadingLocations } = useQuery({
    queryKey: ["flexi-meta", "locations", "audience-picker"],
    queryFn: () => locationService.getAll({ per_page: 200 }),
    enabled: audienceType === "location",
    staleTime: 5 * 60_000,
  });
  const { data: gradeBands, isLoading: loadingGradeBands } = useQuery({
    queryKey: ["flexi-meta", "grade-bands", "audience-picker"],
    queryFn: () => gradeBandService.getAll({ per_page: 200 }),
    enabled: audienceType === "grade",
    staleTime: 5 * 60_000,
  });

  if (audienceType === "all") return null;

  const options =
    audienceType === "department"
      ? (departments?.data ?? []).map((d) => ({ id: d.id, name: d.name }))
      : audienceType === "location"
        ? (locations?.data ?? []).map((l) => ({ id: l.id, name: l.name }))
        : (gradeBands?.data ?? []).map((g) => ({ id: g.id, name: g.name }));
  const loading = loadingDepartments || loadingLocations || loadingGradeBands;

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]);
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {audienceType === "department" ? "Departments" : audienceType === "location" ? "Locations" : "Grade bands"}
      </label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-1.5">
        {loading ? (
          <p className="px-2 py-3 text-xs text-gray-400">Loading options...</p>
        ) : options.length === 0 ? (
          <p className="px-2 py-3 text-xs text-gray-400">No options found.</p>
        ) : (
          options.map((opt) => (
            <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
              <Checkbox checked={selectedIds.includes(opt.id)} onCheckedChange={() => toggle(opt.id)} />
              {opt.name}
            </label>
          ))
        )}
      </div>
      {!loading && selectedIds.length === 0 && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          Select at least one — this campaign cannot be created targeted to zero items.
        </p>
      )}
    </div>
  );
}

/** `/engageboard/enps/campaigns` — GET/POST /engageboard/enps/campaigns (EB-ENPS-005/006). */
export default function EnpsCampaignsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<EnpsFrequency>("quarterly");
  const [anonymity, setAnonymity] = useState<SurveyAnonymity>("semi_anonymous");
  const [audienceType, setAudienceTypeRaw] = useState<TargetAudienceType>("all");
  const [audienceValues, setAudienceValues] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Values from one audience type never carry over to another.
  function setAudienceType(next: TargetAudienceType) {
    setAudienceTypeRaw(next);
    setAudienceValues([]);
  }

  const { data: campaigns, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "enps", "campaigns"],
    queryFn: () => enpsService.getCampaigns(),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreEnpsCampaignInput) => enpsService.createCampaign(payload),
    onSuccess: () => {
      toast.success("Campaign created.");
      setDialogOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setAudienceType("all");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "enps", "campaigns"] });
    },
    onError: () => toast.error("Could not create the campaign. Please check the required fields and try again."),
  });

  const launchMutation = useMutation({
    mutationFn: (uuid: string) => enpsService.launchCampaign(uuid),
    onSuccess: (result) => {
      toast.success(`Campaign launched — ${result.invitations_created} invitation(s) sent.`);
      queryClient.invalidateQueries({ queryKey: ["engageboard", "enps", "campaigns"] });
    },
    onError: () => toast.error("Could not launch this campaign."),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate) {
      toast.error("Name and start date are required.");
      return;
    }
    if (audienceType !== "all" && audienceValues.length === 0) {
      toast.error("Select at least one target for the chosen audience type.");
      return;
    }
    createMutation.mutate({
      name,
      frequency,
      anonymity,
      target_audience: { type: audienceType, values: audienceType === "all" ? [] : audienceValues },
      start_date: startDate,
      end_date: endDate || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · eNPS</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">eNPS Campaigns</h1>
          <p className="text-sm text-gray-500">Launch, close and review eNPS measurement campaigns.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New eNPS Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label htmlFor="campaign-name" className="mb-1 block text-xs font-medium text-gray-500">
                  Name
                </label>
                <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Q1 2026 eNPS" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Frequency</label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as EnpsFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Anonymity</label>
                  <Select value={anonymity} onValueChange={(v) => setAnonymity(v as SurveyAnonymity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="named">Named</SelectItem>
                      <SelectItem value="semi_anonymous">Semi-Anonymous</SelectItem>
                      <SelectItem value="fully_anonymous">Fully Anonymous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Target audience</label>
                <Select value={audienceType} onValueChange={(v) => setAudienceType(v as TargetAudienceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value} disabled={a.disabled}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AudienceValuesPicker audienceType={audienceType} selectedIds={audienceValues} onChange={setAudienceValues} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="campaign-start" className="mb-1 block text-xs font-medium text-gray-500">
                    Start date
                  </label>
                  <Input id="campaign-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="campaign-end" className="mb-1 block text-xs font-medium text-gray-500">
                    End date (optional)
                  </label>
                  <Input id="campaign-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || (audienceType !== "all" && audienceValues.length === 0)}
                >
                  {createMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load campaigns. Please refresh.
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[56px] animate-pulse rounded-xl bg-gray-50" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {campaigns.map((campaign) => (
              <div key={campaign.uuid} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  <Gauge className="h-4 w-4" />
                </span>
                <Link href={`/engageboard/enps/campaigns/${campaign.uuid}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-900">{campaign.survey.title}</p>
                  <p className="text-xs text-gray-400">
                    {campaign.frequency ?? "ad hoc"} · {campaign.survey.status}
                  </p>
                </Link>
                {campaign.survey.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => launchMutation.mutate(campaign.uuid)}
                    disabled={launchMutation.isPending}
                  >
                    Launch
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-gray-500">No eNPS campaigns yet. Create your first campaign to start measuring loyalty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
