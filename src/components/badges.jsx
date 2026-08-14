import { C, DISPLAY, card } from "../tokens.js";

/* ================= バッジ ================= */
function badgeList(log, weeks, streak) {
  const recs = Object.values(log ?? {});
  const doneCount = recs.filter((r) => r?.done).length;
  const notes = recs.filter((r) => r?.note).length;
  return [
    { emoji: "🌱", name: "はじめの一歩", desc: "1回やりきる", got: doneCount >= 1 },
    { emoji: "🌸", name: "3回", desc: "3回やりきる", got: doneCount >= 3 },
    { emoji: "🔥", name: "1週間つづいた", desc: "連続7日", got: streak >= 7 },
    { emoji: "⭐️", name: "10回", desc: "10回やりきる", got: doneCount >= 10 },
    { emoji: "📖", name: "記録魔", desc: "メモを5日書く", got: notes >= 5 },
    { emoji: "🏅", name: "1か月つづいた", desc: "4週つづける", got: weeks >= 4 },
    { emoji: "💎", name: "30回", desc: "30回やりきる", got: doneCount >= 30 },
    { emoji: "👑", name: "3か月つづいた", desc: "12週つづける", got: weeks >= 12 },
  ];
}

function BadgeGrid({ badges }) {
  return (
    <div style={card()} className="border-2 rounded-3xl p-4">
      <div className="grid grid-cols-4 gap-2">
        {badges.map((b) => (
          <div key={b.name} className="text-center">
            <div style={{ background: b.got ? C.bg : C.disabled }}
              className="aspect-square rounded-2xl flex items-center justify-center text-2xl mb-1">
              <span aria-hidden="true">{b.got ? b.emoji : "🔒"}</span>
            </div>
            <p style={{ color: C.ink, fontFamily: DISPLAY }} className="text-xs font-bold leading-tight">{b.name}</p>
            <p style={{ color: C.muted }} className="text-xs leading-tight">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { BadgeGrid, badgeList };
