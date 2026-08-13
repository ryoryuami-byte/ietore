import { useEffect, useRef } from "react";
import { Preferences } from "@capacitor/preferences";
import { REST_SEC } from "./utils.js";
import { hydratePhotos, offloadPhotos } from "./photoFiles.js";
import { isNative } from "./platform.js";

/* ================= 保存 ================= */
/* v9は全部を1キーに入れていたため、写真が増えると記録の保存ごと失敗した。
   用途ごとに3つへ分割し、変わったキーだけ書き込む。

   保存先はここだけが知っている。呼ぶ側（AppInner / Boundary）は
   readJSON / writeJSON の2つしか見ていないので、
   置き場所が変わってもここ以外は直さなくてよい。

     ネイティブ … Capacitor Preferences（写真の実体だけ photoFiles.js がファイルへ）
     プレビュー … window.storage
     ブラウザ   … localStorage
*/
const K_CORE = "hometrain:core:v1";
const K_LOG = "hometrain:log:v1";
const K_PHOTOS = "hometrain:photos:v1";
const K_LEGACY = "hometrain:v5";

const DEFAULT_CORE = {
  name: "", profile: null, plan: null, weights: [], trackWeight: true, cheers: [], notifyTime: "20:00",
  restSec: REST_SEC, sound: true, weekSeen: "",
  /* v18 で追加 */
  consent: null,      /* 注意書きと規約に同意した記録 */
  health: [],         /* 初回に聞いた健康状態 */
  notifyOn: true,     /* お知らせを使うか。端末側の許可とは別 */
  notifyAsked: false, /* 通知の許可を1回でも求めたか */
};

/* window.storage はプレビュー環境（Claudeのアーティファクト）にしか無い。
   ブラウザでは localStorage に保存する。 */
const hasHostStorage = () => typeof window !== "undefined" && !!window.storage;
const hasLocal = () => {
  try { return typeof window !== "undefined" && !!window.localStorage; }
  catch (e) { return false; /* プライベートブラウズ等で参照自体が失敗する場合 */ }
};

/* 文字列そのものの読み書き。JSON にするのは一段上でやる */
async function readRaw(key) {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }
  if (hasHostStorage()) {
    const r = await window.storage.get(key, false);
    return r ? r.value : null;
  }
  if (!hasLocal()) return null;
  return window.localStorage.getItem(key);
}

async function writeRaw(key, json) {
  if (isNative()) {
    await Preferences.set({ key, value: json });
    return;
  }
  if (hasHostStorage()) {
    await window.storage.set(key, json, false);
    return;
  }
  if (!hasLocal()) throw new Error("no-storage");
  window.localStorage.setItem(key, json); /* 容量超過は例外になり、保存失敗の表示が出る */
}

async function readJSON(key) {
  try {
    const raw = await readRaw(key);
    const value = raw ? JSON.parse(raw) : null;
    /* 写真だけは、保存されている形（ファイル名）から表示できる形に戻す */
    if (key === K_PHOTOS) return await hydratePhotos(value);
    return value;
  } catch (e) {
    return null; /* 未作成のキーは例外になる */
  }
}

async function writeJSON(key, value) {
  if (key === K_PHOTOS) {
    /* 新しい写真をファイルへ書き出し、保存領域にはファイル名だけを残す */
    const stored = await offloadPhotos(value);
    await writeRaw(key, JSON.stringify(stored));
    return;
  }
  await writeRaw(key, JSON.stringify(value));
}

/* すべての記録を消す。

   端末の中にしかデータが無いアプリなので、消す手段は自前で持つ必要がある。
   写真の実体（ファイル）まで消さないと、アプリの見た目は空でも
   端末の容量は減らないままになる。 */
async function eraseEverything() {
  /* 先に写真のファイルを片づける。offloadPhotos([]) は
     「一覧に無いファイルを消す」ので、空の一覧を渡せば全部消える */
  try { await offloadPhotos([]); } catch (e) { /* ファイルが無い場合など */ }

  for (const key of [K_CORE, K_LOG, K_PHOTOS, K_LEGACY]) {
    try {
      if (isNative()) await Preferences.remove({ key });
      else if (hasHostStorage()) await window.storage.set(key, "", false);
      else if (hasLocal()) window.localStorage.removeItem(key);
    } catch (e) {
      /* 1つ消せなくても、残りは消しにいく */
    }
  }
}

/* 値が変わったときだけ、少し待ってから書き込む */
function useAutoSave(key, value, ready, setErr) {
  const last = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(value);
    if (last.current === null) { last.current = json; return; }
    if (last.current === json) return;
    last.current = json;
    const t = setTimeout(async () => {
      try { await writeJSON(key, value); setErr(false); }
      catch (e) { setErr(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [key, value, ready, setErr]);
}

export {
  DEFAULT_CORE, eraseEverything, K_CORE, K_LEGACY, K_LOG, K_PHOTOS,
  readJSON, useAutoSave, writeJSON,
};
