# アイコンとスプラッシュの素材

**ここに入っている PNG は仮のものです。差し替えてください。**

必要なサイズと、置いたあとの手順は [../store/README.md](../store/README.md) にあります。

| ファイル | サイズ | 用途 |
| --- | --- | --- |
| `icon-only.png` | 1024 × 1024 | iOS のアイコン（透過なし） |
| `icon-foreground.png` | 1024 × 1024 | Android の前面（透過あり・中央66%に収める） |
| `icon-background.png` | 1024 × 1024 | Android の背面 |
| `splash.png` | 2732 × 2732 | 起動画面 |
| `splash-dark.png` | 2732 × 2732 | 起動画面（ダークモード） |

差し替えたら:

```bash
npx capacitor-assets generate --ios --android \
  --iconBackgroundColor '#FFF3F7' --iconBackgroundColorDark '#FFF3F7' \
  --splashBackgroundColor '#FFF3F7' --splashBackgroundColorDark '#FFF3F7'
npm run sync
```
