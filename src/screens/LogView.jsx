import { useState, useMemo } from "react";
import { WeekSummary } from "../components/WeekSummary.jsx";
import { BadgeGrid, badgeList } from "../components/badges.jsx";
import { EX } from "../exercises.js";
import { useBodyLock } from "../hooks.js";
import { wantedAreas } from "../logic/plan.js";
import { spec } from "../logic/progress.js";
import { AREA_LABEL, areaTotals } from "../questions.js";
import { BODY, C, DISPLAY, DOTS, card, sticker } from "../tokens.js";
import { DAY_JP, dateKey, daysBetween, toArr } from "../utils.js";

/* ================= きろく ================= */
function LogView({ core, log, photos, plan, today, todayKey, weeks, focusOn, trainedOn, lv, stage,
  onWeight, onNote, onPhoto, onDeletePhoto, onEditDay, onToggleDayEx }) {
  /* 今週ぶんが保存済みなら、その値を出しておく（打ち間違いを直せるように） */
  const saved = (core.weights ?? []).find((w) => w.date === todayKey) ?? null;
  const [input, setInput] = useState(() => (saved ? String(saved.kg) : ""));
  const [waist, setWaist] = useState(() => (saved?.waist ? String(saved.waist) : ""));
  const [thigh, setThigh] = useState(() => (saved?.thigh ? String(saved.thigh) : ""));
  const [photoErr, setPhotoErr] = useState("");
  const [delPhoto, setDelPhoto] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(null);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let i = 1; i <= lastDay; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  const monthLabel = `${month.getFullYear()}年 ${month.getMonth() + 1}月`;
  const isThisMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
  const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const monthDone = cells.filter((d) => d && d <= today && trainedOn(dateKey(d))).length;

  const weights = Array.isArray(core.weights) ? core.weights : [];
  const last = weights[weights.length - 1];
  const isSunday = today.getDay() === 0;
  const canInput = core.trackWeight && isSunday;
  const daysToSunday = (7 - today.getDay()) % 7;

  const reasons = toArr(core.profile?.stopReason);
  const waistSeries = weights.filter((w) => w.waist).map((w) => w.waist);
  const thighSeries = weights.filter((w) => w.thigh).map((w) => w.thigh);
  const ma = useMemo(() => {
    const out = [];
    for (let i = 3; i < weights.length; i++) out.push((weights[i].kg + weights[i - 1].kg + weights[i - 2].kg + weights[i - 3].kg) / 4);
    return out;
  }, [weights]);
  const badges = badgeList(log, weeks, trainedStreakFromLog(log, today, focusOn));

  /* タップした日のメニュー。記録済みの種目と、その曜日の予定を合わせて出す */
  const pickedRec = picked ? log[picked] ?? null : null;
  const pickedIds = picked
    ? Array.from(new Set([
        ...(plan?.[new Date(picked + "T00:00:00").getDay()]?.ids ?? []),
        ...Object.keys(pickedRec?.ex ?? {}),
      ])).filter((id) => EX[id])
    : [];
  const pickedTargets = Object.fromEntries(pickedIds.map((id) => [
    id, spec(EX[id], pickedRec?.lv ?? lv, pickedRec?.stage ?? stage, pickedRec?.short === true).sets,
  ]));

  /* 打ち間違い（60.0 を 600 など）をそのまま保存するとグラフが壊れ、
     直せるのは次の日曜になってしまうので、3項目とも範囲を見る */
  const rangeErr = (raw, lo, hi, unit) => {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    const v = Number(s);
    if (!isFinite(v)) return "数字で入力してください";
    if (v < lo || v > hi) return `${lo}〜${hi}${unit} の範囲で入力してください`;
    return "";
  };
  const wErr = rangeErr(input, 25, 200, "kg");
  const waistErr = rangeErr(waist, 40, 200, "cm");
  const thighErr = rangeErr(thigh, 25, 120, "cm");
  const anyErr = !!(wErr || waistErr || thighErr);
  /* 診断と同じ基準を毎週の入力にも当てる。止めはしないが、黙って記録もしない */
  const hCm = Number(core.profile?.height);
  const wNum = Number(input);
  const lowWarn = !wErr && isFinite(hCm) && hCm > 0 && isFinite(wNum) && wNum > 0
    && wNum / ((hCm / 100) ** 2) < 18.5;

  return (
    <div className="mt-2">
      <div className="mb-5"><WeekSummary log={log} today={today} /></div>

      <div style={card()} className="border-2 rounded-3xl p-4 mb-5">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => shift(-1)} style={{ color: C.pinkDeep }} aria-label="前の月"
            className="fx w-10 h-10 rounded-full text-lg font-bold">‹</button>
          <p style={{ fontFamily: DISPLAY }} className="text-base font-bold">{monthLabel}</p>
          <button onClick={() => shift(1)} disabled={isThisMonth} aria-label="次の月"
            style={{ color: isThisMonth ? C.line : C.pinkDeep }}
            className="fx w-10 h-10 rounded-full text-lg font-bold">›</button>
        </div>
        <p style={{ color: C.muted }} className="text-xs text-center mb-4">
          この月は {monthDone} 日 ／ つづいた週 {weeks}週
        </p>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_JP.map((d, i) => (
            <div key={d} style={{ color: i === 0 ? C.pinkDeep : i === 6 ? C.lavText : C.muted }}
              className="text-center text-xs font-bold py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const k = dateKey(d);
            const trained = trainedOn(k);
            const rest = focusOn(d) === "rest";
            const future = d > today;
            const isToday = k === todayKey;
            const note = log[k]?.note;
            const skipped = !!log[k]?.skip;
            return (
              <button key={k} onClick={() => !future && setPicked(k)} disabled={future}
                aria-label={`${d.getMonth() + 1}月${d.getDate()}日${trained ? " やった日" : skipped ? " お休み申告" : ""}`}
                style={{
                  background: trained ? C.mint : rest ? C.bg : C.surface,
                  borderColor: isToday ? C.pinkDeep : trained ? C.mint : C.lineDeep,
                  borderWidth: isToday ? 3 : 2,
                  color: future ? C.lineDeep : C.ink,
                  opacity: future ? 0.55 : 1,
                }}
                className="fx aspect-square rounded-2xl flex flex-col items-center justify-center relative">
                <span style={{ fontFamily: DISPLAY }} className="text-sm font-bold leading-none">{d.getDate()}</span>
                <span className="text-xs leading-none mt-0.5" style={{ color: trained ? C.ink : skipped ? C.lavText : C.muted }}>
                  {trained ? "♥" : skipped ? "☂︎" : rest ? "軽" : ""}
                </span>
                {note && <span style={{ background: trained ? C.ink : C.pinkDeep }} className="absolute bottom-1 w-1.5 h-1.5 rounded-full" />}
              </button>
            );
          })}
        </div>

        <div style={{ borderColor: C.line }} className="border-t-2 border-dashed mt-4 pt-3 flex flex-wrap gap-3 justify-center">
          <Legend color={C.mint} label="やった日" />
          <Legend color={C.bg} label="軽 ととのえる日" border={C.lineDeep} />
          <Legend color={C.surface} label="☂︎ お休み申告" border={C.lav} />
          <Legend color={C.pinkDeep} label="メモあり" dot />
        </div>
        <p style={{ color: C.muted }} className="text-xs text-center mt-3">日付をタップすると、メモと後からの記録ができます</p>
      </div>

      {core.trackWeight && (
        <>
          <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1 px-1">体重（日曜日だけ）</h2>
          <p style={{ color: C.muted }} className="text-xs mb-3 px-1">4週間の平均だけを表示します。日々の増減はほとんど水分です。</p>
          {canInput ? (
            <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-5">
              <label htmlFor="w-kg" style={{ color: C.muted }} className="block text-xs mb-1.5">体重（kg）</label>
              <input id="w-kg" value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="55"
                aria-invalid={!!wErr}
                style={{ background: C.bg, borderColor: wErr ? C.pinkDeep : C.lineDeep, color: C.ink }}
                className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm mb-1" />
              {wErr && <p style={{ color: C.pinkDeep }} className="text-xs mb-3 font-bold">{wErr}</p>}
              {lowWarn && (
                <p style={{ color: C.pinkDeep }} className="text-xs mb-1 leading-relaxed font-bold">
                  入力された身長からみると、一般に標準とされる範囲の下限を下回ります。記録はこのまま残せますが、
                  体調のことは信頼できる大人や医療機関に相談してください。
                </p>
              )}
              <p style={{ color: C.muted }} className="text-xs mt-3 mb-2">ここから下は任意です。体重より変化がわかりやすい数字です。</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label htmlFor="w-waist" style={{ color: C.muted }} className="block text-xs mb-1.5">ウエスト（cm）</label>
                  <input id="w-waist" value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" placeholder="—"
                    aria-invalid={!!waistErr}
                    style={{ background: C.bg, borderColor: waistErr ? C.pinkDeep : C.lineDeep, color: C.ink }}
                    className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm" />
                  {waistErr && <p style={{ color: C.pinkDeep }} className="text-xs mt-1.5 font-bold">{waistErr}</p>}
                </div>
                <div>
                  <label htmlFor="w-thigh" style={{ color: C.muted }} className="block text-xs mb-1.5">太もも（cm）</label>
                  <input id="w-thigh" value={thigh} onChange={(e) => setThigh(e.target.value)} inputMode="decimal" placeholder="—"
                    aria-invalid={!!thighErr}
                    style={{ background: C.bg, borderColor: thighErr ? C.pinkDeep : C.lineDeep, color: C.ink }}
                    className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm" />
                  {thighErr && <p style={{ color: C.pinkDeep }} className="text-xs mt-1.5 font-bold">{thighErr}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  const v = Number(input);
                  if (anyErr || !isFinite(v) || v <= 0) return;
                  onWeight(v, Number(waist) || null, Number(thigh) || null);
                }}
                disabled={!input.trim() || anyErr}
                style={{ background: !input.trim() || anyErr ? C.line : C.pink, color: !input.trim() || anyErr ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(!input.trim() || anyErr ? C.line : "#E96A97") }}
                className="fx w-full rounded-full py-4 text-base font-bold">
                {saved ? "今週の記録を書き直す" : "今週の記録を保存"}
              </button>
              {saved && (
                <p style={{ color: C.mintText }} className="text-xs mt-2 text-center font-bold">
                  今週ぶんは {saved.kg} kg で保存済みです。
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: C.muted }} className="text-xs mb-5 px-1">
              次に記録できるのは日曜日です（あと{daysToSunday}日）。
              {last ? `　前回：${last.date.slice(5).replace("-", "/")} は ${last.kg} kg` : ""}
            </p>
          )}
          {ma.length >= 2 ? <MiniChart values={ma} /> : (
            <p style={{ color: C.muted }} className="text-xs px-1">あと {Math.max(0, 5 - weights.length)} 回の記録でグラフが出ます。</p>
          )}
          {last && (last.waist || last.thigh) && (
            <p style={{ color: C.muted }} className="text-xs mt-3 px-1">
              最新の採寸：{last.waist ? `ウエスト ${last.waist}cm` : ""}{last.waist && last.thigh ? " ／ " : ""}{last.thigh ? `太もも ${last.thigh}cm` : ""}
            </p>
          )}

          {(waistSeries.length >= 2 || thighSeries.length >= 2) && (
            <>
              <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1 px-1 mt-7">サイズの変化</h2>
              <p style={{ color: C.muted }} className="text-xs mb-3 px-1">
                体重より遅れて、でもはっきり動きます。見た目の変化はこちらのほうが近いです。
              </p>
              {waistSeries.length >= 2 && <TrendChart title="ウエスト" values={waistSeries} unit="cm" color={C.lavText} />}
              {thighSeries.length >= 2 && <TrendChart title="太もも" values={thighSeries} unit="cm" color={C.mintText} />}
            </>
          )}
        </>
      )}

      {/* 部位別の累計 */}
      <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1 px-1 mt-8">鍛えた部位</h2>
      <p style={{ color: C.muted }} className="text-xs mb-3 px-1">これまでに記録したセット数を、部位ごとに足したものです。</p>
      <AreaBars log={log} wanted={core.profile ? wantedAreas(core.profile) : []} />

      {/* 写真 */}
      <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1 px-1 mt-8">写真（月1回くらい）</h2>
      <p style={{ color: C.muted }} className="text-xs mb-3 px-1">同じ場所・同じ服装で撮ると変化がわかります。写真はこの端末の中だけに残ります。</p>
      {reasons.includes("noresult") && (
        <p style={{ color: C.pinkDeep }} className="text-xs mb-3 px-1 font-bold">
          「効果が見えずやめた」を選んでいます。体重より写真とウエストのほうが変化に気づきやすいです。
        </p>
      )}
      <div style={card()} className="border-2 rounded-3xl p-4 mb-3">
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((ph) => (
              <button key={ph.date} onClick={() => setDelPhoto(ph.date)} className="fx relative rounded-2xl"
                aria-label={`${ph.date} の写真を削除`}>
                <img src={ph.data} alt={`${ph.date} に撮った記録写真`} className="w-full aspect-square object-cover rounded-2xl" />
                <span style={{ background: "rgba(74,50,66,.75)", color: "#fff" }}
                  className="absolute bottom-1 left-1 right-1 rounded-lg text-xs py-0.5">
                  {ph.date.slice(5).replace("-", "/")}
                </span>
              </button>
            ))}
          </div>
        )}
        <label style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="block rounded-full py-3 text-sm font-bold text-center cursor-pointer">
          📷 写真をえらぶ
          <input type="file" accept="image/*" className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPhotoErr("");
              try { await onPhoto(file); } catch (err) { setPhotoErr(err.message ?? "保存できませんでした"); }
              e.target.value = "";
            }} />
        </label>
        {photoErr && <p style={{ color: C.pinkDeep }} className="text-xs mt-2 text-center font-bold">{photoErr}</p>}
        {photos.length >= 2 && (
          <button onClick={() => setCompareOpen(true)}
            style={{ borderColor: C.pinkDeep, color: C.pinkDeep }}
            className="fx w-full border-2 rounded-full py-3 text-sm font-bold mt-2">
            🔍 2枚をえらんで見くらべる
          </button>
        )}
        {photos.length > 0 && <p style={{ color: C.muted }} className="text-xs mt-2 text-center">写真をタップすると削除できます（確認あり）</p>}
      </div>

      {/* バッジ */}
      <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1 px-1 mt-8">あつめたバッジ</h2>
      <p style={{ color: C.muted }} className="text-xs mb-3 px-1">{badges.filter((b) => b.got).length} / {badges.length} 個</p>
      <BadgeGrid badges={badges} />

      {picked && (
        <NoteSheet dateStr={picked} initial={log[picked]?.note ?? ""}
          trained={trainedOn(picked)} skip={log[picked]?.skip} done={!!log[picked]?.done}
          ids={pickedIds} exCounts={log[picked]?.ex ?? {}} targets={pickedTargets}
          onToggleEx={(id) => onToggleDayEx(picked, id)}
          onToggleDone={() => onEditDay(picked, { done: !log[picked]?.done })}
          onClose={() => setPicked(null)}
          onSave={(text) => { onNote(picked, text); setPicked(null); }} />
      )}

      {compareOpen && <PhotoCompare photos={photos} onClose={() => setCompareOpen(false)} />}

      {delPhoto && (
        <ConfirmSheet
          title="この写真を削除しますか？"
          body="削除すると元に戻せません。"
          confirmLabel="削除する"
          onCancel={() => setDelPhoto(null)}
          onConfirm={() => { onDeletePhoto(delPhoto); setDelPhoto(null); }} />
      )}
    </div>
  );
}

