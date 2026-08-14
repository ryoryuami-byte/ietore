import { C } from "../tokens.js";

/* ================= 種目イラスト ================= */
function Fig({ kind, size = 46 }) {
  /* SVG の presentation attribute は var() を解決しない。
     色は svg 側の color に1回だけ置き、線と頭はそこから currentColor で継ぐ。
     道具（壁・台）の色だけは style で上書きする */
  const S = { stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const head = (x, y) => <circle cx={x} cy={y} r="4.2" fill="currentColor" />;
  const PROP = { style: { stroke: C.pinkDeep }, strokeWidth: "3.2", fill: "none" };
  const o = (x, y) => ({ transformOrigin: `${x}px ${y}px` });
  const body = {
    squat: (<g className="an-bob">{head(22, 10)}<path d="M22 14.5 V24" {...S} /><path d="M22 17 H31" {...S} /><path d="M22 24 L16 30 L16 36" {...S} /><path d="M22 24 L28 30 L28 36" {...S} /></g>),
    wallsit: (<g>{head(14, 14)}<path d="M14 18 V27" {...S} /><path d="M14 27 H26" {...S} /><path d="M26 27 V36" {...S} /><path d="M9 10 V34" {...PROP} strokeLinecap="round" /></g>),
    hip: (<g>{head(9, 31)}<path d="M13 31 H23" {...S} /><g className="an-lift"><path d="M23 31 L30 25 L34 33" {...S} /></g></g>),
    lunge: (<g>{head(20, 10)}<path d="M20 14.5 V24" {...S} /><path d="M20 24 L14 30 L14 36" {...S} /><g className="an-swing" style={o(20, 24)}><path d="M20 24 L28 29 L28 36" {...S} /></g></g>),
    calf: (<g className="an-rise">{head(22, 10)}<path d="M22 14.5 V25" {...S} /><path d="M22 18 H30" {...S} /><path d="M22 25 L18 35" {...S} /><path d="M22 25 L26 35" {...S} /></g>),
    march: (<g>{head(22, 9)}<path d="M22 13.5 V23" {...S} /><g className="an-swing" style={o(22, 23)}><path d="M22 23 L18 30 L18 36" {...S} /></g><g className="an-swing-alt" style={o(22, 23)}><path d="M22 23 L27 30 L27 36" {...S} /></g></g>),
    walk: (<g>{head(22, 9)}<path d="M22 13.5 V23" {...S} /><g className="an-swing-slow" style={o(22, 23)}><path d="M22 23 L18 36" {...S} /></g><g className="an-swing-slow-alt" style={o(22, 23)}><path d="M22 23 L27 36" {...S} /></g></g>),
    plank: (<g className="an-breathe">{head(9, 20)}<path d="M13 21 L34 27" {...S} /><path d="M14 21 V32" {...S} /><path d="M34 27 L36 33" {...S} /></g>),
    climber: (<g>{head(9, 19)}<path d="M13 20 L33 26" {...S} /><path d="M14 20 V32" {...S} /><g className="an-swing-fast" style={o(33, 26)}><path d="M33 26 L36 33" {...S} /></g><g className="an-swing-fast-alt" style={o(33, 26)}><path d="M33 26 L26 30" {...S} /></g></g>),
    sideplank: (<g className="an-breathe">{head(11, 14)}<path d="M13 17 L33 32" {...S} /><path d="M13 17 V32" {...S} /></g>),
    legraise: (<g>{head(8, 30)}<path d="M12 31 H24" {...S} /><g className="an-legup" style={o(24, 31)}><path d="M24 31 H35" {...S} /></g></g>),
    sideleg: (<g>{head(9, 26)}<path d="M13 27 H27" {...S} /><g className="an-legup" style={o(27, 27)}><path d="M27 27 L36 31" {...S} /></g><path d="M27 27 L35 33" {...S} /></g>),
    twist: (<g><path d="M12 33 H30" {...S} /><g className="an-twist" style={o(14, 33)}>{head(9, 24)}<path d="M12 27 L18 32" {...S} /></g><path d="M30 33 L26 26" {...S} /></g>),
    deadbug: (<g>{head(8, 30)}<path d="M12 31 H26" {...S} /><g className="an-swing" style={o(26, 31)}><path d="M26 31 L32 23" {...S} /></g><g className="an-swing-alt" style={o(26, 31)}><path d="M26 31 L34 29" {...S} /></g><path d="M14 31 L18 22" {...S} /></g>),
    burpee: (<g className="an-squash">{head(22, 12)}<path d="M22 16 V25" {...S} /><path d="M22 25 L17 33" {...S} /><path d="M22 25 L27 33" {...S} /><path d="M22 19 H30" {...S} /></g>),
    wallpush: (<g><path d="M36 8 V38" {...PROP} strokeLinecap="round" /><g className="an-push">{head(16, 13)}<path d="M18 17 L22 33" {...S} /><path d="M18 17 L32 15" {...S} /><path d="M22 33 L18 36" {...S} /></g></g>),
    pushup: (<g className="an-pushdown">{head(10, 19)}<path d="M14 20 L32 27" {...S} /><path d="M15 20 V31" {...S} /><path d="M32 27 L34 33" {...S} /></g>),
    backext: (<g><path d="M20 32 H35" {...S} /><g className="an-torso" style={o(20, 32)}>{head(11, 27)}<path d="M15 29 L20 32" {...S} /></g></g>),
    scap: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 18)}><path d="M22 18 L13 21" {...S} /></g><g className="an-pull-alt" style={o(22, 18)}><path d="M22 18 L31 21" {...S} /></g></g>),
    stretch: (<g>{head(22, 11)}<path d="M22 15 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-reach" style={o(22, 18)}><path d="M22 18 L28 9" {...S} /></g></g>),
    catcow: (<g className="an-arch">{head(9, 21)}<path d="M13 22 Q22 13 33 23" {...S} /><path d="M14 23 V33" {...S} /><path d="M32 24 V33" {...S} /></g>),
    armcircle: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 18)}><path d="M22 18 L31 12" {...S} /></g><g className="an-pull-alt" style={o(22, 18)}><path d="M22 18 L13 12" {...S} /></g></g>),
    hipcircle: (<g>{head(22, 9)}<path d="M22 13.5 V22" {...S} /><g className="an-twist" style={o(22, 22)}><path d="M17 24 H27" {...S} /><path d="M22 22 L17 29 L17 36" {...S} /><path d="M22 22 L27 29 L27 36" {...S} /></g></g>),
    sidebend: (<g className="an-twist" style={o(21, 32)}>{head(20, 11)}<path d="M20 15 V28" {...S} /><path d="M20 16 L27 8" {...S} /><path d="M20 28 L17 36" {...S} /><path d="M20 28 L25 36" {...S} /></g>),
    hinge: (<g><path d="M24 24 L22 36" {...S} /><path d="M24 24 L28 36" {...S} /><g className="an-torso" style={o(24, 24)}>{head(12, 15)}<path d="M15 17 L24 24" {...S} /><path d="M16 18 L20 23" {...S} /></g></g>),
    row: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 19)}><path d="M22 19 H32" {...S} /></g><g className="an-pull-alt" style={o(22, 19)}><path d="M22 19 H12" {...S} /></g></g>),
    wallangel: (<g><path d="M8 8 V38" {...PROP} strokeLinecap="round" />{head(14, 12)}<path d="M14 16 V27" {...S} /><path d="M14 27 V36" {...S} /><path d="M14 27 L19 36" {...S} /><g className="an-reach" style={o(14, 19)}><path d="M14 19 L23 12" {...S} /></g></g>),
    birddog: (<g>{head(9, 21)}<path d="M13 22 H31" {...S} /><path d="M14 22 V32" {...S} /><g className="an-swing" style={o(31, 22)}><path d="M31 22 L37 30" {...S} /></g><g className="an-swing-alt" style={o(13, 22)}><path d="M13 22 L6 15" {...S} /></g></g>),
    stepup: (<g><path d="M28 30 H38 V36 H28 Z" {...PROP} strokeLinejoin="round" /><g className="an-rise">{head(17, 10)}<path d="M17 14.5 V24" {...S} /><path d="M17 24 L14 36" {...S} /><path d="M17 24 L28 29" {...S} /></g></g>),
    hamstretch: (<g><path d="M14 32 H34" {...S} /><g className="an-reach" style={o(14, 30)}>{head(14, 18)}<path d="M15 22 L22 30" {...S} /></g></g>),
    hipstretch: (<g>{head(22, 14)}<path d="M22 18 V27" {...S} /><g className="an-breathe"><path d="M22 27 L14 32 L22 35" {...S} /><path d="M22 27 L30 32 L22 35" {...S} /></g></g>),
    chestopen: (<g>{head(22, 10)}<path d="M22 14.5 V26" {...S} /><path d="M22 26 L18 36" {...S} /><path d="M22 26 L26 36" {...S} /><g className="an-pull" style={o(22, 19)}><path d="M22 19 L13 24" {...S} /></g><g className="an-pull-alt" style={o(22, 19)}><path d="M22 19 L31 24" {...S} /></g></g>),
  };
  return (
    <span style={{ background: C.bg, width: size, height: size, borderRadius: size / 3 }}
      className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">
      <svg width={size - 4} height={size - 4} viewBox="0 0 44 44" style={{ color: C.ink }}>{body[kind] ?? body.squat}</svg>
    </span>
  );
}

