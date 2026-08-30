# イエトレ — 開発ガイド

家で続ける運動習慣アプリ。日本語UI、データは端末内（localStorage）のみ、サーバーなし。

**このファイルは Codex / Claude Code など、コーディングエージェント向けの引き継ぎ資料です。**
まずここを最後まで読んでから作業してください。特に「重要な制約」を読まずに触ると壊します。

---

## ⚠️ 重要な制約：読めるソースコードは存在しません

このアプリは Claude の Artifact として生成されたもので、**手元にあるのは圧縮済み（minify済み）のJSバンドル1枚だけ**です。
元の React/JSX ソースは残っていません。

```js
// これが実際の中身です
M={armcircle:{name:`肩と腕まわし`,fig:`armcircle`,type:`time`,phase:`warmup`,...
function hr({log:e,plan:t,today:n,dateKey:r,trained:i,freezeOn:a=!0,since:p=null}){...
```

変数名は `e` `t` `n` `h` `k` `M` のように1文字へ潰されています。

### そのため、直接編集してはいけないファイル

| ファイル | 中身 | 編集 |
|---|---|---|
| `ietore.html` | claude.ai の Artifact 用（本体） | ❌ **自動生成物** |
| `pwa/index.html` | GitHub Pages 用（本体＋PWA外装） | ❌ **自動生成物** |

この2つは `build/build.sh` の出力です。直接編集しても次のビルドで消えます。

---

## 開発の仕組み

**元バンドルは一切書き換えず、「文字列置換パッチのリスト」として変更を積み上げる**方式です。

```
build/source/artifact-original.html   ← 手を触れない元バンドル（唯一の真実）
              +
build/patch.py の PATCHES リスト      ← これまでの全変更（各1件、正確に1箇所ずつ）
              +
build/figs.mjs                        ← 種目ピクトグラム32種の図形定義
              ↓  build/build.sh
       ietore.html / pwa/index.html
```

### なぜこの方式か

元ソースがない以上、圧縮コードを直接手で書き換えると「何をどう変えたか」が失われます。
パッチとして残せば、変更内容が差分として読め、元に戻せて、意図をコメントで説明できます。

### 安全装置

`patch.py` は**各パッチが元バンドル内に「ちょうど1箇所」一致することを検証**します。
0箇所でも2箇所以上でもビルドは失敗して止まります。
パッチが黙って効かなくなることはありません。

---

## ビルド

```bash
cd build
npm install          # 初回のみ（playwright）
./build.sh           # ietore.html と pwa/index.html を生成
```

出力は決定的です。同じ入力からは必ずバイト単位で同じ結果が出ます。
ビルド後に `git diff` が空なら、変更なしということです。

---

## 変更の加え方

### 1. 変更したい箇所を圧縮バンドルから探す

読みやすくして探します。

```bash
cd build
npx prettier --parser babel source/artifact-original.html > /tmp/pretty.js   # 目視用
grep -n "変えたい日本語の文言" source/artifact-original.html
```

日本語の文言は圧縮されないので、**文言でgrepするのが最短**です。

### 2. `build/patch.py` の `PATCHES` にペアを追加する

```python
PATCHES = [
    ...
    # 11. 何をなぜ直すのかを日本語か英語で書く
    ("元の文字列そのまま",
     "置き換え後の文字列"),
]
```

- 元文字列はバンドルから**コピペ**すること。手で打つと空白やバッククォートがずれます
- 一意になる長さにすること（短すぎると複数一致してビルドが落ちます）
- 圧縮コードは**バッククォート文字列** `` `文字列` `` を使います。シングルクォートではありません

### 3. ビルドしてブラウザで確認する

```bash
./build.sh
node test/runpwa.mjs                    # マニフェスト・SW・テーマ
node test/repcount3.mjs test/seed2.js   # 回数カウント（カウントダウンOFF）
node test/repcount3.mjs test/seed3.js   # 回数カウント（カウントダウンON）
```

**必ず実機（ヘッドレスChromium）で確認してください。** 圧縮コードへのパッチは
型チェックもリンタも効きません。動かして見るのが唯一の検証手段です。

---

## ピクトグラム（種目の棒人間アイコン）

32種類。`build/figs.mjs` が唯一の定義元です。圧縮コードを触る必要はありません。

