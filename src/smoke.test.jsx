/* 分割が実行時にも壊れていないことを確かめる最小限のテスト。
   種目やロジックの中身を見るテストは Phase 4 で足す。 */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LEGAL_VERSION } from "./legal.js";
import { buildPlan } from "./logic/plan.js";
import { planIsValid } from "./logic/plan.js";
import { EMPTY_PROFILE } from "./questions.js";

/* 同意済みの状態。v18 から、これが無いと質問に進めない */
const CONSENT = { v: LEGAL_VERSION, at: "2026-08-13T00:00:00.000Z" };

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

  it("まっさらな状態では、まず注意書きと同意の画面が出る", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    expect(el.textContent).toContain("はじめる前に");
    expect(el.textContent).toContain("痛みが出たら、すぐにやめてください");
    /* 同意する前に質問へ進ませない */
    expect(el.textContent).not.toContain("いくつか教えてください");
    await act(async () => root.unmount());
  });

  it("すでにプロフィールがあっても、同意がまだなら同意画面を出す", async () => {
    /* v17.2 から更新した人。注意書きを一度も見ていないので、1回だけ出す */
    window.localStorage.setItem(
      "hometrain:core:v1",
      JSON.stringify({ name: "テスト", profile: PROFILE, plan: buildPlan(PROFILE) })
    );
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    expect(el.textContent).toContain("はじめる前に");
    await act(async () => root.unmount());
  });

  it("同意済みで記録が無ければ、初回診断の画面まで描画できる", async () => {
    window.localStorage.setItem("hometrain:core:v1", JSON.stringify({ consent: CONSENT }));
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    /* 「よみこみ中…」を抜けて質問が出るところまで */
    expect(el.textContent).toContain("いくつか教えてください");
    await act(async () => root.unmount());
  });

  it("保存済みのプロフィールがあれば、ホームが描画できる", async () => {
    window.localStorage.setItem(
      "hometrain:core:v1",
      JSON.stringify({ name: "テスト", profile: PROFILE, plan: buildPlan(PROFILE), consent: CONSENT })
    );
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));
    expect(el.textContent).toContain("テスト");
    expect(el.textContent).toContain("今日のメニュー");
    await act(async () => root.unmount());
  });

  it("タブが5つあり、切り替えられる", async () => {
    /* v18.3 で3つから5つに増やした。名前と順番が崩れていないかを見る */
    window.localStorage.setItem(
      "hometrain:core:v1",
      JSON.stringify({ name: "テスト", profile: PROFILE, plan: buildPlan(PROFILE), consent: CONSENT })
    );
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));

    const nav = el.querySelector("nav");
    expect(nav, "下のタブが見つからない").toBeTruthy();
    const labels = [...nav.querySelectorAll("button")].map((b) => b.textContent.replace(/\s/g, ""));
    expect(labels).toHaveLength(5);
    for (const name of ["ホーム", "トレーニング", "記録", "カレンダー", "マイページ"]) {
      expect(labels.some((l) => l.includes(name)), `${name} のタブが無い`).toBe(true);
    }

    const go = async (name) => {
      const b = [...nav.querySelectorAll("button")].find((x) => x.textContent.includes(name));
      await act(async () => b.click());
    };

    /* 種目の一覧は「トレーニング」に移した */
    await go("トレーニング");
    expect(el.textContent).toContain("① ウォームアップ");
    expect(el.textContent).toContain("③ 有酸素");

    /* からだの記録とカレンダーは別の入口になった */
    await go("カレンダー");
    expect(el.textContent).toContain("日付をタップすると");

    await go("記録");
    expect(el.textContent).toContain("あつめたバッジ");
    /* カレンダーは記録の画面には出さない */
    expect(el.textContent).not.toContain("日付をタップすると");

    await go("マイページ");
    expect(el.textContent).toContain("すべての記録を消す");
    /* settings.js に足した設定が、ちゃんと画面に出ているか。
       ここが抜けると「保存も検証もされるのに、誰も触れない設定」になる */
    for (const label of ["声で案内する", "週の目標", "連続日数の保護"]) {
      expect(el.textContent, `${label} が設定画面に無い`).toContain(label);
    }

    await go("ホーム");
    expect(el.textContent).toContain("今日のメニュー");

    await act(async () => root.unmount());
  });
});

describe("バッジ（v18.6 で追加）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  /* すでに何日か記録がある状態を作る */
  const withHistory = (days) => {
    const log = {};
    const today = new Date();
    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      log[k] = { ex: { squat: 3 }, done: true };
    }
    window.localStorage.setItem("hometrain:log:v1", JSON.stringify(log));
  };

  it("すでに記録がある人（badgeSeen が無い）を開いても、お祝いは出ない", async () => {
    /* この仕組みを入れる前から使っていた人に、持っている段ぜんぶを
       「たったいま入手した」と一気に見せてはいけない */
    window.localStorage.setItem("hometrain:core:v1", JSON.stringify({
      name: "ながねん", profile: PROFILE, plan: buildPlan(PROFILE), consent: CONSENT,
    }));
    withHistory(60);

    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));

    expect(el.textContent).not.toContain("入手しました");

    await act(async () => root.unmount());
  });

  it("基準より段が上がっていれば、ホームでお祝いする", async () => {
    window.localStorage.setItem("hometrain:core:v1", JSON.stringify({
      name: "さくら", profile: PROFILE, plan: buildPlan(PROFILE), consent: CONSENT,
      badgeSeen: { streak: 0, count: 0, notes: 0, photos: 0, areas: 0, weight: 0 },
    }));
    withHistory(8);

    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<App />));

    expect(el.textContent).toContain("入手しました");
    expect(el.textContent).toContain("1週間つづいた");

    /* タップで消せる */
    const close = [...el.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "バッジのお知らせをとじる");
    expect(close, "とじるボタンが見つからない").toBeTruthy();
    await act(async () => close.click());
    expect(el.textContent).not.toContain("入手しました");

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
