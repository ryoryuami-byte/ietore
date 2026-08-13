/* =========================================================================
   声かけ。「いつ、何を言うか／鳴らすか」を決める。

   speech.js は「言う」だけ、sound.js は「鳴らす」だけを知っている。
   その2つをいつ使うかの判断は、画面のあちこちに散らすと必ずずれるので、
   ここ1か所に集めた。

   **声かけを足したいときは、この下に関数を1つ足す。**
   画面側はその関数を呼ぶだけでよく、
   「設定がオフなら黙る」「端末が対応していなければ何もしない」は
   すべてここが引き受ける。

   使う側から見た約束
     - 設定を見るのはここだけ。呼ぶ側は毎回そのまま呼んでよい
     - 返り値は「片づけ用の関数」か undefined。画面を離れるとき呼ぶ
   ========================================================================= */
import { EX } from "./exercises.js";
import { tempoSecOf, voiceRateOf } from "./settings.js";
import { beepTempo, tick } from "./sound.js";
import { cancelSpeech, setVoiceEnabled, setVoiceRate, speak } from "./speech.js";

/* 設定が変わったら呼ぶ。AppInner が面倒を見る */
function applyCoachSettings(core) {
  setVoiceEnabled(core?.voiceOn !== false);
  setVoiceRate(voiceRateOf(core));
}

const on = (core, id) => core?.[id] !== false;

/* ---- ① これから何をやるか ---------------------------------------------- */
function sayExercise(core, id, sp) {
  if (!on(core, "voiceOn")) return;
  const ex = EX[id];
  if (!ex) return;
  const amount = ex.type === "time"
    ? `${sp.amount}秒`
    : `${sp.amount}回`;
  const side = ex.perSide ? "左右それぞれ" : "";
  speak(`${ex.name}。${side}${amount}`, { interrupt: true });
}

/* ---- ② はじめる前のカウントダウン --------------------------------------- */
/* 「3、2、1、はじめ」。数える間は毎秒 tick を鳴らす。
   done() は数え終わったときに呼ばれる。
   返す関数を呼ぶと、途中でやめられる（画面を離れたときなど） */
function startCountdown(core, done, { seconds = 3 } = {}) {
  if (!on(core, "countdownOn")) { done(); return () => {}; }

  let n = seconds;
  let dead = false;
  const timers = [];

  const step = () => {
    if (dead) return;
    if (n > 0) {
      if (on(core, "sound")) tick();
      if (on(core, "voiceOn")) speak(String(n), { interrupt: true });
      n -= 1;
      timers.push(setTimeout(step, 1000));
    } else {
      if (on(core, "voiceOn")) speak("はじめ", { interrupt: true });
      done();
    }
  };
  step();

  return () => {
    dead = true;
    timers.forEach(clearTimeout);
    cancelSpeech();
  };
}

/* ---- ③ 回数を数える ------------------------------------------------------ */
/* 回数の種目で、テンポに合わせて「1、2、3…」と数える。
   1回にかける時間は 設定の秒数 × 2（下ろす＋上げる）。
   done() は数え終わったときに呼ばれる */
function startRepCount(core, total, done, { onCount } = {}) {
  if (!on(core, "repCountOn") || !(total > 0)) { done(); return () => {}; }

  const perRep = tempoSecOf(core) * 2 * 1000;
  let i = 0;
  let dead = false;
  let timer = null;

  const step = () => {
    if (dead) return;
    i += 1;
    onCount?.(i);
    if (on(core, "voiceOn")) {
      /* 最後の3回は「あと3回」と言い換えたほうが、終わりが見える */
      const left = total - i;
      speak(left > 0 && left <= 2 ? `${i}。あと${left}回` : String(i), { interrupt: true });
    }
    if (i >= total) {
      if (on(core, "voiceOn")) setTimeout(() => speak("おしまい"), 400);
      done();
      return;
    }
    timer = setTimeout(step, perRep);
  };
  timer = setTimeout(step, perRep);

  return () => {
    dead = true;
    clearTimeout(timer);
    cancelSpeech();
  };
}

/* ---- ④ テンポ音 ---------------------------------------------------------- */
/* 「3秒で下ろす」を音で刻む。片道ごとに高さの違う音を鳴らし、
   下ろす／上げるの折り返しが耳で分かるようにする。
   返す関数を呼ぶと止まる */
function startTempo(core) {
  if (!on(core, "tempoOn") || !on(core, "sound")) return () => {};

  const half = tempoSecOf(core) * 1000;
  let down = true;
  const id = setInterval(() => {
    beepTempo(down);
    down = !down;
  }, half);
  beepTempo(down);
  down = false;

  return () => clearInterval(id);
}

/* ---- ⑤ 残り時間の声かけ -------------------------------------------------- */
/* 秒数の種目で、節目だけ知らせる。毎秒しゃべると耳障りになる */
function sayRemain(core, remain) {
  if (!on(core, "voiceOn")) return;
  if (remain === 30 || remain === 10) speak(`あと${remain}秒`);
  else if (remain === 3) speak("あと3秒");
}

/* ---- ⑥ 左右の切り替え ---------------------------------------------------- */
function saySwitchSide(core) {
  if (!on(core, "voiceOn")) return;
  speak("反対側に替えてください", { interrupt: true });
}

/* ---- ⑦ 休憩 -------------------------------------------------------------- */
function sayRest(core, sec) {
  if (!on(core, "voiceOn")) return;
  speak(`${sec}秒、休みましょう`);
}

function sayDone(core) {
  if (!on(core, "voiceOn")) return;
  speak("おつかれさまでした", { interrupt: true });
}

export {
  applyCoachSettings, sayDone, sayExercise, sayRemain, sayRest, saySwitchSide,
  startCountdown, startRepCount, startTempo,
};
