import { CARDIO_PICKS, EX, FOCUS_META, PHASE_ORDER, maxIntensity, phaseOf } from "../exercises.js";
import { lvIndex, spec } from "./progress.js";
import { TENDENCY_AREA } from "../questions.js";
import { REST_SEC, clamp, toArr } from "../utils.js";

/* ================= メニュー生成 ================= */
const GOAL_ORDER = {
  lose: ["cardio", "lower", "core", "full", "upper"],
  tone: ["lower", "core", "upper", "cardio", "full"],
  fitness: ["full", "cardio", "lower", "core", "upper"],
  posture: ["upper", "core", "lower", "cardio", "full"],
};
/* 足りないときに借りてくる隣のカテゴリ（無関係な種目が「有酸素の日」に混ざるのを防ぐ） */
const NEIGHBOR = {
  cardio: ["full", "lower"],
  lower: ["full", "core"],
  core: ["full", "lower"],
  upper: ["core", "full"],
  full: ["lower", "cardio", "core", "upper"],
};
/* 週の何曜日に入れるか。日数ごとに、なるべく間隔があくよう並べる（日=0 … 土=6） */
const DAY_LAYOUT = {
  1: [3],
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};
const daySlots = (n) => DAY_LAYOUT[clamp(n, 1, 7)] ?? DAY_LAYOUT[4];

/* 使ってよい種目。痛みのある部位・足音・強度でふるいにかける */
function usableList(p) {
  const avoid = toArr(p?.avoid).filter((a) => a !== "none");
  const lv = levelOf(p ?? {});
  const cap = maxIntensity(lv);
  const all = Object.entries(EX);
  const hurts = ([, e]) => avoid.some((a) => (e.stress ?? []).includes(a));
  /* 高強度は「ふつう」以上、腰に負担のある種目は「ゆっくり」以上でのみ出す */
  const tooHard = ([, e]) => (e.int ?? 1) > cap || (e.spineLoad && lv < 1);
  const safe = all.filter((x) => !hurts(x) && !tooHard(x));
  const quiet = safe.filter((x) => !(p?.noise === "quiet" && x[1].noisy));
  const enough = (list) => PHASE_ORDER.every((ph) => list.some(([, e]) => (e.phase ?? "main") === ph));
  if (enough(quiet)) return quiet;
  if (enough(safe)) return safe;
  return all.filter((x) => !hurts(x));
}

function wantedAreas(p) {
  const picked = toArr(p.area).filter((a) => a !== "none");
  const fromTendency = toArr(p.tendency).flatMap((t) => TENDENCY_AREA[t] ?? []);
  return Array.from(new Set([...picked, ...fromTendency]));
}

/* 時間枠ごとの構成。
   選んだ「1回あたりの時間」は ② メイン と ③ 有酸素 の目安で、
   ① ウォームアップ と ④ クールダウン はその外側に置く（時間に数えない）。
   そのため、時間が短くてもメインの種目数は削らない。 */
function shapeOf(p) {
  const m = p?.minutes === "30" ? 30 : p?.minutes === "10" ? 10 : 20;
  /* 有酸素は毎日20分（2種目）で固定。選んだ時間は ② メインの目安 */
  const s = m === 10 ? { warmup: 1, main: 3, cardio: CARDIO_PICKS, cooldown: 1 }
    : m === 30 ? { warmup: 2, main: 5, cardio: CARDIO_PICKS, cooldown: 1 }
    : { warmup: 1, main: 4, cardio: CARDIO_PICKS, cooldown: 1 };
  /* 「時間がとれない・疲れて続かなかった」と答えた人だけ、メインを1つ減らす。
     これは時間配分ではなく、続けやすさのための調整 */
  const reasons = toArr(p?.stopReason);
  if (reasons.includes("busy") || reasons.includes("tired") || reasons.includes("hard")) {
    s.main = Math.max(2, s.main - 1);
  }
  return s;
}

/* 「全身の日」と「有酸素の日」は、1部位に偏らないよう3グループから順番に取る */
const MAIN_GROUPS = {
  lower: ["lower"], core: ["core"], upper: ["upper"],
  full: ["lower", "core", "upper"],
  cardio: ["lower", "core", "upper"],
};

