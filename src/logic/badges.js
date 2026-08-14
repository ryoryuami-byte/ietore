/* =========================================================================
   バッジ。

   「回数」「連続日数」のようなものさし（metric）ごとに、段（tier）を
   階段状に並べてある。1つ取ると、次の段が「次の目標」になる。

   全部の段をいっぺんに並べて見せると散らかるので、画面
   （components/badges.jsx）には「いま到達している段」だけを出す。
   段が上がると、表示される絵とラベルが差し替わる——これが
   「レベルアップ」の見た目の正体で、裏の仕組みはただの階段。

   段が上がったことをホームへ伝えるための土台もここに置く。
   「前回まで見せた段」を core.badgeSeen（シリーズID → 段）に持たせておき、
   いまの段と比べて増えたぶんだけを newlyReached() が返す。
   一度も基準を作ったことが無い（badgeSeen が null）ときは、
   AppInner 側でいまの段を黙って基準にする。そうしないと、
   この仕組みを入れた時点ですでに何年も続けている人に、
   持っている段ぜんぶを「たったいま入手した」と一気に見せてしまう。
   ========================================================================= */
import { AREA_Q, areaTotals } from "../questions.js";

/* シリーズの定義。unit は「次の目標まであと◯◯」の◯◯に使う */
const SERIES = [
  {
    id: "streak", label: "連続日数", metric: "streak", unit: "日",
    tiers: [
      { need: 7, emoji: "🔥", name: "1週間つづいた", desc: "連続7日" },
      { need: 30, emoji: "🏅", name: "1か月つづいた", desc: "連続30日" },
      { need: 90, emoji: "💎", name: "3か月つづいた", desc: "連続90日" },
      { need: 180, emoji: "👑", name: "半年つづいた", desc: "連続180日" },
      { need: 365, emoji: "🏆", name: "1年つづいた", desc: "連続365日" },
    ],
  },
  {
    id: "count", label: "やりきった回数", metric: "doneCount", unit: "回",
    tiers: [
      { need: 1, emoji: "🌱", name: "はじめの一歩", desc: "1回やりきる" },
      { need: 3, emoji: "🌸", name: "3回", desc: "3回やりきる" },
      { need: 10, emoji: "⭐️", name: "10回", desc: "10回やりきる" },
      { need: 30, emoji: "💪", name: "30回", desc: "30回やりきる" },
      { need: 50, emoji: "🎖️", name: "50回", desc: "50回やりきる" },
      { need: 100, emoji: "🌈", name: "100回", desc: "100回やりきる" },
      { need: 200, emoji: "🏆", name: "200回", desc: "200回やりきる" },
    ],
  },
  {
    id: "notes", label: "メモ", metric: "notes", unit: "日ぶん",
    tiers: [
      { need: 5, emoji: "📖", name: "記録魔", desc: "メモを5日書く" },
      { need: 20, emoji: "📚", name: "メモ魔", desc: "メモを20日書く" },
      { need: 50, emoji: "🖋️", name: "物書き", desc: "メモを50日書く" },
      { need: 100, emoji: "📜", name: "百科事典", desc: "メモを100日書く" },
    ],
  },
  {
    id: "photos", label: "写真", metric: "photoCount", unit: "枚",
    tiers: [
      { need: 1, emoji: "📷", name: "はじめての1枚", desc: "写真を1枚残す" },
      { need: 3, emoji: "🖼️", name: "見くらべできる", desc: "写真を3枚残す" },
      { need: 12, emoji: "📅", name: "1年ぶん", desc: "写真を12枚残す" },
      { need: 24, emoji: "🎞️", name: "2年ぶん", desc: "写真を24枚残す" },
    ],
  },
  {
    id: "areas", label: "鍛えた部位の幅", metric: "areaKinds", unit: "種類",
    /* 「全部位」は AREA_Q の実際の数から作る。部位を足し引きしても、
       このシリーズが自動でそれに合わせて動く */
    tiers: [
      { need: 3, emoji: "🧩", name: "いろんな部位", desc: "3部位を鍛える" },
      { need: 6, emoji: "🗺️", name: "まんべんなく", desc: "6部位を鍛える" },
      { need: AREA_Q.length, emoji: "🌐", name: "全部位制覇", desc: `${AREA_Q.length}部位すべてを鍛える` },
    ],
  },
  {
    id: "weight", label: "体重の記録", metric: "weightCount", unit: "回",
    tiers: [
      { need: 1, emoji: "⚖️", name: "はじめての記録", desc: "体重を1回記録する" },
      { need: 4, emoji: "📉", name: "ひと月ぶん", desc: "体重を4回記録する" },
      { need: 12, emoji: "📊", name: "3か月ぶん", desc: "体重を12回記録する" },
      { need: 52, emoji: "📈", name: "1年ぶん", desc: "体重を52回記録する" },
    ],
  },
];

