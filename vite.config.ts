import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  resolve: {
    alias: {
      "@wf-controls/data": path.resolve(__dirname, "./packages/data/dist/index.js"),
      "@wf-controls/core": path.resolve(__dirname, "./packages/core/dist/index.js"),
      "@wf-controls/styles": path.resolve(__dirname, "./packages/styles/css"),
      "@wf-controls/react": path.resolve(__dirname, "./packages/react/dist/index.js"),
      "@wf-controls/license": path.resolve(__dirname, "./packages/license/dist/index.js"),
      "@wf-controls/pro-data": path.resolve(__dirname, "./packages/pro-data/dist/index.js"),
      "@wf-controls/pro-data-react": path.resolve(__dirname, "./packages/pro-data-react/dist/index.js"),
    },
  },
});
