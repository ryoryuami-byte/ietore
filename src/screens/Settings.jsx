import { useState, useEffect, useRef } from "react";
import { buildBackup, readBackupFile, shareBackup } from "../backup.js";
import { clearCrashes, crashText, listCrashes } from "../crashLog.js";
import { CONTACT } from "../legal.js";
import { FOCUS_META } from "../exercises.js";
import { notifySupported, sendTest } from "../notify.js";
import { photosForExport } from "../photoFiles.js";
import { groupsOf, isEnabled } from "../settings.js";
import { speechSupported } from "../speech.js";
import { SESSIONS_PER_STAGE, STAGE_MAX, STAGE_STEP, lvMeta } from "../logic/progress.js";
import { LegalText } from "./Legal.jsx";
import { ConfirmSheet } from "./LogView.jsx";
import { C, DISPLAY, card, sticker } from "../tokens.js";
import { DAY_JP, REST_OPTIONS, REST_SEC, toArr } from "../utils.js";

/* settings.js の1グループぶんを、そのまま画面にする。

   ここが「設定を足すのが楽」の実体。settings.js に1行足せば、
   初期値・検証・この描画まで全部ついてくる。新しい group を作ったときだけ、
   下の画面に <SettingGroup id="新しいgroup" ...> を1つ置けばよい。 */
function SettingGroup({ id, core, onSet }) {
  const items = groupsOf([id])[0]?.items ?? [];
  return items.map((item, n) => {
    const enabled = isEnabled(item, core);
    const value = core[item.id];
    return (
      <div key={item.id} className={n === 0 ? "" : "mt-5"}
        style={enabled ? undefined : { opacity: .45 }}>
        <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-2">{item.label}</p>

        {item.type === "toggle" && (
          <button onClick={() => enabled && onSet(item.id, value === false)}
            disabled={!enabled} aria-pressed={value !== false}
            style={{ borderColor: C.lineDeep, color: C.ink }}
            className="fx w-full border-2 rounded-2xl px-4 py-3 text-left text-sm font-bold">
            {value !== false ? "オン — タップでオフ" : "オフ — タップでオン"}
          </button>
        )}

        {item.type === "choice" && (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={item.label}>
            {item.options.map(([val, lbl]) => {
              const active = String(value) === String(val);
              return (
                <button key={String(val)} onClick={() => enabled && onSet(item.id, val)}
                  disabled={!enabled} role="radio" aria-checked={active}
                  style={active
                    ? { background: C.pinkBtn, color: "#fff", borderColor: C.pink, ...sticker(C.pinkBtn) }
                    : { background: C.surface, color: C.ink, borderColor: C.line }}
                  className="fx border-2 rounded-2xl py-3 text-xs font-bold">
                  {lbl}
                </button>
              );
            })}
          </div>
        )}

        {item.note && (
          <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-2">{item.note}</p>
        )}
      </div>
    );
  });
}

