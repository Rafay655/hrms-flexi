"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Star,
  Clock,
  Trash2,
  FolderPlus,
  Pencil,
  Eye,
  Home,
  Folders,
  Loader2,
  FileText,
  Download,
  Upload,
  FileUp,
  CheckCircle,
  History,
  RotateCcw,
  MoreVertical,
} from "lucide-react";
import type { DmsFolder } from "@/types/dms-folder";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Brand tokens (Flexi palette)
// ---------------------------------------------------------------------------
const brandVars: React.CSSProperties = {
  ["--brand-900" as any]: "#1E1A3A",
  ["--brand-800" as any]: "#322E53",
  ["--brand-700" as any]: "#49426E",
  ["--brand-600" as any]: "#5C5490",
  ["--brand-500" as any]: "#EEC293",
  ["--brand-400" as any]: "#F3AB9D",
  ["--brand-300" as any]: "#F7C9B9",
};

// ---------------------------------------------------------------------------
// Windows-style layered folder glyph
// ---------------------------------------------------------------------------
const FolderGlyph: React.FC<{ system?: boolean; size?: number }> = ({
  system,
  size = 40,
}) => {
  const key = system ? "sys" : "std";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`back-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={system ? "#7d76a8" : "#EEC293"} />
          <stop offset="100%" stopColor={system ? "#5c5490" : "#dba063"} />
        </linearGradient>
        <linearGradient id={`front-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={system ? "#b0aad0" : "#f7dcb9"} />
          <stop offset="100%" stopColor={system ? "#8f88ba" : "#f0c286"} />
        </linearGradient>
      </defs>
      <path
        d="M4 12a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z"
        fill={`url(#back-${key})`}
      />
      <path
        d="M2.5 18.5A2.5 2.5 0 0 1 5 16h38a2.5 2.5 0 0 1 2.49 2.76l-1.6 15A2.5 2.5 0 0 1 41.4 36H6.6a2.5 2.5 0 0 1-2.49-2.24l-1.6-15Z"
        fill={`url(#front-${key})`}
      />
      <path
        d="M2.5 18.5A2.5 2.5 0 0 1 5 16h38a2.5 2.5 0 0 1 2.49 2.76"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={0.75}
        fill="none"
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Documents & Status Styles
// ---------------------------------------------------------------------------
interface DmsDocumentItem {
  uuid: string;
  title: string;
  status?: string;
  document_type_id?: number | string | null;
  created_at?: string;
  download_url?: string;
}

const statusStyles: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft:
    "bg-[var(--brand-300)]/30 text-[var(--brand-800)] border-[var(--brand-300)]",
  archived: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const statusStyle = (status?: string) =>
  statusStyles[(status ?? "").toLowerCase()] ??
  "bg-zinc-100 text-zinc-500 border-zinc-200";

const FileGlyph: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div
    className="flex items-center justify-center rounded-lg bg-[var(--brand-300)]/25 text-[var(--brand-700)]"
    style={{ width: size, height: size }}
  >
    <FileText size={size * 0.5} strokeWidth={1.6} />
  </div>
);

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------
interface FolderTreeNode extends Omit<DmsFolder, "children"> {
  id: number;
  children: FolderTreeNode[];
  documents?: DmsDocumentItem[];
}

function buildTree(folders: DmsFolder[] | null | undefined): FolderTreeNode[] {
  const transform = (folder: DmsFolder): FolderTreeNode => ({
    ...folder,
    id: folder.id ?? 0,
    children: (folder.children || []).map(transform),
  });
  return (folders ?? []).map(transform);
}

function findNode(
  nodes: FolderTreeNode[],
  id: number,
): FolderTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function findPath(
  nodes: FolderTreeNode[],
  id: number,
  trail: FolderTreeNode[] = [],
): FolderTreeNode[] | null {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.id === id) return next;
    const found = findPath(n.children, id, next);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tree row (recursive)
