/* 画面を実際に撮って見るための道具。

   ダークモードを入れたときに、目で確かめる手段が無いと詰んだ。
   テストは「色の比が 4.5 以上か」までしか見てくれない。
   「暗い画面で、線が地に沈んで消えていないか」は見ないと分からない。

     npm run shots            … 明るい／暗いを、5つのタブぶん撮る
     npm run shots -- huge    … 文字を「とても大きい」にして撮る

   出来上がりは shots/ の下。git には入れない（.gitignore 済み）。

   ふつうの Playwright は自分でブラウザを落としてくるが、
   ここでは PLAYWRIGHT_CHROMIUM に入っている実体を使う。
   無ければ Playwright まかせにする。 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { chromium } from "playwright";
import { buildPlan } from "../src/logic/plan.js";

const OUT = "shots";
const SCALE = process.argv[2] === "huge" ? "huge" : "normal";
const TABS = ["ホーム", "トレーニング", "記録", "カレンダー", "マイページ"];

const PROFILE = {
  age: "34", height: "158", weightNow: "55", weightGoal: "52", goal: "lose", days: "4",
  minutes: "30", activity: "little", noise: "quiet", level: "normal", timeOfDay: "evening",
  avoid: ["none"], area: ["bellyLow", "thighF"], stopReason: ["forget"], tendency: [],
};

/* 「しばらく続けている人」の記録を作る。まっさらだと、
   グラフもバッジも連続日数も出ず、いちばん見たいところが見えない */
function sampleLog() {
  const log = {};
  const today = new Date();
  for (let i = 1; i <= 40; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (i % 3 === 0) continue; /* 週に2日ほど休む */
    log[k] = { ex: { squat: 3, plank: 2, hip: 3 }, done: true, lv: 1, stage: 2 };
  }
  return log;
}

/* 横にはみ出していないか。
   「文字の大きさ」を上げると、rem で決まっている幅も一緒に伸びる。
   はみ出しは撮った絵をよく見ないと気づけないので、数字で見る。
   （v18.5 で実際にやらかした。max-w-md が 555px になって画面から出ていた） */
const over = [];
async function checkWidth(page, where) {
  const w = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
  }));
  if (w.doc > w.win + 1) over.push(`${where}（中身 ${w.doc}px / 画面 ${w.win}px）`);
}

const exe = process.env.PLAYWRIGHT_CHROMIUM;
const browser = await chromium.launch(exe && existsSync(exe) ? { executablePath: exe } : {});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.addInitScript(([profile, plan, log, th, fs]) => {
    localStorage.setItem("hometrain:core:v1", JSON.stringify({
      name: "さくら", profile, plan, theme: th, fontScale: fs,
      consent: { v: 1, at: "2026-01-01" },
      weights: [
        { date: "2026-06-07", kg: 57.2, waist: 72 }, { date: "2026-06-14", kg: 56.8, waist: 71.5 },
        { date: "2026-06-21", kg: 56.5, waist: 71 }, { date: "2026-06-28", kg: 56.1, waist: 70.8 },
        { date: "2026-07-05", kg: 55.6, waist: 70.2 }, { date: "2026-07-12", kg: 55.2, waist: 70 },
      ],
    }));
    localStorage.setItem("hometrain:log:v1", JSON.stringify(log));
  }, [PROFILE, buildPlan(PROFILE), sampleLog(), theme, SCALE]);

  await page.goto(`file://${process.cwd()}/dist-demo/ietore.html`);
  await page.waitForTimeout(900);

  for (const t of TABS) {
    await page.locator("nav").getByRole("button", { name: new RegExp(t) }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${theme}-${t}.png` });
    await checkWidth(page, `${theme} / ${t}`);
    /* 下のほうにあるもの（設定・バッジ・写真）も見たい */
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${theme}-${t}-下.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await ctx.close();
}

await browser.close();
console.log(`${OUT}/ に ${TABS.length * 4} 枚（文字の大きさ: ${SCALE}）`);
if (over.length) {
  console.error("\n横にはみ出している画面があります:");
  for (const o of over) console.error("  -", o);
  process.exitCode = 1;
} else {
  console.log("横のはみ出し: なし");
}
