import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  minify: true,
  clean: true,
  platform: "neutral",
});
