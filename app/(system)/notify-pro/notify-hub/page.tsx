"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Plus,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  MoreHorizontal,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Loader2,
  X,
  Eye,
  RotateCcw,
  Send,
  Filter,
  Search,
  Inbox,
  SlidersHorizontal,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
  Heading2,
  Pilcrow,
  Code2,
  Quote,
  Eraser,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Import types and hooks from separate files
import type { Template, TemplateFormData } from "@/types/templates";
import {
  useTemplates,
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useResetTemplate,
  useTestTemplate,
} from "@/hooks/useTemplates";

// ─── Constants ──────────────────────────────────────────────────────────────

const BRAND = "#1E1B4B";
const BRAND_HOVER = "#2d2a6e";

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email", icon: Mail, className: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "sms", label: "SMS", icon: MessageSquare, className: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "in_app", label: "In-App", icon: Bell, className: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "push", label: "Push", icon: Smartphone, className: "bg-rose-50 text-rose-700 border-rose-200" },
];

const MODULE_OPTIONS = [
  "connect_central",
  "dms",
  "expense_hub",
  "leave_ease",
  "loan_hub",
  "pay_edge",
  "people_hub",
  "system_flex",
  "time_sync",
];

const MODULE_ACRONYMS = new Set(["dms"]);

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const EMPTY_FORM: TemplateFormData = {
  template_key: "",
  module: "",
  channel: "email",
  name: "",
  body_text: "",
  body_html: null,
  subject: null,
  variables: [],
  sample_values: null,
};

function getChannelMeta(channel: string) {
  return CHANNEL_OPTIONS.find((c) => c.value === channel);
}

