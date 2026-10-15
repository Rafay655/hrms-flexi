"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";

import { useDivisions, useCreateDivision } from "@/hooks/useDivisions";
import { useDepartments, useCreateDepartment } from "@/hooks/useDepartments";
import { useDesignations, useCreateDesignation } from "@/hooks/useDesignations";
import { useGradeBands } from "@/hooks/useGradeBands";

import type { DivisionFormData } from "@/types/division";
import type { DepartmentFormData } from "@/types/department";
import type { DesignationFormData } from "@/types/designation";

export type WorkflowCreateType = "division" | "department" | "designation";

interface WorkflowCreateModalsProps {
  open: boolean;
  type: WorkflowCreateType | null;
  onClose: () => void;
  defaultDivisionId?: string | number;
  defaultDepartmentId?: string | number;
  onCreated?: (type: WorkflowCreateType) => void;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

const toNumberOrEmpty = (value?: string | number | null): number | "" => {
  if (value === undefined || value === null || value === "") return "";

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : "";
};

/* ───────────────────────────── Main Wrapper ───────────────────────────── */

export default function WorkflowCreateModals({
  open,
  type,
  onClose,
  defaultDivisionId,
  defaultDepartmentId,
  onCreated,
}: WorkflowCreateModalsProps) {
  return (
    <>
      <WorkflowDivisionCreateModal
        open={open && type === "division"}
        onClose={onClose}
        onCreated={() => onCreated?.("division")}
      />

      <WorkflowDepartmentCreateModal
        open={open && type === "department"}
        onClose={onClose}
        defaultDivisionId={defaultDivisionId}
        onCreated={() => onCreated?.("department")}
      />

      <WorkflowDesignationCreateModal
        open={open && type === "designation"}
        onClose={onClose}
        defaultDepartmentId={defaultDepartmentId}
        onCreated={() => onCreated?.("designation")}
      />
    </>
  );
}

/* ───────────────────────────── Division Create Modal ───────────────────────────── */

function WorkflowDivisionCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const createMutation = useCreateDivision();

