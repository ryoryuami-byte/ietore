/* =========================================================================
   写真を「月」で扱うための、画面に依存しない計算。

   月ごとの見くらべ（v18.6）で使う。写真は1日1枚までだが、
   カレンダーからも追加できるようになったので、1つの月に複数枚入ることがある。
   ここでは「その月をどの1枚で代表させるか」までを決める。
   実際に選ばれた1枚をどう表示するかは screens/LogView.jsx の役目。
   ========================================================================= */

/* 日付 "2026-08-13" → 月 "2026-08" */
const monthOf = (date) => String(date).slice(0, 7);

/* 写真が1枚でもある月の一覧。古い順、重複なし */
function monthsWithPhotos(photos) {
  return [...new Set((photos ?? []).map((p) => monthOf(p.date)))].sort();
}

/* その月の写真だけを、撮った日の古い順で */
function photosInMonth(photos, month) {
  return (photos ?? [])
    .filter((p) => monthOf(p.date) === month)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* その月を代表する1枚。何枚あっても、月のいちばん早い日の写真にそろえる。
   多くの人は月1枚しか撮らないので、そのときは自動でその1枚になる */
function defaultPhotoOfMonth(photos, month) {
  return photosInMonth(photos, month)[0] ?? null;
}

/* 月と月の差（月数）。b が a より先なら正の数 */
function monthsBetween(a, b) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/* "2026-08" → "2026年8月" */
function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return `${y}年${m}月`;
}

export { defaultPhotoOfMonth, monthLabel, monthOf, monthsBetween, monthsWithPhotos, photosInMonth };
