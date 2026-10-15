"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeaveTypeFormProps {
  isOpen?: boolean;
  mode?: "create" | "edit";
  initialData?: any;
  onSubmit?: (data: any) => void;
  onClose: () => void;
}

export function LeaveTypeForm({ isOpen = true, mode = "edit", initialData, onSubmit, onClose }: LeaveTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    category: initialData?.category || "Paid",
    unit: initialData?.unit || "Days",
    quota: initialData?.quota || "",
    accrual: initialData?.accrual || "Monthly",
    status: initialData?.status || "Active",
    description: initialData?.description || "",
  });

  const handleSubmit = async () => {
    if (!form.code || !form.name) { toast.error("Code and Name are required"); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Leave type ${mode === "create" ? "created" : "updated"} successfully`);
    onSubmit?.(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Leave Type" : "Edit Leave Type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Code <span className="text-red-500">*</span></Label><Input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} placeholder="e.g. ANNUAL" className="mt-1" /></div>
            <div><Label>Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Annual Leave" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({...f, unit: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Days">Days</SelectItem><SelectItem value="Half-days">Half-days</SelectItem><SelectItem value="Hours">Hours</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Annual Quota</Label><Input value={form.quota} onChange={e => setForm(f => ({...f, quota: e.target.value}))} placeholder="14 days/year" className="mt-1" /></div>
            <div><Label>Accrual</Label>
              <Select value={form.accrual} onValueChange={v => setForm(f => ({...f, accrual: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="On Join">On Join</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="mt-1" placeholder="Brief description of this leave type..." /></div>
          <div className="flex items-center gap-3">
            <Switch checked={form.status === "Active"} onCheckedChange={v => setForm(f => ({...f, status: v ? "Active" : "Inactive"}))} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
