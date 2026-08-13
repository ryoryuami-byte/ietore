import { useState, useEffect, useMemo, useRef, Component } from "react";

/* =========================================================================
   ホームトレーニング v17.2（リリース前の最終チェックで見つかった不具合の修正）
   v17.2での変更
   - 「まずの目標」が、標準とされる範囲の下限を下回る値になることがあったのを修正。
     体重の3%を引くだけだったので、たとえば 158cm / 47kg（範囲内）の人に
     45.6kg（範囲外）を目標として出していた。下限で止め、すでに下のほうの人には
     減量目標そのものを出さないようにした
   - 日曜の体重入力でも、入力値が下限を下回るときに注意書きを出すようにした
   - サイドプランクだけ、画面表示（左右各◯秒 × Nセット）とタイマーの動きが
     食い違っていた。タイマーが片側ぶんで1セット加算していたので、
     左右あわせた長さで回すようにした（他の左右種目は回数なので影響なし）
   - 「1回あたりの時間」の質問を、実際の動き（②メインの種目数が決まる）に合わせて
     言い直した。強さが「とてもゆっくり」だと、30分を選んでも②メインは
     4分ほどにしかならず、質問の見出しと結果がずれていた
   - 「ととのえる日」の説明が「軽く動いて、伸ばすだけ」のままだった（v17で
     有酸素20分が入るようになっている）ので、中身に合わせた
   - カレンダーのシートで、種目のチェックはその場で保存されるのに
     ボタンが「やめる」だったのを「とじる」に変更し、注意書きを添えた
   - 引き継ぎデータに同じ日付の写真が2枚あると画面が崩れることがあったのを修正
   - 書き出し文字列のバージョン表記を更新

   v17.1での変更
   - 「有酸素の日」の ② メインに、スローバーピーとマウンテンクライマー（強度3）が
     入ってしまっていたのを修正。画面に「筋トレは軽めにして」と書いてある日なのに、
     並び順の都合でいちばんきつい2種目が選ばれていた。この日は強度1の種目だけにした
   - 引き継ぎデータの日付チェックが形だけだったのを、実在する日付かも見るように変更
     （2026-13-99 のような値が入ると、写真の日数差が NaN と表示されていた）
   - 日曜に初回診断を終えると、記録が1件も無い状態で「今週のまとめ」が開いていたのを修正

   v17での変更
   - ③ 有酸素を「毎日20分」に固定した。2種目 × 各10分ぶんで、ととのえる日も含めて
     すべての曜日に入る。レベルや段階では長さを変えない（20分は20分）
   - 有酸素の種目を、その場でできて続けやすいものだけに整理した：
     もも上げ（足踏み）／踏み台昇降／スロースクワット／エア自転車こぎ／
     ゆっくり足踏み／スローステップ／ゆっくり歩く
   - マウンテンクライマーとスローバーピーは有酸素ではなく ② メインに移した
     （20分続ける種目ではないため）
   - 画面の「めやす」を ② メインだけの時間に変えた。
     ①ウォームアップ・③有酸素20分・④クールダウンは、この時間の外

   v16での変更
   - ウォームアップとクールダウンを「1回あたりの時間」の外に出した。
     選んだ時間（10/20/30分）は ② メイン と ③ 有酸素 の目安になる
   - そのぶんメインを元に戻した（10分=3種目 / 20分=4種目 / 30分=5種目）。
     v15でウォームアップを入れるために減らしていたぶんの取り消し
   - 質問と画面に「ウォームアップとストレッチは時間に含まない」と明記した

   v15での変更（メニューの組み立て方を作り直した）
   - 1回を「① ウォームアップ → ② メイン → ③ 有酸素 → ④ クールダウン」の
     4つの流れで組むようにした。筋トレを先、有酸素をあとに置く
   - 種目を追加：ヒップヒンジ／踏み台昇降／バードドッグ／タオルローイング／
     壁に沿って腕上げ／通常の腕立て／ウォームアップ4種／ストレッチ3種
   - 「全身の日」と「有酸素の日」は、下半身・体幹・上半身から順番に取るようにし、
     1種目や1部位だけに偏らないようにした
   - 強度を int（1〜3）で持たせ、高強度（スローバーピー・マウンテンクライマー・
     通常の腕立て）は「ふつう」以上でないと出さない
   - 腰に負担がかかる種目（レッグレイズ・ツイストクランチ・バックエクステンション）は
     「とてもゆっくり」では出さず、それ以外でも1日1種目までにした
   - 時間枠が短い日は、ウォームアップとクールダウンではなくメインを減らす
   - 短縮メニューは「ウォームアップ＋メイン1種目＋ストレッチ」に変更
   - v14以前のメニューは、起動時に新しい構成へ自動で組み直される

   v14での変更（v13の最終チェックで見つかった不具合の修正）
   - 完了時の「レベルが上がりました」が、体感の回答を計算に入れておらず
     実際は上がっていないのに表示されることがあったのを修正
   - 体感シートの「あとで答える」を押すと、その日の完了が記録されず
     「やりきった回数」に入らなかったのを修正（答えなくても完了として残す）
   - メニュー入れ替え・お休み申告のシートが 88vh のままだったのを 88dvh に
     （iOSでアドレスバーぶん下のボタンが隠れることがあった）
   - シート表示中に背面がスクロールしてしまうのを止めた（閉じると位置が戻る）
   - 写真が上限（12枚）を超えたとき、いちばん古い1枚は残すようにした
     （見くらべの「まえ」が真っ先に消えていた）
   - ウエスト・太ももの入力に範囲チェックを追加（打ち間違いでグラフが壊れる）
   - 書き出し文字列のバージョン表記を更新

   v13での変更
   - 「お休みの日」を「ととのえる日」に変更。ストレッチ1種目＋軽い有酸素1種目を出す
     （新種目：背中まるめ・そらし／ゆっくり足踏み。ゆっくり歩くは10〜15分に短縮）
     ととのえる日でも連続モードとお休み申告が使えるようにした
   - 日曜に「今週のまとめ」を1回だけ自動表示（回数・先週比・よく効かせた部位）
   - カレンダーの日付から、過去の日を後から記録できるようにした
   - 写真を2枚えらんで見くらべる画面を追加
   - ウエスト・太もものグラフを追加
   - 部位別の累計（どこを何セット動かしたか）を追加
   - タイマー中は画面が消えないようにした（Wake Lock。非対応端末では何もしない）
   - 残り3・2・1で小さく音が鳴るようにした
   - セット間の休憩を15/30/45/60秒から選べるようにした（設定）
   - 音とバイブのオン・オフを設定に追加

   v12での変更
   - viewport-fit=cover を設定。これが無いと env(safe-area-inset-*) が常に0になり、
     v11で入れたホームインジケータ対策が実際には効いていなかった
   - 連続モード・種目詳細の下部にもセーフエリアぶんの余白を追加
   - 画面の高さを 100dvh 基準に（iOSでアドレスバーぶん下が隠れるのを防ぐ）
   - 引き継ぎの読み込みを、初回読み込みと同じ検証処理に統一（壊れた値で落ちないように）
   - 日曜日の体重を書き直せるように（打ち間違いを直す手段が無かった）
   - 体重は日付順に保存（移動平均がずれないように）
   - 週の割り当てを日数ごとに変更（週3日なら月・水・金のように間隔をあける）
   - 完了時の記録を関数型更新に変更（直前のセット加算と重なっても取りこぼさない）
   - 書き出し文字列は「引き継ぎ」を開いたときだけ作る（写真が多いと重かった）
   - お休みの日にも連続日数を表示
   - 透過PNGを写真に選んだときに背景が黒くなるのを修正

   v11での変更（記録として残す）
   - 保存先を window.storage → 無ければ localStorage に自動で切り替え
     （プレビュー環境の外＝実機アプリでも記録が残るようにする）
   - 画面下部のボタン類を iPhone のホームインジケータにかからないよう調整
   - お休み申告済みの日に「おかえり」画面が出ないよう修正
   - 読み込み（引き継ぎ）時に壊れたデータを弾くよう検証を追加
   - 写真選択をキーボード／VoiceOver から操作できるよう修正
   - タイマーの読み上げを毎秒ではなく節目だけに変更

   v10での変更（記録として残す）
   - 「毎日のタスク」セクションを削除
   - お休み申告で連続日数が切れないよう修正
   - 連続モードの「とばして終わる」で完了扱いにならないよう修正
   - メニュー入れ替えで種目が変わらない不具合を修正
   - 「おかえり」の短縮メニューを実際に半分の量にする
   - タイマーを時刻基準に統一（バックグラウンド復帰・休憩の自動開始）
   - 日付をまたいでも記録先がずれないよう修正
   - 保存キーを3つに分割（写真が増えても記録の保存が止まらない）
   - 文字コントラストをWCAG AA以上に調整
   ========================================================================= */

/* ================= デザイントークン ================= */
/* 淡い面はそのまま。面の上に載る文字は ink に統一してコントラストを確保する。
   （ink on pink 5.38 / on mint 6.50 / on lav 4.94 : いずれもAA合格） */
const C = {
  bg: "#FFF3F7",
  surface: "#FFFFFF",
  ink: "#4A3242",        /* 11.5 : 1 on white */
  muted: "#75566E",      /* 5.86 : 1 on bg */
  pink: "#FF8FB1",       /* 面。文字は ink */
  pinkDeep: "#C22E62",   /* 文字用アクセント 5.44 : 1 on white */
  lav: "#B79CF0",        /* 面。文字は ink */
  lavText: "#6E4FB8",    /* 文字用 6.05 : 1 on white */
  mint: "#5FD7B4",       /* 面。文字は ink */
  mintText: "#0E7A5F",   /* 文字用 5.29 : 1 on white */
  gold: "#FFD36E",
  line: "#FFDCE8",
  lineDeep: "#F0AEC6",   /* 無効状態の枠など、線として見える濃さ */
};
const DISPLAY = '"Hiragino Maru Gothic ProN", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const BODY = '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
const DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='3' cy='3' r='1.6' fill='%23FFE0EC'/%3E%3C/svg%3E")`;
const sticker = (c) => ({ boxShadow: `0 3px 0 ${c}` });
const card = (extra) => ({ background: C.surface, borderColor: C.line, ...sticker(C.line), ...extra });

