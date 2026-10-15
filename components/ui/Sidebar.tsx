"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import Lucide from "./Lucide";
import { modules, getModuleIdForPath } from "@/lib/sidebarData";
import { activeModuleLink } from "@/lib/module-navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleDropdown } from "@/store/sidebarSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
type RawSubMenu = {
  id: number;
  icon: string;
  title: string;
  pathname?: string;
  subMenu?: RawSubMenu[];
};

type RawMenuItem = {
  id: number;
  icon: string;
  title: string;
  pathname?: string;
  subMenu?: RawSubMenu[];
};

type NavItem = {
  id: string;
  label: string;
  icon: string;     // ✅ icon name string now
  path?: string;
  subMenu?: NavItem[];
};

const buildNavItemsFromModule = (moduleId: number) => {
  const module = modules.find((m) => m.id === moduleId);

  if (!module) {
    return { navItems: [] as NavItem[], moduleName: "Flexi HRMS", moduleTagline: undefined as string | undefined };
  }

  const navItems: NavItem[] = (module.Menu || []).map((menuItem: RawMenuItem) => {
    const subMenu: NavItem[] | undefined = menuItem.subMenu?.map((subItem: RawSubMenu) => ({
      id: subItem.id.toString(),
      label: subItem.title,
      path: subItem.pathname || "#",
      icon: subItem.icon || "Zap",
    }));

    return {
      id: menuItem.id.toString(),
      label: menuItem.title,
      icon: menuItem.icon || "Zap",
      path: menuItem.pathname || undefined,
      subMenu,
    };
  });

  return {
    navItems,
    moduleName: module.name,
    moduleTagline: module.Menu?.[0]?.title,
  };
};
const SidebarSkeleton: React.FC = () => {
  return (
    <aside className="w-full overflow-hidden bg-gradient-to-b from-[#252157] via-[#1E1B4B] to-[#171534] text-slate-300 flex flex-col h-screen shadow-xl border-r border-white/5">
      {/* Header skeleton */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
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
              <Skeleton className="w-5 h-5 rounded bg-white/10" />
              <Skeleton className="h-3 w-32 bg-white/10" />
            </div>
            <Skeleton className="w-4 h-4 rounded bg-white/10" />
          </div>
        ))}
      </nav>

      {/* Footer skeleton */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="w-5 h-5 rounded bg-white/10" />
          <Skeleton className="h-3 w-28 bg-white/10" />
        </div>
      </div>
    </aside>
  );
};
export const Sidebar: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const savedModuleId = useAppSelector((s) => s.sidebar.activeModuleId);
  const activeModuleId = getModuleIdForPath(pathname) ?? savedModuleId;
  const openDropdowns = useAppSelector((s) => s.sidebar.openDropdowns);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { navItems, moduleName, moduleTagline } = buildNavItemsFromModule(activeModuleId);

  // ✅ “ready” condition: tweak as you like
  const isReady = mounted && !!activeModuleId && navItems.length > 0;

  if (!isReady) return <SidebarSkeleton />;

  const isDropdownOpen = (id: string) => openDropdowns.includes(id);
  const activePath = activeModuleLink(pathname, activeModuleId);
  const isItemActive = (path?: string) => Boolean(path && path === activePath);
  const isSubItemActive = (item: NavItem) =>
    (item.subMenu || []).some((sub) => isItemActive(sub.path));

  return (
    <aside className="w-full overflow-hidden bg-gradient-to-b from-[#252157] via-[#1E1B4B] to-[#171534] text-slate-300 flex flex-col h-screen shadow-xl border-r border-white/5">
      {/* Header */}
      <div className="px-5 py-6 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div title={moduleName} className="w-10 h-10 shrink-0 rounded-2xl bg-[#EEC293] flex items-center justify-center text-indigo-950 font-semibold text-xl shadow-lg shadow-indigo-950/30 ring-1 ring-white/20">
            {moduleName?.charAt(0) ?? "F"}
          </div>
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <span className="block font-semibold text-white text-lg tracking-tight leading-tight">
              {moduleName}
            </span>
            {moduleTagline && (
              <span className="mt-1 block truncate text-[10px] font-medium text-indigo-200/60 uppercase tracking-[0.15em]">
                {moduleTagline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label={`${moduleName} navigation`} className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(165,180,252,0.2)_transparent]">
        <p className={collapsed ? "sr-only" : "px-3 text-[10px] font-semibold text-indigo-200/45 uppercase tracking-[0.2em] mb-4"}>
          Workspace
        </p>

        {navItems.map((item) => {
          const open = isDropdownOpen(item.id);
          const active = isItemActive(item.path) || isSubItemActive(item);

          if (collapsed) {
            const icon = <Lucide icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]} className="h-5 w-5 shrink-0" />;
            const iconClass = `flex h-12 w-full items-center justify-center rounded-2xl border transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-indigo-200 ${active ? "border-indigo-300/25 bg-indigo-300/15 text-indigo-100 shadow-sm shadow-black/10" : "border-transparent text-indigo-100/60 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"}`;
            return item.subMenu?.length ? (
              <DropdownMenu key={item.id}>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={item.label} title={item.label} className={iconClass}>{icon}</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" sideOffset={12} className="min-w-56 rounded-xl border-slate-200/80 p-2 shadow-xl">
                  <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                  {item.path && <DropdownMenuItem asChild><Link href={item.path}>{item.label}</Link></DropdownMenuItem>}
                  {item.subMenu.map((sub) => <DropdownMenuItem key={sub.id} asChild><Link href={sub.path || "#"} aria-current={isItemActive(sub.path) ? "page" : undefined} className={isItemActive(sub.path) ? "bg-accent font-semibold" : ""}>{sub.label}</Link></DropdownMenuItem>)}
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
                  "group relative flex items-center justify-between w-full rounded-xl border text-[13px] font-medium transition-colors duration-200 motion-reduce:transition-none",
                  active
                    ? "border-indigo-300/20 bg-gradient-to-r from-indigo-300/20 to-indigo-300/5 text-white shadow-sm shadow-black/10"
                    : open ? "border-white/5 bg-white/[0.04] text-indigo-50" : "border-transparent hover:border-white/5 hover:bg-white/[0.06] hover:text-white text-indigo-100/65",
                ].join(" ")}
              >
                {/* Left */}
                {item.path ? (
                  <Link href={item.path} aria-current={isItemActive(item.path) ? "page" : undefined} className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-200">
                    <Lucide
                      icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]}
                      className={`h-8 w-8 shrink-0 rounded-lg p-1.5 transition-colors ${active ? "bg-indigo-200/15 text-indigo-100" : "bg-white/[0.04] text-indigo-200/65 group-hover:bg-white/[0.07] group-hover:text-indigo-100"}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => dispatch(toggleDropdown(item.id))}
                    aria-expanded={open}
                    className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-indigo-200"
                  >
                    <Lucide
                      icon={item.icon as React.ComponentProps<typeof Lucide>["icon"]}
                      className={`h-8 w-8 shrink-0 rounded-lg p-1.5 transition-colors ${active ? "bg-indigo-200/15 text-indigo-100" : "bg-white/[0.04] text-indigo-200/65 group-hover:bg-white/[0.07] group-hover:text-indigo-100"}`}
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
                    <div className="ml-7 mr-1 my-2 pl-3 border-l border-indigo-200/15 space-y-1">
                      {item.subMenu.map((sub) => {
                        const subActive = isItemActive(sub.path);

                        return (
                          <Link
                            key={sub.id}
                            href={sub.path || "#"}
                            aria-current={subActive ? "page" : undefined}
                            className={[
                              "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-indigo-200",
                              subActive
                                ? "bg-indigo-200/10 text-indigo-50"
                                : "hover:bg-white/5 hover:text-indigo-50 text-indigo-200/60",
                            ].join(" ")}
                          >
                            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${subActive ? "bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.5)]" : "bg-indigo-200/25 group-hover:bg-indigo-200/60"}`} />
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