/* バッジ用に連続日数をもう一度計算する（LogViewは単体で使えるようにしておく） */
function trainedStreakFromLog(log, today, focusOn) {
  let n = 0;
  const d = new Date(today);
  for (let i = 0; i < 400; i++) {
    const k = dateKey(d);
    if (Object.values(log[k]?.ex ?? {}).some((v) => v > 0)) n++;
    else if (log[k]?.skip) { /* 一時停止 */ }
    else if (focusOn(d) === "rest") { /* 休みの日 */ }
    else if (i === 0) { /* 今日はこれから */ }
    else break;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function Legend({ color, label, border, dot }) {
  return (
    <span className="flex items-center gap-1.5">
      <span style={{ background: color, borderColor: border ?? color }}
        className={`border-2 ${dot ? "w-2.5 h-2.5 rounded-full" : "w-4 h-4 rounded-md"}`} />
      <span style={{ color: C.muted }} className="text-xs">{label}</span>
    </span>
  );
}

function NoteSheet({ dateStr, initial, trained, skip, done, ids = [], exCounts = {}, targets = {},
  onToggleEx, onToggleDone, onClose, onSave }) {
  const [text, setText] = useState(initial);
  const d = new Date(dateStr + "T00:00:00");
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.45)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh", overflowY: "auto",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6">
        <p style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">
          {d.getMonth() + 1}月{d.getDate()}日（{DAY_JP[d.getDay()]}）
        </p>
        <p style={{ color: trained ? C.mintText : skip ? C.lavText : C.muted }} className="text-xs mb-4 font-bold">
          {trained ? "♥ この日は体を動かしました" : skip ? `☂︎ お休み：${skip}` : "この日の記録はありません"}
        </p>

        {ids.length > 0 && (
          <div className="mb-5">
            <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1">この日の記録</p>
            <p style={{ color: C.muted }} className="text-xs mb-2.5 leading-relaxed">
              つけ忘れた日は、ここから後で入れられます。タップで「やった／やっていない」が切り替わります。
            </p>
            <div className="grid gap-2">
              {ids.map((id) => {
                const cnt = exCounts[id] ?? 0;
                const on = cnt > 0;
                return (
                  <button key={id} onClick={() => onToggleEx?.(id)} aria-pressed={on}
                    style={{ background: on ? "#FBFFFD" : C.bg, borderColor: on ? C.mint : C.lineDeep }}
                    className="fx border-2 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 text-left">
                    <span style={{ background: on ? C.mint : C.surface, borderColor: on ? C.mint : C.lineDeep, color: C.ink }}
                      className="w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                      {on ? "✓" : ""}
                    </span>
                    <span className="text-sm flex-1 min-w-0">{EX[id].name}</span>
                    <span style={{ color: C.muted }} className="text-xs shrink-0">{cnt} / {targets[id] ?? 1}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => onToggleDone?.()} aria-pressed={!!done}
              style={{ borderColor: done ? C.mintText : C.lineDeep, color: done ? C.mintText : C.muted }}
              className="fx w-full border-2 rounded-full py-2.5 text-xs font-bold mt-2.5">
              {done ? "✓「やりきった日」になっています（タップで取り消す）" : "この日を「やりきった日」にする"}
            </button>
            <p style={{ color: C.muted }} className="text-xs mt-2 leading-relaxed">
              ここのチェックは、タップした時点で保存されます（下の「とじる」では取り消せません）。
            </p>
          </div>
        )}
        <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-2">メモ</p>
        <label htmlFor="daynote" className="sr-only">この日のメモ</label>
        <textarea id="daynote" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={200}
          placeholder="体調、きつかった種目、食べたもの、気づいたことなど"
          style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
          className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm mb-1 resize-none" />
        <p style={{ color: C.muted }} className="text-xs text-right mb-4">{text.length} / 200</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} style={{ borderColor: C.lineDeep, color: C.muted }}
            className="fx border-2 rounded-full py-3 text-sm font-bold">とじる</button>
          <button onClick={() => onSave(text.trim())}
            style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
            className="fx rounded-full py-3 text-sm font-bold">メモを保存する</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmSheet({ title, body, confirmLabel, onCancel, onConfirm }) {
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-30" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.5)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6">
        <h3 style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">{title}</h3>
        <p style={{ color: C.muted }} className="text-xs mb-5 leading-relaxed">{body}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} style={{ borderColor: C.lineDeep, color: C.muted }}
            className="fx border-2 rounded-full py-3 text-sm font-bold">やめる</button>
          <button onClick={onConfirm} style={{ background: C.pinkDeep, color: "#fff", fontFamily: DISPLAY }}
            className="fx rounded-full py-3 text-sm font-bold">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ values }) {
  const w = 300, h = 100, pad = 14;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div style={card()} className="border-2 rounded-3xl p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img"
        aria-label={`体重の4週移動平均。最新 ${values[values.length - 1].toFixed(1)} キログラム`}>
        <polyline points={pts} fill="none" stroke={C.pinkDeep} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-2">
        <p style={{ color: C.muted }} className="text-xs">最小 {min.toFixed(1)} kg</p>
        <p style={{ color: C.ink }} className="text-xs font-bold">4週移動平均：{values[values.length - 1].toFixed(1)} kg</p>
      </div>
    </div>
  );
}


/* ================= サイズの推移（ウエスト・太もも） ================= */
function TrendChart({ title, values, unit, color }) {
  const w = 300, h = 84, pad = 12;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const latest = values[values.length - 1];
  const diff = latest - values[0];
  return (
    <div style={card()} className="border-2 rounded-3xl p-4 mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold">{title}</p>
        <p style={{ color: diff < 0 ? C.mintText : diff > 0 ? C.pinkDeep : C.muted }} className="text-xs font-bold">
          はじめから {diff > 0 ? "+" : ""}{diff.toFixed(1)} {unit}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img"
        aria-label={`${title}の推移。${values.length}回ぶん、最新は ${latest.toFixed(1)} ${unit}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={{ color: C.muted }} className="text-xs">
        最新 {latest.toFixed(1)} {unit} ／ いちばん小さいとき {min.toFixed(1)} {unit}（{values.length}回ぶん）
      </p>
    </div>
  );
}

/* ================= 部位別の累計 ================= */
function AreaBars({ log, wanted = [] }) {
  const totals = areaTotals(log);
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!rows.length) {
    return (
      <div style={card()} className="border-2 rounded-3xl px-5 py-5">
        <p style={{ color: C.muted }} className="text-xs leading-relaxed">
          セットを記録すると、どの部位をどれだけ動かしたかがここに出ます。
        </p>
      </div>
    );
  }
  const top = rows[0][1];
  const missed = wanted.filter((a) => !totals[a]);
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5">
      <div className="grid gap-2.5">
        {rows.map(([a, cnt]) => {
          const star = wanted.includes(a);
          return (
            <div key={a}>
              <div className="flex justify-between text-xs mb-1 gap-2">
                <span style={{ color: star ? C.pinkDeep : C.ink }} className="font-bold min-w-0">
                  {star ? "★ " : ""}{AREA_LABEL[a] ?? a}
                </span>
                <span style={{ color: C.muted }} className="shrink-0">{cnt} セット</span>
              </div>
              <div style={{ background: C.bg }} className="rounded-full h-2.5 overflow-hidden">
                <div style={{ width: `${Math.max(4, Math.round((cnt / top) * 100))}%`, background: star ? C.pinkDeep : C.lav, height: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>
      {missed.length > 0 && (
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-4">
          気になる部位のうち {missed.map((a) => AREA_LABEL[a] ?? a).join("・")} は、まだ記録がありません。
          「メニューを入れ替える」から増やせます。
        </p>
      )}
      <p style={{ color: C.muted }} className="text-xs mt-3">★ は診断で「気になる」と答えた部位です。</p>
    </div>
  );
}

/* ================= 写真の見くらべ ================= */
function PhotoCompare({ photos, onClose }) {
  useBodyLock();
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(Math.max(0, photos.length - 1));
  const a = photos[left] ?? null, b = photos[right] ?? null;
  const gap = a && b ? Math.abs(daysBetween(a.date, b.date)) : 0;
  const label = (d) => `${d.slice(5).replace("-", "/")}`;

  const strip = (value, onPick, title) => (
    <div className="mb-4">
      <p style={{ color: C.muted }} className="text-xs mb-1.5">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((p, i) => (
          <button key={p.date} onClick={() => onPick(i)} aria-pressed={i === value}
            aria-label={`${p.date} の写真をえらぶ`}
            style={{ borderColor: i === value ? C.pinkDeep : C.line }}
            className="fx shrink-0 border-2 rounded-2xl p-1">
            <img src={p.data} alt="" className="w-12 h-12 object-cover rounded-xl" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto"
      style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY }}>
      <div className="max-w-md mx-auto px-5 pt-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm mb-4 font-bold">‹ きろくへ</button>
        <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-1">写真を見くらべる</h1>
        <p style={{ color: C.muted }} className="text-xs mb-5">
          {a && b ? `${label(a.date)} と ${label(b.date)}　${gap}日ぶんの差です` : "写真をえらんでください"}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {[["まえ", a], ["いま", b]].map(([t, p]) => (
            <div key={t}>
              <p style={{ color: C.muted }} className="text-xs mb-1.5 text-center font-bold">{t}</p>
              {p ? (
                <img src={p.data} alt={`${p.date} に撮った記録写真`}
                  className="w-full aspect-square object-cover rounded-3xl" />
              ) : (
                <div style={{ background: C.surface, borderColor: C.line }} className="w-full aspect-square rounded-3xl border-2" />
              )}
              <p style={{ color: C.ink, fontFamily: DISPLAY }} className="text-xs mt-1.5 text-center font-bold">
                {p ? label(p.date) : "—"}
              </p>
            </div>
          ))}
        </div>

        {strip(left, setLeft, "「まえ」にする写真")}
        {strip(right, setRight, "「いま」にする写真")}

        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-5">
          同じ場所・同じ服装・同じ時間帯で撮った2枚を選ぶと、いちばん違いが分かります。
          鏡ごしの写真は左右が反転するので、撮り方はそろえてください。
        </p>
        <button onClick={onClose}
          style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">とじる</button>
      </div>
    </div>
  );
}

/* ================= 日曜の週まとめ ================= */
function WeekReview({ log, today, weeks, streak, needWeight, onClose }) {
  useBodyLock();
  const keysOf = (offset) => {
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - offset * 7);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > today) break;
      out.push(dateKey(d));
    }
    return out;
  };
  const doneIn = (offset) => keysOf(offset).filter((k) => log[k]?.done).length;
  const now = doneIn(0), prev = doneIn(1);
  const diff = now - prev;

  const totals = {};
  for (const k of keysOf(0)) {
    for (const [id, cnt] of Object.entries(log[k]?.ex ?? {})) {
      const ex = EX[id];
      if (!ex || !(cnt > 0)) continue;
      for (const a of ex.area ?? []) totals[a] = (totals[a] ?? 0) + cnt;
    }
  }
  const top = Object.entries(totals).sort((x, y) => y[1] - x[1]).slice(0, 3);

  return (
    <div className="fixed inset-0 flex items-end justify-center z-30" role="dialog" aria-modal="true"
      style={{ background: "rgba(74,50,66,.5)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh", overflowY: "auto",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-7">
        <p className="text-4xl text-center mb-2" aria-hidden="true">📅</p>
        <h3 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-1 text-center">今週のまとめ</h3>
        <p style={{ color: C.muted }} className="text-xs mb-5 text-center">日曜日に1回だけ出ます。</p>

        <div style={{ background: C.bg }} className="rounded-3xl px-5 py-5 mb-3">
          <p style={{ color: C.muted }} className="text-xs mb-1">やりきった回数</p>
          <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold leading-none mb-2">
            {now}<span className="text-base ml-1">回</span>
          </p>
          <p style={{ color: diff > 0 ? C.mintText : diff < 0 ? C.pinkDeep : C.muted }} className="text-xs font-bold">
            {diff > 0 ? `先週より ${diff} 回多い（先週 ${prev} 回）`
              : diff < 0 ? `先週より ${-diff} 回少ない（先週 ${prev} 回）`
              : `先週と同じ（${prev} 回）`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div style={{ background: C.bg }} className="rounded-3xl px-4 py-4 text-center">
            <p style={{ color: C.muted }} className="text-xs mb-1">つづいた週</p>
            <p style={{ fontFamily: DISPLAY }} className="text-2xl font-bold">{weeks}<span className="text-xs ml-1">週</span></p>
          </div>
          <div style={{ background: C.bg }} className="rounded-3xl px-4 py-4 text-center">
            <p style={{ color: C.muted }} className="text-xs mb-1">連続</p>
            <p style={{ fontFamily: DISPLAY }} className="text-2xl font-bold">{streak}<span className="text-xs ml-1">日</span></p>
          </div>
        </div>

        {top.length > 0 && (
          <div style={{ background: C.bg }} className="rounded-3xl px-5 py-4 mb-3">
            <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-xs font-bold mb-2">今週よく効かせた部位</p>
            <div className="grid gap-1.5">
              {top.map(([a, cnt]) => (
                <div key={a} className="flex justify-between text-sm">
                  <span>{AREA_LABEL[a] ?? a}</span>
                  <span style={{ color: C.muted }} className="text-xs self-center">{cnt} セット</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {now === 0 && (
          <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3 px-1">
            今週は記録がありませんでした。まとめて取り返す必要はありません。明日、1種目だけやれば十分です。
          </p>
        )}

        {needWeight && (
          <button onClick={() => onClose(true)}
            style={{ borderColor: C.pinkDeep, color: C.pinkDeep }}
            className="fx w-full border-2 rounded-full py-3 text-sm font-bold mb-2">
            今日は体重を記録できます →
          </button>
        )}
        <button onClick={() => onClose(false)}
          style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">とじる</button>
      </div>
    </div>
  );
}

export { ConfirmSheet, LogView, WeekReview };
