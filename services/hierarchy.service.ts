import {api} from "@/lib/api";

import type {
  ApiGradeBand,
  ApiHierarchyResponse,
  ApiUnassignedHierarchyResponse,
  Department,
  Designation,
  Division,
  HierarchyDepartment,
  HierarchyDivision,
  MappedHierarchyData,
  MappedUnassignedHierarchyData,
} from "../types/hierarchy";

const mapGradeToLevel = (
  gradeBand?: ApiGradeBand | null
): Designation["level"] => {
  const text = `${gradeBand?.name ?? ""} ${gradeBand?.level ?? ""}`.toLowerCase();

  if (text.includes("intern")) return "Intern";
  if (text.includes("junior") || text.includes("grade 1")) return "Junior";
  if (text.includes("senior")) return "Senior";
  if (text.includes("c-suite") || text.includes("chief")) return "C-Suite";

  return "Mid";
};

const mapDesignation = (
  designation: {
    id: number;
    title: string;
    code: string;
    grade_band: ApiGradeBand | null;
  },
  departmentId: string | null = null
): Designation => {
  return {
    id: String(designation.id),
    name: designation.title,
    code: designation.code,
    level: mapGradeToLevel(designation.grade_band),
    systemDeptId: departmentId,
    gradeBand: designation.grade_band
      ? {
          id: String(designation.grade_band.id),
          name: designation.grade_band.name,
          level: designation.grade_band.level,
          code: designation.grade_band.code ?? null,
        }
      : null,
  };
};

const mapHierarchyResponse = (
  response: ApiHierarchyResponse
): MappedHierarchyData => {
  const divisions: Division[] = [];
  const departments: Department[] = [];
  const designations: Designation[] = [];
  const hierarchy: HierarchyDivision[] = [];

  response.data.forEach((division) => {
    const divisionId = String(division.id);

    divisions.push({
      id: divisionId,
      name: division.name,
      code: division.code,
    });

    const hierarchyDepartments: HierarchyDepartment[] = [];

    division.departments?.forEach((department) => {
      const departmentId = String(department.id);

      departments.push({
        id: departmentId,
        name: department.name,
        code: department.code,
        systemDivisionId: divisionId,
      });

      const hierarchyDesignations =
        department.designations?.map((designation) => {
          const designationId = String(designation.id);

          designations.push(mapDesignation(designation, departmentId));

          return {
            designationId,
          };
        }) ?? [];

      hierarchyDepartments.push({
        deptId: departmentId,
        designations: hierarchyDesignations,
      });
    });

    hierarchy.push({
      divisionId,
      departments: hierarchyDepartments,
    });
  });

  return {
    company: response.meta.company
      ? {
          id: String(response.meta.company.id),
          uuid: response.meta.company.uuid,
          name: response.meta.company.name,
        }
      : null,
    divisions,
    departments,
    designations,
    hierarchy,
    meta: {
      divisions: response.meta.divisions,
      departments: response.meta.departments,
      designations: response.meta.designations,
    },
  };
};

const mapUnassignedResponse = (
  response: ApiUnassignedHierarchyResponse
): MappedUnassignedHierarchyData => {
  const divisions: Division[] = response.data.divisions.map((division) => ({
    id: String(division.id),
    name: division.name,
    code: division.code,
  }));

  const departments: Department[] = response.data.departments.map(
    (department) => ({
      id: String(department.id),
      name: department.name,
      code: department.code,
      systemDivisionId: null,
    })
  );

  const designations: Designation[] = response.data.designations.map(
    (designation) => mapDesignation(designation, null)
  );

  return {
    divisions,
    departments,
    designations,
    meta: {
      totalUnassignedDivisions: response.meta.total_unassigned_divisions,
      totalUnassignedDepartments: response.meta.total_unassigned_departments,
      totalUnassignedDesignations: response.meta.total_unassigned_designations,
    },
  };
};
export interface SaveHierarchyPayload {
  company_id: string;
  divisions: {
    id: number;
    departments: {
      id: number;
      designations: number[];
    }[];
  }[];
}

export const hierarchyService = {
  async getCompanyHierarchy(
    companyId: string | number
  ): Promise<MappedHierarchyData> {
    const { data } = await api.get<ApiHierarchyResponse>("/flexi-hq/hierarchy", {
      params: {
        company_id: companyId,
      },
    });

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch hierarchy.");
    }

    return mapHierarchyResponse(data);
  },

  async getUnassignedHierarchy(
    companyId: string | number
  ): Promise<MappedUnassignedHierarchyData> {
    const { data } = await api.get<ApiUnassignedHierarchyResponse>(
      "/flexi-hq/hierarchy/unassigned",
      {
        params: {
          company_id: companyId,
        },
      }
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch unassigned hierarchy.");
    }

    return mapUnassignedResponse(data);
  },
    async saveCompanyHierarchy(payload: SaveHierarchyPayload) {
    const { data } = await api.post("/flexi-hq/hierarchy/save", payload);

    if (!data.success) {
      throw new Error(data.message || "Failed to save hierarchy.");
    }

    return data;
  },
};