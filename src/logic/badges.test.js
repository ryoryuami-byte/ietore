/* バッジの階段。段の判定・新しく上がった分の検出・画面向けの整形を見る。 */
import { describe, it, expect } from "vitest";
import { levelsOf, metricsOf, newlyReached, seriesDisplay, SERIES } from "./badges.js";
import { AREA_Q } from "../questions.js";

const day = (date, ex, extra) => [date, { ex, done: true, ...extra }];

describe("metricsOf", () => {
  it("やりきった日だけを数える（done が無い日は数えない）", () => {
    const log = Object.fromEntries([
      ["2026-08-01", { ex: { squat: 1 }, done: true }],
      ["2026-08-02", { ex: { squat: 1 }, done: false }],
    ]);
    expect(metricsOf({ log }).doneCount).toBe(1);
  });

  it("空でないメモだけを数える。空白だけのメモは数えない", () => {
    const log = Object.fromEntries([
      day("2026-08-01", {}, { note: "調子よかった" }),
      day("2026-08-02", {}, { note: "" }),
      day("2026-08-03", {}, { note: "   " }),
    ]);
    expect(metricsOf({ log }).notes).toBe(1);
  });

  it("鍛えた部位の種類を数える（部位ごとの重複は1つに数える）", () => {
    const log = Object.fromEntries([
      day("2026-08-01", { squat: 3 }), // area: thighF, hip, thighB, inner（exercises.js 側の定義に依存しない集計）
    ]);
    const kinds = metricsOf({ log }).areaKinds;
    expect(kinds).toBeGreaterThan(0);
  });

  it("streak・写真・体重は、渡された値をそのまま数字にする", () => {
    const m = metricsOf({ log: {}, streak: 12, photos: [{}, {}], weights: [{}, {}, {}] });
    expect(m).toMatchObject({ streak: 12, photoCount: 2, weightCount: 3, doneCount: 0, notes: 0 });
  });

  it("負の値・変な値でも落ちない", () => {
    expect(metricsOf({ log: null, streak: -5, photos: null, weights: undefined }))
      .toMatchObject({ streak: 0, photoCount: 0, weightCount: 0 });
  });
});

describe("levelsOf", () => {
  it("ちょうど必要な値のとき、その段に達する", () => {
    const streakSeries = SERIES.find((s) => s.id === "streak");
    const need = streakSeries.tiers[0].need;
    expect(levelsOf({ streak: need, doneCount: 0, notes: 0, areaKinds: 0, photoCount: 0, weightCount: 0 }).streak).toBe(1);
    expect(levelsOf({ streak: need - 1, doneCount: 0, notes: 0, areaKinds: 0, photoCount: 0, weightCount: 0 }).streak).toBe(0);
  });

  it("すべての段を超えると、シリーズの長さと同じ段になる", () => {
    const huge = { streak: 99999, doneCount: 99999, notes: 99999, areaKinds: 99999, photoCount: 99999, weightCount: 99999 };
    const levels = levelsOf(huge);
    for (const s of SERIES) expect(levels[s.id]).toBe(s.tiers.length);
  });

  it("全部位制覇は AREA_Q の実際の数から決まる", () => {
    const areas = SERIES.find((s) => s.id === "areas");
    expect(areas.tiers.at(-1).need).toBe(AREA_Q.length);
  });
});

describe("newlyReached", () => {
  it("上がった段だけを返す", () => {
    const levels = { streak: 2, count: 0, notes: 0, areas: 0, photos: 0, weight: 0 };
    const seen = { streak: 1, count: 0, notes: 0, areas: 0, photos: 0, weight: 0 };
    const found = newlyReached(levels, seen);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ seriesId: "streak", level: 2, name: "1か月つづいた" });
  });

  it("しばらく開かない間に2段以上上がっていたら、その全部を返す", () => {
    const levels = { streak: 3, count: 0, notes: 0, areas: 0, photos: 0, weight: 0 };
    const seen = { streak: 0, count: 0, notes: 0, areas: 0, photos: 0, weight: 0 };
    const found = newlyReached(levels, seen).filter((b) => b.seriesId === "streak");
    expect(found.map((b) => b.level)).toEqual([1, 2, 3]);
    expect(found.map((b) => b.name)).toEqual(["1週間つづいた", "1か月つづいた", "3か月つづいた"]);
  });

  it("変わっていなければ何も返さない", () => {
    const levels = { streak: 2, count: 3, notes: 1, areas: 0, photos: 0, weight: 0 };
    expect(newlyReached(levels, levels)).toEqual([]);
  });

  it("seen が空（初回）でも、levels が0なら何も返さない", () => {
    const zero = { streak: 0, count: 0, notes: 0, areas: 0, photos: 0, weight: 0 };
    expect(newlyReached(zero, {})).toEqual([]);
  });
});

describe("seriesDisplay", () => {
  it("1段も無いシリーズは、最初の段を目標として鍵つきで見せる", () => {
    const metrics = { streak: 2, doneCount: 0, notes: 0, areaKinds: 0, photoCount: 0, weightCount: 0 };
    const levels = levelsOf(metrics);
    const streak = seriesDisplay(levels, metrics).find((s) => s.id === "streak");
    expect(streak.got).toBe(false);
    expect(streak.level).toBe(0);
    expect(streak.name).toBe("1週間つづいた");
    expect(streak.next).toMatchObject({ name: "1週間つづいた", unit: "日", remain: 5 });
  });

  it("段の途中なら、いまの段といっしょに次の目標も出す", () => {
    const metrics = { streak: 10, doneCount: 0, notes: 0, areaKinds: 0, photoCount: 0, weightCount: 0 };
    const levels = levelsOf(metrics);
    const streak = seriesDisplay(levels, metrics).find((s) => s.id === "streak");
    expect(streak.got).toBe(true);
    expect(streak.level).toBe(1);
    expect(streak.name).toBe("1週間つづいた");
    expect(streak.next).toMatchObject({ name: "1か月つづいた", unit: "日", remain: 20 });
  });

  it("最後の段まで来ていたら、次の目標は無い", () => {
    const metrics = { streak: 400, doneCount: 0, notes: 0, areaKinds: 0, photoCount: 0, weightCount: 0 };
    const levels = levelsOf(metrics);
    const streak = seriesDisplay(levels, metrics).find((s) => s.id === "streak");
    expect(streak.level).toBe(streak.maxLevel);
    expect(streak.next).toBeFalsy();
  });
});
