"use client";
import type {ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {ShieldAlert} from 'lucide-react';
import {usePermissions} from '@/hooks/use-permissions';
export function PermissionBoundary({children}:{children:ReactNode}){
 const pathname=usePathname();const {canVisit}=usePermissions();
 if(!canVisit(pathname))return <section role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 border bg-white p-8 text-center"><ShieldAlert className="h-6 w-6 text-brand-800"/><h1 className="text-lg font-semibold">Access restricted</h1><p className="text-sm text-muted-foreground">Your account does not have permission to view this page. Contact your administrator.</p></section>;
 return children;
}
export function Permission({name,children}:{name:string;children:ReactNode}){const {can}=usePermissions();return can(name)?children:null;}
