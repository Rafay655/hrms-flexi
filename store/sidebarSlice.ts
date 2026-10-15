import { createSlice, PayloadAction } from "@reduxjs/toolkit";

function savePreference(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Navigation still works when storage is blocked. */ }
}
function removePreference(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* Storage is optional. */ }
}

type SidebarState = {
  activeModuleId: number;
  openDropdowns: string[];
};

import { DEFAULT_MODULE_ID, moduleDestination, savedModuleDestination } from "@/lib/module-navigation";

const STORAGE_KEYS = {
  activeModuleId: "sidebar_activeModuleId",
  openDropdowns: "sidebar_openDropdowns",
};

// ---- safe getters (browser-only) ----
const getInitialActiveModuleId = () => savedModuleDestination().id;

const getInitialOpenDropdowns = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.openDropdowns);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const initialState: SidebarState = {
  activeModuleId: getInitialActiveModuleId(),
  openDropdowns: getInitialOpenDropdowns(),
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setActiveModuleId(state, action: PayloadAction<number>) {
      const id = moduleDestination(action.payload).id;
      if (state.activeModuleId === id) return;
      state.activeModuleId = id;

      // optional: collapse dropdowns when switching module
      state.openDropdowns = [];

      if (typeof window !== "undefined") {
        savePreference(
          STORAGE_KEYS.activeModuleId,
          String(id)
        );
        savePreference(
          STORAGE_KEYS.openDropdowns,
          JSON.stringify([])
        );
      }
    },

    toggleDropdown(state, action: PayloadAction<string>) {
      const id = action.payload;
      const exists = state.openDropdowns.includes(id);

      state.openDropdowns = exists
        ? state.openDropdowns.filter((x) => x !== id)
        : [...state.openDropdowns, id];

      if (typeof window !== "undefined") {
        savePreference(
          STORAGE_KEYS.openDropdowns,
          JSON.stringify(state.openDropdowns)
        );
      }
    },

    closeAllDropdowns(state) {
      state.openDropdowns = [];

      if (typeof window !== "undefined") {
        savePreference(
          STORAGE_KEYS.openDropdowns,
          JSON.stringify([])
        );
      }
    },

    setOpenDropdowns(state, action: PayloadAction<string[]>) {
      state.openDropdowns = action.payload;

      if (typeof window !== "undefined") {
        savePreference(
          STORAGE_KEYS.openDropdowns,
          JSON.stringify(action.payload)
        );
      }
    },

    resetSidebarState(state) {
      state.activeModuleId = DEFAULT_MODULE_ID;
      state.openDropdowns = [];

      if (typeof window !== "undefined") {
        removePreference(STORAGE_KEYS.activeModuleId);
        removePreference(STORAGE_KEYS.openDropdowns);
      }
    },
  },
});

export const {
  setActiveModuleId,
  toggleDropdown,
  closeAllDropdowns,
  setOpenDropdowns,
  resetSidebarState,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;