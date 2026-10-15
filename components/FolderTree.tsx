"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DmsFolder } from "@/types/dms-folder";

interface FolderTreeProps {
  folders: DmsFolder[];
  onView: (folder: DmsFolder) => void;
  onEdit: (folder: DmsFolder) => void;
  onDelete: (uuid: string) => void;
  onAddSubfolder: (parent: DmsFolder) => void;
}

const FolderTreeItem: React.FC<{
  folder: DmsFolder;
  onView: (folder: DmsFolder) => void;
  onEdit: (folder: DmsFolder) => void;
  onDelete: (uuid: string) => void;
  onAddSubfolder: (parent: DmsFolder) => void;
}> = ({ folder, onView, onEdit, onDelete, onAddSubfolder }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;

  const toggleExpand = () => {
    if (hasChildren) setExpanded(!expanded);
  };

  return (
    <div className="ml-4 border-l border-gray-200 pl-2">
      <div className="flex items-center py-1 hover:bg-gray-50 rounded-md px-2 group transition-colors">
        <div className="flex items-center flex-1 cursor-pointer" onClick={toggleExpand}>
          {hasChildren ? (
            <span className="mr-1">
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </span>
          ) : (
            <span className="w-5" />
          )}
          {expanded ? (
            <FolderOpen className="h-5 w-5 text-yellow-500 mr-2" />
          ) : (
            <Folder className="h-5 w-5 text-yellow-500 mr-2" />
          )}
          <span className="font-medium text-gray-800">{folder.name}</span>
          {folder.is_system && (
            <Badge variant="outline" className="ml-2 text-xs bg-gray-100">
              System
            </Badge>
          )}
          <span className="text-xs text-gray-400 ml-2">({folder.folder_type})</span>
          {folder.children_count > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {folder.children_count}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(folder)}
            className="h-7 w-7 p-0"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubfolder(folder)}
            className="h-7 w-7 p-0"
            title="Add Subfolder"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(folder)}
            className="h-7 w-7 p-0"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(folder.uuid)}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="ml-2">
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.uuid}
              folder={child}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubfolder={onAddSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<FolderTreeProps> = ({
  folders = [], // 👈 Safe default – prevents undefined errors
  onView,
  onEdit,
  onDelete,
  onAddSubfolder,
}) => {
  // Root folders: those without a parent
  const rootFolders = folders.filter((f) => f.parent_id === null);

  return (
    <div className="space-y-1">
      {rootFolders.map((folder) => (
        <FolderTreeItem
          key={folder.uuid}
          folder={folder}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubfolder={onAddSubfolder}
        />
      ))}
    </div>
  );
};

export default FolderTree;