/* ================= 種目イラスト ================= */
function Fig({ kind, size = 46 }) {
  const S = { stroke: C.ink, strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const head = (x, y) => <circle cx={x} cy={y} r="4.2" fill={C.ink} />;
  const o = (x, y) => ({ transformOrigin: `${x}px ${y}px` });
  const body = {
    squat: (<g className="an-bob">{head(22, 10)}<path d="M22 14.5 V24" {...S} /><path d="M22 17 H31" {...S} /><path d="M22 24 L16 30 L16 36" {...S} /><path d="M22 24 L28 30 L28 36" {...S} /></g>),
    wallsit: (<g>{head(14, 14)}<path d="M14 18 V27" {...S} /><path d="M14 27 H26" {...S} /><path d="M26 27 V36" {...S} /><path d="M9 10 V34" stroke={C.pinkDeep} strokeWidth="3.2" strokeLinecap="round" fill="none" /></g>),
    hip: (<g>{head(9, 31)}<path d="M13 31 H23" {...S} /><g className="an-lift"><path d="M23 31 L30 25 L34 33" {...S} /></g></g>),
    lunge: (<g>{head(20, 10)}<path d="M20 14.5 V24" {...S} /><path d="M20 24 L14 30 L14 36" {...S} /><g className="an-swing" style={o(20, 24)}><path d="M20 24 L28 29 L28 36" {...S} /></g></g>),
    calf: (<g className="an-rise">{head(22, 10)}<path d="M22 14.5 V25" {...S} /><path d="M22 18 H30" {...S} /><path d="M22 25 L18 35" {...S} /><path d="M22 25 L26 35" {...S} /></g>),
    march: (<g>{head(22, 9)}<path d="M22 13.5 V23" {...S} /><g className="an-swing" style={o(22, 23)}><path d="M22 23 L18 30 L18 36" {...S} /></g><g className="an-swing-alt" style={o(22, 23)}><path d="M22 23 L27 30 L27 36" {...S} /></g></g>),
    walk: (<g>{head(22, 9)}<path d="M22 13.5 V23" {...S} /><g className="an-swing-slow" style={o(22, 23)}><path d="M22 23 L18 36" {...S} /></g><g className="an-swing-slow-alt" style={o(22, 23)}><path d="M22 23 L27 36" {...S} /></g></g>),
    plank: (<g className="an-breathe">{head(9, 20)}<path d="M13 21 L34 27" {...S} /><path d="M14 21 V32" {...S} /><path d="M34 27 L36 33" {...S} /></g>),
    climber: (<g>{head(9, 19)}<path d="M13 20 L33 26" {...S} /><path d="M14 20 V32" {...S} /><g className="an-swing-fast" style={o(33, 26)}><path d="M33 26 L36 33" {...S} /></g><g className="an-swing-fast-alt" style={o(33, 26)}><path d="M33 26 L26 30" {...S} /></g></g>),
    sideplank: (<g className="an-breathe">{head(11, 14)}<path d="M13 17 L33 32" {...S} /><path d="M13 17 V32" {...S} /></g>),
    legraise: (<g>{head(8, 30)}<path d="M12 31 H24" {...S} /><g className="an-legup" style={o(24, 31)}><path d="M24 31 H35" {...S} /></g></g>),
    sideleg: (<g>{head(9, 26)}<path d="M13 27 H27" {...S} /><g className="an-legup" style={o(27, 27)}><path d="M27 27 L36 31" {...S} /></g><path d="M27 27 L35 33" {...S} /></g>),
    twist: (<g><path d="M12 33 H30" {...S} /><g className="an-twist" style={o(14, 33)}>{head(9, 24)}<path d="M12 27 L18 32" {...S} /></g><path d="M30 33 L26 26" {...S} /></g>),
    deadbug: (<g>{head(8, 30)}<path d="M12 31 H26" {...S} /><g className="an-swing" style={o(26, 31)}><path d="M26 31 L32 23" {...S} /></g><g className="an-swing-alt" style={o(26, 31)}><path d="M26 31 L34 29" {...S} /></g><path d="M14 31 L18 22" {...S} /></g>),
    burpee: (<g className="an-squash">{head(22, 12)}<path d="M22 16 V25" {...S} /><path d="M22 25 L17 33" {...S} /><path d="M22 25 L27 33" {...S} /><path d="M22 19 H30" {...S} /></g>),
    wallpush: (<g><path d="M36 8 V38" stroke={C.pinkDeep} strokeWidth="3.2" strokeLinecap="round" fill="none" /><g className="an-push">{head(16, 13)}<path d="M18 17 L22 33" {...S} /><path d="M18 17 L32 15" {...S} /><path d="M22 33 L18 36" {...S} /></g></g>),
    pushup: (<g className="an-pushdown">{head(10, 19)}<path d="M14 20 L32 27" {...S} /><path d="M15 20 V31" {...S} /><path d="M32 27 L34 33" {...S} /></g>),
    backext: (<g><path d="M20 32 H35" {...S} /><g className="an-torso" style={o(20, 32)}>{head(11, 27)}<path d="M15 29 L20 32" {...S} /></g></g>),
    scap: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 18)}><path d="M22 18 L13 21" {...S} /></g><g className="an-pull-alt" style={o(22, 18)}><path d="M22 18 L31 21" {...S} /></g></g>),
    stretch: (<g>{head(22, 11)}<path d="M22 15 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-reach" style={o(22, 18)}><path d="M22 18 L28 9" {...S} /></g></g>),
    catcow: (<g className="an-arch">{head(9, 21)}<path d="M13 22 Q22 13 33 23" {...S} /><path d="M14 23 V33" {...S} /><path d="M32 24 V33" {...S} /></g>),
    armcircle: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 18)}><path d="M22 18 L31 12" {...S} /></g><g className="an-pull-alt" style={o(22, 18)}><path d="M22 18 L13 12" {...S} /></g></g>),
    hipcircle: (<g>{head(22, 9)}<path d="M22 13.5 V22" {...S} /><g className="an-twist" style={o(22, 22)}><path d="M17 24 H27" {...S} /><path d="M22 22 L17 29 L17 36" {...S} /><path d="M22 22 L27 29 L27 36" {...S} /></g></g>),
    sidebend: (<g className="an-twist" style={o(21, 32)}>{head(20, 11)}<path d="M20 15 V28" {...S} /><path d="M20 16 L27 8" {...S} /><path d="M20 28 L17 36" {...S} /><path d="M20 28 L25 36" {...S} /></g>),
    hinge: (<g><path d="M24 24 L22 36" {...S} /><path d="M24 24 L28 36" {...S} /><g className="an-torso" style={o(24, 24)}>{head(12, 15)}<path d="M15 17 L24 24" {...S} /><path d="M16 18 L20 23" {...S} /></g></g>),
    row: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 19)}><path d="M22 19 H32" {...S} /></g><g className="an-pull-alt" style={o(22, 19)}><path d="M22 19 H12" {...S} /></g></g>),
    wallangel: (<g><path d="M8 8 V38" stroke={C.pinkDeep} strokeWidth="3.2" strokeLinecap="round" fill="none" />{head(14, 12)}<path d="M14 16 V27" {...S} /><path d="M14 27 V36" {...S} /><path d="M14 27 L19 36" {...S} /><g className="an-reach" style={o(14, 19)}><path d="M14 19 L23 12" {...S} /></g></g>),
    birddog: (<g>{head(9, 21)}<path d="M13 22 H31" {...S} /><path d="M14 22 V32" {...S} /><g className="an-swing" style={o(31, 22)}><path d="M31 22 L37 30" {...S} /></g><g className="an-swing-alt" style={o(13, 22)}><path d="M13 22 L6 15" {...S} /></g></g>),
    stepup: (<g><path d="M28 30 H38 V36 H28 Z" stroke={C.pinkDeep} strokeWidth="3.2" strokeLinejoin="round" fill="none" /><g className="an-rise">{head(17, 10)}<path d="M17 14.5 V24" {...S} /><path d="M17 24 L14 36" {...S} /><path d="M17 24 L28 29" {...S} /></g></g>),
    hamstretch: (<g><path d="M14 32 H34" {...S} /><g className="an-reach" style={o(14, 30)}>{head(14, 18)}<path d="M15 22 L22 30" {...S} /></g></g>),
    hipstretch: (<g>{head(22, 14)}<path d="M22 18 V27" {...S} /><g className="an-breathe"><path d="M22 27 L14 32 L22 35" {...S} /><path d="M22 27 L30 32 L22 35" {...S} /></g></g>),
    chestopen: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 19)}><path d="M22 19 L13 24" {...S} /></g><g className="an-pull-alt" style={o(22, 19)}><path d="M22 19 L31 24" {...S} /></g></g>),
  };
  return (
    <span style={{ background: C.bg, width: size, height: size, borderRadius: size / 3 }}
      className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">
      <svg width={size - 4} height={size - 4} viewBox="0 0 44 44">{body[kind] ?? body.squat}</svg>
    </span>
  );
}

const FigStyles = () => (
  <style>{`
    @keyframes anBob {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(5px) scaleY(.9)}}
    @keyframes anLift {0%,100%{transform:translateY(3px)}50%{transform:translateY(-3px)}}
    @keyframes anSwing {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-26deg)}}
    @keyframes anSwingAlt {0%,100%{transform:rotate(-26deg)}50%{transform:rotate(0deg)}}
    @keyframes anRise {0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes anBreathe {0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
    @keyframes anLegup {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-50deg)}}
    @keyframes anTwist {0%,100%{transform:rotate(-8deg)}50%{transform:rotate(14deg)}}
    @keyframes anSquash {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(7px) scaleY(.78)}}
    @keyframes anPush {0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
    @keyframes anPushdown {0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
    @keyframes anTorso {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-16deg)}}
    @keyframes anPull {0%,100%{transform:rotate(0deg)}50%{transform:rotate(18deg)}}
    @keyframes anPullAlt {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-18deg)}}
    @keyframes anReach {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-24deg)}}
    @keyframes anArch {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.06)}}
    @keyframes pop {0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
    @keyframes cheer {0%{transform:scale(.5) rotate(-8deg);opacity:0}55%{transform:scale(1.12) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
    @keyframes rise {0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-170px) rotate(220deg);opacity:0}}
    @keyframes wiggle {0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
    .an-bob{animation:anBob 1.8s ease-in-out infinite}
    .an-lift{animation:anLift 1.8s ease-in-out infinite}
    .an-swing{animation:anSwing 1.4s ease-in-out infinite}
    .an-swing-alt{animation:anSwingAlt 1.4s ease-in-out infinite}
    .an-swing-slow{animation:anSwing 2.2s ease-in-out infinite}
    .an-swing-slow-alt{animation:anSwingAlt 2.2s ease-in-out infinite}
    .an-swing-fast{animation:anSwing .8s ease-in-out infinite}
    .an-swing-fast-alt{animation:anSwingAlt .8s ease-in-out infinite}
    .an-rise{animation:anRise 1.6s ease-in-out infinite}
    .an-breathe{animation:anBreathe 2.4s ease-in-out infinite}
    .an-legup{animation:anLegup 2s ease-in-out infinite}
    .an-twist{animation:anTwist 1.8s ease-in-out infinite}
    .an-squash{animation:anSquash 2s ease-in-out infinite}
    .an-push{animation:anPush 1.8s ease-in-out infinite}
    .an-pushdown{animation:anPushdown 1.8s ease-in-out infinite}
    .an-torso{animation:anTorso 2s ease-in-out infinite}
    .an-pull{animation:anPull 1.8s ease-in-out infinite}
    .an-pull-alt{animation:anPullAlt 1.8s ease-in-out infinite}
    .an-reach{animation:anReach 2.2s ease-in-out infinite}
    .an-arch{animation:anArch 2.8s ease-in-out infinite}
    .pop{animation:pop .28s ease-out}
    .cheer{animation:cheer .5s cubic-bezier(.2,1.4,.4,1) both}
    .wiggle{animation:wiggle 1.6s ease-in-out infinite}
    .confetti{position:absolute;width:9px;height:14px;border-radius:3px;animation:rise 1.6s ease-out forwards}
    /* キーボード操作時のフォーカスを必ず見えるようにする（色を自前で指定） */
    .fx:focus{outline:none}
    .fx:focus-visible{outline:3px solid #6E4FB8;outline-offset:2px}
    @media (prefers-reduced-motion: reduce){[class*="an-"],.pop,.cheer,.wiggle,.confetti{animation:none!important}}
  `}</style>
);

/* ================= 種目ライブラリ ================= */
/* type: reps=回数 / time=秒数（タイマーつき）
   cap: レベルが上がっても、これ以上は増やさない上限（未指定なら hard の1.6倍） */
