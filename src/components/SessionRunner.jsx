import { useState, useEffect, useRef } from "react";
import { Fig } from "./Fig.jsx";
import {
  sayDone, sayExercise, sayRemain, sayRest, saySwitchSide,
  startCountdown, startRepCount, startTempo,
} from "../coach.js";
import { EX, PHASE_META, phaseOf } from "../exercises.js";
import { useBodyLock, useCountdown, useWakeLock } from "../hooks.js";
import { spec, specText, timerSec } from "../logic/progress.js";
import { signal, tick } from "../sound.js";
import { cancelSpeech } from "../speech.js";
import { BODY, C, DISPLAY, DOTS, sticker } from "../tokens.js";
import { REST_SEC, mmss } from "../utils.js";

/* ================= 連続モード ================= */
function SessionRunner({ ids, lv, stage, half, restSec = REST_SEC, core = {}, done, onSet, onClose, onFinishAll }) {
  const specOf = (x) => spec(EX[x], lv, stage, half);
  const [i, setI] = useState(() => {
    const f = ids.findIndex((x) => (done[x] ?? 0) < specOf(x).sets);
    return f < 0 ? 0 : f;
  });
  const [resting, setResting] = useState(false);
  const { endAt, remain, start, stop } = useCountdown();
  const lastTick = useRef(null);
  const lastSay = useRef(null);
  const halfSaid = useRef(false);

  /* 声かけは coach.js が受け持つ。ここは「いつ呼ぶか」だけ */
  const [counting, setCounting] = useState(0);
  const stopCoach = useRef(null);
  const runCoach = (fn) => { stopCoach.current?.(); stopCoach.current = fn; };
  useEffect(() => () => { stopCoach.current?.(); cancelSpeech(); }, []);

  /* 連続モードの間はずっと画面を消さない */
  useWakeLock(true);
  useBodyLock();

  const id = ids[i];
  const ex = EX[id];
  const sp = specOf(id);
  const setsDone = done[id] ?? 0;
  const isTime = ex.type === "time";
  const dur = resting ? restSec : timerSec(ex, sp);
  const shown = endAt == null ? dur : remain;

  useEffect(() => {
    if (endAt == null || remain == null) { lastTick.current = null; lastSay.current = null; return; }
    if (!resting && lastSay.current !== remain) {
      lastSay.current = remain;
      sayRemain(core, remain);
      if (ex.perSide && !halfSaid.current && remain === sp.amount) {
        halfSaid.current = true;
        saySwitchSide(core);
      }
    }
    if (remain > 3 || remain <= 0 || lastTick.current === remain) return;
    lastTick.current = remain;
    tick();
  }, [remain, endAt, resting, core, ex.perSide, sp.amount]);

  useEffect(() => {
    if (endAt == null || remain == null || remain > 0) return;
    stop();
    if (resting) { setResting(false); signal(false); return; }
    signal(true);
    onSet(id, 1);
    halfSaid.current = false;
    if (setsDone + 1 < sp.sets) {
      setResting(true);
      start(restSec);
      sayRest(core, restSec);
    } else {
      sayDone(core);
    }
  }, [remain, endAt]);

  /* 種目が切り替わったら、次に何をやるかを読み上げる */
  useEffect(() => {
    stopCoach.current?.();
    stopCoach.current = null;
    setCounting(0);
    halfSaid.current = false;
    sayExercise(core, id, sp);
    /* 種目が変わったときだけ。設定の変更で言い直さない */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const beginTimed = () => {
    runCoach(startCountdown(core, () => { stopCoach.current = null; start(dur); }));
  };

  const beginReps = () => {
    runCoach(startCountdown(core, () => {
      const stopTempo = startTempo(core);
      const stopCount = startRepCount(core, sp.amount, () => {
        stopTempo();
        setCounting(0);
        stopCoach.current = null;
        signal(true);
        onSet(id, 1);
      }, { onCount: setCounting });
      stopCoach.current = () => { stopTempo(); stopCount(); setCounting(0); };
    }));
    setCounting(1);
  };

  const stopReps = () => { stopCoach.current?.(); stopCoach.current = null; setCounting(0); };

  const allDone = ids.every((x) => (done[x] ?? 0) >= specOf(x).sets);
  const thisDone = setsDone >= sp.sets;
  const R = 62, circ = 2 * Math.PI * R;
  const ratio = endAt == null ? 1 : shown / dur;

  const goNext = () => {
    stopCoach.current?.(); stopCoach.current = null; setCounting(0);
    stop(); setResting(false);
    if (i + 1 < ids.length) setI(i + 1);
    else onFinishAll(allDone); /* 未達なら完了扱いにしない */
  };

  return (
    <div style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY }} className="fixed inset-0 z-20 overflow-y-auto">
      <div className="max-w-md mx-auto px-5 pt-6 min-h-full flex flex-col"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm font-bold">閉じる</button>
          <p style={{ color: C.muted }} className="text-xs">{i + 1} / {ids.length} 種目</p>
        </div>

        <div className="flex gap-1 mb-6" aria-hidden="true">
          {ids.map((x, n) => {
            const d = (done[x] ?? 0) >= specOf(x).sets;
            return <div key={x} style={{ background: d ? C.mint : n === i ? C.pinkDeep : C.line }} className="h-1.5 flex-1 rounded-full" />;
          })}
        </div>

        <div className="flex flex-col items-center grow">
          <Fig kind={ex.fig} size={150} />
          <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-xs font-bold mt-3">{PHASE_META[phaseOf(id)].label}</p>
          <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mt-1 text-center">{ex.name}</h1>
          <p style={{ color: C.pinkDeep }} className="text-sm font-bold mt-1 mb-5">{specText(ex, lv, stage, half)}</p>

          {isTime ? (
            <>
              <p style={{ color: resting ? C.lavText : C.muted }} className="text-xs font-bold mb-2">
                {resting ? `休憩中（${restSec}秒）` : `${Math.min(setsDone + 1, sp.sets)}セット目`}
              </p>
              <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r={R} fill="none" stroke={C.line} strokeWidth="12" />
                <circle cx="80" cy="80" r={R} fill="none" stroke={resting ? C.lav : C.pink} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset .3s linear" }} />
                <text x="80" y="92" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, fill: C.ink }}>
                  {shown >= 60 ? mmss(shown) : shown}
                </text>
              </svg>
              <button onClick={() => (endAt ? stop() : resting ? start(dur) : beginTimed())} disabled={thisDone && !resting}
                style={{ background: thisDone && !resting ? C.line : endAt ? C.lav : C.pink, color: thisDone && !resting ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(thisDone && !resting ? C.line : endAt ? "#8C6BD6" : "#E96A97") }}
                className="fx w-full rounded-full py-4 text-base font-bold mt-5">
                {thisDone && !resting ? "この種目は完了" : endAt ? "一時停止" : resting ? "休憩をはじめる" : "スタート"}
              </button>
              {resting && endAt != null && (
                <div className="grid grid-cols-2 gap-3 w-full mt-3">
                  <button onClick={() => { stop(); setResting(false); }}
                    style={{ borderColor: C.lineDeep, color: C.muted }}
                    className="fx border-2 rounded-full py-2.5 text-xs font-bold">休憩をとばす</button>
                  <button onClick={() => start(remain + 15)}
                    style={{ borderColor: C.lineDeep, color: C.muted }}
                    className="fx border-2 rounded-full py-2.5 text-xs font-bold">＋15秒</button>
                </div>
              )}
              {ex.perSide && !resting && (
                <p style={{ color: C.muted }} className="text-xs mt-3 text-center leading-relaxed">
                  左右あわせた長さです。半分（{sp.amount}秒）たったら反対側に替えてください。
                </p>
              )}
              <button onClick={() => { onSet(id, 1); stop(); setResting(false); }} disabled={thisDone}
                style={{ color: thisDone ? C.line : C.muted }} className="fx text-xs mt-3 underline">
                タイマーを使わずに1セット記録
              </button>
            </>
          ) : (
            <>
              <p style={{ fontFamily: DISPLAY }} className="text-5xl font-bold mb-1">
                {setsDone}<span style={{ color: C.muted }} className="text-2xl"> / {sp.sets}</span>
              </p>
              <p style={{ color: C.muted }} className="text-xs mb-5">セット</p>
              {counting > 0 ? (
                <>
                  <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-6xl font-bold leading-none mb-1">
                    {counting}<span style={{ color: C.muted }} className="text-2xl"> / {sp.amount}</span>
                  </p>
                  <p aria-live="polite" className="sr-only">{counting}回目</p>
                  <button onClick={stopReps}
                    style={{ background: C.lav, color: C.ink, fontFamily: DISPLAY, ...sticker("#8C6BD6") }}
                    className="fx w-full rounded-full py-4 text-base font-bold mt-4">やめる</button>
                </>
              ) : (
                <>
                  <button onClick={() => { onSet(id, 1); signal(setsDone + 1 >= sp.sets); }} disabled={thisDone}
                    style={{ background: thisDone ? C.line : C.pink, color: thisDone ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(thisDone ? C.line : "#E96A97") }}
                    className="fx w-full rounded-full py-5 text-lg font-bold">
                    {thisDone ? "この種目は完了" : "1セット できた"}
                  </button>
                  {!thisDone && (
                    <button onClick={beginReps}
                      style={{ borderColor: C.lineDeep, color: C.muted }}
                      className="fx w-full border-2 rounded-full py-3 text-sm font-bold mt-3">
                      🔊 数えてもらう（{sp.amount}回）
                    </button>
                  )}
                </>
              )}
            </>
          )}

          <div style={{ background: C.surface, borderColor: C.line }} className="border-2 rounded-3xl px-5 py-4 mt-6 w-full">
            <p style={{ fontFamily: DISPLAY }} className="text-xs font-bold mb-2">コツ</p>
            <ul className="grid gap-1.5">
              {ex.tips.map((t, n) => (
                <li key={n} style={{ color: C.muted }} className="text-xs leading-relaxed">・{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={() => { stop(); setResting(false); setI(Math.max(0, i - 1)); }} disabled={i === 0}
            style={{ borderColor: i === 0 ? C.line : C.lineDeep, color: i === 0 ? C.line : C.muted }}
            className="fx border-2 rounded-full py-3 text-sm font-bold">‹ まえ</button>
          <button onClick={goNext}
            style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
            className="fx rounded-full py-3 text-sm font-bold">
            {i + 1 < ids.length ? "つぎへ ›" : allDone ? "おわる" : "ここまでにする"}
          </button>
        </div>
        {i + 1 === ids.length && !allDone && (
          <p style={{ color: C.muted }} className="text-xs text-center mt-3 leading-relaxed">
            まだ残っている種目があります。ここでやめても、やったぶんは記録に残ります。
          </p>
        )}
      </div>
    </div>
  );
}

export { SessionRunner };
