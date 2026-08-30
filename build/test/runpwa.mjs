import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const srv = startServer(8899);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
const ctx = await b.newContext({viewport:{width:390,height:844}});
const page = await ctx.newPage();
const errs=[];
page.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
page.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
await page.goto('http://localhost:8899/', {waitUntil:'load'});
await page.waitForTimeout(1200);

const manifestLink = await page.evaluate(()=>document.querySelector('link[rel=manifest]')?.href);
console.log('manifest link:', manifestLink);

const swState = await page.evaluate(async ()=>{
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? (reg.active ? 'active' : (reg.installing? 'installing':'registered-no-active')) : 'not-registered';
});
console.log('service worker:', swState);

const themeColor = await page.evaluate(()=>document.querySelector('meta[name=theme-color]')?.content);
console.log('theme-color meta:', themeColor);

const dataTheme = await page.evaluate(()=>document.documentElement.dataset.theme);
console.log('data-theme:', dataTheme);

const title = await page.title();
console.log('document title:', title);

await page.screenshot({path:'./shots/pwa-consent.png', fullPage:true});
console.log('body text head:', (await page.evaluate(()=>document.body.innerText)).slice(0,120));
console.log('--- ERRS ---\n'+errs.join('\n'));
await b.close(); srv.close();
