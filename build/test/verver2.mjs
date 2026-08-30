import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srv = startServer(8899);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
const ctx = await b.newContext({viewport:{width:390,height:900}});
const page = await ctx.newPage();
await page.goto('http://localhost:8899/', {waitUntil:'load'});
await page.waitForTimeout(300);
await page.evaluate(fs.readFileSync(path.join(HERE,'seed3.js'),'utf8'));
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
const close=page.locator('button',{hasText:/^とじる$/});
if(await close.count()){await close.first().click();await page.waitForTimeout(300);}
await page.getByText('マイページ',{exact:true}).last().click();
await page.waitForTimeout(500);
await page.evaluate(()=>{
  const all=[...document.querySelectorAll('p')];
  const el=all.find(e=>e.textContent.includes('イエトレ v'));
  el && el.scrollIntoView({block:'center'});
});
console.log('found version el:', await page.evaluate(()=>!!document.body.innerText.match(/イエトレ v[\d.]+/)));
console.log('diag:', await page.evaluate(()=>{
  const el=[...document.querySelectorAll('p')].find(e=>e.textContent.includes('イエトレ v'));
  const r = el ? el.getBoundingClientRect() : null;
  return {bodyOverflow: getComputedStyle(document.body).overflow, bodyPos: getComputedStyle(document.body).position, scrollY: window.scrollY, docHeight: document.documentElement.scrollHeight, winH: window.innerHeight, rect: r && {top:r.top, bottom:r.bottom}};
}));
await page.waitForTimeout(200);
await page.screenshot({path:'./shots/mine-version-bottom.png'});
await b.close(); srv.close();