const clamp0 = (n) => { const x = Number(n); return isFinite(x) && x > 0 ? Math.floor(x) : 0; };

/* 記録から、各シリーズが見ている「ものさし」の値を取り出す。
   streak は連続日数の保護（月1回）を含めた、いちばん正しい値を呼び出し側から渡す */
function metricsOf({ log, streak = 0, photos = [], weights = [] }) {
  const recs = Object.values(log ?? {});
  const doneCount = recs.filter((r) => r?.done).length;
  const notes = recs.filter((r) => typeof r?.note === "string" && r.note.trim()).length;
  return {
    streak: clamp0(streak),
    doneCount,
    notes,
    areaKinds: Object.keys(areaTotals(log)).length,
    photoCount: Array.isArray(photos) ? photos.length : 0,
    weightCount: Array.isArray(weights) ? weights.length : 0,
  };
}

/* いまの段。シリーズごとに 0（まだ無し）〜 tiers.length（すべて達成） */
function levelsOf(metrics) {
  const out = {};
  for (const s of SERIES) {
    let lv = 0;
    for (const t of s.tiers) if ((metrics[s.metric] ?? 0) >= t.need) lv++;
    out[s.id] = lv;
  }
  return out;
}

/* 前回見せた段（seen）といまの段（levels）を比べ、新しく上がった分だけを返す。
   しばらく開いていない間に2段以上上がっていたら、その分すべてを返す
   （例：1週間バッジを見せたまま3か月留守にしたら、1か月ぶんと3か月ぶんの両方） */
function newlyReached(levels, seen) {
  const out = [];
  for (const s of SERIES) {
    const from = clamp0(seen?.[s.id]);
    const to = clamp0(levels?.[s.id]);
    for (let lv = from + 1; lv <= to; lv++) {
      const tier = s.tiers[lv - 1];
      out.push({ seriesId: s.id, level: lv, emoji: tier.emoji, name: tier.name, desc: tier.desc });
    }
  }
  return out;
}

/* 画面（BadgeGrid）にそのまま渡せる形にする。
   1段も無いシリーズは、最初の段を「目標」として鍵つきで見せる。
   最後の段まで来ていたら、次の目標は無い（next が null）。 */
function seriesDisplay(levels, metrics) {
  return SERIES.map((s) => {
    const lv = clamp0(levels?.[s.id]);
    const maxLevel = s.tiers.length;
    const current = lv > 0 ? s.tiers[lv - 1] : null;
    const next = lv < maxLevel ? s.tiers[lv] : null;
    const shown = current ?? s.tiers[0];
    return {
      id: s.id, label: s.label, level: lv, maxLevel, got: lv > 0,
      emoji: shown.emoji, name: shown.name, desc: shown.desc,
      next: next && { name: next.name, unit: s.unit, remain: Math.max(0, next.need - (metrics[s.metric] ?? 0)) },
    };
  });
}

export { levelsOf, metricsOf, newlyReached, seriesDisplay, SERIES };
