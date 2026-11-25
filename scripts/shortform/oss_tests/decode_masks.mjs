import { decodeMaskToRaster } from '@meta-sam/parser';
import fs from 'fs';
// json → <clip>.masks.bin : per record header line in index json, raster bytes concatenated
const [,, inp, out] = process.argv;
const r = JSON.parse(fs.readFileSync(inp));
const idx = []; const bufs = []; let off = 0;
for (const [f, objs] of Object.entries(r.frames)) for (const o of objs) {
  const [h, w, ...rest] = o.mask.split(','); const payload = rest.join(',');
  const enc = payload.startsWith('!') ? 'one_bit' : 'lossless';
  const ras = decodeMaskToRaster({ encoding: enc, payload, width: +w, height: +h });
  bufs.push(Buffer.from(ras)); idx.push({ f: +f, id: o.id, box: o.box, w: +w, h: +h, off }); off += ras.length;
}
fs.writeFileSync(out + '.bin', Buffer.concat(bufs)); fs.writeFileSync(out + '.idx.json', JSON.stringify(idx));
console.log(inp, idx.length, 'masks', off, 'bytes');
