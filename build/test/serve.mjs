import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Serves build/test/site/, which `python3 build/patch.py` fills with the real
// deployable page plus the manifest, service worker and icons.
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
const TYPES = { '.html':'text/html; charset=utf-8', '.json':'application/json', '.png':'image/png', '.js':'application/javascript' };

export function startServer(port=8899){
  const srv = http.createServer((req,res)=>{
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(fp);
    res.writeHead(200, {'Content-Type': TYPES[ext] || 'application/octet-stream'});
    fs.createReadStream(fp).pipe(res);
  }).listen(port);
  return srv;
}
