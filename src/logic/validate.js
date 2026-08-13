import { EX, FOCUS_META } from "../exercises.js";
import { buildPlan, planIsValid } from "./plan.js";
import { LEVELS, STAGE_MAX } from "./progress.js";
import { DEFAULT_CORE } from "../storage.js";
import { REST_OPTIONS, REST_SEC, clamp, dateKey } from "../utils.js";

/* ================= 読み込んだ値の検証 ================= */
/* 初回読み込みと「引き継ぎの読み込み」で同じ処理を通す。
   壊れた値・古い値をそのまま state に入れると、あとで画面ごと落ちるため */
const isPlainObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
/* 形だけでなく、実在する日付かどうかも見る。2026-13-99 のような値が引き継ぎデータに
   混ざると、写真の日数差や日付の計算が NaN になって画面に出てしまう */
const isDateKey = (k) =>
  typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k) && dateKey(new Date(`${k}T00:00:00`)) === k;
const posNum = (v) => { const x = Number(v); return isFinite(x) && x > 0 ? x : null; };

function normalizeCore(raw) {
  const c = { ...DEFAULT_CORE, ...(isPlainObj(raw) ? raw : {}) };
  c.name = typeof c.name === "string" ? c.name.slice(0, 20) : "";
  c.weights = (Array.isArray(c.weights) ? c.weights : [])
    .filter((w) => isPlainObj(w) && isDateKey(w.date) && posNum(w.kg))
    .map((w) => ({ date: w.date, kg: posNum(w.kg), waist: posNum(w.waist), thigh: posNum(w.thigh) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  c.cheers = (Array.isArray(c.cheers) ? c.cheers : [])
    .filter((x) => typeof x === "string" && x.trim()).map((x) => x.slice(0, 120)).slice(0, 50);
  c.trackWeight = c.trackWeight !== false;
  c.notifyTime = /^\d{2}:\d{2}$/.test(c.notifyTime ?? "") ? c.notifyTime : "20:00";
  c.restSec = REST_OPTIONS.includes(Number(c.restSec)) ? Number(c.restSec) : REST_SEC;
  c.sound = c.sound !== false;
  c.weekSeen = isDateKey(c.weekSeen) ? c.weekSeen : "";
  c.profile = isPlainObj(c.profile) ? c.profile : null;
  if (!c.profile) c.plan = null;
  else if (!planIsValid(c.plan)) c.plan = buildPlan(c.profile);
  return c;
}

function normalizeLog(raw) {
  if (!isPlainObj(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isDateKey(k) || !isPlainObj(v)) continue;
    const ex = {};
    for (const [id, cnt] of Object.entries(isPlainObj(v.ex) ? v.ex : {})) {
      const c = posNum(cnt);
      if (EX[id] && c) ex[id] = Math.floor(c);
    }
    const rec = { ...v, ex };
    if (rec.lv != null) rec.lv = clamp(Math.floor(Number(rec.lv)) || 0, 0, LEVELS.length - 1);
    if (rec.stage != null) rec.stage = clamp(Math.floor(Number(rec.stage)) || 0, 0, STAGE_MAX);
    if (rec.focus && !FOCUS_META[rec.focus]) delete rec.focus;
    if (typeof rec.note === "string") rec.note = rec.note.slice(0, 200);
    out[k] = rec;
  }
  return out;
}

/* 写真は端末の容量の都合で12枚まで。
   v13は新しい12枚を残していたので、いっぱいになると「いちばん古い1枚」＝
   見くらべの「まえ」にあたる写真から消えていた。最初の1枚だけは必ず残す。 */
const PHOTO_MAX = 12;
function capPhotos(list) {
  const s = (Array.isArray(list) ? list : []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  if (s.length <= PHOTO_MAX) return s;
  return [s[0], ...s.slice(-(PHOTO_MAX - 1))];
}

function normalizePhotos(raw) {
  /* 引き継ぎデータに同じ日付が2枚あると、一覧のキーが重なって表示が崩れる */
  const seen = new Set();
  return capPhotos(
    (Array.isArray(raw) ? raw : [])
      .filter((p) => isPlainObj(p) && isDateKey(p.date) && typeof p.data === "string" && p.data.startsWith("data:image/"))
      .filter((p) => (seen.has(p.date) ? false : (seen.add(p.date), true)))
      .map((p) => ({ date: p.date, data: p.data }))
  );
}

export { capPhotos, normalizeCore, normalizeLog, normalizePhotos };
