# -*- coding: utf-8 -*-
"""
Build イエトレ from the original published bundle plus a list of source patches.

The app was originally produced as a Claude artifact: a single pre-minified
JS bundle with no readable source. Every fix since then is expressed here as an
exact string replacement against that pristine bundle, so the whole app is
reproducible from `build/source/artifact-original.html` and this file alone.

Run from anywhere:   python3 build/patch.py
Writes:  ietore.html      (artifact body, published to claude.ai)
         pwa/index.html   (standalone page, published to GitHub Pages)

Every patch must match EXACTLY ONCE; the build fails loudly otherwise, so a
patch can never silently stop applying.
"""
import sys, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, 'build')

SRC = os.path.join(HERE, 'source', 'artifact-original.html')
html = io.open(SRC, encoding='utf-8').read()

# --- split off the frame runtime + platform head, keep the artifact body ---
i = html.find('<body>')
body = html[i+len('<body>'):]
j = body.rfind('</body>')
if j >= 0:
    body = body[:j]
body = body.replace('</html>', '').strip()

PATCHES = [

# 1. Session-length estimate: allow counting every phase, not only "main".
("function ir(e,t,n,r,i=30){let a=0;for(let o of e??[]){let e=M[o];if(!e||(e.phase??`main`)!==`main`)continue;",
 "function ir(e,t,n,r,i=30,y=!1){let a=0;for(let o of e??[]){let e=M[o];if(!e||!y&&(e.phase??`main`)!==`main`)continue;"),

# 1b. Home card shows the whole session (warm-up + main + cardio + cool-down).
("let I=p.filter(e=>ne(e)===`main`),re=ar(p,m,_,f,v),",
 "let I=p.filter(e=>ne(e)===`main`),re=ar(p,m,_,f,v,!0),"),

# 2. Phase labels: drop the hard-coded ①②③④ (main is missing on rest days).
("te={warmup:{label:`① ウォームアップ`",
 "te={warmup:{label:`ウォームアップ`"),
("main:{label:`② メイン`", "main:{label:`メイン`"),
("cardio:{label:`③ 有酸素`", "cardio:{label:`有酸素`"),
("cooldown:{label:`④ クールダウン`", "cooldown:{label:`クールダウン`"),

# 2b. Cross-references that used those numbers.
("children:[`トレーニング（②）のめやす 約`,ar(Oe,Ce,W,Te,be),`分 ／ ①・③20分・④はこの時間の外です`]",
 "children:[`メインのめやす 約`,ar(Oe,Ce,W,Te,be),`分 ／ ウォームアップ・有酸素20分・クールダウンはこの時間の外です`]"),
("hint:`② メインの種目数が決まります。",
 "hint:`「メイン」の種目数が決まります。"),

# 3. "Erase everything" left the app on a tab id that does not exist.
("onEraseAll:async()=>{await ei(),a({}),s([]),r(qr),l(`today`)}",
 "onEraseAll:async()=>{await ei(),a({}),s([]),r(qr),l(`home`)}"),

# 4. Streak / freeze must not look at days before the user started.
("mr=e=>e.slice(0,7);function hr({log:e,plan:t,today:n,dateKey:r,trained:i,freezeOn:a=!0}){",
 "mr=e=>e.slice(0,7),__ietoreStart=(e,t)=>{let n=Object.keys(e??{}).sort(),r=n.length?n[0]:null,i=null;try{let a=t?.consent?.at?new Date(t.consent.at):null;a&&isFinite(a.getTime())&&(i=mt(a))}catch{}return r&&i?r<i?r:i:r??i};function hr({log:e,plan:t,today:n,dateKey:r,trained:i,freezeOn:a=!0,since:p=null}){"),
("for(let t=0;t<400;t++){let n=r(d);if(i(n))l++;",
 "for(let t=0;t<400;t++){let n=r(d);if(p&&n<p)break;if(i(n))l++;"),
("o=hr({log:i,plan:V,today:z,dateKey:mt,trained:e,freezeOn:n.freezeOn!==!1})",
 "o=hr({log:i,plan:V,today:z,dateKey:mt,trained:e,freezeOn:n.freezeOn!==!1,since:__ietoreStart(i,n)})"),

# 5. Badges are collected, not current status: never let an earned tier drop.
("Vn=e=>{let t=Number(e);return isFinite(t)&&t>0?Math.floor(t):0};",
 "Vn=e=>{let t=Number(e);return isFinite(t)&&t>0?Math.floor(t):0},__ietoreBadgeMax=(e,t)=>{let n={};for(let r of Bn)n[r.id]=Math.min(r.tiers.length,Math.max(Vn(e?.[r.id]),Vn(t?.[r.id])));return n};"),
("pe=(0,d.useMemo)(()=>Un(fe),[fe])",
 "pe=(0,d.useMemo)(()=>__ietoreBadgeMax(Un(fe),n.badgeSeen),[fe,n.badgeSeen])"),
("he=()=>r(e=>({...e,badgeSeen:pe}))",
 "he=()=>r(e=>({...e,badgeSeen:__ietoreBadgeMax(pe,e.badgeSeen)}))"),
("ie=(0,d.useMemo)(()=>Gn(Un(re),re),[re])",
 "ie=(0,d.useMemo)(()=>Gn(__ietoreBadgeMax(Un(re),e.badgeSeen),re),[re,e.badgeSeen])"),

# 6. Backup export: use the viewer's save dialog when the page runs as an
#    Artifact (a plain <a download> link is inert there), else keep the blob link.
("async function Bi(e){let t=JSON.stringify(e),n=zi();if(!st())try{",
 "async function Bi(e){let t=JSON.stringify(e),n=zi();if(!st()){let e=null;try{e=await window.claude?.use?.(`downloads`)??null}catch{e=null}if(e)try{return await e.save({filename:n,data:t}),{ok:!0,reason:`downloaded`}}catch(t){return{ok:!1,reason:t?.code===`declined`?`cancelled-or-failed`:`download-failed`}}}if(!st())try{"),

# 7. Rep counting killed itself when the countdown was turned off.
#    Ee() runs its callback synchronously in that case, so the callback stored
#    the rep-counter's cleanup in the ref — and the enclosing re()/j() then
#    immediately invoked that very cleanup. Cancel the previous run FIRST, and
#    only store the countdown's own cleanup if the callback has not run yet.
("R=()=>{re(Ee(s,()=>{let e=Oe(s),t=De(s,v.amount,()=>{e(),F(0),I.current=null,fe(!0),f(1)},{onCount:F});I.current=()=>{e(),t(),F(0)}})),F(1)}",
 "R=()=>{I.current?.(),I.current=null;let __rc0=!1,__rc1=Ee(s,()=>{__rc0=!0;let e=Oe(s),t=De(s,v.amount,()=>{e(),F(0),I.current=null,fe(!0),f(1)},{onCount:F});I.current=()=>{e(),t(),F(0)}});__rc0||(I.current=__rc1),F(1)}"),
("oe=()=>{j(Ee(a,()=>{let e=Oe(a),t=De(a,F.amount,()=>{e(),D(0),O.current=null,fe(!0),s(N,1)},{onCount:D});O.current=()=>{e(),t(),D(0)}})),D(1)}",
 "oe=()=>{O.current?.(),O.current=null;let __rc0=!1,__rc1=Ee(a,()=>{__rc0=!0;let e=Oe(a),t=De(a,F.amount,()=>{e(),D(0),O.current=null,fe(!0),s(N,1)},{onCount:D});O.current=()=>{e(),t(),D(0)}});__rc0||(O.current=__rc1),D(1)}"),

# 8. Speech: an unconditional cancel() immediately followed by speak() is the
#    classic way to lose an utterance on iOS/Safari. Only cancel when something
#    is actually speaking, give the engine a beat before the new utterance, and
#    resume it if it was left paused.
("function Ce(e,{interrupt:t=!1}={}){if(!(!pe||!e||!ve()))try{let n=_e();t&&n.cancel();let r=new window.SpeechSynthesisUtterance(String(e));r.lang=`ja-JP`,r.rate=me,r.pitch=1,he||(he=xe()),he&&(r.voice=he),n.speak(r)}catch{}}",
 "function Ce(e,{interrupt:t=!1}={}){if(!(!pe||!e||!ve()))try{let n=_e(),i=()=>{try{let r=new window.SpeechSynthesisUtterance(String(e));r.lang=`ja-JP`,r.rate=me,r.pitch=1,he||(he=xe()),he&&(r.voice=he),n.paused&&n.resume(),n.speak(r)}catch{}};t&&(n.speaking||n.pending)?(n.cancel(),setTimeout(i,80)):i()}catch{}}"),

# 10. Show the app version at the bottom of マイページ, reusing the same
#     constant already used for crash reports so the two never drift apart.
("async function qi(e,t){let n={at:new Date().toISOString(),v:`18.7.0`,",
 "async function qi(e,t){let n={at:new Date().toISOString(),v:__IETORE_VERSION__,"),
("children:`月に1回、同じ場所・同じ服装で写真を撮っておくと変化がわかりやすくなります。`}),A&&(0,k.jsx)(wi,{",
 "children:`月に1回、同じ場所・同じ服装で写真を撮っておくと変化がわかりやすくなります。`}),(0,k.jsx)(`p`,{style:{color:h.muted},className:`text-xs text-center mt-8 mb-2`,children:`イエトレ v${__IETORE_VERSION__}`}),A&&(0,k.jsx)(wi,{"),
]

