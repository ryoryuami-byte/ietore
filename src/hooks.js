import { useState, useEffect } from "react";

/* ================= 背面スクロールの固定 ================= */
/* シートを開いている間に指で動かすと、後ろの画面がスクロールしてしまい、
   閉じたときに元の位置に戻らない。開いている数を数えて、最後の1つが閉じたら戻す。 */
let bodyLocks = 0;
let bodyLockY = 0;
function useBodyLock() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const b = document.body;
    if (bodyLocks === 0) {
      bodyLockY = window.scrollY;
      b.style.overflow = "hidden";
      b.style.position = "fixed";
      b.style.top = `-${bodyLockY}px`;
      b.style.left = "0";
      b.style.right = "0";
    }
    bodyLocks++;
    return () => {
      bodyLocks = Math.max(0, bodyLocks - 1);
      if (bodyLocks === 0) {
        b.style.overflow = "";
        b.style.position = "";
        b.style.top = "";
        b.style.left = "";
        b.style.right = "";
        window.scrollTo(0, bodyLockY);
      }
    };
  }, []);
}

/* ================= 画面スリープ防止 ================= */
/* トレーニング中に画面が消えないようにする。
   Wake Lock API は対応していない端末・ブラウザがあるので、使えなければ何もしない */
function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.wakeLock) return;
    let lock = null, dead = false;
    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request("screen");
        if (dead) { l.release(); return; }
        lock = l;
      } catch (e) { /* 拒否・非対応 */ }
    };
    acquire();
    /* 画面を離れると自動で解除されるので、戻ってきたら取り直す */
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onVis);
      try { lock?.release(); } catch (e) { /* すでに解除済み */ }
    };
  }, [active]);
}

/* ================= カウントダウン（時刻基準） ================= */
/* 経過時間ではなく終了時刻で計算するので、画面を離れて戻ってもずれない */
function useCountdown() {
  const [endAt, setEndAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    /* iOSは復帰時に鳴るイベントがばらつくので3つとも拾う */
    const onWake = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, [endAt]);
  const remain = endAt == null ? null : Math.max(0, Math.ceil((endAt - now) / 1000));
  const start = (sec) => { const t = Date.now(); setNow(t); setEndAt(t + sec * 1000); };
  const stop = () => setEndAt(null);
  return { endAt, remain, start, stop };
}

export { useBodyLock, useCountdown, useWakeLock };
