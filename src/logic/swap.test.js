/* 1種目だけの差し替え。
   ここが崩れると「ひざが痛い種目が、差し替えたのにまた出る」ことになる。 */
import { describe, it, expect } from "vitest";
import { buildDay, hasSwap, swapOne } from "./plan.js";
import { EX, phaseOf } from "../exercises.js";
import { EMPTY_PROFILE } from "../questions.js";

const P = (over = {}) => ({
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "4", minutes: "30", activity: "little", noise: "quiet",
  level: "normal", timeOfDay: "evening", avoid: ["none"], area: [], stopReason: [], tendency: [],
  ...over,
});

const FOCUSES = ["lower", "core", "upper", "cardio", "full", "rest"];
const weight = (e) => (e.int ?? 1) * 100 + ((e.amount?.hard ?? 0) + (e.amount?.easy ?? 0)) / 2;

describe("swapOne — 1種目だけ替える", () => {
  it("指定した種目だけが変わり、ほかはそのまま", () => {
    const p = P();
    const ids = buildDay(p, "full");
    const target = ids.find((id) => phaseOf(id) === "main");
    const next = swapOne(p, ids, target);

    expect(next).not.toEqual(ids);
    expect(next).not.toContain(target);
    expect(next).toHaveLength(ids.length);
    /* 替えた1つ以外は残っている */
    for (const id of ids) {
      if (id !== target) expect(next, id).toContain(id);
    }
  });

  it("同じ流れ（①〜④）の中から選ぶ", () => {
    const p = P();
    for (const focus of FOCUSES) {
      const ids = buildDay(p, focus);
      for (const id of ids) {
        const next = swapOne(p, ids, id);
        if (next === ids) continue; /* 候補が無ければ替えない */
        const added = next.find((x) => !ids.includes(x));
        expect(phaseOf(added), `${id} → ${added}`).toBe(phaseOf(id));
      }
    }
  });

  it("並びが ① → ② → ③ → ④ のままになる", () => {
    const p = P();
    const ids = buildDay(p, "full");
    const next = swapOne(p, ids, ids.find((id) => phaseOf(id) === "main"));
    const order = next.map((id) => ["warmup", "main", "cardio", "cooldown"].indexOf(phaseOf(id)));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("メインは、鍛える場所が変わらないものに替える", () => {
    const p = P();
    const ids = buildDay(p, "lower");
    const target = ids.find((id) => phaseOf(id) === "main");
    const next = swapOne(p, ids, target);
    const added = next.find((x) => !ids.includes(x));
    if (added) {
      expect((EX[added].focus ?? []).some((f) => (EX[target].focus ?? []).includes(f))).toBe(true);
    }
  });

  it("避けたい部位に負担のある種目には替えない", () => {
    for (const avoid of ["knee", "back", "shoulder", "wrist"]) {
      const p = P({ avoid: [avoid] });
      const ids = buildDay(p, "full");
      for (const id of ids) {
        const next = swapOne(p, ids, id);
        for (const x of next) {
          expect((EX[x].stress ?? []).includes(avoid), `${avoid} / ${x}`).toBe(false);
        }
      }
    }
  });

  it("集合住宅では、音の出る種目に替えない", () => {
    const p = P({ noise: "quiet" });
    const ids = buildDay(p, "full");
    for (const id of ids) {
      for (const x of swapOne(p, ids, id)) expect(EX[x].noisy ?? false, x).toBe(false);
    }
  });

  it("腰に負担のある種目が、1日に2つにならない", () => {
    const p = P();
    for (const focus of FOCUSES) {
      const ids = buildDay(p, focus);
      for (const id of ids) {
        const n = swapOne(p, ids, id).filter((x) => EX[x]?.spineLoad).length;
        expect(n, `${focus} / ${id}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("その日に無い種目を指定しても、何も起きない", () => {
    const p = P();
    const ids = buildDay(p, "full");
    expect(swapOne(p, ids, "ないやつ")).toBe(ids);
  });
});

describe("やさしい版・きつい版", () => {
  it("やさしくすると、いまより軽い種目になる", () => {
    const p = P();
    const ids = buildDay(p, "full");
    for (const id of ids.filter((x) => phaseOf(x) === "main")) {
      const next = swapOne(p, ids, id, -1);
      if (next === ids) continue;
      const added = next.find((x) => !ids.includes(x));
      expect(weight(EX[added]), `${id} → ${added}`).toBeLessThan(weight(EX[id]));
    }
  });

  it("きつくすると、いまより重い種目になる", () => {
    const p = P();
    const ids = buildDay(p, "full");
    for (const id of ids.filter((x) => phaseOf(x) === "main")) {
      const next = swapOne(p, ids, id, 1);
      if (next === ids) continue;
      const added = next.find((x) => !ids.includes(x));
      expect(weight(EX[added]), `${id} → ${added}`).toBeGreaterThan(weight(EX[id]));
    }
  });

  it("求めた向きに候補が無ければ、黙って逆へ動かさない", () => {
    /* いちばん軽い種目を、さらにやさしくしようとする */
    const p = P();
    const ids = buildDay(p, "full");
    const mains = ids.filter((x) => phaseOf(x) === "main");
    const lightest = mains.reduce((a, b) => (weight(EX[a]) <= weight(EX[b]) ? a : b));
    const next = swapOne(p, ids, lightest, -1);
    if (next !== ids) {
      const added = next.find((x) => !ids.includes(x));
      expect(weight(EX[added])).toBeLessThan(weight(EX[lightest]));
    }
  });

  it("hasSwap が、ボタンを出してよいかを正しく答える", () => {
    const p = P();
    const ids = buildDay(p, "full");
    for (const id of ids) {
      for (const dir of [-1, 0, 1]) {
        expect(hasSwap(p, ids, id, dir)).toBe(swapOne(p, ids, id, dir) !== ids);
      }
    }
  });
});
