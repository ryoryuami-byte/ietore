/* 月ごとの写真の扱い。新しいデータは作らない。すでにある写真から
   正しく月を切り出せるかだけを見る。 */
import { describe, it, expect } from "vitest";
import { defaultPhotoOfMonth, monthLabel, monthOf, monthsBetween, monthsWithPhotos, photosInMonth } from "./photos.js";

const P = (date) => ({ date, data: `data:image/jpeg;base64,${date}` });
const PHOTOS = [P("2026-06-03"), P("2026-06-20"), P("2026-07-01"), P("2026-09-15")];

describe("monthOf", () => {
  it("日付から月だけを取り出す", () => {
    expect(monthOf("2026-08-13")).toBe("2026-08");
  });
});

describe("monthsWithPhotos", () => {
  it("写真がある月だけを、古い順・重複なしで返す", () => {
    expect(monthsWithPhotos(PHOTOS)).toEqual(["2026-06", "2026-07", "2026-09"]);
  });

  it("写真が無ければ空", () => {
    expect(monthsWithPhotos([])).toEqual([]);
    expect(monthsWithPhotos(undefined)).toEqual([]);
  });
});

describe("photosInMonth", () => {
  it("その月の写真だけを、古い順で返す", () => {
    expect(photosInMonth(PHOTOS, "2026-06").map((p) => p.date)).toEqual(["2026-06-03", "2026-06-20"]);
  });

  it("写真の無い月は空", () => {
    expect(photosInMonth(PHOTOS, "2026-08")).toEqual([]);
  });
});

describe("defaultPhotoOfMonth", () => {
  it("その月で最初に撮った1枚を選ぶ", () => {
    expect(defaultPhotoOfMonth(PHOTOS, "2026-06").date).toBe("2026-06-03");
  });

  it("1枚しかない月は、その1枚", () => {
    expect(defaultPhotoOfMonth(PHOTOS, "2026-07").date).toBe("2026-07-01");
  });

  it("写真の無い月は null", () => {
    expect(defaultPhotoOfMonth(PHOTOS, "2026-08")).toBe(null);
  });
});

describe("monthsBetween", () => {
  it("同じ月なら 0", () => {
    expect(monthsBetween("2026-06", "2026-06")).toBe(0);
  });

  it("年をまたいでも正しく数える", () => {
    expect(monthsBetween("2025-11", "2026-02")).toBe(3);
  });

  it("逆向きは負の数", () => {
    expect(monthsBetween("2026-06", "2026-01")).toBe(-5);
  });
});

describe("monthLabel", () => {
  it("年月の表示にする", () => {
    expect(monthLabel("2026-08")).toBe("2026年8月");
  });
});
