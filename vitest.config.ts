import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Integration tests share one live database — run files sequentially
    fileParallelism: false,
  },
});
