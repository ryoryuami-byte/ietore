/* 種目ごとの履歴。
   新しいデータは1つも足していない。すでにある記録から正しく読み出せるかを見る。 */
import { describe, it, expect } from "vitest";
import { bestOf, lastDoneOf, seriesOf, topGrowth } from "./history.js";
import { spec } from "./progress.js";
import { EX } from "../exercises.js";

/* 段階が上がるほど量が増えるので、それを使って「伸びた記録」を作る */
const day = (date, id, sets, stage) => [date, { ex: { [id]: sets }, done: true, lv: 1, stage }];
const LOG = Object.fromEntries([
  day("2026-06-01", "squat", 2, 0),
  day("2026-07-01", "squat", 3, 2),
  day("2026-08-01", "squat", 3, 4),
  day("2026-08-10", "plank", 2, 4),
]);

describe("前回の記録", () => {
  it("いちばん新しい日を返す", () => {
    expect(lastDoneOf(LOG, "squat").date).toBe("2026-08-01");
  });

  it("指定した日より前だけを見られる（今日を除きたいとき）", () => {
    expect(lastDoneOf(LOG, "squat", "2026-08-01").date).toBe("2026-07-01");
  });

  it("やったことのない種目は null", () => {
    expect(lastDoneOf(LOG, "burpee")).toBe(null);
  });

  it("記録が空でも落ちない", () => {
    expect(lastDoneOf({}, "squat")).toBe(null);
    expect(lastDoneOf(null, "squat")).toBe(null);
  });

  it("そのときの強さで量を計算し直す", () => {
    /* 段階4のときの量が返るはず */
    const r = lastDoneOf(LOG, "squat");
    expect(r.amount).toBe(spec(EX.squat, 1, 4).amount);
    expect(r.sets).toBe(3);
  });
});

describe("自己ベスト", () => {
  it("1セットあたりの量がいちばん多かった日を返す", () => {
    expect(bestOf(LOG, "squat").date).toBe("2026-08-01");
  });

  it("同じ量ならセット数が多いほうを採る", () => {
    const log = Object.fromEntries([
      day("2026-08-01", "hip", 2, 3),
      day("2026-08-02", "hip", 4, 3),
    ]);
    expect(bestOf(log, "hip").sets).toBe(4);
  });

  it("やったことのない種目は null", () => {
    expect(bestOf(LOG, "burpee")).toBe(null);
  });
});

describe("移り変わり", () => {
  it("古い順に並ぶ（グラフは左が過去）", () => {
    expect(seriesOf(LOG, "squat").map((r) => r.date))
      .toEqual(["2026-06-01", "2026-07-01", "2026-08-01"]);
  });

  it("量が増えていく", () => {
    const a = seriesOf(LOG, "squat").map((r) => r.amount);
    expect(a[2]).toBeGreaterThan(a[0]);
  });

  it("多すぎるときは後ろから切る（グラフが潰れないように）", () => {
    const log = {};
    /* 月をまたぐので Date で作る（2026-01-40 のような日付を作らない） */
    for (let i = 0; i < 40; i++) {
      const d = new Date(2026, 0, 1 + i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      log[k] = { ex: { squat: 2 }, done: true, lv: 1, stage: 0 };
    }
    const s = seriesOf(log, "squat", 10);
    expect(s).toHaveLength(10);
    expect(s[9].date).toBe("2026-02-09"); /* いちばん新しい日が末尾 */
  });

  it("1回しかやっていない種目は、伸びの一覧に出さない", () => {
    expect(topGrowth(LOG).some((r) => r.id === "plank")).toBe(false);
  });
});

describe("いちばん伸びた種目", () => {
  it("増えた種目だけを、伸びの大きい順に返す", () => {
    const rows = topGrowth(LOG);
    expect(rows[0].id).toBe("squat");
    expect(rows[0].to).toBeGreaterThan(rows[0].from);
  });

  it("記録が無ければ空", () => {
    expect(topGrowth({})).toEqual([]);
  });

  it("知らない種目IDが混ざっていても落ちない", () => {
    const log = { "2026-08-01": { ex: { ないやつ: 3 }, done: true, lv: 1, stage: 0 } };
    expect(() => topGrowth(log)).not.toThrow();
    expect(topGrowth(log)).toEqual([]);
  });
});
