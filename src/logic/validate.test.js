/* =========================================================================
   読み込んだ値の検証。

   引き継ぎの文字列は利用者が手で貼り付けるものなので、
   何が入ってくるか分からない。ここを抜けた値がそのまま state に入り、
   画面が落ちるのが v11 以前の壊れ方だった。
   ========================================================================= */
import { describe, it, expect } from "vitest";
import { normalizeCore, normalizeLog, normalizePhotos } from "./validate.js";
import { planIsValid } from "./plan.js";
import { LEGAL_VERSION } from "../legal.js";
import { EMPTY_PROFILE } from "../questions.js";

const PROFILE = {
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "4", minutes: "20", activity: "little", noise: "quiet",
  level: "easy", timeOfDay: "evening", avoid: ["none"],
};

describe("normalizeCore", () => {
  it("null や 文字列 を渡しても、既定値が返る", () => {
    for (const bad of [null, undefined, "x", 42, []]) {
      const c = normalizeCore(bad);
      expect(c.name).toBe("");
      expect(c.profile).toBe(null);
      expect(c.notifyTime).toBe("20:00");
    }
  });

  it("プロフィールがあれば、プランを作って返す", () => {
    const c = normalizeCore({ profile: PROFILE });
    expect(planIsValid(c.plan)).toBe(true);
  });

  it("プロフィールが無ければ、プランは持たせない", () => {
    expect(normalizeCore({ plan: { 0: { focus: "lower", ids: ["squat"] } } }).plan).toBe(null);
  });

  it("v17 より前の形のプランは、作り直される", () => {
    /* 有酸素が2つ入っていない古いプランは planIsValid が弾く */
    const old = {};
    for (let d = 0; d < 7; d++) old[d] = { focus: "full", ids: ["squat", "plank"] };
    const c = normalizeCore({ profile: PROFILE, plan: old });
    expect(planIsValid(c.plan)).toBe(true);
    expect(c.plan[0].ids).not.toEqual(["squat", "plank"]);
  });

  it("名前は20文字までに切る", () => {
    expect(normalizeCore({ name: "あ".repeat(50) }).name).toHaveLength(20);
  });

  it("体重の記録は、日付順にそろえて壊れた行を落とす", () => {
    const c = normalizeCore({
      weights: [
        { date: "2026-03-01", kg: 55 },
        { date: "2026-13-99", kg: 54 }, /* 実在しない日付 */
        { date: "2026-01-01", kg: 56 },
        { date: "2026-02-01", kg: "x" }, /* 数値でない */
        null,
      ],
    });
    expect(c.weights.map((w) => w.date)).toEqual(["2026-01-01", "2026-03-01"]);
  });

  it("お知らせの時刻は、形が違えば既定に戻す", () => {
    expect(normalizeCore({ notifyTime: "25時" }).notifyTime).toBe("20:00");
    expect(normalizeCore({ notifyTime: "07:30" }).notifyTime).toBe("07:30");
  });

  it("休憩の秒数は、選べる値のどれかに収める", () => {
    expect(normalizeCore({ restSec: 999 }).restSec).toBe(30);
    expect(normalizeCore({ restSec: 45 }).restSec).toBe(45);
    expect(normalizeCore({ restSec: "60" }).restSec).toBe(60);
  });

  /* ---- v18 で足した項目 ---- */
  it("同意の記録は、バージョンが読めるときだけ残す", () => {
    expect(normalizeCore({ consent: { v: LEGAL_VERSION, at: "2026-08-13" } }).consent.v).toBe(LEGAL_VERSION);
    for (const bad of [null, {}, { v: 0 }, { v: "x" }, "yes", true]) {
      expect(normalizeCore({ consent: bad }).consent, JSON.stringify(bad)).toBe(null);
    }
  });

  it("同意がまだなら null（＝同意画面が出る）", () => {
    expect(normalizeCore({}).consent).toBe(null);
  });

  it("健康状態は、文字列だけに絞る", () => {
    const c = normalizeCore({ health: ["pregnant", 42, null, "x".repeat(50), "chronic"] });
    expect(c.health).toEqual(["pregnant", "chronic"]);
  });

  it("お知らせの入切は、はっきり false のときだけ切る", () => {
    expect(normalizeCore({}).notifyOn).toBe(true);
    expect(normalizeCore({ notifyOn: false }).notifyOn).toBe(false);
    expect(normalizeCore({ notifyOn: "no" }).notifyOn).toBe(true);
  });

  it("v17.2 の引き継ぎデータを読んでも落ちない（新しい項目は既定値になる）", () => {
    const old = { name: "テスト", profile: PROFILE, weights: [], cheers: [], notifyTime: "07:00" };
    const c = normalizeCore(old);
    expect(c.name).toBe("テスト");
    expect(c.consent).toBe(null);   /* 更新後に1回だけ同意画面が出る */
    expect(c.health).toEqual([]);
    expect(c.notifyOn).toBe(true);
    expect(planIsValid(c.plan)).toBe(true);
  });
});

describe("normalizeLog", () => {
  it("実在しない日付のキーは落とす", () => {
    /* v17.1 で直した。2026-13-99 が入ると日数の計算が NaN になっていた */
    const log = normalizeLog({
      "2026-01-15": { ex: { squat: 2 }, done: true },
      "2026-13-99": { ex: {}, done: true },
      "きのう": { ex: {} },
    });
    expect(Object.keys(log)).toEqual(["2026-01-15"]);
  });

  it("配列や文字列を渡しても、空を返す", () => {
    for (const bad of [null, "x", 42, []]) expect(normalizeLog(bad)).toEqual({});
  });

  it("セット数が数でない記録は落とす", () => {
    const log = normalizeLog({ "2026-01-15": { ex: { squat: "たくさん", plank: 2 } } });
    expect(log["2026-01-15"].ex.squat).toBeUndefined();
    expect(log["2026-01-15"].ex.plank).toBe(2);
  });

  it("知らない種目IDは落とす", () => {
    const log = normalizeLog({ "2026-01-15": { ex: { squat: 2, ないやつ: 3 } } });
    expect(Object.keys(log["2026-01-15"].ex)).toEqual(["squat"]);
  });
});

describe("normalizePhotos", () => {
  const PNG = "data:image/jpeg;base64,AAAA";

  it("12枚を超えたら、いちばん古い1枚は残す", () => {
    /* v14 で直した。新しい12枚を残すと「見くらべのまえ」が真っ先に消えていた */
    const many = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`, data: PNG,
    }));
    const r = normalizePhotos(many);
    expect(r).toHaveLength(12);
    expect(r[0].date).toBe("2026-01-01");
  });

  it("同じ日付が2枚あると1枚にする", () => {
    /* v17.2 で直した。キーが重なって表示が崩れていた */
    const r = normalizePhotos([
      { date: "2026-01-01", data: PNG },
      { date: "2026-01-01", data: PNG },
    ]);
    expect(r).toHaveLength(1);
  });

  it("画像でない文字列は落とす", () => {
    expect(normalizePhotos([{ date: "2026-01-01", data: "こんにちは" }])).toEqual([]);
  });

  it("日付順にそろえる", () => {
    const r = normalizePhotos([
      { date: "2026-03-01", data: PNG },
      { date: "2026-01-01", data: PNG },
      { date: "2026-02-01", data: PNG },
    ]);
    expect(r.map((p) => p.date)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });
});
