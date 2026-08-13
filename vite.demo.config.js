/* お試し用の1ファイルビルド。

   ふだんのビルド（vite.config.js）は JS・CSS を分けて出すが、
   それだと1枚の HTML に収められない。
   ここでは動的 import もまとめて1つにし、CSS も分割しない。

     npx vite build --config vite.demo.config.js

   出力: dist-demo/
   本番のアプリはこちらではなく vite.config.js のビルドを使う。 */
import { readFileSync } from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  base: "./",
  build: {
    outDir: "dist-demo",
    target: ["es2020", "safari15"],
    sourcemap: false,
    cssCodeSplit: false,
    /* 画像などをすべて data: URI にする（外部ファイルを作らない） */
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        /* Capacitor の web 版フォールバックが動的 import で分かれるので、
           1つにまとめる */
        inlineDynamicImports: true,
      },
    },
  },
});
