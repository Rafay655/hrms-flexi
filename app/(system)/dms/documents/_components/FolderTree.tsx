"use client";

/**
 * app/(system)/dms/documents/_components/FolderTree.tsx
 * DMS — Folder Tree Navigation
 *
 * Recursive collapsible folder tree driven by getFolderTree().
 * Clicking a folder fires onFolderSelect(folder.id); clicking the active
 * folder fires onFolderSelect(null) to clear the filter.
 *
 * Prop surface:
 *   onFolderSelect(folderId: number | null)  — wire to documents page filter
 *   selectedFolderId: number | null          — currently active folder
 *   className?: string                       — outer wrapper override
 *
 * Visual rules:
 *   • Active folder: blue-tinted row + left accent bar
 *   • System folders: Lock icon; personal folders: Folder icon
 *   • Collapse chevron only rendered when folder has children
 *   • "All documents" row always at the top, clears the filter
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *   • Tree uses role="tree" / role="treeitem" semantics
 *   • aria-expanded on nodes with children
 *   • aria-current="true" on the active item
 *   • Keyboard: Enter/Space activates; all buttons are real <button>s
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Files,
  Folder,
  FolderOpen,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getFolderTree } from "@/services/dms.service";
import type { DmsFolder } from "@/types/dms";

import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FolderTreeProps {
  onFolderSelect: (folderId: number | null) => void;
  selectedFolderId: number | null;
  className?: string;
}

// ── Recursive node ────────────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: DmsFolder;
  depth: number;
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
}

function FolderNode({
  folder,
  depth,
  selectedFolderId,
  onFolderSelect,
}: FolderNodeProps) {
  const hasChildren = (folder.children?.length ?? 0) > 0;
  // Auto-expand depth-0 folders so the tree isn't completely collapsed on load
  const [expanded, setExpanded] = useState(depth === 0);
  const isActive = selectedFolderId === folder.id;

  const handleClick = () => {
    // Toggle active: clicking the active folder deselects (shows all)
    onFolderSelect(isActive ? null : folder.id);
    if (hasChildren) setExpanded((prev) => !prev);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const FolderIcon = folder.is_system
    ? Lock
    : isActive || expanded
      ? FolderOpen
      : Folder;

  return (
    <li role="treeitem" aria-selected={isActive} aria-expanded={hasChildren ? expanded : undefined}>
      <button
        type="button"
        onClick={handleClick}
        aria-current={isActive ? "true" : undefined}
        aria-label={`${isActive ? "Clear filter for" : "Filter by"} folder: ${folder.name}`}
        className={cn(
          "group relative flex w-full items-center gap-2 rounded-md py-1.5 pr-3 text-left text-sm transition-colors",
          // indent by depth — 12px per level, 8px base left padding
          isActive
            ? "bg-brand-100 text-brand-800 font-medium"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span
            className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-full bg-brand-700"
            aria-hidden="true"
          />
        )}

        {/* Chevron / spacer */}
        {hasChildren ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleChevronClick}
            aria-label={expanded ? "Collapse folder" : "Expand folder"}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-black/10"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            )}
          </span>
        ) : (
          <span className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}

        {/* Folder icon */}
        <FolderIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            folder.is_system
              ? "text-amber-500"
              : isActive
                ? "text-brand-700"
                : "text-gray-400 group-hover:text-gray-600",
          )}
          aria-hidden="true"
        />

        {/* Name */}
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>

        {/* System badge */}
        {folder.is_system && (
          <span
            className="ml-auto shrink-0 text-[10px] font-medium text-amber-600"
            aria-label="System folder"
          >
            sys
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="group" className="mt-0.5 space-y-0.5">
          {folder.children!.map((child) => (
            <FolderNode
              key={child.uuid}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FolderTree({
  onFolderSelect,
  selectedFolderId,
  className,
}: FolderTreeProps) {
  const { data: folders = [], isLoading, isError } = useQuery({
    queryKey: ["dms", "folders"],
    queryFn: () => getFolderTree(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-1.5 px-2 py-3", className)} aria-busy="true">
        {[120, 96, 140, 108].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-md" style={{ width: w }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className={cn("px-3 py-2 text-xs text-destructive", className)}>
        Failed to load folders.
      </p>
    );
  }

  return (
    <nav
      className={cn("px-2 py-2", className)}
      aria-label="Document folders"
    >
      <ul role="tree" className="space-y-0.5">
        {/* "All documents" — always first */}
        <li role="treeitem" aria-selected={selectedFolderId === null}>
          <button
            type="button"
            onClick={() => onFolderSelect(null)}
            aria-current={selectedFolderId === null ? "true" : undefined}
            aria-label="Show all documents"
            className={cn(
              "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              selectedFolderId === null
                ? "bg-brand-100 text-brand-800 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            {selectedFolderId === null && (
              <span
                className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-full bg-brand-700"
                aria-hidden="true"
              />
            )}
            {/* Spacer aligns with nodes that have chevrons */}
            <span className="h-4 w-4 shrink-0" aria-hidden="true" />
            <Files
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                selectedFolderId === null
                  ? "text-brand-700"
                  : "text-gray-400",
              )}
              aria-hidden="true"
            />
            <span>All documents</span>
          </button>
        </li>

        {/* Section divider */}
        {folders.length > 0 && (
          <li role="presentation">
            <div className="mx-2 my-1 border-t border-gray-100" />
          </li>
        )}

        {/* Folder nodes */}
        {folders.map((folder) => (
          <FolderNode
            key={folder.uuid}
            folder={folder}
            depth={0}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
          />
        ))}

        {folders.length === 0 && !isLoading && (
          <li>
            <p className="px-3 py-2 text-xs text-gray-400">
              No folders yet.
            </p>
          </li>
        )}
      </ul>
    </nav>
  );
}
