/* お試し版を1枚の HTML にまとめる。

     npm run build:demo   →  dist-demo/ietore.html

   このファイルを開けば、インストールせずにアプリを触れる。
   ネイティブの機能（お知らせ・共有シート・画面スリープ防止）は
   ブラウザでは動かないが、画面と組み立てはすべて本物どおり。

   本番のアプリはこちらではなく npm run build を使う。 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const OUT_DIR = "dist-demo";
const ASSETS = path.join(OUT_DIR, "assets");

execFileSync("npx", ["vite", "build", "--config", "vite.demo.config.js"], { stdio: "inherit" });

const read = (ext) =>
  fs.readdirSync(ASSETS)
    .filter((f) => f.endsWith(ext))
    .map((f) => fs.readFileSync(path.join(ASSETS, f), "utf8"))
    .join("\n");

/* インラインの script の中に </script> があると、そこで切れてしまう */
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

/* 見た目はアプリ側（tokens.js）が全部持っている。ここでは器だけ用意する */
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>イエトレ</title>
<style>
${read(".css")}
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
${safe(read(".js"))}
</script>
</body>
</html>
`;

const out = path.join(OUT_DIR, "ietore.html");
fs.writeFileSync(out, html);
console.log(`\n${out}  ${(html.length / 1024).toFixed(0)}KB`);
console.log("ブラウザでこのファイルを開くと、そのまま試せます。");
