"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setActiveModuleId } from "@/store/sidebarSlice";
import { moduleRoute } from "@/lib/module-navigation";
import { PermissionBoundary } from "@/components/shared/PermissionBoundary";
import DashboardHeader from "@/components/ui/DashboardHeader";
import { Sidebar } from "@/components/ui/Sidebar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { HrmsShiftProvider } from "./time-sync/shifts/context";
import RealtimeProvider from "@/components/RealtimeProvider";

function subscribeToViewport(callback: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const isDesktopViewport = () => window.matchMedia("(min-width: 768px)").matches;
const serverViewport = () => true;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeToViewport, isDesktopViewport, serverViewport);
  const sidebarOpen = isDesktop ? desktopOpen : mobileOpen;
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isDesktop) setDesktopOpen(false);
        else setMobileOpen(false);
        document.getElementById("sidebar-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, isDesktop]);
  useEffect(() => {
    const route = moduleRoute(pathname);
    if (!route) return;
    dispatch(setActiveModuleId(route.id));
    if (route.redirect) router.replace(route.redirect);
  }, [pathname, dispatch, router]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Keep navigation mounted so both opening and closing can animate. */}
      <div
        id="dashboard-sidebar"
        inert={!isDesktop && !mobileOpen}
        aria-hidden={!isDesktop && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${desktopOpen ? "md:w-64" : "md:w-20"}`}
        onClick={(event) => {
          if (!isDesktop && (event.target as HTMLElement).closest("a")) setMobileOpen(false);
        }}
      >
        <Sidebar collapsed={isDesktop && !desktopOpen} />
      </div>

      <button
        type="button"
        aria-label="Close sidebar"
        tabIndex={-1}
        aria-hidden={!mobileOpen || isDesktop}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ease-in-out motion-reduce:transition-none md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Main content */}
       <RealtimeProvider>

      <main data-table-theme="professional" className={`min-w-0 flex-1 overflow-x-hidden min-h-screen pt-16 transition-[margin-left] duration-300 ease-in-out motion-reduce:transition-none ${desktopOpen ? "md:ml-64" : "md:ml-20"}`}>
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onMenuClick={() => isDesktop ? setDesktopOpen((open) => !open) : setMobileOpen((open) => !open)}
          />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">
          <Breadcrumb />
          <PermissionBoundary><HrmsShiftProvider>{children}</HrmsShiftProvider></PermissionBoundary>
        </div>
      </main>
          </RealtimeProvider>
    </div>
  );
}
