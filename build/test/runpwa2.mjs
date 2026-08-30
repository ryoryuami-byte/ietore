import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const srv = startServer(8899);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
const ctx = await b.newContext({viewport:{width:390,height:844}, colorScheme:'dark'});
const page = await ctx.newPage();
const errs=[]; page.on('pageerror', e=>errs.push(e.message));
await page.goto('http://localhost:8899/', {waitUntil:'load'});
await page.waitForTimeout(800);
console.log('dark data-theme:', await page.evaluate(()=>document.documentElement.dataset.theme));
console.log('dark theme-color meta:', await page.evaluate(()=>document.querySelector('meta[name=theme-color]')?.content));
await page.screenshot({path:'./shots/pwa-dark.png', fullPage:false});

// offline test: reload once cached, then go offline and reload again
await page.waitForTimeout(600);
await ctx.setOffline(true);
await page.reload({waitUntil:'load'}).catch(e=>console.log('reload err', e.message));
await page.waitForTimeout(500);
console.log('offline body head:', (await page.evaluate(()=>document.body.innerText)).slice(0,60));
await ctx.setOffline(false);
console.log('ERRS', errs.join('\n'));
await b.close(); srv.close();
