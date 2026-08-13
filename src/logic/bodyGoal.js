/* =========================================================================
   「まずの目標」体重の計算。

   もとは Questionnaire.jsx の中に直接書かれていた。
   v17.2 でここに不具合が見つかっている（下限を下回る目標を出していた）ので、
   テストが書けるように関数として切り出した。計算そのものは変えていない。

   考え方
   - いまの体重の 3% 減を、最初の目標にする
   - ただし、標準とされる範囲の下限（BMI 18.5）を下回らせない
   - 3% 引いた先が下限で止まって「いまとほとんど変わらない」なら、
     減量の目標そのものを出さない（もともと範囲の下のほうにいる人）
   - いま既に BMI 18.5 未満の人には、はじめから出さない
   ========================================================================= */

const BMI_FLOOR = 18.5;

/* 身長(cm)から、標準とされる範囲の下限の体重(kg)を出す */
const floorKgFor = (heightCm) =>
  heightCm > 0 ? Math.ceil(BMI_FLOOR * ((heightCm / 100) ** 2) * 10) / 10 : null;

const bmiOf = (heightCm, kg) =>
  heightCm > 0 && kg > 0 ? kg / ((heightCm / 100) ** 2) : null;

/* 画面が必要とする値をまとめて返す。
     firstGoal   … 出すべき目標体重（出さないなら null）
     goalAtFloor … 下限で止めた結果、3%減より重くなっているか
     nearFloor   … 目標がいまとほとんど変わらない（＝出す意味がない）
     lowNow      … いますでに下限を下回っている
     tooLow      … 本人が入力した目標体重が下限を下回っている            */
function bodyGoal({ heightCm, nowKg, goalKg }) {
  const h = Number(heightCm), now = Number(nowKg), goal = Number(goalKg);
  const bmiNow = bmiOf(h, now);
  const lowNow = bmiNow != null && bmiNow < BMI_FLOOR;
  const floorKg = floorKgFor(h);

  const rawGoal = now > 0 && !lowNow ? Math.round(now * 0.97 * 10) / 10 : null;
  const firstGoal = rawGoal == null ? null : floorKg == null ? rawGoal : Math.max(rawGoal, floorKg);
  const goalAtFloor = firstGoal != null && rawGoal != null && firstGoal > rawGoal;
  const nearFloor = firstGoal != null && firstGoal >= now - 0.05;

  const goalBmi = bmiOf(h, goal);
  const tooLow = goalBmi != null && goalBmi < BMI_FLOOR;

  return { bmiNow, lowNow, floorKg, rawGoal, firstGoal, goalAtFloor, nearFloor, goalBmi, tooLow };
}

export { BMI_FLOOR, bmiOf, bodyGoal, floorKgFor };
