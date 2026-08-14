import { useState, useMemo } from "react";
import { Fig } from "./Fig.jsx";
import { EX, FOCUS_META } from "../exercises.js";
import { useBodyLock } from "../hooks.js";
import { lvMeta, specText } from "../logic/progress.js";
import { BODY, C, DISPLAY, HERO_SOFT, SCRIM, SHADOW, card, sticker } from "../tokens.js";
import { DAY_JP } from "../utils.js";

/* ================= 画面パーツ ================= */
function Center({ children }) {
  return (
    <div style={{ background: C.bg, color: C.muted, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen flex items-center justify-center text-sm">
      {children}
    </div>
  );
}

/* 上のあいさつ帯。うすいピンクの面に ink を載せる（8.9 : 1） */
function Greeting({ name, dow, meta }) {
  return (
    <div style={{ background: HERO_SOFT, boxShadow: SHADOW }}
      className="rounded-3xl px-5 py-5 flex items-center gap-4">
      <div className="min-w-0 grow">
        <p style={{ color: C.muted }} className="text-xs mb-1">{DAY_JP[dow]}曜日</p>
        <p style={{ fontFamily: DISPLAY }} className="text-lg font-bold leading-snug">
          {name ? `${name}さん` : "こんにちは"}
        </p>
        <p style={{ color: C.pinkDeep }} className="text-sm font-bold mt-0.5">
          今日は{meta.label}
        </p>
      </div>
      <span className="text-4xl shrink-0" aria-hidden="true">{meta.emoji}</span>
    </div>
  );
}

function Header({ name, dow, meta, pct, done, total, streak, weeks, sealed, rest, lv, stage, half }) {
  const R = 30, circ = 2 * Math.PI * R;
  const ringColor = pct === 100 ? C.mint : C.pinkBtn;
  return (
    <div className="grid gap-3">
      <Greeting name={name} dow={dow} meta={meta} />

      {/* 今日の進み。参照アプリの「今週の進捗」と同じ組み（左に見出し、右にリング） */}
      <div style={card()} className="border-2 rounded-3xl px-5 py-5">
        <div className="flex items-center gap-5">
          <div className="min-w-0 grow">
            <div className="flex items-baseline gap-2 mb-3">
              <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold">今日の進み</p>
              <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-sm font-bold">
                {done}<span style={{ color: C.muted }}> / {total}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span style={{ background: C.pinkSoft, color: C.pinkDeep }} className="text-xs px-3 py-1.5 rounded-full font-bold">🔥 連続 {streak} 日</span>
              <span style={{ background: C.lavSoft, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">{weeks} 週つづいた</span>
              <span style={{ background: C.lavSoft, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">{lvMeta(lv).emoji} Lv.{stage + 1}</span>
              {rest && <span style={{ background: C.mintSoft, color: C.mintText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🍃 軽めの日</span>}
              {half && <span style={{ background: C.lavSoft, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🌿 短縮</span>}
              {sealed && <span style={{ background: C.mintSoft, color: C.mintText }} className="text-xs px-3 py-1.5 rounded-full font-bold">✓ 完了</span>}
            </div>
          </div>

          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" className="shrink-0">
            <circle cx="44" cy="44" r={R} fill="none" style={{ stroke: C.pinkSoft }} strokeWidth="9" />
            <circle cx="44" cy="44" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 44 44)"
              style={{ stroke: ringColor, transition: "stroke-dashoffset .45s ease" }} />
            <text x="41" y="51" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, fill: ringColor }}>{pct}</text>
            <text x="60" y="51" textAnchor="middle" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, fill: C.muted }}>%</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, action, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between mb-1 px-1 gap-3">
        <h2 style={{ fontFamily: DISPLAY }} className="text-base font-bold shrink-0">{title}</h2>
        {action && (
          <button onClick={action.onClick} style={{ color: C.pinkDeep }}
            className="fx rounded-full px-2 py-1 text-xs font-bold shrink-0">
            {action.label} ›
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
    <div style={{ background: done ? C.surfaceOk : C.surface, borderColor: done ? C.mint : C.line, ...sticker(done ? C.mint : C.line) }}
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
      style={{ background: SCRIM }}>
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
        <button onClick={onClose} style={{ background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }}
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
    <div className="fixed inset-0 flex items-end justify-center z-30" role="dialog" aria-modal="true" style={{ background: SCRIM }}>
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
                style={{ background: pick === current ? C.line : C.pink, color: pick === current ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(pick === current ? C.line : C.pinkEdge) }}
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
                style={{ background: C.pinkBtn, color: "#fff", ...sticker(C.pinkBtn) }} className="fx rounded-full py-3 text-sm font-bold">はい</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { Center, CheerScreen, ExRow, Header, Section, SwapDialog, WelcomeBack };
