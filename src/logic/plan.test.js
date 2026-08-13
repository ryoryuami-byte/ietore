/* =========================================================================
   メニューの組み立てのテスト。

   v10〜v17.2 の変更履歴に載っている不具合を、そのままテストにしてある。
   同じものが二度と戻らないようにするのが目的なので、
   「なぜこれを見ているか」を各テストに書いておく。
   ========================================================================= */
import { describe, it, expect } from "vitest";
import { EX, CARDIO_PICKS, FOCUS_META, PHASE_ORDER, phaseOf } from "../exercises.js";
import { buildDay, buildPlan, estimateMin, mainIdOf, planIsValid, shortIds } from "./plan.js";
import { EMPTY_PROFILE } from "../questions.js";

const P = (over = {}) => ({
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "4", minutes: "20", activity: "little", noise: "quiet",
  level: "easy", timeOfDay: "evening",
  area: [], stopReason: [], avoid: ["none"], tendency: [],
  ...over,
});

const FOCUSES = ["lower", "core", "upper", "cardio", "full", "rest"];
const LEVELS = ["gentle", "easy", "normal", "hard"];

/* 総当たりのためのプロフィール一覧 */
function everyProfile() {
  const out = [];
  for (const goal of ["lose", "tone", "fitness", "posture"]) {
    for (const days of ["3", "4", "5"]) {
      for (const minutes of ["10", "20", "30"]) {
        for (const level of LEVELS) {
          for (const noise of ["ok", "quiet"]) {
            out.push(P({ goal, days, minutes, level, noise }));
          }
        }
      }
    }
  }
  return out;
}

