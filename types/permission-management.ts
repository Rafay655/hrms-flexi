export interface PermissionDefinition {id:number;name:string;module:string|null;group:string|null;description:string|null;guard_name:string;action:string|null;created_at:string|null;updated_at:string|null;}
export interface PermissionCreate {name:string;module:string;group:string;description:string;}
export interface PermissionUpdate {module?:string;group:string;description:string;}
export interface PermissionRole {id:number;name:string;display_name:string;guard_name:string;permissions:string[];users_count:number|null;}
export interface PermissionSyncResult {applied:number|null;changes:{added:string[];removed:string[]};message:string;}
