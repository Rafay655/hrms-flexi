"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Menu,
  PanelLeftClose,
  LayoutGrid,
  LogOut,
  User,
  ChevronDown,
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
  const [moduleMenu, setModuleMenu] = React.useState<"modules" | "admin" | null>(null);
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
    setModuleMenu(null);
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
    <header className={`font-sidebar fixed inset-x-0 top-0 z-30 border-b border-slate-300 bg-white/95 backdrop-blur-sm transition-[left] duration-300 ease-in-out motion-reduce:transition-none ${sidebarOpen ? "md:left-64" : "md:left-20"}`}>
      <div className="mx-auto flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          id="sidebar-toggle"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#322E53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-slate-800">{modules.find((module) => module.id === currentModule)?.name || "Workspace"}</p></div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
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
          <DropdownMenu open={moduleMenu === "modules"} onOpenChange={(open) => setModuleMenu(open ? "modules" : null)}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Open modules" title="Modules" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#322E53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="font-sidebar w-[600px] max-w-[calc(100vw-24px)] overflow-hidden rounded-none border border-slate-200/80 bg-white p-0 shadow-lg shadow-slate-900/10"
              align="end"
              sideOffset={8}
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
          <DropdownMenu open={moduleMenu === "admin"} onOpenChange={(open) => setModuleMenu(open ? "admin" : null)}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Open admin center" title="Admin center" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#322E53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="font-sidebar w-[600px] max-w-[calc(100vw-24px)] overflow-hidden rounded-none border border-slate-200/80 bg-white p-0 shadow-lg shadow-slate-900/10"
              align="end"
              sideOffset={8}
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
                aria-label="Open profile menu"
                className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <Avatar className="h-8 w-8 border border-slate-200">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} />
                  ) : null}

                  <AvatarFallback className="bg-brand-800 text-[11px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden max-w-[140px] lg:block">
                  <p className="truncate text-[12px] font-medium leading-4 text-slate-800">{userName}</p>
                  <p className="mt-0.5 truncate text-[10px] leading-4 text-slate-500">{userRole}</p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="font-sidebar w-72 max-w-[calc(100vw-24px)] rounded-none border border-slate-200/80 bg-white p-1.5 text-[12px] shadow-lg shadow-slate-900/10"
            >
              <div className="flex items-center gap-2.5 px-2.5 py-3 mb-1 border-b border-slate-100">
                <Avatar className="h-9 w-9 shrink-0">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} />
                  ) : null}

                  <AvatarFallback className="bg-brand-800 text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-brand-900">
                    {userName}
                  </p>

                  {userEmail ? (
                    <p className="truncate text-[11px] text-muted-foreground">
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
                className="min-h-9 cursor-pointer rounded-none px-2.5 text-[12px] focus:bg-[#322E53]/5"
              >
                <User className="h-3.5 w-3.5" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/flexi-hq/settings")}
                className="min-h-9 cursor-pointer rounded-none px-2.5 text-[12px] focus:bg-[#322E53]/5"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="min-h-9 cursor-pointer rounded-none px-2.5 text-[12px] text-destructive focus:bg-red-50 focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
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
