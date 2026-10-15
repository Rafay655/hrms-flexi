"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  HelpCircle,
  Settings,
  Menu,
  PanelLeftClose,
  LayoutGrid,
  LogOut,
  User,
} from "lucide-react";
import NotificationBell from "@/components/AnnouncementBell";
import CompanySwitcher from "@/components/CompanySwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { modules } from "@/lib/sidebarData";
import { moduleDestination } from "@/lib/module-navigation";
import { useMutation } from "@tanstack/react-query";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { setActiveModuleId } from "@/store/sidebarSlice";
import { clearAuth } from "@/store/authSlice";
import ModuleGridPanel from "@/components/ui/ModuleGrid";
import { api } from "@/lib/api";


interface DashboardHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const getInitials = (name?: string | null) => {
  if (!name) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatUserRole = (userType?: string | null, roles?: string[]) => {
  const role = roles?.[0] || userType || "User";

  return role
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const DashboardHeader = ({ onMenuClick, sidebarOpen }: DashboardHeaderProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const currentModule = useAppSelector(
    (state: RootState) => state.sidebar.activeModuleId
  );

  const authUser = useAppSelector((state: RootState) => state.auth.user);
  const roles = useAppSelector((state: RootState) => state.auth.roles);

  const userName = authUser?.name || "User";
  const userEmail = authUser?.email || "";
  const avatarUrl = authUser?.avatar || "";
  const initials = useMemo(() => getInitials(userName), [userName]);
  const userRole = useMemo(
    () => formatUserRole(authUser?.user_type, roles),
    [authUser?.user_type, roles]
  );

  const handleModuleChange = (id: number) => {
    const destination = moduleDestination(id);
    dispatch(setActiveModuleId(destination.id));
    router.push(destination.path);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return api.post("auth/logout");
    },

    onSuccess: () => {
      dispatch(clearAuth());
      router.replace("/login");
    },

    onError: () => {
      dispatch(clearAuth());
      router.replace("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

 

  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="flex items-center gap-4 px-4 py-4 border-b shadow-md border-slate-100 md:justify-end">
        <button
          type="button"
          onClick={onMenuClick}
          id="sidebar-toggle"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <CompanySwitcher />

          {/*
            NotificationBell renders its own trigger <button> internally
            (via DropdownMenuTrigger asChild). Do NOT wrap it in another
            <button> — nesting buttons is invalid HTML and breaks click
            handling. Real-time connection is handled centrally by
            <RealtimeProvider> (mounted once near the app root) — this
            component just listens for the "notification-received"
            window event, no props needed here.
          */}
          <NotificationBell />

          {/* Main HRMS modules */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white! text-slate-500 shadow-sm hover:text-[#1E1B4B] cursor-pointer">
                <AvatarFallback className="rounded-lg bg-white">
                  <LayoutGrid className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-xl"
              align="end"
            >
              <ModuleGridPanel
                title="Modules"
                modules={modules.filter((m) => !m.admin)}
                activeId={currentModule}
                onSelect={handleModuleChange}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin modules */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white! text-slate-500 shadow-sm hover:text-[#1E1B4B] cursor-pointer">
                <AvatarFallback className="rounded-lg bg-white">
                  <Settings className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-xl"
              align="end"
            >
              <ModuleGridPanel
                title="Admin Center"
                modules={modules.filter((m) => m.admin)}
                activeId={currentModule}
                onSelect={handleModuleChange}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center "
              >
                <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} />
                  ) : null}

                  <AvatarFallback className="bg-brand-800 text-[11px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* <div className="hidden max-w-[150px] text-left lg:block">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {userRole}
                  </p>
                </div> */}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"
            >
              <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
                <Avatar className="h-11 w-11">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} />
                  ) : null}

                  <AvatarFallback className="bg-brand-800 text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-900">
                    {userName}
                  </p>

                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </p>
                  ) : null}

                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                    {userRole}
                  </p>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => router.push("/people-hub/ess-profile")}
                className="mt-2 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/flexi-hq/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