function moduleLabel(mod: string) {
  return mod
    .split("_")
    .map((w) => (MODULE_ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function NotifyHubTemplatesPage() {
  const router = useRouter();
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canView = permissions.includes("view-notify-hub");
  const canManage = permissions.includes("manage-notify-hub");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [filters, setFilters] = useState<{ module?: string; channel?: string; is_active?: boolean }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editUuid, setEditUuid] = useState<string | null>(null);
  const [viewUuid, setViewUuid] = useState<string | null>(null);
  const [testUuid, setTestUuid] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "reset"; uuid: string; name: string } | null>(null);

  // Permission check
  useEffect(() => {
    if (!canView) {
      toast.error("You don't have permission to view notification templates.");
      router.replace("/flexi-hq");
    }
  }, [canView, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [perPage, filters]);

  const { data, isLoading } = useTemplates(page, debouncedSearch, perPage, filters);
  const templates = data?.data ?? [];
  const meta = data?.meta;

  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteTemplate();
  const { mutate: resetMutate, isPending: isResetting } = useResetTemplate();

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  const openCreate = () => { setEditUuid(null); setModalOpen(true); };
  const openEdit = (uuid: string) => { setEditUuid(uuid); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditUuid(null); };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, uuid, name } = confirmAction;
    setConfirmAction(null);

    if (type === "delete") {
      toast.promise(deleteMutate(uuid), {
        loading: `Deleting "${name}"…`,
        success: "Template deleted.",
        error: "Failed to delete.",
      });
    } else if (type === "reset") {
      toast.promise(resetMutate(uuid), {
        loading: `Resetting "${name}"…`,
        success: "Template reset to default.",
        error: "Failed to reset.",
      });
    }
  };

  if (!canView) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B]">Notification Templates</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage system notification templates by channel and module.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={openCreate}
              className="flex items-center gap-2 self-start bg-[#1E1B4B] text-white shadow-sm hover:bg-[#2d2a6e] sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Template
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-slate-200 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-1.5">
              <SlidersHorizontal className="ml-1 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />

              <Select
                value={filters.module ?? "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, module: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="h-8 w-[150px] border-none bg-transparent text-xs shadow-none focus:ring-0">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {MODULE_OPTIONS.map((mod) => (
                    <SelectItem key={mod} value={mod}>{moduleLabel(mod)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-5 w-px bg-slate-200" />

              <Select
                value={filters.channel ?? "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, channel: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="h-8 w-[130px] border-none bg-transparent text-xs shadow-none focus:ring-0">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {CHANNEL_OPTIONS.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-5 w-px bg-slate-200" />

              <Select
                value={filters.is_active === undefined ? "all" : String(filters.is_active)}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, is_active: v === "all" ? undefined : v === "true" }))
                }
              >
                <SelectTrigger className="h-8 w-[110px] border-none bg-transparent text-xs shadow-none focus:ring-0">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="h-9 gap-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </Button>
            )}

            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-9 w-[112px] rounded-xl border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <LoadingSkeleton />
          ) : templates.length === 0 ? (
            <EmptyState onNew={openCreate} canManage={canManage} hasFilters={activeFilterCount > 0 || !!debouncedSearch} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Template
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Version
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map((template, index) => {
                    const serial = ((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? perPage) + index + 1;
                    return (
                      <TemplateRow
                        key={template.uuid}
                        serial={serial}
                        template={template}
                        onEdit={() => openEdit(template.uuid)}
                        onView={() => setViewUuid(template.uuid)}
                        onTest={() => setTestUuid(template.uuid)}
                        onReset={() =>
                          setConfirmAction({
                            type: "reset",
                            uuid: template.uuid,
                            name: template.name,
                          })
                        }
                        onDelete={() =>
                          setConfirmAction({
                            type: "delete",
                            uuid: template.uuid,
                            name: template.name,
                          })
                        }
                        canManage={canManage}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && templates.length > 0 && meta && (
            <TablePagination
              page={meta.current_page ?? page}
              lastPage={meta.last_page ?? 1}
              total={meta.total ?? templates.length}
              perPage={meta.per_page ?? perPage}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplateModal
        open={modalOpen}
        editUuid={editUuid}
        onClose={closeModal}
        onSaved={() => { console.log("Template saved"); }}
      />

      <TemplateViewModal
        uuid={viewUuid}
        onClose={() => setViewUuid(null)}
      />

      <TemplateTestModal
        uuid={testUuid}
        onClose={() => setTestUuid(null)}
      />

      <ConfirmActionDialog
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        isPending={isDeleting || isResetting}
      />
    </TooltipProvider>
  );
}

// ─── TemplateRow ────────────────────────────────────────────────────────────

interface TemplateRowProps {
  serial: number;
  template: Template;
  onEdit: () => void;
  onView: () => void;
  onTest: () => void;
  onReset: () => void;
  onDelete: () => void;
  canManage: boolean;
}

const TemplateRow: React.FC<TemplateRowProps> = ({
  serial,
  template,
  onEdit,
  onView,
  onTest,
  onReset,
  onDelete,
  canManage,
}) => {
  const channelMeta = getChannelMeta(template.channel);
  const ChannelIcon = channelMeta?.icon ?? Mail;
  const isSystemDefault = template.company_id === null;

  return (
    <tr className="group transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-3.5 text-xs">{serial}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", channelMeta?.className ?? "bg-slate-50 text-slate-500 border-slate-200")}>
            <ChannelIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{template.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                {template.template_key}
              </code>
              <span className="text-slate-300">·</span>
              <span>#{serial}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <Badge className={cn("border text-xs font-medium", channelMeta?.className)}>
          {channelMeta?.label ?? template.channel}
        </Badge>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          {moduleLabel(template.module)}
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          template.is_active ? "text-emerald-700" : "text-slate-400"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", template.is_active ? "bg-emerald-500" : "bg-slate-300")} />
          {template.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-slate-500">
        v{template.version}
      </td>
      <td className="px-4 py-3.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 opacity-0 transition-opacity hover:text-slate-700 group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for "${template.name}"`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTest} className="gap-2">
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Send test
                </DropdownMenuItem>
                {!isSystemDefault && (
                  <DropdownMenuItem onClick={onReset} className="gap-2">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Reset to default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 text-rose-600 focus:text-rose-700"
                  disabled={isSystemDefault}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

// ─── TablePagination ────────────────────────────────────────────────────────

interface TablePaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

function getPageWindow(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

const TablePagination: React.FC<TablePaginationProps> = ({ page, lastPage, total, perPage, onPageChange }) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pageWindow = useMemo(() => getPageWindow(page, lastPage), [page, lastPage]);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> templates
      </p>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <PageIconButton onClick={() => onPageChange(1)} disabled={page <= 1} label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>

          <div className="mx-1 flex items-center gap-1">
            {pageWindow.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "h-8 min-w-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    p === page
                      ? "bg-[#1E1B4B] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <PageIconButton onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} label="Next page">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(lastPage)} disabled={page >= lastPage} label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
        </div>
      )}
    </div>
  );
};

const PageIconButton: React.FC<{ onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }> = ({
  onClick,
  disabled,
  label,
  children,
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
);

// ─── RichTextEditor (TipTap) ────────────────────────────────────────────────
// Used for the Body HTML field. Outputs sanitized-by-tiptap HTML via onChange.
// Requires: npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-underline
//           @tiptap/extension-link @tiptap/extension-placeholder

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", class: "text-[#3730a3] underline underline-offset-2" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write the HTML email body…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[180px] px-3.5 py-3 text-sm text-slate-700 focus:outline-none prose-headings:text-slate-800 prose-p:my-2 prose-a:text-[#3730a3]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when switching templates (e.g. edit -> different row)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && !(next === "" && current === "<p></p>")) {
     editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-[#1E1B4B]/20">
      <EditorToolbar editor={editor} onSetLink={setLink} />
      <div className="max-h-[320px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const EditorToolbar: React.FC<{ editor: Editor; onSetLink: () => void }> = ({ editor, onSetLink }) => {
  const buttons: Array<
    | { type: "action"; icon: React.ElementType; label: string; onClick: () => void; isActive?: boolean; disabled?: boolean }
    | { type: "divider" }
  > = [
    { type: "action", icon: Heading2, label: "Heading", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
    { type: "action", icon: Pilcrow, label: "Paragraph", onClick: () => editor.chain().focus().setParagraph().run(), isActive: editor.isActive("paragraph") },
    { type: "divider" },
    { type: "action", icon: BoldIcon, label: "Bold", onClick: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold") },
    { type: "action", icon: ItalicIcon, label: "Italic", onClick: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic") },
    { type: "action", icon: UnderlineIcon, label: "Underline", onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline") },
    { type: "action", icon: Strikethrough, label: "Strikethrough", onClick: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike") },
    { type: "divider" },
    { type: "action", icon: List, label: "Bullet list", onClick: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList") },
    { type: "action", icon: ListOrdered, label: "Numbered list", onClick: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList") },
    { type: "action", icon: Quote, label: "Quote", onClick: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote") },
    { type: "action", icon: Code2, label: "Code block", onClick: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive("codeBlock") },
    { type: "divider" },
    { type: "action", icon: Link2, label: "Add link", onClick: onSetLink, isActive: editor.isActive("link") },
    { type: "action", icon: Link2Off, label: "Remove link", onClick: () => editor.chain().focus().unsetLink().run(), disabled: !editor.isActive("link") },
    { type: "divider" },
    { type: "action", icon: Eraser, label: "Clear formatting", onClick: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
    { type: "divider" },
    { type: "action", icon: Undo2, label: "Undo", onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
    { type: "action", icon: Redo2, label: "Redo", onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/60 px-2 py-1.5">
      {buttons.map((btn, i) =>
        btn.type === "divider" ? (
          <div key={`d-${i}`} className="mx-1 h-5 w-px bg-slate-200" />
        ) : (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={btn.onClick}
                disabled={btn.disabled}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30",
                  btn.isActive && "bg-[#1E1B4B] text-white hover:bg-[#1E1B4B] hover:text-white"
                )}
              >
                <btn.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{btn.label}</TooltipContent>
          </Tooltip>
        )
      )}
    </div>
  );
};

// ─── TemplateModal (Create/Edit) ──────────────────────────────────────────

interface TemplateModalProps {
  open: boolean;
  editUuid: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ open, editUuid, onClose, onSaved }) => {
  const isEdit = editUuid !== null;
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: templateDetail, isLoading: isDetailLoading } = useTemplate(editUuid ?? "");
  const { mutate: createMutate, isPending: isCreating } = useCreateTemplate();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateTemplate();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (isEdit && templateDetail) {
      setForm({
        template_key: templateDetail.template_key,
        module: templateDetail.module,
        channel: templateDetail.channel,
        name: templateDetail.name,
        body_text: templateDetail.body_text,
        body_html: templateDetail.body_html,
        subject: templateDetail.subject,
        variables: templateDetail.variables ?? [],
        sample_values: templateDetail.sample_values ?? null,
      });
    } else if (!isEdit) {
      setForm(EMPTY_FORM);
    }
    setValidationError(null);
  }, [open, isEdit, templateDetail]);

  const set = <K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string | null => {
    if (!form.template_key) return "Template key is required.";
    if (!form.module) return "Module is required.";
    if (!form.channel) return "Channel is required.";
    if (!form.name) return "Name is required.";
    if (!form.body_text) return "Body text is required.";
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const payload = { ...form };

    if (isEdit) {
      toast.promise(updateMutate(editUuid!, payload), {
        loading: "Updating template…",
        success: "Template updated.",
        error: "Failed to update.",
      });
    } else {
      toast.promise(createMutate(payload), {
        loading: "Creating template…",
        success: "Template created.",
        error: "Failed to create.",
      });
    }
    onSaved();
  };

  const showLoading = isEdit && isDetailLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto rounded-3xl border-none p-0 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#3730a3] text-white shadow-sm">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {isEdit ? "Edit Template" : "New Template"}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isEdit ? "Update template details" : "Create a new notification template"}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {showLoading ? (
            <DetailLoading />
          ) : (
            <div className="space-y-5">
              {validationError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="template-key">Template Key</Label>
                  <Input
                    id="template-key"
                    value={form.template_key}
                    onChange={(e) => set("template_key", e.target.value)}
                    placeholder="e.g. auth.welcome"
                    className="rounded-xl border-slate-200"
                    disabled={isEdit}
                  />
                  <p className="text-xs text-slate-400">Unique identifier (e.g. module.event_name)</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="module">Module</Label>
                  <Select value={form.module} onValueChange={(v) => set("module", v)}>
                    <SelectTrigger id="module" className="h-10 w-full rounded-xl border-slate-200">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULE_OPTIONS.map((mod) => (
                        <SelectItem key={mod} value={mod}>{moduleLabel(mod)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Human-readable name"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="channel">Channel</Label>
                  <Select value={form.channel} onValueChange={(v) => set("channel", v as any)}>
                    <SelectTrigger id="channel" className="h-10 w-full rounded-xl border-slate-200">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((ch) => (
                        <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject (for email)</Label>
                  <Input
                    id="subject"
                    value={form.subject ?? ""}
                    onChange={(e) => set("subject", e.target.value || null)}
                    placeholder="Optional subject line"
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body-text">Body Text</Label>
                <Textarea
                  id="body-text"
                  value={form.body_text}
                  onChange={(e) => set("body_text", e.target.value)}
                  placeholder="Template body with {{variables}}"
                  rows={5}
                  className="rounded-xl border-slate-200"
                />
                <p className="text-xs text-slate-400">
                  Use <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{"{{variable}}"}</code> placeholders.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body-html">Body HTML (optional)</Label>
                <RichTextEditor
                  value={form.body_html ?? ""}
                  onChange={(html) => set("body_html", html || null)}
                  placeholder="HTML version (for email)"
                />
                <p className="text-xs text-slate-400">
                  Rich formatting for the email version. Use <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{"{{variable}}"}</code> placeholders here too.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="variables">Variables (comma-separated)</Label>
                <Input
                  id="variables"
                  value={form.variables.join(", ")}
                  onChange={(e) => set("variables", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="e.g. user_name, reset_url"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sample-values">Sample Values (JSON)</Label>
                <Textarea
                  id="sample-values"
                  value={form.sample_values ? JSON.stringify(form.sample_values, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                      set("sample_values", parsed);
                    } catch {
                      // ignore invalid JSON
                    }
                  }}
                  placeholder='{"user_name": "John", "reset_url": "https://..."}'
                  rows={3}
                  className="rounded-xl border-slate-200 font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl border-slate-200">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || showLoading}
            className="rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#2d2a6e] text-white shadow-md transition-shadow hover:shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : isEdit ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── TemplateViewModal ──────────────────────────────────────────────────────

interface TemplateViewModalProps {
  uuid: string | null;
  onClose: () => void;
}

const TemplateViewModal: React.FC<TemplateViewModalProps> = ({ uuid, onClose }) => {
  const { data: template, isLoading } = useTemplate(uuid ?? "");

  if (!uuid) return null;

  return (
    <Dialog open={!!uuid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto rounded-3xl border-none p-0 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-[#1E1B4B]">Template Details</DialogTitle>
        </DialogHeader>

        {isLoading || !template ? (
          <DetailLoading />
        ) : (
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("border text-xs font-medium", getChannelMeta(template.channel)?.className)}>
                {getChannelMeta(template.channel)?.label ?? template.channel}
              </Badge>
              <Badge
                className={cn(
                  "border text-xs font-medium",
                  template.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                )}
              >
                {template.is_active ? "Active" : "Inactive"}
              </Badge>
              {template.company_id === null && (
                <Badge variant="outline" className="text-xs">System Default</Badge>
              )}
              <Badge variant="outline" className="text-xs">v{template.version}</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#1E1B4B]">{template.name}</h3>
              <p className="text-sm text-slate-500">Key: {template.template_key}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-slate-500">Module</h4>
                <p className="text-sm text-slate-700">{moduleLabel(template.module)}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-500">Channel</h4>
                <p className="text-sm text-slate-700">{template.channel}</p>
              </div>
              {template.subject && (
                <div className="col-span-2">
                  <h4 className="text-xs font-medium text-slate-500">Subject</h4>
                  <p className="text-sm text-slate-700">{template.subject}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-500">Body Text</h4>
              <div className="mt-1 rounded-lg bg-slate-50 p-3 font-mono text-sm whitespace-pre-wrap">
                {template.body_text}
              </div>
            </div>

            {template.body_html && (
              <div>
                <h4 className="text-xs font-medium text-slate-500">Body HTML</h4>
                <div
                  className="prose prose-sm mt-1 max-w-none rounded-lg border border-slate-100 bg-white p-3"
                  dangerouslySetInnerHTML={{ __html: template.body_html }}
                />
              </div>
            )}

            {template.variables.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500">Variables</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.variables.map((v) => (
                    <Badge key={v} variant="outline" className="text-xs bg-indigo-50">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {template.sample_values && (
              <div>
                <h4 className="text-xs font-medium text-slate-500">Sample Values</h4>
                <pre className="mt-1 rounded-lg bg-slate-50 p-3 font-mono text-sm">
                  {JSON.stringify(template.sample_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>Created: {format(new Date(template.created_at), "PPpp")}</div>
              <div>Updated: {format(new Date(template.updated_at), "PPpp")}</div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── TemplateTestModal ──────────────────────────────────────────────────────

interface TemplateTestModalProps {
  uuid: string | null;
  onClose: () => void;
}

const TemplateTestModal: React.FC<TemplateTestModalProps> = ({ uuid, onClose }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: testMutate, isPending } = useTestTemplate();

  if (!uuid) return null;

  const handleSend = () => {
    if (!email) {
      setError("Recipient email is required.");
      return;
    }
    setError(null);
    toast.promise(testMutate(uuid, email), {
      loading: "Sending test notification…",
      success: "Test notification queued.",
      error: "Failed to send test.",
    });
    onClose();
  };

  return (
    <Dialog open={!!uuid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Enter an email address to receive a test notification using this template.
          </p>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(error && "border-red-500")}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending} className="bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── ConfirmActionDialog ────────────────────────────────────────────────────

interface ConfirmActionDialogProps {
  action: { type: "delete" | "reset"; uuid: string; name: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  action,
  onClose,
  onConfirm,
  isPending,
}) => {
  if (!action) return null;

  const { type, name } = action;
  const descriptions = {
    delete: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    reset: `Resetting "${name}" will remove your customisations and restore the system default template.`,
  };

  return (
    <AlertDialog open={!!action} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {type === "delete" ? "Delete template?" : "Reset to default?"}
          </AlertDialogTitle>
          <AlertDialogDescription>{descriptions[type]}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={type === "delete" ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]"}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {type === "delete" ? "Deleting…" : "Resetting…"}
              </>
            ) : type === "delete" ? (
              "Delete"
            ) : (
              "Reset"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ─── Loading / Empty States ─────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => (
  <div aria-label="Loading templates" className="divide-y divide-slate-50">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-8 w-8 rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
);

const EmptyState: React.FC<{ onNew: () => void; canManage: boolean; hasFilters: boolean }> = ({ onNew, canManage, hasFilters }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
      {hasFilters ? (
        <Filter className="h-8 w-8 text-slate-400" aria-hidden="true" />
      ) : (
        <Inbox className="h-8 w-8 text-slate-400" aria-hidden="true" />
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-700">
        {hasFilters ? "No templates match your filters" : "No templates found"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {hasFilters
          ? "Try adjusting your search or filters."
          : canManage
          ? "Create your first notification template."
          : "You don't have permission to create templates."}
      </p>
    </div>
    {canManage && !hasFilters && (
      <Button onClick={onNew} className="mt-2 gap-2 bg-[#1E1B4B] text-white hover:bg-[#2d2a6e]">
        <Plus className="h-4 w-4" aria-hidden="true" />
        New Template
      </Button>
    )}
  </div>
);

const DetailLoading: React.FC = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
    <Loader2 className="h-6 w-6 animate-spin text-[#1E1B4B]" aria-hidden="true" />
    <p className="text-sm text-slate-500">Loading template…</p>
  </div>
);