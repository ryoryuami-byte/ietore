/* =========================================================================
   お知らせ（ローカル通知）

   離脱の理由でいちばん多いのが「やるのを忘れた」なので、ここは continued rate に
   直接効く。v17.2 までは設定画面が時刻を保存するだけで、実際には何も鳴っていなかった。

   サーバーは使わない。端末の中で予約するだけなので、
   通信も要らず、こちらが利用者の生活時間を知ることもない。

   予約のしかた
   - 今日から7日ぶんを、いちどに予約する
   - すでに「やりきった」日と「お休み」にした日は飛ばす
   - 今日のぶんは、設定した時刻をもう過ぎていたら飛ばす
   - 予定・時刻・記録が変わるたびに、全部取り消して入れ直す
     （数が7件しかないので、差分を考えるより取り直すほうが確実）
   ========================================================================= */
import { LocalNotifications } from "@capacitor/local-notifications";
import { FOCUS_META } from "./exercises.js";
import { isNative } from "./platform.js";
import { dateKey } from "./utils.js";

/* 他のアプリや将来の別用途とぶつからないよう、この範囲だけを使う */
const ID_BASE = 4200;
const DAYS_AHEAD = 7;
const IDS = Array.from({ length: DAYS_AHEAD }, (_, i) => ID_BASE + i);

const notifySupported = () => isNative();

async function getPermission() {
  if (!notifySupported()) return "unsupported";
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display; /* granted / denied / prompt / prompt-with-rationale */
  } catch (e) {
    return "unsupported";
  }
}

async function requestPermission() {
  if (!notifySupported()) return false;
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  } catch (e) {
    return false;
  }
}

async function cancelAll() {
  if (!notifySupported()) return;
  try {
    await LocalNotifications.cancel({ notifications: IDS.map((id) => ({ id })) });
  } catch (e) {
    /* 予約が無いときもここに来る */
  }
}

/* 「20:00」→ その日の 20時0分 の Date */
function atTime(date, hhmm) {
  const [h, m] = String(hhmm ?? "20:00").split(":").map(Number);
  const d = new Date(date);
  d.setHours(isFinite(h) ? h : 20, isFinite(m) ? m : 0, 0, 0);
  return d;
}

/* その日の見出しから文面を作る。
   「ととのえる日」も中身（軽い有酸素20分とストレッチ）があるので、
   出さないのではなく、言い方を変えて出す */
function messageFor(focus) {
  if (focus === "rest") {
    return {
      title: "きょうはととのえる日",
      body: "ストレッチと軽い有酸素だけ。体を休ませるのも練習のうちです。",
    };
  }
  const label = FOCUS_META[focus]?.label ?? "トレーニングの日";
  return { title: `きょうは${label}`, body: "10分だけでも動くと、続いていきます。" };
}

/* 予約を入れ直す。呼ぶ側は「変わったら呼ぶ」だけでよい */
async function syncSchedule({ notifyTime, notifyOn, plan, log, today }) {
  if (!notifySupported()) return { scheduled: 0, reason: "unsupported" };

  await cancelAll();
  if (notifyOn === false) return { scheduled: 0, reason: "off" };
  if (!plan) return { scheduled: 0, reason: "no-plan" };
  if ((await getPermission()) !== "granted") return { scheduled: 0, reason: "no-permission" };

  const now = new Date();
  const notifications = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const k = dateKey(d);
    const rec = log?.[k];
    /* すでにやりきった日・お休みにした日は、声をかけない */
    if (rec?.done || rec?.skip) continue;

    const at = atTime(d, notifyTime);
    if (at <= now) continue; /* 今日のぶんで時刻を過ぎている場合 */

    const focus = plan[d.getDay()]?.focus ?? "rest";
    const { title, body } = messageFor(focus);
    notifications.push({ id: IDS[i], title, body, schedule: { at } });
  }

  if (!notifications.length) return { scheduled: 0, reason: "nothing-to-schedule" };
  try {
    await LocalNotifications.schedule({ notifications });
    return { scheduled: notifications.length, reason: "ok" };
  } catch (e) {
    return { scheduled: 0, reason: "failed" };
  }
}

/* 設定画面の「ためしに鳴らす」。許可が下りているかを利用者自身が確かめられるようにする */
async function sendTest() {
  if (!notifySupported()) return false;
  if ((await getPermission()) !== "granted") return false;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: ID_BASE + 99,
        title: "イエトレ",
        body: "お知らせはこのように届きます。",
        schedule: { at: new Date(Date.now() + 5000) },
      }],
    });
    return true;
  } catch (e) {
    return false;
  }
}

export { cancelAll, getPermission, messageFor, notifySupported, requestPermission, sendTest, syncSchedule };
