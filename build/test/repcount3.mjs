import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const seedFile = process.argv[2] || 'seed2.js';
const srv = startServer(8899);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
const ctx = await b.newContext({viewport:{width:390,height:844}});
const page = await ctx.newPage();
const errs=[]; page.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
await page.addInitScript(()=>{
  window.__spoken=[];
  const ss=window.speechSynthesis;
  if(ss){ const s0=ss.speak.bind(ss); ss.speak=u=>{window.__spoken.push('SPEAK:'+String(u&&u.text)); try{return s0(u)}catch(e){}};
          const c0=ss.cancel.bind(ss); ss.cancel=()=>{window.__spoken.push('cancel'); return c0()}; }
});
await page.goto('http://localhost:8899/', {waitUntil:'load'});
await page.waitForTimeout(300);
await page.evaluate(fs.readFileSync(path.isAbsolute(seedFile)?seedFile:path.join(process.cwd(),seedFile),'utf8'));
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
const close = page.locator('button', {hasText:/^とじる$/});
if (await close.count()) { await close.first().click(); await page.waitForTimeout(300); }
await page.getByText('トレーニング',{exact:true}).last().click();
await page.waitForTimeout(500);
await page.locator('button', {hasText:/回 × /}).first().click();
await page.waitForTimeout(600);
await page.evaluate(()=>window.__spoken.length=0);
await page.locator('button', {hasText:/^はじめる$/}).first().click();
for (let i=0;i<5;i++){
  await page.waitForTimeout(3000);
  const st = await page.evaluate(()=>{
    const m=document.body.innerText.match(/数えて(います|もらう)[\s\S]{0,25}/);
    return {frag:m?m[0].replace(/\n/g,'|'):'?', spoken:window.__spoken.slice()};
  });
  console.log(`t=${(i+1)*3}s`, st.frag, '||', JSON.stringify(st.spoken));
}
console.log('ERRS:', errs.join('\n'));
await b.close(); srv.close();