```js
squat: [
  GND,                                    // 地面の線（ピンク）
  ['g', 'an-bob', 22, 30, [               // アニメーショングループ（クラス, 原点x, 原点y）
    ['h', 18, 9],                         // 頭（円）
    ['l', 'M18.5 13.4 L20 22'],           // 体の線（SVGパス）
    ['p', 'M8 5 V36.5'],                  // 道具の線（壁・踏み台・タオル / ピンク）
  ]],
],
```

- キャンバスは 44×44。地面 y=36.5、立ち姿勢の頭は y≈9、足は y≈35.5
- 使えるアニメーションクラスは元バンドルのCSSに定義済み
  （`an-bob` `an-lift` `an-swing` `an-legup` `an-twist` `an-squash` `an-push`
  `an-pushdown` `an-torso` `an-pull` `an-reach` `an-arch` `an-breathe` `an-rise` ほか）

確認は一覧表を描くのが早いです。

```bash
cd build
node sheet.mjs        # sheet.html を生成。ブラウザで開くと32種を大小2サイズで一覧
```

---

## リリース

### GitHub Pages（ホーム画面アプリ）

`main` に push すると `.github/workflows/pages.yml` が自動デプロイします。

- 公開URL: https://ryoryuami-byte.github.io/ietore/
- `pwa/` 以下の変更で発火します
- **`pwa/sw.js` の `CACHE` の版を上げること**（`ietore-shell-v3` → `v4`）。
  上げないと既存利用者に古いキャッシュが残ることがあります

### claude.ai の Artifact

`ietore.html` を同じURLへ再発行します。これは Claude 側の操作なので、
Codex から実行することはできません。Pages だけの更新でも実用上は問題ありません。

---

## 設計上の要点（触る前に知っておくこと）

- **サーバーもアカウントもありません。** 記録は利用者の端末の localStorage のみ。
  したがって利用者間でデータが混ざることはなく、端末を失うと復元もできません
- **保存キー**: `hometrain:core:v1`（設定・プロフィール・体重）、`hometrain:log:v1`（日々の記録）、
  `hometrain:photos:v1`（写真）
- **バージョン番号**は `build/patch.py` の `VERSION` が唯一の定義元。
  マイページ末尾の表示とクラッシュレポートの両方がここを参照します
- **テーマ**（ライト/ダーク）はアプリ自身が `data-theme` 属性と `meta[theme-color]` を
  書き換えて管理します。ホスト側のCSSに依存していません
- **医療的な注意書き・同意画面は必須要件**です。運動アプリとして安全上の理由があるので、
  短縮したり省いたりしないでください

---

## 既知の弱点・今後の課題

- **最大の課題は、読めるソースがないこと自体**です。パッチ方式は変更を追跡できますが、
  大きな機能追加には向きません。本格的に開発を続けるなら、
  圧縮バンドルから React ソースへ書き起こす作業（`build/source` を出発点に、
  1文字変数へ意味のある名前を付け直す）が必要です
- リポジトリは公開です（GitHub Pages 無料枠の制約）。
  秘密情報を絶対に入れないでください
- 音声読み上げは端末のTTSに依存します。iOS は仕様が不安定なため、
  `Ce()` に停止・再開まわりの回避策が入っています（パッチ8）

---

## ディレクトリ構成

```
ietore.html              自動生成（Artifact用）        ← 編集しない
pwa/
  index.html             自動生成（Pages用）           ← 編集しない
  manifest.json          アプリ名・アイコン・standalone
  sw.js                  Service Worker（更新時は版を上げる）
  *.png                  アイコン各サイズ
build/
  build.sh               ビルド一括実行
  patch.py               ★ 全変更のパッチリスト（ここを編集する）
  figs.mjs               ★ ピクトグラム32種の定義（ここを編集する）
  genA.mjs               figs.mjs → newA.js を生成
  sheet.mjs              ピクトグラム一覧HTMLを生成
  source/
    artifact-original.html   元バンドル                ← 絶対に編集しない
  icons/
    source-icon.png      アイコンの元画像
    gen_icon3.py         元画像の背景を除去して正方形化
    gen_icon4.py         各サイズへ書き出し
  test/
    serve.mjs            テスト用静的サーバー
    seed*.js             テスト用データ（seed2=カウントダウンOFF）
    *.mjs                Playwright テスト
FIXES.md                 これまでの不具合修正の記録
```
