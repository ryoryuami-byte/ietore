/* 不具合の記録。
   外部へ送らない代わりに、端末の中で確実に残ることを確かめる。 */
import { describe, it, expect, beforeEach } from "vitest";
import { clearCrashes, crashText, listCrashes, recordCrash } from "./crashLog.js";

describe("不具合の記録", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await clearCrashes();
  });

  it("記録が無いときは空", async () => {
    expect(await listCrashes()).toEqual([]);
  });

  it("落ちた内容を残せる", async () => {
    await recordCrash(new Error("なにかが壊れた"), { componentStack: "at LogView" });
    const list = await listCrashes();
    expect(list).toHaveLength(1);
    expect(list[0].message).toBe("なにかが壊れた");
    expect(list[0].component).toContain("LogView");
    expect(list[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("新しいものが先頭に来る", async () => {
    await recordCrash(new Error("1つめ"));
    await recordCrash(new Error("2つめ"));
    expect((await listCrashes()).map((c) => c.message)).toEqual(["2つめ", "1つめ"]);
  });

  it("5件を超えると、古いものから捨てる", async () => {
    for (let i = 1; i <= 8; i++) await recordCrash(new Error(`${i}件目`));
    const list = await listCrashes();
    expect(list).toHaveLength(5);
    expect(list[0].message).toBe("8件目");
    expect(list[4].message).toBe("4件目");
  });

  it("長すぎる内容は切り詰める（保存領域を食いつぶさない）", async () => {
    const err = new Error("あ".repeat(1000));
    err.stack = "い".repeat(5000);
    await recordCrash(err);
    const [c] = await listCrashes();
    expect(c.message.length).toBeLessThanOrEqual(300);
    expect(c.stack.length).toBeLessThanOrEqual(1200);
  });

  it("個人が分かるものを入れない", async () => {
    /* 記録するのは日時・版・種別・メッセージ・場所だけ。
       名前・体重・写真・メモの入る余地がないことを、鍵の一覧で確かめる */
    await recordCrash(new Error("x"));
    const [c] = await listCrashes();
    expect(Object.keys(c).sort()).toEqual(["at", "component", "message", "platform", "stack", "v"]);
  });

  it("消せる", async () => {
    await recordCrash(new Error("x"));
    await clearCrashes();
    expect(await listCrashes()).toEqual([]);
  });

  it("Error でないものを渡されても落ちない", async () => {
    for (const bad of ["文字列", null, undefined, 42, {}]) {
      await expect(recordCrash(bad)).resolves.toBeTruthy();
    }
  });

  it("そのまま送れる文面になる", async () => {
    await recordCrash(new Error("なにかが壊れた"));
    const text = crashText(await listCrashes());
    expect(text).toContain("1件目");
    expect(text).toContain("なにかが壊れた");
    expect(text).toContain("版:");
  });

  it("記録が無いときの文面は空", () => {
    expect(crashText([])).toBe("");
    expect(crashText(null)).toBe("");
  });
});
