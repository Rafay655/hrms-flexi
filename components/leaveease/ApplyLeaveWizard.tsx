"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface ApplyLeaveWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  selectedLeaveType?: string;
}

const LEAVE_TYPES = [
  "Annual Leave", "Casual Leave", "Sick Leave",
  "Maternity Leave", "Paternity Leave", "Hajj Leave",
  "Iddah Leave", "Study Leave", "Compassionate Leave",
  "Unpaid Leave", "Comp-Off",
];

export function ApplyLeaveWizard({ isOpen, onClose, onSubmit, selectedLeaveType }: ApplyLeaveWizardProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: selectedLeaveType ? String(selectedLeaveType) : "", fromDate: "", toDate: "", reason: "", category: ""
  });

  const steps = ["Leave Type", "Dates & Reason", "Review"];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    toast.success("Leave request submitted successfully. Your manager will be notified.");
    onSubmit?.(form);
    onClose();
    setStep(0);
    setForm({ leaveType: "", fromDate: "", toDate: "", reason: "", category: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs font-medium ${i === step ? "text-brand-800" : "text-muted-foreground"}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? "bg-brand-800 text-white" : i < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              {s}{i < steps.length - 1 && <ChevronRight className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <Label>Select Leave Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPES.map(lt => (
                <button key={lt} onClick={() => setForm(f => ({...f, leaveType: lt}))}
                  className={`p-3 rounded-lg border text-sm text-left transition-all ${form.leaveType === lt ? "border-brand-800 bg-brand-100 text-brand-800 font-semibold" : "border-border hover:border-brand-400"}`}>
                  {lt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>From Date</Label><Input type="date" value={form.fromDate} onChange={e => setForm(f => ({...f, fromDate: e.target.value}))} className="mt-1" /></div>
              <div><Label>To Date</Label><Input type="date" value={form.toDate} onChange={e => setForm(f => ({...f, toDate: e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Reason</Label><Textarea placeholder="Briefly explain your leave reason..." value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} className="mt-1" /></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 p-4 bg-brand-100/30 rounded-xl border border-brand-300/30">
            <h4 className="font-semibold text-brand-800">Review Your Request</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Leave Type:</span><span className="font-medium">{form.leaveType}</span>
              <span className="text-muted-foreground">From:</span><span className="font-medium">{form.fromDate}</span>
              <span className="text-muted-foreground">To:</span><span className="font-medium">{form.toDate}</span>
              <span className="text-muted-foreground">Reason:</span><span className="font-medium">{form.reason}</span>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
            {step === 0 ? "Cancel" : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.leaveType} className="bg-brand-800 text-white hover:bg-brand-700">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
