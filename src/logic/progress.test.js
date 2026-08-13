/* =========================================================================
   レベルと段階、1種目あたりの回数・秒数のテスト。

   v14 と v17.2 の不具合を回帰テストにしてある。
   ========================================================================= */
import { describe, it, expect } from "vitest";
import { EX } from "../exercises.js";
import { bodyGoal, floorKgFor } from "./bodyGoal.js";
import { LEVELS, SESSIONS_PER_STAGE, STAGE_MAX, lvMeta, spec, specText, stageOf, timerSec } from "./progress.js";

/* 日付キーを作る。月をまたいでもキーがぶつからないようにする
   （2026-01-32 ではなく 2026-02-01 になる） */
const keyAt = (i) => {
  const d = new Date(2026, 0, 1 + i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* 「done の記録が n 日ぶん」のログを作る */
const doneLog = (n) => {
  const log = {};
  for (let i = 0; i < n; i++) log[keyAt(i)] = { ex: {}, done: true };
  return log;
};

/* 体感つきのログ */
const feelLog = (feelings) => {
  const log = {};
  feelings.forEach((f, i) => { log[keyAt(i)] = { ex: {}, done: true, feeling: f }; });
  return log;
};

describe("stageOf — 段階の上げ下げ", () => {
  it("記録が無いときは 0 段階", () => {
    expect(stageOf({}).stage).toBe(0);
    expect(stageOf(null).stage).toBe(0);
    expect(stageOf(undefined).stage).toBe(0);
  });

  it(`${SESSIONS_PER_STAGE} 回やりきるごとに1段階あがる`, () => {
    expect(stageOf(doneLog(SESSIONS_PER_STAGE - 1)).stage).toBe(0);
    expect(stageOf(doneLog(SESSIONS_PER_STAGE)).stage).toBe(1);
    expect(stageOf(doneLog(SESSIONS_PER_STAGE * 2)).stage).toBe(2);
  });

  it("やりきっていない日は数えない", () => {
    const log = { "2026-01-01": { ex: { squat: 1 } }, "2026-01-02": { ex: {}, skip: "疲れている" } };
    expect(stageOf(log).sessions).toBe(0);
  });

  it("段階は上限を超えない", () => {
    expect(stageOf(doneLog(SESSIONS_PER_STAGE * 20)).stage).toBe(STAGE_MAX);
  });

  /* ---- v14 の不具合 ---- */
  it("【v14の回帰】「きつかった」が3回たまると、段階が1つ戻る", () => {
    /* 体感を計算に入れていなかったため、実際は上がっていないのに
       「レベルが上がりました」と出ることがあった */
    const base = feelLog(Array(SESSIONS_PER_STAGE * 2).fill("ok"));
    expect(stageOf(base).stage).toBe(2);

    const hard = feelLog([...Array(SESSIONS_PER_STAGE * 2 - 3).fill("ok"), "hard", "hard", "hard"]);
    expect(stageOf(hard).stage).toBe(1);
    expect(stageOf(hard).adjust).toBe(-1);
  });

  it("「楽だった」が3回たまると、段階が1つ進む", () => {
    const easy = feelLog([...Array(SESSIONS_PER_STAGE - 3).fill("ok"), "easy", "easy", "easy"]);
    expect(stageOf(easy).adjust).toBe(1);
    expect(stageOf(easy).stage).toBe(2);
  });

  it("体感は直近12回ぶんしか見ない（昔の分が効き続けない）", () => {
    /* 古い「きつかった」3回のあと、新しい「ちょうどよかった」を12回入れる */
    const old3 = ["hard", "hard", "hard"];
    const recent12 = Array(12).fill("ok");
    expect(stageOf(feelLog([...old3, ...recent12])).adjust).toBe(0);
    /* 直近12回に入っていれば効く */
    expect(stageOf(feelLog([...Array(9).fill("ok"), ...old3])).adjust).toBe(-1);
  });

  it("段階が 0 より下がることはない", () => {
    expect(stageOf(feelLog(["hard", "hard", "hard"])).stage).toBe(0);
    expect(stageOf(feelLog(Array(12).fill("hard"))).stage).toBe(0);
  });

  it("壊れた記録が混ざっていても落ちない", () => {
    const log = { "2026-01-01": null, "2026-01-02": "x", "2026-01-03": { done: true } };
    expect(() => stageOf(log)).not.toThrow();
    expect(stageOf(log).sessions).toBe(1);
  });
});

describe("spec — 1種目あたりの回数・秒数", () => {
  const ids = Object.keys(EX);

  it("どの種目・レベル・段階でも、回数もセット数も 1 以上", () => {
    for (const id of ids) {
      for (let lv = 0; lv < LEVELS.length; lv++) {
        for (let stage = 0; stage <= STAGE_MAX; stage++) {
          for (const half of [false, true]) {
            const sp = spec(EX[id], lv, stage, half);
            expect(sp.amount, `${id}/lv${lv}/st${stage}`).toBeGreaterThanOrEqual(1);
            expect(sp.sets, `${id}/lv${lv}/st${stage}`).toBeGreaterThanOrEqual(1);
            expect(Number.isFinite(sp.amount), `${id}`).toBe(true);
          }
        }
      }
    }
  });

  it("上限（cap）を超えない", () => {
    for (const id of ids) {
      const e = EX[id];
      if (e.phase === "cardio") continue; /* 有酸素は固定 */
      const cap = e.cap ?? Math.round(e.amount.hard * 1.6);
      for (let lv = 0; lv < LEVELS.length; lv++) {
        for (let stage = 0; stage <= STAGE_MAX; stage++) {
          expect(spec(e, lv, stage).amount, `${id}/lv${lv}/st${stage}`).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it("セット数の上限（setsCap）を超えない", () => {
    for (const id of ids) {
      const e = EX[id];
      if (e.phase === "cardio") continue;
      const cap = e.setsCap ?? 4;
      for (let lv = 0; lv < LEVELS.length; lv++) {
        for (let stage = 0; stage <= STAGE_MAX; stage++) {
          expect(spec(e, lv, stage).sets, `${id}`).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it("ウォームアップは、どこまで進んでも1セットのまま", () => {
    for (const id of ids.filter((x) => EX[x].phase === "warmup")) {
      expect(spec(EX[id], 3, STAGE_MAX).sets, id).toBe(1);
    }
  });

  it("有酸素はレベルや段階で長さが変わらない（20分と決めたら20分）", () => {
    /* v17 で決めた方針 */
    for (const id of ids.filter((x) => EX[x].phase === "cardio")) {
      const a = spec(EX[id], 0, 0);
      const b = spec(EX[id], 3, STAGE_MAX);
      expect(b, id).toEqual(a);
    }
  });

  it("段階が進むと、量は減らない", () => {
    for (const id of ids) {
      const e = EX[id];
      for (let lv = 0; lv < LEVELS.length; lv++) {
        for (let stage = 1; stage <= STAGE_MAX; stage++) {
          const prev = spec(e, lv, stage - 1);
          const now = spec(e, lv, stage);
          expect(now.amount, `${id}/lv${lv}/st${stage}`).toBeGreaterThanOrEqual(prev.amount);
        }
      }
    }
  });

  it("短縮（half）は、必ず通常より軽い", () => {
    /* 有酸素は「20分と決めたら20分」なので、ここでは見ない。
       セット数が1の有酸素種目は half でも半分にならないが、
       短縮メニュー（shortIds）は ①②④ しか残さず、
       ととのえる日に短縮が出ることも無い（AppInner が focus !== "rest" で止める）ので、
       この組み合わせは画面に出てこない */
    for (const id of ids.filter((x) => EX[x].phase !== "cardio")) {
      const full = spec(EX[id], 1, 2, false);
      const half = spec(EX[id], 1, 2, true);
      const load = (s) => s.amount * s.sets;
      expect(load(half), id).toBeLessThan(load(full));
    }
  });

  it("秒数の種目は5秒きざみになる", () => {
    for (const id of ids.filter((x) => EX[x].type === "time" && EX[x].phase !== "cardio")) {
      for (let stage = 0; stage <= STAGE_MAX; stage++) {
        expect(spec(EX[id], 2, stage).amount % 5, `${id}/st${stage}`).toBe(0);
      }
    }
  });
});

describe("timerSec — タイマーが回す長さ", () => {
  /* ---- v17.2 の不具合 ---- */
  it("【v17.2の回帰】秒数の左右種目は、左右あわせた長さで回る", () => {
    /* サイドプランクだけ、画面表示（左右各◯秒 × Nセット）と
       タイマーの動きが食い違っていた。片側ぶんで1セット数えていた */
    const ex = EX.sideplank;
    expect(ex.type).toBe("time");
    expect(ex.perSide).toBe(true);
    const sp = spec(ex, 1, 0);
    expect(timerSec(ex, sp)).toBe(sp.amount * 2);
  });

  it("左右の無い秒数種目は、そのままの長さ", () => {
    const ex = EX.plank;
    const sp = spec(ex, 1, 0);
    expect(timerSec(ex, sp)).toBe(sp.amount);
  });

  it("回数の左右種目には影響しない（もともとタイマーを使わない）", () => {
    const ex = EX.lunge;
    expect(ex.type).toBe("reps");
    const sp = spec(ex, 1, 0);
    expect(timerSec(ex, sp)).toBe(sp.amount);
  });

  it("表示とタイマーが、すべての左右種目で食い違わない", () => {
    for (const [id, ex] of Object.entries(EX)) {
      if (!ex.perSide || ex.type !== "time") continue;
      const sp = spec(ex, 1, 0);
      expect(specText(ex, 1, 0, false), id).toContain("左右各");
      expect(timerSec(ex, sp), id).toBe(sp.amount * 2);
    }
  });
});

describe("lvMeta — 範囲外のレベル", () => {
  it("引き継ぎデータで変な値が来ても落ちない", () => {
    for (const bad of [-1, 99, NaN, undefined]) {
      expect(() => lvMeta(bad)).not.toThrow();
      expect(lvMeta(bad).label).toBeTruthy();
    }
  });
});

describe("bodyGoal — まずの目標体重", () => {
  /* ---- v17.2 の不具合 ---- */
  it("【v17.2の回帰】範囲内の人に、範囲外の目標を出さない", () => {
    /* 158cm / 47kg は範囲内だが、3%引くだけだと 45.6kg で範囲外になっていた。
       いまは下限（46.2kg）で止まる */
    const r = bodyGoal({ heightCm: 158, nowKg: 47, goalKg: 46 });
    expect(floorKgFor(158)).toBe(46.2);
    expect(r.rawGoal).toBe(45.6);   /* 3%引いただけの値。これを出してはいけない */
    expect(r.firstGoal).toBe(46.2); /* 下限で止めた値 */
    expect(r.goalAtFloor).toBe(true);
  });

  it("ふつうに減らす余地がある人には、3%減を出す", () => {
    const r = bodyGoal({ heightCm: 158, nowKg: 65, goalKg: 58 });
    expect(r.firstGoal).toBe(63.1); /* 65 × 0.97 */
    expect(r.nearFloor).toBe(false);
    expect(r.goalAtFloor).toBe(false);
  });

  it("下限で止めたときは、その旨がわかる", () => {
    /* 3%引くと下限を割るが、まだ多少の余地はある人 */
    const floor = floorKgFor(160);
    const now = Math.round(floor * 1.02 * 10) / 10;
    const r = bodyGoal({ heightCm: 160, nowKg: now, goalKg: floor });
    expect(r.goalAtFloor).toBe(true);
    expect(r.firstGoal).toBe(floor);
  });

  it("いますでに下限を下回っている人には、目標を出さない", () => {
    const r = bodyGoal({ heightCm: 165, nowKg: 44, goalKg: 42 });
    expect(r.lowNow).toBe(true);
    expect(r.firstGoal).toBe(null);
  });

  it("本人の入力した目標が下限を割っていたら、知らせる", () => {
    expect(bodyGoal({ heightCm: 160, nowKg: 60, goalKg: 44 }).tooLow).toBe(true);
    expect(bodyGoal({ heightCm: 160, nowKg: 60, goalKg: 52 }).tooLow).toBe(false);
  });

  it("身長や体重が未入力でも落ちない", () => {
    for (const arg of [{}, { heightCm: "", nowKg: "" }, { heightCm: 0, nowKg: 0 }, { heightCm: "abc" }]) {
      expect(() => bodyGoal(arg)).not.toThrow();
      expect(bodyGoal(arg).firstGoal).toBe(null);
    }
  });

  it("出す目標が、下限を下回ることは決してない", () => {
    /* 入力しうる範囲を総当たりする */
    for (let h = 140; h <= 190; h += 1) {
      const floor = floorKgFor(h);
      for (let kg = 35; kg <= 120; kg += 0.5) {
        const r = bodyGoal({ heightCm: h, nowKg: kg, goalKg: kg });
        if (r.firstGoal == null) continue;
        expect(r.firstGoal, `${h}cm / ${kg}kg`).toBeGreaterThanOrEqual(floor);
      }
    }
  });
});
