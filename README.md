# イエトレ（ホームトレーニング）

家でできる筋トレ・有酸素のメニューを、体の状態と続けやすさに合わせて自動で組み立てるアプリ。
記録はすべて端末の中だけに保存され、外部には送信されません。

```bash
npm install
npm run dev      # http://localhost:5173（同じ Wi-Fi のスマホからも開けます）
```

- ビルドと実機での確認 → [docs/BUILD.md](docs/BUILD.md)
- 発売までの手順 → [docs/RELEASE_ROADMAP.md](docs/RELEASE_ROADMAP.md)
- これまでの変更 → [docs/CHANGELOG.md](docs/CHANGELOG.md)

## いまの進みぐあい

| | 状態 |
| --- | --- |
| Phase 1 土台づくり | **済** Vite + React + Tailwind。3,555行を23モジュールへ分割 |
| Phase 2 ネイティブ化 | **済** Capacitor で iOS / Android。保存を端末側へ移した |
| Phase 3 発売に必要な機能 | これから（通知・法務・全削除・バックアップ） |
| Phase 4 品質保証 | これから |
| Phase 5 ストア準備 | これから |

## 構成

```
src/
  App.jsx            入口。エラー表示と viewport だけ
  AppInner.jsx       画面の本体と状態
  tokens.js          色・書体・カードの影
  exercises.js       種目ライブラリと、1回の流れ（① 〜 ④）
  questions.js       初回診断の質問
  utils.js           日付・時刻・数値の小道具
  platform.js        ネイティブかブラウザかの判定（ここ1か所だけ）
  storage.js         保存の入口。置き場所を知っているのはここだけ
  photoFiles.js      写真の実体。ネイティブではファイルへ逃がす
  sound.js           音とバイブ
  image.js           写真の縮小
  hooks.js           背面スクロールの固定・画面スリープ防止・カウントダウン
  logic/
    plan.js          プロフィール → 週のメニュー
    progress.js      レベルと段階、1種目あたりの回数・秒数
    validate.js      読み込んだ値の検証
  components/        画面の部品
  screens/           初回診断・きろく・せってい
ios/  android/       Capacitor が生成したネイティブ側
```

`logic/` の下は React に依存しない純粋な関数なので、そのままテストが書けます。

## 保存の置き場所

`storage.js` の `readJSON` / `writeJSON` だけがプラットフォームの違いを知っています。

| | 記録・設定 | 写真 |
| --- | --- | --- |
| iOS / Android | Capacitor Preferences | ファイル（Filesystem）。保存領域にはファイル名だけ |
| ブラウザ | localStorage | localStorage に data: のまま |

写真をファイルに逃がしているのは、base64 のまま持つと保存領域を圧迫し、
さらに Safari がしばらく使われないサイトの保存領域を消すことがあるためです。

## 主な機能

- 初回診断（年齢・体格・目的・週の日数・強さ・足音・避けたい部位・体質）からの週プラン生成
- 1回の流れ: ① ウォームアップ → ② メイン → ③ 有酸素20分 → ④ クールダウン
- 続けた回数と体感の回答から、負荷を自動で上げ下げ（レベル × 段階）
- タイマー・連続モード・セット間の自動休憩
- カレンダー / 体重・ウエスト・太もものグラフ / 部位別の累計 / 写真の見くらべ / バッジ
- お休み申告、短縮メニュー、メニューの入れ替え
- 端末をまたぐ引き継ぎ（文字列の書き出し・読み込み）
