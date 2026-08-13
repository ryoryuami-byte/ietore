import { useState } from "react";
import { Fig, FigStyles } from "../components/Fig.jsx";
import { HEALTH, HEALTH_Q, needsDoctor } from "../legal.js";
import { LegalText } from "./Legal.jsx";
import { BODY, C, DISPLAY, DOTS, card, sticker } from "../tokens.js";

/* =========================================================================
   初回に1回だけ出す画面。

   ここを飛ばして質問に進ませない。健康関連のアプリで、
   「医療的な助言ではない」「痛みが出たらやめる」を伝えないまま
   運動をさせるわけにはいかないため。

   すでに使っている人にも、更新後に1回だけ出る（core.consent が無いので）。
   ========================================================================= */
function Consent({ onAgree }) {
  const [health, setHealth] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [doc, setDoc] = useState(null); /* "privacy" | "terms" */

  if (doc) return <LegalText which={doc} onClose={() => setDoc(null)} />;

  const toggle = (id) =>
    setHealth((prev) => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const next = prev.filter((x) => x !== "none");
      return next.includes(id) ? next.filter((x) => x !== id) : [...next, id];
    });

  const answered = health.length > 0;
  const warn = needsDoctor(health);
  const canGo = answered && agreed;

  return (
    <div style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY, minHeight: "100dvh" }}
      className="min-h-screen pb-32">
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-8">
        <div className="flex justify-center mb-4"><Fig kind="stretch" size={84} /></div>
        <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold leading-snug mb-3 text-center">
          {HEALTH.title}
        </h1>
        <p style={{ color: C.muted }} className="text-sm leading-relaxed mb-7 text-center">{HEALTH.intro}</p>

        <div className="grid gap-3 mb-8">
          {HEALTH.points.map((p) => (
            <div key={p.head} style={card()} className="border-2 rounded-3xl px-5 py-4">
              <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-sm font-bold mb-1.5">{p.head}</p>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* 健康状態。あてはまるものを選んでもらう */}
        <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1.5">
          いま、あてはまるものはありますか
        </p>
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
          いくつでも選べます。ここでの答えは端末の中だけに残り、どこにも送られません。
        </p>
        <div className="grid gap-2 mb-4" role="group" aria-label="いま、あてはまるもの">
          {HEALTH_Q.map(([id, label]) => {
            const on = health.includes(id);
            return (
              <button key={id} onClick={() => toggle(id)} aria-pressed={on}
                style={on
                  ? { background: C.pink, color: C.ink, borderColor: C.pink, ...sticker("#E96A97") }
                  : { background: C.surface, color: C.ink, borderColor: C.line }}
                className="fx border-2 rounded-2xl px-4 py-3 text-sm text-left font-bold">
                {on ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>

        {warn && (
          <div style={card({ borderColor: C.pinkDeep, ...sticker(C.pinkDeep) })}
            className="border-2 rounded-3xl px-5 py-4 mb-4" role="alert">
            <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-sm font-bold mb-1.5">
              先に、医師にご相談ください
            </p>
            <p style={{ color: C.muted }} className="text-xs leading-relaxed">
              選ばれた内容にあてはまる方は、運動を始めてよいかを医師に確認してから使ってください。
              使い始めたあとでも、痛みや違和感が出たらすぐに中止してください。
            </p>
          </div>
        )}

        {/* 規約・プライバシー */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setDoc("terms")}
            style={{ borderColor: C.lineDeep, color: C.muted }}
            className="fx flex-1 border-2 rounded-full py-3 text-xs font-bold">利用規約を読む</button>
          <button onClick={() => setDoc("privacy")}
            style={{ borderColor: C.lineDeep, color: C.muted }}
            className="fx flex-1 border-2 rounded-full py-3 text-xs font-bold">プライバシーポリシー</button>
        </div>

        <button onClick={() => setAgreed((v) => !v)} aria-pressed={agreed}
          style={agreed
            ? { background: C.mint, color: C.ink, borderColor: C.mint, ...sticker("#3CBF9A") }
            : { background: C.surface, color: C.ink, borderColor: C.line }}
          className="fx w-full border-2 rounded-2xl px-4 py-4 text-sm text-left font-bold mb-6 leading-relaxed">
          {agreed ? "✓ " : "　"}上の注意と、利用規約・プライバシーポリシーに同意します
        </button>
      </div>

      {/* 下に固定。読み終わってから押せるようにする */}
      <div style={{
        background: C.bg, borderColor: C.line,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }} className="fixed bottom-0 left-0 right-0 border-t-2 px-5 pt-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => canGo && onAgree(health)} disabled={!canGo}
            style={canGo
              ? { background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }
              : { background: C.line, color: C.muted, fontFamily: DISPLAY }}
            className="fx w-full rounded-full py-4 text-base font-bold">
            {!answered ? "あてはまるものを選んでください"
              : !agreed ? "同意にチェックしてください"
                : "はじめる"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { Consent };
