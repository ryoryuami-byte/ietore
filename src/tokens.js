/* ================= デザイントークン ================= */
/* v18.5 で、色そのものを持つのをやめた。
   `C.ink` は "#4A3242" ではなく "var(--c-ink)" を返す。
   実際の色は下の PALETTE にあり、themeCSS() が CSS 変数にして流し込む。

   **なぜこうしたか。**
   ダークモードを入れるには、色を後から差し替えられないといけない。
   以前のように C が hex を直接持っていると、描画したあとに色を変える手が無く、
   画面ぜんぶを React の context で作り直すしかなかった。
   CSS 変数にしておけば、<html data-theme="dark"> を書き換えるだけで
   すべての色が入れ替わる。再描画も要らない。

   **色を足すときは PALETTE の light と dark の両方に足すこと。**
   片方だけだと tokens.test.js が落ちる。

   ---------------------------------------------------------------
   コントラストの決まり（明るい／暗いの両方で守る）

     面（bg / surface / pink / lav / mint / gold / *Soft / line）の上の文字は ink。
     ひかえめな文字は muted。
     色つきの文字は pinkDeep / lavText / mintText。
     白文字を載せてよいのは pinkBtn（4.62 : 1）と lavBtn（6.05 : 1）だけ。

   この組み合わせがぜんぶ WCAG AA（4.5:1）を満たすことは、
   `src/tokens.test.js` が両方のパレットについて自動で確かめる。
   **目で見て決めない。数字で決める。**

   pinkDeep は「暗い面に載る文字」ではなく「文字の色」。
   明るいテーマでは濃く、暗いテーマでは明るくなる。
   だから **pinkDeep を背景にして白文字を載せてはいけない**（暗いテーマで読めなくなる）。
   白文字が要る面は pinkBtn / lavBtn を使うこと。lavText / mintText も同じ。
   --------------------------------------------------------------- */

const PALETTE = {
  light: {
    bg: "#FDF1F6",         /* 画面の地。上のほう */
    bgDeep: "#FAE3EE",     /* 地のグラデーションの下側 */
    surface: "#FFFFFF",    /* カードの面 */
    surfaceOk: "#FBFFFD",  /* やり終えたカードの面。ほんのり緑 */
    disabled: "#EFEAF0",   /* 触れない入力欄の面 */
    ink: "#4A3242",
    muted: "#7A5D72",
    pink: "#FF8FB1",       /* 面。文字は ink */
    pinkBtn: "#D6336C",    /* ボタンの面。白文字 4.62 : 1。ここだけ両テーマで同じ */
    pinkDeep: "#BE2D60",   /* 文字とグラフの線 */
    pinkSoft: "#FFE8F0",
    pinkEdge: "#E96A97",   /* 選んでいる状態のへり */
    lav: "#B79CF0",
    lavBtn: "#6E4FB8",    /* ボタンの面。白文字 6.05 : 1。両テーマで同じ */
    lavText: "#6E4FB8",
    lavSoft: "#F0EAFD",
    lavEdge: "#8C6BD6",
    mint: "#5FD7B4",
    mintText: "#0E765C",
    mintSoft: "#E3F7F0",
    mintEdge: "#37B893",
    gold: "#FFD36E",
    line: "#F6E4EC",       /* 仕切り線・タイマーの下地 */
    lineDeep: "#E7BED0",   /* 線として見える濃さ */
  },
  dark: {
    /* 灰色ではなく、すみれ寄りの黒。明るいほうの空気を残す。
       面は「暗い地の上に少し明るい板」。数字は tokens.test.js が見張っている */
    bg: "#17111A",
    bgDeep: "#1F151D",
    surface: "#271C25",
    surfaceOk: "#1C2E28",
    disabled: "#3A2E38",
    ink: "#F4E7EF",
    muted: "#B9A3B4",
    /* 面の色は、明るいテーマの薄い色をそのまま暗くすると沈んで見えなくなる。
       中くらいの濃さにして、面としても「へり」としても使えるようにしてある */
    pink: "#A63C63",
    pinkBtn: "#D6336C",
    pinkDeep: "#FF9EBE",
    pinkSoft: "#3A222E",
    pinkEdge: "#FF7FA8",
    lav: "#6B55A6",
    lavBtn: "#6E4FB8",
    lavText: "#C3ADF6",
    lavSoft: "#2A2340",
    lavEdge: "#A98BEF",
    mint: "#1A6B52",
    mintText: "#6FE0BC",
    mintSoft: "#16302A",
    mintEdge: "#3FBF97",
    gold: "#7A5E24",
    line: "#443343",
    lineDeep: "#584353",
  },
};

const KEYS = Object.keys(PALETTE.light);

/* 使う側から見た色。中身は CSS 変数の名前 */
const C = Object.fromEntries(KEYS.map((k) => [k, `var(--c-${k})`]));

const DISPLAY = '"Hiragino Maru Gothic ProN", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const BODY = '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';

