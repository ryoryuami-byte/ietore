/* ================= デザイントークン ================= */
/* v18.2 で見た目を作り直した。
   以前は「3px の硬い影＋2px の枠線」でシールのような質感にしていたが、
   いまどきのアプリらしい「白いカード＋やわらかい影」に寄せた。

   コントラストの決まりは変えていない。
   面（pink / lav / mint）の上に載る文字は ink。
   白文字を載せてよいのは pinkBtn 以上に濃い色だけ。

     ink   on white   11.5 : 1
     ink   on pink     5.38 : 1
     ink   on mint     6.50 : 1
     ink   on lav      4.94 : 1
     white on pinkBtn  4.62 : 1   ← ボタンの下限。これより薄い色に白文字を載せない
     white on pinkDeep 5.44 : 1
     white on gradEnd  6.50 : 1
   いずれも WCAG AA（4.5:1）以上。 */
const C = {
  bg: "#FDF1F6",         /* 画面の地。上のほうを少し明るくする */
  bgDeep: "#FAE3EE",     /* 地のグラデーションの下側 */
  surface: "#FFFFFF",
  ink: "#4A3242",        /* 11.5 : 1 on white */
  muted: "#7A5D72",      /* 4.9 : 1 on white */
  pink: "#FF8FB1",       /* 面。文字は ink */
  pinkBtn: "#D6336C",    /* ボタンの面。白文字 4.62 : 1 */
  pinkDeep: "#C22E62",   /* 文字用アクセント 5.44 : 1 on white */
  pinkSoft: "#FFE8F0",   /* チップやアイコンの下地 */
  lav: "#B79CF0",        /* 面。文字は ink */
  lavText: "#6E4FB8",    /* 文字用 6.05 : 1 on white */
  lavSoft: "#F0EAFD",
  mint: "#5FD7B4",       /* 面。文字は ink */
  mintText: "#0E7A5F",   /* 文字用 5.29 : 1 on white */
  mintSoft: "#E3F7F0",
  gold: "#FFD36E",
  line: "#F6E4EC",       /* 仕切り線。カードの枠には使わなくなった */
  lineDeep: "#E7BED0",   /* 無効状態の枠など、線として見える濃さ */
};

const DISPLAY = '"Hiragino Maru Gothic ProN", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const BODY = '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';

/* 背景のドット。以前より薄くして、カードの影の邪魔をしないようにする */
const DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='3' cy='3' r='1.4' fill='%23FCE0EC'/%3E%3C/svg%3E")`;

/* #RRGGBB → rgba(r,g,b,a) */
function alpha(hex, a) {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (!isFinite(n)) return `rgba(74,50,66,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* カードの影。ごく薄く、広く落とす。枠線の代わりに、これで面を持ち上げる */
const SHADOW = `0 1px 2px ${alpha("#4A3242", 0.04)}, 0 6px 16px ${alpha("#C22E62", 0.07)}`;

/* ボタンの影。押せそうに見せるため、そのボタンの色を薄く敷く。
   以前は 3px の硬い影を出す関数だったが、呼び出し側を全部直さなくて済むよう
   同じ名前・同じ引数のまま、中身だけ差し替えている */
const sticker = (c = C.line) => ({ boxShadow: `0 4px 12px ${alpha(c, 0.35)}` });

/* 白いカード。枠線は透明にして、影だけで面を分ける。
   呼び出し側は今までどおり className="border-2" のままでよい
   （太さぶんの余白は残るので、間隔が変わらない） */
const card = (extra) => ({
  background: C.surface,
  borderColor: "transparent",
  boxShadow: SHADOW,
  ...extra,
});

/* 見出し用の濃いピンクの面。白文字を載せる。
   薄い側（pinkBtn）でも 4.62:1 あるので、どこを取っても読める */
const HERO = `linear-gradient(135deg, ${C.pinkBtn} 0%, #B02455 100%)`;
/* やさしい面。ink を載せる */
const HERO_SOFT = `linear-gradient(135deg, #FFEDF3 0%, #FFDCE9 100%)`;
/* 画面の地 */
const PAGE_BG = `linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%)`;

/* 画面ぜんぶの下地。各画面が同じものを書いていたのでまとめた */
const page = () => ({
  backgroundImage: `${DOTS}, ${PAGE_BG}`,
  backgroundAttachment: "fixed",
  backgroundColor: C.bg,
  color: C.ink,
  fontFamily: BODY,
  minHeight: "100dvh",
});

export { alpha, BODY, C, card, DISPLAY, DOTS, HERO, HERO_SOFT, page, PAGE_BG, SHADOW, sticker };
