/* 保存層の差し替えで、ブラウザ側の振る舞いが変わっていないことを確かめる。
   ネイティブ側（Preferences / Filesystem）は実機でしか動かないので、
   ここでは「ブラウザではこれまでどおり」であることだけを見る。 */
import { describe, it, expect, beforeEach } from "vitest";
import { readJSON, writeJSON, K_CORE, K_PHOTOS } from "./storage.js";
import { normalizePhotos } from "./logic/validate.js";
import { isNative } from "./platform.js";

const PNG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

describe("保存層（ブラウザ）", () => {
  beforeEach(() => window.localStorage.clear());

  it("ネイティブ判定が false になる（jsdom はブラウザ扱い）", () => {
    expect(isNative()).toBe(false);
  });

  it("書いた値をそのまま読み戻せる", async () => {
    await writeJSON(K_CORE, { name: "テスト", restSec: 45 });
    expect(await readJSON(K_CORE)).toEqual({ name: "テスト", restSec: 45 });
  });

  it("未作成のキーは null になる（例外にしない）", async () => {
    expect(await readJSON("hometrain:ないキー")).toBe(null);
  });

  it("壊れた JSON が入っていても null を返す", async () => {
    window.localStorage.setItem(K_CORE, "{壊れている");
    expect(await readJSON(K_CORE)).toBe(null);
  });

  it("写真は data: のまま保存され、読み戻せる", async () => {
    await writeJSON(K_PHOTOS, [{ date: "2026-08-01", data: PNG }]);
    const back = await readJSON(K_PHOTOS);
    expect(back).toEqual([{ date: "2026-08-01", data: PNG }]);
    /* 保存領域の中身も data: のまま（ブラウザではファイルへ逃がさない） */
    expect(window.localStorage.getItem(K_PHOTOS)).toContain("data:image/");
  });
});

describe("写真の検証", () => {
  it("ブラウザの形（data:）を通す", () => {
    expect(normalizePhotos([{ date: "2026-08-01", data: PNG }])).toEqual([
      { date: "2026-08-01", data: PNG },
    ]);
  });

  it("ネイティブの形（file つき）も通し、file を落とさない", () => {
    const native = [{ date: "2026-08-01", file: "2026-08-01.jpg", data: "capacitor://localhost/_capacitor_file_/x.jpg" }];
    expect(normalizePhotos(native)).toEqual(native);
  });

  it("date も data も無いものは捨てる", () => {
    expect(normalizePhotos([{ date: "2026-13-99", data: PNG }, { date: "2026-08-01" }, null, "x"])).toEqual([]);
  });

  it("同じ日付が2枚あると1枚にする", () => {
    const r = normalizePhotos([
      { date: "2026-08-01", data: PNG },
      { date: "2026-08-01", data: PNG },
    ]);
    expect(r).toHaveLength(1);
  });

  it("13枚を超えると、いちばん古い1枚は残したまま12枚に収まる", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      data: PNG,
    }));
    const r = normalizePhotos(many);
    expect(r).toHaveLength(12);
    expect(r[0].date).toBe("2026-01-01");
    expect(r[11].date).toBe("2026-01-20");
  });
});
