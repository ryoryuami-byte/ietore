/* =========================================================================
   イエトレ — 入口。

   ここは Boundary（エラー表示）と viewport の面倒を見るだけで、
   画面の中身は AppInner が持っている。

   構成
     tokens.js        色・書体・カードの影
     exercises.js     種目ライブラリと、1回の流れ（① 〜 ④）の定義
     questions.js     初回診断の質問
     utils.js         日付・時刻・数値の小道具
     logic/plan.js     プロフィール → 週のメニュー
     logic/progress.js レベルと段階、1種目あたりの回数・秒数
     logic/validate.js 読み込んだ値の検証（壊れたデータで落ちないように）
     storage.js       保存の入口。ここだけがプラットフォームの違いを知っている
     sound.js         音とバイブ
     image.js         写真の縮小
     hooks.js         背面スクロールの固定・画面スリープ防止・カウントダウン
     components/      画面の部品
     screens/         大きな画面（初回診断・きろく・せってい）

   これまでの変更は docs/CHANGELOG.md にある。
   ========================================================================= */
import { useEffect, Component } from "react";
import { AppInner } from "./AppInner.jsx";
import { FigStyles } from "./components/Fig.jsx";
import { buildPlan } from "./logic/plan.js";
import { K_CORE, readJSON, writeJSON } from "./storage.js";
import { BODY, C, DISPLAY, sticker } from "./tokens.js";

/* ================= エラー表示 ================= */
class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  async rebuild() {
    try {
      const c = await readJSON(K_CORE);
      if (c?.profile) {
        c.plan = buildPlan(c.profile);
        await writeJSON(K_CORE, c);
      }
    } catch (e) { /* 何もしない */ }
    this.setState({ err: null });
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ background: C.bg, color: C.ink, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen flex items-center px-6">
        <FigStyles />
        <div className="max-w-md mx-auto w-full">
          <p className="text-5xl mb-4 text-center" aria-hidden="true">🛠</p>
          <h1 style={{ fontFamily: DISPLAY }} className="text-xl font-bold mb-3 text-center">画面を表示できませんでした</h1>
          <p style={{ color: C.muted }} className="text-xs leading-relaxed mb-4">
            下のメッセージを開発者に伝えてください。記録は消えていません。
          </p>
          <pre style={{ background: C.surface, borderColor: C.line, color: C.pinkDeep }}
            className="border-2 rounded-2xl p-4 text-xs whitespace-pre-wrap break-words mb-6">
            {String(this.state.err?.message ?? this.state.err)}
          </pre>
          <button onClick={() => this.rebuild()}
            style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
            className="fx w-full rounded-full py-4 text-base font-bold">
            メニューだけ作り直す（記録は残す）
          </button>
        </div>
      </div>
    );
  }
}

/* iOSのホームインジケータ対策。
   viewport-fit=cover が無いと env(safe-area-inset-*) は常に 0 になり、
   下部に入れた余白の指定がまったく効かない */
function useViewportFit() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "viewport");
      m.setAttribute("content", "width=device-width, initial-scale=1");
      document.head.appendChild(m);
    }
    const c = m.getAttribute("content") ?? "";
    if (!/viewport-fit\s*=\s*cover/.test(c)) {
      m.setAttribute("content", `${c}${c ? ", " : ""}viewport-fit=cover`);
    }
  }, []);
}

export default function App() {
  useViewportFit();
  return (
    <Boundary>
      <AppInner />
    </Boundary>
  );
}
