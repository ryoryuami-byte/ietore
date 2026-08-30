import { FIGS } from './figs.mjs';
import fs from 'fs';

// Emit the pictogram table as compact JS literal data for the bundle.
const j = (v) => JSON.stringify(v);
function part(p){
  if (p[0]==='h') return `[0,${p[1]},${p[2]}]`;
  if (p[0]==='l') return `[1,${j(p[1])}]`;
  if (p[0]==='p') return `[2,${j(p[1])}]`;
  return `[3,${j(p[1])},${p[2]},${p[3]},[${p[4].map(part).join(',')}]]`;
}
const table = '{' + Object.entries(FIGS)
  .map(([k,parts]) => `${k}:[${parts.map(part).join(',')}]`).join(',') + '}';

const src =
`function A({kind:e,size:t=46}){` +
  `let n={stroke:\`currentColor\`,strokeWidth:3.2,strokeLinecap:\`round\`,strokeLinejoin:\`round\`,fill:\`none\`},` +
  `i={style:{stroke:h.pinkDeep},strokeWidth:2.6,strokeLinecap:\`round\`,strokeLinejoin:\`round\`,fill:\`none\`},` +
  `o=${table},` +
  `c=0,` +
  `u=e=>e.map(e=>e[0]===0?(0,k.jsx)(\`circle\`,{cx:e[1],cy:e[2],r:4.2,fill:\`currentColor\`},\`p\`+ ++c)` +
  `:e[0]===1?(0,k.jsx)(\`path\`,{d:e[1],...n},\`p\`+ ++c)` +
  `:e[0]===2?(0,k.jsx)(\`path\`,{d:e[1],...i},\`p\`+ ++c)` +
  `:(0,k.jsx)(\`g\`,{className:e[1],style:{transformOrigin:\`\${e[2]}px \${e[3]}px\`},children:u(e[4])},\`p\`+ ++c));` +
  `return(0,k.jsx)(\`span\`,{style:{background:h.bg,width:t,height:t,borderRadius:t/3},` +
  `className:\`shrink-0 inline-flex items-center justify-center\`,"aria-hidden":\`true\`,` +
  `children:(0,k.jsx)(\`svg\`,{width:t-4,height:t-4,viewBox:\`0 0 44 44\`,style:{color:h.ink},` +
  `children:u(o[e]??o.squat)})})}`;

fs.writeFileSync('newA.js', src);
console.log('figs:', Object.keys(FIGS).length, 'bytes:', src.length);