const EX = {
  /* ====== ① ウォームアップ（動的に動かして温める。どれも1セット） ====== */
  armcircle: {
    name: "肩と腕まわし", fig: "armcircle", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["shoulder", "back"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["前まわしと後ろまわしを半分ずつ", "ひじで大きな円を描く", "肩の力は抜いたまま"],
    ng: "首をすくめて回す", adjust: "座ったままでもできます。",
  },
  hipcircle: {
    name: "股関節まわし", fig: "hipcircle", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["hip", "posture"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["足を肩幅に開き、手は腰に", "腰でゆっくり大きな円を描く", "右まわり・左まわりを半分ずつ", "上半身はできるだけ動かさない"],
    ng: "ひざだけで回す", adjust: "痛みが出ない範囲で、小さく回して構いません。",
  },
  sidebend: {
    name: "体側のばし", fig: "sidebend", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["waist", "posture"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["片手を上に伸ばし、体をゆっくり横に倒す", "反対側のわき腹が伸びるのを感じる", "左右を交互に"],
    ng: "前かがみになりながら倒す", adjust: "倒す角度は浅くて構いません。",
  },
  warmmarch: {
    name: "軽く足踏み（静音）", fig: "march", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["calf", "thighF"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["つま先から静かに下ろす", "ももは腰の高さの半分まで", "腕も軽く振る"],
    ng: "はじめから全力で動く", adjust: "その場で足踏みせず、歩き回るだけでも構いません。",
  },

  /* ====== ② メイン：下半身 ====== */
  squat: {
    name: "スクワット", fig: "squat", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "hip", "inner"], stress: ["knee"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["足は肩幅、つま先は少し外向き", "いすに座るように、おしりを後ろへ引く", "ひざがつま先より前に出すぎないところで止める", "上げるときは3秒、下ろすときも3秒"],
    ng: "かかとが浮く／背中が丸まる", adjust: "つらければ、いすに軽く触れるところまでで十分です。",
  },
  hinge: {
    name: "ヒップヒンジ", fig: "hinge", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighB", "hip", "back"], stress: ["back"],
    amount: { easy: 10, hard: 14 }, sets: { easy: 2, hard: 3 },
    tips: ["足は腰幅、ひざは軽くゆるめる", "背中はまっすぐのまま、おしりを後ろへ引く", "もも裏が突っ張るところで止める", "おしりの力で起き上がる"],
    ng: "背中を丸めて前に倒れる", adjust: "壁を背にして立ち、おしりが壁に触れる範囲で動くと形が作りやすいです。",
  },
  wallsit: {
    name: "ウォールシット", fig: "wallsit", type: "time", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "hip"], stress: ["knee"],
    amount: { easy: 20, hard: 40 }, sets: { easy: 2, hard: 3 }, cap: 60,
    tips: ["壁に背中をつけ、ひざを90度に曲げて止まる", "ひざがつま先より前に出ない位置まで足を前へ", "呼吸は止めず、数えながら"],
    ng: "腰が壁から浮く", adjust: "角度を浅く（ひざを120度くらいに）すれば楽になります。",
  },
  hip: {
    name: "ヒップリフト", fig: "hip", type: "reps", phase: "main", int: 1,
    focus: ["lower", "core"], area: ["hip", "thighB", "bellyLow"], stress: [],
    amount: { easy: 12, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["仰向け、ひざを立てて足はこぶし1個ぶん開く", "おしりに力を入れて持ち上げ、上で1秒止める", "肩からひざが一直線になる高さまで", "下ろすときは床につく直前で止めて連続で"],
    ng: "腰を反らせて上げる", adjust: "腰が痛むときは高さを半分に。",
  },
  lunge: {
    name: "フロントランジ", fig: "lunge", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "thighB", "hip"], stress: ["knee"],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 2 }, perSide: true,
    tips: ["片足を大きく前に出し、真下に沈む", "上体は前に倒さずまっすぐ", "後ろのひざは床につく直前まで", "ふらつくなら壁に手を添えて"],
    ng: "前に踏み込みすぎてひざが前に出る", adjust: "歩幅を狭く、沈む深さを浅くしてください。",
  },
  calf: {
    name: "カーフレイズ", fig: "calf", type: "reps", phase: "main", int: 1,
    focus: ["lower"], area: ["calf"], stress: [],
    amount: { easy: 15, hard: 20 }, sets: { easy: 2, hard: 3 },
    tips: ["まっすぐ立って、かかとを上げきる", "上でいったん止める", "下ろすのは2秒かけてゆっくり"],
    ng: "反動で跳ねる", adjust: "壁に手をついてバランスを取ってOK。",
  },
  sideleg: {
    name: "サイドレッグレイズ", fig: "sideleg", type: "reps", phase: "main", int: 1,
    focus: ["lower"], area: ["hip", "inner", "waist"], stress: [],
    amount: { easy: 12, hard: 16 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["横向きに寝て、体は一直線", "上の脚をつま先を少し下に向けたまま上げる", "上げるのは45度くらいまで", "おしりの横に効いていればOK"],
    ng: "体が後ろに倒れる", adjust: "壁を背にして行うと姿勢が安定します。",
  },

  /* ====== ② メイン：体幹（安定させる種目を先に、腰に負担のあるものは控えめに） ====== */
  plank: {
    name: "プランク", fig: "plank", type: "time", phase: "main", int: 2,
    focus: ["core"], area: ["bellyUp", "posture"], stress: ["wrist", "shoulder"],
    amount: { easy: 20, hard: 40 }, sets: { easy: 2, hard: 3 }, cap: 60,
    tips: ["ひじは肩の真下", "頭・背中・かかとが一直線", "おへそを軽く引き込む", "呼吸は止めない"],
    ng: "腰が落ちる／おしりが高い", adjust: "ひざをついた状態から始めてください。",
  },
  birddog: {
    name: "バードドッグ", fig: "birddog", type: "reps", phase: "main", int: 1,
    focus: ["core"], area: ["posture", "back", "bellyLow"], stress: [],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["四つんばいで手は肩の真下、ひざは腰の真下", "対角の手と足をゆっくり伸ばす", "伸ばしたところで2秒止める", "背中は床と平行のまま"],
    ng: "腰が反る／体が左右に傾く", adjust: "手だけ、足だけの動きから始めてOK。",
  },
  deadbug: {
    name: "デッドバグ", fig: "deadbug", type: "reps", phase: "main", int: 1,
    focus: ["core"], area: ["bellyLow", "posture"], stress: [],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["仰向けで手と脚を天井に上げる", "対角の手と脚をゆっくり伸ばす", "腰は床につけたまま動かさない"],
    ng: "腰が浮く", adjust: "腕だけ、脚だけの動きから始めてOK。",
  },
  sideplank: {
    name: "サイドプランク", fig: "sideplank", type: "time", phase: "main", int: 2,
    focus: ["core"], area: ["waist", "bellyUp"], stress: ["shoulder"],
    amount: { easy: 15, hard: 30 }, sets: { easy: 2, hard: 2 }, perSide: true, cap: 45,
    tips: ["ひじは肩の真下", "体を一直線にして腰を持ち上げる", "下の脇腹で支える意識"],
    ng: "体が前後にねじれる", adjust: "ひざをついて行えば負荷が半分ほどになります。",
  },
  legraise: {
    name: "レッグレイズ", fig: "legraise", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["core"], area: ["bellyLow"], stress: ["back"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["仰向けで手はおしりの下に", "脚をそろえて上げ、床の直前で止める", "腰を床から浮かせない"],
    ng: "腰が浮いて反る", adjust: "ひざを曲げたままで大丈夫です。",
  },
  twist: {
    name: "ツイストクランチ", fig: "twist", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["core"], area: ["waist", "bellyUp"], stress: ["back"],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["ひざを立てて仰向け", "ひじを反対のひざへ近づける", "おへそをのぞき込むイメージ"],
    ng: "首を手で引っぱる", adjust: "手は耳に軽く触れる程度にしてください。",
  },

  climber: {
    name: "マウンテンクライマー", fig: "climber", type: "time", phase: "main", int: 3,
    focus: ["core"], area: ["bellyUp", "bellyLow", "posture"], stress: ["wrist", "shoulder"],
    amount: { easy: 20, hard: 30 }, sets: { easy: 3, hard: 4 }, cap: 45,
    tips: ["手は肩の真下、体は一直線", "ひざを胸に向けて交互に引きつける", "おしりが上下しないように"],
    ng: "腰が反る／おしりが上がる", adjust: "速さより姿勢優先。ゆっくりで構いません。",
  },
  burpee: {
    name: "スローバーピー", fig: "burpee", type: "reps", phase: "main", int: 3, noisy: true,
    focus: ["lower"], area: ["bellyLow", "thighF"], stress: ["knee", "wrist"],
    amount: { easy: 5, hard: 8 }, sets: { easy: 2, hard: 3 },
    tips: ["しゃがむ→手を床に→脚を後ろへ→戻る→立つ", "ジャンプはしない", "1回ずつ丁寧に"],
    ng: "勢いで腰を落とす", adjust: "脚は後ろに伸ばさず、その場しゃがみ立ちだけでも効果があります。",
  },

  /* ====== ② メイン：上半身・背中 ====== */
  scap: {
    name: "肩甲骨寄せ", fig: "scap", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["back", "shoulder", "posture"], stress: [],
    amount: { easy: 15, hard: 20 }, sets: { easy: 2, hard: 3 },
    tips: ["ひじを曲げて肩の高さに", "肩を下げたまま背中の真ん中を寄せる", "1回ごとに2秒キープ"],
    ng: "肩がすくむ", adjust: "座ったままでもできます。",
  },
  towelrow: {
    name: "タオルローイング", fig: "row", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["back", "arms", "shoulder"], stress: [],
    amount: { easy: 12, hard: 16 }, sets: { easy: 2, hard: 3 },
    tips: ["タオルの両端を持って前に伸ばす", "外側へ引っぱる力をかけたまま、ひじを後ろへ引く", "肩甲骨を寄せて2秒キープ", "肩は下げたまま"],
    ng: "肩がすくむ／背中が丸まる", adjust: "引っぱる力を弱めれば軽くなります。座ったままでもOK。",
  },
  wallangel: {
    name: "壁に沿って腕上げ", fig: "wallangel", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["shoulder", "back", "posture"], stress: ["shoulder"],
    amount: { easy: 10, hard: 14 }, sets: { easy: 2, hard: 3 },
    tips: ["背中と後頭部を壁につけて立つ", "ひじと手の甲も壁につけたまま上下させる", "腰は壁から離しすぎない", "壁から浮かない範囲でOK"],
    ng: "腰を反らせて腕を上げる", adjust: "手が壁から浮くところで止めて大丈夫です。",
  },
  wallpush: {
    name: "壁プッシュアップ", fig: "wallpush", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["arms", "shoulder"], stress: ["shoulder"],
    amount: { easy: 12, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["壁に手をつき、足を後ろへ下げる", "体を一直線に保ったままひじを曲げる", "胸を壁に近づける"],
    ng: "腰だけが先に近づく", adjust: "足を壁に近づけるほど軽くなります。",
  },
  pushup: {
    name: "ひざつき腕立て", fig: "pushup", type: "reps", phase: "main", int: 2,
    focus: ["upper"], area: ["arms", "shoulder"], stress: ["wrist", "shoulder"],
    amount: { easy: 5, hard: 10 }, sets: { easy: 2, hard: 3 },
    tips: ["ひざをついて、手は肩幅より少し広く", "頭からひざまで一直線", "胸を床に近づける"],
    ng: "おしりが上がる", adjust: "手首が痛むならこぶしを握って行ってください。",
  },
  fullpush: {
    name: "腕立て伏せ", fig: "pushup", type: "reps", phase: "main", int: 3,
    focus: ["upper"], area: ["arms", "shoulder", "bellyUp"], stress: ["wrist", "shoulder"],
    amount: { easy: 5, hard: 10 }, sets: { easy: 2, hard: 3 },
    tips: ["手は肩幅より少し広く、足はつま先で支える", "頭からかかとまで一直線", "胸を床に近づけ、ひじは体から45度くらい"],
    ng: "腰が落ちる／おしりが上がる", adjust: "きつければ、ひざつき腕立てに戻して構いません。",
  },
  backext: {
    name: "バックエクステンション", fig: "backext", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["upper"], area: ["back", "posture"], stress: ["back"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["うつ伏せで手は頭の横", "上体を軽く起こす", "反らせすぎない（10cmで十分）"],
    ng: "限界まで反る", adjust: "腰に違和感が出たらすぐ中止してください。",
  },

  /* ====== ③ 有酸素（毎日20分。2種目 × 各10分ぶん。block × blockSets = 600秒） ====== */
  march: {
    name: "もも上げ（足踏み）", fig: "march", type: "time", phase: "cardio", int: 2, noisy: true,
    focus: ["cardio"], area: ["bellyLow", "thighF", "calf"], stress: [],
    block: 120, blockSets: 5, amount: { easy: 120, hard: 120 }, sets: { easy: 5, hard: 5 },
    tips: ["背筋を伸ばして立つ", "太ももが床と平行になるくらいまで高く、交互に上げる", "腕もしっかり振ると心拍数が上がる", "2分ごとに休憩をはさむ"],
    ng: "足が上がらず前かがみになる", adjust: "高さを半分にして、続ける時間を優先してください。",
  },
  stepup: {
    name: "踏み台昇降", fig: "stepup", type: "time", phase: "cardio", int: 2, noisy: true,
    focus: ["cardio"], area: ["thighF", "hip", "calf"], stress: ["knee"],
    block: 300, blockSets: 2, amount: { easy: 300, hard: 300 }, sets: { easy: 2, hard: 2 },
    tips: ["家の段差や、雑誌を束ねた台を使う", "無理のないテンポで上り下りをくり返す", "右足→左足の順に上り、同じ順で下りる", "途中で上る足を入れ替える"],
    ng: "台が高すぎる／踏み外す", adjust: "台がなければ、その場の足踏みに替えて構いません。",
  },
  slowsquat: {
    name: "スロースクワット", fig: "squat", type: "reps", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["thighF", "hip", "inner"], stress: ["knee"],
    block: 20, blockSets: 3, amount: { easy: 20, hard: 20 }, sets: { easy: 3, hard: 3 },
    tips: ["5秒かけてゆっくり下げ、5秒かけてゆっくり上げる", "1回に10秒かける（20回で約3分半）", "負荷は低いので、大きい下半身の筋肉を有酸素として使える", "ひざがつま先より前に出すぎないところで止める"],
    ng: "反動をつけて速く動かす", adjust: "深さは浅くて構いません。いすに軽く触れながらでもOK。",
  },
  aircycle: {
    name: "エア自転車こぎ", fig: "legraise", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["bellyLow", "thighF"], stress: [],
    block: 200, blockSets: 3, amount: { easy: 200, hard: 200 }, sets: { easy: 3, hard: 3 },
    tips: ["仰向けになり、足を空中に上げる", "自転車をこぐように交互に動かす", "腰は床につけたまま", "床の振動が出ないので、集合住宅でもできる"],
    ng: "腰が浮いて反る", adjust: "手をおしりの下に入れると腰が安定します。",
  },
  easystep: {
    name: "ゆっくり足踏み（静音）", fig: "march", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["calf", "thighF"], stress: [],
    block: 300, blockSets: 2, amount: { easy: 300, hard: 300 }, sets: { easy: 2, hard: 2 },
    tips: ["ももは上げすぎず、腰の高さの半分くらいまで", "つま先から静かに下ろす", "会話ができるくらいのペースで"],
    ng: "息が上がるほど速くする", adjust: "その場で足踏みせず、歩き回るだけでも構いません。",
  },
  step: {
    name: "スローステップ（静音）", fig: "walk", type: "time", phase: "cardio", int: 2,
    focus: ["cardio"], area: ["calf", "thighF"], stress: [],
    block: 200, blockSets: 3, amount: { easy: 200, hard: 200 }, sets: { easy: 3, hard: 3 },
    tips: ["つま先から静かに着地する", "かかとは床につけない", "テンポは一定に、止まらない"],
    ng: "どすんと着地する", adjust: "タオルやマットの上で行うとさらに静かです。",
  },
  walk: {
    name: "ゆっくり歩く", fig: "walk", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["calf"], stress: [],
    block: 600, blockSets: 1, amount: { easy: 600, hard: 600 }, sets: { easy: 1, hard: 1 },
    tips: ["歩幅はいつもより少し大きく", "スマホは見ずに前を見る", "音楽を聴きながらで十分"],
    ng: "スマホを見ながら猫背で歩く", adjust: "外に出られない日は、家の中を歩き回るだけでも代わりになります。",
  },

  /* ====== ④ クールダウン（呼吸を整えて伸ばす。どれも1セット） ====== */
  stretch: {
    name: "全身ストレッチ", fig: "stretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: [], stress: [],
    amount: { easy: 120, hard: 180 }, sets: { easy: 1, hard: 1 }, cap: 240, setsCap: 1,
    tips: ["痛気持ちいいところで20秒キープ", "反動はつけない", "息を吐きながら伸ばす"],
    ng: "痛みが出るまで伸ばす", adjust: "お風呂上がりが最も伸びやすい時間です。",
  },
  hipstretch: {
    name: "股関節のストレッチ", fig: "hipstretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["hip", "inner", "posture"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["床に座って足の裏どうしを合わせる", "背中を伸ばしたまま、ひざを外へ開く", "息を吐きながら20秒キープ"],
    ng: "反動をつけてひざを押す", adjust: "壁に背中をつけて座ると楽になります。",
  },
  hamstretch: {
    name: "もも裏のばし", fig: "hamstretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["thighB", "calf"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["床に座り、片脚を前に伸ばす", "背中を伸ばしたまま股関節から前に倒す", "痛気持ちいいところで20秒", "左右を同じ時間ずつ"],
    ng: "背中を丸めて頭だけ近づける", adjust: "ひざは軽く曲げたままで構いません。",
  },
  chestopen: {
    name: "胸ひらき", fig: "chestopen", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["shoulder", "back", "posture"], stress: ["shoulder"],
    amount: { easy: 45, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["両手を体の後ろで組む", "胸を開いて肩甲骨を寄せる", "あごは軽く引いたまま20秒"],
    ng: "あごが上がって首が反る", adjust: "手が組めなければ、タオルの両端を持ってください。",
  },
  catcow: {
    name: "背中まるめ・そらし", fig: "catcow", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["back", "posture"], stress: ["wrist"],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["四つんばいで手は肩の真下、ひざは腰の真下", "息を吐きながら背中を丸める", "息を吸いながらゆっくり反らす", "1往復に4秒くらいかけて"],
    ng: "首だけを動かす", adjust: "手首がつらいときは、いすに座って背中だけ動かしてもOK。",
  },
};

/* ③ 有酸素は毎日20分。2種目に分け、1種目あたり10分（600秒）ぶんを割り当てる。
   有酸素だけはレベルや段階で長さを変えない（20分と決めたら20分） */
const CARDIO_TOTAL_SEC = 1200;
const CARDIO_PICKS = 2;
const CARDIO_SHARE_SEC = CARDIO_TOTAL_SEC / CARDIO_PICKS;

/* 1回の流れ。ウォームアップとクールダウンは時間が短い日でも削らない */
const PHASE_ORDER = ["warmup", "main", "cardio", "cooldown"];
const PHASE_META = {
  warmup: { label: "① ウォームアップ", note: "体を温めます。設定した時間には含みません。飛ばさないでください。" },
  main: { label: "② メイン", note: "今日の対象を鍛えます。設定した時間はここのぶんです。" },
  cardio: { label: "③ 有酸素", note: "毎日20分。筋トレのあとに行うと脂肪が燃えやすくなります。" },
  cooldown: { label: "④ クールダウン", note: "使った筋肉を伸ばします。設定した時間には含みません。" },
};
const phaseOf = (id) => EX[id]?.phase ?? "main";
/* 強度の上限。3（マウンテンクライマー・スローバーピー・通常の腕立て）は
   「ふつう」以上を選んだ人にだけ出す */
const maxIntensity = (lv) => (lv >= 2 ? 3 : 2);

const FOCUS_META = {
  lower: { label: "下半身の日", emoji: "🍑", tone: "大きい筋肉から。ゆっくり動くほど効きます。" },
  core: { label: "おなか・体幹の日", emoji: "🌸", tone: "姿勢を保つことが目的です。呼吸を止めずに。" },
  upper: { label: "上半身・背中の日", emoji: "🕊", tone: "姿勢が変わると見た目の印象も変わります。" },
  cardio: { label: "有酸素の日", emoji: "🎀", tone: "筋トレは軽めにして、有酸素を中心にする日です。" },
  full: { label: "全身の日", emoji: "⭐️", tone: "続けて1周。休むのはセット間だけです。" },
  rest: { label: "ととのえる日", emoji: "🍃", tone: "筋トレはお休み。軽い有酸素20分とストレッチだけの日です。回復も練習のうちです。" },
};

/* ================= ユーティリティ ================= */
const DAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
const REST_SEC = 30;               /* 休憩の初期値。設定から変えられる */
const REST_OPTIONS = [15, 30, 45, 60];
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/* ================= 保存 ================= */
/* v9は全部を1キーに入れていたため、写真が増えると記録の保存ごと失敗した。
   用途ごとに3つへ分割し、変わったキーだけ書き込む。 */
const K_CORE = "hometrain:core:v1";
const K_LOG = "hometrain:log:v1";
const K_PHOTOS = "hometrain:photos:v1";
const K_LEGACY = "hometrain:v5";

const DEFAULT_CORE = {
  name: "", profile: null, plan: null, weights: [], trackWeight: true, cheers: [], notifyTime: "20:00",
  restSec: REST_SEC, sound: true, weekSeen: "",
};

/* window.storage はプレビュー環境（Claudeのアーティファクト）にしか無い。
   実機・ブラウザ・アプリ化後は localStorage に保存する。 */
const hasHostStorage = () => typeof window !== "undefined" && !!window.storage;
const hasLocal = () => {
  try { return typeof window !== "undefined" && !!window.localStorage; }
  catch (e) { return false; /* プライベートブラウズ等で参照自体が失敗する場合 */ }
};

async function readJSON(key) {
  try {
    if (hasHostStorage()) {
      const r = await window.storage.get(key, false);
      return r ? JSON.parse(r.value) : null;
    }
    if (!hasLocal()) return null;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null; /* 未作成のキーは例外になる */
  }
}
async function writeJSON(key, value) {
  const json = JSON.stringify(value);
  if (hasHostStorage()) {
    await window.storage.set(key, json, false);
    return;
  }
  if (!hasLocal()) throw new Error("no-storage");
  window.localStorage.setItem(key, json); /* 容量超過は例外になり、保存失敗の表示が出る */
}

/* 値が変わったときだけ、少し待ってから書き込む */
function useAutoSave(key, value, ready, setErr) {
  const last = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(value);
    if (last.current === null) { last.current = json; return; }
    if (last.current === json) return;
    last.current = json;
    const t = setTimeout(async () => {
      try { await writeJSON(key, value); setErr(false); }
      catch (e) { setErr(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [key, value, ready, setErr]);
}

/* ================= 音・振動 ================= */
let audioCtx = null;
/* 設定のオン／オフ。描画のたびに読むのではなく、変わったときだけ入れ替える */
let soundOn = true;
const setSoundEnabled = (v) => { soundOn = v !== false; };
/* iOSは操作をきっかけにしないと音を出せない。最初のタップで用意しておく */
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { /* 音が出せない環境 */ }
}
function beep(times = 1) {
  try {
    if (!soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const t0 = audioCtx.currentTime + i * 0.25;
      o.frequency.value = 880; o.type = "sine";
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.22);
    }
  } catch (e) { /* 何もしない */ }
}
function buzz(pattern = [180]) {
  /* iOS Safari は vibrate に非対応。対応端末だけで鳴る */
  try { if (soundOn) navigator.vibrate?.(pattern); } catch (e) { /* 非対応端末 */ }
}
/* 残り3・2・1で鳴らす短い音。終了音より小さく、高さも変えて区別する */
function tick() {
  try {
    if (!soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t0 = audioCtx.currentTime;
    o.frequency.value = 620; o.type = "sine";
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + 0.1);
  } catch (e) { /* 何もしない */ }
}
function signal(strong) {
  beep(strong ? 3 : 1);
  buzz(strong ? [120, 80, 120, 80, 220] : [180]);
}

/* ================= 写真の縮小 ================= */
/* createImageBitmap の imageOrientation で、iPhoneの縦写真が横に倒れるのを防ぐ */
async function shrinkImage(file, max = 640) {
  if (!file.type?.startsWith("image/")) throw new Error("画像ファイルを選んでください");
  if (file.size > 25 * 1024 * 1024) throw new Error("ファイルが大きすぎます（25MBまで）");

  let src = null, w = 0, h = 0;
  try {
    src = await createImageBitmap(file, { imageOrientation: "from-image" });
    w = src.width; h = src.height;
  } catch (e) {
    src = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("読み込めませんでした"));
      r.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("画像として開けませんでした"));
        img.onload = () => resolve(img);
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
    w = src.naturalWidth || src.width; h = src.naturalHeight || src.height;
  }
  if (!w || !h) throw new Error("画像のサイズを読めませんでした");

  const scale = Math.min(1, max / Math.max(w, h));
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * scale);
  cv.height = Math.round(h * scale);
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("この端末では写真を変換できませんでした");
  /* JPEGは透過を持てない。透過PNGを選んだときに背景が黒くならないよう白で塗る */
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(src, 0, 0, cv.width, cv.height);
  if (src.close) src.close();
  return cv.toDataURL("image/jpeg", 0.7);
}

/* ================= 強度と負荷の上げ方 ================= */
const LEVELS = [
  { id: "gentle", label: "とてもゆっくり", emoji: "🌱", desc: "運動はまったくしていない", t: -0.6, setBias: -1 },
  { id: "easy", label: "ゆっくり", emoji: "🌸", desc: "たまに歩く程度", t: 0, setBias: 0 },
  { id: "normal", label: "ふつう", emoji: "🔥", desc: "少し動き慣れている", t: 0.55, setBias: 0 },
  { id: "hard", label: "しっかり", emoji: "⚡️", desc: "部活などで動き慣れている", t: 1, setBias: 1 },
];
const lvIndex = (id) => Math.max(0, LEVELS.findIndex((l) => l.id === id));
/* 引き継ぎデータなどで範囲外の値が来ても落ちないようにする */
const lvMeta = (i) => LEVELS[i] ?? LEVELS[1];

const SESSIONS_PER_STAGE = 6;
const STAGE_MAX = 6;
const STAGE_STEP = 0.12;
const FEEL_WINDOW = 12; /* 体感は直近12回ぶんだけ見る（昔の分が効き続けないように） */

/* 完了回数で上がり、直近の体感で微調整する。
   「きつかった」が続いたときは量を少し戻す（無理をさせないため、下がることもある） */
function stageOf(log) {
  const recs = Object.entries(log ?? {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, r]) => r);
  const n = recs.filter((r) => r?.done).length;
  const feels = recs.filter((r) => r?.feeling).map((r) => r.feeling).slice(-FEEL_WINDOW);
  const easy = feels.filter((x) => x === "easy").length;
  const hard = feels.filter((x) => x === "hard").length;
  const adjust = Math.floor(easy / 3) - Math.floor(hard / 3);
  const base = Math.floor(n / SESSIONS_PER_STAGE);
  return { stage: clamp(base + adjust, 0, STAGE_MAX), sessions: n, adjust, base: clamp(base, 0, STAGE_MAX) };
}

/* half=true で「おかえり」用の半分メニューになる */
function spec(ex, lv, stage = 0, half = false) {
  /* 有酸素は毎日20分と決めているので、レベルや段階では増減させない */
  if (ex.phase === "cardio") {
    return { amount: ex.block, sets: half ? Math.max(1, Math.round(ex.blockSets / 2)) : ex.blockSets };
  }
  const L = LEVELS[lv] ?? LEVELS[1];
  const e = ex.amount.easy, h = ex.amount.hard;
  const capA = ex.cap ?? Math.round(h * 1.6);
  let a = Math.min((e + (h - e) * L.t) * (1 + stage * STAGE_STEP), capA);
  if (half) a *= 0.5;
  a = ex.type === "time" ? Math.max(10, Math.round(a / 5) * 5) : Math.max(3, Math.round(a));
  let n = (L.t >= 0.5 ? ex.sets.hard : ex.sets.easy) + L.setBias + (stage >= 4 ? 1 : 0);
  n = clamp(n, 1, ex.setsCap ?? 4);
  if (half) n = Math.max(1, Math.floor(n / 2));
  return { amount: a, sets: n };
}

/* 秒数の左右種目（サイドプランク）は、画面に「左右各◯秒 × Nセット」と出している。
   タイマーが片側ぶんで1セット数えていると表示と合わないので、左右あわせた長さで回す */
const timerSec = (ex, sp) => (ex.type === "time" && ex.perSide ? sp.amount * 2 : sp.amount);

const specText = (ex, lv, stage, half) => {
  const { amount, sets } = spec(ex, lv, stage, half);
  const side = ex.perSide ? "左右各 " : "";
  return ex.type === "time"
    ? `${side}${amount >= 60 ? mmss(amount) : `${amount}秒`} × ${sets}セット`
    : `${side}${amount}回 × ${sets}セット`;
};

/* ================= 質問 ================= */
const EMPTY_PROFILE = {
  age: "", height: "", weightNow: "", weightGoal: "",
  goal: "", days: "", minutes: "", activity: "", noise: "", level: "",
  timeOfDay: "",
  area: [], stopReason: [], avoid: [], tendency: [],
};

const NUM_Q = [
  { id: "age", label: "年齢", unit: "歳", ph: "18", min: 10, max: 99 },
  { id: "height", label: "身長", unit: "cm", ph: "158", min: 100, max: 220 },
  { id: "weightNow", label: "今の体重", unit: "kg", ph: "55", min: 25, max: 200 },
  { id: "weightGoal", label: "いつかの目標体重", unit: "kg", ph: "52", min: 25, max: 200 },
];

const ACTIVITY_LEVEL = { none: "gentle", little: "easy", some: "normal" };

const SELECT_Q = [
  { id: "goal", label: "いちばんの目的は", req: true, opts: [["lose", "体重を減らしたい"], ["tone", "体を引き締めたい"], ["fitness", "体力をつけたい"], ["posture", "姿勢をよくしたい"]] },
  { id: "days", label: "週に何日できそう？", req: true, opts: [["3", "3日"], ["4", "4日"], ["5", "5日"]] },
  /* ここで決まるのは ② メインの「種目数」。実際にかかる時間は強さとレベルで変わるので、
     時間そのものを約束する見出しにしない（画面には計算した「めやす」を出している） */
  { id: "minutes", label: "1回の筋トレの量は", req: true, hint: "② メインの種目数が決まります。かかる時間は、下で選ぶ「強さ」と、続けるうちに上がるレベルで変わります（画面に「めやす」が出ます）。ウォームアップ・有酸素20分・ストレッチはこの外です。", opts: [["10", "短め（3種目）"], ["20", "ふつう（4種目）"], ["30", "しっかり（5種目）"]] },
  { id: "activity", label: "いま、どのくらい動いている？", req: true, hint: "選ぶと、下の「強さ」におすすめを入れます。", opts: [["none", "ほとんど動いていない"], ["little", "たまに歩く程度"], ["some", "週に何度か動いている"]] },
  {
    id: "level", label: "トレーニングの強さ", req: true, hint: "続けるうちに自動で上がります。きついと答えた日が続くと、少し戻ることもあります。",
    opts: LEVELS.map((l) => [l.id, `${l.emoji} ${l.label}（${l.desc}）`]),
  },
  { id: "noise", label: "家で足音を出せる？", req: true, opts: [["ok", "出せる（戸建てなど）"], ["quiet", "出せない（集合住宅）"]] },
  { id: "timeOfDay", label: "やりやすい時間帯は", hint: "お知らせの時刻の初期値に使います。", opts: [["morning", "朝"], ["evening", "夜"], ["anytime", "日による"]] },
];

const AREA_Q = [
  ["bellyUp", "おなか（上）"], ["bellyLow", "下腹"], ["waist", "わき腹・くびれ"],
  ["thighF", "太ももの前"], ["thighB", "太ももの裏"], ["inner", "内もも"],
  ["calf", "ふくらはぎ"], ["hip", "おしり"],
  ["arms", "二の腕"], ["back", "背中"], ["shoulder", "肩・首まわり"], ["posture", "姿勢全体"],
];
const AREA_LABEL = Object.fromEntries(AREA_Q);
/* 記録からセット数を部位ごとに足し上げる */
function areaTotals(log) {
  const t = {};
  for (const rec of Object.values(log ?? {})) {
    for (const [id, cnt] of Object.entries(rec?.ex ?? {})) {
      const ex = EX[id];
      if (!ex || !(cnt > 0)) continue;
      for (const a of ex.area ?? []) t[a] = (t[a] ?? 0) + cnt;
    }
  }
  return t;
}

const REASON_Q = [
  ["busy", "時間がとれなかった"], ["tired", "疲れて動けなかった"],
  ["boring", "飽きてしまった"], ["noresult", "効果が見えずやめた"],
  ["hard", "きつすぎて続かなかった"], ["forget", "やるのを忘れた"],
  ["place", "場所や音の問題でできなかった"], ["alone", "ひとりだと張り合いがない"],
  ["none", "特にない・今回が初めて"],
];
const AVOID_Q = [["none", "ない"], ["knee", "ひざ"], ["back", "腰"], ["shoulder", "肩"], ["wrist", "手首"]];
const TENDENCY_Q = [["cold", "冷えやすい"], ["swell", "むくみやすい"], ["tired", "疲れやすい"], ["stiff", "肩がこりやすい"]];

/* 体質の回答は、種目の並び順に反映する（v9では毎日のタスクにしか使っていなかった） */
const TENDENCY_AREA = {
  cold: ["thighF", "hip"],
  swell: ["calf", "thighB"],
  tired: ["posture"],
  stiff: ["shoulder", "back", "posture"],
};

/* ================= メニュー生成 ================= */
const GOAL_ORDER = {
  lose: ["cardio", "lower", "core", "full", "upper"],
  tone: ["lower", "core", "upper", "cardio", "full"],
  fitness: ["full", "cardio", "lower", "core", "upper"],
  posture: ["upper", "core", "lower", "cardio", "full"],
};
/* 足りないときに借りてくる隣のカテゴリ（無関係な種目が「有酸素の日」に混ざるのを防ぐ） */
const NEIGHBOR = {
  cardio: ["full", "lower"],
  lower: ["full", "core"],
  core: ["full", "lower"],
  upper: ["core", "full"],
  full: ["lower", "cardio", "core", "upper"],
};
/* 週の何曜日に入れるか。日数ごとに、なるべく間隔があくよう並べる（日=0 … 土=6） */
const DAY_LAYOUT = {
  1: [3],
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};
const daySlots = (n) => DAY_LAYOUT[clamp(n, 1, 7)] ?? DAY_LAYOUT[4];

/* 使ってよい種目。痛みのある部位・足音・強度でふるいにかける */
function usableList(p) {
  const avoid = toArr(p?.avoid).filter((a) => a !== "none");
  const lv = levelOf(p ?? {});
  const cap = maxIntensity(lv);
  const all = Object.entries(EX);
  const hurts = ([, e]) => avoid.some((a) => (e.stress ?? []).includes(a));
  /* 高強度は「ふつう」以上、腰に負担のある種目は「ゆっくり」以上でのみ出す */
  const tooHard = ([, e]) => (e.int ?? 1) > cap || (e.spineLoad && lv < 1);
  const safe = all.filter((x) => !hurts(x) && !tooHard(x));
  const quiet = safe.filter((x) => !(p?.noise === "quiet" && x[1].noisy));
  const enough = (list) => PHASE_ORDER.every((ph) => list.some(([, e]) => (e.phase ?? "main") === ph));
  if (enough(quiet)) return quiet;
  if (enough(safe)) return safe;
  return all.filter((x) => !hurts(x));
}

function wantedAreas(p) {
  const picked = toArr(p.area).filter((a) => a !== "none");
  const fromTendency = toArr(p.tendency).flatMap((t) => TENDENCY_AREA[t] ?? []);
  return Array.from(new Set([...picked, ...fromTendency]));
}

/* 時間枠ごとの構成。
   選んだ「1回あたりの時間」は ② メイン と ③ 有酸素 の目安で、
   ① ウォームアップ と ④ クールダウン はその外側に置く（時間に数えない）。
   そのため、時間が短くてもメインの種目数は削らない。 */
function shapeOf(p) {
  const m = p?.minutes === "30" ? 30 : p?.minutes === "10" ? 10 : 20;
  /* 有酸素は毎日20分（2種目）で固定。選んだ時間は ② メインの目安 */
  const s = m === 10 ? { warmup: 1, main: 3, cardio: CARDIO_PICKS, cooldown: 1 }
    : m === 30 ? { warmup: 2, main: 5, cardio: CARDIO_PICKS, cooldown: 1 }
    : { warmup: 1, main: 4, cardio: CARDIO_PICKS, cooldown: 1 };
  /* 「時間がとれない・疲れて続かなかった」と答えた人だけ、メインを1つ減らす。
     これは時間配分ではなく、続けやすさのための調整 */
  const reasons = toArr(p?.stopReason);
  if (reasons.includes("busy") || reasons.includes("tired") || reasons.includes("hard")) {
    s.main = Math.max(2, s.main - 1);
  }
  return s;
}

/* 「全身の日」と「有酸素の日」は、1部位に偏らないよう3グループから順番に取る */
const MAIN_GROUPS = {
  lower: ["lower"], core: ["core"], upper: ["upper"],
  full: ["lower", "core", "upper"],
  cardio: ["lower", "core", "upper"],
};

const rotate = (arr, n) => (arr.length ? arr.slice(Math.abs(n) % arr.length).concat(arr.slice(0, Math.abs(n) % arr.length)) : []);
const byPhaseOrder = (ids) => ids.slice().sort((a, b) => PHASE_ORDER.indexOf(phaseOf(a)) - PHASE_ORDER.indexOf(phaseOf(b)));

/* 1日ぶんの種目を組む。入れ替えダイアログからも同じ関数を使う */
function buildDay(p, focus, seed = 0) {
  if (focus === "rest") return buildRestDay(p, seed);
  const shape = shapeOf(p);
  const usable = usableList(p);
  const wanted = wantedAreas(p);
  const score = (e) => (e.area ?? []).filter((x) => wanted.includes(x)).length;
  const pool = (ph, filter) => usable
    .filter(([, e]) => (e.phase ?? "main") === ph && (!filter || filter(e)))
    .sort((a, b) => score(b[1]) - score(a[1]) || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
  const fill = (out, list, n) => {
    for (const id of list) { if (out.length >= n) break; if (!out.includes(id)) out.push(id); }
    return out;
  };

  /* ① ウォームアップ */
  const warm = fill([], rotate(pool("warmup"), seed), shape.warmup);

  /* ② メイン。腰に負担がかかる種目は1日1種目まで */
  const groups = MAIN_GROUPS[focus] ?? [focus];
  const mainMax = focus === "cardio" ? Math.min(2, shape.main) : shape.main;
  /* 有酸素の日は画面に「筋トレは軽めにして、有酸素を中心にする日です」と出している。
     並び順の都合で、ふつう以上を選ぶとスローバーピーとマウンテンクライマー（強度3）が
     入ってしまっていたので、この日は強度1の種目だけから選ぶ */
  const soft = (e) => focus !== "cardio" || (e.int ?? 1) <= 1;
  const main = [];
  let spine = 0;
  const addMain = (id) => {
    if (!id || main.length >= mainMax || main.includes(id)) return;
    if (EX[id]?.spineLoad) { if (spine >= 1) return; spine += 1; }
    main.push(id);
  };
  const lists = groups.map((g, i) => rotate(pool("main", (e) => (e.focus ?? []).includes(g) && soft(e)), seed + i));
  for (let round = 0; main.length < mainMax && round < 10; round++) {
    for (const list of lists) addMain(list[round]);
  }
  for (const nb of NEIGHBOR[focus] ?? []) {
    if (main.length >= mainMax) break;
    for (const id of rotate(pool("main", (e) => (e.focus ?? []).includes(nb) && soft(e)), seed)) addMain(id);
  }
  for (const id of pool("main", soft)) addMain(id);
  for (const id of pool("main")) addMain(id); /* それでも足りないときだけ制限を外す */

  /* ③ 有酸素。曜日にかかわらず毎日20分ぶん（2種目）を入れる */
  const cardio = fill([], rotate(pool("cardio"), seed), shape.cardio);

  /* ④ クールダウン */
  const cool = fill([], rotate(pool("cooldown"), seed), shape.cooldown);

  const ids = byPhaseOrder([...warm, ...main, ...cardio, ...cool].filter((id) => EX[id]));
  return ids.length ? ids : ["hipcircle", "hip", "stretch"];
}

/* ととのえる日：軽く温める → 低強度の有酸素 → ストレッチ2つ */
function buildRestDay(p, seed = 0) {
  const usable = usableList(p ?? {});
  const pool = (ph, filter) => usable
    .filter(([, e]) => (e.phase ?? "main") === ph && (!filter || filter(e)))
    .map(([id]) => id);
  const warm = rotate(pool("warmup"), seed).slice(0, 1);
  /* ととのえる日も有酸素は毎日20分。ただし低強度のものだけから選ぶ */
  const soft = pool("cardio", (e) => (e.int ?? 1) <= 1);
  const easy = rotate(soft.length >= CARDIO_PICKS ? soft : pool("cardio"), seed).slice(0, CARDIO_PICKS);
  const cool = rotate(pool("cooldown"), seed).slice(0, 2);
  const ids = byPhaseOrder([...warm, ...easy, ...cool].filter((id) => EX[id]));
  return ids.length ? ids : ["stretch"];
}

/* 所要時間のめやす（秒）。②メインだけを数える。
   ①ウォームアップ・③有酸素20分・④クールダウンはこの時間の外。
   回数種目はゆっくり動く前提で1回あたり3.5秒として見積もる */
function estimateSec(ids, lv, stage, half, restSec = REST_SEC) {
  let sec = 0;
  for (const id of ids ?? []) {
    const e = EX[id];
    if (!e || (e.phase ?? "main") !== "main") continue;
    const sp = spec(e, lv, stage, half);
    const sides = e.perSide ? 2 : 1;
    const one = e.type === "time" ? sp.amount * sides : sp.amount * sides * 3.5;
    sec += sp.sets * one + Math.max(0, sp.sets - 1) * restSec + 15;
  }
  return Math.round(sec);
}
const estimateMin = (...a) => Math.max(1, Math.round(estimateSec(...a) / 60));

/* 短縮メニュー：①1つ・②1つ・④1つだけ残す */
function shortIds(ids) {
  const first = (ph) => ids.find((id) => phaseOf(id) === ph);
  const out = [first("warmup"), first("main") ?? first("cardio"), first("cooldown")].filter(Boolean);
  return out.length ? Array.from(new Set(out)) : ids.slice(0, 1);
}
/* 「おかえり」で見せる代表の1種目。ウォームアップではなくメインを出す */
const mainIdOf = (ids) => ids.find((id) => phaseOf(id) === "main") ?? ids.find((id) => phaseOf(id) === "cardio") ?? ids[0];

/* 週の並び。週3日以上なら「下半身・体幹・上半身」を必ず1日ずつ確保してから、
   残りを目的の優先順で埋める。こうしないと週3日・減量で上半身が1日も入らなかった。
   有酸素は毎日③として入るので、有酸素の日が消えても運動量は落ちない */
function focusSequence(order, n) {
  const must = ["lower", "core", "upper"];
  const seq = [];
  if (n >= 3) {
    for (const c of order) if (must.includes(c) && !seq.includes(c)) seq.push(c);
    for (const c of must) if (!seq.includes(c)) seq.push(c);
  }
  for (const c of order) { if (seq.length >= n) break; if (!seq.includes(c)) seq.push(c); }
  while (seq.length < n) seq.push(order[seq.length % order.length]);
  /* 目的の優先度が高いものを週の前半に置く */
  return seq.slice(0, n).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function buildPlan(p) {
  const days = clamp(Number(p.days) || 4, 1, 7);
  const order = GOAL_ORDER[p.goal] ?? GOAL_ORDER.tone;
  const slots = daySlots(days);
  const focuses = focusSequence(order, slots.length);

  /* 気になる部位に対応するカテゴリが1日も無い場合、最後の日を差し替える */
  const wanted = wantedAreas(p);
  const missing = (cat, areas) => !focuses.includes(cat) && areas.some((a) => wanted.includes(a));
  if (missing("core", ["bellyUp", "bellyLow", "waist"])) focuses[focuses.length - 1] = "core";
  else if (missing("upper", ["arms", "back", "shoulder", "posture"])) focuses[focuses.length - 1] = "upper";

  const plan = {};
  for (let d = 0; d < 7; d++) plan[d] = { focus: "rest", ids: buildRestDay(p, d) };
  slots.forEach((d, i) => { plan[d] = { focus: focuses[i], ids: buildDay(p, focuses[i], i) }; });
  return plan;
}

function levelOf(p) {
  if (p.level) return lvIndex(p.level);
  if (p.activity === "some") return 2;
  if (p.activity === "none") return 0;
  return 1;
}

/* 古いメニューは作り直させる。
   v14以前は①④が無く、v16以前は有酸素が毎日20分ぶん入っていない */
const planIsValid = (plan) =>
  !!plan && [0, 1, 2, 3, 4, 5, 6].every((d) => {
    const day = plan[d];
    if (!day || !FOCUS_META[day.focus] || !Array.isArray(day.ids) || !day.ids.length) return false;
    if (!day.ids.every((id) => EX[id])) return false;
    if (!["warmup", "cooldown"].every((ph) => day.ids.some((id) => phaseOf(id) === ph))) return false;
    return day.ids.filter((id) => phaseOf(id) === "cardio").length === CARDIO_PICKS;
  });

/* ================= 読み込んだ値の検証 ================= */
/* 初回読み込みと「引き継ぎの読み込み」で同じ処理を通す。
   壊れた値・古い値をそのまま state に入れると、あとで画面ごと落ちるため */
const isPlainObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
/* 形だけでなく、実在する日付かどうかも見る。2026-13-99 のような値が引き継ぎデータに
   混ざると、写真の日数差や日付の計算が NaN になって画面に出てしまう */
const isDateKey = (k) =>
  typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k) && dateKey(new Date(`${k}T00:00:00`)) === k;
const posNum = (v) => { const x = Number(v); return isFinite(x) && x > 0 ? x : null; };

function normalizeCore(raw) {
  const c = { ...DEFAULT_CORE, ...(isPlainObj(raw) ? raw : {}) };
  c.name = typeof c.name === "string" ? c.name.slice(0, 20) : "";
  c.weights = (Array.isArray(c.weights) ? c.weights : [])
    .filter((w) => isPlainObj(w) && isDateKey(w.date) && posNum(w.kg))
    .map((w) => ({ date: w.date, kg: posNum(w.kg), waist: posNum(w.waist), thigh: posNum(w.thigh) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  c.cheers = (Array.isArray(c.cheers) ? c.cheers : [])
    .filter((x) => typeof x === "string" && x.trim()).map((x) => x.slice(0, 120)).slice(0, 50);
  c.trackWeight = c.trackWeight !== false;
  c.notifyTime = /^\d{2}:\d{2}$/.test(c.notifyTime ?? "") ? c.notifyTime : "20:00";
  c.restSec = REST_OPTIONS.includes(Number(c.restSec)) ? Number(c.restSec) : REST_SEC;
  c.sound = c.sound !== false;
  c.weekSeen = isDateKey(c.weekSeen) ? c.weekSeen : "";
  c.profile = isPlainObj(c.profile) ? c.profile : null;
  if (!c.profile) c.plan = null;
  else if (!planIsValid(c.plan)) c.plan = buildPlan(c.profile);
  return c;
}

function normalizeLog(raw) {
  if (!isPlainObj(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isDateKey(k) || !isPlainObj(v)) continue;
    const ex = {};
    for (const [id, cnt] of Object.entries(isPlainObj(v.ex) ? v.ex : {})) {
      const c = posNum(cnt);
      if (EX[id] && c) ex[id] = Math.floor(c);
    }
    const rec = { ...v, ex };
    if (rec.lv != null) rec.lv = clamp(Math.floor(Number(rec.lv)) || 0, 0, LEVELS.length - 1);
    if (rec.stage != null) rec.stage = clamp(Math.floor(Number(rec.stage)) || 0, 0, STAGE_MAX);
    if (rec.focus && !FOCUS_META[rec.focus]) delete rec.focus;
    if (typeof rec.note === "string") rec.note = rec.note.slice(0, 200);
    out[k] = rec;
  }
  return out;
}

/* 写真は端末の容量の都合で12枚まで。
   v13は新しい12枚を残していたので、いっぱいになると「いちばん古い1枚」＝
   見くらべの「まえ」にあたる写真から消えていた。最初の1枚だけは必ず残す。 */
const PHOTO_MAX = 12;
function capPhotos(list) {
  const s = (Array.isArray(list) ? list : []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  if (s.length <= PHOTO_MAX) return s;
  return [s[0], ...s.slice(-(PHOTO_MAX - 1))];
}

function normalizePhotos(raw) {
  /* 引き継ぎデータに同じ日付が2枚あると、一覧のキーが重なって表示が崩れる */
  const seen = new Set();
  return capPhotos(
    (Array.isArray(raw) ? raw : [])
      .filter((p) => isPlainObj(p) && isDateKey(p.date) && typeof p.data === "string" && p.data.startsWith("data:image/"))
      .filter((p) => (seen.has(p.date) ? false : (seen.add(p.date), true)))
      .map((p) => ({ date: p.date, data: p.data }))
  );
}

/* ================= 背面スクロールの固定 ================= */
/* シートを開いている間に指で動かすと、後ろの画面がスクロールしてしまい、
   閉じたときに元の位置に戻らない。開いている数を数えて、最後の1つが閉じたら戻す。 */
let bodyLocks = 0;
let bodyLockY = 0;
function useBodyLock() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const b = document.body;
    if (bodyLocks === 0) {
      bodyLockY = window.scrollY;
      b.style.overflow = "hidden";
      b.style.position = "fixed";
      b.style.top = `-${bodyLockY}px`;
      b.style.left = "0";
      b.style.right = "0";
    }
    bodyLocks++;
    return () => {
      bodyLocks = Math.max(0, bodyLocks - 1);
      if (bodyLocks === 0) {
        b.style.overflow = "";
        b.style.position = "";
        b.style.top = "";
        b.style.left = "";
        b.style.right = "";
        window.scrollTo(0, bodyLockY);
      }
    };
  }, []);
}

/* ================= 画面スリープ防止 ================= */
/* トレーニング中に画面が消えないようにする。
   Wake Lock API は対応していない端末・ブラウザがあるので、使えなければ何もしない */
function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.wakeLock) return;
    let lock = null, dead = false;
    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request("screen");
        if (dead) { l.release(); return; }
        lock = l;
      } catch (e) { /* 拒否・非対応 */ }
    };
    acquire();
    /* 画面を離れると自動で解除されるので、戻ってきたら取り直す */
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onVis);
      try { lock?.release(); } catch (e) { /* すでに解除済み */ }
    };
  }, [active]);
}

