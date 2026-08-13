/* 分割が実行時にも壊れていないことを確かめる最小限のテスト。
   種目やロジックの中身を見るテストは Phase 4 で足す。 */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { buildPlan } from "./logic/plan.js";
import { planIsValid } from "./logic/plan.js";
import { EMPTY_PROFILE } from "./questions.js";

const PROFILE = {
  ...EMPTY_PROFILE,
  age: "34", height: "158", weightNow: "55", weightGoal: "52",
  goal: "lose", days: "4", minutes: "20", activity: "little", noise: "quiet",
  level: "easy", timeOfDay: "evening",
  area: ["bellyLow", "hip"], stopReason: ["busy"], avoid: ["none"], tendency: ["cold"],
};

describe("アプリの起動", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  it("記録が無い状態で、初回診断の画面まで描画できる", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    /* 「よみこみ中…」を抜けて質問が出るところまで */
    expect(el.textContent).toContain("いくつか教えてください");
    await act(async () => root.unmount());
  });

  it("保存済みのプロフィールがあれば、今日のメニューが描画できる", async () => {
    window.localStorage.setItem(
      "hometrain:core:v1",
      JSON.stringify({ name: "テスト", profile: PROFILE, plan: buildPlan(PROFILE) })
    );
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    /* 1回の流れの見出しが出ていれば、種目まで組み上がっている */
    expect(el.textContent).toContain("① ウォームアップ");
    expect(el.textContent).toContain("③ 有酸素");
    expect(el.textContent).toContain("テスト");
    await act(async () => root.unmount());
  });
});

describe("メニューの組み立て", () => {
  it("作ったプランが、そのまま検証を通る", () => {
    expect(planIsValid(buildPlan(PROFILE))).toBe(true);
  });

  it("どの答えの組み合わせでも、壊れたプランにならない", () => {
    for (const goal of ["lose", "tone", "fitness", "posture"]) {
      for (const days of ["3", "4", "5"]) {
        for (const minutes of ["10", "20", "30"]) {
          for (const level of ["gentle", "easy", "normal", "hard"]) {
            for (const noise of ["ok", "quiet"]) {
              const p = { ...PROFILE, goal, days, minutes, level, noise };
              expect(planIsValid(buildPlan(p)), `${goal}/${days}/${minutes}/${level}/${noise}`).toBe(true);
            }
          }
        }
      }
    }
  });
});
