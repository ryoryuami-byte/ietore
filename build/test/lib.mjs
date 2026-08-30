import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
export async function boot(){
  const srv = http.createServer((req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(fs.readFileSync('site/index.html'));
  }).listen(8899);
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:390,height:844}});
  const page = await ctx.newPage();
  const errs=[];
  page.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  page.on('pageerror', e=>errs.push('PAGEERROR: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
  await page.goto('http://localhost:8899/', {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(600);
  return {b,ctx,page,errs,srv};
}
export const T = async (page)=> (await page.evaluate(()=>document.body.innerText));
export async function tap(page, text, opts={}){
  const el = page.getByText(text, {exact: opts.exact ?? false}).first();
  await el.click({timeout: opts.timeout ?? 4000});
  await page.waitForTimeout(opts.wait ?? 350);
}
