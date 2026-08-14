/* =========================================================================
   連続日数と、その保護。

   habit tracking の調査で、いちばん大きな離脱点は
   「連続が切れた瞬間」だと分かっている（切れた人の44%がそのままやめる）。
   イエトレは元から「ととのえる日」と「お休み申告」で切れにくくしてあるが、
   何も言わずに1日あけてしまった日は、そこで途切れていた。

   v18.4 で2つ足した。
     ① 保護（フリーズ）… ひと月に1日だけ、黙って休んでも切れない
     ② 切れたときの声かけ … 切れた事実を責めずに伝え、その日に戻す

   保護は「使った回数を保存する」形にしていない。
   同じ記録からは必ず同じ答えが出るように、
   「その月に免除できるのは1日まで」という決まりだけで計算する。
   保存を増やさなければ、引き継ぎも壊れない。
   ========================================================================= */

/* ひと月に免除できる日数 */
const FREEZE_PER_MONTH = 1;

const monthKey = (dateStr) => dateStr.slice(0, 7);

/* 連続日数を数える。

     log       … 日付キー → 記録
     plan      … 曜日 → その日の予定（ととのえる日かどうかを見る）
     today     … Date
     dateKey   … 日付キーを作る関数（utils から渡す。循環importを避けるため）
     trained   … その日にやったか（AppInner と同じ判定を渡す）
     freezeOn  … 保護を使うか（設定）

   返すもの
     days      … 連続日数
     frozen    … 保護で救った日（日付キーの配列）
     brokeAt   … 切れた日（あれば）。声かけに使う
*/
function computeStreak({ log, plan, today, dateKey, trained, freezeOn = true }) {
  if (!plan) return { days: 0, frozen: [], brokeAt: null };

  const focusOn = (d) => log?.[dateKey(d)]?.focus ?? plan[d.getDay()]?.focus ?? "rest";
  const usedByMonth = {};
  const frozen = [];
  let days = 0;
  let brokeAt = null;

  const d = new Date(today);
  for (let i = 0; i < 400; i++) {
    const k = dateKey(d);
    if (trained(k)) {
      days++;
    } else if (log?.[k]?.skip) {
      /* お休み申告：本人が伝えている。連続は止まらない */
    } else if (focusOn(d) === "rest") {
      /* もともと予定の無い日 */
    } else if (i === 0) {
      /* 今日はこれから。まだ切れていない */
    } else if (freezeOn && (usedByMonth[monthKey(k)] ?? 0) < FREEZE_PER_MONTH) {
      /* 何も言わずにあいた日。ひと月に1日だけ見逃す */
      usedByMonth[monthKey(k)] = (usedByMonth[monthKey(k)] ?? 0) + 1;
      frozen.push(k);
    } else {
      brokeAt = k;
      break;
    }
    d.setDate(d.getDate() - 1);
  }

  return { days, frozen, brokeAt };
}

/* お祝いする節目。ここを増やすと、その日数で特別な画面が出る */
const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

/* いま達したばかりの節目。無ければ null */
const milestoneOf = (days) => (MILESTONES.includes(days) ? days : null);

/* 節目ごとの言葉。数字だけ出すより、何を成し遂げたかを言うほうが効く */
const MILESTONE_WORDS = {
  3: { title: "3日つづいた", body: "いちばん切れやすいところを越えました。" },
  7: { title: "1週間つづいた", body: "ここまで来る人は、そんなに多くありません。" },
  14: { title: "2週間つづいた", body: "体より先に、生活のほうが変わりはじめます。" },
  30: { title: "1か月つづいた", body: "もう「たまにやる人」ではありません。" },
  50: { title: "50日つづいた", body: "やらない日のほうが、めずらしくなりました。" },
  100: { title: "100日つづいた", body: "これはもう、あなたの習慣です。" },
  200: { title: "200日つづいた", body: "言葉が出ません。すごいです。" },
  365: { title: "1年つづいた", body: "1年前の自分に、見せてあげたい。" },
};

/* 切れたあとの声かけ。責めない。「二度は休まない」だけを伝える */
function recoveryMessage(brokeAt, daysSince) {
  if (!brokeAt) return null;
  if (daysSince <= 1) {
    return { title: "1日あきました", body: "1日は休みです。二度あくと、そこから戻りにくくなります。今日やれば、それで終わりです。" };
  }
  if (daysSince <= 6) {
    return { title: `${daysSince}日あきました`, body: "数え直しになりますが、体に入ったものは消えていません。今日から積み直しましょう。" };
  }
  return { title: "おかえりなさい", body: "空いた日数は気にしないでください。戻ってきたことのほうが、ずっと大事です。" };
}

export { computeStreak, FREEZE_PER_MONTH, MILESTONES, MILESTONE_WORDS, milestoneOf, recoveryMessage };
