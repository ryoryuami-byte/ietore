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

export { shrinkImage };
