"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface LeaveTypeVersionHistoryProps {
  isOpen?: boolean;
  leaveTypeCode?: string;
  typeName?: string;
  onClose: () => void;
}

const MOCK_VERSIONS = [
  { version: "v3.0", date: "Apr 1, 2025", by: "Ayesha Malik", change: "Quota increased from 14 to 21 days/year", isCurrent: true },
  { version: "v2.1", date: "Jan 1, 2025", by: "Sara Ahmed", change: "Accrual changed from Annual to Monthly" },
  { version: "v2.0", date: "Jul 1, 2024", by: "Ayesha Malik", change: "Category changed from Unpaid to Paid" },
  { version: "v1.0", date: "Jan 1, 2024", by: "Ayesha Malik", change: "Initial configuration" },
];

export function LeaveTypeVersionHistory({ isOpen = true, leaveTypeCode, typeName, onClose }: LeaveTypeVersionHistoryProps) {
  const label = leaveTypeCode || typeName || "Leave Type";
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" />Version History — {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {MOCK_VERSIONS.map((v, i) => (
            <div key={i} className={`p-3 rounded-lg border ${v.isCurrent ? "border-brand-500 bg-brand-100/30" : "border-border"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-800">{v.version}</span>
                  {v.isCurrent && <Badge className="bg-brand-800 text-white text-xs">Current</Badge>}
                </div>
                {!v.isCurrent && (
                  <Button variant="ghost" size="sm" onClick={() => { toast.success(`Reverted to ${v.version}`); onClose(); }}>
                    <RotateCcw className="h-3 w-3 mr-1" />Restore
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground">{v.change}</p>
              <p className="text-xs text-muted-foreground mt-1">{v.date} · by {v.by}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