describe("buildDay — 1日ぶんの組み立て", () => {
  it("どの日も ① → ② → ③ → ④ の順に並ぶ", () => {
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const ids = buildDay(p, focus);
        const order = ids.map((id) => PHASE_ORDER.indexOf(phaseOf(id)));
        expect([...order].sort((a, b) => a - b), `${focus}`).toEqual(order);
      }
    }
  });

  it("ウォームアップとクールダウンは、どんなに時間が短くても必ず入る", () => {
    /* v16 で「時間枠が短い日は、ウォームアップではなくメインを減らす」と決めた */
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const ids = buildDay(p, focus);
        expect(ids.some((id) => phaseOf(id) === "warmup"), `${focus}`).toBe(true);
        expect(ids.some((id) => phaseOf(id) === "cooldown"), `${focus}`).toBe(true);
      }
    }
  });

  it("有酸素は毎日ちょうど2種目（＝20分ぶん）", () => {
    /* v17 で「③ 有酸素を毎日20分に固定」と決めた。ととのえる日も含む */
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const n = buildDay(p, focus).filter((id) => phaseOf(id) === "cardio").length;
        expect(n, `${focus}`).toBe(CARDIO_PICKS);
      }
    }
  });

  it("同じ種目が1日に2回出てこない", () => {
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const ids = buildDay(p, focus);
        expect(new Set(ids).size, `${focus}`).toBe(ids.length);
      }
    }
  });

  it("存在しない種目IDを返さない", () => {
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        for (const id of buildDay(p, focus)) expect(EX[id], id).toBeTruthy();
      }
    }
  });

  /* ---- v17.1 の不具合 ---- */
  it("【v17.1の回帰】有酸素の日に、強度3の種目が入らない", () => {
    /* 「筋トレは軽めにして」と画面に出している日なのに、並び順の都合で
       スローバーピーとマウンテンクライマーが選ばれていた */
    for (const p of everyProfile()) {
      const ids = buildDay(p, "cardio");
      for (const id of ids) {
        if (phaseOf(id) !== "main") continue;
        expect((EX[id].int ?? 1), `${id} が有酸素の日のメインに入っている`).toBeLessThanOrEqual(1);
      }
    }
  });

  /* ---- v15 で決めた制限 ---- */
  it("【v15の制限】腰に負担のある種目は、1日1つまで", () => {
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const n = buildDay(p, focus).filter((id) => EX[id]?.spineLoad).length;
        expect(n, `${focus}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("【v15の制限】「とてもゆっくり」には、腰に負担のある種目も高強度の種目も出さない", () => {
    for (const p of everyProfile().filter((x) => x.level === "gentle")) {
      for (const focus of FOCUSES) {
        for (const id of buildDay(p, focus)) {
          expect(EX[id].spineLoad ?? false, id).toBe(false);
          expect(EX[id].int ?? 1, id).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("集合住宅（足音を出せない）を選ぶと、音の出る種目を出さない", () => {
    for (const p of everyProfile().filter((x) => x.noise === "quiet")) {
      for (const focus of FOCUSES) {
        for (const id of buildDay(p, focus)) expect(EX[id].noisy ?? false, id).toBe(false);
      }
    }
  });

  it("避けたい部位を選ぶと、そこに負担のかかる種目を出さない", () => {
    for (const avoid of ["knee", "back", "shoulder", "wrist"]) {
      const p = P({ avoid: [avoid] });
      for (const focus of FOCUSES) {
        for (const id of buildDay(p, focus)) {
          expect((EX[id].stress ?? []).includes(avoid), `${avoid} / ${id}`).toBe(false);
        }
      }
    }
  });

  it("避けたい部位を4つ全部選んでも、メニューが作れる", () => {
    /* ここで種目が尽きると、usableList の逃げ道が働くはず */
    const p = P({ avoid: ["knee", "back", "shoulder", "wrist"] });
    for (const focus of FOCUSES) {
      const ids = buildDay(p, focus);
      expect(ids.length, focus).toBeGreaterThan(0);
      expect(ids.every((id) => EX[id]), focus).toBe(true);
    }
  });

  it("seed を変えると、少なくとも一部の種目が入れ替わる", () => {
    /* メニューの入れ替えボタンが「何も変わらない」のは v10 の不具合だった */
    const p = P();
    const a = buildDay(p, "lower", 0).join(",");
    const b = buildDay(p, "lower", 1).join(",");
    expect(a).not.toBe(b);
  });

  it("時間を「しっかり」にすると、メインの種目数が増える", () => {
    const short = buildDay(P({ minutes: "10" }), "full").filter((id) => phaseOf(id) === "main");
    const long = buildDay(P({ minutes: "30" }), "full").filter((id) => phaseOf(id) === "main");
    expect(long.length).toBeGreaterThan(short.length);
  });

  it("「時間がとれない」と答えた人は、メインが1つ少ない", () => {
    const normal = buildDay(P(), "full").filter((id) => phaseOf(id) === "main").length;
    const busy = buildDay(P({ stopReason: ["busy"] }), "full").filter((id) => phaseOf(id) === "main").length;
    expect(busy).toBe(normal - 1);
  });

  it("全身の日は、下半身・体幹・上半身に散らばる", () => {
    /* v15 で「1種目や1部位だけに偏らないように」と決めた */
    const main = buildDay(P({ minutes: "30" }), "full").filter((id) => phaseOf(id) === "main");
    const groups = new Set(main.flatMap((id) => EX[id].focus ?? []));
    expect(groups.size).toBeGreaterThanOrEqual(2);
  });
});

describe("buildPlan — 週の組み立て", () => {
  it("どんな答えの組み合わせでも、検証を通るプランになる", () => {
    for (const p of everyProfile()) {
      expect(planIsValid(buildPlan(p)), `${p.goal}/${p.days}/${p.minutes}/${p.level}/${p.noise}`).toBe(true);
    }
  });

  it("7日ぶんすべてに、見出しと種目がある", () => {
    for (const p of everyProfile()) {
      const plan = buildPlan(p);
      for (let d = 0; d < 7; d++) {
        expect(FOCUS_META[plan[d].focus], `${d}`).toBeTruthy();
        expect(plan[d].ids.length, `${d}`).toBeGreaterThan(0);
      }
    }
  });

  it("選んだ日数ぶんだけ、ととのえる日以外が入る", () => {
    for (const days of ["3", "4", "5"]) {
      const plan = buildPlan(P({ days }));
      const active = [0, 1, 2, 3, 4, 5, 6].filter((d) => plan[d].focus !== "rest").length;
      expect(active, `週${days}日`).toBe(Number(days));
    }
  });

  it("【v12の変更】トレーニングの日が続けて並びすぎない", () => {
    /* 週3日なら月・水・金のように間隔をあける、と v12 で決めた */
    const plan = buildPlan(P({ days: "3" }));
    const active = [0, 1, 2, 3, 4, 5, 6].filter((d) => plan[d].focus !== "rest");
    expect(active).toEqual([1, 3, 5]);
  });

  it("週3日以上なら、下半身・体幹・上半身が1日ずつ必ず入る", () => {
    for (const p of everyProfile()) {
      const plan = buildPlan(p);
      const focuses = [0, 1, 2, 3, 4, 5, 6].map((d) => plan[d].focus);
      for (const need of ["lower", "core", "upper"]) {
        expect(focuses.includes(need), `${p.goal}/${p.days} に ${need} が無い`).toBe(true);
      }
    }
  });

  it("プロフィールが壊れていても落ちない", () => {
    for (const bad of [{}, { days: "x" }, { minutes: null }, { avoid: "knee" }, { level: "???" }]) {
      expect(() => buildPlan(bad)).not.toThrow();
      expect(planIsValid(buildPlan(bad))).toBe(true);
    }
  });
});

describe("planIsValid — 壊れたプランを弾く", () => {
  const good = buildPlan(P());

  it("正しいプランは通す", () => expect(planIsValid(good)).toBe(true));

  it("null や 空 は弾く", () => {
    expect(planIsValid(null)).toBe(false);
    expect(planIsValid({})).toBe(false);
  });

  it("曜日が1つ欠けていたら弾く", () => {
    const bad = { ...good };
    delete bad[3];
    expect(planIsValid(bad)).toBe(false);
  });

  it("知らない種目IDが混ざっていたら弾く", () => {
    expect(planIsValid({ ...good, 3: { ...good[3], ids: [...good[3].ids, "ないやつ"] } })).toBe(false);
  });

  it("有酸素の数が2でなければ弾く（v17より前の形を作り直させる）", () => {
    const ids = good[3].ids.filter((id) => phaseOf(id) !== "cardio");
    expect(planIsValid({ ...good, 3: { ...good[3], ids } })).toBe(false);
  });

  it("ウォームアップが無ければ弾く（v15より前の形）", () => {
    const ids = good[3].ids.filter((id) => phaseOf(id) !== "warmup");
    expect(planIsValid({ ...good, 3: { ...good[3], ids } })).toBe(false);
  });
});

describe("shortIds — 短縮メニュー", () => {
  it("① ② ④ が1つずつになる", () => {
    /* v15 で「ウォームアップ＋メイン1種目＋ストレッチ」と決めた */
    const ids = shortIds(buildDay(P(), "full"));
    expect(ids.filter((id) => phaseOf(id) === "warmup")).toHaveLength(1);
    expect(ids.filter((id) => phaseOf(id) === "main")).toHaveLength(1);
    expect(ids.filter((id) => phaseOf(id) === "cooldown")).toHaveLength(1);
    expect(ids).toHaveLength(3);
  });

  it("ととのえる日（メインが無い日）でも作れる", () => {
    const ids = shortIds(buildDay(P(), "rest"));
    expect(ids.length).toBeGreaterThan(0);
  });
});

describe("mainIdOf — 「おかえり」で見せる代表の種目", () => {
  it("ウォームアップではなくメインを返す", () => {
    /* v10 の「おかえり」がウォームアップを見せていた */
    const id = mainIdOf(buildDay(P(), "full"));
    expect(phaseOf(id)).toBe("main");
  });

  it("ととのえる日はメインが無いので、有酸素を返す", () => {
    expect(phaseOf(mainIdOf(buildDay(P(), "rest")))).toBe("cardio");
  });
});

describe("estimateMin — めやすの時間", () => {
  it("② メインだけを数える（①③④は外）", () => {
    /* v17 で「めやすを ② メインだけの時間に変えた」 */
    const ids = buildDay(P(), "full");
    const mainOnly = ids.filter((id) => phaseOf(id) === "main");
    expect(estimateMin(ids, 1, 0, false)).toBe(estimateMin(mainOnly, 1, 0, false));
  });

  it("ととのえる日はメインが無いので、最小の1分になる", () => {
    expect(estimateMin(buildDay(P(), "rest"), 1, 0, false)).toBe(1);
  });

  it("どの組み合わせでも、現実的な範囲（1〜60分）に収まる", () => {
    for (const p of everyProfile()) {
      for (const focus of FOCUSES) {
        const ids = buildDay(p, focus);
        for (let stage = 0; stage <= 6; stage++) {
          const m = estimateMin(ids, 1, stage, false);
          expect(m, `${focus}/stage${stage}`).toBeGreaterThanOrEqual(1);
          expect(m, `${focus}/stage${stage}`).toBeLessThanOrEqual(60);
        }
      }
    }
  });

  it("短縮にすると必ず短くなる", () => {
    const ids = buildDay(P({ minutes: "30" }), "full");
    expect(estimateMin(ids, 1, 0, true)).toBeLessThan(estimateMin(ids, 1, 0, false));
  });
});
