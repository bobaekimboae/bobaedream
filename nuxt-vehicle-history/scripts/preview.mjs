import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve(import.meta.dirname, '../.output/public')
const base = '/bobaedream/vehicle-history/'
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ico':'image/x-icon' }
createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    if (path === '/' || path === base.slice(0,-1)) { res.writeHead(302,{Location:base}); res.end(); return }
    if (!path.startsWith(base)) { res.writeHead(404); res.end(); return }
    const file = resolve(root, path.slice(base.length) || 'index.html')
    if (!file.startsWith(root+sep)) { res.writeHead(403); res.end(); return }
    const info = await stat(file)
    const target = info.isDirectory() ? resolve(file,'index.html') : file
    res.setHeader('Content-Type',types[extname(target)] || 'application/octet-stream')
    res.end(await readFile(target))
  } catch { res.writeHead(404); res.end('Not found') }
}).listen(5216,'127.0.0.1',() => console.log('Preview http://127.0.0.1:5216'+base))
