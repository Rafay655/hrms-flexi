"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Info,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import WorkflowCreateModals from "./WorkflowCreateModals";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  useCompanyHierarchy,
  useSaveCompanyHierarchy,
  useUnassignedHierarchy,
} from "@/hooks/useCompanyHierarchy";

import { useDivisions } from "@/hooks/useDivisions";
import { useDepartments } from "@/hooks/useDepartments";
import { useDesignations } from "@/hooks/useDesignations";

import type {
  Department,
  Designation,
  Division,
  HierarchyDivision,
  PickerOption,
} from "@/types/hierarchy";

/* ───────────────────────────── Helpers ───────────────────────────── */

type WorkflowModalType = "division" | "department" | "designation";

const WORKFLOW_COMPANY_ID = "6eca7723-dee6-411b-918a-830915d8605a";

const LEVEL_CONFIG: Record<Designation["level"], string> = {
  "C-Suite": "border-brand-800 bg-brand-900 text-white",
  Senior: "border-brand-300 bg-brand-100 text-brand-800",
  Mid: "border-blue-200 bg-blue-50 text-blue-700",
  Junior: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Intern: "border-amber-200 bg-amber-50 text-amber-700",
};

const mapGradeLevel = (
  gradeBand?: {
    name?: string;
    level?: string;
  } | null
): Designation["level"] => {
  const text = `${gradeBand?.name ?? ""} ${gradeBand?.level ?? ""}`.toLowerCase();

  if (text.includes("intern")) return "Intern";
  if (text.includes("junior") || text.includes("grade 1")) return "Junior";
  if (text.includes("senior")) return "Senior";
  if (text.includes("c-suite") || text.includes("chief")) return "C-Suite";

  return "Mid";
};

