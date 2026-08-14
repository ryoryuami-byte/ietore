import { Fig } from "../components/Fig.jsx";
import { Header } from "../components/common.jsx";
import { WeekSummary } from "../components/WeekSummary.jsx";
import { EX, phaseOf } from "../exercises.js";
import { estimateMin } from "../logic/plan.js";
import { C, DISPLAY, card, sticker } from "../tokens.js";

/* =========================================================================
   ホーム。

   タブを5つに分けたときに新しく作った画面（v18.3）。
   以前は「きょう」の1画面に、あいさつ・進みぐあい・種目一覧が
   全部載っていて縦に長かった。ここは要約と入口だけにして、
   実際にやる種目は「トレーニング」に移した。

   ここに出すのは、開いた瞬間に知りたいことだけ。
     - 今日は何の日か、どこまで進んだか
     - いますぐ始められる入口
     - 今週の回数
   ========================================================================= */
function Home({
  name, dow, meta, pct, done, total, streak, weeks, sealed, rest, lv, stage, half,
  dayIds, dayLv, dayStage, restSec, log, today, trainedToday, skipRec,
  onStart, onOpenTrain, onSkip,
}) {
  const mains = dayIds.filter((id) => phaseOf(id) === "main");
  const minutes = estimateMin(dayIds, dayLv, dayStage, half, restSec);

  return (
    <div className="mt-2 grid gap-5">
      <Header name={name} dow={dow} meta={meta} pct={pct} done={done} total={total}
        streak={streak} weeks={weeks} sealed={sealed} rest={rest} lv={lv} stage={stage} half={half} />

      {/* 今日のメニューの入口。ここから始められないと、ホームを置く意味がない */}
      <div style={card()} className="border-2 rounded-3xl px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: DISPLAY }} className="text-base font-bold">今日のメニュー</p>
          <p style={{ color: C.muted }} className="text-xs">{total} 種目 ／ 約{minutes}分</p>
        </div>

        {/* 何をやるかが絵で分かるように、メインの種目を並べる */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(mains.length ? mains : dayIds).slice(0, 5).map((id) => (
            <div key={id} className="shrink-0 text-center" style={{ width: 62 }}>
              <Fig kind={EX[id].fig} size={54} />
              <p style={{ color: C.muted }} className="text-[10px] leading-tight mt-1 line-clamp-2">{EX[id].name}</p>
            </div>
          ))}
        </div>

        {sealed ? (
          <div style={{ background: C.mintSoft, color: C.mintText }}
            className="rounded-2xl py-4 text-center text-sm font-bold">
            今日はやりきりました 🎉
          </div>
        ) : skipRec ? (
          <div style={{ background: C.lavSoft, color: C.lavText }}
            className="rounded-2xl py-4 text-center text-sm font-bold">
            今日はお休みにしました 🍃
          </div>
        ) : (
          <button onClick={onStart}
            style={{ background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }}
            className="fx w-full rounded-full py-4 text-base font-bold">
            {trainedToday ? "つづきをやる" : "はじめる"}
          </button>
        )}

        <button onClick={onOpenTrain} style={{ color: C.pinkDeep }}
          className="fx w-full rounded-full py-3 text-sm font-bold mt-1">
          種目を1つずつ見る ›
        </button>
      </div>

      <WeekSummary log={log} today={today} />

      {!sealed && !skipRec && (
        <button onClick={onSkip} style={{ color: C.muted }} className="fx rounded-full py-2 text-xs font-bold">
          今日はお休みにする
        </button>
      )}
    </div>
  );
}

export { Home };
