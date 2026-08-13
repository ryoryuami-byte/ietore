/* =========================================================================
   設定の定義。

   ここまで、設定は3か所にばらばらに書かれていた。
     ① storage.js の DEFAULT_CORE（初期値）
     ② logic/validate.js の normalizeCore（読み込んだ値の検証）
     ③ screens/Settings.jsx の画面（見た目と操作）
   1つ足すたびに3か所を直す必要があり、どれか忘れると
   「保存はされるが検証で消える」ような、気づきにくい壊れかたをする。

   この先も設定を足していく前提なので、1か所にまとめた。
   **新しい設定を足すときは、この配列に1行足すだけでよい。**
   初期値・検証・設定画面の並びは、すべてここから自動で作られる。

   type
     toggle … オン／オフ
     choice … いくつかから1つ選ぶ（options に [値, 表示] を並べる）
     time   … 時刻（"20:00"）
     free   … ここでは検証だけ行い、画面は自分で書く
   ========================================================================= */

const SETTINGS = [
  /* ---- 動きながら使う（v18.1 で追加） ---- */
  {
    id: "voiceOn", type: "toggle", def: true,
    group: "coach", label: "声で案内する",
    note: "種目の名前・残りの回数・切り替えを読み上げます。"
      + "床にいて画面が見えないときのための機能です。端末に入っている音声を使うので、通信はしません。",
  },
  {
    id: "voiceRate", type: "choice", def: "normal",
    group: "coach", label: "声の速さ",
    options: [["slow", "ゆっくり"], ["normal", "ふつう"], ["fast", "はやい"]],
    dependsOn: "voiceOn",
  },
  {
    id: "countdownOn", type: "toggle", def: true,
    group: "coach", label: "はじめる前のカウントダウン",
    note: "「3、2、1、はじめ」。構える時間ができます。",
  },
  {
    id: "repCountOn", type: "toggle", def: true,
    group: "coach", label: "回数を数える",
    note: "回数の種目で、テンポに合わせて数えます。自分で数えなくてよくなります。",
  },
  {
    id: "tempoOn", type: "toggle", def: true,
    group: "coach", label: "テンポ音",
    note: "「ゆっくり下ろす」を音で刻みます。速く動きすぎるのを防ぎます。",
  },
  {
    id: "tempoSec", type: "choice", def: "3",
    group: "coach", label: "1回にかける秒数",
    options: [["2", "2秒"], ["3", "3秒（おすすめ）"], ["4", "4秒"]],
    note: "下ろす・上げるのそれぞれにかける秒数です。1回あたりはこの倍かかります。",
    dependsOn: "tempoOn",
  },

  /* ---- もとからある設定 ---- */
  { id: "sound", type: "toggle", def: true, group: "sound", label: "音とバイブ" },
  { id: "notifyOn", type: "toggle", def: true, group: "notify", label: "お知らせ" },
  { id: "notifyTime", type: "time", def: "20:00", group: "notify", label: "お知らせの時刻" },
  { id: "trackWeight", type: "toggle", def: true, group: "body", label: "体重の記録（日曜日）" },
  {
    /* 既定の30秒は utils.js の REST_SEC と同じ値。片方だけ変えないこと */
    id: "restSec", type: "choice", def: 30, group: "rest", label: "セット間の休憩",
    options: [[15, "15秒"], [30, "30秒"], [45, "45秒"], [60, "60秒"]],
  },
  { id: "notifyAsked", type: "free", def: false, group: null },
];

/* restSec の既定は utils.js の REST_SEC と合わせる。
   ここで直接 import すると循環するので、値だけ持たせて下で突き合わせる */
const byId = Object.fromEntries(SETTINGS.map((s) => [s.id, s]));

/* 初期値。DEFAULT_CORE はこれを取り込む */
const defaults = () => Object.fromEntries(SETTINGS.map((s) => [s.id, s.def]));

/* 読み込んだ値をならす。知らない値・壊れた値は初期値に戻す */
function normalizeSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const s of SETTINGS) {
    const v = src[s.id];
    if (s.type === "toggle") {
      /* はっきり false のときだけ切る。undefined は初期値のまま */
      out[s.id] = v === undefined ? s.def : v !== false;
    } else if (s.type === "choice") {
      const allowed = s.options.map(([val]) => val);
      /* "30" と 30 を取り違えないよう、型もそろえて比べる */
      const hit = allowed.find((a) => a === v || String(a) === String(v));
      out[s.id] = hit === undefined ? s.def : hit;
    } else if (s.type === "time") {
      out[s.id] = /^\d{2}:\d{2}$/.test(v ?? "") ? v : s.def;
    } else {
      out[s.id] = v === undefined ? s.def : v;
    }
  }
  return out;
}

/* 画面に出す並び。group ごとにまとめる */
const groupsOf = (ids) => {
  const out = [];
  for (const s of SETTINGS) {
    if (!s.group || (ids && !ids.includes(s.group))) continue;
    const g = out.find((x) => x.id === s.group);
    if (g) g.items.push(s);
    else out.push({ id: s.group, items: [s] });
  }
  return out;
};

/* dependsOn がある設定は、親がオフなら触れないようにする */
const isEnabled = (s, core) => !s.dependsOn || core?.[s.dependsOn] !== false;

/* 1回にかける秒数（下ろす／上げるの片道）。テンポ音と回数読み上げが使う */
const tempoSecOf = (core) => Number(core?.tempoSec ?? 3) || 3;

/* 声の速さ。Web Speech API の rate に渡す値 */
const VOICE_RATE = { slow: 0.85, normal: 1.0, fast: 1.2 };
const voiceRateOf = (core) => VOICE_RATE[core?.voiceRate] ?? 1.0;

export { byId, defaults, groupsOf, isEnabled, normalizeSettings, SETTINGS, tempoSecOf, voiceRateOf };
