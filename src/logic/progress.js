import { clamp, mmss } from "../utils.js";

/* ================= 強度と負荷の上げ方 ================= */
const LEVELS = [
  { id: "gentle", label: "とてもゆっくり", emoji: "🌱", desc: "運動はまったくしていない", t: -0.6, setBias: -1 },
  { id: "easy", label: "ゆっくり", emoji: "🌸", desc: "たまに歩く程度", t: 0, setBias: 0 },
  { id: "normal", label: "ふつう", emoji: "🔥", desc: "少し動き慣れている", t: 0.55, setBias: 0 },
  { id: "hard", label: "しっかり", emoji: "⚡️", desc: "部活などで動き慣れている", t: 1, setBias: 1 },
];
const lvIndex = (id) => Math.max(0, LEVELS.findIndex((l) => l.id === id));
/* 引き継ぎデータなどで範囲外の値が来ても落ちないようにする */
const lvMeta = (i) => LEVELS[i] ?? LEVELS[1];

const SESSIONS_PER_STAGE = 6;
const STAGE_MAX = 6;
const STAGE_STEP = 0.12;
const FEEL_WINDOW = 12; /* 体感は直近12回ぶんだけ見る（昔の分が効き続けないように） */

/* 完了回数で上がり、直近の体感で微調整する。
   「きつかった」が続いたときは量を少し戻す（無理をさせないため、下がることもある） */
function stageOf(log) {
  const recs = Object.entries(log ?? {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, r]) => r);
  const n = recs.filter((r) => r?.done).length;
  const feels = recs.filter((r) => r?.feeling).map((r) => r.feeling).slice(-FEEL_WINDOW);
  const easy = feels.filter((x) => x === "easy").length;
  const hard = feels.filter((x) => x === "hard").length;
  const adjust = Math.floor(easy / 3) - Math.floor(hard / 3);
  const base = Math.floor(n / SESSIONS_PER_STAGE);
  return { stage: clamp(base + adjust, 0, STAGE_MAX), sessions: n, adjust, base: clamp(base, 0, STAGE_MAX) };
}

/* half=true で「おかえり」用の半分メニューになる */
function spec(ex, lv, stage = 0, half = false) {
  /* 有酸素は毎日20分と決めているので、レベルや段階では増減させない */
  if (ex.phase === "cardio") {
    return { amount: ex.block, sets: half ? Math.max(1, Math.round(ex.blockSets / 2)) : ex.blockSets };
  }
  const L = LEVELS[lv] ?? LEVELS[1];
  const e = ex.amount.easy, h = ex.amount.hard;
  const capA = ex.cap ?? Math.round(h * 1.6);
  let a = Math.min((e + (h - e) * L.t) * (1 + stage * STAGE_STEP), capA);
  if (half) a *= 0.5;
  a = ex.type === "time" ? Math.max(10, Math.round(a / 5) * 5) : Math.max(3, Math.round(a));
  let n = (L.t >= 0.5 ? ex.sets.hard : ex.sets.easy) + L.setBias + (stage >= 4 ? 1 : 0);
  n = clamp(n, 1, ex.setsCap ?? 4);
  if (half) n = Math.max(1, Math.floor(n / 2));
  return { amount: a, sets: n };
}

/* 秒数の左右種目（サイドプランク）は、画面に「左右各◯秒 × Nセット」と出している。
   タイマーが片側ぶんで1セット数えていると表示と合わないので、左右あわせた長さで回す */
const timerSec = (ex, sp) => (ex.type === "time" && ex.perSide ? sp.amount * 2 : sp.amount);

const specText = (ex, lv, stage, half) => {
  const { amount, sets } = spec(ex, lv, stage, half);
  const side = ex.perSide ? "左右各 " : "";
  return ex.type === "time"
    ? `${side}${amount >= 60 ? mmss(amount) : `${amount}秒`} × ${sets}セット`
    : `${side}${amount}回 × ${sets}セット`;
};

export { LEVELS, SESSIONS_PER_STAGE, STAGE_MAX, STAGE_STEP, lvIndex, lvMeta, spec, specText, stageOf, timerSec };
