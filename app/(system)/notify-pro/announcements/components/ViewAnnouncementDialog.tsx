// components/announcements/ViewAnnouncementDialog.tsx
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/announcements";
import { STATUS_CONFIG, IMPORTANCE_CONFIG, CHANNEL_META } from "@/constants/announcements";
import { getAnnouncementStatus } from "@/lib/announcement-utils";
import { Bell } from "lucide-react";

interface ViewAnnouncementDialogProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export const ViewAnnouncementDialog: React.FC<ViewAnnouncementDialogProps> = ({
  announcement,
  onClose,
}) => {
  if (!announcement) return null;

  const status = getAnnouncementStatus(announcement);
  const statusCfg = STATUS_CONFIG[status];
  const importanceCfg = IMPORTANCE_CONFIG[announcement.importance] ?? IMPORTANCE_CONFIG.normal;
  const showReadStats = status === "published" || status === "expired";

  return (
    <Dialog open={!!announcement} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-[#1E1B4B]">Announcement Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border text-xs font-medium", statusCfg.className)}>{statusCfg.label}</Badge>
            <Badge className={cn("border text-xs font-medium", importanceCfg.className)}>{importanceCfg.label}</Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#1E1B4B]">{announcement.title}</h3>
          </div>

          {announcement.image_url && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <img src={announcement.image_url} alt={announcement.title} className="max-h-64 w-full object-cover" />
            </div>
          )}

          <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap">
            {announcement.body}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-700">Delivery Channels</h4>
            <div className="flex flex-wrap gap-2">
              {announcement.channels.map((ch) => {
                const { label, Icon } = CHANNEL_META[ch] ?? { label: ch, Icon: Bell };
                return (
                  <span key={ch} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-700">Target Audience</h4>
            {announcement.target_roles && announcement.target_roles.length > 0 ? (
              <p className="text-sm text-slate-600">{announcement.target_roles.join(", ")}</p>
            ) : (
              <p className="text-sm text-slate-600">All users</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {announcement.published_at && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-500">Published At</h4>
                <p className="text-sm text-slate-700">{format(new Date(announcement.published_at), "MMM d, yyyy · h:mm a")}</p>
              </div>
            )}
            {announcement.publish_at && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-500">Scheduled For</h4>
                <p className="text-sm text-slate-700">{format(new Date(announcement.publish_at), "MMM d, yyyy · h:mm a")}</p>
              </div>
            )}
            {announcement.expires_at && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-500">Expires At</h4>
                <p className="text-sm text-slate-700">{format(new Date(announcement.expires_at), "MMM d, yyyy · h:mm a")}</p>
              </div>
            )}
          </div>

          {showReadStats && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-700">Read Statistics</h4>
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-600">
                  {announcement.reads_count.toLocaleString()} / {announcement.total_target_count.toLocaleString()} read
                </p>
                <Progress
                  value={announcement.total_target_count > 0 ? (announcement.reads_count / announcement.total_target_count) * 100 : 0}
                  className="h-2 flex-1 bg-slate-100"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};