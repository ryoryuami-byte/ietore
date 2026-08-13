/* =========================================================================
   写真の置き場所。

   これまで写真は data:image/jpeg;base64,… の文字列のまま
   記録と同じ保存領域に入っていた。1枚 60KB 前後 × 上限12枚で、
   localStorage の 5MB 枠のかなりの部分を写真が占めてしまう。
   さらに Safari は、しばらく使われないサイトの保存領域を消すことがある。

   ネイティブ（iOS / Android）ではファイルとして端末に置き、
   保存領域にはファイル名だけを残す。

   画面側は今までどおり photo.data を <img src> に渡すだけでよい。
     Web      … data.data は data:image/jpeg;base64,…（今までと同じ）
     ネイティブ … photo.data は capacitor://… の表示用 URL、
                  photo.file に実体のファイル名が入る
   ========================================================================= */
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { isNative } from "./platform.js";

const DIR = Directory.Data;
const FOLDER = "photos";

/* data:image/jpeg;base64,XXXX → XXXX */
const bodyOf = (dataUrl) => String(dataUrl).slice(String(dataUrl).indexOf(",") + 1);
const isDataUrl = (v) => typeof v === "string" && v.startsWith("data:image/");

/* 同じ日に撮り直したときに前のファイルが残らないよう、名前は日付から作る */
const fileNameFor = (date) => `${date}.jpg`;

async function ensureFolder() {
  try {
    await Filesystem.mkdir({ path: FOLDER, directory: DIR, recursive: true });
  } catch (e) {
    /* すでにある場合はここに来る */
  }
}

/* 保存する形（ファイル名だけ）に直す。
   新しく選ばれた data: の写真はファイルに書き出し、
   一覧から消えた写真のファイルは削除する。 */
async function offloadPhotos(list) {
  const photos = Array.isArray(list) ? list : [];
  if (!isNative()) {
    /* Web はこれまでどおり data: のまま持つ */
    return photos.map((p) => ({ date: p.date, data: p.data }));
  }

  await ensureFolder();
  const out = [];
  for (const p of photos) {
    const name = p.file ?? fileNameFor(p.date);
    if (isDataUrl(p.data)) {
      await Filesystem.writeFile({
        path: `${FOLDER}/${name}`,
        data: bodyOf(p.data),
        directory: DIR,
      });
    }
    out.push({ date: p.date, file: name });
  }

  /* 一覧に無いファイルを片づける。ここを飛ばすと、
     写真を消しても端末の容量が減らないままになる */
  try {
    const keep = new Set(out.map((p) => p.file));
    const { files } = await Filesystem.readdir({ path: FOLDER, directory: DIR });
    for (const f of files) {
      const name = typeof f === "string" ? f : f.name;
      if (!keep.has(name)) {
        try { await Filesystem.deleteFile({ path: `${FOLDER}/${name}`, directory: DIR }); }
        catch (e) { /* 消せなくても致命的ではない */ }
      }
    }
  } catch (e) {
    /* フォルダがまだ無い場合など */
  }

  return out;
}

/* 保存されている形（ファイル名）から、画面で表示できる形に戻す */
async function hydratePhotos(list) {
  const photos = Array.isArray(list) ? list : [];
  if (!isNative()) return photos;

  const out = [];
  for (const p of photos) {
    if (isDataUrl(p.data)) {
      /* Web で使っていたデータを、ネイティブで初めて開いたとき。
         次の保存でファイルへ移る */
      out.push({ date: p.date, data: p.data });
      continue;
    }
    if (typeof p.file !== "string") continue;
    try {
      const { uri } = await Filesystem.getUri({ path: `${FOLDER}/${p.file}`, directory: DIR });
      out.push({ date: p.date, file: p.file, data: Capacitor.convertFileSrc(uri) });
    } catch (e) {
      /* ファイルが見つからない写真は、一覧から落とす */
    }
  }
  return out;
}

/* 引き継ぎの書き出し用。ファイルに逃がした写真を data: に戻す。
   別の端末へ持っていく以上、ここだけは実体が要る */
async function photoToDataUrl(photo) {
  if (isDataUrl(photo?.data)) return photo.data;
  if (!isNative() || typeof photo?.file !== "string") return null;
  try {
    const { data } = await Filesystem.readFile({
      path: `${FOLDER}/${photo.file}`,
      directory: DIR,
    });
    return `data:image/jpeg;base64,${data}`;
  } catch (e) {
    return null;
  }
}

async function photosForExport(list) {
  const out = [];
  for (const p of Array.isArray(list) ? list : []) {
    const data = await photoToDataUrl(p);
    if (data) out.push({ date: p.date, data });
  }
  return out;
}

export { hydratePhotos, offloadPhotos, photosForExport, photoToDataUrl };