VERSION = "18.8.0"
body_var_decl = f"var __IETORE_VERSION__=`{VERSION}`;"

for old, new in PATCHES:
    n = body.count(old)
    if n != 1:
        print('FAIL (%d matches): %s' % (n, old[:70]))
        sys.exit(1)
    body = body.replace(old, new)

SCRIPT_OPEN = '<script type="module">'
assert body.count(SCRIPT_OPEN) == 1
body = body.replace(SCRIPT_OPEN, SCRIPT_OPEN + body_var_decl, 1)

# 9. Redraw every exercise pictogram. The originals were a head plus one or two
#    lines, so most of them read as the same vague stick figure. The replacement
#    draws a recognisable posture for each move: a ground line so you can tell
#    standing from lying, the prop that identifies it (wall, step, towel), and
#    the working limb on the existing animation classes.
NEW_A = io.open(os.path.join(HERE, 'newA.js'), encoding='utf-8').read()
A_START = 'function A({kind:e,size:t=46}){'
A_END = 'children:o[e]??o.squat})})}'
if body.count(A_START) != 1 or body.count(A_END) != 1:
    print('FAIL: pictogram component boundaries not unique')
    sys.exit(1)
_i = body.index(A_START)
_j = body.index(A_END, _i) + len(A_END)
body = body[:_i] + NEW_A + body[_j:]

