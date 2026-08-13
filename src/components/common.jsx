import { useState, useMemo } from "react";
import { Fig } from "./Fig.jsx";
import { EX, FOCUS_META } from "../exercises.js";
import { useBodyLock } from "../hooks.js";
import { lvMeta, specText } from "../logic/progress.js";
import { BODY, C, DISPLAY, card, sticker } from "../tokens.js";
import { DAY_JP } from "../utils.js";

/* ================= 画面パーツ ================= */
function Center({ children }) {
  return (
    <div style={{ background: C.bg, color: C.muted, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen flex items-center justify-center text-sm">
      {children}
    </div>
  );
}

function Header({ name, dow, meta, pct, done, total, streak, weeks, sealed, rest, lv, stage, half }) {
  const R = 32, circ = 2 * Math.PI * R;
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5">
      <p style={{ color: C.muted }} className="text-xs mb-3">こんにちは、{name}さん</p>
      <div className="flex items-center gap-5">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" className="shrink-0">
          <circle cx="42" cy="42" r={R} fill="none" stroke={C.line} strokeWidth="10" />
          <circle cx="42" cy="42" r={R} fill="none" stroke={pct === 100 ? C.mint : C.pink} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 42 42)"
            style={{ transition: "stroke-dashoffset .45s ease" }} />
          <text x="42" y="40" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, fill: C.ink }}>{DAY_JP[dow]}</text>
          <text x="42" y="55" textAnchor="middle" style={{ fontFamily: BODY, fontSize: 11, fill: C.muted }}>{done}/{total}</text>
        </svg>
        <div className="min-w-0">
          <p style={{ color: C.pinkDeep }} className="text-xs mb-1">つづいた週</p>
          <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold leading-none mb-2">{weeks}<span className="text-base ml-1">週</span></p>
          <p style={{ fontFamily: DISPLAY, color: C.ink }} className="text-sm font-bold">{meta.emoji} {meta.label}</p>
        </div>
      </div>
      <div style={{ borderColor: C.line }} className="border-t-2 border-dashed mt-4 pt-3 flex gap-2 flex-wrap">
        <span style={{ background: C.bg, color: C.pinkDeep }} className="text-xs px-3 py-1.5 rounded-full font-bold">🔥 連続 {streak} 日</span>
        {rest && <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🍃 軽めの日</span>}
        <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">{lvMeta(lv).emoji} Lv.{stage + 1}</span>
        {half && <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🌿 短縮</span>}
        {sealed && <span style={{ background: C.bg, color: C.mintText }} className="text-xs px-3 py-1.5 rounded-full font-bold">✓ 今日は完了</span>}
      </div>
    </div>
  );
}

function Section({ title, note, action, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between mb-1 px-1 gap-3">
        <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold shrink-0">{title}</h2>
        {action && (
          <button onClick={action.onClick}
            style={{ background: C.surface, borderColor: C.pinkDeep, color: C.pinkDeep, ...sticker(C.line) }}
            className="fx border-2 rounded-full px-4 py-1.5 text-xs font-bold">
            {action.label}
          </button>
        )}
      </div>
      {note && <p style={{ color: C.muted }} className="text-xs mb-3 px-1">{note}</p>}
      <div className="grid gap-2.5">{children}</div>
    </div>
  );
}

function ExRow({ id, lv, stage, half, sets, target, onOpen, onQuick }) {
  const ex = EX[id];
  const done = sets >= target;
  return (
    <div style={{ background: done ? "#FBFFFD" : C.surface, borderColor: done ? C.mint : C.line, ...sticker(done ? C.mint : C.line) }}
      className="border-2 rounded-3xl px-4 py-3 flex items-center gap-3">
      <button onClick={onOpen} className="fx flex items-center gap-3 flex-1 min-w-0 text-left rounded-2xl">
        <Fig kind={ex.fig} />
        <span className="min-w-0 flex-1">
          <span style={{ fontFamily: DISPLAY, color: C.ink }} className="block text-sm font-bold leading-snug">{ex.name}</span>
          <span style={{ color: C.pinkDeep }} className="block text-xs mt-0.5 font-bold">{specText(ex, lv, stage, half)}</span>
          <span style={{ color: C.muted }} className="block text-xs mt-0.5">
            {ex.type === "time" ? "タップでタイマー・コツ" : "タップでコツを見る"} ›
          </span>
        </span>
      </button>
      <button onClick={onQuick} disabled={done} aria-label={`${ex.name} を1セット記録`}
        style={{ background: done ? C.mint : C.bg, color: C.ink, borderColor: done ? C.mint : C.lineDeep }}
        className={`fx shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center ${done ? "pop" : ""}`}>
        <span style={{ fontFamily: DISPLAY }} className="text-sm font-bold">{done ? "✓" : `${sets}/${target}`}</span>
        {!done && <span className="text-xs" style={{ color: C.muted }}>+1</span>}
      </button>
    </div>
  );
}

