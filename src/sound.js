/* ================= 音・振動 ================= */
let audioCtx = null;
/* 設定のオン／オフ。描画のたびに読むのではなく、変わったときだけ入れ替える */
let soundOn = true;
const setSoundEnabled = (v) => { soundOn = v !== false; };
/* iOSは操作をきっかけにしないと音を出せない。最初のタップで用意しておく */
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { /* 音が出せない環境 */ }
}
function beep(times = 1) {
  try {
    if (!soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const t0 = audioCtx.currentTime + i * 0.25;
      o.frequency.value = 880; o.type = "sine";
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.22);
    }
  } catch (e) { /* 何もしない */ }
}
function buzz(pattern = [180]) {
  /* iOS Safari は vibrate に非対応。対応端末だけで鳴る */
  try { if (soundOn) navigator.vibrate?.(pattern); } catch (e) { /* 非対応端末 */ }
}
/* 残り3・2・1で鳴らす短い音。終了音より小さく、高さも変えて区別する */
function tick() {
  try {
    if (!soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t0 = audioCtx.currentTime;
    o.frequency.value = 620; o.type = "sine";
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + 0.1);
  } catch (e) { /* 何もしない */ }
}
/* テンポ音。「3秒で下ろす」を刻む。
   下ろすときと上げるときで高さを変え、折り返しが耳で分かるようにする。
   刻み音（tick）より低く短くして、残り3秒の合図と取り違えないようにする */
function beepTempo(down) {
  try {
    if (!soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t0 = audioCtx.currentTime;
    o.frequency.value = down ? 330 : 440; o.type = "triangle";
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + 0.07);
  } catch (e) { /* 何もしない */ }
}

function signal(strong) {
  beep(strong ? 3 : 1);
  buzz(strong ? [120, 80, 120, 80, 220] : [180]);
}

export { beepTempo, setSoundEnabled, signal, tick, unlockAudio };
