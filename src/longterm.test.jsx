/* =========================================================================
   長く使ったときのテスト。

   このアプリの計算は、ほとんどが「記録の全部をなめる」形で書かれている。
   AppInner の stats は連続日数のために最大400日ぶんさかのぼり、
   areaTotals・badgeList・WeekSummary もログ全体を1件ずつ見ている。
   使い始めは軽くても、1年・3年と続けた人の端末で重くなるのでは、
   いちばん大事にすべき利用者を取りこぼす。

   ここでは「3年ぶんの記録＋写真12枚」を流し込み、
   起動して画面が出るまでの時間と、集計そのものの時間を見る。

   時間の上限は、実測（1年 2ms / 3年 6ms / 10年 8ms）よりかなり緩くしてある。
   ここで見たいのは「6ms が 8ms になった」ではなく、
   **桁が変わる劣化**（うっかり O(n^2) にしてしまった等）だけ。
   テストは並列で走るので、CPU の取り合いで実測は数倍ぶれる。
   きつい上限にすると、コードは正しいのに CI が赤くなる。
   ========================================================================= */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LEGAL_VERSION } from "./legal.js";
import { levelsOf, metricsOf, SERIES } from "./logic/badges.js";
import { buildPlan } from "./logic/plan.js";
import { stageOf } from "./logic/progress.js";
import { normalizeCore, normalizeLog, normalizePhotos } from "./logic/validate.js";
import { areaTotals, EMPTY_PROFILE } from "./questions.js";
import { dateKey } from "./utils.js";

const PROFILE = {
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "4", minutes: "20", activity: "little", noise: "quiet",
  level: "easy", timeOfDay: "evening", avoid: ["none"],
};

const PNG = "data:image/jpeg;base64,AAAA";
const FEELINGS = ["hard", "ok", "easy"];

/* days 日ぶんの記録を作る。今日から過去へさかのぼる */
function makeLog(days, plan) {
  const log = {};
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const ids = plan[d.getDay()].ids;
    const ex = {};
    for (const id of ids) ex[id] = 3;
    log[k] = {
      ex, done: i % 5 !== 0, focus: plan[d.getDay()].focus, lv: 1, stage: 2,
      feeling: FEELINGS[i % 3],
      note: i % 7 === 0 ? "きょうは調子がよかった" : undefined,
      skip: i % 11 === 0 ? "疲れている" : undefined,
    };
  }
  return log;
}

function makeWeights(weeks) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < weeks; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    out.push({ date: dateKey(d), kg: 55 - i * 0.05, waist: 70 - i * 0.05, thigh: 50 - i * 0.03 });
  }
  return out;
}

const PLAN = buildPlan(PROFILE);
const YEARS3 = 365 * 3;

describe("3年ぶんの記録", () => {
  const log = makeLog(YEARS3, PLAN);

  it("記録の日数がそろっている（テストの前提の確認）", () => {
    expect(Object.keys(log)).toHaveLength(YEARS3);
  });

  it("段階の計算が 300ms 以内に終わる", () => {
    const t = performance.now();
    const r = stageOf(log);
    const ms = performance.now() - t;
    expect(r.stage).toBeGreaterThanOrEqual(0);
    expect(ms, `${ms.toFixed(1)}ms かかった`).toBeLessThan(300);
  });

  it("部位別の累計が 500ms 以内に終わる", () => {
    const t = performance.now();
    const totals = areaTotals(log);
    const ms = performance.now() - t;
    expect(Object.keys(totals).length).toBeGreaterThan(0);
    expect(ms, `${ms.toFixed(1)}ms かかった`).toBeLessThan(500);
  });

  it("バッジの判定が 300ms 以内に終わる", () => {
    const t = performance.now();
    const metrics = metricsOf({ log, streak: 1500, photos: Array.from({ length: 24 }, () => ({})), weights: makeWeights(150) });
    const levels = levelsOf(metrics);
    const ms = performance.now() - t;
    /* 3年間、毎日・すべての種目をやりきった記録なので、全シリーズが最後の段まで届く */
    for (const s of SERIES) expect(levels[s.id], s.id).toBe(s.tiers.length);
    expect(ms, `${ms.toFixed(1)}ms かかった`).toBeLessThan(300);
  });

  it("検証（読み込み時に必ず通る）が 1秒以内に終わる", () => {
    /* 起動のたびに走るので、ここが遅いと「よみこみ中…」が長引く */
    const t = performance.now();
    normalizeLog(log);
    normalizeCore({ profile: PROFILE, plan: PLAN, weights: makeWeights(156) });
    normalizePhotos(Array.from({ length: 12 }, (_, i) => ({ date: `2026-0${(i % 9) + 1}-01`, data: PNG })));
    const ms = performance.now() - t;
    expect(ms, `${ms.toFixed(1)}ms かかった`).toBeLessThan(1000);
  });
});

describe("3年ぶんの記録がある状態でのアプリの起動", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  const seed = () => {
    window.localStorage.setItem("hometrain:core:v1", JSON.stringify({
      name: "ながねん", profile: PROFILE, plan: PLAN,
      consent: { v: LEGAL_VERSION, at: "2026-08-13T00:00:00.000Z" },
      weights: makeWeights(156), trackWeight: true, cheers: ["いいぞ"],
    }));
    window.localStorage.setItem("hometrain:log:v1", JSON.stringify(makeLog(YEARS3, PLAN)));
    window.localStorage.setItem("hometrain:photos:v1", JSON.stringify(
      Array.from({ length: 12 }, (_, i) => ({ date: `2026-0${(i % 9) + 1}-0${(i % 8) + 1}`, data: PNG }))
    ));
  };

  it("ホームが 3秒以内に出る", async () => {
    seed();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    const t = performance.now();
    await act(async () => root.render(<App />));
    const ms = performance.now() - t;
    expect(el.textContent).toContain("今日のメニュー");
    expect(ms, `${ms.toFixed(0)}ms かかった`).toBeLessThan(3000);
    await act(async () => root.unmount());
  });

  it("カレンダーの画面も開ける", async () => {
    seed();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));

    const tab = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("カレンダー"));
    expect(tab, "カレンダーのタブが見つからない").toBeTruthy();
    const t = performance.now();
    await act(async () => tab.click());
    const ms = performance.now() - t;

    expect(el.textContent).toContain("今週やりきった回数");
    expect(ms, `${ms.toFixed(0)}ms かかった`).toBeLessThan(3000);
    await act(async () => root.unmount());
  });

  it("マイページも開ける", async () => {
    seed();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));

    const tab = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("マイページ"));
    expect(tab).toBeTruthy();
    await act(async () => tab.click());
    expect(el.textContent).toContain("すべての記録を消す");
    await act(async () => root.unmount());
  });
});
