import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@components": path.resolve(__dirname, "src/components"),
      "@state": path.resolve(__dirname, "src/state"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@theme": path.resolve(__dirname, "src/theme"),
      "@data": path.resolve(__dirname, "src/data"),
      "@assets": path.resolve(__dirname, "assets")
    }
  }
});