  const [formData, setFormData] = useState<DivisionFormData>({
    code: "",
    name: "",
    head_employee_id: "",
    effective_from: "",
    effective_to: null,
    status: "active",
  });

  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      head_employee_id: "",
      effective_from: "",
      effective_to: null,
      status: "active",
    });
    setFormError("");
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

    setFormError("");

    if (!trimmedCode) {
      setFormError("Code is required.");
      return;
    }

    if (trimmedCode.length > 20) {
      setFormError("Code cannot exceed 20 characters.");
      return;
    }

    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }

    if (trimmedName.length > 150) {
      setFormError("Name cannot exceed 150 characters.");
      return;
    }

    if (!formData.effective_from) {
      setFormError("Effective from date is required.");
      return;
    }

    const payload: DivisionFormData = {
      ...formData,
      code: trimmedCode,
      name: trimmedName,
      head_employee_id: "",
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onCreated?.();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeModal()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Division</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new division.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </div>
          ) : null}

          {/* Code */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_division_code"
              className="text-right font-medium"
            >
              Code *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_division_code"
                value={formData.code}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: event.target.value,
                  }))
                }
                maxLength={20}
                className="pr-14"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.code.length}/20
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_division_name"
              className="text-right font-medium"
            >
              Name *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_division_name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                maxLength={150}
                className="pr-16"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.name.length}/150
              </span>
            </div>
          </div>

          {/* Head */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Head</label>

            <div className="col-span-3">
              <Input
                value="Not assigned"
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          {/* Effective From */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_division_effective_from"
              className="text-right font-medium"
            >
              Effective From *
            </label>

            <Input
              id="workflow_division_effective_from"
              type="date"
              value={formData.effective_from}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  effective_from: event.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>

          {/* Effective To */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_division_effective_to"
              className="text-right font-medium"
            >
              Effective To
            </label>

            <Input
              id="workflow_division_effective_to"
              type="date"
              value={formData.effective_to ?? ""}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  effective_to: event.target.value || null,
                }))
              }
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-[#1E1B4B] hover:bg-[#2A2675]"
          >
            {createMutation.isPending ? "Saving..." : "Create Division"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────────── Department Create Modal ───────────────────────────── */

function WorkflowDepartmentCreateModal({
  open,
  onClose,
  defaultDivisionId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultDivisionId?: string | number;
  onCreated?: () => void;
}) {
  const createMutation = useCreateDepartment();

  const { data: divisionsData, isLoading: isLoadingDivisions } = useDivisions({
    per_page: 1000,
  });

  const divisions = divisionsData?.data ?? [];

  const divisionOptions: Option[] = useMemo(
    () =>
      divisions.map((division) => ({
        value: String(division.id),
        label: `${division.name} (${division.code})`,
      })),
    [divisions]
  );

  const [formData, setFormData] = useState<DepartmentFormData>({
    code: "",
    name: "",
    division_id: toNumberOrEmpty(defaultDivisionId),
    head_employee_id: "",
    status: "active",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;

    setFormData((prev) => ({
      ...prev,
      division_id: toNumberOrEmpty(defaultDivisionId) || prev.division_id || "",
    }));
  }, [open, defaultDivisionId]);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      division_id: toNumberOrEmpty(defaultDivisionId),
      head_employee_id: "",
      status: "active",
    });
    setFormError("");
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

    setFormError("");

    if (!trimmedCode) {
      setFormError("Code is required.");
      return;
    }

    if (trimmedCode.length > 20) {
      setFormError("Code cannot exceed 20 characters.");
      return;
    }

    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }

    if (trimmedName.length > 150) {
      setFormError("Name cannot exceed 150 characters.");
      return;
    }

    if (!formData.division_id) {
      setFormError("Division is required.");
      return;
    }

    const payload: DepartmentFormData = {
      code: trimmedCode,
      name: trimmedName,
      division_id: Number(formData.division_id),
      head_employee_id: "",
      status: formData.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onCreated?.();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeModal()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new department.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </div>
          ) : null}

          {/* Code */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_department_code"
              className="text-right font-medium"
            >
              Code *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_department_code"
                value={formData.code}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: event.target.value,
                  }))
                }
                maxLength={20}
                className="pr-14"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.code.length}/20
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_department_name"
              className="text-right font-medium"
            >
              Name *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_department_name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                maxLength={150}
                className="pr-16"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.name.length}/150
              </span>
            </div>
          </div>

          {/* Division */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Division *</label>

            <div className="col-span-3">
              <SearchableSelect
                options={divisionOptions}
                value={formData.division_id ? String(formData.division_id) : ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    division_id: value === "" ? "" : Number(value),
                  }))
                }
                placeholder="Select division..."
                searchPlaceholder="Search divisions..."
                emptyText="No divisions found."
                groupLabel="Divisions"
                allowAll={false}
                widthClass="w-full"
                disabled={false}
                isLoading={isLoadingDivisions}
                multiple={false}
              />
            </div>
          </div>

          {/* Head */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Head</label>

            <div className="col-span-3">
              <Input
                value="Not assigned"
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-[#1E1B4B] hover:bg-[#2A2675]"
          >
            {createMutation.isPending ? "Saving..." : "Create Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────────── Designation Create Modal ───────────────────────────── */

function WorkflowDesignationCreateModal({
  open,
  onClose,
  defaultDepartmentId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultDepartmentId?: string | number;
  onCreated?: () => void;
}) {
  const createMutation = useCreateDesignation();

  const { data: departmentsData, isLoading: isLoadingDepartments } =
    useDepartments({
      per_page: 1000,
    });

  const departments = departmentsData?.data ?? [];

  const departmentOptions: Option[] = useMemo(
    () =>
      departments.map((department) => ({
        value: String(department.id),
        label: `${department.name} (${department.code})`,
      })),
    [departments]
  );

  const { data: gradeBandsData, isLoading: isLoadingGradeBands } =
    useGradeBands({
      per_page: 1000,
    });

  const gradeBands = gradeBandsData?.data ?? [];

  const gradeBandOptions: Option[] = useMemo(
    () =>
      gradeBands.map((gradeBand) => ({
        value: String(gradeBand.id),
        label: `${gradeBand.name} (${gradeBand.code}) - Level: ${
          gradeBand.level ?? "N/A"
        }`,
      })),
    [gradeBands]
  );

  const [formData, setFormData] = useState<DesignationFormData>({
    title: "",
    code: "",
    department_id: toNumberOrEmpty(defaultDepartmentId),
    reports_to_id: "",
    grade_band_id: "",
    status: "active",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;

    setFormData((prev) => ({
      ...prev,
      department_id:
        toNumberOrEmpty(defaultDepartmentId) || prev.department_id || "",
    }));
  }, [open, defaultDepartmentId]);

  const resetForm = () => {
    setFormData({
      title: "",
      code: "",
      department_id: toNumberOrEmpty(defaultDepartmentId),
      reports_to_id: "",
      grade_band_id: "",
      status: "active",
    });
    setFormError("");
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const trimmedTitle = formData.title.trim();
    const trimmedCode = formData.code.trim();

    setFormError("");

    if (!trimmedTitle) {
      setFormError("Title is required.");
      return;
    }

    if (trimmedTitle.length > 150) {
      setFormError("Title cannot exceed 150 characters.");
      return;
    }

    if (!trimmedCode) {
      setFormError("Code is required.");
      return;
    }

    if (trimmedCode.length > 20) {
      setFormError("Code cannot exceed 20 characters.");
      return;
    }

    if (!formData.department_id) {
      setFormError("Department is required.");
      return;
    }

    const payload: DesignationFormData = {
      title: trimmedTitle,
      code: trimmedCode,
      department_id: Number(formData.department_id),
      reports_to_id: "",
      grade_band_id:
        formData.grade_band_id === "" ? "" : Number(formData.grade_band_id),
      status: formData.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onCreated?.();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeModal()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Designation</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new designation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </div>
          ) : null}

          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_designation_title"
              className="text-right font-medium"
            >
              Title *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_designation_title"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                maxLength={150}
                className="pr-16"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.title.length}/150
              </span>
            </div>
          </div>

          {/* Code */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="workflow_designation_code"
              className="text-right font-medium"
            >
              Code *
            </label>

            <div className="col-span-3 relative">
              <Input
                id="workflow_designation_code"
                value={formData.code}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: event.target.value,
                  }))
                }
                maxLength={20}
                className="pr-14"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {formData.code.length}/20
              </span>
            </div>
          </div>

          {/* Department */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Department *</label>

            <div className="col-span-3">
              <SearchableSelect
                options={departmentOptions}
                value={
                  formData.department_id ? String(formData.department_id) : ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    department_id: value === "" ? "" : Number(value),
                  }))
                }
                placeholder="Select department..."
                searchPlaceholder="Search departments..."
                emptyText="No departments found."
                groupLabel="Departments"
                allowAll={false}
                widthClass="w-full"
                disabled={false}
                isLoading={isLoadingDepartments}
                multiple={false}
              />
            </div>
          </div>

          {/* Reports To */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Reports To</label>

            <div className="col-span-3">
              <Input
                value="Not assigned"
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          {/* Grade Band */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium">Grade Band</label>

            <div className="col-span-3">
              <SearchableSelect
                options={gradeBandOptions}
                value={
                  formData.grade_band_id ? String(formData.grade_band_id) : ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    grade_band_id: value === "" ? "" : Number(value),
                  }))
                }
                placeholder="Select grade band..."
                searchPlaceholder="Search grade bands..."
                emptyText="No grade bands found."
                groupLabel="Grade Bands"
                allowAll={false}
                widthClass="w-full"
                disabled={false}
                isLoading={isLoadingGradeBands}
                multiple={false}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-[#1E1B4B] hover:bg-[#2A2675]"
          >
            {createMutation.isPending ? "Saving..." : "Create Designation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}