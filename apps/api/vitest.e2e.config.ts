import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@agendarhorario/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.e2e-spec.ts"],
  },
});
