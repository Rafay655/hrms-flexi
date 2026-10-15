// components/announcements/PublishConfirmDialog.tsx
import React from "react";
import { Send, Bell } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Announcement } from "@/types/announcements";
import { CHANNEL_META } from "@/constants/announcements";

interface PublishConfirmDialogProps {
  target: Announcement | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const PublishConfirmDialog: React.FC<PublishConfirmDialogProps> = ({
  target,
  onClose,
  onConfirm,
}) => (
  <AlertDialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Publish announcement?</AlertDialogTitle>
        <AlertDialogDescription>
          {target
            ? `"${target.title}" will be sent to ${
                target.total_target_count > 0
                  ? `${target.total_target_count.toLocaleString()} recipient${target.total_target_count !== 1 ? "s" : ""}`
                  : "all eligible users"
              }. Published announcements cannot be edited.`
            : ""}
        </AlertDialogDescription>
      </AlertDialogHeader>

      {target && target.channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {target.channels.map((ch) => {
            const { label, Icon } = CHANNEL_META[ch] ?? { label: ch, Icon: Bell };
            return (
              <span key={ch} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                <Icon className="h-3 w-3" aria-hidden="true" />
                {label}
              </span>
            );
          })}
        </div>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          Publish Now
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);