const FigStyles = () => (
  <style>{`
    @keyframes anBob {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(5px) scaleY(.9)}}
    @keyframes anLift {0%,100%{transform:translateY(3px)}50%{transform:translateY(-3px)}}
    @keyframes anSwing {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-26deg)}}
    @keyframes anSwingAlt {0%,100%{transform:rotate(-26deg)}50%{transform:rotate(0deg)}}
    @keyframes anRise {0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes anBreathe {0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
    @keyframes anLegup {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-50deg)}}
    @keyframes anTwist {0%,100%{transform:rotate(-8deg)}50%{transform:rotate(14deg)}}
    @keyframes anSquash {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(7px) scaleY(.78)}}
    @keyframes anPush {0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
    @keyframes anPushdown {0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
    @keyframes anTorso {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-16deg)}}
    @keyframes anPull {0%,100%{transform:rotate(0deg)}50%{transform:rotate(18deg)}}
    @keyframes anPullAlt {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-18deg)}}
    @keyframes anReach {0%,100%{transform:rotate(0deg)}50%{transform:rotate(-24deg)}}
    @keyframes anArch {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.06)}}
    @keyframes pop {0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
    @keyframes cheer {0%{transform:scale(.5) rotate(-8deg);opacity:0}55%{transform:scale(1.12) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
    @keyframes rise {0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-170px) rotate(220deg);opacity:0}}
    @keyframes wiggle {0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
    .an-bob{animation:anBob 1.8s ease-in-out infinite}
    .an-lift{animation:anLift 1.8s ease-in-out infinite}
    .an-swing{animation:anSwing 1.4s ease-in-out infinite}
    .an-swing-alt{animation:anSwingAlt 1.4s ease-in-out infinite}
    .an-swing-slow{animation:anSwing 2.2s ease-in-out infinite}
    .an-swing-slow-alt{animation:anSwingAlt 2.2s ease-in-out infinite}
    .an-swing-fast{animation:anSwing .8s ease-in-out infinite}
    .an-swing-fast-alt{animation:anSwingAlt .8s ease-in-out infinite}
    .an-rise{animation:anRise 1.6s ease-in-out infinite}
    .an-breathe{animation:anBreathe 2.4s ease-in-out infinite}
    .an-legup{animation:anLegup 2s ease-in-out infinite}
    .an-twist{animation:anTwist 1.8s ease-in-out infinite}
    .an-squash{animation:anSquash 2s ease-in-out infinite}
    .an-push{animation:anPush 1.8s ease-in-out infinite}
    .an-pushdown{animation:anPushdown 1.8s ease-in-out infinite}
    .an-torso{animation:anTorso 2s ease-in-out infinite}
    .an-pull{animation:anPull 1.8s ease-in-out infinite}
    .an-pull-alt{animation:anPullAlt 1.8s ease-in-out infinite}
    .an-reach{animation:anReach 2.2s ease-in-out infinite}
    .an-arch{animation:anArch 2.8s ease-in-out infinite}
    .pop{animation:pop .28s ease-out}
    .cheer{animation:cheer .5s cubic-bezier(.2,1.4,.4,1) both}
    .wiggle{animation:wiggle 1.6s ease-in-out infinite}
    .confetti{position:absolute;width:9px;height:14px;border-radius:3px;animation:rise 1.6s ease-out forwards}
    @keyframes sparkle{0%,100%{opacity:0;transform:scale(.4) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(18deg)}}
    .sparkle{position:absolute;font-size:14px;line-height:1;animation:sparkle 1.6s ease-in-out infinite;pointer-events:none}
    /* キーボード操作時のフォーカスを必ず見えるようにする（色を自前で指定） */
    .fx:focus{outline:none}
    .fx:focus-visible{outline:3px solid #6E4FB8;outline-offset:2px}
    @media (prefers-reduced-motion: reduce){[class*="an-"],.pop,.cheer,.wiggle,.confetti,.sparkle{animation:none!important}}
  `}</style>
);

export { Fig, FigStyles };
