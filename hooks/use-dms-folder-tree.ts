"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DmsFolderNode {
  id: number;
  uuid: string;
  name: string;
  slug?: string;
  parent_id: number | null;
  folder_type?: string;
  is_system: boolean;
  employee_id?: number | null;
  children_count?: number;
  documents_count?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  children: DmsFolderNode[];
}

export interface DmsFolderOption {
  id: number;
  uuid: string;
  name: string;
  parent_id: number | null;
  is_system: boolean;
  label: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Fetch — flattens the whole response into a single array ───────────────────

function flattenRaw(raw: unknown): DmsFolderNode[] {
  // unwrap envelope
  let list: unknown = raw;
  if (list && typeof list === "object" && "data" in (list as object)) {
    list = (list as { data: unknown }).data;
  }
  if (!Array.isArray(list)) return [];

  const out: DmsFolderNode[] = [];

  const walk = (nodes: Record<string, unknown>[], parentId: number | null) => {
    for (const n of nodes) {
      if (!n || typeof n !== "object") continue;
      const id = Number(n.id);
      if (!Number.isFinite(id)) continue;

      out.push({
        id,
        uuid: String(n.uuid ?? ""),
        name: String(n.name ?? "Untitled"),
        slug: n.slug as string | undefined,
        // trust API's parent_id; fall back to caller-provided parentId
        parent_id:
          n.parent_id != null ? Number(n.parent_id) : parentId,
        folder_type: n.folder_type as string | undefined,
        is_system: Boolean(n.is_system),
        employee_id: n.employee_id != null ? Number(n.employee_id) : null,
        children_count:
          n.children_count != null ? Number(n.children_count) : undefined,
        documents_count:
          n.documents_count != null ? Number(n.documents_count) : undefined,
        sort_order: n.sort_order != null ? Number(n.sort_order) : undefined,
        created_at: n.created_at as string | undefined,
        updated_at: n.updated_at as string | undefined,
        children: [], // intentionally empty — we don't need the tree
      });

      // recurse so nested folders still appear if the caller wants them
      if (Array.isArray(n.children) && n.children.length > 0) {
        walk(n.children as Record<string, unknown>[], id);
      }
    }
  };

  walk(list as Record<string, unknown>[], null);
  return out;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const dmsFolderTreeKeys = {
  all: ["dms", "folder-tree"] as const,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseDmsFolderTreeOptions {
  /** Only include folders where is_system === true. */
  systemOnly?: boolean;
  /** Only include top-level folders (parent_id === null). */
  rootOnly?: boolean;
}

export interface UseDmsFolderTreeResult {
  /** Flat array of every folder returned by the API. */
  flat: DmsFolderNode[];
  /** Filtered array — apply options. This is what dropdowns should use. */
  options: DmsFolderOption[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

export function useDmsFolderTree(
  opts: UseDmsFolderTreeOptions = {},
): UseDmsFolderTreeResult {
  const systemOnly = Boolean(opts.systemOnly);
  const rootOnly = Boolean(opts.rootOnly);

  const query = useQuery({
    queryKey: dmsFolderTreeKeys.all,
    queryFn: async (): Promise<DmsFolderNode[]> => {
      const { data } = await api.get("/dms/folders");
      return flattenRaw(data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const flat = query.data ?? [];

  const options = useMemo<DmsFolderOption[]>(() => {
    let filtered = flat;

    // ← THE ACTUAL FIX: filter the flat list, no tree traversal
    if (rootOnly) {
      filtered = filtered.filter((f) => f.parent_id === null);
    }
    if (systemOnly) {
      filtered = filtered.filter((f) => f.is_system === true);
    }

    // preserve API order if sort_order is present
    filtered = [...filtered].sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });

    return filtered.map((f) => ({
      id: f.id,
      uuid: f.uuid,
      name: f.name,
      parent_id: f.parent_id,
      is_system: f.is_system,
      label: f.name, // no indentation needed — we're only showing roots
    }));
  }, [flat, rootOnly, systemOnly]);

  return {
    flat,
    options,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}