io.open(os.path.join(ROOT, 'ietore.html'), 'w', encoding='utf-8').write(body)

# Standalone page for GitHub Pages / home-screen install. The artifact host
# supplies its own <head>; here we supply ours, plus the manifest, the icons and
# the service worker registration. Written to site/ (what the browser tests run
# against) and to out/ (what gets copied into the repo's pwa/ folder).
pwa_body = body
assert pwa_body.startswith('<title>イエトレ</title>\n')
pwa_body = pwa_body[len('<title>イエトレ</title>\n'):]

PWA_HEAD = '''<meta charset="utf-8">
<title>イエトレ</title>
<meta name="description" content="おうちで続ける、やさしい運動習慣。ホーム画面に追加してアプリのように使えます。">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FDF1F6">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="イエトレ">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<style>:root{color-scheme:light dark}html{background:#FDF1F6}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic UI","Noto Sans JP",system-ui,sans-serif;background:#FDF1F6;color:#141413}@media(prefers-color-scheme:dark){html,body{background:#17111A;color:#F4E7EF}}img{max-width:100%}</style>
'''

SW_REG = '''<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
</script>
'''

page = ('<!doctype html>\n<html lang="ja">\n<head>\n' + PWA_HEAD + '</head>\n<body>\n'
        + pwa_body.rstrip() + '\n' + SW_REG + '</body>\n</html>\n')
io.open(os.path.join(ROOT, 'pwa', 'index.html'), 'w', encoding='utf-8').write(page)

# The browser tests serve build/test/site/, so mirror the real page there.
site = os.path.join(HERE, 'test', 'site')
os.makedirs(site, exist_ok=True)
io.open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(page)
for name in ('manifest.json', 'sw.js', 'apple-touch-icon.png', 'favicon-16.png',
             'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'):
    src = os.path.join(ROOT, 'pwa', name)
    if os.path.exists(src):
        io.open(os.path.join(site, name), 'wb').write(io.open(src, 'rb').read())

print('OK  ietore.html:', len(body), 'bytes | pwa/index.html:', len(page), 'bytes')