function WelcomeBack({ id, lv, stage, weeks, onShort, onFull }) {
  const ex = EX[id];
  return (
    <div className="pt-6">
      <div className="flex justify-center mb-4"><Fig kind={ex.fig} size={90} /></div>
      <h1 style={{ fontFamily: DISPLAY }} className="text-4xl font-bold mb-3 text-center">おかえり</h1>
      <p style={{ color: C.muted }} className="text-sm leading-relaxed mb-7 text-center">
        今日はウォームアップとこの1種目、<br />最後にストレッチだけにしておきます。
      </p>
      <button onClick={onShort} style={card()} className="fx w-full border-2 rounded-3xl px-4 py-4 flex items-center gap-3 text-left">
        <Fig kind={ex.fig} />
        <span>
          <span style={{ fontFamily: DISPLAY }} className="block text-base font-bold">{ex.name}</span>
          <span style={{ color: C.pinkDeep }} className="block text-xs font-bold mt-0.5">
            {specText(ex, lv, stage, true)}（いつもの半分）
          </span>
        </span>
      </button>
      <div className="text-center">
        <button onClick={onFull} style={{ color: C.pinkDeep }} className="fx mt-5 text-sm underline font-bold">今日はフルでやる</button>
      </div>
      <p style={{ color: C.muted }} className="text-xs mt-8 text-center">つづいた週：{weeks}週</p>
    </div>
  );
}

const PRAISE = [
  { big: "やりきった！", sub: "きつい日ほど、やった価値があります。" },
  { big: "えらすぎる", sub: "「今日はやめとこ」に勝ちました。" },
  { big: "最高です", sub: "今日のあなたは、昨日のあなたより強いです。" },
  { big: "よくやった！", sub: "この積み重ねしか効くものはありません。" },
  { big: "天才かも", sub: "続けている人は、実はそんなに多くないです。" },
  { big: "かっこいい", sub: "自分との約束を守れる人は強いです。" },
];

function CheerScreen({ name, streak, weeks, leveledUp, cheers = [], onClose }) {
  useBodyLock();
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], []);
  const letter = useMemo(() => (cheers.length ? cheers[Math.floor(Math.random() * cheers.length)] : null), [cheers]);
  const bits = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: 5 + Math.random() * 90, delay: Math.random() * 0.5,
    color: [C.pink, C.lav, C.mint, C.gold][i % 4],
  })), []);
  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 overflow-hidden z-30" role="dialog" aria-modal="true"
      style={{ background: "rgba(74,50,66,.55)" }}>
      <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none">
        {bits.map((b, i) => (
          <span key={i} className="confetti" style={{ left: `${b.left}%`, bottom: "10%", background: b.color, animationDelay: `${b.delay}s` }} />
        ))}
      </div>
      <div style={{ background: C.surface, fontFamily: BODY }} className="cheer w-full max-w-sm rounded-3xl px-7 py-9 text-center relative">
        <p className="text-6xl mb-3">🎉</p>
        <h2 style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-3xl font-bold mb-3">{praise.big}</h2>
        <p className="text-sm leading-relaxed mb-1">{name}さん、{praise.sub}</p>
        <p style={{ color: C.muted }} className="text-xs mb-5">連続 {streak} 日 ／ つづいた週 {weeks}週</p>
        {letter && (
          <div style={{ background: C.bg }} className="rounded-2xl px-4 py-4 mb-5 text-left">
            <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-xs font-bold mb-1.5">💌 とどいたメッセージ</p>
            <p className="text-sm leading-relaxed">{letter}</p>
          </div>
        )}
        {leveledUp && (
          <div style={{ background: C.bg }} className="rounded-2xl px-4 py-3 mb-5">
            <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-sm font-bold mb-1">⬆️ レベルが上がりました</p>
            <p style={{ color: C.muted }} className="text-xs leading-relaxed">明日から回数と秒数が少し増えます。きつければ「きつかった」を選んでください。量を戻します。</p>
          </div>
        )}
        <button onClick={onClose} style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">ありがとう</button>
      </div>
    </div>
  );
}

