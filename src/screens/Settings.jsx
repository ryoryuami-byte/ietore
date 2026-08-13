import { useState, useEffect, useRef } from "react";
import { FOCUS_META } from "../exercises.js";
import { photosForExport } from "../photoFiles.js";
import { SESSIONS_PER_STAGE, STAGE_MAX, STAGE_STEP, lvMeta } from "../logic/progress.js";
import { ConfirmSheet } from "./LogView.jsx";
import { C, DISPLAY, card, sticker } from "../tokens.js";
import { DAY_JP, REST_OPTIONS, REST_SEC, toArr } from "../utils.js";

/* ================= せってい ================= */
function Settings({ core, log, photos, plan, lv, info, onEdit, onToggleWeight, onResetPlan, onCheers,
  onNotify, onImport, onRest, onToggleSound }) {
  const [draft, setDraft] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmImport, setConfirmImport] = useState(null);
  const cheers = core.cheers ?? [];
  const reasons = toArr(core.profile?.stopReason);
  const { stage, sessions } = info;
  const restSec = REST_OPTIONS.includes(core.restSec) ? core.restSec : REST_SEC;

  /* 写真を含むと数百KBになるので、パネルを開いたときだけ作る。
     ネイティブでは写真がファイルに逃がしてあり、一覧にはファイル名しか無い。
     別の端末へ持っていくには実体が要るので、ここで読み直して data: に戻す
     （読み込みは非同期なので、できあがるまで「用意しています…」を出す） */
  const [exportText, setExportText] = useState("");
  useEffect(() => {
    if (!showTransfer) { setExportText(""); return; }
    let dead = false;
    setExportText("用意しています…");
    (async () => {
      try {
        const withData = await photosForExport(photos);
        if (!dead) setExportText(JSON.stringify({ v: 17.2, core, log, photos: withData }));
      } catch (e) {
        if (!dead) setExportText("写真を読み出せませんでした。もう一度開いてみてください。");
      }
    })();
    return () => { dead = true; };
  }, [showTransfer, core, log, photos]);
  /* 「用意しています…」やエラー文をコピーさせない */
  const exportReady = exportText.startsWith("{");

  const tryImport = () => {
    setImportMsg("");
    try {
      const data = JSON.parse(importText);
      if (!data || typeof data !== "object" || !data.core) throw new Error("形式が違います");
      setConfirmImport(data);
    } catch (e) {
      setImportMsg("読み込めませんでした。コピーした文字列をすべて貼り付けてください。");
    }
  };

  return (
    <div className="mt-2">
      <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-4 px-1">せってい</h2>

      <button onClick={onEdit} style={card()} className="fx w-full border-2 rounded-3xl px-5 py-4 text-left mb-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">📝</span>
        <span className="flex-1">
          <span style={{ fontFamily: DISPLAY }} className="block text-base font-bold">プロフィールと質問</span>
          <span style={{ color: C.muted }} className="block text-xs">変更するとメニューが作り直されます</span>
        </span>
        <span style={{ color: C.muted }} aria-hidden="true">›</span>
      </button>
      <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7 px-1">
        記録（連続日数・カレンダー・体重）は変更しても消えません。
      </p>

      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">いまの強さ</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-3">
        <p style={{ fontFamily: DISPLAY }} className="text-xl font-bold mb-1">
          {lvMeta(lv).emoji} {lvMeta(lv).label}
          <span style={{ color: C.pinkDeep }} className="text-sm ml-2">Lv.{stage + 1}</span>
        </p>
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-4">
          完了した日が{SESSIONS_PER_STAGE}回たまるごとに、回数と秒数が少しずつ増えます（1段階ごとに約{Math.round(STAGE_STEP * 100)}%）。
          種目ごとに上限があるので、無限には増えません。
        </p>
        <div style={{ background: C.bg }} className="rounded-full h-3 overflow-hidden mb-2">
          <div style={{
            width: `${stage >= STAGE_MAX ? 100 : ((sessions % SESSIONS_PER_STAGE) / SESSIONS_PER_STAGE) * 100}%`,
            background: C.pinkDeep, height: "100%", transition: "width .4s ease",
          }} />
        </div>
        <p style={{ color: C.muted }} className="text-xs">
          {stage >= STAGE_MAX
            ? `いちばん上の段階です（完了 ${sessions} 回）。ここから先は強さを1つ上げてみてください。`
            : `次の段階まであと ${SESSIONS_PER_STAGE - (sessions % SESSIONS_PER_STAGE)} 回（完了 ${sessions} 回）`}
        </p>
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-3">
          終わったあとの「きつかった」が続くと、量を少し戻します（Lvの表示も下がります）。無理をさせないための仕組みです。
          楽すぎる・きつすぎるが続くときは、上のプロフィールから強さそのものを変えてください。
        </p>
      </div>

      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">いまの1週間</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-3 mb-3">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="flex justify-between py-1.5 text-xs">
            <span style={{ color: C.muted }}>{DAY_JP[d]}</span>
            <span>{FOCUS_META[plan[d].focus].emoji} {FOCUS_META[plan[d].focus].label}</span>
          </div>
        ))}
      </div>
      <button onClick={onResetPlan} style={{ borderColor: C.lineDeep, color: C.muted }}
        className="fx w-full border-2 rounded-full py-3 text-xs font-bold mb-7">
        入れ替えを取り消して、診断どおりに戻す
      </button>

      {/* 応援メッセージ */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">応援メッセージを預ける 💌</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
          ここに入れた言葉が、トレーニングを終えたときにランダムで表示されます。あらかじめ何通か書いておいてください。
        </p>
        {reasons.includes("alone") && (
          <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-3 font-bold">
            「ひとりだと張り合いがない」を選んでいます。ここが効きます。
          </p>
        )}
        <label htmlFor="cheer-input" className="sr-only">応援メッセージ</label>
        <textarea id="cheer-input" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={120}
          placeholder="今日もえらい。帰りにアイス買って帰るね"
          style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
          className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm mb-3 resize-none" />
        <button onClick={() => { if (draft.trim()) { onCheers([...cheers, draft.trim()]); setDraft(""); } }}
          disabled={!draft.trim()}
          style={{ background: draft.trim() ? C.pink : C.line, color: draft.trim() ? C.ink : C.muted, fontFamily: DISPLAY, ...sticker(draft.trim() ? "#E96A97" : C.line) }}
          className="fx w-full rounded-full py-3 text-sm font-bold mb-4">追加する</button>
        {cheers.length === 0 ? (
          <p style={{ color: C.muted }} className="text-xs">まだ1件もありません。</p>
        ) : (
          <div className="grid gap-2">
            {cheers.map((c, i) => (
              <div key={`${i}-${c.slice(0, 8)}`} style={{ background: C.bg }} className="rounded-2xl px-4 py-3 flex items-start gap-3">
                <span className="text-xs leading-relaxed flex-1">{c}</span>
                <button onClick={() => onCheers(cheers.filter((_, n) => n !== i))}
                  style={{ color: C.pinkDeep }} className="fx text-xs shrink-0 font-bold">消す</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 休憩の長さ */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">セット間の休憩</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="セット間の休憩">
          {REST_OPTIONS.map((sec) => {
            const on = restSec === sec;
            return (
              <button key={sec} onClick={() => onRest(sec)} role="radio" aria-checked={on}
                style={{ background: on ? C.pink : C.bg, borderColor: on ? "#E96A97" : C.lineDeep, color: C.ink }}
                className="fx border-2 rounded-2xl py-3 text-sm font-bold">{sec}秒</button>
            );
          })}
        </div>
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-3">
          秒数の種目でタイマーが0になったあと、自動で始まる休憩の長さです。息が整わないうちは長めにしてください。
        </p>
      </div>

      {/* 音とバイブ */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">音とバイブ</p>
      <button onClick={onToggleSound} aria-pressed={core.sound !== false} style={card()}
        className="fx w-full border-2 rounded-3xl px-5 py-3 text-left text-sm mb-2 font-bold">
        {core.sound !== false ? "オン — タップでオフ" : "オフ — タップでオン"}
      </button>
      <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7 px-1">
        残り3秒からの刻み音と、終了の合図に使います。バイブは対応している端末だけで動きます。
      </p>

      {/* 通知 */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">お知らせの時刻</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
        <label htmlFor="notify" className="sr-only">お知らせの時刻</label>
        <input id="notify" type="time" value={core.notifyTime ?? "20:00"} onChange={(e) => onNotify(e.target.value)}
          style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
          className="fx w-full border-2 rounded-2xl px-4 py-3 text-base mb-3" />
        {reasons.includes("forget") && (
          <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-2 font-bold">
            「やるのを忘れた」を選んでいます。同じ時刻に端末側のアラームも設定しておくと確実です。
          </p>
        )}
        <p style={{ color: C.muted }} className="text-xs leading-relaxed">
          この画面では時刻を保存するだけで、通知そのものは鳴りません。iOSアプリにしたときに、この設定を使って通知を出す形になります。
        </p>
      </div>

      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">体重の記録（日曜日）</p>
      <button onClick={onToggleWeight} aria-pressed={!!core.trackWeight} style={card()}
        className="fx w-full border-2 rounded-3xl px-5 py-3 text-left text-sm mb-7 font-bold">
        {core.trackWeight ? "オン — タップでオフ" : "オフ — タップでオン"}
      </button>

      {/* データの引き継ぎ */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">データの引き継ぎ</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
          記録はこの端末の中だけに保存されています。機種変更やアプリの入れ直しに備えて、
          ときどき下の文字列をコピーして、メモアプリなどに貼っておいてください。
        </p>
        <button onClick={() => setShowTransfer((v) => !v)}
          style={{ borderColor: C.lineDeep, color: C.muted }}
          className="fx w-full border-2 rounded-full py-3 text-xs font-bold">
          {showTransfer ? "閉じる" : "書き出し・読み込みを開く"}
        </button>

        {showTransfer && (
          <div className="mt-4">
            <p style={{ fontFamily: DISPLAY }} className="text-xs font-bold mb-1.5">書き出し</p>
            <label htmlFor="export-box" className="sr-only">書き出した文字列</label>
            <textarea id="export-box" readOnly value={exportText} rows={4} onFocus={(e) => e.target.select()}
              style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
              className="fx w-full border-2 rounded-2xl px-3 py-2 text-xs mb-2 resize-none" />
            <button
              disabled={!exportReady}
              onClick={async () => {
                try { await navigator.clipboard.writeText(exportText); setImportMsg("コピーしました"); }
                catch (e) { setImportMsg("コピーできませんでした。上の枠を長押しして選択してください。"); }
              }}
              style={exportReady
                ? { background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }
                : { background: C.line, color: C.muted, fontFamily: DISPLAY }}
              className="fx w-full rounded-full py-3 text-sm font-bold mb-5">
              {exportReady ? "コピーする" : "用意しています…"}
            </button>

            <p style={{ fontFamily: DISPLAY }} className="text-xs font-bold mb-1.5">読み込み</p>
            <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-2 font-bold">
              読み込むと、今この端末にある記録はすべて置き換わります。
            </p>
            <label htmlFor="import-box" className="sr-only">書き出した文字列</label>
            <textarea id="import-box" value={importText} onChange={(e) => setImportText(e.target.value)} rows={3}
              placeholder="書き出した文字列を貼り付け"
              style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
              className="fx w-full border-2 rounded-2xl px-3 py-2 text-xs mb-2 resize-none" />
            <button onClick={tryImport} disabled={!importText.trim()}
              style={{ borderColor: importText.trim() ? C.pinkDeep : C.line, color: importText.trim() ? C.pinkDeep : C.muted }}
              className="fx w-full border-2 rounded-full py-3 text-sm font-bold">読み込む</button>
            {importMsg && <p style={{ color: C.muted }} className="text-xs mt-2">{importMsg}</p>}
          </div>
        )}
      </div>

      <p style={{ color: C.muted }} className="text-xs leading-relaxed px-1 mb-4">
        月に1回、同じ場所・同じ服装で写真を撮っておくと変化がわかりやすくなります。
      </p>

      {confirmImport && (
        <ConfirmSheet
          title="記録を置き換えますか？"
          body="いまこの端末にある記録・写真・設定はすべて上書きされ、元には戻せません。"
          confirmLabel="置き換える"
          onCancel={() => setConfirmImport(null)}
          onConfirm={() => { onImport(confirmImport); setConfirmImport(null); setImportText(""); setImportMsg("読み込みました"); }} />
      )}
    </div>
  );
}

function SaveBanner({ onClose }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const t = setTimeout(() => close.current(), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <button onClick={onClose} role="alert"
      style={{ background: C.pinkDeep, color: "#fff", bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
      className="fx fixed left-4 right-4 mx-auto max-w-sm px-5 py-3 text-xs rounded-2xl font-bold z-40">
      端末に保存できませんでした。画面の記録はそのまま使えます（タップで閉じる）
    </button>
  );
}

function TabBar({ tab, setTab }) {
  const items = [
    { id: "today", label: "きょう", emoji: "🌷" },
    { id: "log", label: "きろく", emoji: "📖" },
    { id: "settings", label: "せってい", emoji: "⚙️" },
  ];
  return (
    <nav style={{ background: C.surface, borderColor: C.line, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className="fixed bottom-0 left-0 right-0 border-t-2">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)} aria-current={tab === it.id ? "page" : undefined}
            style={{ color: tab === it.id ? C.pinkDeep : C.muted }}
            className="fx py-3 pb-5 text-xs font-bold flex flex-col items-center gap-1">
            <span className="text-lg" aria-hidden="true">{it.emoji}</span>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export { SaveBanner, Settings, TabBar };
