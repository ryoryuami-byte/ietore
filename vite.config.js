import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  /* Capacitor は dist をそのままアプリの中に取り込む。
     ファイルは file:// で読まれるので、絶対パス（/assets/...）だと 404 になる */
  base: "./",
  build: {
    outDir: "dist",
    /* iOS 15 / Android 8 くらいまでを想定 */
    target: ["es2020", "safari15"],
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["./src/test-setup.js"],
  },
});
