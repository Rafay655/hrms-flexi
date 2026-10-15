import { getModuleIdForPath, getModuleLandingPath, modules } from "./sidebarData";

export const MODULE_STORAGE_KEY = "sidebar_activeModuleId";
export const DEFAULT_MODULE_ID = 1;

export function moduleDestination(value: unknown) {
  const id = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : DEFAULT_MODULE_ID;
  const path = Number.isSafeInteger(id) ? getModuleLandingPath(id) : undefined;
  return path?.startsWith("/") && !path.startsWith("//")
    ? { id, path }
    : { id: DEFAULT_MODULE_ID, path: getModuleLandingPath(DEFAULT_MODULE_ID)! };
}

export function savedModuleDestination() {
  try { return moduleDestination(typeof window === "undefined" ? null : localStorage.getItem(MODULE_STORAGE_KEY)); }
  catch { return moduleDestination(null); }
}

export function activeModuleLink(pathname: string, moduleId: number): string | undefined {
  const module = modules.find((item) => item.id === moduleId);
  const paths = (module?.Menu ?? []).flatMap((item) => [item.pathname, ...(item.subMenu ?? []).map((sub) => sub.pathname)])
    .filter((path): path is string => Boolean(path?.startsWith("/")));
  const landing = getModuleLandingPath(moduleId);
  return paths.filter((path) => path === pathname || (path !== landing && pathname.startsWith(`${path}/`)))
    .sort((a, b) => b.length - a.length)[0] ?? (pathname === landing ? landing : undefined);
}

export function moduleRoute(pathname: string) {
  const id = getModuleIdForPath(pathname);
  if (id === null) return null;
  const destination = moduleDestination(id);
  return { ...destination, redirect: pathname.startsWith("/letter-forge/") && !activeModuleLink(pathname, id) ? destination.path : undefined };
}
