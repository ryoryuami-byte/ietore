/* 色の決まりを、目ではなく数字で守る。

   v18.5 でダークモードを入れた。色が2組になったので、
   「明るいほうは読めるが暗いほうは読めない」が起きるようになった。
   人の目でそれを見つけるのは無理なので、ここで全部の組み合わせを計算する。

   新しい色を足すと、この表にも足すことになる。それでよい。
   **足す手間より、読めない画面を出すほうがずっと高くつく。** */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { C, PALETTE, sticker, themeCSS } from "./tokens.js";

/* WCAG の相対輝度と比 */
function luminance(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* 文字を載せてよい面 */
const FACES = [
  "bg", "bgDeep", "surface", "surfaceOk", "disabled",
  "pink", "lav", "mint", "gold", "pinkSoft", "lavSoft", "mintSoft", "line",
];
/* 文字の色と、その文字が載る面 */
const TEXT_ON = {
  ink: FACES,
  muted: ["bg", "bgDeep", "surface", "surfaceOk", "disabled", "pinkSoft", "lavSoft", "mintSoft", "line"],
  pinkDeep: ["bg", "bgDeep", "surface", "pinkSoft"],
  lavText: ["bg", "bgDeep", "surface", "lavSoft"],
  mintText: ["bg", "bgDeep", "surface", "mintSoft"],
};
/* 白文字を載せてよい面。ここに無い色を背景にして白文字を書かないこと */
const WHITE_ON = ["pinkBtn", "lavBtn"];

const THEMES = ["light", "dark"];

describe("色のコントラスト（WCAG AA 4.5:1）", () => {
  for (const theme of THEMES) {
    const P = PALETTE[theme];

    for (const [text, faces] of Object.entries(TEXT_ON)) {
      it(`${theme}: ${text} が、載せてよい面すべてで読める`, () => {
        for (const face of faces) {
          const r = ratio(P[text], P[face]);
          expect(r, `${text} on ${face} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }

    it(`${theme}: 白文字を載せる面が、白文字で読める`, () => {
      for (const face of WHITE_ON) {
        const r = ratio("#FFFFFF", P[face]);
        expect(r, `white on ${face} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${theme}: へりの色が、その面の上で境目として見える`, () => {
      /* 文字ではないので 4.5 は要らない。1.2 あれば「線がある」と分かる */
      for (const [edge, face] of [["pinkEdge", "pink"], ["lavEdge", "lav"], ["mintEdge", "mint"],
        ["lineDeep", "surface"], ["line", "surface"]]) {
        const r = ratio(P[edge], P[face]);
        expect(r, `${edge} on ${face} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(1.2);
      }
    });
  }
});

describe("パレット", () => {
  it("明るい／暗いで、同じ名前がそろっている", () => {
    expect(Object.keys(PALETTE.dark).sort()).toEqual(Object.keys(PALETTE.light).sort());
  });

  it("すべて #RRGGBB の形をしている", () => {
    for (const theme of THEMES) {
      for (const [k, v] of Object.entries(PALETTE[theme])) {
        expect(v, `${theme}.${k}`).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("ボタンの面は、テーマが変わっても同じ色（白文字の下限を守るため）", () => {
    for (const k of WHITE_ON) expect(PALETTE.dark[k]).toBe(PALETTE.light[k]);
  });

  it("暗いほうが、実際に暗い", () => {
    for (const k of ["bg", "bgDeep", "surface"]) {
      expect(luminance(PALETTE.dark[k]), k).toBeLessThan(luminance(PALETTE.light[k]));
    }
    expect(luminance(PALETTE.dark.ink)).toBeGreaterThan(luminance(PALETTE.light.ink));
  });
});

describe("CSS 変数のつくり", () => {
  it("C は色そのものではなく、変数の名前を返す", () => {
    expect(C.ink).toBe("var(--c-ink)");
  });

  it("themeCSS に、両方のテーマの全部の色が入っている", () => {
    const css = themeCSS();
    expect(css).toContain(':root[data-theme="dark"]');
    for (const k of Object.keys(PALETTE.light)) {
      expect(css, k).toContain(`--c-${k}:${PALETTE.light[k]}`);
      expect(css, k).toContain(`--c-${k}:${PALETTE.dark[k]}`);
    }
  });

  it("sticker は、トークンなら用意ずみの影を返す", () => {
    /* ここが素の rgba() を返すと、暗いテーマで影だけ明るいテーマのままになる */
    expect(sticker(C.pinkBtn).boxShadow).toBe("var(--st-pinkBtn)");
  });

  it("sticker は、その場かぎりの色でも落ちない", () => {
    expect(sticker("#E96A97").boxShadow).toContain("var(--glow)");
  });
});

describe("最初の一瞬の色", () => {
  /* JS が動く前に index.html が置く色。ここがずれていると、
     暗いテーマの人が開くたびに一瞬だけ明るい地が見える */
  const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

  it("index.html が置く地の色が、パレットと一致している", () => {
    expect(html).toContain(PALETTE.dark.bg);
    expect(html).toContain(PALETTE.light.bg);
  });

  it("index.html は、控えの色を localStorage から読む", () => {
    expect(html).toContain("ietore:theme");
  });
});

describe("SVG の色", () => {
  /* SVG の presentation attribute（<circle stroke="…">）は var() を解決しない。
     ここに var() を書くと、その線だけ色が消える。style か currentColor で書くこと。
     v18.5 で実際に踏んだので、二度と通らないようにする */
  it("stroke / fill にトークンを直接書いていない", () => {
    const bad = [];
    const walk = (dir) => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        const p = `${dir}/${f.name}`;
        if (f.isDirectory()) walk(p);
        else if (/\.jsx$/.test(f.name)) {
          const src = readFileSync(p, "utf8");
          for (const m of src.matchAll(/\s(?:stroke|fill)=\{([^}]*)\}/g)) {
            if (/\bC\.[a-zA-Z]/.test(m[1])) bad.push(`${p}: ${m[0].trim()}`);
          }
        }
      }
    };
    walk(resolve(process.cwd(), "src"));
    expect(bad).toEqual([]);
  });
});