/* ================= カウントダウン（時刻基準） ================= */
/* 経過時間ではなく終了時刻で計算するので、画面を離れて戻ってもずれない */
function useCountdown() {
  const [endAt, setEndAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    /* iOSは復帰時に鳴るイベントがばらつくので3つとも拾う */
    const onWake = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, [endAt]);
  const remain = endAt == null ? null : Math.max(0, Math.ceil((endAt - now) / 1000));
  const start = (sec) => { const t = Date.now(); setNow(t); setEndAt(t + sec * 1000); };
  const stop = () => setEndAt(null);
  return { endAt, remain, start, stop };
}

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

/* ================= 種目詳細＋タイマー＋セット ================= */
function ExerciseDetail({ id, lv, stage, half, sets, target, restSec = REST_SEC, onAdd, onClose }) {
  const ex = EX[id];
  const sp = spec(ex, lv, stage, half);
  const [resting, setResting] = useState(false);
  const { endAt, remain, start, stop } = useCountdown();
  const lastTick = useRef(null);

  const isTime = ex.type === "time";
  const dur = resting ? restSec : timerSec(ex, sp);
  const shown = endAt == null ? dur : remain;

  /* タイマー中は画面を消さない */
  useWakeLock(endAt != null);

  /* 残り3・2・1を小さい音で刻む */
  useEffect(() => {
    if (endAt == null || remain == null) { lastTick.current = null; return; }
    if (remain > 3 || remain <= 0 || lastTick.current === remain) return;
    lastTick.current = remain;
    tick();
  }, [remain, endAt]);

  /* 0になったときの処理。setState の中ではなく effect で行う（二重加算を防ぐ） */
  useEffect(() => {
    if (endAt == null || remain == null || remain > 0) return;
    stop();
    if (resting) { setResting(false); signal(false); return; }
    signal(true);
    onAdd(1);
    if (sets + 1 < target) { setResting(true); start(restSec); }
  }, [remain, endAt]);

  const ratio = endAt == null ? 1 : shown / dur;
  const R = 58, circ = 2 * Math.PI * R;

  return (
    <div className="min-h-screen"
      style={{
        background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY, minHeight: "100dvh",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
      }}>
      <FigStyles />
      <div className="max-w-md mx-auto px-5 pt-6">
        <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm mb-4 font-bold">‹ 今日のメニューへ</button>

        <div className="flex flex-col items-center mb-5">
          <Fig kind={ex.fig} size={140} />
          <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-xs font-bold mt-3">{PHASE_META[phaseOf(id)].label}</p>
          <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mt-1">{ex.name}</h1>
          <p style={{ color: C.pinkDeep }} className="text-sm font-bold mt-1">{specText(ex, lv, stage, half)}</p>
          {half && <p style={{ color: C.lavText }} className="text-xs font-bold mt-1">短縮メニュー（いつもの半分）</p>}
        </div>

        {/* セット */}
        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ color: C.muted }} className="text-xs mb-3">やったセット数</p>
          <div className="flex items-center justify-between">
            <button onClick={() => onAdd(-1)} disabled={sets <= 0} aria-label="1セット減らす"
              style={{ borderColor: sets <= 0 ? C.line : C.lineDeep, color: sets <= 0 ? C.line : C.muted }}
              className="fx border-2 w-14 h-14 rounded-full text-2xl font-bold">−</button>
            <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold">
              {sets}<span style={{ color: C.muted }} className="text-xl"> / {target}</span>
            </p>
            <button onClick={() => onAdd(1)} disabled={sets >= target} aria-label="1セット記録する"
              style={{ background: sets >= target ? C.line : C.pink, color: C.ink, ...sticker(sets >= target ? C.line : "#E96A97") }}
              className="fx w-14 h-14 rounded-full text-2xl font-bold">＋</button>
          </div>
          {sets >= target && (
            <p style={{ color: C.mintText, fontFamily: DISPLAY }} className="text-sm font-bold text-center mt-4">この種目は完了です 🎉</p>
          )}
        </div>

        {/* タイマー（秒数種目のみ） */}
        {isTime && (
          <div style={card()} className="border-2 rounded-3xl px-5 py-6 mb-4 flex flex-col items-center">
            <p style={{ color: resting ? C.lavText : C.muted }} className="text-xs mb-3 font-bold">
              {resting ? `休憩中（${restSec}秒）` : "タイマー"}
            </p>
            <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
              <circle cx="75" cy="75" r={R} fill="none" stroke={C.line} strokeWidth="11" />
              <circle cx="75" cy="75" r={R} fill="none" stroke={resting ? C.lav : C.pink} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 75 75)"
                style={{ transition: "stroke-dashoffset .3s linear" }} />
              <text x="75" y="86" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, fill: C.ink }}>
                {shown >= 60 ? mmss(shown) : shown}
              </text>
            </svg>
            {/* 毎秒読み上げると邪魔になるので、節目だけ知らせる */}
            <p aria-live="polite" className="sr-only">
              {endAt == null ? "" : shown <= 3 || shown % 30 === 0 ? `残り ${shown} 秒` : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-5">
              <button onClick={() => { stop(); setResting(false); }}
                style={{ borderColor: C.lineDeep, color: C.muted }}
                className="fx border-2 rounded-full py-3 text-sm font-bold">リセット</button>
              <button onClick={() => (endAt ? stop() : start(dur))}
                style={{ background: endAt ? C.lav : C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker(endAt ? "#8C6BD6" : "#E96A97") }}
                className="fx rounded-full py-3 text-sm font-bold">
                {endAt ? "一時停止" : resting ? "休憩をはじめる" : "スタート"}
              </button>
            </div>
            <p style={{ color: C.muted }} className="text-xs mt-4 text-center leading-relaxed">
              0になると1セット加算され、そのまま{restSec}秒の休憩が始まります（長さは設定で変えられます）。
              {ex.perSide && `左右あわせた長さです。半分（${sp.amount}秒）たったら反対側に替えてください。`}
            </p>
          </div>
        )}

        {/* コツ */}
        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ fontFamily: DISPLAY }} className="text-sm font-bold mb-3">やり方のコツ</p>
          <ol className="grid gap-2.5">
            {ex.tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span style={{ background: C.bg, color: C.pinkDeep, fontFamily: DISPLAY }}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={card()} className="border-2 rounded-3xl px-5 py-5 mb-4">
          <p style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-sm font-bold mb-2">⚠️ よくある間違い</p>
          <p className="text-sm leading-relaxed mb-4">{ex.ng}</p>
          <p style={{ fontFamily: DISPLAY, color: C.lavText }} className="text-sm font-bold mb-2">🌱 きついときは</p>
          <p className="text-sm leading-relaxed">{ex.adjust}</p>
        </div>

        <button onClick={onClose}
          style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">
          今日のメニューに戻る
        </button>
      </div>
    </div>
  );
}

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

  const age = Number(f.age), now = Number(f.weightNow), goal = Number(f.weightGoal), h = Number(f.height);
  const minor = minorAge(f.age);
  const bmi = (kg) => (h > 0 && kg > 0 ? kg / ((h / 100) ** 2) : null);
  const bmiNow = bmi(now);
  const lowNow = bmiNow != null && bmiNow < 18.5;
  /* 体重の3%を引くだけだと、範囲内の人にアプリ側から範囲外の目標を出してしまう。
     （例：158cm / 47kg は範囲内だが、3%引くと 45.6kg で範囲外）
     下限で止め、引いた先が今とほとんど変わらない人には減量目標を出さない */
  const floorKg = h > 0 ? Math.ceil(18.5 * ((h / 100) ** 2) * 10) / 10 : null;
  const rawGoal = now > 0 && !lowNow ? Math.round(now * 0.97 * 10) / 10 : null;
  const firstGoal = rawGoal == null ? null : floorKg == null ? rawGoal : Math.max(rawGoal, floorKg);
  const goalAtFloor = firstGoal != null && rawGoal != null && firstGoal > rawGoal;
  const nearFloor = firstGoal != null && firstGoal >= now - 0.05;
  const goalBmi = bmi(goal);
  const tooLow = goalBmi != null && goalBmi < 18.5;

  return (
    <div style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen pb-32">
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

/* ================= 画面パーツ ================= */
function Center({ children }) {
  return (
    <div style={{ background: C.bg, color: C.muted, fontFamily: BODY, minHeight: "100dvh" }} className="min-h-screen flex items-center justify-center text-sm">
      {children}
    </div>
  );
}

function Header({ name, dow, meta, pct, done, total, streak, weeks, sealed, rest, lv, stage, half }) {
  const R = 32, circ = 2 * Math.PI * R;
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5">
      <p style={{ color: C.muted }} className="text-xs mb-3">こんにちは、{name}さん</p>
      <div className="flex items-center gap-5">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" className="shrink-0">
          <circle cx="42" cy="42" r={R} fill="none" stroke={C.line} strokeWidth="10" />
          <circle cx="42" cy="42" r={R} fill="none" stroke={pct === 100 ? C.mint : C.pink} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 42 42)"
            style={{ transition: "stroke-dashoffset .45s ease" }} />
          <text x="42" y="40" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, fill: C.ink }}>{DAY_JP[dow]}</text>
          <text x="42" y="55" textAnchor="middle" style={{ fontFamily: BODY, fontSize: 11, fill: C.muted }}>{done}/{total}</text>
        </svg>
        <div className="min-w-0">
          <p style={{ color: C.pinkDeep }} className="text-xs mb-1">つづいた週</p>
          <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold leading-none mb-2">{weeks}<span className="text-base ml-1">週</span></p>
          <p style={{ fontFamily: DISPLAY, color: C.ink }} className="text-sm font-bold">{meta.emoji} {meta.label}</p>
        </div>
      </div>
      <div style={{ borderColor: C.line }} className="border-t-2 border-dashed mt-4 pt-3 flex gap-2 flex-wrap">
        <span style={{ background: C.bg, color: C.pinkDeep }} className="text-xs px-3 py-1.5 rounded-full font-bold">🔥 連続 {streak} 日</span>
        {rest && <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🍃 軽めの日</span>}
        <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">{lvMeta(lv).emoji} Lv.{stage + 1}</span>
        {half && <span style={{ background: C.bg, color: C.lavText }} className="text-xs px-3 py-1.5 rounded-full font-bold">🌿 短縮</span>}
        {sealed && <span style={{ background: C.bg, color: C.mintText }} className="text-xs px-3 py-1.5 rounded-full font-bold">✓ 今日は完了</span>}
      </div>
    </div>
  );
}

