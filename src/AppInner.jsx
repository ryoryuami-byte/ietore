import { useState, useEffect, useMemo } from "react";
import { ExerciseDetail } from "./components/ExerciseDetail.jsx";
import { FigStyles } from "./components/Fig.jsx";
import { SessionRunner } from "./components/SessionRunner.jsx";
import { Center, CheerScreen, ExRow, Header, Section, SwapDialog, WelcomeBack } from "./components/common.jsx";
import { FeelingSheet, SkipSheet } from "./components/sheets.jsx";
import { EX, FOCUS_META, PHASE_META, PHASE_ORDER, phaseOf } from "./exercises.js";
import { shrinkImage } from "./image.js";
import { buildDay, buildPlan, estimateMin, levelOf, mainIdOf, planIsValid, shortIds } from "./logic/plan.js";
import { spec, stageOf } from "./logic/progress.js";
import { capPhotos, normalizeCore, normalizeLog, normalizePhotos } from "./logic/validate.js";
import { EMPTY_PROFILE } from "./questions.js";
import { LogView, WeekReview } from "./screens/LogView.jsx";
import { Questionnaire } from "./screens/Questionnaire.jsx";
import { SaveBanner, Settings, TabBar } from "./screens/Settings.jsx";
import { setSoundEnabled, unlockAudio } from "./sound.js";
import { DEFAULT_CORE, K_CORE, K_LEGACY, K_LOG, K_PHOTOS, readJSON, useAutoSave, writeJSON } from "./storage.js";
import { BODY, C, DISPLAY, DOTS, card, sticker } from "./tokens.js";
import { REST_OPTIONS, REST_SEC, clamp, dateKey, daysBetween } from "./utils.js";