/* ================= せってい ================= */
function Settings({ core, log, photos, plan, lv, info, onEdit, onToggleWeight, onResetPlan, onCheers,
  onNotify, onToggleNotify, onEraseAll, onImport, onRest, onSet, onToggleSound }) {
  const [draft, setDraft] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmImport, setConfirmImport] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState(null);
  /* 全削除は二段階。1段目で意図を、2段目で「元に戻せない」ことを確かめる */
  const [confirmErase, setConfirmErase] = useState(0);
  const [crashes, setCrashes] = useState([]);
  const [crashMsg, setCrashMsg] = useState("");
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

  /* 落ちた記録があるかどうか。開いたときに1回だけ見る */
  useEffect(() => {
    let dead = false;
    listCrashes().then((list) => { if (!dead) setCrashes(list); });
    return () => { dead = true; };
  }, []);

  if (doc) return <LegalText which={doc} onClose={() => setDoc(null)} />;

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
      <h2 style={{ fontFamily: DISPLAY }} className="text-base font-bold mb-4 px-1">マイページ</h2>

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
          style={{ background: draft.trim() ? C.pinkBtn : C.line, color: draft.trim() ? "#fff" : C.muted, fontFamily: DISPLAY, ...sticker(draft.trim() ? "#E96A97" : C.line) }}
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
      {/* 動きながら使う。settings.js の group:"coach" から自動で作る。
          設定を足したいときは settings.js に1行足すだけでよい */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">動きながら使う</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-2">
        {!speechSupported() && (
          <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-3 font-bold" role="alert">
            この端末は読み上げに対応していないため、声の案内は鳴りません。音とテンポは使えます。
          </p>
        )}
        <SettingGroup id="coach" core={core} onSet={onSet} />
      </div>
      <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7 px-1">
        読み上げには端末に入っている音声を使います。文字がどこかへ送られることはありません。
      </p>

      {/* 続ける仕組み。settings.js の group:"keep" から自動で作る */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">続ける仕組み</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-2">
        <SettingGroup id="keep" core={core} onSet={onSet} />
      </div>
      <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7 px-1">
        「診断どおり」は、はじめの質問で答えた週{Number(core.profile?.days) || 4}回です。
        多すぎると感じたら減らしてかまいません。減らしても、メニューの中身は変わりません。
      </p>

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

      {/* お知らせ */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">お知らせ</p>
      <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
        <button
          onClick={async () => {
            setNotifyMsg("");
            const want = core.notifyOn === false;
            const ok = await onToggleNotify(want);
            if (want && !ok) {
              setNotifyMsg("端末の設定でお知らせが許可されていません。設定アプリ → 通知 → イエトレ から許可してください。");
            }
          }}
          aria-pressed={core.notifyOn !== false}
          style={{ borderColor: C.lineDeep, color: C.ink }}
          className="fx w-full border-2 rounded-2xl px-4 py-3 text-left text-sm mb-3 font-bold">
          {core.notifyOn !== false ? "オン — タップでオフ" : "オフ — タップでオン"}
        </button>

        <label htmlFor="notify" className="sr-only">お知らせの時刻</label>
        <input id="notify" type="time" value={core.notifyTime ?? "20:00"} onChange={(e) => onNotify(e.target.value)}
          disabled={core.notifyOn === false}
          style={{
            background: core.notifyOn === false ? "#EFEAF0" : C.bg,
            borderColor: C.lineDeep, color: core.notifyOn === false ? C.muted : C.ink,
          }}
          className="fx w-full border-2 rounded-2xl px-4 py-3 text-base mb-3" />

        {notifyMsg && (
          <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-2 font-bold" role="alert">{notifyMsg}</p>
        )}
        {reasons.includes("forget") && (
          <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mb-2 font-bold">
            「やるのを忘れた」を選んでいます。同じ時刻に端末側のアラームも設定しておくと、さらに確実です。
          </p>
        )}
        <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
          この時刻に、その日のメニューをお知らせします。
          <strong>やりきった日と、お休みにした日は鳴りません。</strong>
          お知らせは端末の中だけで予約され、通信は使いません。
        </p>

        {notifySupported() && core.notifyOn !== false && (
          <button
            onClick={async () => {
              const ok = await sendTest();
              setNotifyMsg(ok
                ? "5秒後にお知らせが届きます。アプリを閉じて待ってみてください。"
                : "いまは鳴らせませんでした。端末の設定で許可を確認してください。");
            }}
            style={{ borderColor: C.lineDeep, color: C.muted }}
            className="fx w-full border-2 rounded-full py-3 text-xs font-bold">
            ためしに鳴らす（5秒後）
          </button>
        )}
        {!notifySupported() && (
          <p style={{ color: C.muted }} className="text-xs leading-relaxed">
            ブラウザで開いている間は鳴りません。アプリとして入れると届くようになります。
          </p>
        )}
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
          記録はこの端末の中だけに保存されています。こちらでお預かりしているものは無く、
          <strong>端末を失うと元に戻せません。</strong>
          機種変更やアプリの入れ直しに備えて、ときどきファイルに書き出しておいてください。
        </p>

        {/* ファイルで書き出す（推奨） */}
        <button
          onClick={async () => {
            setImportMsg("");
            setBusy(true);
            try {
              const data = await buildBackup({ core, log, photos });
              const r = await shareBackup(data);
              setImportMsg(r.ok
                ? "書き出しました。「ファイル」やクラウドなど、端末を替えても残る場所に保存してください。"
                : "書き出しをやめました。もう一度お試しください。");
            } catch (e) {
              setImportMsg("書き出せませんでした。写真が読み出せなかった可能性があります。");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          style={busy
            ? { background: C.line, color: C.muted, fontFamily: DISPLAY }
            : { background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }}
          className="fx w-full rounded-full py-4 text-sm font-bold mb-2">
          {busy ? "用意しています…" : "📤 ファイルに書き出す"}
        </button>

        {/* ファイルから読み込む */}
        <label style={{ borderColor: C.lineDeep, color: C.muted }}
          className="fx block w-full border-2 rounded-full py-3 text-xs font-bold text-center cursor-pointer mb-3">
          📥 ファイルから読み込む
          <input type="file" accept="application/json,.json" className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setImportMsg("");
              try {
                setConfirmImport(await readBackupFile(file));
              } catch (err) {
                setImportMsg(`読み込めませんでした。${err.message ?? ""}`);
              }
            }} />
        </label>

        {importMsg && <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">{importMsg}</p>}

        {/* 文字列でのやりとりも残す（共有が使えない環境のため） */}
        <button onClick={() => setShowTransfer((v) => !v)}
          style={{ color: C.muted }}
          className="fx w-full rounded-full py-2 text-xs font-bold">
          {showTransfer ? "文字列でのやりとりを閉じる" : "文字列でやりとりする（うまくいかないとき）"}
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
                ? { background: C.pinkBtn, color: "#fff", fontFamily: DISPLAY, ...sticker(C.pinkBtn) }
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
          </div>
        )}
      </div>

      {/* 決まりごと */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">決まりごと</p>
      <div className="grid gap-2 mb-7">
        {[["health", "はじめる前に（安全のための注意）"],
          ["privacy", "プライバシーポリシー"],
          ["terms", "利用規約"]].map(([id, label]) => (
          <button key={id} onClick={() => setDoc(id)} style={card()}
            className="fx w-full border-2 rounded-3xl px-5 py-3 text-left text-sm font-bold flex items-center">
            <span className="flex-1">{label}</span>
            <span style={{ color: C.muted }} aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      {/* 不具合の記録。落ちたことがある人にだけ出す */}
      {crashes.length > 0 && (
        <>
          <p style={{ color: C.muted }} className="text-xs mb-2 px-1">不具合の記録</p>
          <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-7">
            <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-3">
              画面が表示できなかったときの記録が {crashes.length} 件あります。
              <strong>この記録が自動で送られることはありません。</strong>
              直してほしいときは、下のボタンでコピーして {CONTACT} まで送ってください。
              名前・体重・写真・メモは含まれません。
            </p>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(crashText(crashes)); setCrashMsg("コピーしました"); }
                catch (e) { setCrashMsg("コピーできませんでした"); }
              }}
              style={{ borderColor: C.lineDeep, color: C.muted }}
              className="fx w-full border-2 rounded-full py-3 text-xs font-bold mb-2">
              内容をコピーする
            </button>
            <button onClick={async () => { await clearCrashes(); setCrashes([]); setCrashMsg(""); }}
              style={{ color: C.muted }} className="fx w-full rounded-full py-2 text-xs font-bold">
              記録を消す
            </button>
            {crashMsg && <p style={{ color: C.muted }} className="text-xs mt-2">{crashMsg}</p>}
          </div>
        </>
      )}

      {/* すべて消す。いちばん下に置き、色でも他と区別する */}
      <p style={{ color: C.muted }} className="text-xs mb-2 px-1">記録を消す</p>
      <button onClick={() => setConfirmErase(1)}
        style={{ background: C.surface, borderColor: C.pinkDeep, color: C.pinkDeep }}
        className="fx w-full border-2 rounded-3xl px-5 py-4 text-left text-sm font-bold mb-2">
        すべての記録を消す
      </button>
      <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7 px-1">
        記録・写真・設定のすべてを消して、はじめての状態に戻します。元には戻せません。
        残しておきたいものがあれば、先に上の「ファイルに書き出す」を済ませてください。
      </p>

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

      {/* 全削除の1段目：何が消えるかを具体的に見せる */}
      {confirmErase === 1 && (
        <ConfirmSheet
          title="すべての記録を消しますか？"
          body={`やりきった日 ${Object.values(log ?? {}).filter((r) => r?.done).length} 日ぶん、`
            + `写真 ${photos.length} 枚、体重の記録 ${(core.weights ?? []).length} 回ぶん、`
            + "そのほか設定とプロフィールがすべて消えます。"}
          confirmLabel="消す前に確認する"
          onCancel={() => setConfirmErase(0)}
          onConfirm={() => setConfirmErase(2)} />
      )}

      {/* 2段目：戻せないことだけを聞く */}
      {confirmErase === 2 && (
        <ConfirmSheet
          title="本当に消しますか？"
          body="元には戻せません。こちらでお預かりしているデータは無いので、復元もできません。"
          confirmLabel="すべて消す"
          onCancel={() => setConfirmErase(0)}
          onConfirm={async () => { setConfirmErase(0); await onEraseAll(); }} />
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

export { SaveBanner, Settings };