/* #RRGGBB → rgba(r,g,b,a)。テーマに関わらない色（写真の下地など）で使う */
function alpha(hex, a) {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (!isFinite(n)) return `rgba(74,50,66,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const rgb = (hex) => {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/* --------------------------------------------------------------------------
   テーマ1つぶんの CSS 変数を作る。

   色そのものだけでなく、色から計算するもの（影・グラデーション・背景の点）も
   ここで全部作ってしまう。そうしないと、描画のたびに JS 側で
   「いまどちらのテーマか」を知る必要が出てきて、画面の側がテーマを気にし始める。
   -------------------------------------------------------------------------- */
function themeVars(name) {
  const p = PALETTE[name];
  const dark = name === "dark";
  const v = KEYS.map((k) => `--c-${k}:${p[k]}`);

  /* ボタンの影。そのボタンの色を薄く敷いて、押せそうに見せる。
     暗いテーマでは、明るい面に落とす影ではなく「にじみ」に見えるので弱める */
  const glow = dark ? 0.3 : 0.35;
  for (const k of KEYS) v.push(`--st-${k}:0 4px 12px rgb(${rgb(p[k])} / ${glow})`);
  v.push(`--glow:${glow}`);

  /* カードの影。暗いテーマでは影が地に沈んで消えるので、
     代わりに髪の毛ほどの縁を1本引いて、面の境目を出す */
  v.push(dark
    ? `--sh-card:0 0 0 1px ${p.line}, 0 8px 20px rgb(0 0 0 / .45)`
    : `--sh-card:0 1px 2px rgb(${rgb(p.ink)} / .04), 0 6px 16px rgb(${rgb(p.pinkDeep)} / .07)`);
  v.push(dark
    ? `--sh-tab:0 -1px 0 ${p.line}, 0 -8px 24px rgb(0 0 0 / .5)`
    : `--sh-tab:0 -1px 2px rgb(${rgb(p.ink)} / .04), 0 -8px 20px rgb(${rgb(p.pinkDeep)} / .06)`);

  /* 上に重ねる帯（タイトル帯）。下の中身がうっすら透ける */
  v.push(`--veil:rgb(${rgb(p.surface)} / ${dark ? 0.88 : 0.82})`);
  /* シートやお祝いの後ろに敷く幕 */
  v.push(`--scrim:rgb(${dark ? "0 0 0" : rgb(p.ink)} / ${dark ? 0.66 : 0.5})`);
  v.push(`--scrim-deep:rgb(${dark ? "0 0 0" : rgb(p.ink)} / ${dark ? 0.82 : 0.75})`);

  /* 背景の点。地よりわずかに濃い（明るいテーマ）／薄い（暗いテーマ）だけにする */
  const dot = dark ? "%23241A2E" : "%23FCE0EC";
  v.push(`--dots:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='3' cy='3' r='1.4' fill='${dot}'/%3E%3C/svg%3E")`);

  /* 見出しの濃い面。白文字を載せる。両端とも pinkBtn 以上に濃い */
  v.push(`--g-hero:linear-gradient(135deg, ${p.pinkBtn} 0%, #B02455 100%)`);
  /* やさしい面。ink を載せる */
  v.push(dark
    ? "--g-hero-soft:linear-gradient(135deg, #34202C 0%, #422637 100%)"
    : "--g-hero-soft:linear-gradient(135deg, #FFEDF3 0%, #FFDCE9 100%)");
  v.push(`--g-page:linear-gradient(180deg, ${p.bg} 0%, ${p.bgDeep} 100%)`);

  return v.join(";");
}

/* 両テーマぶんの CSS。main.jsx が起動時に1回だけ流し込む */
const themeCSS = () =>
  `:root{${themeVars("light")}}`
  + `:root[data-theme="dark"]{${themeVars("dark")}}`;

const SHADOW = "var(--sh-card)";
const DOTS = "var(--dots)";
const HERO = "var(--g-hero)";
const HERO_SOFT = "var(--g-hero-soft)";
const PAGE_BG = "var(--g-page)";
const SCRIM = "var(--scrim)";
const SCRIM_DEEP = "var(--scrim-deep)";

/* ボタンの影。呼び出し側は今までどおり sticker(C.pinkBtn) と書けばよい。
   トークンを渡されたら、テーマごとに用意ずみの影をそのまま返す。
   トークン以外（その場かぎりの hex）が来たときだけ、ここで計算する */
const sticker = (c = C.line) => {
  const m = /^var\(--c-([A-Za-z]+)\)$/.exec(String(c));
  return { boxShadow: m ? `var(--st-${m[1]})` : `0 4px 12px rgb(${rgb(c)} / var(--glow))` };
};

/* カード。枠線は透明にして、面の分かれ目は影（暗いテーマでは縁）で見せる。
   呼び出し側は今までどおり className="border-2" のままでよい */
const card = (extra) => ({
  background: C.surface,
  borderColor: "transparent",
  boxShadow: SHADOW,
  ...extra,
});

/* 画面ぜんぶの下地 */
const page = () => ({
  backgroundImage: `${DOTS}, ${PAGE_BG}`,
  backgroundAttachment: "fixed",
  backgroundColor: C.bg,
  color: C.ink,
  fontFamily: BODY,
  minHeight: "100dvh",
});

export {
  alpha, BODY, C, card, DISPLAY, DOTS, HERO, HERO_SOFT, PALETTE,
  page, PAGE_BG, SCRIM, SCRIM_DEEP, SHADOW, sticker, themeCSS,
};
