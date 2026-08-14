/* 重なり順（z-index）の決まりを、ソースから確かめる。

   下のタブバー（TabBar）は z-20 で、5つのタブすべてで常に画面に居る。
   画面いっぱいのシートやダイアログ（`fixed inset-0`）がそれ以下の
   z-index だと、CSS の規則（同じ z-index なら DOM で後にあるほうが勝つ）により
   タブバーがシートの上に描かれる。タブバーは AppInner の中でいちばん最後に
   置かれているので、この事故は静かに起きる。

   v18.6 で、これが実際に起きているのを見つけた。
   ワークアウト中の「つぎへ」ボタンが、iPhone 13 mini など多くの端末の
   高さで**タブバーの下に隠れて押せなくなっていた**。長く気づかれなかったのは、
   高さによって隠れたり隠れなかったりするため。人の目や偶然のタップでは
   見つけにくいので、ここで機械的に見張る。 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

function allJsx(dir) {
  const out = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${f.name}`;
    if (f.isDirectory()) out.push(...allJsx(p));
    else if (/\.jsx$/.test(f.name)) out.push(p);
  }
  return out;
}

/* タブバー自身の z-index。ここが変わったら、下の下限もそれに合わせて動く */
const TABBAR_Z = 20;

describe("画面いっぱいのシート・ダイアログの重なり順", () => {
  it(`fixed inset-0 の画面は、タブバー（z-${TABBAR_Z}）より上に描かれる`, () => {
    const bad = [];
    for (const path of allJsx(resolve(process.cwd(), "src"))) {
      const src = readFileSync(path, "utf8");
      for (const m of src.matchAll(/className="([^"]*\bfixed inset-0\b[^"]*)"/g)) {
        const cls = m[1];
        const z = /\bz-(\d+)\b/.exec(cls);
        if (z && Number(z[1]) <= TABBAR_Z) bad.push(`${path}: z-${z[1]}（"${cls}"）`);
      }
    }
    expect(bad, "タブバーの下に隠れる画面がある。z-30 以上にしてください").toEqual([]);
  });

  it("タブバー自身は z-20 のまま（この数字を動かしたら上のテストも合わせて見直す）", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/TabBar.jsx"), "utf8");
    expect(src).toContain(`z-${TABBAR_Z}`);
  });
});
