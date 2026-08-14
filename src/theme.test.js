/* 見え方の切り替え。
   ここが黙って壊れると「暗くにしたのに次に開くと明るい」になる。 */
import { beforeEach, describe, it, expect, vi } from "vitest";
import { applyTheme, FONT_SCALE, installTheme, resolveTheme, scaleOf } from "./theme.js";
import { PALETTE } from "./tokens.js";

/* 端末が暗いテーマかどうかを、こちらで決められるようにする */
function setSystemDark(dark) {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: dark && q.includes("dark"),
    media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(),
  }));
}

beforeEach(() => {
  setSystemDark(false);
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("style");
  localStorage.clear();
});

describe("どちらのテーマを使うか", () => {
  it("はっきり選んでいれば、そのとおりにする", () => {
    setSystemDark(true);
    expect(resolveTheme("light")).toBe("light");
    setSystemDark(false);
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("「端末に合わせる」なら、端末に従う", () => {
    setSystemDark(true);
    expect(resolveTheme("auto")).toBe("dark");
    setSystemDark(false);
    expect(resolveTheme("auto")).toBe("light");
  });

  it("知らない値や未設定は、端末に合わせる扱いにする", () => {
    setSystemDark(true);
    for (const v of [undefined, null, "", "ばく暗い"]) expect(resolveTheme(v), String(v)).toBe("dark");
  });

  it("matchMedia が無い環境でも落ちず、明るいほうにする", () => {
    delete window.matchMedia;
    expect(resolveTheme("auto")).toBe("light");
  });
});

describe("文字の大きさ", () => {
  it("選んだぶんだけ大きくなる", () => {
    expect(scaleOf("normal")).toBe(1);
    expect(scaleOf("large")).toBeGreaterThan(1);
    expect(scaleOf("huge")).toBeGreaterThan(scaleOf("large"));
  });

  it("知らない値は、ふつうに戻す", () => {
    expect(scaleOf("巨大")).toBe(1);
    expect(scaleOf(undefined)).toBe(1);
  });

  it("大きくしすぎない（画面が崩れるため）", () => {
    for (const v of Object.values(FONT_SCALE)) expect(v).toBeLessThanOrEqual(1.3);
  });
});

describe("applyTheme", () => {
  it("<html> に印をつけ、文字の倍率を入れる", () => {
    applyTheme({ theme: "dark", fontScale: "large" });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--fs")).toBe("1.12");
  });

  it("端末の上の帯の色を、テーマに合わせる", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);

    applyTheme({ theme: "dark" });
    expect(meta.getAttribute("content")).toBe(PALETTE.dark.bg);
    applyTheme({ theme: "light" });
    expect(meta.getAttribute("content")).toBe(PALETTE.light.bg);
    meta.remove();
  });

  it("次に開いたときのために、結果だけを控える", () => {
    /* ここに入ってよいのは light か dark の2語だけ。記録は入れない */
    applyTheme({ theme: "dark" });
    expect(localStorage.getItem("ietore:theme")).toBe("dark");
    applyTheme({ theme: "auto" });
    expect(localStorage.getItem("ietore:theme")).toBe("light");
  });

  it("設定がまだ無くても落ちない", () => {
    expect(() => applyTheme(undefined)).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("installTheme", () => {
  it("色の定義を1回だけ置く", () => {
    installTheme();
    installTheme();
    expect(document.querySelectorAll("#theme-vars")).toHaveLength(1);
    expect(document.getElementById("theme-vars").textContent).toContain("--c-ink");
  });
});
