import { PALETTE, themeCSS } from "./tokens.js";

/* =========================================================================
   見え方（v18.5）。

   ここが持っているのは2つだけ。
     - いま明るいテーマか暗いテーマか
     - 文字をどれだけ大きくするか

   どちらも <html> の属性として置く。色は CSS 変数なので、
   属性を書き換えた瞬間に画面ぜんぶの色が入れ替わる。React は何もしない。

   **最初の一瞬について。**
   JS が動くまで、この CSS 変数は存在しない。暗い部屋で開いたときに
   真っ白がぱっと出るのがいちばん体に悪いので、index.html の先頭に
   「前回どちらだったか」を localStorage から読んで先に色を置く数行を入れてある。
   そのための控えを PAINT_HINT に書き出している。
   index.html の色とここの色がずれていないことは、tokens.test.js が見張る。
   ========================================================================= */

const PAINT_HINT = "ietore:theme";
const MQ = "(prefers-color-scheme: dark)";

/* 端末が暗いテーマかどうか。対応していない環境では明るいほうにする */
function systemDark() {
  try {
    return typeof matchMedia === "function" && matchMedia(MQ).matches;
  } catch (e) {
    return false;
  }
}

/* 設定の値（auto / light / dark）を、実際に使う名前にする */
const resolveTheme = (pref) => (pref === "light" || pref === "dark" ? pref : (systemDark() ? "dark" : "light"));

/* 文字の大きさ。Tailwind の text-xs などは rem なので、
   根っこの font-size を変えるだけで全部の文字がついてくる */
const FONT_SCALE = { normal: 1, large: 1.12, huge: 1.24 };
const scaleOf = (v) => FONT_SCALE[v] ?? 1;

/* 起動時に1回だけ。両テーマぶんの CSS 変数を置く */
function installTheme() {
  if (typeof document === "undefined") return;
  if (document.getElementById("theme-vars")) return;
  const el = document.createElement("style");
  el.id = "theme-vars";
  el.textContent = themeCSS();
  document.head.appendChild(el);
}

/* 設定が変わるたびに呼ぶ。いま使っているテーマの名前を返す */
function applyTheme(core) {
  if (typeof document === "undefined") return "light";
  const theme = resolveTheme(core?.theme);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.setProperty("--fs", String(scaleOf(core?.fontScale)));

  /* 端末の上の帯（時計やバッテリーのところ）の色。
     ここを合わせないと、暗いテーマのときに上だけ白い帯が残る */
  const bg = PALETTE[theme].bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", bg);
  const bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (bar) bar.setAttribute("content", theme === "dark" ? "black" : "default");

  /* 次に開いたときの一瞬のために、結果だけ控えておく。
     ここに入るのは "light" か "dark" の文字だけで、記録は入らない */
  try { localStorage.setItem(PAINT_HINT, theme); } catch (e) { /* 使えない環境では諦める */ }
  return theme;
}

/* 「端末に合わせる」を選んでいる人のために、端末側の切り替えを聞いておく。
   後片づけの関数を返す */
function watchSystemTheme(onChange) {
  try {
    const mq = matchMedia(MQ);
    const h = () => onChange();
    /* Safari 13 以前は addEventListener を持たない */
    if (mq.addEventListener) mq.addEventListener("change", h);
    else mq.addListener(h);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h);
      else mq.removeListener(h);
    };
  } catch (e) {
    return () => {};
  }
}

export { applyTheme, FONT_SCALE, installTheme, PAINT_HINT, resolveTheme, scaleOf, systemDark, watchSystemTheme };