function Section({ title, note, action, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between mb-1 px-1 gap-3">
        <h2 style={{ fontFamily: DISPLAY }} className="text-sm font-bold shrink-0">{title}</h2>
        {action && (
          <button onClick={action.onClick}
            style={{ background: C.surface, borderColor: C.pinkDeep, color: C.pinkDeep, ...sticker(C.line) }}
            className="fx border-2 rounded-full px-4 py-1.5 text-xs font-bold">
            {action.label}
          </button>
        )}
      </div>
      {note && <p style={{ color: C.muted }} className="text-xs mb-3 px-1">{note}</p>}
      <div className="grid gap-2.5">{children}</div>
    </div>
  );
}

function ExRow({ id, lv, stage, half, sets, target, onOpen, onQuick }) {
  const ex = EX[id];
  const done = sets >= target;
  return (
    <div style={{ background: done ? "#FBFFFD" : C.surface, borderColor: done ? C.mint : C.line, ...sticker(done ? C.mint : C.line) }}
      className="border-2 rounded-3xl px-4 py-3 flex items-center gap-3">
      <button onClick={onOpen} className="fx flex items-center gap-3 flex-1 min-w-0 text-left rounded-2xl">
        <Fig kind={ex.fig} />
        <span className="min-w-0 flex-1">
          <span style={{ fontFamily: DISPLAY, color: C.ink }} className="block text-sm font-bold leading-snug">{ex.name}</span>
          <span style={{ color: C.pinkDeep }} className="block text-xs mt-0.5 font-bold">{specText(ex, lv, stage, half)}</span>
          <span style={{ color: C.muted }} className="block text-xs mt-0.5">
            {ex.type === "time" ? "タップでタイマー・コツ" : "タップでコツを見る"} ›
          </span>
        </span>
      </button>
      <button onClick={onQuick} disabled={done} aria-label={`${ex.name} を1セット記録`}
        style={{ background: done ? C.mint : C.bg, color: C.ink, borderColor: done ? C.mint : C.lineDeep }}
        className={`fx shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center ${done ? "pop" : ""}`}>
        <span style={{ fontFamily: DISPLAY }} className="text-sm font-bold">{done ? "✓" : `${sets}/${target}`}</span>
        {!done && <span className="text-xs" style={{ color: C.muted }}>+1</span>}
      </button>
    </div>
  );
}

