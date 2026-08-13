/* =========================================================================
   声で読み上げる。

   運動している人は床にいて、画面を見られない。
   イエトレは「画面を見て、読んで、押す」前提で作られているので、
   ここがいちばん大きな穴だった。

   端末に入っている音声（iOS / Android の読み上げ機能）をそのまま使う。
     - 通信しない。文字がサーバーへ送られることもない
     - 追加のプラグインも音声ファイルも要らない（アプリの容量が増えない）
     - 端末の言語設定に日本語が無い場合は、黙って何もしない

   iOS は「利用者が画面を触るまで音を出せない」ので、
   最初のタップで warmUp() を呼んでおく（sound.js の unlockAudio と同じ考え方）。
   ========================================================================= */

let enabled = true;
let rate = 1.0;
let jaVoice = null;
let warmed = false;

const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : null);

const speechSupported = () => !!synth() && typeof window.SpeechSynthesisUtterance === "function";

const setVoiceEnabled = (v) => { enabled = v !== false; if (!enabled) cancelSpeech(); };
const setVoiceRate = (r) => { rate = Number(r) > 0 ? Number(r) : 1.0; };

/* 日本語の声を選ぶ。端末によって一覧の取得が遅れるので、そのときは後で取り直す */
function pickVoice() {
  const s = synth();
  if (!s) return null;
  try {
    const list = s.getVoices() ?? [];
    if (!list.length) return null;
    return list.find((v) => v.lang === "ja-JP")
      ?? list.find((v) => (v.lang ?? "").startsWith("ja"))
      ?? null;
  } catch (e) {
    return null;
  }
}

/* 最初のタップで呼ぶ。iOS はここを通しておかないと、あとで鳴らせない */
function warmUp() {
  if (warmed || !speechSupported()) return;
  warmed = true;
  try {
    jaVoice = pickVoice();
    /* 声の一覧が非同期で来る端末のために、届いたら取り直す */
    synth().onvoiceschanged = () => { jaVoice = pickVoice(); };
    /* 無音を1つ流して、読み上げの権利を得ておく */
    const u = new window.SpeechSynthesisUtterance(" ");
    u.volume = 0;
    synth().speak(u);
  } catch (e) {
    /* 使えない端末では、以降 speak が黙って何もしない */
  }
}

function cancelSpeech() {
  try { synth()?.cancel(); } catch (e) { /* 何もしない */ }
}

/* 読み上げる。
   interrupt=true なら、いま喋っている途中でも割り込む
   （「あと3回」より「はい、次」を優先したい場面がある） */
function speak(text, { interrupt = false } = {}) {
  if (!enabled || !text || !speechSupported()) return;
  try {
    const s = synth();
    if (interrupt) s.cancel();
    const u = new window.SpeechSynthesisUtterance(String(text));
    u.lang = "ja-JP";
    u.rate = rate;
    u.pitch = 1.0;
    if (!jaVoice) jaVoice = pickVoice();
    if (jaVoice) u.voice = jaVoice;
    s.speak(u);
  } catch (e) {
    /* 読み上げに失敗しても、トレーニング自体は続けられる */
  }
}

export { cancelSpeech, setVoiceEnabled, setVoiceRate, speak, speechSupported, warmUp };
