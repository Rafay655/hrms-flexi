"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface EligibilityGroupFormProps {
  isOpen?: boolean;
  mode?: "create" | "edit";
  initialData?: any;
  onSubmit?: (data: any) => void;
  onSave?: (data: any) => void;
  onClose: () => void;
}

const LEAVE_TYPES = ["Annual Leave","Casual Leave","Sick Leave","Maternity Leave","Paternity Leave","Hajj Leave","Comp-Off"];
const DEPARTMENTS = ["Engineering","HR","Finance","Sales","Operations","Marketing","Admin"];
const EMP_TYPES = ["Permanent","Contract","Probation","Intern"];

export default function EligibilityGroupForm({ isOpen = true, mode = "edit", initialData, onSubmit, onSave, onClose }: EligibilityGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name || "",
    leaveTypes: initialData?.leaveTypes || [] as string[],
    departments: initialData?.departments || [] as string[],
    empTypes: initialData?.empTypes || [] as string[],
    minTenure: initialData?.minTenure || "0",
  });

  const toggle = (field: "leaveTypes" | "departments" | "empTypes", val: string) => {
    setForm(f => ({...f, [field]: f[field].includes(val) ? f[field].filter((v: string) => v !== val) : [...f[field], val]}));
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Group name is required"); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(`Eligibility group ${mode === "create" ? "created" : "updated"}`);
    onSubmit?.(form); onSave?.(form); onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{mode === "create" ? "Create" : "Edit"} Eligibility Group</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Group Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" placeholder="e.g. Factory Workers" /></div>
          <div><Label>Leave Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">{LEAVE_TYPES.map(lt => <Badge key={lt} onClick={() => toggle("leaveTypes", lt)} className={`cursor-pointer ${form.leaveTypes.includes(lt) ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground"}`}>{lt}</Badge>)}</div>
          </div>
          <div><Label>Departments</Label>
            <div className="flex flex-wrap gap-2 mt-2">{DEPARTMENTS.map(d => <Badge key={d} onClick={() => toggle("departments", d)} className={`cursor-pointer ${form.departments.includes(d) ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground"}`}>{d}</Badge>)}</div>
          </div>
          <div><Label>Employment Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">{EMP_TYPES.map(et => <Badge key={et} onClick={() => toggle("empTypes", et)} className={`cursor-pointer ${form.empTypes.includes(et) ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground"}`}>{et}</Badge>)}</div>
          </div>
          <div><Label>Minimum Tenure (months)</Label><Input type="number" value={form.minTenure} onChange={e => setForm(f => ({...f, minTenure: e.target.value}))} className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
