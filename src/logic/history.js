/* =========================================================================
   種目ごとの履歴。

   記録には、いつ・どの種目を・何セットやったか、そのときのレベルと段階まで
   すべて残っている。ところが画面には「今日のぶん」しか出しておらず、
   利用者から見ると「続けて何か変わったのか」が分からなかった。

   ここでは新しくデータを増やさない。すでにある log から読み出すだけ。

     lastDoneOf   … その種目を前にやったのはいつ・どれだけか
     bestOf       … いちばん多くできた日
     seriesOf     … 1回あたりの量の移り変わり（グラフ用）

   量は spec() で決まるので、log に残っている lv / stage から復元する。
   ========================================================================= */
import { EX } from "../exercises.js";
import { spec } from "./progress.js";

/* その日その種目の「1セットあたりの量」。記録時の強さで計算し直す */
function amountAt(rec, id) {
  const ex = EX[id];
  if (!ex) return null;
  const sp = spec(ex, rec?.lv ?? 1, rec?.stage ?? 0, rec?.short === true);
  return sp.amount;
}

/* 日付キーの新しい順に、その種目をやった日を返す */
function doneDays(log, id) {
  return Object.entries(log ?? {})
    .filter(([, rec]) => (rec?.ex?.[id] ?? 0) > 0)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

/* 前回。beforeKey を渡すと、その日より前だけを見る（今日を除きたいときに使う） */
function lastDoneOf(log, id, beforeKey) {
  for (const [date, rec] of doneDays(log, id)) {
    if (beforeKey && date >= beforeKey) continue;
    return { date, sets: rec.ex[id], amount: amountAt(rec, id) };
  }
  return null;
}

/* 自己ベスト。1セットあたりの量がいちばん多かった日。
   同じ量ならセット数が多いほう、それも同じなら新しいほうを採る */
function bestOf(log, id) {
  let best = null;
  for (const [date, rec] of doneDays(log, id)) {
    const amount = amountAt(rec, id);
    if (amount == null) continue;
    const cur = { date, sets: rec.ex[id], amount };
    if (!best
      || cur.amount > best.amount
      || (cur.amount === best.amount && cur.sets > best.sets)) best = cur;
  }
  return best;
}

/* 移り変わり（古い順）。グラフに使う。多すぎると読めないので後ろから max 件 */
function seriesOf(log, id, max = 24) {
  const rows = doneDays(log, id)
    .map(([date, rec]) => ({ date, amount: amountAt(rec, id), sets: rec.ex[id] }))
    .filter((r) => r.amount != null)
    .reverse();
  return rows.slice(-max);
}

/* いちばん伸びた種目を上から。記録の画面で「続けた意味」を出すために使う */
function topGrowth(log, limit = 5) {
  const ids = new Set();
  for (const rec of Object.values(log ?? {})) {
    for (const [id, n] of Object.entries(rec?.ex ?? {})) if (n > 0 && EX[id]) ids.add(id);
  }
  const rows = [];
  for (const id of ids) {
    const s = seriesOf(log, id, 999);
    if (s.length < 2) continue;
    const from = s[0].amount, to = s[s.length - 1].amount;
    if (!(from > 0) || to <= from) continue;
    rows.push({ id, from, to, days: s.length, gain: (to - from) / from });
  }
  return rows.sort((a, b) => b.gain - a.gain).slice(0, limit);
}

export { amountAt, bestOf, lastDoneOf, seriesOf, topGrowth };
