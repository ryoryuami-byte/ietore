import { useState } from "react";
import { Fig, FigStyles } from "../components/Fig.jsx";
import { bodyGoal } from "../logic/bodyGoal.js";
import { ACTIVITY_LEVEL, AREA_Q, AVOID_Q, EMPTY_PROFILE, NUM_Q, REASON_Q, SELECT_Q, TENDENCY_Q } from "../questions.js";
import { C, card, DISPLAY, page, sticker } from "../tokens.js";
import { toArr } from "../utils.js";

/* ================= 質問フォーム（初回・設定で共用） ================= */
function Questionnaire({ mode, initial, initialName, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName ?? "");
  const [f, setF] = useState(() => {
    const base = { ...EMPTY_PROFILE, ...initial };
    ["area", "stopReason", "avoid", "tendency"].forEach((k) => { base[k] = toArr(base[k]); });
    return base;
  });
  const set = (k, v) => setF((p) => {
    /* 運動量を選んだら、まだ決めていない「強さ」におすすめを入れる */
    if (k === "activity" && !p.level) return { ...p, activity: v, level: ACTIVITY_LEVEL[v] ?? "easy" };
    return { ...p, [k]: v };
  });
  const toggleIn = (k, v) => setF((p) => {
    const cur = toArr(p[k]);
    if (v === "none") return { ...p, [k]: cur.includes("none") ? [] : ["none"] };
    const rest = cur.filter((x) => x !== "none");
    return { ...p, [k]: rest.includes(v) ? rest.filter((x) => x !== v) : [...rest, v] };
  });
  const has = (k, v) => toArr(f[k]).includes(v);

  const required = SELECT_Q.filter((q) => q.req).map((q) => q.id);
  const missing = required.filter((id) => !f[id]);

  /* 数値の範囲チェック */
  const numError = (q) => {
    const raw = String(f[q.id] ?? "").trim();
    if (!raw) return "";
    const v = Number(raw);
    if (!isFinite(v)) return "数字で入力してください";
    if (v < q.min || v > q.max) return `${q.min}〜${q.max}${q.unit} の範囲で入力してください`;
    return "";
  };
  const numErrors = NUM_Q.filter((q) => !(q.id === "weightGoal" && minorAge(f.age))).map(numError).filter(Boolean);
  const canSubmit = missing.length === 0 && numErrors.length === 0;

  const minor = minorAge(f.age);
  /* 計算は logic/bodyGoal.js に出してある（v17.2 で不具合が出た箇所なので、
     テストが書ける形にした）。中身は変えていない */
  const { lowNow, firstGoal, goalAtFloor, nearFloor, tooLow } =
    bodyGoal({ heightCm: f.height, nowKg: f.weightNow, goalKg: f.weightGoal });

  return (
    <div style={page()} className="min-h-screen pb-32">
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-8">
        {mode === "onboarding" ? (
          <>
            <div className="flex justify-center mb-4"><Fig kind="squat" size={84} /></div>
            <h1 style={{ fontFamily: DISPLAY }} className="text-3xl font-bold leading-snug mb-3 text-center">
              いくつか教えてください
            </h1>
            <p style={{ color: C.muted }} className="text-sm leading-relaxed mb-8 text-center">
              答えた内容から、曜日ごとのメニューを<br />自動で組み立てます。あとから変えられます。
            </p>
          </>
        ) : (
          <>
            <button onClick={onCancel} style={{ color: C.pinkDeep }} className="fx text-sm mb-4 font-bold">‹ もどる</button>
            <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-2">プロフィール</h1>
            <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-7">
              変更するとメニューが組み直されます。これまでの記録（連続日数・カレンダー・体重）はそのまま残ります。
            </p>
          </>
        )}

        <QCard label="なまえ">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ニックネームでOK" maxLength={20}
            style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
            className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm" />
        </QCard>

        <QCard label="からだのこと" note="空欄のままでも使えます。">
          {NUM_Q.map((q, i) => {
            if (q.id === "weightGoal" && minor) return null;
            const err = numError(q);
            return (
              <div key={q.id} className={i === NUM_Q.length - 1 ? "" : "mb-3"}>
                <label htmlFor={`num-${q.id}`} style={{ color: C.muted }} className="block text-xs mb-1.5">{q.label}（{q.unit}）</label>
                <input id={`num-${q.id}`} value={f[q.id]} onChange={(e) => set(q.id, e.target.value)}
                  inputMode="decimal" placeholder={q.ph} aria-invalid={!!err}
                  style={{ background: C.bg, borderColor: err ? C.pinkDeep : C.lineDeep, color: C.ink }}
                  className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm" />
                {err && <p style={{ color: C.pinkDeep }} className="text-xs mt-1.5 font-bold">{err}</p>}
              </div>
            );
          })}
          {minor && (
            <p style={{ color: C.muted }} className="text-xs leading-relaxed mt-3">
              まだ体ができあがる時期なので、目標体重の欄は表示していません。体重より「続いた週数」と体力の変化を見てください。
            </p>
          )}
          {lowNow && (
            <div style={{ background: C.bg }} className="rounded-2xl px-4 py-3 mt-4">
              <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-sm font-bold mb-1">目標体重は表示しません</p>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">
                入力された身長と体重から計算すると、すでに一般に標準とされる範囲の下限を下回っています。
                このアプリでは減量目標を出さず、体力と続いた週数だけを記録します。気になることがあれば医療機関にご相談ください。
              </p>
            </div>
          )}
          {!minor && !lowNow && firstGoal && !nearFloor && (
            <div style={{ background: C.bg }} className="rounded-2xl px-4 py-3 mt-4">
              <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-sm font-bold mb-1">まずの目標：{firstGoal} kg</p>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">
                {goalAtFloor
                  ? "体重の3%ぶんではなく、一般に標準とされる範囲の下限で止めています。これより下は目標として表示しません。"
                  : "アプリが表示するのはこちらです（体重の3%ぶん）。届いたら次の目標に更新されます。"}
              </p>
            </div>
          )}
          {!minor && !lowNow && nearFloor && (
            <div style={{ background: C.bg }} className="rounded-2xl px-4 py-3 mt-4">
              <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-sm font-bold mb-1">減量の目標は表示しません</p>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">
                入力された身長と体重は、一般に標準とされる範囲のいちばん下のあたりです。
                ここから減らす目標は出さず、体力と続いた週数を記録します。
              </p>
            </div>
          )}
          {!minor && !lowNow && tooLow && (
            <p style={{ color: C.pinkDeep }} className="text-xs leading-relaxed mt-3 font-bold">
              その目標は一般に標準とされる範囲の下限を下回ります。体調や生理に影響が出ることがあるので、まずは上の「まずの目標」で様子を見てください。
            </p>
          )}
        </QCard>

        {SELECT_Q.map((q) => (
          <QCard key={q.id} label={q.label + (q.req ? "" : "（任意）")} note={q.hint}>
            <div className="grid gap-2" role="radiogroup" aria-label={q.label}>
              {q.opts.map(([v, l]) => (
                <Choice key={v} role="radio" active={f[q.id] === v} onClick={() => set(q.id, v)} label={l} />
              ))}
            </div>
          </QCard>
        ))}

        <QCard label="特に気になる部位（いくつでも）" note="選んだ部位に効く種目が、メニューの上のほうに来ます。">
          <div className="grid grid-cols-2 gap-2">
            {AREA_Q.map(([v, l]) => (
              <Choice key={v} active={has("area", v)} onClick={() => toggleIn("area", v)} label={l} />
            ))}
          </div>
        </QCard>

        <QCard label="前に続かなかった理由（いくつでも）" note="当てはまるものを選ぶと、日数や種目数の目安を調整します。">
          <div className="grid gap-2">
            {REASON_Q.map(([v, l]) => (
              <Choice key={v} active={has("stopReason", v)} onClick={() => toggleIn("stopReason", v)} label={l} />
            ))}
          </div>
        </QCard>

        <QCard label="痛みや違和感がある部位（複数可）" note="選んだ部位に負担がかかる種目は、メニューから自動で外れます。強い痛みがあるときは医療機関へ。">
          <div className="grid grid-cols-2 gap-2">
            {AVOID_Q.map(([v, l]) => (
              <Choice key={v} active={has("avoid", v)} onClick={() => toggleIn("avoid", v)} label={l} />
            ))}
          </div>
        </QCard>

        <QCard label="当てはまるもの（複数可）" note="選んだ内容に近い部位の種目が、メニューの上のほうに来ます。体質そのものを治すものではありません。">
          <div className="grid gap-2">
            {TENDENCY_Q.map(([v, l]) => (
              <Choice key={v} active={has("tendency", v)} onClick={() => toggleIn("tendency", v)} label={l} />
            ))}
          </div>
        </QCard>
      </div>

      <div style={{ background: C.surface, borderColor: C.line, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        className="fixed bottom-0 left-0 right-0 border-t-2 px-5 pt-4">
        <div className="max-w-md mx-auto">
          {!canSubmit && (
            <p style={{ color: C.pinkDeep }} className="text-xs mb-2 text-center font-bold">
              {missing.length > 0 ? `必須の質問があと ${missing.length} つあります` : "入力できていない値があります"}
            </p>
          )}
          <button onClick={() => canSubmit && onSubmit(name.trim() || "あなた", f)} disabled={!canSubmit}
            style={{ background: canSubmit ? C.pink : C.line, color: canSubmit ? C.ink : C.muted, fontFamily: DISPLAY, ...sticker(canSubmit ? "#E96A97" : C.line) }}
            className="fx w-full rounded-full py-4 text-base font-bold">
            {mode === "onboarding" ? "メニューを作る" : "保存してメニューを作り直す"}
          </button>
        </div>
      </div>
    </div>
  );
}

function minorAge(v) {
  const n = Number(v);
  return isFinite(n) && n > 0 && n < 18;
}

function QCard({ label, note, children }) {
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
      <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-1">{label}</p>
      {note ? <p style={{ color: C.muted }} className="text-xs mb-3 leading-relaxed">{note}</p> : <div className="mb-3" />}
      {children}
    </div>
  );
}

function Choice({ active, onClick, label, role }) {
  const a11y = role === "radio" ? { role: "radio", "aria-checked": active } : { "aria-pressed": active };
  return (
    <button onClick={onClick} {...a11y}
      style={{ background: active ? C.pink : C.bg, color: C.ink, borderColor: active ? "#E96A97" : C.lineDeep }}
      className="fx border-2 rounded-2xl px-4 py-3 text-sm text-left font-bold">
      {active ? "✓ " : ""}{label}
    </button>
  );
}

export { Choice, Questionnaire };
