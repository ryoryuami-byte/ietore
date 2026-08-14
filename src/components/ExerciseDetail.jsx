import { useState, useEffect, useRef } from "react";
import { Fig, FigStyles } from "./Fig.jsx";
import {
  sayDone, sayExercise, sayRemain, sayRest, saySwitchSide,
  startCountdown, startRepCount, startTempo,
} from "../coach.js";
import { EX, PHASE_META, phaseOf } from "../exercises.js";
import { useCountdown, useWakeLock } from "../hooks.js";
import { bestOf, lastDoneOf } from "../logic/history.js";
import { spec, specText, timerSec } from "../logic/progress.js";
import { signal, tick } from "../sound.js";
import { cancelSpeech } from "../speech.js";
import { C, card, DISPLAY, page, sticker } from "../tokens.js";
import { REST_SEC, mmss } from "../utils.js";

/* ================= 種目詳細＋タイマー＋セット ================= */
function ExerciseDetail({ id, lv, stage, half, sets, target, restSec = REST_SEC, core = {},
  log = {}, todayKey, swaps, onAdd, onSwap, onClose }) {
  const ex = EX[id];
  const sp = spec(ex, lv, stage, half);
  const [resting, setResting] = useState(false);
  const { endAt, remain, start, stop } = useCountdown();
  const lastTick = useRef(null);
  const lastSay = useRef(null);
  const halfSaid = useRef(false);

  /* 声かけ（カウントダウン・回数を数える・テンポ音）は coach.js が受け持つ。
     ここは「いつ呼ぶか」だけを決める */
  const [counting, setCounting] = useState(0); /* 0=していない / n=n回目 */
  const stopCoach = useRef(null);
  const runCoach = (fn) => { stopCoach.current?.(); stopCoach.current = fn; };
  useEffect(() => () => stopCoach.current?.(), []);

  const isTime = ex.type === "time";
  const dur = resting ? restSec : timerSec(ex, sp);
  const shown = endAt == null ? dur : remain;

  /* タイマー中は画面を消さない */
  useWakeLock(endAt != null || counting > 0);

  /* 開いたときに、これから何をやるかを読み上げる */
  useEffect(() => {
    sayExercise(core, id, sp);
    return () => cancelSpeech();
    /* 種目が変わったときだけ。設定の変更で言い直さない */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* 残り3・2・1を小さい音で刻む。節目は声でも知らせる */
  useEffect(() => {
    if (endAt == null || remain == null) { lastTick.current = null; lastSay.current = null; return; }
    if (!resting && lastSay.current !== remain) {
      lastSay.current = remain;
      sayRemain(core, remain);
      /* 左右の種目は、半分たったところで切り替えを伝える */
      if (ex.perSide && !halfSaid.current && remain === sp.amount) {
        halfSaid.current = true;
        saySwitchSide(core);
      }
    }
    if (remain > 3 || remain <= 0 || lastTick.current === remain) return;
    lastTick.current = remain;
    tick();
  }, [remain, endAt, resting, core, ex.perSide, sp.amount]);

  /* 0になったときの処理。setState の中ではなく effect で行う（二重加算を防ぐ） */
  useEffect(() => {
    if (endAt == null || remain == null || remain > 0) return;
    stop();
    if (resting) { setResting(false); signal(false); return; }
    signal(true);
    onAdd(1);
    halfSaid.current = false;
    if (sets + 1 < target) {
      setResting(true);
      start(restSec);
      sayRest(core, restSec);
    } else {
      sayDone(core);
    }
  }, [remain, endAt]);

  /* 「3、2、1、はじめ」のあとにタイマー／回数数えを始める */
  const beginTimed = () => {
    runCoach(startCountdown(core, () => {
      stopCoach.current = null;
      start(dur);
    }));
  };

  const beginReps = () => {
    runCoach(startCountdown(core, () => {
      const stopTempo = startTempo(core);
      const stopCount = startRepCount(core, sp.amount, () => {
        stopTempo();
        setCounting(0);
        stopCoach.current = null;
        signal(true);
        onAdd(1);
      }, { onCount: setCounting });
      stopCoach.current = () => { stopTempo(); stopCount(); setCounting(0); };
    }));
    setCounting(1);
  };

  const stopReps = () => { stopCoach.current?.(); stopCoach.current = null; setCounting(0); };

  /* 前回と自己ベスト。データはすでに記録の中にある。出していなかっただけ */
  const prev = lastDoneOf(log, id, todayKey);
  const best = bestOf(log, id);
  const unit = ex.type === "time" ? "秒" : "回";
  const isBest = best && sp.amount > best.amount;

  const ratio = endAt == null ? 1 : shown / dur;
  const R = 58, circ = 2 * Math.PI * R;

  return (
    <div className="min-h-screen"
      style={{ ...page(), paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}>
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-6">
        <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm mb-4 font-bold">‹ 今日のメニューへ</button>

        <div className="flex flex-col items-center mb-5">
          <Fig kind={ex.fig} size={140} />
          <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-xs font-bold mt-3">{PHASE_META[phaseOf(id)].label}</p>
          <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mt-1">{ex.name}</h1>
          <p style={{ color: C.pinkDeep }} className="text-sm font-bold mt-1">{specText(ex, lv, stage, half)}</p>
          {half && <p style={{ color: C.lavText }} className="text-xs font-bold mt-1">短縮メニュー（いつもの半分）</p>}
        </div>

        {/* セット */}
        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ color: C.muted }} className="text-xs mb-3">やったセット数</p>
          <div className="flex items-center justify-between">
            <button onClick={() => onAdd(-1)} disabled={sets <= 0} aria-label="1セット減らす"
              style={{ borderColor: sets <= 0 ? C.line : C.lineDeep, color: sets <= 0 ? C.line : C.muted }}
              className="fx border-2 w-14 h-14 rounded-full text-2xl font-bold">−</button>
            <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold">
              {sets}<span style={{ color: C.muted }} className="text-xl"> / {target}</span>
            </p>
            <button onClick={() => onAdd(1)} disabled={sets >= target} aria-label="1セット記録する"
              style={{ background: sets >= target ? C.line : C.pinkBtn, color: sets >= target ? C.muted : "#fff", ...sticker(sets >= target ? C.line : C.pinkEdge) }}
              className="fx w-14 h-14 rounded-full text-2xl font-bold">＋</button>
          </div>
          {sets >= target && (
            <p style={{ color: C.mintText, fontFamily: DISPLAY }} className="text-sm font-bold text-center mt-4">この種目は完了です 🎉</p>
          )}
        </div>

        {/* 前回と自己ベスト。「続けて何か変わったのか」がここで初めて見える */}
        {(prev || best) && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-4 mb-4 flex gap-4">
            {prev && (
              <div className="flex-1 min-w-0">
                <p style={{ color: C.muted }} className="text-xs mb-1">前回（{prev.date.slice(5).replace("-", "/")}）</p>
                <p style={{ fontFamily: DISPLAY }} className="text-base font-bold">
                  {prev.amount}{unit} × {prev.sets}セット
                </p>
              </div>
            )}
            {best && (
              <div className="flex-1 min-w-0">
                <p style={{ color: C.muted }} className="text-xs mb-1">自己ベスト</p>
                <p style={{ fontFamily: DISPLAY, color: isBest ? C.mintText : C.ink }} className="text-base font-bold">
                  {best.amount}{unit} × {best.sets}セット
                </p>
              </div>
            )}
          </div>
        )}
        {isBest && (
          <div style={{ background: C.mintSoft, color: C.mintText }}
            className="rounded-2xl px-5 py-3 mb-4 text-sm font-bold text-center">
            今日やりきれば、自己ベスト更新です 🏆
          </div>
        )}

        {/* タイマー（秒数種目のみ） */}
        {isTime && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-6 mb-4 flex flex-col items-center">
            <p style={{ color: resting ? C.lavText : C.muted }} className="text-xs mb-3 font-bold">
              {resting ? `休憩中（${restSec}秒）` : "タイマー"}
            </p>
            <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
              <circle cx="75" cy="75" r={R} fill="none" style={{ stroke: C.line }} strokeWidth="11" />
              <circle cx="75" cy="75" r={R} fill="none" strokeWidth="11" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 75 75)"
                style={{ stroke: resting ? C.lav : C.pink, transition: "stroke-dashoffset .3s linear" }} />
              <text x="75" y="86" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, fill: C.ink }}>
                {shown >= 60 ? mmss(shown) : shown}
              </text>
            </svg>
            {/* 毎秒読み上げると邪魔になるので、節目だけ知らせる */}
            <p aria-live="polite" className="sr-only">
              {endAt == null ? "" : shown <= 3 || shown % 30 === 0 ? `残り ${shown} 秒` : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-5">
              <button onClick={() => { stop(); setResting(false); }}
                style={{ borderColor: C.lineDeep, color: C.muted }}
                className="fx border-2 rounded-full py-3 text-sm font-bold">リセット</button>
              <button onClick={() => (endAt ? stop() : resting ? start(dur) : beginTimed())}
                style={{ background: endAt ? C.lavText : C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(endAt ? C.lavEdge : C.pinkEdge) }}
                className="fx rounded-full py-3 text-sm font-bold">
                {endAt ? "一時停止" : resting ? "休憩をはじめる" : "スタート"}
              </button>
            </div>

            {/* 休憩は待つだけの時間なので、待ちたくない人のために出口を作る */}
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
            <p style={{ color: C.muted }} className="text-xs mt-4 text-center leading-relaxed">
              0になると1セット加算され、そのまま{restSec}秒の休憩が始まります（長さは設定で変えられます）。
              {ex.perSide && `左右あわせた長さです。半分（${sp.amount}秒）たったら反対側に替えてください。`}
            </p>
          </div>
        )}

        {/* 回数の種目：テンポに合わせて数えてもらう */}
        {!isTime && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-6 mb-4 flex flex-col items-center">
            <p style={{ color: C.muted }} className="text-xs mb-3 font-bold">
              {counting > 0 ? "数えています" : "数えてもらう"}
            </p>
            <p style={{ fontFamily: DISPLAY }} className="text-5xl font-bold leading-none mb-1">
              {counting > 0 ? counting : "–"}
              <span style={{ color: C.muted }} className="text-xl"> / {sp.amount}</span>
            </p>
            <p aria-live="polite" className="sr-only">{counting > 0 ? `${counting}回目` : ""}</p>
            <button onClick={() => (counting > 0 ? stopReps() : beginReps())}
              style={counting > 0
                ? { background: C.lavBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.lavBtn) }
                : { background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }}
              className="fx w-full rounded-full py-3 text-sm font-bold mt-4">
              {counting > 0 ? "やめる" : "はじめる"}
            </button>
            <p style={{ color: C.muted }} className="text-xs mt-4 text-center leading-relaxed">
              テンポに合わせて数えます。数え終わると1セット記録されます。
              {ex.perSide && "左右それぞれで1回ずつ行ってください。"}
              声と音は、せっていの「動きながら使う」で変えられます。
            </p>
          </div>
        )}

        {/* この種目だけ替える。日ごとの入れ替えでは粗すぎる場面のため */}
        {onSwap && (swaps?.easier || swaps?.harder || swaps?.other) && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-4 mb-4">
            <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1">この種目を替える</p>
            <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
              ほかの種目はそのままです。今日だけの変更ではなく、この曜日の予定が変わります。
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onSwap(-1)} disabled={!swaps.easier}
                style={{ borderColor: swaps.easier ? C.lineDeep : C.line, color: swaps.easier ? C.muted : C.line }}
                className="fx border-2 rounded-2xl py-3 text-xs font-bold">やさしく</button>
              <button onClick={() => onSwap(0)} disabled={!swaps.other}
                style={{ borderColor: swaps.other ? C.lineDeep : C.line, color: swaps.other ? C.muted : C.line }}
                className="fx border-2 rounded-2xl py-3 text-xs font-bold">別のもの</button>
              <button onClick={() => onSwap(1)} disabled={!swaps.harder}
                style={{ borderColor: swaps.harder ? C.lineDeep : C.line, color: swaps.harder ? C.muted : C.line }}
                className="fx border-2 rounded-2xl py-3 text-xs font-bold">きつく</button>
            </div>
          </div>
        )}

        {/* コツ */}
        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-3">やり方のコツ</p>
          <ol className="grid gap-2.5">
            {ex.tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span style={{ background: C.bg, color: C.pinkDeep, fontFamily: DISPLAY }}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-sm font-bold mb-2">⚠️ よくある間違い</p>
          <p className="text-sm leading-relaxed mb-4">{ex.ng}</p>
          <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-sm font-bold mb-2">🌱 きついときは</p>
          <p className="text-sm leading-relaxed">{ex.adjust}</p>
        </div>

        <button onClick={onClose}
          style={{ background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }}
          className="fx w-full rounded-full py-4 text-base font-bold">
          今日のメニューに戻る
        </button>
      </div>
    </div>
  );
}

export { ExerciseDetail };
