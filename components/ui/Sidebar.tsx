"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { usePermissions } from "@/hooks/use-permissions";
import Lucide from "./Lucide";
import { modules, getModuleIdForPath } from "@/lib/sidebarData";
import { activeModuleLink } from "@/lib/module-navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleDropdown } from "@/store/sidebarSlice";
import { useLeaveDelegation } from "@/hooks/useLeaveDelegation";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
type RawSubMenu = {
  disabled?: boolean;
  id: number;
  icon: string;
  title: string;
  pathname?: string;
  subMenu?: RawSubMenu[];
};

type RawMenuItem = {
  disabled?: boolean;
  id: number;
  icon: string;
  title: string;
  pathname?: string;
  subMenu?: RawSubMenu[];
};

type NavItem = {
  disabled?: boolean;
  id: string;
  label: string;
  icon: string;     // ✅ icon name string now
  path?: string;
  subMenu?: NavItem[];
};

const buildNavItemsFromModule = (moduleId: number) => {
  const selectedModule = modules.find((m) => m.id === moduleId);

  if (!selectedModule) {
    return { navItems: [] as NavItem[], moduleName: "Flexi HRMS", moduleTagline: undefined as string | undefined };
  }

  const navItems: NavItem[] = (selectedModule.Menu || []).map((menuItem: RawMenuItem) => {
    const subMenu: NavItem[] | undefined = menuItem.subMenu?.map((subItem: RawSubMenu) => ({
      id: subItem.id.toString(),
      label: subItem.title,
      path: subItem.pathname || "#",
      icon: subItem.icon || "Zap",
      disabled: subItem.disabled,
    }));

    return {
      id: menuItem.id.toString(),
      label: menuItem.title,
      icon: menuItem.icon || "Zap",
      path: menuItem.pathname || undefined,
      disabled: menuItem.disabled,
      subMenu,
    };
  });

  return {
    navItems,
    moduleName: selectedModule.name,
    moduleTagline: selectedModule.Menu?.[0]?.title,
  };
};
const SidebarSkeleton: React.FC = () => {
  return (
    <aside className="font-sidebar w-full overflow-hidden bg-gradient-to-b from-[#252157] via-[#1E1B4B] to-[#171534] text-slate-300 flex flex-col h-screen shadow-xl border-r border-white/5">
      {/* Header skeleton */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36 bg-white/10" />
            <Skeleton className="h-3 w-20 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Nav skeleton */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        <div className="px-3 mb-2">
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>

        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between w-full px-3 py-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-4 h-4 rounded bg-white/10" />
              <Skeleton className="h-3 w-32 bg-white/10" />
            </div>
            <Skeleton className="w-4 h-4 rounded bg-white/10" />
          </div>
        ))}
      </nav>

      {/* Footer skeleton */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="w-4 h-4 rounded bg-white/10" />
          <Skeleton className="h-3 w-28 bg-white/10" />
        </div>
      </div>
    </aside>
  );
};
const subscribeToHydration = () => () => {};
const clientHydrationSnapshot = () => true;
const serverHydrationSnapshot = () => false;
export const Sidebar: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const pathname = usePathname();
  const { canVisit } = usePermissions();
  const dispatch = useAppDispatch();

  const savedModuleId = useAppSelector((s) => s.sidebar.activeModuleId);
  const activeModuleId = getModuleIdForPath(pathname) ?? savedModuleId;
  const openDropdowns = useAppSelector((s) => s.sidebar.openDropdowns);

  const mounted = React.useSyncExternalStore(subscribeToHydration, clientHydrationSnapshot, serverHydrationSnapshot);

  const { navItems: baseNavItems, moduleName, moduleTagline } = buildNavItemsFromModule(activeModuleId);
  const delegation = useLeaveDelegation(activeModuleId === 5 || activeModuleId === 7);
  const temporaryLinks: NavItem[] = [];
  if (delegation.data?.is_temporary_approver && !delegation.isError) {
    if (delegation.data.can_approve_team_leave) temporaryLinks.push({id:'temporary-leave-approvals',label:'Temporary Leave Approvals',icon:'ClipboardCheck',path:'/leave-ease/my-requests?scope=team'});
    if (delegation.data.can_approve_team_regularization) temporaryLinks.push({id:'temporary-regularization-approvals',label:'Temporary Regularization Approvals',icon:'FileClock',path:'/time-sync/my-regularizations?scope=team'});
  }
  const navItems = [...baseNavItems, ...temporaryLinks].map(item => ({...item, subMenu:item.subMenu?.filter(sub=>!sub.path || canVisit(sub.path))})).filter(item => item.subMenu ? item.subMenu.length > 0 : !item.path || canVisit(item.path));

  // ✅ “ready” condition: tweak as you like
  const isReady = mounted && !!activeModuleId;

  if (!isReady) return <SidebarSkeleton />;

  const isDropdownOpen = (id: string) => openDropdowns.includes(id);
  const activePath = activeModuleLink(pathname, activeModuleId);
  const isItemActive = (path?: string) => Boolean(path && path === activePath);
  const isSubItemActive = (item: NavItem) =>
    (item.subMenu || []).some((sub) => isItemActive(sub.path));

  return (
    <aside className="font-sidebar w-full overflow-hidden bg-gradient-to-b from-[#252157] via-[#1E1B4B] to-[#171534] text-slate-300 flex flex-col h-screen shadow-xl border-r border-white/5">
      {/* Header */}
      <div className={`py-5 border-b border-white/[0.07] ${collapsed?"px-0":"px-4"}`}>
        <div className={`flex items-center gap-2.5 ${collapsed?"justify-center":""}`}>
          <div title={moduleName} className="font-sidebar w-9 h-9 shrink-0 rounded-xl bg-[#EEC293] flex items-center justify-center text-indigo-950 font-semibold text-lg shadow-sm shadow-indigo-950/20 ring-1 ring-white/20">
            {moduleName?.charAt(0) ?? "F"}
          </div>
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <span className="font-sidebar block font-semibold text-white text-[14px] tracking-normal leading-5">
              {moduleName}
            </span>
            {moduleTagline && (
              <span className="font-sidebar mt-1 block truncate text-[10px] font-medium text-indigo-200/60 uppercase tracking-[0.1em]">
                {moduleTagline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label={`${moduleName} navigation`} className="flex-1 overflow-y-auto py-4 px-3 space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(165,180,252,0.2)_transparent]">
        <p className={collapsed ? "sr-only" : "px-3 text-[10px] font-semibold text-indigo-200/45 uppercase tracking-[0.12em] mb-3"}>
          Workspace
        </p>

        {navItems.map((item) => {
          const open = isDropdownOpen(item.id);
          const active = isItemActive(item.path) || isSubItemActive(item);

          if (collapsed) {
            const icon = <Lucide icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]} className="h-4 w-4 shrink-0" />;
            const iconClass = `flex h-10 w-full items-center justify-center rounded-none border transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-indigo-200 ${active ? "border-transparent bg-white/[0.08] text-indigo-100" : "border-transparent text-indigo-100/60 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"}`;
            return item.subMenu?.length ? (
              <DropdownMenu key={item.id}>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={item.label} title={item.label} className={iconClass}>{icon}</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" sideOffset={12} className="font-sidebar min-w-56 rounded-xl border-slate-200/80 p-2 text-[12px] shadow-xl">
                  <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                  {item.path && <DropdownMenuItem asChild><Link href={item.path}>{item.label}</Link></DropdownMenuItem>}
                  {item.subMenu.map((sub) => sub.disabled ? <DropdownMenuItem key={sub.id} disabled>{sub.label}</DropdownMenuItem> : <DropdownMenuItem key={sub.id} asChild><Link href={sub.path || "#"} aria-current={isItemActive(sub.path) ? "page" : undefined} className={isItemActive(sub.path) ? "rounded-none bg-accent font-semibold" : ""}>{sub.label}</Link></DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={item.id} href={item.path || "#"} aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined} className={iconClass}>{icon}</Link>
            );
          }

          return (
            <div key={item.id} className="space-y-1">
              <div
                className={[
                  "group relative flex items-center justify-between w-full rounded-none border text-[12px] font-normal leading-5 transition-colors duration-200 motion-reduce:transition-none",
                  active
                    ? "border-transparent bg-white/[0.08] text-white"
                    : open ? "border-white/5 bg-white/[0.04] text-indigo-50" : "border-transparent hover:border-white/5 hover:bg-white/[0.06] hover:text-white text-indigo-100/65",
                ].join(" ")}
              >
                {/* Left */}
                {item.path ? (
                  <Link href={item.path} title={item.label} aria-current={isItemActive(item.path) ? "page" : undefined} className="flex min-h-10 items-center gap-2.5 flex-1 min-w-0 px-3 py-2 rounded-none focus-visible:outline-2 focus-visible:outline-indigo-200">
                    <Lucide
                      icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]}
                      className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-indigo-100" : "text-indigo-200/65 group-hover:text-indigo-100"}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => dispatch(toggleDropdown(item.id))}
                    aria-expanded={open}
                    title={item.label}
                    className="flex min-h-10 items-center gap-2.5 flex-1 min-w-0 px-3 py-2 rounded-none text-left focus-visible:outline-2 focus-visible:outline-indigo-200"
                  >
                    <Lucide
                      icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]}
                      className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-indigo-100" : "text-indigo-200/65 group-hover:text-indigo-100"}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                )}

                {/* Chevron */}
                {item.subMenu?.length ? (
                  <button
                    type="button"
                    onClick={() => dispatch(toggleDropdown(item.id))}
                    className="mr-2 p-1.5 rounded-lg text-indigo-200/60 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-200"
                    aria-expanded={open}
                    aria-label={`Toggle ${item.label} submenu`}
                  >
                    <motion.div
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="flex items-center justify-center"
                    >
                      <Lucide
                        icon="ChevronDown"
                        className="h-3.5 w-3.5"
                      />
                    </motion.div>
                  </button>
                ) : null}
              </div>

              {/* Submenu */}
              <AnimatePresence initial={false}>
                {item.subMenu?.length && open ? (
                  <motion.div
                    key={`submenu-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-7 mr-0 mt-0.5 mb-1 space-y-0.5">
                      {item.subMenu.map((sub) => {
                        const subActive = isItemActive(sub.path);

                        if (sub.disabled) return <span key={sub.id} role="link" aria-disabled="true" title="Currently unavailable" className="flex min-h-8 cursor-not-allowed items-center rounded-lg px-3 py-1 text-[11.5px] font-normal leading-5 text-indigo-200/30"><span className="truncate">{sub.label}</span></span>;

                        return (
                          <Link
                            key={sub.id}
                            href={sub.path || "#"}
                            title={sub.label}
                            aria-current={subActive ? "page" : undefined}
                            className={[
                              "group flex min-h-8 items-center px-3 py-1 rounded-none text-[11.5px] font-normal leading-5 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-indigo-200",
                              subActive
                                ? "bg-white/[0.08] font-medium text-white"
                                : "hover:bg-white/[0.04] hover:text-white text-indigo-100/60",
                            ].join(" ")}
                          >
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {/* <div className="p-4 border-t border-white/10 bg-black/20">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors w-full">
          <Lucide icon={"Settings" as any} />
          System Settings
        </button>
      </div> */}
    </aside>
  );
};
