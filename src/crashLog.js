/* =========================================================================
   不具合の記録。

   ロードマップには「クラッシュの監視を入れる（Sentry など）」と書いたが、
   そのまま入れると自分たちのプライバシーポリシーと矛盾する。
   「データを一切外部へ送りません」と書いておきながら、
   落ちたときだけ端末の情報を送るのでは、約束を破っていることになる。
   その一行はストアの審査でも、利用者に対しても、いちばん効く売りなので崩さない。

   代わりに、落ちた記録を端末の中だけに残す。
   利用者が自分で見て、自分の意思でコピーして送れる形にする。
   （送るかどうかを決めるのは、こちらではなく利用者）

   保存は最新5件まで。古いものから捨てる。
   ========================================================================= */
import { Preferences } from "@capacitor/preferences";
import { isNative } from "./platform.js";

const K_CRASH = "hometrain:crash:v1";
const MAX = 5;
const STACK_MAX = 1200;

/* storage.js と同じ置き場所を使う。ただし読み書きが同期でよい場面もあるので、
   ここでは独立した小さな入口を持たせている */
async function readRaw() {
  try {
    if (isNative()) return (await Preferences.get({ key: K_CRASH })).value ?? null;
    return window.localStorage?.getItem(K_CRASH) ?? null;
  } catch (e) {
    return null;
  }
}

async function writeRaw(json) {
  try {
    if (isNative()) await Preferences.set({ key: K_CRASH, value: json });
    else window.localStorage?.setItem(K_CRASH, json);
  } catch (e) {
    /* 保存できなくても、落ちた画面の表示そのものは出す */
  }
}

async function listCrashes() {
  const raw = await readRaw();
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

/* 落ちたときに呼ぶ。個人が特定できるものは入れない
   （名前・体重・写真・メモは、はじめから記録しない） */
async function recordCrash(error, info) {
  const entry = {
    at: new Date().toISOString(),
    v: typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "unknown",
    platform: isNative() ? "native" : "web",
    message: String(error?.message ?? error ?? "").slice(0, 300),
    stack: String(error?.stack ?? "").slice(0, STACK_MAX),
    component: String(info?.componentStack ?? "").slice(0, STACK_MAX),
  };
  const list = await listCrashes();
  await writeRaw(JSON.stringify([entry, ...list].slice(0, MAX)));
  return entry;
}

async function clearCrashes() {
  try {
    if (isNative()) await Preferences.remove({ key: K_CRASH });
    else window.localStorage?.removeItem(K_CRASH);
  } catch (e) {
    /* 何もしない */
  }
}

/* 利用者がそのまま貼って送れる文面にする */
function crashText(list) {
  if (!list?.length) return "";
  return list
    .map((c, i) => [
      `--- ${i + 1}件目 ---`,
      `日時: ${c.at}`,
      `版: ${c.v}（${c.platform}）`,
      `内容: ${c.message}`,
      c.stack ? `場所:\n${c.stack}` : "",
      c.component ? `画面:\n${c.component}` : "",
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}

export { clearCrashes, crashText, listCrashes, recordCrash };
