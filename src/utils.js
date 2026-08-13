/* ================= ユーティリティ ================= */
const DAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
const REST_SEC = 30;               /* 休憩の初期値。設定から変えられる */
const REST_OPTIONS = [15, 30, 45, 60];
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export { DAY_JP, REST_OPTIONS, REST_SEC, clamp, dateKey, daysBetween, mmss, toArr };
