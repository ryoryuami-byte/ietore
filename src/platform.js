/* いま動いているのが、ネイティブの殻の中（iOS / Android アプリ）か、
   ふつうのブラウザかを見分ける。

   保存先・画面スリープ・通知など、プラットフォームで振る舞いを変える箇所は
   すべてこの1つの関数を見る。判定を各所に散らかさないための置き場所。 */
import { Capacitor } from "@capacitor/core";

const isNative = () => Capacitor.isNativePlatform();

export { isNative };