function WelcomeBack({ id, lv, stage, weeks, onShort, onFull }) {
  const ex = EX[id];
  return (
    <div className="pt-6">
      <div className="flex justify-center mb-4"><Fig kind={ex.fig} size={90} /></div>
      <h1 style={{ fontFamily: DISPLAY }} className="text-4xl font-bold mb-3 text-center">おかえり</h1>
      <p style={{ color: C.muted }} className="text-sm leading-relaxed mb-7 text-center">
        今日はウォームアップとこの1種目、<br />最後にストレッチだけにしておきます。
      </p>
      <button onClick={onShort} style={card()} className="fx w-full border-2 rounded-3xl px-4 py-4 flex items-center gap-3 text-left">
        <Fig kind={ex.fig} />
        <span>
          <span style={{ fontFamily: DISPLAY }} className="block text-base font-bold">{ex.name}</span>
          <span style={{ color: C.pinkDeep }} className="block text-xs font-bold mt-0.5">
            {specText(ex, lv, stage, true)}（いつもの半分）
          </span>
        </span>
      </button>
      <div className="text-center">
        <button onClick={onFull} style={{ color: C.pinkDeep }} className="fx mt-5 text-sm underline font-bold">今日はフルでやる</button>
      </div>
      <p style={{ color: C.muted }} className="text-xs mt-8 text-center">つづいた週：{weeks}週</p>
    </div>
  );
}

