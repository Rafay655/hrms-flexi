import { vi } from "vitest";

// Node 22+ ships an experimental global `localStorage` (gated on
// --localstorage-file) that shadows jsdom's and is missing methods such as
// clear(). Replace it with a clean in-memory implementation so the auth-slice
// tests have a predictable localStorage.
const makeStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => (key in store ? store[key] : null),
    key: (i: number) => Object.keys(store)[i] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
  } as Storage;
};

vi.stubGlobal("localStorage", makeStorage());
