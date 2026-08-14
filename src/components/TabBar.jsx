import { alpha, C } from "../tokens.js";

/* =========================================================================
   下のタブ。

   v18.3 で3つから5つに増やした。以前は
     きょう（あいさつ＋進み＋種目一覧）／きろく（カレンダー＋グラフ＋写真）／せってい
   の3つで、1つの画面が縦に長くなりすぎていた。

   いまの分けかた
     ホーム       … 今日の要約と入口。まず開く場所
     トレーニング … 今日やる種目そのもの
     記録         … からだの数値・写真・バッジ
     カレンダー   … 続いた日と、後からの記録
     マイページ   … 設定と決まりごと

   ここに1つ足すときは TABS に1行足す。
   AppInner の切り替えも id を見ているだけなので、画面を1つ書けば繋がる。
   ========================================================================= */
const TABS = [
  { id: "home", label: "ホーム", emoji: "🏠" },
  { id: "train", label: "トレーニング", emoji: "🏃" },
  { id: "log", label: "記録", emoji: "📊" },
  { id: "cal", label: "カレンダー", emoji: "📅" },
  { id: "mine", label: "マイページ", emoji: "👤" },
];

function TabBar({ tab, setTab }) {
  return (
    <nav style={{
      background: C.surface,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: `0 -1px 2px ${alpha("#4A3242", .04)}, 0 -8px 20px ${alpha("#C22E62", .06)}`,
    }} className="fixed bottom-0 left-0 right-0 z-20">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 pt-2">
        {TABS.map((it) => {
          const on = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} aria-current={on ? "page" : undefined}
              style={{ color: on ? C.pinkDeep : C.muted }}
              className="fx py-1.5 pb-3 flex flex-col items-center gap-1 min-w-0">
              <span style={on ? { background: C.pinkSoft } : undefined}
                className="text-lg leading-none px-3 py-1.5 rounded-full transition-colors" aria-hidden="true">
                {it.emoji}
              </span>
              {/* 5つ並ぶと「トレーニング」「カレンダー」は入りきらないので、
                  文字を小さくし、はみ出さないように詰める */}
              <span className="text-[10px] font-bold leading-none whitespace-nowrap">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const tabTitle = (id) => TABS.find((t) => t.id === id)?.label ?? "";

export { TABS, TabBar, tabTitle };