const PRAISE = [
  { big: "やりきった！", sub: "きつい日ほど、やった価値があります。" },
  { big: "えらすぎる", sub: "「今日はやめとこ」に勝ちました。" },
  { big: "最高です", sub: "今日のあなたは、昨日のあなたより強いです。" },
  { big: "よくやった！", sub: "この積み重ねしか効くものはありません。" },
  { big: "天才かも", sub: "続けている人は、実はそんなに多くないです。" },
  { big: "かっこいい", sub: "自分との約束を守れる人は強いです。" },
];

function CheerScreen({ name, streak, weeks, leveledUp, cheers = [], onClose }) {
  useBodyLock();
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], []);
  const letter = useMemo(() => (cheers.length ? cheers[Math.floor(Math.random() * cheers.length)] : null), [cheers]);
  const bits = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: 5 + Math.random() * 90, delay: Math.random() * 0.5,
    color: [C.pink, C.lav, C.mint, C.gold][i % 4],
  })), []);
  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 overflow-hidden z-30" role="dialog" aria-modal="true"
      style={{ background: "rgba(74,50,66,.55)" }}>
      <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none">
        {bits.map((b, i) => (
          <span key={i} className="confetti" style={{ left: `${b.left}%`, bottom: "10%", background: b.color, animationDelay: `${b.delay}s` }} />
        ))}
      </div>
      <div style={{ background: C.surface, fontFamily: BODY }} className="cheer w-full max-w-sm rounded-3xl px-7 py-9 text-center relative">
        <p className="text-6xl mb-3">🎉</p>
        <h2 style={{ fontFamily: DISPLAY, color: C.pinkDeep }} className="text-3xl font-bold mb-3">{praise.big}</h2>
        <p className="text-sm leading-relaxed mb-1">{name}さん、{praise.sub}</p>
        <p style={{ color: C.muted }} className="text-xs mb-5">連続 {streak} 日 ／ つづいた週 {weeks}週</p>
        {letter && (
          <div style={{ background: C.bg }} className="rounded-2xl px-4 py-4 mb-5 text-left">
            <p style={{ color: C.pinkDeep, fontFamily: DISPLAY }} className="text-xs font-bold mb-1.5">💌 とどいたメッセージ</p>
            <p className="text-sm leading-relaxed">{letter}</p>
          </div>
        )}
        {leveledUp && (
          <div style={{ background: C.bg }} className="rounded-2xl px-4 py-3 mb-5">
            <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-sm font-bold mb-1">⬆️ レベルが上がりました</p>
            <p style={{ color: C.muted }} className="text-xs leading-relaxed">明日から回数と秒数が少し増えます。きつければ「きつかった」を選んでください。量を戻します。</p>
          </div>
        )}
        <button onClick={onClose} style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
          className="fx w-full rounded-full py-4 text-base font-bold">ありがとう</button>
      </div>
    </div>
  );
}

