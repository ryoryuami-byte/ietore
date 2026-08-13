/* 画面に出している法務の文面から、公開用の Markdown を作る。

   App Store はプライバシーポリシーの URL を登録する欄があり、
   アプリの中に置いておくだけでは足りない。文面が2か所にあると必ずずれるので、
   src/legal.js を唯一の出どころにして、こちらを機械的に作る。

     npm run legal
*/
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const { HEALTH, PRIVACY, TERMS, CONTACT } = await import(
  pathToFileURL(path.resolve("src/legal.js")).href
);

const OUT = "docs/legal";
fs.mkdirSync(OUT, { recursive: true });

const NOTE =
  "<!-- このファイルは src/legal.js から自動生成しています。直接編集しないでください。" +
  " 文面を変えるときは src/legal.js を直し、npm run legal を実行してください。 -->\n";

const render = (doc, sections) => {
  const lines = [NOTE, `# ${doc.title}`, ""];
  if (doc.updated) lines.push(`最終更新: ${doc.updated}`, "");
  if (doc.summary) lines.push(`> ${doc.summary}`, "");
  for (const s of sections) lines.push(`## ${s.head}`, "", s.body, "");
  return lines.join("\n");
};

const files = [
  ["health.md", render(
    { title: HEALTH.title, summary: HEALTH.intro },
    HEALTH.points
  )],
  ["privacy.md", render(PRIVACY, PRIVACY.sections)],
  ["terms.md", render(TERMS, TERMS.sections)],
  ["README.md", [
    NOTE,
    "# 公開する文書",
    "",
    "アプリの中に出しているものと同じ内容です。",
    "",
    "| ファイル | どこで要るか |",
    "| --- | --- |",
    "| [privacy.md](privacy.md) | **App Store Connect にURLの登録が必須。** 公開先が要ります |",
    "| [terms.md](terms.md) | ストアの説明文からリンクする |",
    "| [health.md](health.md) | 安全のための注意。アプリ内にも同じものを出しています |",
    "",
    "## 公開先について",
    "",
    "GitHub Pages を使うのがいちばん手軽です（このリポジトリの Settings → Pages）。",
    "独自ドメインを取るなら Phase 5 でストア掲載と合わせて用意してください。",
    "",
    "## ⚠️ 発売前に必ず",
    "",
    "- 文面は**素案**です。専門家の確認を受けてください",
    `- 連絡先が \`${CONTACT}\` のままです。**実在するアドレスに差し替えてください**`,
    "  （`src/legal.js` の `CONTACT` を直して `npm run legal`）",
    "",
  ].join("\n")],
];

for (const [name, body] of files) {
  fs.writeFileSync(path.join(OUT, name), body);
  console.log(`${OUT}/${name}`);
}
