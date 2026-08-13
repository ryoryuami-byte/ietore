import { useState } from "react";
import { useBodyLock } from "../hooks.js";
import { Choice } from "../screens/Questionnaire.jsx";
import { BODY, C, DISPLAY, card, sticker } from "../tokens.js";

/* ================= 体感を聞く ================= */
const FEELINGS = [
  ["hard", "きつかった", "😵", "量を少し戻します"],
  ["ok", "ちょうどよかった", "😊", "このまま少しずつ増やします"],
  ["easy", "楽だった", "😎", "早めに量を増やします"],
];

function FeelingSheet({ onPick, onClose }) {
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.5)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6">
        <h3 style={{ fontFamily: DISPLAY }} className="text-xl font-bold mb-1">今日はどうでしたか？</h3>
        <p style={{ color: C.muted }} className="text-xs mb-5">答えると、これからの量の増やし方が変わります。</p>
        <div className="grid gap-2.5">
          {FEELINGS.map(([v, l, e, note]) => (
            <button key={v} onClick={() => onPick(v)} style={card()}
              className="fx border-2 rounded-3xl px-4 py-4 flex items-center gap-3 text-left">
              <span className="text-3xl" aria-hidden="true">{e}</span>
              <span>
                <span style={{ fontFamily: DISPLAY }} className="block text-base font-bold">{l}</span>
                <span style={{ color: C.muted }} className="block text-xs">{note}</span>
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ color: C.muted }} className="fx w-full rounded-full py-3 text-sm mt-3 font-bold">
          答えずに完了する
        </button>
      </div>
    </div>
  );
}

/* ================= 今日は無理 ================= */
const SKIP_REASONS = ["体調がよくない", "時間がとれなかった", "疲れている", "気分がのらない", "予定が入った", "その他"];

function SkipSheet({ onClose, onSave }) {
  const [pick, setPick] = useState("");
  const [text, setText] = useState("");
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.45)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh" }} className="w-full max-w-md rounded-t-3xl flex flex-col">
        <div className="px-5 pt-6 pb-3">
          <h3 style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">今日はお休みにする</h3>
          <p style={{ color: C.muted }} className="text-xs">連続日数は止まりません。理由はカレンダーに残ります。</p>
        </div>
        <div className="px-5 overflow-y-auto grow">
          <div className="grid gap-2 pb-3" role="radiogroup" aria-label="お休みの理由">
            {SKIP_REASONS.map((r) => (
              <Choice key={r} role="radio" active={pick === r} onClick={() => setPick(r)} label={r} />
            ))}
          </div>
          <label htmlFor="skip-note" className="sr-only">ひとこと</label>
          <textarea id="skip-note" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={100}
            placeholder="ひとこと（任意）"
            style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
            className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm mb-3 resize-none" />
        </div>
        <div style={{ borderColor: C.line, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          className="border-t-2 px-5 pt-4 grid gap-2">
          <button onClick={() => pick && onSave(pick, text.trim())} disabled={!pick}
            style={{ background: pick ? C.lav : C.line, color: pick ? C.ink : C.muted, fontFamily: DISPLAY, ...sticker(pick ? "#8C6BD6" : C.line) }}
            className="fx rounded-full py-4 text-base font-bold">
            {pick ? "お休みとして記録する" : "理由を選んでください"}
          </button>
          <button onClick={onClose} style={{ color: C.muted }} className="fx rounded-full py-2 text-sm font-bold">やめる</button>
        </div>
      </div>
    </div>
  );
}

export { FeelingSheet, SkipSheet };