function SwapDialog({ current, onClose, onConfirm }) {
  const [pick, setPick] = useState(current);
  const [step, setStep] = useState(0);
  const STEPS = ["本当に変更しますか？", "まじで変えますか？", "変えちゃいますよ？"];
  const list = ["lower", "core", "upper", "cardio", "full", "rest"];
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.45)" }}>
      {/* vh だと iOS でアドレスバーぶん下がはみ出し、決定ボタンが隠れる */}
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh" }} className="w-full max-w-md rounded-t-3xl flex flex-col">
        {step === 0 ? (
          <>
            <div className="px-5 pt-6 pb-3 shrink-0">
              <h3 style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">今日のメニューを入れ替える</h3>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">
                やりたい内容を選んで、下のボタンを押してください。変更は<strong>この曜日に毎週</strong>適用されます（設定から元に戻せます）。
              </p>
            </div>

            <div className="px-5 overflow-y-auto grow">
              <div className="grid gap-2 pb-4" role="radiogroup" aria-label="メニューの種類">
                {list.map((id) => (
                  <button key={id} onClick={() => setPick(id)} role="radio" aria-checked={pick === id}
                    style={{ background: pick === id ? C.bg : C.surface, borderColor: pick === id ? C.pinkDeep : C.lineDeep, ...sticker(pick === id ? C.pink : C.line) }}
                    className="fx border-2 rounded-3xl px-4 py-3 text-left text-sm flex items-center gap-3">
                    <span style={{ background: pick === id ? C.pink : "transparent", borderColor: pick === id ? C.pinkDeep : C.lineDeep, color: C.ink }}
                      className="w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                      {pick === id ? "✓" : ""}
                    </span>
                    <span style={{ fontFamily: DISPLAY }} className="font-bold flex-1">
                      {FOCUS_META[id].emoji} {FOCUS_META[id].label}
                      {id === current && <span style={{ color: C.muted }} className="text-xs font-normal ml-2">いま これ</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderColor: C.line, background: C.surface, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
              className="border-t-2 px-5 pt-4 shrink-0 grid gap-2">
              <button onClick={() => (pick === current ? onClose() : setStep(1))}
                style={{ background: pick === current ? C.line : C.pink, color: pick === current ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(pick === current ? C.line : "#E96A97") }}
                className="fx rounded-full py-4 text-base font-bold">
                {pick === current ? "同じメニューが選ばれています" : `この内容に変更する（${FOCUS_META[pick].label}）`}
              </button>
              <button onClick={onClose} style={{ color: C.muted }} className="fx rounded-full py-2 text-sm font-bold">やめる</button>
            </div>
          </>
        ) : (
          <div className="px-5 pt-6 pb-8">
            <p className="text-4xl text-center mb-2">{step === 1 ? "🤔" : step === 2 ? "😳" : "😤"}</p>
            <h3 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mb-2 text-center">{STEPS[step - 1]}</h3>
            <p style={{ color: C.muted }} className="text-xs mb-6 text-center">{FOCUS_META[current].label} → {FOCUS_META[pick].label}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} style={{ borderColor: C.lineDeep, color: C.muted }} className="fx border-2 rounded-full py-3 text-sm font-bold">やめる</button>
              <button onClick={() => (step < 3 ? setStep(step + 1) : onConfirm(pick))}
                style={{ background: C.pink, color: C.ink, ...sticker("#E96A97") }} className="fx rounded-full py-3 text-sm font-bold">はい</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

  /* 写真を含むと数百KBになるので、パネルを開いたときだけ作る */
  const exportText = useMemo(
    () => (showTransfer ? JSON.stringify({ v: 17.2, core, log, photos }) : ""),
    [showTransfer, core, log, photos]
  );

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
              onClick={async () => {
                try { await navigator.clipboard.writeText(exportText); setImportMsg("コピーしました"); }
                catch (e) { setImportMsg("コピーできませんでした。上の枠を長押しして選択してください。"); }
              }}
              style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
              className="fx w-full rounded-full py-3 text-sm font-bold mb-5">コピーする</button>

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

/* ================= 連続モード ================= */
function SessionRunner({ ids, lv, stage, half, restSec = REST_SEC, done, onSet, onClose, onFinishAll }) {
  const specOf = (x) => spec(EX[x], lv, stage, half);
  const [i, setI] = useState(() => {
    const f = ids.findIndex((x) => (done[x] ?? 0) < specOf(x).sets);
    return f < 0 ? 0 : f;
  });
  const [resting, setResting] = useState(false);
  const { endAt, remain, start, stop } = useCountdown();
  const lastTick = useRef(null);

  /* 連続モードの間はずっと画面を消さない */
  useWakeLock(true);
  useBodyLock();

  const id = ids[i];
  const ex = EX[id];
  const sp = specOf(id);
  const setsDone = done[id] ?? 0;
  const isTime = ex.type === "time";
  const dur = resting ? restSec : timerSec(ex, sp);
  const shown = endAt == null ? dur : remain;

  useEffect(() => {
    if (endAt == null || remain == null) { lastTick.current = null; return; }
    if (remain > 3 || remain <= 0 || lastTick.current === remain) return;
    lastTick.current = remain;
    tick();
  }, [remain, endAt]);

  useEffect(() => {
    if (endAt == null || remain == null || remain > 0) return;
    stop();
    if (resting) { setResting(false); signal(false); return; }
    signal(true);
    onSet(id, 1);
    if (setsDone + 1 < sp.sets) { setResting(true); start(restSec); }
  }, [remain, endAt]);

  const allDone = ids.every((x) => (done[x] ?? 0) >= specOf(x).sets);
  const thisDone = setsDone >= sp.sets;
  const R = 62, circ = 2 * Math.PI * R;
  const ratio = endAt == null ? 1 : shown / dur;

  const goNext = () => {
    stop(); setResting(false);
    if (i + 1 < ids.length) setI(i + 1);
    else onFinishAll(allDone); /* 未達なら完了扱いにしない */
  };

  return (
    <div style={{ background: C.bg, backgroundImage: DOTS, color: C.ink, fontFamily: BODY }} className="fixed inset-0 z-20 overflow-y-auto">
      <div className="max-w-md mx-auto px-5 pt-6 min-h-full flex flex-col"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} style={{ color: C.pinkDeep }} className="fx text-sm font-bold">閉じる</button>
          <p style={{ color: C.muted }} className="text-xs">{i + 1} / {ids.length} 種目</p>
        </div>

        <div className="flex gap-1 mb-6" aria-hidden="true">
          {ids.map((x, n) => {
            const d = (done[x] ?? 0) >= specOf(x).sets;
            return <div key={x} style={{ background: d ? C.mint : n === i ? C.pinkDeep : C.line }} className="h-1.5 flex-1 rounded-full" />;
          })}
        </div>

        <div className="flex flex-col items-center grow">
          <Fig kind={ex.fig} size={150} />
          <p style={{ color: C.lavText, fontFamily: DISPLAY }} className="text-xs font-bold mt-3">{PHASE_META[phaseOf(id)].label}</p>
          <h1 style={{ fontFamily: DISPLAY }} className="text-2xl font-bold mt-1 text-center">{ex.name}</h1>
          <p style={{ color: C.pinkDeep }} className="text-sm font-bold mt-1 mb-5">{specText(ex, lv, stage, half)}</p>

          {isTime ? (
            <>
              <p style={{ color: resting ? C.lavText : C.muted }} className="text-xs font-bold mb-2">
                {resting ? `休憩中（${restSec}秒）` : `${Math.min(setsDone + 1, sp.sets)}セット目`}
              </p>
              <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r={R} fill="none" stroke={C.line} strokeWidth="12" />
                <circle cx="80" cy="80" r={R} fill="none" stroke={resting ? C.lav : C.pink} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset .3s linear" }} />
                <text x="80" y="92" textAnchor="middle" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, fill: C.ink }}>
                  {shown >= 60 ? mmss(shown) : shown}
                </text>
              </svg>
              <button onClick={() => (endAt ? stop() : start(dur))} disabled={thisDone && !resting}
                style={{ background: thisDone && !resting ? C.line : endAt ? C.lav : C.pink, color: thisDone && !resting ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(thisDone && !resting ? C.line : endAt ? "#8C6BD6" : "#E96A97") }}
                className="fx w-full rounded-full py-4 text-base font-bold mt-5">
                {thisDone && !resting ? "この種目は完了" : endAt ? "一時停止" : resting ? "休憩をはじめる" : "スタート"}
              </button>
              {ex.perSide && !resting && (
                <p style={{ color: C.muted }} className="text-xs mt-3 text-center leading-relaxed">
                  左右あわせた長さです。半分（{sp.amount}秒）たったら反対側に替えてください。
                </p>
              )}
              <button onClick={() => { onSet(id, 1); stop(); setResting(false); }} disabled={thisDone}
                style={{ color: thisDone ? C.line : C.muted }} className="fx text-xs mt-3 underline">
                タイマーを使わずに1セット記録
              </button>
            </>
          ) : (
            <>
              <p style={{ fontFamily: DISPLAY }} className="text-5xl font-bold mb-1">
                {setsDone}<span style={{ color: C.muted }} className="text-2xl"> / {sp.sets}</span>
              </p>
              <p style={{ color: C.muted }} className="text-xs mb-5">セット</p>
              <button onClick={() => { onSet(id, 1); signal(setsDone + 1 >= sp.sets); }} disabled={thisDone}
                style={{ background: thisDone ? C.line : C.pink, color: thisDone ? C.muted : C.ink, fontFamily: DISPLAY, ...sticker(thisDone ? C.line : "#E96A97") }}
                className="fx w-full rounded-full py-5 text-lg font-bold">
                {thisDone ? "この種目は完了" : "1セット できた"}
              </button>
            </>
          )}

          <div style={{ background: C.surface, borderColor: C.line }} className="border-2 rounded-3xl px-5 py-4 mt-6 w-full">
            <p style={{ fontFamily: DISPLAY }} className="text-xs font-bold mb-2">コツ</p>
            <ul className="grid gap-1.5">
              {ex.tips.map((t, n) => (
                <li key={n} style={{ color: C.muted }} className="text-xs leading-relaxed">・{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={() => { stop(); setResting(false); setI(Math.max(0, i - 1)); }} disabled={i === 0}
            style={{ borderColor: i === 0 ? C.line : C.lineDeep, color: i === 0 ? C.line : C.muted }}
            className="fx border-2 rounded-full py-3 text-sm font-bold">‹ まえ</button>
          <button onClick={goNext}
            style={{ background: C.pink, color: C.ink, fontFamily: DISPLAY, ...sticker("#E96A97") }}
            className="fx rounded-full py-3 text-sm font-bold">
            {i + 1 < ids.length ? "つぎへ ›" : allDone ? "おわる" : "ここまでにする"}
          </button>
        </div>
        {i + 1 === ids.length && !allDone && (
          <p style={{ color: C.muted }} className="text-xs text-center mt-3 leading-relaxed">
            まだ残っている種目があります。ここでやめても、やったぶんは記録に残ります。
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= 体感を聞く ================= */
const FEELINGS = [
  ["hard", "きつかった", "😵", "量を少し戻します"],
  ["ok", "ちょうどよかった", "😊", "このまま少しずつ増やします"],
  ["easy", "楽だった", "😎", "早めに量を増やします"],
];

function FeelingSheet({ onPick, onClose }) {
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.5)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6">
        <h3 style={{ fontFamily: DISPLAY }} className="text-xl font-bold mb-1">今日はどうでしたか？</h3>
        <p style={{ color: C.muted }} className="text-xs mb-5">答えると、これからの量の増やし方が変わります。</p>
        <div className="grid gap-2.5">
          {FEELINGS.map(([v, l, e, note]) => (
            <button key={v} onClick={() => onPick(v)} style={card()}
              className="fx border-2 rounded-3xl px-4 py-4 flex items-center gap-3 text-left">
              <span className="text-3xl" aria-hidden="true">{e}</span>
              <span>
                <span style={{ fontFamily: DISPLAY }} className="block text-base font-bold">{l}</span>
                <span style={{ color: C.muted }} className="block text-xs">{note}</span>
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ color: C.muted }} className="fx w-full rounded-full py-3 text-sm mt-3 font-bold">
          答えずに完了する
        </button>
      </div>
    </div>
  );
}

/* ================= 今日は無理 ================= */
const SKIP_REASONS = ["体調がよくない", "時間がとれなかった", "疲れている", "気分がのらない", "予定が入った", "その他"];

function SkipSheet({ onClose, onSave }) {
  const [pick, setPick] = useState("");
  const [text, setText] = useState("");
  useBodyLock();
  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" role="dialog" aria-modal="true" style={{ background: "rgba(74,50,66,.45)" }}>
      <div style={{ background: C.surface, fontFamily: BODY, maxHeight: "88dvh" }} className="w-full max-w-md rounded-t-3xl flex flex-col">
        <div className="px-5 pt-6 pb-3">
          <h3 style={{ fontFamily: DISPLAY }} className="text-lg font-bold mb-1">今日はお休みにする</h3>
          <p style={{ color: C.muted }} className="text-xs">連続日数は止まりません。理由はカレンダーに残ります。</p>
        </div>
        <div className="px-5 overflow-y-auto grow">
          <div className="grid gap-2 pb-3" role="radiogroup" aria-label="お休みの理由">
            {SKIP_REASONS.map((r) => (
              <Choice key={r} role="radio" active={pick === r} onClick={() => setPick(r)} label={r} />
            ))}
          </div>
          <label htmlFor="skip-note" className="sr-only">ひとこと</label>
          <textarea id="skip-note" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={100}
            placeholder="ひとこと（任意）"
            style={{ background: C.bg, borderColor: C.lineDeep, color: C.ink }}
            className="fx w-full border-2 rounded-2xl px-4 py-3 text-sm mb-3 resize-none" />
        </div>
        <div style={{ borderColor: C.line, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          className="border-t-2 px-5 pt-4 grid gap-2">
          <button onClick={() => pick && onSave(pick, text.trim())} disabled={!pick}
            style={{ background: pick ? C.lav : C.line, color: pick ? C.ink : C.muted, fontFamily: DISPLAY, ...sticker(pick ? "#8C6BD6" : C.line) }}
            className="fx rounded-full py-4 text-base font-bold">
            {pick ? "お休みとして記録する" : "理由を選んでください"}
          </button>
          <button onClick={onClose} style={{ color: C.muted }} className="fx rounded-full py-2 text-sm font-bold">やめる</button>
        </div>
      </div>
    </div>
  );
}

/* ================= バッジ ================= */
function badgeList(log, weeks, streak) {
  const recs = Object.values(log ?? {});
  const doneCount = recs.filter((r) => r?.done).length;
  const notes = recs.filter((r) => r?.note).length;
  return [
    { emoji: "🌱", name: "はじめの一歩", desc: "1回やりきる", got: doneCount >= 1 },
    { emoji: "🌸", name: "3回", desc: "3回やりきる", got: doneCount >= 3 },
    { emoji: "🔥", name: "1週間つづいた", desc: "連続7日", got: streak >= 7 },
    { emoji: "⭐️", name: "10回", desc: "10回やりきる", got: doneCount >= 10 },
    { emoji: "📖", name: "記録魔", desc: "メモを5日書く", got: notes >= 5 },
    { emoji: "🏅", name: "1か月つづいた", desc: "4週つづける", got: weeks >= 4 },
    { emoji: "💎", name: "30回", desc: "30回やりきる", got: doneCount >= 30 },
    { emoji: "👑", name: "3か月つづいた", desc: "12週つづける", got: weeks >= 12 },
  ];
}

function BadgeGrid({ badges }) {
  return (
    <div style={card()} className="border-2 rounded-3xl p-4">
      <div className="grid grid-cols-4 gap-2">
        {badges.map((b) => (
          <div key={b.name} className="text-center">
            <div style={{ background: b.got ? C.bg : "#EFEAF0" }}
              className="aspect-square rounded-2xl flex items-center justify-center text-2xl mb-1">
              <span aria-hidden="true">{b.got ? b.emoji : "🔒"}</span>
            </div>
            <p style={{ color: C.ink, fontFamily: DISPLAY }} className="text-xs font-bold leading-tight">{b.name}</p>
            <p style={{ color: C.muted }} className="text-xs leading-tight">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= 週まとめ ================= */
function WeekSummary({ log, today }) {
  const count = (offset) => {
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - offset * 7);
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > today) break;
      if (log[dateKey(d)]?.done) n++;
    }
    return n;
  };
  const now = count(0), prev = count(1);
  const diff = now - prev;
  return (
    <div style={card()} className="border-2 rounded-3xl px-5 py-5">
      <p style={{ color: C.muted }} className="text-xs mb-2">今週やりきった回数</p>
      <p style={{ fontFamily: DISPLAY }} className="text-4xl font-bold leading-none mb-2">
        {now}<span className="text-base ml-1">回</span>
      </p>
      <p style={{ color: diff > 0 ? C.mintText : diff < 0 ? C.pinkDeep : C.muted }} className="text-xs font-bold">
        {diff > 0 ? `先週より ${diff} 回多い` : diff < 0 ? `先週より ${-diff} 回少ない（先週 ${prev} 回）` : `先週と同じ（${prev} 回）`}
      </p>
    </div>
  );
}

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