function SwapDialog({ current, onClose, onConfirm }) {
  const [pick, setPick] = useState(current);
  const [step, setStep] = useState(0);
  const STEPS = ["本当に変更しますか？", "まじで変えますか？", "変えちゃいますよ？"];
  const list = ["lower", "core", "upper", "cardio", "full", "rest"];
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.45)" }}>
      {/* vh だと iOS でアドレスバーぶん下がはみ出し、決定ボタンが隠れる */}
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh" }} className="w-full max-w-md rounded-t-3xl flex flex-col">
        {step === 0 ? (
          <>
            <div className="px-5 pt-6 pb-3 shrink-0">
              <h3 style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">今日のメニューを入れ替える</h3>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">
                やりたい内容を選んで、下のボタンを押してください。変更は<strong>この曜日に毎週</strong>適用されます（設定から元に戻せます）。
              </p>
            </div>

            <div className="px-5 overflow-y-auto grow">
              <div className="grid gap-2 pb-4" role="radiogroup" aria-label="メニューの種類">
                {list.map((id) => (
                  <button key={id} onClick={() => setPick(id)} role="radio" aria-checked={pick === id}
                    style={{ background: pick === id ? C.bg : C.surface, borderColor: pick === id ? C.pinkDeep : C.lineDeep, ...sticker(pick === id ? C.pink : C.line) }}
                    className="fx border-2 rounded-3xl px-4 py-3 text-left text-sm flex items-center gap-3">
                    <span style={{ background: pick === id ? C.pink : "transparent", borderColor: pick === id ? C.pinkDeep : C.lineDeep, color: C.ink }}
                      className="w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                      {pick === id ? "✓" : ""}
                    </span>
                    <span style={{ fontFamily: DISPLAY }} className="font-bold flex-1">
                      {FOCUS_META[id].emoji} {FOCUS_META[id].label}
                      {id === current && <span style={{ color: C.muted }} className="text-xs font-normal ml-2">いま これ</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderColor: C.line, background: C.surface, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
              className="border-t-2 px-5 pt-4 shrink-0 grid gap-2">
              <button onClick={() => (pick === current ? onClose() : setStep(1))}
                style={{ background: pick === current ? C.line : C.pink, color: pick === current ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(pick === current ? C.line : "#E96A97") }}
                className="fx rounded-full py-4 text-base font-bold">
                {pick === current ? "同じメニューが選ばれています" : `この内容に変更する（${FOCUS_META[pick].label}）`}
              </button>
              <button onClick={onClose} style={{ color: C.muted }} className="fx rounded-full py-2 text-sm font-bold">やめる</button>
            </div>
          </>
        ) : (
          <div className="px-5 pt-6 pb-8">
            <p className="text-4xl text-center mb-2">{step === 1 ? "🤔" : step === 2 ? "😳" : "😤"}</p>
            <h3 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-2 text-center">{STEPS[step - 1]}</h3>
            <p style={{ color: C.muted }} className="text-xs mb-6 text-center">{FOCUS_META[current].label} → {FOCUS_META[pick].label}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} style={{ borderColor: C.lineDeep, color: C.muted }} className="fx border-2 rounded-full py-3 text-sm font-bold">やめる</button>
              <button onClick={() => (step < 3 ? setStep(step + 1) : onConfirm(pick))}
                style={{ background: C.pink, color: C.ink, ...sticker("#E96A97") }} className="fx rounded-full py-3 text-sm font-bold">はい</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { Center, CheerScreen, ExRow, Header, Section, SwapDialog, WelcomeBack };
