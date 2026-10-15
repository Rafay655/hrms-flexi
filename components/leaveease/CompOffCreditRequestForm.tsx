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

interface CompOffCreditRequestFormProps {
  isOpen?: boolean;
  onSubmit?: (data: any) => void;
  onClose: () => void;
}

const EMPLOYEES = ["Sana Ahmed","Muhammad Ali","Ayesha Malik","Bilal Hassan","Umar Farooq"];
const SOURCES = ["Worked on Public Holiday","Worked on Weekend","Approved Extra Shift","Approved OT"];

export function CompOffCreditRequestForm({ isOpen = true, onSubmit, onClose }: CompOffCreditRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ employee: "", workDate: "", hoursWorked: "", source: "", approver: "", notes: "" });
  const compOffDays = form.hoursWorked ? (Number(form.hoursWorked) / 8).toFixed(2) : "0";

  const handleSubmit = async () => {
    if (!form.employee || !form.workDate || !form.hoursWorked) { toast.error("Required fields missing"); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Comp-Off credit of ${compOffDays} days requested for ${form.employee}`);
    onSubmit?.(form); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Request Comp-Off Credit</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Employee <span className="text-red-500">*</span></Label>
            <Select value={form.employee} onValueChange={v => setForm(f => ({...f, employee: v}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent>{EMPLOYEES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Work Date <span className="text-red-500">*</span></Label><Input type="date" value={form.workDate} onChange={e => setForm(f => ({...f, workDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Hours Worked <span className="text-red-500">*</span></Label><Input type="number" value={form.hoursWorked} onChange={e => setForm(f => ({...f, hoursWorked: e.target.value}))} placeholder="8" className="mt-1" /></div>
          </div>
          {form.hoursWorked && <div className="p-3 bg-brand-100/40 rounded-lg text-sm"><span className="text-muted-foreground">Comp-Off Days Earned: </span><span className="font-bold text-brand-800">{compOffDays} days</span></div>}
          <div><Label>Source</Label>
            <Select value={form.source} onValueChange={v => setForm(f => ({...f, source: v}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select source..." /></SelectTrigger>
              <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes..." className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
