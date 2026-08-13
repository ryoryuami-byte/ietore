import { C, DISPLAY, card } from "../tokens.js";
import { dateKey } from "../utils.js";

/* ================= 週まとめ ================= */
function WeekSummary({ log, today }) {
  const count = (offset) => {
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - offset * 7);
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > today) break;
      if (log[dateKey(d)]?.done) n++;
    }
    return n;
  };
  const now = count(0), prev = count(1);
  const diff = now - prev;
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5">
      <p style={{ color: C.muted }} className="text-xs mb-2">今週やりきった回数</p>
      <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold leading-none mb-2">
        {now}<span className="text-base ml-1">回</span>
      </p>
      <p style={{ color: diff > 0 ? C.mintText : diff < 0 ? C.pinkDeep : C.muted }} className="text-xs font-bold">
        {diff > 0 ? `先週より ${diff} 回多い` : diff < 0 ? `先週より ${-diff} 回少ない（先週 ${prev} 回）` : `先週と同じ（${prev} 回）`}
      </p>
    </div>
  );
}

export { WeekSummary };
