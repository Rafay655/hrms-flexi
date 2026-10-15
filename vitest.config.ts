import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Minimal test setup (M-3). jsdom gives the auth-slice tests a real
// localStorage / document.cookie to assert against.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
