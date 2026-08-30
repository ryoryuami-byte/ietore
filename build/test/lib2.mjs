export async function consent(page){
  await page.getByText('どれも当てはまらない').first().click();
  await page.getByText('上の注意と、利用規約').first().click();
  await page.getByRole('button',{name:'はじめる',exact:true}).click();
  await page.waitForTimeout(400);
}
export const pick = async (page,t)=>{ await page.locator('button',{hasText:new RegExp('^'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first().click(); await page.waitForTimeout(120); };
export async function onboard(page, opts={}){
  const nums = page.locator('input');
  const vals = opts.vals ?? ['てすと','30','160','60','52'];
  for(let i=0;i<vals.length;i++){ if(vals[i]!==null) await nums.nth(i).fill(vals[i]); }
  for (const t of (opts.picks ?? ['体を引き締めたい','4日','ふつう（4種目）','たまに歩く程度','出せない（集合住宅）','夜'])) await pick(page,t);
  await page.waitForTimeout(200);
}
