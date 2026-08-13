# ビルドと実機での動作確認

Phase 1・2 が終わった時点の手順です。Phase 3 以降で通知などが入ると、ここも増えます。

---

## 1. 手元で動かす（Mac でも Windows でも Linux でもよい）

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` は `--host` つきで立ち上がるので、**同じ Wi-Fi のスマホからも開けます**。
ターミナルに出る `Network:` の URL をスマホで開くと、実機のブラウザで確認できます。
Xcode を用意する前の確認は、ここまでで十分できます。

| コマンド | 中身 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | `dist/` に本番用を書き出す |
| `npm run preview` | 書き出したものを確認する |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run sync` | ビルド → iOS / Android に取り込む |

---

## 2. iOS の実機・ストア向け（**Mac が必要**）

### 用意するもの

| | 備考 |
| --- | --- |
| Mac | Xcode が Mac でしか動かないため、ここだけは避けられません |
| Xcode 15 以降 | App Store から |
| CocoaPods | `sudo gem install cocoapods` |
| Apple Developer Program | 年 99USD。**登録に数日かかることがあるので早めに** |

### 手順

```bash
npm install
npx cap sync ios        # pod install もここで走る
npx cap open ios        # Xcode が開く
```

Xcode 側で:

1. `App` ターゲット → **Signing & Capabilities** で自分の Team を選ぶ
2. **Bundle Identifier** を確認する（既定は `jp.ietore.app`）
3. **Push Notifications は要りません。** 使うのはローカル通知（端末の中だけで完結する予約）です
4. 実機をつなぎ、▶︎ で起動

### すでに入れてある設定

- `capacitor.config.json`
  - `ios.contentInset: "never"` — 画面の余白はコード側の `env(safe-area-inset-*)` に任せる。
    ここを既定のままにすると**セーフエリアぶんの余白が二重にかかります**
  - `backgroundColor: "#FFF3F7"` — 起動直後の一瞬に白がちらつかないように
  - `limitsNavigationsToAppBoundDomains: true` — 外部サイトへ飛ばない
- `ios/App/App/Info.plist`
  - `NSPhotoLibraryUsageDescription` / `NSCameraUsageDescription`
  - **これが無いと、「写真をえらぶ」を押した瞬間にアプリが落ちます。**
    審査以前に動かないので、消さないでください

### まだ決めていないこと

- **画面の向き**: いまは縦・横の両方が有効です。レイアウトは縦向き前提（`max-w-md` の中央寄せ）なので、
  縦だけに固定するかを決めてください。固定するなら Xcode の
  Deployment Info → Device Orientation から Portrait だけにします
- **アイコンとスプラッシュ**: テンプレートのままです。Phase 5 で差し替えます

---

## 3. Android（Mac は不要）

```bash
npm install
npx cap sync android
npx cap open android    # Android Studio が開く
```

`AndroidManifest.xml` には、お知らせのために3つの許可を足してあります。

| 許可 | 何のため |
| --- | --- |
| `POST_NOTIFICATIONS` | Android 13 以降。**無いと許可ダイアログすら出せず、お知らせが一度も鳴りません** |
| `SCHEDULE_EXACT_ALARM` | Android 12 以降。時刻ちょうどに出すため |
| `RECEIVE_BOOT_COMPLETED` | 端末を再起動しても予約が消えないように |

---

## 4. 実機で必ず見るところ

Phase 1・2 で触った部分に絞った確認項目です。全体のテスト表は Phase 4 で作ります。

### 見た目（Phase 1 で Tailwind を入れ替えた影響）

- [ ] 初回診断の画面が崩れていない（ボタン・入力欄・選択肢の並び）
- [ ] 今日のメニューのカードに影がついている（`sticker` の `box-shadow`）
- [ ] 画面いちばん下のタブが、**ホームインジケータに重なっていない**
- [ ] シート（種目詳細・お休み申告・メモ）を開いたとき、後ろの画面が動かない
- [ ] 開いていたシートを閉じたら、元のスクロール位置に戻る
- [ ] iOS のダークモードにしても読める
- [ ] iOS の文字サイズを「最大」にしても、はみ出さない

### 保存（Phase 2 で置き場所を変えた影響）

- [ ] 初回診断を終えてアプリを**完全に終了 → 再起動**しても、プロフィールが残っている
- [ ] セットを数えてから再起動しても、記録が残っている
- [ ] 写真を1枚えらんで再起動しても、写真が表示される（ここがいちばん壊れやすい）
- [ ] 写真を12枚入れても、記録の保存が止まらない
- [ ] 写真を削除したあと、**端末の空き容量が実際に戻る**
      （設定 → 一般 → iPhoneストレージ → イエトレ で確認）
- [ ] せってい → 引き継ぎ → 書き出し で、`{` から始まる文字列が出る
      （「用意しています…」のまま止まらないこと。写真をファイルから読み直しています）
- [ ] 書き出した文字列を別の端末で読み込むと、**写真まで復元される**

### タイマー（Phase 2 で画面スリープ防止を差し替えた影響）

- [ ] 秒数の種目でタイマーを動かし、**触らずに放置しても画面が消えない**
      （WKWebView に Wake Lock API が無いため、ここはネイティブのプラグインに切り替えました）
- [ ] タイマー中にホームに戻り、しばらくしてから戻ると、経過ぶんが正しく進んでいる
- [ ] タイマーを止めて別の画面に移ると、画面が普通に消えるようになる

---

## 5. 依存パッケージの安全性

```bash
npm audit --omit=dev     # アプリに入るものだけを見る
```

**アプリに入る依存には、いま指摘がありません（0件）。**

`npm audit` を素で叩くと `@capacitor/cli` 経由の `tar` が2件出ますが、
これは**ビルドするときにだけ動く道具で、アプリの中には入りません**。
Capacitor 7 に上げると消えますが、破壊的変更があるので Phase 4 以降で検討してください。
