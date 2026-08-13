import { useState, useEffect, useRef } from "react";
import { Fig, FigStyles } from "./Fig.jsx";
import { EX, PHASE_META, phaseOf } from "../exercises.js";
import { useCountdown, useWakeLock } from "../hooks.js";
import { spec, specText, timerSec } from "../logic/progress.js";
import { signal, tick } from "../sound.js";
import { BODY, C, DISPLAY, DOTS, card, sticker } from "../tokens.js";
import { REST_SEC, mmss } from "../utils.js";

/* ================= 種目詳細＋タイマー＋セット ================= */
function ExerciseDetail({ id, lv, stage, half, sets, target, restSec = REST_SEC, onAdd, onClose }) {
  const ex = EX[id];
  const sp = spec(ex, lv, stage, half);
  const [resting, setResting] = useState(false);
  const { endAt, remain, start, stop } = useCountdown();
  const lastTick = useRef(null);

  const isTime = ex.type === "time";
  const dur = resting ? restSec : timerSec(ex, sp);
  const shown = endAt == null ? dur : remain;

  /* タイマー中は画面を消さない */
  useWakeLock(endAt != null);

  /* 残り3・2・1を小さい音で刻む */
  useEffect(() => {
    if (endAt == null || remain == null) { lastTick.current = null; return; }
    if (remain > 3 || remain <= 0 || lastTick.current === remain) return;
    lastTick.current = remain;
    tick();
  }, [remain, endAt]);

  /* 0になったときの処理。setState の中ではなく effect で行う（二重加算を防ぐ） */
  useEffect(() => {
    if (endAt == null || remain == null || remain > 0) return;
    stop();
    if (resting) { setResting(false); signal(false); return; }
    signal(true);
    onAdd(1);
    if (sets + 1 < target) { setResting(true); start(restSec); }
  }, [remain, endAt]);

  const ratio = endAt == null ? 1 : shown / dur;
  const R = 58, circ = 2 * Math.PI * R;

  return (
    <div className="min-h-screen"
      style={{
        background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY, minHeight: "100dvh",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
      }}>
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
              style={{ background: sets >= target ? C.line : C.pink, color: C.ink, ...sticker(sets >= target ? C.line : "#E96A97") }}
              className="fx w-14 h-14 rounded-full text-2xl font-bold">＋</button>
          </div>
          {sets >= target && (
            <p style={{ color: C.mintText, fontFamily: DISPLAY }} className="text-sm font-bold text-center mt-4">この種目は完了です 🎉</p>
          )}
        </div>

        {/* タイマー（秒数種目のみ） */}
        {isTime && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-6 mb-4 flex flex-col items-center">
            <p style={{ color: resting ? C.lavText : C.muted }} className="text-xs mb-3 font-bold">
              {resting ? `休憩中（${restSec}秒）` : "タイマー"}
            </p>
            <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
              <circle cx="75" cy="75" r={R} fill="none" stroke={C.line} strokeWidth="11" />
              <circle cx="75" cy="75" r={R} fill="none" stroke={resting ? C.lav : C.pink} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 75 75)"
                style={{ transition: "stroke-dashoffset .3s linear" }} />
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
              <button onClick={() => (endAt ? stop() : start(dur))}
                style={{ background: endAt ? C.lav : C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker(endAt ? "#8C6BD6" : "#E96A97") }}
                className="fx rounded-full py-3 text-sm font-bold">
                {endAt ? "一時停止" : resting ? "休憩をはじめる" : "スタート"}
              </button>
            </div>
            <p style={{ color: C.muted }} className="text-xs mt-4 text-center leading-relaxed">
              0になると1セット加算され、そのまま{restSec}秒の休憩が始まります（長さは設定で変えられます）。
              {ex.perSide && `左右あわせた長さです。半分（${sp.amount}秒）たったら反対側に替えてください。`}
            </p>
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
          style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">
          今日のメニューに戻る
        </button>
      </div>
    </div>
  );
}

export { ExerciseDetail };
