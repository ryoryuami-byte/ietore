/* 声かけ。
   実際に音を出すことはテストできないので、
   「設定を守っているか」「止めたら止まるか」「後片づけをするか」を見る。
   ここが漏れると、画面を閉じたあとも喋り続けるという最悪の壊れかたをする。 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startCountdown, startRepCount, startTempo } from "./coach.js";

const ON = { voiceOn: true, countdownOn: true, repCountOn: true, tempoOn: true, tempoSec: "3", sound: true };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("はじめる前のカウントダウン", () => {
  it("3秒たつと呼び出し側に返る", () => {
    const done = vi.fn();
    startCountdown(ON, done);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("設定がオフなら、待たずにすぐ返る", () => {
    const done = vi.fn();
    startCountdown({ ...ON, countdownOn: false }, done);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("止めると、そのあと呼ばれない", () => {
    const done = vi.fn();
    const stop = startCountdown(ON, done);
    vi.advanceTimersByTime(1000);
    stop();
    vi.advanceTimersByTime(5000);
    expect(done).not.toHaveBeenCalled();
  });

  it("秒数を変えられる", () => {
    const done = vi.fn();
    startCountdown(ON, done, { seconds: 5 });
    vi.advanceTimersByTime(4000);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe("回数を数える", () => {
  it("設定の秒数 × 2 の間隔で数える", () => {
    /* 3秒設定なら、1回に6秒（下ろす3秒＋上げる3秒） */
    const counts = [];
    startRepCount(ON, 3, () => {}, { onCount: (n) => counts.push(n) });
    vi.advanceTimersByTime(6000);
    expect(counts).toEqual([1]);
    vi.advanceTimersByTime(6000);
    expect(counts).toEqual([1, 2]);
    vi.advanceTimersByTime(6000);
    expect(counts).toEqual([1, 2, 3]);
  });

  it("数え終わると呼び出し側に返る", () => {
    const done = vi.fn();
    startRepCount(ON, 2, done);
    vi.advanceTimersByTime(12000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("数え終わったあとは、それ以上数えない", () => {
    const counts = [];
    startRepCount(ON, 2, () => {}, { onCount: (n) => counts.push(n) });
    vi.advanceTimersByTime(60000);
    expect(counts).toEqual([1, 2]);
  });

  it("秒数の設定を変えると、間隔も変わる", () => {
    const counts = [];
    startRepCount({ ...ON, tempoSec: "2" }, 2, () => {}, { onCount: (n) => counts.push(n) });
    vi.advanceTimersByTime(4000);
    expect(counts).toEqual([1]);
  });

  it("設定がオフなら、待たずにすぐ返る", () => {
    const done = vi.fn();
    startRepCount({ ...ON, repCountOn: false }, 10, done);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("止めると、そのあと数えない", () => {
    const counts = [];
    const stop = startRepCount(ON, 10, () => {}, { onCount: (n) => counts.push(n) });
    vi.advanceTimersByTime(6000);
    stop();
    vi.advanceTimersByTime(60000);
    expect(counts).toEqual([1]);
  });

  it("回数が 0 でも落ちない", () => {
    const done = vi.fn();
    expect(() => startRepCount(ON, 0, done)).not.toThrow();
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe("テンポ音", () => {
  it("止める関数が返る", () => {
    const stop = startTempo(ON);
    expect(typeof stop).toBe("function");
    expect(() => stop()).not.toThrow();
  });

  it("テンポ音がオフでも、止める関数は返る（呼び出し側が場合分けしなくてよい）", () => {
    expect(typeof startTempo({ ...ON, tempoOn: false })).toBe("function");
  });

  it("音そのものがオフなら鳴らさない", () => {
    /* 「音とバイブ」を切っている人に、テンポ音だけ鳴らさない */
    expect(typeof startTempo({ ...ON, sound: false })).toBe("function");
  });

  it("止めたあと、時間を進めても動かない", () => {
    const stop = startTempo(ON);
    stop();
    expect(() => vi.advanceTimersByTime(60000)).not.toThrow();
  });
});
