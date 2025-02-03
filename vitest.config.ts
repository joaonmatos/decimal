import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    dir: "src",
    coverage: {
      enabled: true,
    },
    typecheck: {
      enabled: true,
    },
  },
});
