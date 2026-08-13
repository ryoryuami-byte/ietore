import { EX } from "./exercises.js";
import { LEVELS } from "./logic/progress.js";

/* ================= 質問 ================= */
const EMPTY_PROFILE = {
  age: "", height: "", weightNow: "", weightGoal: "",
  goal: "", days: "", minutes: "", activity: "", noise: "", level: "",
  timeOfDay: "",
  area: [], stopReason: [], avoid: [], tendency: [],
};

const NUM_Q = [
  { id: "age", label: "年齢", unit: "歳", ph: "18", min: 10, max: 99 },
  { id: "height", label: "身長", unit: "cm", ph: "158", min: 100, max: 220 },
  { id: "weightNow", label: "今の体重", unit: "kg", ph: "55", min: 25, max: 200 },
  { id: "weightGoal", label: "いつかの目標体重", unit: "kg", ph: "52", min: 25, max: 200 },
];

const ACTIVITY_LEVEL = { none: "gentle", little: "easy", some: "normal" };

const SELECT_Q = [
  { id: "goal", label: "いちばんの目的は", req: true, opts: [["lose", "体重を減らしたい"], ["tone", "体を引き締めたい"], ["fitness", "体力をつけたい"], ["posture", "姿勢をよくしたい"]] },
  { id: "days", label: "週に何日できそう？", req: true, opts: [["3", "3日"], ["4", "4日"], ["5", "5日"]] },
  /* ここで決まるのは ② メインの「種目数」。実際にかかる時間は強さとレベルで変わるので、
     時間そのものを約束する見出しにしない（画面には計算した「めやす」を出している） */
  { id: "minutes", label: "1回の筋トレの量は", req: true, hint: "② メインの種目数が決まります。かかる時間は、下で選ぶ「強さ」と、続けるうちに上がるレベルで変わります（画面に「めやす」が出ます）。ウォームアップ・有酸素20分・ストレッチはこの外です。", opts: [["10", "短め（3種目）"], ["20", "ふつう（4種目）"], ["30", "しっかり（5種目）"]] },
  { id: "activity", label: "いま、どのくらい動いている？", req: true, hint: "選ぶと、下の「強さ」におすすめを入れます。", opts: [["none", "ほとんど動いていない"], ["little", "たまに歩く程度"], ["some", "週に何度か動いている"]] },
  {
    id: "level", label: "トレーニングの強さ", req: true, hint: "続けるうちに自動で上がります。きついと答えた日が続くと、少し戻ることもあります。",
    opts: LEVELS.map((l) => [l.id, `${l.emoji} ${l.label}（${l.desc}）`]),
  },
  { id: "noise", label: "家で足音を出せる？", req: true, opts: [["ok", "出せる（戸建てなど）"], ["quiet", "出せない（集合住宅）"]] },
  { id: "timeOfDay", label: "やりやすい時間帯は", hint: "お知らせの時刻の初期値に使います。", opts: [["morning", "朝"], ["evening", "夜"], ["anytime", "日による"]] },
];

const AREA_Q = [
  ["bellyUp", "おなか（上）"], ["bellyLow", "下腹"], ["waist", "わき腹・くびれ"],
  ["thighF", "太ももの前"], ["thighB", "太ももの裏"], ["inner", "内もも"],
  ["calf", "ふくらはぎ"], ["hip", "おしり"],
  ["arms", "二の腕"], ["back", "背中"], ["shoulder", "肩・首まわり"], ["posture", "姿勢全体"],
];
const AREA_LABEL = Object.fromEntries(AREA_Q);
/* 記録からセット数を部位ごとに足し上げる */
function areaTotals(log) {
  const t = {};
  for (const rec of Object.values(log ?? {})) {
    for (const [id, cnt] of Object.entries(rec?.ex ?? {})) {
      const ex = EX[id];
      if (!ex || !(cnt > 0)) continue;
      for (const a of ex.area ?? []) t[a] = (t[a] ?? 0) + cnt;
    }
  }
  return t;
}

const REASON_Q = [
  ["busy", "時間がとれなかった"], ["tired", "疲れて動けなかった"],
  ["boring", "飽きてしまった"], ["noresult", "効果が見えずやめた"],
  ["hard", "きつすぎて続かなかった"], ["forget", "やるのを忘れた"],
  ["place", "場所や音の問題でできなかった"], ["alone", "ひとりだと張り合いがない"],
  ["none", "特にない・今回が初めて"],
];
const AVOID_Q = [["none", "ない"], ["knee", "ひざ"], ["back", "腰"], ["shoulder", "肩"], ["wrist", "手首"]];
const TENDENCY_Q = [["cold", "冷えやすい"], ["swell", "むくみやすい"], ["tired", "疲れやすい"], ["stiff", "肩がこりやすい"]];

/* 体質の回答は、種目の並び順に反映する（v9では毎日のタスクにしか使っていなかった） */
const TENDENCY_AREA = {
  cold: ["thighF", "hip"],
  swell: ["calf", "thighB"],
  tired: ["posture"],
  stiff: ["shoulder", "back", "posture"],
};

export { ACTIVITY_LEVEL, AREA_LABEL, AREA_Q, AVOID_Q, EMPTY_PROFILE, NUM_Q, REASON_Q, SELECT_Q, TENDENCY_AREA, TENDENCY_Q, areaTotals };
