"use client";
import { showApiError } from "@/lib/error-toast";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GenerateLetterModal } from "../components/generate-letter-modal";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, FileText, Loader2, MoreVertical,
  Pencil, Plus, RefreshCw, Search, Power, Trash2, Upload, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SearchableSelect from "@/components/ui/searchable-select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLetterAccess, useLetterTemplates } from "@/hooks/use-letter-forge";
import { LETTER_CATEGORY_OPTIONS } from "@/types/letter-forge";
import type {
  LetterCategory, LetterLanguage, LetterTemplate,
  LetterTemplateFilters, TemplateEngine,
} from "@/types/letter-forge";
import {
  TemplateFormModal, TemplateActionModal, type TemplateAction, LANGUAGES,
} from "../components/template-modals";

export default function LetterTemplatesPage() {
  const access = useLetterAccess();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filters, setFilters] = useState<LetterTemplateFilters>({
    sort: "updated_at", sort_dir: "desc", per_page: 10, page: 1,
  });
  const [generateTemplate, setGenerateTemplate] = useState<LetterTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUuid, setEditUuid] = useState<string | null>(null);
  const [templateAction, setTemplateAction] = useState<{ template: LetterTemplate; action: TemplateAction } | null>(null);

  // debounce text filters
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim() || undefined;
      const nextCategory = (category.trim() || undefined) as LetterCategory | "" | undefined;
      setFilters((prev) =>
        prev.search === nextSearch && prev.category === nextCategory
          ? prev
          : { ...prev, search: nextSearch, category: nextCategory, page: 1 },
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [search, category]);

  const { data, isPending, isFetching, isError, error, refetch } = useLetterTemplates(filters);
  useEffect(() => {
    if (error) showApiError(error, { id: "letter-template-list-error" });
  }, [error]);
  const templates = data?.data ?? [];
  const meta = data?.meta;
  const currentPage = meta?.current_page ?? filters.page ?? 1;
  const totalPages = Math.max(1, meta?.last_page ?? 1);
  const totalEntries = meta?.total ?? 0;
  const firstPageNumber = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => firstPageNumber + i);
  const paginationBusy = !meta || isFetching;
  const textFiltersPending =
    (search.trim() || undefined) !== filters.search ||
    (category.trim() || undefined) !== filters.category;
  const hasFilters = Boolean(search || category || filters.language || filters.engine);

  if (meta && meta.current_page > Math.max(1, meta.last_page) && filters.page !== Math.max(1, meta.last_page)) {
    setFilters({ ...filters, page: Math.max(1, meta.last_page) });
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setFilters((prev) => ({
      ...prev,
      search: undefined, category: undefined, language: undefined, engine: undefined, page: 1,
    }));
  }

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">Letter Templates Directory</CardTitle>
              <p className="mt-1 text-sm text-gray-500">{totalEntries.toLocaleString()} templates • Real-time data</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh
              </Button>
              <Button
                size="sm"
                className="bg-[#1E1B4B] hover:bg-[#2A2675]"
                disabled={!access.canManageTemplates}
                onClick={() => { setCreateOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />Create template
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search templates"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <SearchableSelect aria-label="Templates per page" allowAll={false} widthClass="w-28" value={String(filters.per_page ?? 10)} options={[10, 25, 50, 100].map((value) => ({ value: String(value), label: String(value) }))} onChange={(value) => setFilters((previous) => ({ ...previous, per_page: Number(value), page: 1 }))} />
              <span>entries</span>
            </div>
            <div className="basis-full" />
            <SearchableSelect aria-label="Filter by category" allLabel="All categories" searchPlaceholder="Search categories…" value={category} onChange={setCategory} options={LETTER_CATEGORY_OPTIONS} widthClass="w-full sm:w-56" />
            <SearchableSelect aria-label="Filter by language" allLabel="All languages" value={filters.language ?? ""} onChange={(value) => setFilters((previous) => ({ ...previous, language: (value || undefined) as LetterLanguage | undefined, page: 1 }))} options={Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))} widthClass="w-44" />
            <SearchableSelect aria-label="Filter by engine" allLabel="All engines" value={filters.engine ?? ""} onChange={(value) => setFilters((previous) => ({ ...previous, engine: (value || undefined) as TemplateEngine | undefined, page: 1 }))} options={[{ value: "legacy", label: "Legacy" }, { value: "mustache", label: "Mustache" }]} widthClass="w-44" />
            <SearchableSelect aria-label="Sort by updated date" allowAll={false} value={filters.sort_dir ?? "desc"} onChange={(value) => setFilters((previous) => ({ ...previous, sort_dir: value as "asc" | "desc", page: 1 }))} options={[{ value: "desc", label: "Recently updated" }, { value: "asc", label: "Oldest updated" }]} widthClass="w-56" />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
            )}
          </div>

          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">
            <span>Showing <strong className="text-gray-900">{meta?.from ?? 0}</strong> to <strong className="text-gray-900">{meta?.to ?? 0}</strong> of <strong className="text-gray-900">{totalEntries.toLocaleString()}</strong> entries</span>
            {isFetching && <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50"><Loader2 className="h-3 w-3 animate-spin" />Loading…</Badge>}
          </div>

          {/* table */}
          <div className="overflow-hidden rounded-lg border border-gray-200" aria-busy={isFetching}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <caption className="sr-only">Letter templates</caption>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {["SR. NO.", "Template", "Category", "Language", "Engine", "Paper", "Status",  "Actions"].map((label) => (
                      <th key={label} scope="col" className={cn("px-6 py-3", label === "Actions" && "text-right")}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isPending ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p role="status" className="mt-2 text-sm text-muted-foreground">Loading templates…</p>
                      </td>
                    </tr>
                  ) : isError && !data ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Unable to load templates. <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>Retry</Button></td></tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-medium">No templates found</p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters ? "Try another search or clear your filters." : "Create your first company letter template to get started."}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3"
                          disabled={!hasFilters && !access.can("manage-letter-templates")}
                          onClick={hasFilters ? clearFilters : () => setCreateOpen(true)}
                        >
                          {hasFilters ? "Clear filters" : "Create template"}
                        </Button>
                      </td>
                    </tr>
                  ) : templates.map((template, index) => (
                    <tr key={template.uuid} className="group text-sm transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-muted-foreground">
                        {(meta?.from ?? ((filters.page ?? 1) - 1) * (filters.per_page ?? 10) + 1) + index}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setTemplateAction({ template, action: "preview" })}
                              disabled={!access.canManageTemplates}
                              className="block max-w-[260px] truncate rounded text-left font-semibold text-gray-900 hover:underline"
                              title={template.name}
                            >
                              {template.name}
                            </button>
                            <p className="mt-0.5 text-xs text-muted-foreground">{template.template_key}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-muted-foreground">
                        {(template.category ?? "—").replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {LANGUAGES[template.language] ?? template.language}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {template.engine === "mustache" ? "Mustache" : "Legacy"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {template.paper_size ?? "A4"}
                        <span className="mt-0.5 block text-xs capitalize">{template.orientation ?? "portrait"}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                          template.is_active
                            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                            : "border-red-200 bg-red-100 text-red-800",
                        )}>
                          {template.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${template.name}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {access.canGenerateLetters && template.is_active && template.publish_status === "published" && <DropdownMenuItem onSelect={() => setGenerateTemplate(template)}><Sparkles className="mr-2 h-4 w-4" />Generate letter</DropdownMenuItem>}
                            {!template.is_system_default && access.canManageTemplates && template.publish_status !== "published" && <DropdownMenuItem onSelect={() => setTemplateAction({ template, action: "publish" })}><Upload className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>}
                            {!template.is_system_default && access.can("manage-letter-templates") && (
                              <DropdownMenuItem onSelect={() => setEditUuid(template.uuid)}>
                                <Pencil className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                            )}
                            {access.canManageTemplates && (
                              <DropdownMenuItem onSelect={() => setTemplateAction({ template, action: "preview" })}>
                                <Eye className="mr-2 h-4 w-4" />Preview
                              </DropdownMenuItem>
                            )}
                            {!template.is_system_default && access.canManageTemplates && (
                              <>
                                <DropdownMenuItem onSelect={() => { setTemplateAction({ template, action: template.is_active ? "deactivate" : "activate" }); }}>
                                  <Power className="mr-2 h-4 w-4" />{template.is_active ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={() => { setTemplateAction({ template, action: "delete" }); }}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4 md:flex-row">
            <p className="text-sm text-gray-600">Page <strong className="text-gray-900">{currentPage}</strong> of <strong className="text-gray-900">{totalPages}</strong></p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" aria-label="First page" disabled={paginationBusy || textFiltersPending || currentPage <= 1} onClick={() => setFilters((p) => ({ ...p, page: 1 }))}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Previous page" disabled={paginationBusy || textFiltersPending || currentPage <= 1} onClick={() => setFilters((p) => ({ ...p, page: currentPage - 1 }))}><ChevronLeft className="h-4 w-4" /></Button>
              {pageNumbers.map((page) => (
                <Button key={page} size="sm" variant={page === currentPage ? "default" : "outline"} aria-label={`Page ${page}`} aria-current={page === currentPage ? "page" : undefined} disabled={paginationBusy || textFiltersPending} className={page === currentPage ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : "border-gray-300 hover:bg-gray-100"} onClick={() => setFilters((p) => ({ ...p, page }))}>{page}</Button>
              ))}
              <Button variant="outline" size="sm" aria-label="Next page" disabled={paginationBusy || textFiltersPending || currentPage >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: currentPage + 1 }))}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Last page" disabled={paginationBusy || textFiltersPending || currentPage >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: totalPages }))}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-gray-600">{meta?.from ?? 0} – {meta?.to ?? 0} of {totalEntries.toLocaleString()} entries</p>
          </div>
        </CardContent>
      </Card>

      {/* modals */}
      {generateTemplate && <GenerateLetterModal key={generateTemplate.uuid} template={generateTemplate} onClose={() => setGenerateTemplate(null)} />}
      {templateAction && (
        <TemplateActionModal
          key={`${templateAction.template.uuid}-${templateAction.action}`}
          {...templateAction}
          onClose={() => setTemplateAction(null)}
          onSaved={(message) => { setTemplateAction(null); toast.success(message); }}
        />
      )}
      {createOpen && (
        <TemplateFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={(msg) => {
            setCreateOpen(false);
            toast.success(msg);
            setFilters((p) => ({ ...p, page: 1 }));
          }}
        />
      )}

      {editUuid && (
        <TemplateFormModal
          mode="edit"
          uuid={editUuid}
          onClose={() => setEditUuid(null)}
          onSaved={(msg) => {
            setEditUuid(null);
            toast.success(msg);
          }}
        />
      )}

    </div>
  );
}
