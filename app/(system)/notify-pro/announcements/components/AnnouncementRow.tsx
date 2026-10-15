// components/announcements/AnnouncementRow.tsx
import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Send,
  Archive,
  Pencil,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/announcements";
import { STATUS_CONFIG, IMPORTANCE_CONFIG } from "@/constants/announcements";
import { getAnnouncementStatus, truncateText } from "@/lib/announcement-utils";

interface AnnouncementRowProps {
  serial: number;
  announcement: Announcement;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onView: () => void;
  isArchiving: boolean;
}

export const AnnouncementRow: React.FC<AnnouncementRowProps> = ({
  serial,
  announcement: ann,
  onEdit,
  onPublish,
  onArchive,
  onView,
  isArchiving,
}) => {
  const status = getAnnouncementStatus(ann);
  const statusCfg = STATUS_CONFIG[status];
  const importanceCfg = IMPORTANCE_CONFIG[ann.importance] ?? IMPORTANCE_CONFIG.normal;
  const readPct =
    ann.total_target_count > 0
      ? Math.round((ann.reads_count / ann.total_target_count) * 100)
      : 0;

  const canEdit = ann.is_draft === true || !!ann.publish_at;
  const canPublish = ann.is_draft === true && !ann.is_published;
  const canArchive = ann.is_published === true;
  const showReadRate = ann.is_published === true;

  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{serial}</td>
      <td className="px-4 py-4 whitespace-nowrap">
        <Badge className={cn("border text-xs font-medium", statusCfg.className)}>
          {statusCfg.label}
        </Badge>
      </td>
      <td className="max-w-xs px-4 py-4">
        <p className="text-sm font-semibold text-[#1E1B4B]">
          {truncateText(ann.title, 20)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {truncateText(ann.body, 30)}
        </p>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <Badge className={cn("border text-xs font-medium", importanceCfg.className)}>
          {importanceCfg.label}
        </Badge>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {ann.target_roles && ann.target_roles.length > 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-slate-600">
            <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate max-w-[140px]">
              {ann.target_roles.slice(0, 2).join(", ")}
              {ann.target_roles.length > 2 && (
                <span className="ml-1 text-xs text-slate-400">+{ann.target_roles.length - 2}</span>
              )}
            </span>
          </span>
        ) : (
          <span className="text-sm text-slate-500">All users</span>
        )}
      </td>
      <td className="px-4 py-4">
        {showReadRate ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-[120px] cursor-default">
                  <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                    <span>
                      {ann.reads_count.toLocaleString()} / {ann.total_target_count.toLocaleString()} read
                    </span>
                    <span>{readPct}%</span>
                  </div>
                  <Progress value={readPct} className="h-1.5 bg-slate-100" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {ann.reads_count.toLocaleString()} of {ann.total_target_count.toLocaleString()} recipients have read this
                announcement.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
        {ann.published_at ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  {formatDistanceToNow(new Date(ann.published_at), { addSuffix: true })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(new Date(ann.published_at), "MMM d, yyyy · h:mm a")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : ann.publish_at ? (
          <span className="text-blue-600">
            Scheduled {format(new Date(ann.publish_at), "MMM d · h:mm a")}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
              aria-label={`Actions for "${ann.title}"`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
            )}
            {canPublish && (
              <DropdownMenuItem onClick={onPublish} className="gap-2">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Publish
              </DropdownMenuItem>
            )}
            {(canEdit || canPublish) && canArchive && <DropdownMenuSeparator />}
            {canArchive && (
              <DropdownMenuItem
                onClick={onArchive}
                disabled={isArchiving}
                className="gap-2 text-rose-600 focus:text-rose-700"
              >
                {isArchiving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isArchiving ? "Archiving…" : "Archive"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};