"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IncentiveRuleFormProps {
  isOpen?: boolean;
  mode?: "create" | "edit";
  initialData?: any;
  onSubmit?: (data: any) => void;
  onClose: () => void;
}

const CONDITIONS = ["No unpaid leave","Zero lates","No short leave","No unauthorized absence","Full attendance","No half-days"];

export function IncentiveRuleForm({ isOpen = true, mode = "edit", initialData, onSubmit, onClose }: IncentiveRuleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name || "",
    window: initialData?.window || "Monthly",
    conditions: initialData?.conditions || [] as string[],
    awardType: "Leave",
    awardDays: "",
    awardLeaveType: "Casual Leave",
    status: "Active",
  });

  const toggleCond = (c: string) => setForm(f => ({...f, conditions: f.conditions.includes(c) ? f.conditions.filter((x: string) => x !== c) : [...f.conditions, c]}));

  const handleSubmit = async () => {
    if (!form.name || form.conditions.length === 0) { toast.error("Name and at least one condition required"); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Incentive rule ${mode === "create" ? "created" : "updated"}`);
    onSubmit?.(form); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === "create" ? "Create" : "Edit"} Incentive Rule</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Rule Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Perfect Attendance Bonus" className="mt-1" /></div>
          <div><Label>Evaluation Window</Label>
            <Select value={form.window} onValueChange={v => setForm(f => ({...f, window: v}))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Annual">Annual</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Conditions <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">{CONDITIONS.map(c => <Badge key={c} onClick={() => toggleCond(c)} className={`cursor-pointer text-xs ${form.conditions.includes(c) ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground"}`}>{c}</Badge>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Award Days</Label><Input type="number" value={form.awardDays} onChange={e => setForm(f => ({...f, awardDays: e.target.value}))} placeholder="1" step="0.5" className="mt-1" /></div>
            <div><Label>Leave Type</Label>
              <Select value={form.awardLeaveType} onValueChange={v => setForm(f => ({...f, awardLeaveType: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Annual Leave">Annual Leave</SelectItem><SelectItem value="Casual Leave">Casual Leave</SelectItem><SelectItem value="Comp-Off">Comp-Off</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3"><Switch checked={form.status === "Active"} onCheckedChange={v => setForm(f => ({...f, status: v ? "Active" : "Inactive"}))} /><Label>Active</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