/* ================= 本体 ================= */
function AppInner() {
  const [ready, setReady] = useState(false);
  const [core, setCore] = useState(DEFAULT_CORE);
  const [log, setLog] = useState({});
  const [photos, setPhotos] = useState([]);

  const [tab, setTab] = useState("today");
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [cheerOn, setCheerOn] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [running, setRunning] = useState(false);
  const [askFeeling, setAskFeeling] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);

  /* 日付は起動時に固定しない。日をまたいだら記録先を切り替える */
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()));
  useEffect(() => {
    const check = () => setTodayKey((prev) => { const k = dateKey(new Date()); return prev === k ? prev : k; });
    const t = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
    };
  }, []);
  /* 設定の音オン／オフを反映する */
  useEffect(() => { setSoundEnabled(core.sound); }, [core.sound]);
  /* 最初のタップで音を使えるようにしておく（iOS対策） */
  useEffect(() => {
    const once = () => unlockAudio();
    document.addEventListener("pointerdown", once, { once: true });
    return () => document.removeEventListener("pointerdown", once);
  }, []);

  const today = useMemo(() => new Date(todayKey + "T00:00:00"), [todayKey]);
  const dow = today.getDay();

  /* 読み込み（旧バージョンの1キー保存からの引き継ぎつき） */
  useEffect(() => {
    (async () => {
      let c = await readJSON(K_CORE);
      let l = await readJSON(K_LOG);
      let ph = await readJSON(K_PHOTOS);

      if (!c) {
        const old = await readJSON(K_LEGACY);
        if (old) {
          c = {
            name: old.name ?? "", profile: old.profile ?? null, plan: old.plan ?? null,
            weights: old.weights ?? [], trackWeight: old.trackWeight ?? true,
            cheers: old.cheers ?? [], notifyTime: old.notifyTime ?? "20:00",
          };
          l = old.log ?? {};
          ph = old.photos ?? [];
          try { await writeJSON(K_CORE, c); await writeJSON(K_LOG, l); await writeJSON(K_PHOTOS, ph); } catch (e) { /* あとで再試行される */ }
        }
      }

      if (c) setCore(normalizeCore(c));
      setLog(normalizeLog(l));
      setPhotos(normalizePhotos(ph));
      setReady(true);
    })();
  }, []);

  useAutoSave(K_CORE, core, ready, setSaveError);
  useAutoSave(K_LOG, log, ready, setSaveError);
  useAutoSave(K_PHOTOS, photos, ready, setSaveError);

  const profile = core.profile;
  const plan = useMemo(
    () => (profile ? (planIsValid(core.plan) ? core.plan : buildPlan(profile)) : null),
    [core.plan, profile]
  );

  /* 集計。早期returnより前に置く（フックの順番を守るため） */
  const stats = useMemo(() => {
    const trained = (k) => Object.values(log[k]?.ex ?? {}).some((v) => v > 0);
    /* その日のカテゴリは記録側に残す。あとでプロフィールを変えても過去の表示が変わらない */
    const focusOn = (d) => log[dateKey(d)]?.focus ?? plan?.[d.getDay()]?.focus ?? "rest";

    const keys = Object.keys(log).filter(trained).sort();
    const lastTrained = keys.length ? keys[keys.length - 1] : null;

    let streak = 0;
    if (plan) {
      const d = new Date(today);
      for (let i = 0; i < 400; i++) {
        const k = dateKey(d);
        if (trained(k)) streak++;
        else if (log[k]?.skip) { /* お休み申告：一時停止。連続は切らない */ }
        else if (focusOn(d) === "rest") { /* もともと休みの日 */ }
        else if (i === 0) { /* 今日はこれから */ }
        else break;
        d.setDate(d.getDate() - 1);
      }
    }

    let weeks = 0;
    const cur = new Date(today);
    cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
    for (let w = 0; w < 200; w++) {
      let hit = false;
      for (let i = 0; i < 7; i++) {
        const d = new Date(cur);
        d.setDate(d.getDate() + i);
        if (d > today) break;
        if (trained(dateKey(d))) hit = true;
      }
      if (hit) weeks++;
      else if (w > 0) break;
      cur.setDate(cur.getDate() - 7);
    }
    return { trained, focusOn, lastTrained, streak, weeks };
  }, [log, plan, today]);

  const levelInfo = useMemo(() => stageOf(log), [log]);

  /* 日曜だけ、その週に1回「今週のまとめ」を自動で開く */
  useEffect(() => {
    if (!ready || !core.profile) return;
    if (new Date(todayKey + "T00:00:00").getDay() !== 0) return;
    if (core.weekSeen === todayKey) return;
    setWeekOpen(true);
  }, [ready, core.profile, core.weekSeen, todayKey]);

  if (!ready) return <Center>よみこみ中…</Center>;

  /* 初回：プロフィール診断 */
  if (!profile) {
    return (
      <Questionnaire mode="onboarding" initial={EMPTY_PROFILE} initialName={core.name}
        onSubmit={(name, p) => setCore((prev) => ({
          ...prev, name, profile: p, plan: buildPlan(p),
          notifyTime: p.timeOfDay === "morning" ? "07:00" : "20:00",
          /* 日曜に診断を終えると、記録が1つも無い状態で「今週のまとめ」が開いてしまう。
             診断した日は見たことにしておく（翌週の日曜から出る） */
          weekSeen: todayKey,
        }))} />
    );
  }

  const lv = levelOf(profile);
  const { stage } = levelInfo;
  const restSec = REST_OPTIONS.includes(core.restSec) ? core.restSec : REST_SEC;
  const rec = log[todayKey] ?? null;

  /* その日の量は途中で変えない。最初の記録時に強さを凍結する */
  const dayLv = rec?.lv ?? lv;
  const dayStage = rec?.stage ?? stage;
  const dayHalf = rec?.short === true;

  const dayPlan = plan[dow];
  const meta = FOCUS_META[dayPlan.focus];
  const dayIds = dayHalf ? shortIds(dayPlan.ids) : dayPlan.ids;

  const setsDone = (id) => rec?.ex?.[id] ?? 0;
  const targetSets = (id) => spec(EX[id], dayLv, dayStage, dayHalf).sets;
  const exDone = (id) => setsDone(id) >= targetSets(id);
  const allExDone = dayIds.every(exDone);
  const trainedToday = dayIds.some((id) => setsDone(id) > 0);

  /* 記録の更新はすべて関数型で行う（連打しても取りこぼさない） */
  const baseRec = () => ({ ex: {}, focus: dayPlan.focus, lv, stage });
  const writeRec = (patch) => setLog((prev) => {
    const cur = prev[todayKey] ?? baseRec();
    return { ...prev, [todayKey]: { ...baseRec(), ...cur, ...patch } };
  });
  const addSet = (id, delta) => setLog((prev) => {
    const cur = prev[todayKey] ?? baseRec();
    const t = spec(EX[id], cur.lv ?? lv, cur.stage ?? stage, cur.short === true).sets;
    const next = clamp((cur.ex?.[id] ?? 0) + delta, 0, t);
    return { ...prev, [todayKey]: { ...baseRec(), ...cur, ex: { ...(cur.ex ?? {}), [id]: next } } };
  });

  /* 過去の日をあとから記録する。その曜日のメニューと、記録済みの強さを使う */
  const dayBase = (k) => {
    const d = new Date(k + "T00:00:00");
    return { ex: {}, focus: plan[d.getDay()]?.focus ?? "rest", lv, stage };
  };
  const editDay = (k, patch) => setLog((prev) => {
    const cur = prev[k] ?? dayBase(k);
    return { ...prev, [k]: { ...dayBase(k), ...cur, ...patch } };
  });
  const toggleDayEx = (k, id) => setLog((prev) => {
    const base = dayBase(k);
    const cur = prev[k] ?? base;
    const t = spec(EX[id], cur.lv ?? lv, cur.stage ?? stage, cur.short === true).sets;
    const now = cur.ex?.[id] ?? 0;
    return { ...prev, [k]: { ...base, ...cur, ex: { ...(cur.ex ?? {}), [id]: now > 0 ? 0 : t } } };
  });

  const gap = stats.lastTrained ? daysBetween(stats.lastTrained, todayKey) : 0;
  const welcomeBack = stats.lastTrained && gap >= 3 && !trainedToday
    && dayPlan.focus !== "rest" && !rec?.skip && rec?.short === undefined;

  const total = dayIds.length;
  const doneCount = dayIds.filter(exDone).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  if (detail) {
    return (
      <ExerciseDetail id={detail} lv={dayLv} stage={dayStage} half={dayHalf} restSec={restSec}
        sets={setsDone(detail)} target={targetSets(detail)}
        onAdd={(d) => addSet(detail, d)} onClose={() => setDetail(null)} />
    );
  }

  if (editing) {
    return (
      <Questionnaire mode="edit" initial={profile} initialName={core.name}
        onCancel={() => setEditing(false)}
        onSubmit={(name, np) => {
          setCore((prev) => ({ ...prev, name, profile: np, plan: buildPlan(np) }));
          setEditing(false);
        }} />
    );
  }

  /* 完了時：今日の記録を書きつつ、実際にレベルが上がったかを前後で比べる */
  /* feeling は null（＝答えずに終わる）でも受け取る。答えなくても完了は記録する */
  const finishToday = (feeling) => {
    const cur = log[todayKey] ?? baseRec();
    const answer = feeling ? { feeling } : {};
    /* v13は体感を入れずに比べていたため、「きつかった」で据え置き・降格のときも
       「レベルが上がりました」と出てしまっていた。今回の回答も含めて比べる */
    const after = { ...cur, done: true, ...answer };
    setLeveledUp(stageOf({ ...log, [todayKey]: after }).stage > stageOf(log).stage);
    /* 直前のセット加算と重なっても取りこぼさないよう関数型で書く */
    setLog((prev) => ({
      ...prev,
      [todayKey]: { ...baseRec(), ...(prev[todayKey] ?? cur), done: true, ...answer },
    }));
    setAskFeeling(false);
    setCheerOn(true);
  };

  return (
    <div style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen pb-28">
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-7">
        {tab === "today" && (welcomeBack ? (
          <WelcomeBack id={mainIdOf(dayPlan.ids)} lv={lv} stage={stage} weeks={stats.weeks}
            onShort={() => { writeRec({ short: true }); setDetail(mainIdOf(dayPlan.ids)); }}
            onFull={() => writeRec({ short: false })} />
        ) : (
          <>
            <Header name={core.name} dow={dow} meta={meta} pct={pct} done={doneCount} total={total}
              lv={dayLv} stage={dayStage} streak={stats.streak} weeks={stats.weeks}
              sealed={!!rec?.done} rest={dayPlan.focus === "rest"} half={dayHalf} />

            {dayHalf && (
              <div style={card({ borderColor: C.lav, ...sticker(C.lav) })} className="border-2 rounded-3xl px-5 py-4 mt-5">
                <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-sm font-bold mb-1">🌿 今日は短縮メニュー</p>
                <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">ウォームアップ・メイン1種目・ストレッチだけ、いつもの半分の量にしてあります。</p>
                <button onClick={() => writeRec({ short: false })}
                  style={{ borderColor: C.lav, color: C.lavText }}
                  className="fx border-2 rounded-full px-4 py-2 text-xs font-bold">やっぱりフルでやる</button>
              </div>
            )}

            <Section title="今日のトレーニング" note={meta.tone}
              action={{ label: "🔄 メニューを入れ替える", onClick: () => setSwapOpen(true) }}>
              {dayIds.some((id) => phaseOf(id) === "main") && (
                <p style={{ color: C.muted }} className="text-xs px-1 leading-relaxed">
                  トレーニング（②）のめやす 約{estimateMin(dayIds, dayLv, dayStage, dayHalf, restSec)}分
                  　／ ①・③20分・④はこの時間の外です
                </p>
              )}
              {PHASE_ORDER.map((ph) => {
                const list = dayIds.filter((id) => phaseOf(id) === ph);
                if (!list.length) return null;
                return (
                  <div key={ph}>
                    <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-xs font-bold px-1">{PHASE_META[ph].label}</p>
                    <p style={{ color: C.muted }} className="text-xs px-1 mb-2 leading-relaxed">{PHASE_META[ph].note}</p>
                    <div className="grid gap-2.5">
                      {list.map((id) => (
                        <ExRow key={id} id={id} lv={dayLv} stage={dayStage} half={dayHalf}
                          sets={setsDone(id)} target={targetSets(id)}
                          onOpen={() => setDetail(id)} onQuick={() => addSet(id, 1)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </Section>

            {!allExDone && (
              <button onClick={() => setRunning(true)}
                style={{ background: C.lav, color: C.ink, fontFamily: DISPLAY, ...sticker("#8C6BD6") }}
                className="fx w-full rounded-full py-5 text-lg font-bold mt-5">
                ▶︎ 連続モードではじめる
              </button>
            )}

            {allExDone && (
              <button onClick={() => { if (!rec?.done) setAskFeeling(true); else setCheerOn(true); }}
                style={{ background: rec?.done ? C.mint : C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker(rec?.done ? "#37B893" : "#E96A97") }}
                className={`fx w-full rounded-full py-5 text-lg font-bold mt-5 ${rec?.done ? "" : "wiggle"}`}>
                {rec?.done ? "✓ 今日はやりきりました" : "今日のトレーニング完了！！"}
              </button>
            )}

            {!rec?.done && !rec?.skip && (
              <button onClick={() => setSkipOpen(true)}
                style={{ borderColor: C.lineDeep, color: C.muted, background: C.surface }}
                className="fx w-full border-2 rounded-full py-3 text-sm mt-6">
                今日は無理そう…（連続は止まりません）
              </button>
            )}
            {rec?.skip && (
              <div style={card({ borderColor: C.lav, ...sticker(C.lav) })} className="border-2 rounded-3xl px-5 py-4 mt-6">
                <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-sm font-bold mb-1">🌿 今日はお休みにしました</p>
                <p style={{ color: C.muted }} className="text-xs">{rec.skip}{rec.skipNote ? `／${rec.skipNote}` : ""}</p>
                <p style={{ color: C.mintText }} className="text-xs mt-2 font-bold">連続日数はそのままです。</p>
              </div>
            )}

            <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-6">
              痛みが出たらその種目はやめてください。体調がすぐれない日は休んで大丈夫です。ととのえる日をとばしても、連続日数は止まりません。
            </p>
          </>
        ))}

        {tab === "log" && (
          <LogView core={core} log={log} photos={photos} plan={plan} today={today} todayKey={todayKey}
            weeks={stats.weeks} focusOn={stats.focusOn} trainedOn={stats.trained} lv={lv} stage={stage}
            onEditDay={editDay} onToggleDayEx={toggleDayEx}
            onWeight={(kg, waist, thigh) => setCore((prev) => ({
              ...prev,
              /* 同じ日曜日に入れ直したら上書き。並びは日付順に保つ */
              weights: [...(prev.weights ?? []).filter((w) => w.date !== todayKey), { date: todayKey, kg, waist, thigh }]
                .sort((a, b) => (a.date < b.date ? -1 : 1)),
            }))}
            onPhoto={async (file) => {
              const data = await shrinkImage(file);
              setPhotos((prev) => capPhotos([...prev.filter((p) => p.date !== todayKey), { date: todayKey, data }]));
            }}
            onDeletePhoto={(d) => setPhotos((prev) => prev.filter((p) => p.date !== d))}
            onNote={(k, text) => setLog((prev) => ({ ...prev, [k]: { ...(prev[k] ?? { ex: {} }), note: text } }))} />
        )}

        {tab === "settings" && (
          <Settings core={core} log={log} photos={photos} plan={plan} lv={lv} info={levelInfo}
            onEdit={() => setEditing(true)}
            onCheers={(list) => setCore((prev) => ({ ...prev, cheers: list }))}
            onNotify={(t) => setCore((prev) => ({ ...prev, notifyTime: t }))}
            onRest={(sec) => setCore((prev) => ({ ...prev, restSec: sec }))}
            onToggleSound={() => setCore((prev) => ({ ...prev, sound: prev.sound === false }))}
            onToggleWeight={() => setCore((prev) => ({ ...prev, trackWeight: !prev.trackWeight }))}
            onResetPlan={() => setCore((prev) => ({ ...prev, plan: buildPlan(profile) }))}
            onImport={(data) => {
              /* 初回読み込みと同じ検証を通す */
              setCore(normalizeCore(data.core));
              setLog(normalizeLog(data.log));
              setPhotos(normalizePhotos(data.photos));
            }} />
        )}
      </div>

      {swapOpen && (
        <SwapDialog current={dayPlan.focus} onClose={() => setSwapOpen(false)}
          onConfirm={(focus) => {
            const ids = buildDay(profile, focus, dow);
            setCore((prev) => ({ ...prev, plan: { ...plan, [dow]: { focus, ids } } }));
            setSwapOpen(false);
          }} />
      )}

      {running && (
        <SessionRunner ids={dayIds} lv={dayLv} stage={dayStage} half={dayHalf} restSec={restSec} done={rec?.ex ?? {}}
          onSet={(id, d) => addSet(id, d)} onClose={() => setRunning(false)}
          onFinishAll={(allDone) => {
            setRunning(false);
            /* 未達のまま終えたときは完了扱いにしない */
            if (allDone && !rec?.done) setAskFeeling(true);
          }} />
      )}

      {weekOpen && (
        <WeekReview log={log} today={today} weeks={stats.weeks} streak={stats.streak}
          needWeight={core.trackWeight && !(core.weights ?? []).some((w) => w.date === todayKey)}
          onClose={(goLog) => {
            setWeekOpen(false);
            setCore((prev) => ({ ...prev, weekSeen: todayKey }));
            if (goLog) setTab("log");
          }} />
      )}

      {/* 答えずに閉じても、やりきったこと自体は記録する（体感だけ空になる） */}
      {askFeeling && <FeelingSheet onPick={finishToday} onClose={() => finishToday(null)} />}

      {skipOpen && (
        <SkipSheet onClose={() => setSkipOpen(false)}
          onSave={(reason, text) => { writeRec({ skip: reason, skipNote: text }); setSkipOpen(false); }} />
      )}

      {cheerOn && (
        <CheerScreen name={core.name} streak={stats.streak} weeks={stats.weeks} leveledUp={leveledUp}
          cheers={core.cheers ?? []} onClose={() => { setCheerOn(false); setLeveledUp(false); }} />
      )}

      {saveError && <SaveBanner onClose={() => setSaveError(false)} />}

      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

export { AppInner };
