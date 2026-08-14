import { Fig } from "../components/Fig.jsx";
import { Header } from "../components/common.jsx";
import { WeekSummary } from "../components/WeekSummary.jsx";
import { EX, phaseOf } from "../exercises.js";
import { estimateMin } from "../logic/plan.js";
import { MILESTONE_WORDS, milestoneOf, recoveryMessage } from "../logic/streak.js";
import { C, DISPLAY, card, sticker } from "../tokens.js";
import { daysBetween } from "../utils.js";

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
  dayIds, dayLv, dayStage, restSec, log, today, todayKey, trainedToday, skipRec,
  weekGoal, weekDone, frozen, brokeAt,
  onStart, onOpenTrain, onSkip,
}) {
  const mains = dayIds.filter((id) => phaseOf(id) === "main");
  const minutes = estimateMin(dayIds, dayLv, dayStage, half, restSec);

  /* 節目。到達した「その日」だけ出す */
  const milestone = trainedToday ? milestoneOf(streak) : null;
  const words = milestone ? MILESTONE_WORDS[milestone] : null;

  /* 切れたときの声かけ。連続が0に戻っていて、まだ今日をやっていない人にだけ */
  const recovery = !trainedToday && streak === 0 && brokeAt
    ? recoveryMessage(brokeAt, Math.abs(daysBetween(brokeAt, todayKey)))
    : null;

  /* 週の目標のリング */
  const goalPct = weekGoal > 0 ? Math.min(100, Math.round((weekDone / weekGoal) * 100)) : 0;
  const R = 26, circ = 2 * Math.PI * R;

  /* 今月の保護。使っていたら、黙って救わずに伝える */
  const frozenThisMonth = (frozen ?? []).filter((k) => k.slice(0, 7) === todayKey.slice(0, 7));

  return (
    <div className="mt-2 grid gap-5">
      <Header name={name} dow={dow} meta={meta} pct={pct} done={done} total={total}
        streak={streak} weeks={weeks} sealed={sealed} rest={rest} lv={lv} stage={stage} half={half} />

      {/* 節目のお祝い。数字だけでなく、何を成し遂げたかを言う */}
      {words && (
        <div style={{ background: C.pinkSoft }} className="rounded-3xl px-5 py-5 text-center cheer">
          <p className="text-4xl mb-2" aria-hidden="true">🎉</p>
          <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-xl font-bold mb-1">{words.title}</p>
          <p style={{ color: C.ink }} className="text-sm">{words.body}</p>
        </div>
      )}

      {/* 切れたあと。責めない */}
      {recovery && (
        <div style={card({ borderColor: C.lav })} className="border-2 rounded-3xl px-5 py-5">
          <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-base font-bold mb-1">{recovery.title}</p>
          <p style={{ color: C.muted }} className="text-sm leading-relaxed">{recovery.body}</p>
        </div>
      )}

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

      {/* 週の目標。日ごとに追うより挫折しにくい */}
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 flex items-center gap-5">
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" className="shrink-0">
          <circle cx="38" cy="38" r={R} fill="none" stroke={C.lavSoft} strokeWidth="8" />
          <circle cx="38" cy="38" r={R} fill="none" stroke={goalPct >= 100 ? C.mintText : C.lavText} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - goalPct / 100)}
            transform="rotate(-90 38 38)" style={{ transition: "stroke-dashoffset .45s ease" }} />
          <text x="38" y="43" textAnchor="middle"
            style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, fill: goalPct >= 100 ? C.mintText : C.lavText }}>
            {weekDone}/{weekGoal}
          </text>
        </svg>
        <div className="min-w-0">
          <p style={{ fontFamily: DISPLAY }} className="text-base font-bold mb-1">今週の目標</p>
          <p style={{ color: C.muted }} className="text-sm leading-relaxed">
            {goalPct >= 100
              ? "今週ぶんは達成しました。ここから先はおまけです。"
              : `あと ${weekGoal - weekDone} 回で今週ぶんです。`}
          </p>
          {frozenThisMonth.length > 0 && (
            <p style={{ color: C.lavText }} className="text-xs font-bold mt-2">
              🛡 今月は1日ぶん、連続を守りました
            </p>
          )}
        </div>
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
