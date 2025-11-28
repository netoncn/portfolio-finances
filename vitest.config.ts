import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/domain/ai/tools/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Mock server-only for testing
      "server-only": resolve(__dirname, "./vitest.mock-server-only.ts"),
    },
  },
});
