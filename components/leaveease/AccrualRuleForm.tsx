"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AccrualRuleFormProps {
  isOpen?: boolean;
  mode?: "create" | "edit";
  initialData?: any;
  onSubmit?: (data: any) => void;
  onClose: () => void;
}

const LEAVE_TYPES = ["Annual Leave","Casual Leave","Sick Leave","Maternity Leave","Paternity Leave","Hajj Leave","Comp-Off"];

export function AccrualRuleForm({ isOpen = true, mode = "edit", initialData, onSubmit, onClose }: AccrualRuleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: initialData?.leaveType || "",
    frequency: initialData?.frequency || "Monthly",
    amount: initialData?.amount || "",
    cap: initialData?.cap || "",
    prorateJoin: initialData?.prorateJoin ?? true,
    prorateExit: initialData?.prorateExit ?? true,
    lapse: initialData?.lapse || "End of year",
    status: initialData?.status || "Active",
  });

  const handleSubmit = async () => {
    if (!form.leaveType || !form.amount) { toast.error("Leave type and amount are required"); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Accrual rule ${mode === "create" ? "created" : "updated"}`);
    onSubmit?.(form); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === "create" ? "Create" : "Edit"} Accrual Rule</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Leave Type <span className="text-red-500">*</span></Label>
            <Select value={form.leaveType} onValueChange={v => setForm(f => ({...f, leaveType: v}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>{LEAVE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => setForm(f => ({...f, frequency: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="On Join">On Join</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount <span className="text-red-500">*</span></Label>
              <Input value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="e.g. 2 days/month" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Max Cap</Label><Input value={form.cap} onChange={e => setForm(f => ({...f, cap: e.target.value}))} placeholder="e.g. 30 days" className="mt-1" /></div>
            <div><Label>Lapse Rule</Label>
              <Select value={form.lapse} onValueChange={v => setForm(f => ({...f, lapse: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="End of year">End of year</SelectItem>
                  <SelectItem value="End of Q1">End of Q1</SelectItem>
                  <SelectItem value="Never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-brand-100/30 rounded-lg">
            <div className="flex items-center gap-3"><Switch checked={form.prorateJoin} onCheckedChange={v => setForm(f => ({...f, prorateJoin: v}))} /><Label>Prorate on Join</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.prorateExit} onCheckedChange={v => setForm(f => ({...f, prorateExit: v}))} /><Label>Prorate on Exit</Label></div>
          </div>
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
