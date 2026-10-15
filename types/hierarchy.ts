export type DesignationLevel =
  | "C-Suite"
  | "Senior"
  | "Mid"
  | "Junior"
  | "Intern";

export interface Division {
  id: string;
  name: string;
  code: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  systemDivisionId: string | null;
}

export interface GradeBand {
  id: string;
  name: string;
  level: string;
  code?: string | null;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  level: DesignationLevel;
  systemDeptId: string | null;
  gradeBand: GradeBand | null;
}

export interface HierarchyDesignation {
  designationId: string;
}

export interface HierarchyDepartment {
  deptId: string;
  designations: HierarchyDesignation[];
}

export interface HierarchyDivision {
  divisionId: string;
  departments: HierarchyDepartment[];
}

export interface PickerOption {
  id: string;
  name: string;
  code?: string;
  meta?: string;
  warn?: string;
}

/* API shared */

export interface ApiGradeBand {
  id: number;
  name: string;
  level: string;
  code?: string | null;
}

export interface ApiDesignation {
  id: number;
  title: string;
  code: string;
  grade_band: ApiGradeBand | null;
}

export interface ApiDepartment {
  id: number;
  name: string;
  code: string;
  designations?: ApiDesignation[];
}

export interface ApiDivision {
  id: number;
  name: string;
  code: string;
  departments?: ApiDepartment[];
}

/* Assigned hierarchy API */

export interface ApiHierarchyResponse {
  success: boolean;
  message: string;
  data: ApiDivision[];
  meta: {
    company?: {
      id: number;
      uuid: string;
      name: string;
    };
    divisions: number;
    departments: number;
    designations: number;
  };
}

export interface MappedHierarchyData {
  company: {
    id: string;
    uuid: string;
    name: string;
  } | null;
  divisions: Division[];
  departments: Department[];
  designations: Designation[];
  hierarchy: HierarchyDivision[];
  meta: {
    divisions: number;
    departments: number;
    designations: number;
  };
}

/* Unassigned API */

export interface ApiUnassignedHierarchyResponse {
  success: boolean;
  message: string;
  data: {
    divisions: ApiDivision[];
    departments: ApiDepartment[];
    designations: ApiDesignation[];
  };
  meta: {
    total_unassigned_divisions: number;
    total_unassigned_departments: number;
    total_unassigned_designations: number;
  };
}

export interface MappedUnassignedHierarchyData {
  divisions: Division[];
  departments: Department[];
  designations: Designation[];
  meta: {
    totalUnassignedDivisions: number;
    totalUnassignedDepartments: number;
    totalUnassignedDesignations: number;
  };
}