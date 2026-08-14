/* =========================================================================
   引き継ぎ（バックアップ）

   v17.2 までは「長い文字列をコピーして、自分でメモアプリに貼る」方式だった。
   写真を含むと数百KB になり、現実には誰も控えを取らない。
   端末の中にしかデータが無いアプリで控えが取られないのは、そのまま
   「機種変更で全部消える」を意味するので、ここは発売前に直しておく必要がある。

   ファイルとして書き出し、共有シート（AirDrop・ファイル・メール等）へ渡す。
   読み込みは <input type="file"> で受ける（iOS では「ファイル」アプリが開く）。
   文字列のコピペも残してある（共有が使えない環境のため）。
   ========================================================================= */
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { photosForExport } from "./photoFiles.js";
import { isNative } from "./platform.js";
import { dateKey } from "./utils.js";

const BACKUP_VERSION = 18;

/* 書き出す中身を作る。写真はファイルから読み直して data: に戻す
   （別の端末へ持っていく以上、実体が要る） */
async function buildBackup({ core, log, photos }) {
  return {
    v: BACKUP_VERSION,
    app: "ietore",
    at: new Date().toISOString(),
    core,
    log,
    photos: await photosForExport(photos),
  };
}

const fileNameFor = () => `ietore-${dateKey(new Date())}.json`;

/* 書き出して共有シートを開く。
   戻り値は { ok, reason } 。画面側はこれを見てメッセージを出す */
async function shareBackup(data) {
  const json = JSON.stringify(data);
  const name = fileNameFor();

  if (!isNative()) {
    /* ブラウザではファイルとしてダウンロードさせる */
    try {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { ok: true, reason: "downloaded" };
    } catch (e) {
      return { ok: false, reason: "download-failed" };
    }
  }

  try {
    /* Cache に置いてから共有する。Documents に残すと
       「ファイル」アプリに書き出し前のものが溜まっていく */
    await Filesystem.writeFile({
      path: name,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    await Share.share({
      title: "イエトレの引き継ぎファイル",
      text: "機種変更やアプリの入れ直しのときに、このファイルを読み込んでください。",
      url: uri,
      dialogTitle: "引き継ぎファイルを保存する",
    });
    return { ok: true, reason: "shared" };
  } catch (e) {
    /* 共有シートを閉じただけでも例外になることがあるので、
       利用者に「失敗した」と言い切らない */
    return { ok: false, reason: "cancelled-or-failed" };
  }
}

/* 読み込んだファイルの中身を確かめる。
   ここを通ったものだけを normalize* に渡す */
function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("形式が違います");
  if (!data.core || typeof data.core !== "object") throw new Error("記録が入っていません");
  return data;
}

/* File オブジェクトを読む。10MB を超えるものは弾く
   （写真24枚ぶんでも 2MB 程度。それより桁違いに大きいものは別のファイル） */
async function readBackupFile(file) {
  if (!file) throw new Error("ファイルが選ばれていません");
  if (file.size > 10 * 1024 * 1024) throw new Error("ファイルが大きすぎます");
  const text = await file.text();
  return parseBackup(text);
}

export { BACKUP_VERSION, buildBackup, parseBackup, readBackupFile, shareBackup };
