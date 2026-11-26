"use client";
import {useAppSelector} from '@/store/hooks';
import {hasPermission,canVisit} from '@/lib/access-control';
export function usePermissions(){
 const permissions=useAppSelector(state=>state.auth.permissions ?? state.auth.user?.permissions ?? []);
 return {permissions,can:(permission:string)=>hasPermission(permissions,permission),canVisit:(path:string)=>canVisit(path,permissions)};
}
