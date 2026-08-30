export async function fresh(page){
  const {consent,onboard,pick}=await import('./lib2.mjs');
  await consent(page); await onboard(page);
  await pick(page,'下腹'); await pick(page,'時間がとれなかった'); await pick(page,'ない'); await pick(page,'むくみやすい');
  await pick(page,'メニューを作る'); await page.waitForTimeout(500);
}
