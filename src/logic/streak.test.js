/* 連続日数と保護。
   ここは「切れた／切れない」を1日ずれただけで意味が変わるので、
   境目を1つずつ確かめる。 */
import { describe, it, expect } from "vitest";
import { computeStreak, milestoneOf, recoveryMessage } from "./streak.js";
import { buildPlan } from "./plan.js";
import { EMPTY_PROFILE } from "../questions.js";
import { dateKey } from "../utils.js";

const PROFILE = {
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "5", minutes: "20", activity: "little", noise: "quiet",
  level: "easy", timeOfDay: "evening", avoid: ["none"],
};

/* 毎日がトレーニングの日になるプラン（ととのえる日で連続が繋がるのを避け、
   保護そのものを試せるようにする） */
const ALL_ACTIVE = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map((d) => [d, { focus: "full", ids: buildPlan(PROFILE)[1].ids }])
);

const TODAY = new Date(2026, 7, 14); /* 2026-08-14（金） */
const back = (n) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

/* n日前 → やった／やらない を並べて log を作る */
const logOf = (spec) => {
  const log = {};
  for (const [n, v] of Object.entries(spec)) {
    if (v === "done") log[back(n)] = { ex: { squat: 3 }, done: true };
    else if (v === "skip") log[back(n)] = { ex: {}, skip: "疲れている" };
  }
  return log;
};

const run = (log, freezeOn = true) => computeStreak({
  log, plan: ALL_ACTIVE, today: TODAY, dateKey,
  trained: (k) => Object.values(log[k]?.ex ?? {}).some((v) => v > 0),
  freezeOn,
});

describe("連続日数", () => {
  it("記録が無ければ 0 日", () => {
    expect(run({}).days).toBe(0);
  });

  it("今日まで続けていれば、その日数になる", () => {
    expect(run(logOf({ 0: "done", 1: "done", 2: "done" })).days).toBe(3);
  });

  it("今日がまだでも、昨日までの連続は残る", () => {
    /* 今日はこれから。ここで 0 になると、朝ひらいた人が落胆する */
    expect(run(logOf({ 1: "done", 2: "done", 3: "done" })).days).toBe(3);
  });

  it("お休み申告の日では切れない", () => {
    expect(run(logOf({ 0: "done", 1: "skip", 2: "done", 3: "done" })).days).toBe(3);
  });
});

describe("保護（フリーズ）", () => {
  it("何も言わずに1日あけても、ひと月に1度だけ切れない", () => {
    /* 2日前が空白。保護が効けば 0・1・3・4日前の4日ぶんが繋がる */
    const r = run(logOf({ 0: "done", 1: "done", 3: "done", 4: "done" }));
    expect(r.days).toBe(4);
    expect(r.frozen).toEqual([back(2)]);
  });

  it("同じ月に2日あくと、2日目で切れる", () => {
    const r = run(logOf({ 0: "done", 2: "done", 4: "done" }));
    expect(r.days).toBe(2);          /* 今日と2日前 */
    expect(r.frozen).toHaveLength(1); /* 使えたのは1回だけ */
    expect(r.brokeAt).toBe(back(3));
  });

  it("設定で切ると、1日あけただけで切れる", () => {
    const r = run(logOf({ 0: "done", 1: "done", 3: "done" }), false);
    expect(r.days).toBe(2);
    expect(r.frozen).toEqual([]);
    expect(r.brokeAt).toBe(back(2));
  });

  it("月が変われば、また1日ぶん使える", () => {
    /* 8月に1日、7月に1日あけても、どちらも保護される */
    const log = {};
    for (const k of ["2026-08-14", "2026-08-13", "2026-08-11", "2026-08-10"]) {
      log[k] = { ex: { squat: 3 }, done: true };
    }
    /* 8月12日が空白（8月ぶんの保護を使う） */
    const r = computeStreak({
      log, plan: ALL_ACTIVE, today: TODAY, dateKey,
      trained: (k) => Object.values(log[k]?.ex ?? {}).some((v) => v > 0),
    });
    expect(r.days).toBe(4);
    expect(r.frozen).toEqual(["2026-08-12"]);
  });

  it("保護で救った日は、どの日かが分かる（画面で伝えるため）", () => {
    const r = run(logOf({ 0: "done", 2: "done" }));
    expect(r.frozen).toEqual([back(1)]);
  });
});

describe("節目", () => {
  it("決めた日数のときだけ返す", () => {
    expect(milestoneOf(7)).toBe(7);
    expect(milestoneOf(30)).toBe(30);
    expect(milestoneOf(8)).toBe(null);
    expect(milestoneOf(0)).toBe(null);
  });
});

describe("切れたときの声かけ", () => {
  it("切れていなければ何も出さない", () => {
    expect(recoveryMessage(null, 0)).toBe(null);
  });

  it("1日なら「二度あけない」を伝える", () => {
    expect(recoveryMessage("2026-08-13", 1).body).toContain("二度");
  });

  it("長くあいた人を責めない", () => {
    const m = recoveryMessage("2026-06-01", 60);
    expect(m.title).toContain("おかえり");
    expect(m.body).not.toContain("残念");
  });
});
