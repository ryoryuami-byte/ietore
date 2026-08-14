import { C, DISPLAY, card } from "../tokens.js";

/* ================= バッジ ================= */
/* 計算（段の判定・シリーズの定義）は logic/badges.js に置いてある。
   ここは、その結果（seriesDisplay の戻り値）をそのまま並べるだけ。

   1シリーズ＝1枠。段が上がると、枠の中身（絵とラベル）が入れ替わる。
   全部の段を並べて見せていた前の作りだと、シリーズを足すたびに
   グリッドが縦に伸び続けた。いまは「シリーズの数」だけ枠が増える。 */
function BadgeGrid({ series }) {
  return (
    <div style={card()} className="border-2 rounded-3xl p-4">
      <div className="grid grid-cols-3 gap-2">
        {series.map((s) => (
          <div key={s.id} className="text-center">
            <div style={{ background: s.got ? C.bg : C.disabled }}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center relative">
              <span className="text-2xl" aria-hidden="true">{s.got ? s.emoji : "🔒"}</span>
              {s.got && s.level > 1 && (
                <span style={{ background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY }}
                  className="absolute top-1 right-1 rounded-full text-[9px] font-bold leading-none px-1.5 py-0.5">
                  Lv.{s.level}
                </span>
              )}
            </div>
            <p style={{ color: C.ink, fontFamily: DISPLAY }} className="text-xs font-bold leading-tight mt-1">{s.name}</p>
            <p style={{ color: C.muted }} className="text-xs leading-tight">{s.desc}</p>
            {s.next && (
              <p style={{ color: C.muted }} className="text-[10px] leading-tight mt-0.5">
                {s.got
                  ? `つぎ：${s.next.name}（あと${s.next.remain}${s.next.unit}）`
                  : `あと${s.next.remain}${s.next.unit}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { BadgeGrid };
