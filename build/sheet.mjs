import { FIGS } from './figs.mjs';
import fs from 'fs';

const NAMES = {
  squat:'スクワット', wallsit:'ウォールシット', lunge:'ランジ', calf:'カーフレイズ',
  hinge:'ヒップヒンジ', march:'もも上げ', walk:'歩く', stepup:'踏み台昇降',
  hip:'ヒップリフト', legraise:'レッグレイズ', deadbug:'デッドバグ', twist:'ツイストクランチ',
  plank:'プランク', pushup:'腕立て', climber:'クライマー', backext:'バックエクステンション',
  birddog:'バードドッグ', sideplank:'サイドプランク', sideleg:'サイドレッグ', burpee:'バーピー',
  wallpush:'壁プッシュアップ', wallangel:'壁で腕上げ', scap:'肩甲骨寄せ', row:'タオルローイング',
  chestopen:'胸ひらき', armcircle:'肩と腕まわし', stretch:'全身ストレッチ', sidebend:'体側のばし',
  hipcircle:'股関節まわし', catcow:'背中まるめ', hamstretch:'もも裏のばし', hipstretch:'股関節ストレッチ',
};

const INK='#4A3242', PINK='#BE2D60', BG='#FDF1F6';
function draw(parts){
  return parts.map(p=>{
    if(p[0]==='h') return `<circle cx="${p[1]}" cy="${p[2]}" r="4.2" fill="${INK}"/>`;
    if(p[0]==='l') return `<path d="${p[1]}" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    if(p[0]==='p') return `<path d="${p[1]}" stroke="${PINK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    return `<g>${draw(p[4])}</g>`;
  }).join('');
}
const cells = Object.entries(FIGS).map(([k,parts])=>`
  <figure>
    <div class="big"><svg viewBox="0 0 44 44" width="120" height="120">${draw(parts)}</svg></div>
    <div class="small"><svg viewBox="0 0 44 44" width="42" height="42">${draw(parts)}</svg></div>
    <figcaption>${NAMES[k]||k}<br><code>${k}</code></figcaption>
  </figure>`).join('');

fs.writeFileSync('sheet.html', `<!doctype html><meta charset="utf8">
<style>
body{background:#fff;font:12px system-ui,"Noto Sans JP";margin:0;padding:14px}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
figure{margin:0;text-align:center;border:1px solid #eee;border-radius:10px;padding:6px}
.big{background:${BG};border-radius:12px;display:flex;justify-content:center;align-items:center;padding:4px}
.small{background:${BG};border-radius:8px;display:inline-flex;padding:3px;margin-top:5px}
figcaption{margin-top:4px;font-size:11px;line-height:1.3;color:#444}
code{color:#999;font-size:10px}
</style><div class="grid">${cells}</div>`);
console.log('cells:', Object.keys(FIGS).length);
