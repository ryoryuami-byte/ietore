import { FigStyles } from "../components/Fig.jsx";
import { HEALTH, PRIVACY, TERMS } from "../legal.js";
import { C, card, DISPLAY, page } from "../tokens.js";

/* プライバシーポリシー・利用規約・注意書きの表示。
   同意画面と設定の両方から開く */
function LegalText({ which, onClose }) {
  const doc =
    which === "privacy" ? PRIVACY
      : which === "terms" ? TERMS
        : { title: HEALTH.title, summary: HEALTH.intro, sections: HEALTH.points.map((p) => ({ head: p.head, body: p.body })) };

  return (
    <div style={page()}
      className="min-h-screen">
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>
        <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm mb-4 font-bold">‹ もどる</button>
        <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-2">{doc.title}</h1>
        {doc.updated && (
          <p style={{ color: C.muted }} className="text-xs mb-4">最終更新: {doc.updated}</p>
        )}
        {doc.summary && (
          <div style={card({ borderColor: C.mint })} className="border-2 rounded-3xl px-5 py-4 mb-5">
            <p style={{ color: C.mintText }} className="text-sm font-bold leading-relaxed">{doc.summary}</p>
          </div>
        )}

        <div className="grid gap-3" data-selectable>
          {doc.sections.map((s) => (
            <div key={s.head} style={card()} className="border-2 rounded-3xl px-5 py-4">
              <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1.5">{s.head}</p>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { LegalText };