const rotate = (arr, n) => (arr.length ? arr.slice(Math.abs(n) % arr.length).concat(arr.slice(0, Math.abs(n) % arr.length)) : []);
const byPhaseOrder = (ids) => ids.slice().sort((a, b) => PHASE_ORDER.indexOf(phaseOf(a)) - PHASE_ORDER.indexOf(phaseOf(b)));

/* 1日ぶんの種目を組む。入れ替えダイアログからも同じ関数を使う */
function buildDay(p, focus, seed = 0) {
  if (focus === "rest") return buildRestDay(p, seed);
  const shape = shapeOf(p);
  const usable = usableList(p);
  const wanted = wantedAreas(p);
  const score = (e) => (e.area ?? []).filter((x) => wanted.includes(x)).length;
  const pool = (ph, filter) => usable
    .filter(([, e]) => (e.phase ?? "main") === ph && (!filter || filter(e)))
    .sort((a, b) => score(b[1]) - score(a[1]) || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
  const fill = (out, list, n) => {
    for (const id of list) { if (out.length >= n) break; if (!out.includes(id)) out.push(id); }
    return out;
  };

  /* ① ウォームアップ */
  const warm = fill([], rotate(pool("warmup"), seed), shape.warmup);

  /* ② メイン。腰に負担がかかる種目は1日1種目まで */
  const groups = MAIN_GROUPS[focus] ?? [focus];
  const mainMax = focus === "cardio" ? Math.min(2, shape.main) : shape.main;
  /* 有酸素の日は画面に「筋トレは軽めにして、有酸素を中心にする日です」と出している。
     並び順の都合で、ふつう以上を選ぶとスローバーピーとマウンテンクライマー（強度3）が
     入ってしまっていたので、この日は強度1の種目だけから選ぶ */
  const soft = (e) => focus !== "cardio" || (e.int ?? 1) <= 1;
  const main = [];
  let spine = 0;
  const addMain = (id) => {
    if (!id || main.length >= mainMax || main.includes(id)) return;
    if (EX[id]?.spineLoad) { if (spine >= 1) return; spine += 1; }
    main.push(id);
  };
  const lists = groups.map((g, i) => rotate(pool("main", (e) => (e.focus ?? []).includes(g) && soft(e)), seed + i));
  for (let round = 0; main.length < mainMax && round < 10; round++) {
    for (const list of lists) addMain(list[round]);
  }
  for (const nb of NEIGHBOR[focus] ?? []) {
    if (main.length >= mainMax) break;
    for (const id of rotate(pool("main", (e) => (e.focus ?? []).includes(nb) && soft(e)), seed)) addMain(id);
  }
  for (const id of pool("main", soft)) addMain(id);
  for (const id of pool("main")) addMain(id); /* それでも足りないときだけ制限を外す */

  /* ③ 有酸素。曜日にかかわらず毎日20分ぶん（2種目）を入れる */
  const cardio = fill([], rotate(pool("cardio"), seed), shape.cardio);

  /* ④ クールダウン */
  const cool = fill([], rotate(pool("cooldown"), seed), shape.cooldown);

  const ids = byPhaseOrder([...warm, ...main, ...cardio, ...cool].filter((id) => EX[id]));
  return ids.length ? ids : ["hipcircle", "hip", "stretch"];
}

/* ととのえる日：軽く温める → 低強度の有酸素 → ストレッチ2つ */
function buildRestDay(p, seed = 0) {
  const usable = usableList(p ?? {});
  const pool = (ph, filter) => usable
    .filter(([, e]) => (e.phase ?? "main") === ph && (!filter || filter(e)))
    .map(([id]) => id);
  const warm = rotate(pool("warmup"), seed).slice(0, 1);
  /* ととのえる日も有酸素は毎日20分。ただし低強度のものだけから選ぶ */
  const soft = pool("cardio", (e) => (e.int ?? 1) <= 1);
  const easy = rotate(soft.length >= CARDIO_PICKS ? soft : pool("cardio"), seed).slice(0, CARDIO_PICKS);
  const cool = rotate(pool("cooldown"), seed).slice(0, 2);
  const ids = byPhaseOrder([...warm, ...easy, ...cool].filter((id) => EX[id]));
  return ids.length ? ids : ["stretch"];
}

/* 所要時間のめやす（秒）。②メインだけを数える。
   ①ウォームアップ・③有酸素20分・④クールダウンはこの時間の外。
   回数種目はゆっくり動く前提で1回あたり3.5秒として見積もる */
function estimateSec(ids, lv, stage, half, restSec = REST_SEC) {
  let sec = 0;
  for (const id of ids ?? []) {
    const e = EX[id];
    if (!e || (e.phase ?? "main") !== "main") continue;
    const sp = spec(e, lv, stage, half);
    const sides = e.perSide ? 2 : 1;
    const one = e.type === "time" ? sp.amount * sides : sp.amount * sides * 3.5;
    sec += sp.sets * one + Math.max(0, sp.sets - 1) * restSec + 15;
  }
  return Math.round(sec);
}
const estimateMin = (...a) => Math.max(1, Math.round(estimateSec(...a) / 60));

/* 短縮メニュー：①1つ・②1つ・④1つだけ残す */
function shortIds(ids) {
  const first = (ph) => ids.find((id) => phaseOf(id) === ph);
  const out = [first("warmup"), first("main") ?? first("cardio"), first("cooldown")].filter(Boolean);
  return out.length ? Array.from(new Set(out)) : ids.slice(0, 1);
}
/* 「おかえり」で見せる代表の1種目。ウォームアップではなくメインを出す */
const mainIdOf = (ids) => ids.find((id) => phaseOf(id) === "main") ?? ids.find((id) => phaseOf(id) === "cardio") ?? ids[0];

/* 週の並び。週3日以上なら「下半身・体幹・上半身」を必ず1日ずつ確保してから、
   残りを目的の優先順で埋める。こうしないと週3日・減量で上半身が1日も入らなかった。
   有酸素は毎日③として入るので、有酸素の日が消えても運動量は落ちない */
function focusSequence(order, n) {
  const must = ["lower", "core", "upper"];
  const seq = [];
  if (n >= 3) {
    for (const c of order) if (must.includes(c) && !seq.includes(c)) seq.push(c);
    for (const c of must) if (!seq.includes(c)) seq.push(c);
  }
  for (const c of order) { if (seq.length >= n) break; if (!seq.includes(c)) seq.push(c); }
  while (seq.length < n) seq.push(order[seq.length % order.length]);
  /* 目的の優先度が高いものを週の前半に置く */
  return seq.slice(0, n).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function buildPlan(p) {
  const days = clamp(Number(p.days) || 4, 1, 7);
  const order = GOAL_ORDER[p.goal] ?? GOAL_ORDER.tone;
  const slots = daySlots(days);
  const focuses = focusSequence(order, slots.length);

  /* 気になる部位に対応するカテゴリが1日も無い場合、最後の日を差し替える */
  const wanted = wantedAreas(p);
  const missing = (cat, areas) => !focuses.includes(cat) && areas.some((a) => wanted.includes(a));
  if (missing("core", ["bellyUp", "bellyLow", "waist"])) focuses[focuses.length - 1] = "core";
  else if (missing("upper", ["arms", "back", "shoulder", "posture"])) focuses[focuses.length - 1] = "upper";

  const plan = {};
  for (let d = 0; d < 7; d++) plan[d] = { focus: "rest", ids: buildRestDay(p, d) };
  slots.forEach((d, i) => { plan[d] = { focus: focuses[i], ids: buildDay(p, focuses[i], i) }; });
  return plan;
}

function levelOf(p) {
  if (p.level) return lvIndex(p.level);
  if (p.activity === "some") return 2;
  if (p.activity === "none") return 0;
  return 1;
}

/* 古いメニューは作り直させる。
   v14以前は①④が無く、v16以前は有酸素が毎日20分ぶん入っていない */
const planIsValid = (plan) =>
  !!plan && [0, 1, 2, 3, 4, 5, 6].every((d) => {
    const day = plan[d];
    if (!day || !FOCUS_META[day.focus] || !Array.isArray(day.ids) || !day.ids.length) return false;
    if (!day.ids.every((id) => EX[id])) return false;
    if (!["warmup", "cooldown"].every((ph) => day.ids.some((id) => phaseOf(id) === ph))) return false;
    return day.ids.filter((id) => phaseOf(id) === "cardio").length === CARDIO_PICKS;
  });

export { buildDay, buildPlan, estimateMin, levelOf, mainIdOf, planIsValid, shortIds, wantedAreas };
