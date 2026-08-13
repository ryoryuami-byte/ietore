import { readFileSync } from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  plugins: [react()],
  /* 不具合の記録に版番号を入れるため。package.json の値をそのまま使う */
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
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
