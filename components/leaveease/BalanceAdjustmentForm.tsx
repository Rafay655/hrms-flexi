"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BalanceAdjustmentFormProps {
  isOpen?: boolean;
  onSubmit?: (data: any) => void;
  onClose: () => void;
}

const EMPLOYEES = ["Sana Ahmed","Muhammad Ali","Ayesha Malik","Bilal Hassan","Umar Farooq","Hira Khan","Danish Raza","Nadia Iqbal"];
const LEAVE_TYPES = ["Annual Leave","Casual Leave","Sick Leave","Comp-Off","Hajj Leave"];

export default function BalanceAdjustmentForm({ isOpen = true, onSubmit, onClose }: BalanceAdjustmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ employee: "", leaveType: "", adjType: "Credit", days: "", reason: "", effectiveDate: "" });

  const handleSubmit = async () => {
    if (!form.employee || !form.leaveType || !form.days || !form.reason) {
      toast.error("All fields are required"); return;
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Balance ${form.adjType === "Credit" ? "added" : "deducted"}: ${form.days} days of ${form.leaveType} for ${form.employee}`);
    onSubmit?.(form); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Balance Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Employee <span className="text-red-500">*</span></Label>
            <Select value={form.employee} onValueChange={v => setForm(f => ({...f, employee: v}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent>{EMPLOYEES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Leave Type</Label>
              <Select value={form.leaveType} onValueChange={v => setForm(f => ({...f, leaveType: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.adjType} onValueChange={v => setForm(f => ({...f, adjType: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Credit">Credit (+)</SelectItem><SelectItem value="Debit">Debit (-)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Days <span className="text-red-500">*</span></Label><Input type="number" value={form.days} onChange={e => setForm(f => ({...f, days: e.target.value}))} min="0.5" step="0.5" className="mt-1" /></div>
            <div><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({...f, effectiveDate: e.target.value}))} className="mt-1" /></div>
          </div>
          <div><Label>Reason <span className="text-red-500">*</span></Label><Textarea value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="Reason for adjustment..." className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : "Apply Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
