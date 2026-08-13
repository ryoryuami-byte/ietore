import { useEffect, useRef } from "react";
import { REST_SEC } from "./utils.js";

/* ================= 保存 ================= */
/* v9は全部を1キーに入れていたため、写真が増えると記録の保存ごと失敗した。
   用途ごとに3つへ分割し、変わったキーだけ書き込む。 */
const K_CORE = "hometrain:core:v1";
const K_LOG = "hometrain:log:v1";
const K_PHOTOS = "hometrain:photos:v1";
const K_LEGACY = "hometrain:v5";

const DEFAULT_CORE = {
  name: "", profile: null, plan: null, weights: [], trackWeight: true, cheers: [], notifyTime: "20:00",
  restSec: REST_SEC, sound: true, weekSeen: "",
};

/* window.storage はプレビュー環境（Claudeのアーティファクト）にしか無い。
   実機・ブラウザ・アプリ化後は localStorage に保存する。 */
const hasHostStorage = () => typeof window !== "undefined" && !!window.storage;
const hasLocal = () => {
  try { return typeof window !== "undefined" && !!window.localStorage; }
  catch (e) { return false; /* プライベートブラウズ等で参照自体が失敗する場合 */ }
};

async function readJSON(key) {
  try {
    if (hasHostStorage()) {
      const r = await window.storage.get(key, false);
      return r ? JSON.parse(r.value) : null;
    }
    if (!hasLocal()) return null;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null; /* 未作成のキーは例外になる */
  }
}
async function writeJSON(key, value) {
  const json = JSON.stringify(value);
  if (hasHostStorage()) {
    await window.storage.set(key, json, false);
    return;
  }
  if (!hasLocal()) throw new Error("no-storage");
  window.localStorage.setItem(key, json); /* 容量超過は例外になり、保存失敗の表示が出る */
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

export { DEFAULT_CORE, K_CORE, K_LEGACY, K_LOG, K_PHOTOS, readJSON, useAutoSave, writeJSON };