function extractList<T>(response: unknown): T[] {
  const data = response as {
    data?: T[] | { data?: T[] };
    items?: T[];
  };

  if (Array.isArray(data?.data)) return data.data;
  if (data?.data && !Array.isArray(data.data) && Array.isArray(data.data.data)) {
    return data.data.data;
  }
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function isRealNumericId(id: string) {
  return Number.isFinite(Number(id));
}

/* ───────────────────────────── Reusable Components ───────────────────────────── */

function AddEntityDropdown({
  label,
  icon,
  options,
  onSelect,
  onAddNew,
  emptyText,
  placeholder,
}: {
  label: string;
  icon: ReactNode;
  options: PickerOption[];
  onSelect: (id: string) => void;
  onAddNew: () => void;
  emptyText: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-7 rounded-sm border-gray-200 bg-white text-xs text-brand-800 hover:bg-brand-50"
        >
          {icon}
          {label}
          <ChevronDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 border border-gray-200 bg-white p-0 shadow-none"
      >
        <Command>
          <CommandInput
            placeholder={placeholder ?? "Search..."}
            className="h-9 text-sm"
          />

          <CommandList>
            <CommandGroup>
              <CommandItem
                value="__add_new__"
                onSelect={() => {
                  setOpen(false);
                  onAddNew();
                }}
                className="cursor-pointer gap-2 border-b border-gray-100"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-md text-white">
                  <Plus className="h-2 w-2" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-brand-900">
                    Add New
                  </p>
                </div>
              </CommandItem>
            </CommandGroup>

            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </CommandEmpty>

            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.name}-${opt.code ?? ""}`}
                  onSelect={() => {
                    onSelect(opt.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-900">
                      {opt.name}
                    </p>

                    {opt.warn ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {opt.warn}
                      </p>
                    ) : null}

                    {opt.meta && !opt.warn ? (
                      <p className="text-[10px] text-muted-foreground">
                        {opt.meta}
                      </p>
                    ) : null}
                  </div>

                  {opt.code ? (
                    <span className="rounded-md border border-gray-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                      {opt.code}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DesignationPill({
  designation,
  onRemove,
}: {
  designation: Designation;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
        LEVEL_CONFIG[designation.level]
      )}
    >
      <Briefcase className="h-3.5 w-3.5 shrink-0 opacity-70" />

      <span className="min-w-0 flex-1 truncate">{designation.name}</span>

      <span className="rounded border border-current/20 px-1.5 py-0 text-[9px]">
        {designation.gradeBand?.name ?? designation.level}
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="opacity-60 transition hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ───────────────────────────── Department Card ───────────────────────────── */

function DepartmentCard({
  deptEntry,
  allDepts,
  allDesignations,
  masterDesignations,
  onRemoveDept,
  onLinkDesignation,
  onRemoveDesignation,
  onOpenCreateModal,
}: {
  deptEntry: HierarchyDivision["departments"][number];
  allDepts: Department[];
  allDesignations: Designation[];
  masterDesignations: Designation[];
  onRemoveDept: () => void;
  onLinkDesignation: (desId: string) => void;
  onRemoveDesignation: (desId: string) => void;
  onOpenCreateModal: () => void;
}) {
  const dept = allDepts.find((d) => d.id === deptEntry.deptId);
  const [expanded, setExpanded] = useState(true);

  if (!dept) return null;

  const usedDesigIds = new Set(
    deptEntry.designations.map((item) => item.designationId)
  );

  const availableDesigs: PickerOption[] = masterDesignations
    .filter((designation) => !usedDesigIds.has(designation.id))
    .map((designation) => ({
      id: designation.id,
      name: designation.name,
      code: designation.gradeBand?.name ?? designation.level,
    }));

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors duration-200">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-brand-700 transition hover:text-brand-900"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <FolderOpen className="h-4 w-4 shrink-0 text-brand-700" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {dept.name}
          </p>
          <p className="text-[11px] text-brand-700">
            {deptEntry.designations.length} designation
            {deptEntry.designations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <span className="rounded-md border border-gray-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
          {dept.code}
        </span>

        <button
          type="button"
          onClick={onRemoveDept}
          className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-gray-200 px-3 pb-3 pt-3">
          <div className="space-y-1.5">
            {deptEntry.designations.map(({ designationId }) => {
              const designation = allDesignations.find(
                (item) => item.id === designationId
              );

              if (!designation) return null;

              return (
                <DesignationPill
                  key={designationId}
                  designation={designation}
                  onRemove={() => onRemoveDesignation(designationId)}
                />
              );
            })}
          </div>

          <div className="mt-3">
            <AddEntityDropdown
              label="Add Designation"
              icon={<Briefcase className="mr-2 h-4 w-4" />}
              options={availableDesigs}
              onSelect={onLinkDesignation}
              onAddNew={onOpenCreateModal}
              emptyText="No designations available"
              placeholder="Search designation..."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Division Block ───────────────────────────── */

function DivisionBlock({
  divEntry,
  allDivisions,
  allDepts,
  allDesignations,
  masterDepartments,
  masterDesignations,
  hierarchy,
  onRemoveDivision,
  onLinkDept,
  onRemoveDept,
  onLinkDesignation,
  onRemoveDesignation,
  onOpenCreateModal,
}: {
  divEntry: HierarchyDivision;
  allDivisions: Division[];
  allDepts: Department[];
  allDesignations: Designation[];
  masterDepartments: Department[];
  masterDesignations: Designation[];
  hierarchy: HierarchyDivision[];
  onRemoveDivision: () => void;
  onLinkDept: (deptId: string) => void;
  onRemoveDept: (deptId: string) => void;
  onLinkDesignation: (deptId: string, desId: string) => void;
  onRemoveDesignation: (deptId: string, desId: string) => void;
  onOpenCreateModal: (
    type: WorkflowModalType,
    options?: {
      divisionId?: string;
      departmentId?: string;
    }
  ) => void;
}) {
  const division = allDivisions.find((item) => item.id === divEntry.divisionId);
  const [collapsed, setCollapsed] = useState(false);

  if (!division) return null;

  const currentDeptIds = new Set(
    divEntry.departments.map((dept) => dept.deptId)
  );

  const allUsedDeptIds = new Set(
    hierarchy.flatMap((item) =>
      item.divisionId !== divEntry.divisionId
        ? item.departments.map((dept) => dept.deptId)
        : []
    )
  );

  const availableDepts: PickerOption[] = masterDepartments
    .filter((dept) => !currentDeptIds.has(dept.id))
    .map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      warn: allUsedDeptIds.has(dept.id)
        ? "Already in another division"
        : undefined,
    }));

  const totalDesigs = divEntry.departments.reduce(
    (sum, dept) => sum + dept.designations.length,
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-brand-50 px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-brand-700 transition hover:text-brand-900"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
          <Building2 className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-brand-900">
            {division.name}
          </p>

          <p className="text-[11px] text-brand-700">
            {divEntry.departments.length} departments · {totalDesigs}{" "}
            designations
          </p>
        </div>

        <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-700">
          {division.code}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveDivision}
          className="h-8 rounded-lg border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          Remove
        </Button>
      </div>

      {!collapsed ? (
        <div className="space-y-3 p-3">
          {divEntry.departments.map((deptEntry) => (
            <DepartmentCard
              key={deptEntry.deptId}
              deptEntry={deptEntry}
              allDepts={allDepts}
              allDesignations={allDesignations}
              masterDesignations={masterDesignations}
              onRemoveDept={() => onRemoveDept(deptEntry.deptId)}
              onLinkDesignation={(desId) =>
                onLinkDesignation(deptEntry.deptId, desId)
              }
              onRemoveDesignation={(desId) =>
                onRemoveDesignation(deptEntry.deptId, desId)
              }
              onOpenCreateModal={() =>
                onOpenCreateModal("designation", {
                  departmentId: deptEntry.deptId,
                })
              }
            />
          ))}

          <AddEntityDropdown
            label="Add Department"
            icon={<FolderOpen className="mr-2 h-4 w-4" />}
            options={availableDepts}
            onSelect={onLinkDept}
            onAddNew={() =>
              onOpenCreateModal("department", {
                divisionId: divEntry.divisionId,
              })
            }
            emptyText="No departments available"
            placeholder="Search department..."
          />
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Unassigned Panel ───────────────────────────── */

function UnassignedPanel({
  unassignedDepts,
  unassignedDesigs,
  allDivisions,
  allDepts,
  hierarchy,
  onAssignDeptToDiv,
  onAssignDesigToDept,
}: {
  unassignedDepts: Department[];
  unassignedDesigs: Designation[];
  allDivisions: Division[];
  allDepts: Department[];
  hierarchy: HierarchyDivision[];
  onAssignDeptToDiv: (divId: string, deptId: string) => void;
  onAssignDesigToDept: (divId: string, deptId: string, desId: string) => void;
}) {
  const hierarchyDepts = hierarchy.flatMap((item) =>
    item.departments.map((dept) => ({
      ...dept,
      divisionId: item.divisionId,
    }))
  );

  const deptOptions: PickerOption[] = hierarchyDepts.map((item) => {
    const dept = allDepts.find((deptItem) => deptItem.id === item.deptId);
    const division = allDivisions.find(
      (divisionItem) => divisionItem.id === item.divisionId
    );

    return {
      id: item.deptId + "|" + item.divisionId,
      name: dept?.name ?? item.deptId,
      code: dept?.code,
      meta: division ? `Under ${division.name}` : undefined,
    };
  });

  const divOptions: PickerOption[] = allDivisions
    .filter((division) =>
      hierarchy.some((item) => item.divisionId === division.id)
    )
    .map((division) => ({
      id: division.id,
      name: division.name,
      code: division.code,
    }));

  const total = unassignedDepts.length + unassignedDesigs.length;

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-slate-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <div>
          <h3 className="text-sm font-bold text-brand-900">Unassigned</h3>
          <p className="text-xs text-brand-700">{total} items pending</p>
        </div>

        {total > 0 ? (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            {total}
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {total === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
            <p className="text-sm font-semibold text-brand-900">
              All items assigned
            </p>
            <p className="text-xs text-brand-700">Nothing pending here.</p>
          </div>
        ) : null}

        {unassignedDepts.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-700">
              Departments
            </p>

            <div className="space-y-2">
              {unassignedDepts.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5 text-brand-700" />
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-900">
                      {dept.name}
                    </p>
                    <span className="rounded border border-gray-200 bg-slate-50 px-1.5 py-0.5 text-[9px] text-brand-700">
                      {dept.code}
                    </span>
                  </div>

                  <AddEntityDropdown
                    label="Assign to Division"
                    icon={<Building2 className="mr-2 h-3.5 w-3.5" />}
                    options={divOptions}
                    onSelect={(divId) => onAssignDeptToDiv(divId, dept.id)}
                    onAddNew={() => {}}
                    emptyText="No divisions available"
                    placeholder="Choose division..."
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {unassignedDesigs.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-700">
              Designations
            </p>

            <div className="space-y-2">
              {unassignedDesigs.map((designation) => (
                <div
                  key={designation.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-brand-700" />
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-900">
                      {designation.name}
                    </p>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[9px]",
                        LEVEL_CONFIG[designation.level]
                      )}
                    >
                      {designation.gradeBand?.name ?? designation.level}
                    </span>
                  </div>

                  <AddEntityDropdown
                    label="Assign to Department"
                    icon={<FolderOpen className="mr-2 h-3.5 w-3.5" />}
                    options={deptOptions}
                    onSelect={(combined) => {
                      const [deptId, divId] = combined.split("|");
                      onAssignDesigToDept(divId, deptId, designation.id);
                    }}
                    onAddNew={() => {}}
                    emptyText="No departments available"
                    placeholder="Choose department..."
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

/* ───────────────────────────── Main Page ───────────────────────────── */

export default function CompanyHierarchyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const companyIdFromUrl = searchParams.get("company_id");

  const [selectedCompany] = useState(companyIdFromUrl ?? "1");
  const [searchQuery, setSearchQuery] = useState("");

  const companyId = companyIdFromUrl ?? selectedCompany;

  const {
    data: hierarchyData,
    isLoading: isHierarchyLoading,
    isError: isHierarchyError,
    error: hierarchyError,
  } = useCompanyHierarchy(WORKFLOW_COMPANY_ID);

  const {
    data: unassignedData,
    isLoading: isUnassignedLoading,
    isError: isUnassignedError,
    error: unassignedError,
  } = useUnassignedHierarchy(WORKFLOW_COMPANY_ID);

  const saveHierarchyMutation = useSaveCompanyHierarchy(WORKFLOW_COMPANY_ID);

  const divisionsQuery = useDivisions({
    page: 1,
    per_page: 1000,
  });

  const departmentsQuery = useDepartments({
    page: 1,
    per_page: 1000,
  });

  const designationsQuery = useDesignations({
    page: 1,
    per_page: 1000,
  });

  const isLoading = isHierarchyLoading || isUnassignedLoading;
  const isError = isHierarchyError || isUnassignedError;
  const error = hierarchyError ?? unassignedError;

  const [hierarchy, setHierarchy] = useState<HierarchyDivision[]>([]);
  const [allDivisions, setAllDivisions] = useState<Division[]>([]);
  const [allDepts, setAllDepts] = useState<Department[]>([]);
  const [allDesignations, setAllDesignations] = useState<Designation[]>([]);

  const [unassignedDivisions, setUnassignedDivisions] = useState<Division[]>(
    []
  );
  const [unassignedDepts, setUnassignedDepts] = useState<Department[]>([]);
  const [unassignedDesigs, setUnassignedDesigs] = useState<Designation[]>([]);

  const [saved, setSaved] = useState(false);

  const [createModal, setCreateModal] = useState<{
    open: boolean;
    type: WorkflowModalType | null;
    divisionId?: string;
    departmentId?: string;
  }>({
    open: false,
    type: null,
  });

  const masterDivisions = useMemo<Division[]>(() => {
    const rows = extractList<{
      id: number | string;
      name: string;
      code: string;
    }>(divisionsQuery.data);

    return rows.map((item) => ({
      id: String(item.id),
      name: item.name,
      code: item.code,
    }));
  }, [divisionsQuery.data]);

  const masterDepartments = useMemo<Department[]>(() => {
    const rows = extractList<{
      id: number | string;
      name: string;
      code: string;
    }>(departmentsQuery.data);

    return rows.map((item) => ({
      id: String(item.id),
      name: item.name,
      code: item.code,
      systemDivisionId: null,
    }));
  }, [departmentsQuery.data]);

  const masterDesignations = useMemo<Designation[]>(() => {
    const rows = extractList<{
      id: number | string;
      title?: string;
      name?: string;
      code: string;
      grade_band?: {
        id: number | string;
        name: string;
        level: string;
        code?: string | null;
      } | null;
    }>(designationsQuery.data);

    return rows.map((item) => ({
      id: String(item.id),
      name: item.title ?? item.name ?? "",
      code: item.code,
      level: mapGradeLevel(item.grade_band),
      systemDeptId: null,
      gradeBand: item.grade_band
        ? {
            id: String(item.grade_band.id),
            name: item.grade_band.name,
            level: item.grade_band.level,
            code: item.grade_band.code ?? null,
          }
        : null,
    }));
  }, [designationsQuery.data]);

  useEffect(() => {
    if (!hierarchyData) return;

    setHierarchy(hierarchyData.hierarchy);

    setAllDivisions((prev) => {
      const map = new Map<string, Division>();

      [...hierarchyData.divisions, ...prev].forEach((division) => {
        map.set(division.id, division);
      });

      return Array.from(map.values());
    });

    setAllDepts((prev) => {
      const map = new Map<string, Department>();

      [...hierarchyData.departments, ...prev].forEach((department) => {
        map.set(department.id, department);
      });

      return Array.from(map.values());
    });

    setAllDesignations((prev) => {
      const map = new Map<string, Designation>();

      [...hierarchyData.designations, ...prev].forEach((designation) => {
        map.set(designation.id, designation);
      });

      return Array.from(map.values());
    });
  }, [hierarchyData]);

  useEffect(() => {
    if (!unassignedData) return;

    setUnassignedDivisions(unassignedData.divisions);
    setUnassignedDepts(unassignedData.departments);
    setUnassignedDesigs(unassignedData.designations);

    setAllDivisions((prev) => {
      const map = new Map<string, Division>();

      [...prev, ...unassignedData.divisions].forEach((division) => {
        map.set(division.id, division);
      });

      return Array.from(map.values());
    });

    setAllDepts((prev) => {
      const map = new Map<string, Department>();

      [...prev, ...unassignedData.departments].forEach((department) => {
        map.set(department.id, department);
      });

      return Array.from(map.values());
    });

    setAllDesignations((prev) => {
      const map = new Map<string, Designation>();

      [...prev, ...unassignedData.designations].forEach((designation) => {
        map.set(designation.id, designation);
      });

      return Array.from(map.values());
    });
  }, [unassignedData]);

  useEffect(() => {
    if (!masterDivisions.length) return;

    setAllDivisions((prev) => {
      const map = new Map<string, Division>();

      [...prev, ...masterDivisions].forEach((item) => {
        map.set(item.id, item);
      });

      return Array.from(map.values());
    });
  }, [masterDivisions]);

  useEffect(() => {
    if (!masterDepartments.length) return;

    setAllDepts((prev) => {
      const map = new Map<string, Department>();

      [...prev, ...masterDepartments].forEach((item) => {
        map.set(item.id, item);
      });

      return Array.from(map.values());
    });
  }, [masterDepartments]);

  useEffect(() => {
    if (!masterDesignations.length) return;

    setAllDesignations((prev) => {
      const map = new Map<string, Designation>();

      [...prev, ...masterDesignations].forEach((item) => {
        map.set(item.id, item);
      });

      return Array.from(map.values());
    });
  }, [masterDesignations]);

  const usedDivIds = new Set(hierarchy.map((item) => item.divisionId));

  const availableDivisions: PickerOption[] = masterDivisions
    .filter((division) => !usedDivIds.has(division.id))
    .map((division) => ({
      id: division.id,
      name: division.name,
      code: division.code,
    }));

  const totalDepartments = hierarchy.reduce(
    (sum, item) => sum + item.departments.length,
    0
  );

  const totalDesignations = hierarchy.reduce(
    (sum, item) =>
      sum +
      item.departments.reduce(
        (innerSum, dept) => innerSum + dept.designations.length,
        0
      ),
    0
  );

  const filteredHierarchy = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return hierarchy;

    return hierarchy.filter((item) => {
      const division = allDivisions.find(
        (divisionItem) => divisionItem.id === item.divisionId
      );

      const departmentNames = item.departments
        .map((deptEntry) => {
          const dept = allDepts.find(
            (deptItem) => deptItem.id === deptEntry.deptId
          );

          const designationNames = deptEntry.designations
            .map((designationEntry) => {
              const designation = allDesignations.find(
                (desItem) => desItem.id === designationEntry.designationId
              );

              return `${designation?.name ?? ""} ${
                designation?.gradeBand?.name ?? ""
              } ${designation?.gradeBand?.level ?? ""}`;
            })
            .join(" ");

          return `${dept?.name ?? ""} ${designationNames}`;
        })
        .join(" ");

      return `${division?.name ?? ""} ${departmentNames}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [searchQuery, hierarchy, allDivisions, allDepts, allDesignations]);

  const openCreateModal = (
    type: WorkflowModalType,
    options?: {
      divisionId?: string;
      departmentId?: string;
    }
  ) => {
    setCreateModal({
      open: true,
      type,
      divisionId: options?.divisionId,
      departmentId: options?.departmentId,
    });
  };

  const closeCreateModal = () => {
    setCreateModal({
      open: false,
      type: null,
    });
  };

  const linkDivision = (divId: string) => {
    setHierarchy((prev) => [...prev, { divisionId: divId, departments: [] }]);

    setUnassignedDivisions((prev) =>
      prev.filter((division) => division.id !== divId)
    );
  };

  const removeDivision = (divId: string) => {
    setHierarchy((prev) => prev.filter((item) => item.divisionId !== divId));

    const removedDivision = allDivisions.find(
      (division) => division.id === divId
    );

    if (removedDivision) {
      setUnassignedDivisions((prev) => {
        if (prev.some((division) => division.id === removedDivision.id)) {
          return prev;
        }

        return [...prev, removedDivision];
      });
    }
  };

  const linkDept = (divId: string, deptId: string) => {
    setHierarchy((prev) =>
      prev.map((item) =>
        item.divisionId === divId
          ? {
              ...item,
              departments: [
                ...item.departments,
                { deptId, designations: [] },
              ],
            }
          : item
      )
    );

    setUnassignedDepts((prev) => prev.filter((dept) => dept.id !== deptId));
  };

  const removeDept = (divId: string, deptId: string) => {
    setHierarchy((prev) =>
      prev.map((item) =>
        item.divisionId === divId
          ? {
              ...item,
              departments: item.departments.filter(
                (dept) => dept.deptId !== deptId
              ),
            }
          : item
      )
    );

    const removedDept = allDepts.find((dept) => dept.id === deptId);

    if (removedDept) {
      setUnassignedDepts((prev) => {
        if (prev.some((dept) => dept.id === removedDept.id)) return prev;
        return [...prev, removedDept];
      });
    }
  };

  const linkDesignation = (divId: string, deptId: string, desId: string) => {
    setHierarchy((prev) =>
      prev.map((item) =>
        item.divisionId === divId
          ? {
              ...item,
              departments: item.departments.map((dept) =>
                dept.deptId === deptId
                  ? {
                      ...dept,
                      designations: [
                        ...dept.designations,
                        { designationId: desId },
                      ],
                    }
                  : dept
              ),
            }
          : item
      )
    );

    setUnassignedDesigs((prev) =>
      prev.filter((designation) => designation.id !== desId)
    );
  };

  const removeDesignation = (divId: string, deptId: string, desId: string) => {
    setHierarchy((prev) =>
      prev.map((item) =>
        item.divisionId === divId
          ? {
              ...item,
              departments: item.departments.map((dept) =>
                dept.deptId === deptId
                  ? {
                      ...dept,
                      designations: dept.designations.filter(
                        (designation) => designation.designationId !== desId
                      ),
                    }
                  : dept
              ),
            }
          : item
      )
    );

    const removedDesignation = allDesignations.find(
      (designation) => designation.id === desId
    );

    if (removedDesignation) {
      setUnassignedDesigs((prev) => {
        if (
          prev.some((designation) => designation.id === removedDesignation.id)
        ) {
          return prev;
        }

        return [...prev, removedDesignation];
      });
    }
  };

  const assignDeptToDiv = (divId: string, deptId: string) => {
    linkDept(divId, deptId);
  };

  const assignDesigToDept = (divId: string, deptId: string, desId: string) => {
    linkDesignation(divId, deptId, desId);
  };

  const handleSave = () => {
    const companyUuid = hierarchyData?.company?.uuid ?? String(companyId);

    const payload = {
      company_id: companyUuid,
      divisions: hierarchy
        .map((division) => ({
          id: Number(division.divisionId),
          departments: division.departments
            .map((department) => ({
              id: Number(department.deptId),
              designations: department.designations
                .map((designation) => Number(designation.designationId))
                .filter((id) => Number.isFinite(id)),
            }))
            .filter((department) => Number.isFinite(department.id)),
        }))
        .filter(
          (division) =>
            Number.isFinite(division.id) && isRealNumericId(String(division.id))
        ),
    };

    saveHierarchyMutation.mutate(payload, {
      onSuccess: () => {
        setSaved(true);

        setTimeout(() => {
          setSaved(false);
        }, 2500);
      },
    });
  };

  return (
    <div className="flex h-[85vh] max-h-[85vh] min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-white">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-brand-900">
                Organisation Workflow Setup
              </h1>
              <p className="text-xs text-brand-700">
                Configure company divisions, departments and designations.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveHierarchyMutation.isPending}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-semibold text-white transition-colors",
              saved
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-brand-800 hover:bg-brand-900"
            )}
          >
            {saved ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveHierarchyMutation.isPending
                  ? "Saving..."
                  : "Save Workflow"}
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Company
              </span>

              <div className="flex h-9 w-56 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900">
                <span className="truncate">
                  {hierarchyData?.company?.name ?? `Company #${selectedCompany}`}
                </span>
              </div>

              <div className="hidden h-4 w-px bg-gray-300 sm:block" />

              <div className="flex flex-wrap items-center gap-2 text-xs text-brand-700">
                <span>
                  <strong className="text-brand-900">{hierarchy.length}</strong>{" "}
                  Divisions
                </span>
                <span>·</span>
                <span>
                  <strong className="text-brand-900">{totalDepartments}</strong>{" "}
                  Departments
                </span>
                <span>·</span>
                <span>
                  <strong className="text-brand-900">{totalDesignations}</strong>{" "}
                  Designations
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search divisions, departments, designations..."
              className="h-full min-h-11 rounded-lg border-gray-200 bg-white pl-9 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" />

          <p className="flex-1 text-xs leading-5 text-brand-700">
            Use Add buttons to select existing master data. The first option
            opens the create form.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/flexi-meta")}
            className="h-8 shrink-0 rounded-lg border-brand-300 bg-white text-xs text-brand-800 hover:bg-brand-100"
          >
            Flexi Meta
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-center">
            <p className="text-sm font-semibold text-brand-900">
              Loading hierarchy...
            </p>
            <p className="mt-1 text-xs text-brand-700">
              Fetching divisions, departments and designations.
            </p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-red-700">
              Failed to load hierarchy
            </p>
            <p className="mt-1 text-xs text-red-600">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="flex min-h-0 flex-col border-r border-gray-200 bg-slate-50">
            <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
              <AddEntityDropdown
                label="Add Division"
                icon={<Building2 className="mr-1 h-2 w-2" />}
                options={availableDivisions}
                onSelect={linkDivision}
                onAddNew={() => openCreateModal("division")}
                emptyText="No divisions available"
                placeholder="Search division..."
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {filteredHierarchy.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-brand-300" />
                  <p className="text-sm font-semibold text-brand-900">
                    No structure found
                  </p>
                  <p className="text-xs text-brand-700">
                    Try another search or add a division.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHierarchy.map((divEntry) => (
                    <DivisionBlock
                      key={divEntry.divisionId}
                      divEntry={divEntry}
                      allDivisions={allDivisions}
                      allDepts={allDepts}
                      allDesignations={allDesignations}
                      masterDepartments={masterDepartments}
                      masterDesignations={masterDesignations}
                      hierarchy={hierarchy}
                      onRemoveDivision={() =>
                        removeDivision(divEntry.divisionId)
                      }
                      onLinkDept={(deptId) =>
                        linkDept(divEntry.divisionId, deptId)
                      }
                      onRemoveDept={(deptId) =>
                        removeDept(divEntry.divisionId, deptId)
                      }
                      onLinkDesignation={(deptId, desId) =>
                        linkDesignation(divEntry.divisionId, deptId, desId)
                      }
                      onRemoveDesignation={(deptId, desId) =>
                        removeDesignation(divEntry.divisionId, deptId, desId)
                      }
                      onOpenCreateModal={openCreateModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          <div className="min-h-0 bg-white p-4">
            <UnassignedPanel
              unassignedDepts={unassignedDepts}
              unassignedDesigs={unassignedDesigs}
              allDivisions={allDivisions}
              allDepts={allDepts}
              hierarchy={hierarchy}
              onAssignDeptToDiv={assignDeptToDiv}
              onAssignDesigToDept={assignDesigToDept}
            />
          </div>
        </div>
      )}

      <WorkflowCreateModals
        open={createModal.open}
        type={createModal.type}
        defaultDivisionId={createModal.divisionId}
        defaultDepartmentId={createModal.departmentId}
        onClose={closeCreateModal}
        onCreated={(type) => {
          if (type === "division") {
            divisionsQuery.refetch();
          }

          if (type === "department") {
            departmentsQuery.refetch();
          }

          if (type === "designation") {
            designationsQuery.refetch();
          }

          closeCreateModal();
        }}
      />
    </div>
  );
}