"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { engageBoardRecognitionsService } from "@/services/engageboard-recognitions.service";
import type {
  BadgeCategory,
  FrequencyLimit,
  WhoCanAward,
} from "@/types/engageboard-recognitions.types";

/**
 * Badge catalog admin — GET/POST /engageboard/recognitions/badges
 * (RecognitionBadgeController). Dense admin table per 03-design-system.md §5.
 *
 * There is no update/delete/deactivate endpoint for badges anywhere in
 * backend/routes/engageboard/recognitions.php (verified — only index/store
 * are routed) — this page is Create + List only; it does not fabricate an
 * edit/delete affordance the API can't back.
 */
export default function RecognitionBadgesAdminPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: badges = [], isLoading, isError } = useQuery({
    queryKey: ["engageboard", "recognitions", "badges"],
    queryFn: engageBoardRecognitionsService.listBadges,
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState<BadgeCategory>("peer");
  const [points, setPoints] = useState(10);
  const [whoCanAward, setWhoCanAward] = useState<WhoCanAward>("peer");
  const [frequencyLimit, setFrequencyLimit] = useState<FrequencyLimit>("unlimited");

  const createMutation = useMutation({
    mutationFn: engageBoardRecognitionsService.createBadge,
    onSuccess: () => {
      toast.success("Badge created.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "recognitions", "badges"] });
      setOpen(false);
      setName("");
      setPoints(10);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not create this badge.";
      toast.error(message);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Badge name is required.");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      category,
      points_attached: points,
      who_can_award: whoCanAward,
      frequency_limit: frequencyLimit,
      active: true,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            EngageBoard · Recognitions
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Badge catalog</h1>
          <p className="text-sm text-gray-500">Manage the badges employees can be recognized with.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create badge</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BadgeCategory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="values">Values</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="peer">Peer</SelectItem>
                    <SelectItem value="hr_award">HR Award</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Points attached</Label>
                <Input
                  type="number"
                  min={0}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Who can award</Label>
                <Select value={whoCanAward} onValueChange={(v) => setWhoCanAward(v as WhoCanAward)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr_only">HR only</SelectItem>
                    <SelectItem value="manager">Manager (and HR)</SelectItem>
                    <SelectItem value="peer">Peer (anyone)</SelectItem>
                    <SelectItem value="system">System (automated only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Frequency limit</Label>
                <Select
                  value={frequencyLimit}
                  onValueChange={(v) => setFrequencyLimit(v as FrequencyLimit)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="once">Once ever</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create badge"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}
      {isError && <p className="text-sm text-gray-500">Could not load badges. Please refresh.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Who can award</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    No badges yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {badges.map((badge) => (
                <TableRow key={badge.uuid}>
                  <TableCell className="font-medium text-brand-900">{badge.name}</TableCell>
                  <TableCell className="capitalize">{badge.category.replace("_", " ")}</TableCell>
                  <TableCell className="tabular-nums">{badge.points_attached ?? 0}</TableCell>
                  <TableCell className="capitalize">{badge.who_can_award.replace("_", " ")}</TableCell>
                  <TableCell className="capitalize">{badge.frequency_limit ?? "unlimited"}</TableCell>
                  <TableCell>
                    <Badge variant={badge.active ? "default" : "outline"}>
                      {badge.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
