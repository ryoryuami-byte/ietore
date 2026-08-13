/* ================= デザイントークン ================= */
/* 淡い面はそのまま。面の上に載る文字は ink に統一してコントラストを確保する。
   （ink on pink 5.38 / on mint 6.50 / on lav 4.94 : いずれもAA合格） */
const C = {
  bg: "#FFF3F7",
  surface: "#FFFFFF",
  ink: "#4A3242",        /* 11.5 : 1 on white */
  muted: "#75566E",      /* 5.86 : 1 on bg */
  pink: "#FF8FB1",       /* 面。文字は ink */
  pinkDeep: "#C22E62",   /* 文字用アクセント 5.44 : 1 on white */
  lav: "#B79CF0",        /* 面。文字は ink */
  lavText: "#6E4FB8",    /* 文字用 6.05 : 1 on white */
  mint: "#5FD7B4",       /* 面。文字は ink */
  mintText: "#0E7A5F",   /* 文字用 5.29 : 1 on white */
  gold: "#FFD36E",
  line: "#FFDCE8",
  lineDeep: "#F0AEC6",   /* 無効状態の枠など、線として見える濃さ */
};
const DISPLAY = '"Hiragino Maru Gothic ProN", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const BODY = '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='3' cy='3' r='1.6' fill='%23FFE0EC'/%3E%3C/svg%3E")`;
const sticker = (c) => ({ boxShadow: `0 3px 0 ${c}` });
const card = (extra) => ({ background: C.surface, borderColor: C.line, ...sticker(C.line), ...extra });

export { BODY, C, DISPLAY, DOTS, card, sticker };