// ---------------------------------------------------------------------------
const TreeRow: React.FC<{
  node: FolderTreeNode;
  depth: number;
  currentId: number | null;
  expanded: Set<number>;
  toggleExpand: (id: number) => void;
  onNavigate: (id: number | null) => void;
}> = ({ node, depth, currentId, expanded, toggleExpand, onNavigate }) => {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isActive = node.id === currentId;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-[13px] cursor-pointer whitespace-nowrap transition-colors ${
          isActive
            ? "bg-[var(--brand-300)]/40 text-[var(--brand-800)] font-medium"
            : "text-zinc-600 hover:bg-[var(--brand-300)]/15 hover:text-[var(--brand-800)]"
        }`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => onNavigate(node.id)}
      >
        <span
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-zinc-400"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(node.id);
          }}
        >
          {hasChildren &&
            (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </span>
        <FolderGlyph system={node.is_system} size={17} />
        <span className="overflow-hidden text-ellipsis">{node.name}</span>
      </div>
      {isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.uuid}
            node={child}
            depth={depth + 1}
            currentId={currentId}
            expanded={expanded}
            toggleExpand={toggleExpand}
            onNavigate={onNavigate}
          />
        ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------
export interface FolderExplorerWindowProps {
  folders: DmsFolder[];
  isLoading?: boolean;
  createPending?: boolean;
  onView: (folder: DmsFolder) => void;
  onEdit: (folder: DmsFolder) => void;
  onDelete: (uuid: string) => void;
  onNewFolder: (parent: DmsFolder | null) => void;
  onRefresh?: () => void;
}

const FolderExplorerWindow: React.FC<FolderExplorerWindowProps> = ({
  folders,
  isLoading,
  createPending,
  onView,
  onEdit,
  onDelete,
  onNewFolder,
  onRefresh,
}) => {
  const safeFolders = folders ?? [];
  const tree = useMemo(() => buildTree(safeFolders), [safeFolders]);

  const [currentId, setCurrentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    folder?: FolderTreeNode | null;
    doc?: DmsDocumentItem | null;
  } | null>(null);

  const [docActionMenu, setDocActionMenu] = useState<{
    x: number;
    y: number;
    doc: DmsDocumentItem;
  } | null>(null);

  const [foldersMenuOpen, setFoldersMenuOpen] = useState(false);
  const foldersMenuRef = useRef<HTMLDivElement | null>(null);

  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [actionLoadingUuid, setActionLoadingUuid] = useState<string | null>(
    null,
  );

  const [versionsDropdown, setVersionsDropdown] = useState<{
    x: number;
    y: number;
    doc: DmsDocumentItem;
  } | null>(null);
  const [versionsData, setVersionsData] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(
    null,
  );

  const uploadDocInputRef = useRef<HTMLInputElement>(null);
  const uploadVersionInputRef = useRef<HTMLInputElement>(null);
  const [versionTargetDoc, setVersionTargetDoc] =
    useState<DmsDocumentItem | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      setCtxMenu(null);
      setDocActionMenu(null);
      setVersionsDropdown(null);
      if (
        foldersMenuRef.current &&
        !foldersMenuRef.current.contains(e.target as Node)
      ) {
        setFoldersMenuOpen(false);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const currentChildren: FolderTreeNode[] =
    currentId === null ? tree : findNode(tree, currentId)?.children ?? [];

  const pathNodes: FolderTreeNode[] =
    currentId === null ? [] : findPath(tree, currentId) ?? [];

  const items = useMemo(() => {
    if (!search.trim()) return currentChildren;
    const q = search.toLowerCase();
    return currentChildren.filter((f) => f.name.toLowerCase().includes(q));
  }, [currentChildren, search]);

  const currentFolderObj: FolderTreeNode | null =
    currentId === null ? null : findNode(tree, currentId);

  const currentDocuments: DmsDocumentItem[] =
    currentId === null ? [] : currentFolderObj?.documents ?? [];

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return currentDocuments;
    const q = search.toLowerCase();
    return currentDocuments.filter((d) => d.title.toLowerCase().includes(q));
  }, [currentDocuments, search]);

  const navigate = (id: number | null) => {
    setCurrentId(id);
    setSelectedUuid(null);
    if (id !== null) setExpanded((prev) => new Set(prev).add(id));
    setFoldersMenuOpen(false);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openContextMenu = (
    e: React.MouseEvent,
    folder?: FolderTreeNode | null,
    doc?: DmsDocumentItem | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (folder) setSelectedUuid(folder.uuid);
    if (doc) setSelectedUuid(doc.uuid);
    setCtxMenu({ x: e.clientX, y: e.clientY, folder, doc });
  };

  const openDocActionMenu = (e: React.MouseEvent, doc: DmsDocumentItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDocActionMenu({ x: rect.right, y: rect.bottom, doc });
  };

  // -----------------------------------------------------------------
  // DOCUMENT ACTION HANDLERS
  // -----------------------------------------------------------------
  const handleDownload = async (
    e: React.MouseEvent,
    url: string,
    filename: string,
    uuid: string,
  ) => {
    e.stopPropagation();
    setDownloadingUuid(uuid);
    try {
      const response = await api.get(url);
      const fileUrl = response.data?.data?.url;
      if (!fileUrl) throw new Error("File URL not found in API response.");

      const fileResponse = await api.get(fileUrl, { responseType: "blob" });
      const contentType = String(
        fileResponse.headers["content-type"] || "application/octet-stream",
      );
      const blob = new Blob([fileResponse.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      showApiError(error, { fallbackMessage: "Failed to download the document." });
    } finally {
      setDownloadingUuid(null);
    }
  };

  const handleUploadDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentId) return;

    setActionLoadingUuid("new-doc");
    try {
      const formData = new FormData();
      formData.append("folder_id", String(currentId));
      formData.append("document_type_id", "1");
      formData.append("access_level", "hr_only");
      formData.append("file", file);

      await api.post("/dms/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onRefresh?.();
    } catch (error) {
      console.error("Upload failed:", error);
      showApiError(error, { fallbackMessage: "Failed to upload document." });
    } finally {
      setActionLoadingUuid(null);
      if (uploadDocInputRef.current) uploadDocInputRef.current.value = "";
    }
  };

  const handleUploadVersion = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !versionTargetDoc) return;

    setActionLoadingUuid(versionTargetDoc.uuid);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(
        `/dms/documents/${versionTargetDoc.uuid}/version`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      onRefresh?.();
    } catch (error) {
      console.error("Version upload failed:", error);
      showApiError(error, { fallbackMessage: "Failed to upload new version." });
    } finally {
      setActionLoadingUuid(null);
      setVersionTargetDoc(null);
      if (uploadVersionInputRef.current)
        uploadVersionInputRef.current.value = "";
    }
  };

  const handleVerifyDocument = async (doc: DmsDocumentItem) => {
    setActionLoadingUuid(doc.uuid);
    setDocActionMenu(null);
    try {
      await api.post(`/dms/documents/${doc.uuid}/verify`);
      onRefresh?.();
    } catch (error) {
      console.error("Verify failed:", error);
      showApiError(error, { fallbackMessage: "Failed to verify document." });
    } finally {
      setActionLoadingUuid(null);
    }
  };

  const handleDeleteDocument = async (doc: DmsDocumentItem) => {
    setDocActionMenu(null);
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    setActionLoadingUuid(doc.uuid);
    try {
      await api.delete(`/dms/documents/${doc.uuid}`);
      onRefresh?.();
    } catch (error) {
      console.error("Delete failed:", error);
      showApiError(error, { fallbackMessage: "Failed to delete document." });
    } finally {
      setActionLoadingUuid(null);
    }
  };

  const handleOpenVersions = async (
    x: number,
    y: number,
    doc: DmsDocumentItem,
  ) => {
    setDocActionMenu(null);
    setCtxMenu(null);
    setVersionsDropdown({ x, y, doc });
    setVersionsLoading(true);
    setVersionsData([]);

    try {
      const response = await api.get(`/dms/documents/${doc.uuid}/versions`);
      const vers = response.data?.data?.data || response.data?.data || [];
      setVersionsData(vers);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRollback = async (
    doc: DmsDocumentItem,
    versionId: string | number,
    versionNumber: string | number,
  ) => {
    setRollbackLoadingId(String(versionId));
    try {
      await api.post(`/dms/documents/${doc.uuid}/rollback`, {
        version: versionNumber,
      });
      onRefresh?.();
      setVersionsDropdown(null);
    } catch (error) {
      console.error("Rollback failed:", error);
      showApiError(error, { fallbackMessage: "Failed to rollback document." });
    } finally {
      setRollbackLoadingId(null);
    }
  };

  return (
    <div
      style={brandVars}
      className="relative flex h-[640px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(30,26,58,0.16)]"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <input
        type="file"
        ref={uploadDocInputRef}
        onChange={handleUploadDocument}
        className="hidden"
      />
      <input
        type="file"
        ref={uploadVersionInputRef}
        onChange={handleUploadVersion}
        className="hidden"
      />

      {/* title bar */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-zinc-100 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-800)] text-white">
          <FolderPlus size={14} />
        </div>
        <span className="font-[Outfit] text-[14px] font-semibold tracking-wide text-[var(--brand-900)]">
          File Explorer
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex w-[190px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 transition-all focus-within:w-[230px] focus-within:border-[var(--brand-500)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--brand-300)]/50">
            <Search size={13} className="text-zinc-400" />
            <input
              placeholder="Search this folder"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-[12.5px] text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </div>

          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              className={`flex rounded-md p-1.5 transition-colors ${
                view === "grid"
                  ? "bg-white text-[var(--brand-700)] shadow-sm"
                  : "text-zinc-400 hover:text-[var(--brand-700)]"
              }`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`flex rounded-md p-1.5 transition-colors ${
                view === "list"
                  ? "bg-white text-[var(--brand-700)] shadow-sm"
                  : "text-zinc-400 hover:text-[var(--brand-700)]"
              }`}
              onClick={() => setView("list")}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>

          <button
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            onClick={() => uploadDocInputRef.current?.click()}
            disabled={actionLoadingUuid === "new-doc" || !currentId}
            title={!currentId ? "Select a folder first" : "Upload Document"}
          >
            {actionLoadingUuid === "new-doc" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload
          </button>

          <button
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--brand-900)] shadow-[0_6px_16px_-6px_rgba(238,194,147,0.7)] transition-[filter,transform] hover:brightness-105 active:scale-[0.97] disabled:opacity-60"
            onClick={() =>
              onNewFolder(currentFolderObj as unknown as DmsFolder | null)
            }
            disabled={createPending}
          >
            {createPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FolderPlus size={14} />
            )}
            New folder
          </button>
        </div>
      </div>

      {/* nav row */}
      <div
        className="relative flex shrink-0 items-center gap-2 border-b border-zinc-100 bg-zinc-50/70 px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={foldersMenuRef} className="relative">
          <button
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              foldersMenuOpen
                ? "border-[var(--brand-300)] bg-[var(--brand-300)]/30 text-[var(--brand-800)]"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-[var(--brand-300)]/15 hover:text-[var(--brand-800)]"
            }`}
            onClick={() => setFoldersMenuOpen((o) => !o)}
          >
            <Folders size={14} />
            Folders
            <ChevronDown
              size={12}
              className={`transition-transform ${
                foldersMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {foldersMenuOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-80 w-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_20px_45px_-18px_rgba(30,26,58,0.3)]">
              <div className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-zinc-400">
                Quick access
              </div>
              <div
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] cursor-pointer transition-colors ${
                  currentId === null
                    ? "bg-[var(--brand-300)]/40 text-[var(--brand-800)]"
                    : "text-zinc-600 hover:bg-[var(--brand-300)]/15"
                }`}
                onClick={() => navigate(null)}
              >
                <Home size={15} /> Home
              </div>
              <div className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-300">
                <Clock size={15} /> Recent
              </div>
              <div className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-300">
                <Star size={15} /> Favorites
              </div>

              <div className="mt-2.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-zinc-400">
                All folders
              </div>
              {tree.length === 0 ? (
                <div className="px-2.5 py-1.5 text-[12.5px] text-zinc-400">
                  No folders yet
                </div>
              ) : (
                tree.map((node) => (
                  <TreeRow
                    key={node.uuid}
                    node={node}
                    depth={0}
                    currentId={currentId}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                    onNavigate={navigate}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-zinc-200" />

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-[13px] text-zinc-500">
          <span
            className="shrink-0 cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-[var(--brand-300)]/15 hover:text-[var(--brand-800)]"
            onClick={() => navigate(null)}
          >
            Home
          </span>
          {pathNodes.map((n, i) => (
            <React.Fragment key={n.uuid}>
              <span className="shrink-0 text-zinc-300">
                <ChevronRight size={12} />
              </span>
              <span
                className={`shrink-0 rounded-md px-2 py-1 transition-colors ${
                  i === pathNodes.length - 1
                    ? "cursor-default font-semibold text-[var(--brand-800)]"
                    : "cursor-pointer hover:bg-[var(--brand-300)]/15 hover:text-[var(--brand-800)]"
                }`}
                onClick={() => i < pathNodes.length - 1 && navigate(n.id)}
              >
                {n.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* main pane */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        onContextMenu={(e) => openContextMenu(e, null, null)}
        onClick={() => setSelectedUuid(null)}
      >
        <div
          className="flex-1 overflow-y-auto p-4"
          onContextMenu={(e) => openContextMenu(e, null, null)}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-[var(--brand-600)]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : items.length === 0 && filteredDocuments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-zinc-400">
              <FolderPlus
                size={34}
                strokeWidth={1.3}
                className="text-[var(--brand-400)]"
              />
              <div className="text-[13.5px] font-medium text-zinc-600">
                {search ? "No matches here" : "This folder is empty"}
              </div>
              <div>
                {search
                  ? "Try a different search term."
                  : "Use “New folder” or “Upload” to add files."}
              </div>
            </div>
          ) : view === "grid" ? (
            // ── GRID VIEW ────────────────────────────────────────────────
            <div className="flex flex-col gap-4">
              {items.length > 0 && (
                <div>
                  <div className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-zinc-400">
                    Folders
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5">
                    {items.map((folder) => (
                      <div
                        key={folder.uuid}
                        className={`group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 pb-2.5 pt-3 text-center transition-colors ${
                          selectedUuid === folder.uuid
                            ? "border-[var(--brand-300)] bg-[var(--brand-300)]/25"
                            : "border-transparent hover:bg-zinc-50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUuid(folder.uuid);
                        }}
                        onDoubleClick={() => navigate(folder.id)}
                        onContextMenu={(e) => openContextMenu(e, folder, null)}
                      >
                        <FolderGlyph system={folder.is_system} />
                        <div className="line-clamp-2 break-words text-[12px] leading-tight text-zinc-700">
                          {folder.name}
                        </div>

                        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm hover:bg-[var(--brand-300)]/20 hover:text-[var(--brand-800)]"
                            title="View"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView(folder);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm hover:bg-[var(--brand-300)]/20 hover:text-[var(--brand-800)]"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(folder);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="rounded-md border border-zinc-200 bg-white p-1.5 text-[var(--brand-400)] shadow-sm hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(folder.uuid);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredDocuments.length > 0 && (
                <div>
                  <div className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-zinc-400">
                    Documents
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.uuid}
                        className={`group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 pb-2.5 pt-3 text-center transition-colors ${
                          selectedUuid === doc.uuid
                            ? "border-[var(--brand-300)] bg-[var(--brand-300)]/25"
                            : "border-transparent hover:bg-zinc-50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUuid(doc.uuid);
                        }}
                        onContextMenu={(e) => openContextMenu(e, null, doc)}
                      >
                        <FileGlyph />
                        <div className="line-clamp-2 break-words text-[12px] leading-tight text-zinc-700">
                          {doc.title}
                        </div>
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium capitalize ${statusStyle(
                            doc.status,
                          )}`}
                        >
                          {doc.status ?? "—"}
                        </span>

                        <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm hover:bg-[var(--brand-300)]/20 hover:text-[var(--brand-800)]"
                            title="Actions"
                            onClick={(e) => openDocActionMenu(e, doc)}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ── LIST VIEW ────────────────────────────────────────────────
            <div className="flex flex-col gap-4">
              {items.length > 0 && (
                <div className="flex flex-col">
                  <div className="grid grid-cols-[1fr_110px_90px_100px] gap-2.5 rounded-lg px-2.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-zinc-400">
                    <span>Name</span>
                    <span>Modified</span>
                    <span>Type</span>
                    <span>Items</span>
                  </div>
                  {items.map((folder) => (
                    <div
                      key={folder.uuid}
                      className={`group grid cursor-pointer grid-cols-[1fr_110px_90px_100px] items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors ${
                        selectedUuid === folder.uuid
                          ? "border-[var(--brand-300)] bg-[var(--brand-300)]/25"
                          : "border-transparent hover:bg-zinc-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUuid(folder.uuid);
                      }}
                      onDoubleClick={() => navigate(folder.id)}
                      onContextMenu={(e) => openContextMenu(e, folder, null)}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FolderGlyph system={folder.is_system} size={22} />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-zinc-800">
                          {folder.name}
                        </span>
                        {folder.is_system && (
                          <span className="rounded-full bg-[var(--brand-300)]/30 px-1.5 py-0.5 text-[10px] text-[var(--brand-800)]">
                            System
                          </span>
                        )}
                      </div>
                      <span className="font-[JetBrains_Mono] text-[11.5px] text-zinc-400">
                        {folder.updated_at ?? "—"}
                      </span>
                      <span className="font-[JetBrains_Mono] text-[11.5px] capitalize text-zinc-400">
                        {folder.folder_type}
                      </span>
                      <span className="font-[JetBrains_Mono] text-[11.5px] text-zinc-400">
                        {folder.children_count ?? folder.children.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {filteredDocuments.length > 0 && (
                <div className="flex flex-col">
                  <div className="grid grid-cols-[1fr_110px_90px_100px] gap-2.5 rounded-lg px-2.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-zinc-400">
                    <span>Name</span>
                    <span>Modified</span>
                    <span>Type</span>
                    <span>Action</span>
                  </div>
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.uuid}
                      className={`group grid cursor-pointer grid-cols-[1fr_110px_90px_100px] items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors ${
                        selectedUuid === doc.uuid
                          ? "border-[var(--brand-300)] bg-[var(--brand-300)]/25"
                          : "border-transparent hover:bg-zinc-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUuid(doc.uuid);
                      }}
                      onContextMenu={(e) => openContextMenu(e, null, doc)}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileGlyph size={22} />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-zinc-800">
                          {doc.title}
                        </span>
                      </div>
                      <span className="font-[JetBrains_Mono] text-[11.5px] text-zinc-400">
                        {doc.created_at ?? "—"}
                      </span>
                      <span>
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${statusStyle(
                            doc.status,
                          )}`}
                        >
                          {doc.status ?? "—"}
                        </span>
                      </span>
                      <span className="flex items-center justify-end">
                        <button
                          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 shadow-sm transition-colors hover:bg-[var(--brand-300)]/20 hover:text-[var(--brand-800)]"
                          title="Actions"
                          onClick={(e) => openDocActionMenu(e, doc)}
                        >
                          <MoreVertical size={12} />
                          Actions
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* status bar */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-4 py-1.5 text-[11.5px] text-zinc-400">
          <span>
            {items.length + filteredDocuments.length} item
            {items.length + filteredDocuments.length !== 1 ? "s" : ""}
          </span>
          <span>{selectedUuid ? "1 selected" : "\u00A0"}</span>
        </div>
      </div>

      {/* Document Action Dropdown */}
      {docActionMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-xl border border-zinc-200 bg-white p-1.5 text-zinc-700 shadow-[0_20px_45px_-14px_rgba(30,26,58,0.3)]"
          style={{
            top: docActionMenu.y + 4,
            right: window.innerWidth - docActionMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {docActionMenu.doc.download_url && (
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
              onClick={() => {
                handleDownload(
                  { stopPropagation: () => {} } as any,
                  docActionMenu.doc.download_url!,
                  docActionMenu.doc.title,
                  docActionMenu.doc.uuid,
                );
                setDocActionMenu(null);
              }}
            >
              <Download size={14} /> Download
            </div>
          )}
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
            onClick={() => {
              setVersionTargetDoc(docActionMenu.doc);
              setDocActionMenu(null);
              uploadVersionInputRef.current?.click();
            }}
          >
            <FileUp size={14} /> Upload New Version
          </div>
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
            onClick={() => {
              handleOpenVersions(
                docActionMenu.x,
                docActionMenu.y,
                docActionMenu.doc,
              );
            }}
          >
            <History size={14} /> Version History
          </div>
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
            onClick={() => handleVerifyDocument(docActionMenu.doc)}
          >
            <CheckCircle size={14} /> Verify
          </div>
          <div className="my-1 h-px bg-zinc-100" />
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] text-[var(--brand-400)] hover:bg-red-50 hover:text-red-600"
            onClick={() => handleDeleteDocument(docActionMenu.doc)}
          >
            <Trash2 size={14} /> Delete
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fixed z-50 min-w-[168px] rounded-xl border border-zinc-200 bg-white p-1.5 text-zinc-700 shadow-[0_20px_45px_-14px_rgba(30,26,58,0.3)]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.doc ? (
            <>
              {ctxMenu.doc.download_url && (
                <div
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                  onClick={() => {
                    handleDownload(
                      { stopPropagation: () => {} } as any,
                      ctxMenu.doc!.download_url!,
                      ctxMenu.doc!.title,
                      ctxMenu.doc!.uuid,
                    );
                    setCtxMenu(null);
                  }}
                >
                  <Download size={14} /> Download
                </div>
              )}
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => {
                  setVersionTargetDoc(ctxMenu.doc!);
                  setCtxMenu(null);
                  uploadVersionInputRef.current?.click();
                }}
              >
                <FileUp size={14} /> Upload Version
              </div>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => {
                  handleOpenVersions(ctxMenu.x, ctxMenu.y, ctxMenu.doc!);
                }}
              >
                <History size={14} /> Version History
              </div>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => handleVerifyDocument(ctxMenu.doc!)}
              >
                <CheckCircle size={14} /> Verify
              </div>
              <div className="my-1 h-px bg-zinc-100" />
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] text-[var(--brand-400)] hover:bg-red-50 hover:text-red-600"
                onClick={() => handleDeleteDocument(ctxMenu.doc!)}
              >
                <Trash2 size={14} /> Delete
              </div>
            </>
          ) : ctxMenu.folder ? (
            <>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => {
                  navigate(ctxMenu.folder!.id);
                  setCtxMenu(null);
                }}
              >
                <FolderPlus size={14} /> Open
              </div>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => {
                  onView(ctxMenu.folder!);
                  setCtxMenu(null);
                }}
              >
                <Eye size={14} /> View details
              </div>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                onClick={() => {
                  onEdit(ctxMenu.folder!);
                  setCtxMenu(null);
                }}
              >
                <Pencil size={14} /> Rename
              </div>
              <div className="my-1 h-px bg-zinc-100" />
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] text-[var(--brand-400)] hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  onDelete(ctxMenu.folder!.uuid);
                  setCtxMenu(null);
                }}
              >
                <Trash2 size={14} /> Delete
              </div>
            </>
          ) : (
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
              onClick={() => {
                onNewFolder(
                  currentFolderObj as unknown as DmsFolder | null,
                );
                setCtxMenu(null);
              }}
            >
              <FolderPlus size={14} /> New folder
            </div>
          )}
        </div>
      )}

      {/* Version History Dropdown */}
      {versionsDropdown && (
        <div
          className="fixed z-50 min-w-[220px] rounded-xl border border-zinc-200 bg-white p-1.5 text-zinc-700 shadow-[0_20px_45px_-14px_rgba(30,26,58,0.3)]"
          style={{
            top: versionsDropdown.y + 4,
            right: window.innerWidth - versionsDropdown.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-zinc-400">
            Version History
          </div>
          <div className="max-h-60 overflow-y-auto">
            {versionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : versionsData.length === 0 ? (
              <div className="px-2.5 py-2 text-[12.5px] text-zinc-400">
                No previous versions found
              </div>
            ) : (
              versionsData.map((v) => {
                const vId = v.id || v.uuid;
                const vNum = v.version_number || v.version;
                return (
                  <div
                    key={vId}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-[var(--brand-300)]/20"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Version {vNum}</span>
                      <span className="text-[10.5px] text-zinc-400">
                        {v.created_at
                          ? new Date(v.created_at).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <button
                      className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10.5px] text-zinc-600 hover:bg-[var(--brand-300)]/20 hover:text-[var(--brand-800)] disabled:opacity-50"
                      disabled={rollbackLoadingId === String(vId)}
                      onClick={() =>
                        handleRollback(versionsDropdown.doc, vId, vNum)
                      }
                    >
                      {rollbackLoadingId === String(vId) ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <RotateCcw size={10} />
                      )}
                      Rollback
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderExplorerWindow;