// 카드 정보 숏폼 렌더러 v1 — 사용법:
//   node render.js <data.json> <outdir> [preview|each|all]
// preview: 각 장면 t=2.0초 정지 화면 PNG / each: 카드 유형별 단독 영상 / all: 인트로+카드7+아웃트로 통합본
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const FPS = 30, DUR = { intro: 3.0, card: 3.6, outro: 3.0 };

function segments(data) {
  const n = data.cards.length;
  const segs = [{ kind: 'intro', data: data.intro, dur: DUR.intro, name: '00_intro' }];
  data.cards.forEach((c, i) => segs.push({ kind: 'card', data: c, i, n, dur: DUR.card, name: `${String(i + 1).padStart(2, '0')}_${c.type}` }));
  segs.push({ kind: 'outro', data: data.outro, labels: data.cards.map(c => c.label), dur: DUR.outro, name: '99_outro' });
  return segs;
}

function ffmpegPipe(out) {
  return spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
}

async function renderSegs(page, segs, out, photos) {
  const ff = ffmpegPipe(out);
  for (const s of segs) {
    await page.evaluate(seg => window.setup(seg), { ...s, photos });
    const frames = Math.round(s.dur * FPS);
    for (let f = 0; f < frames; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
}

(async () => {
  const [dataPath, outDir, mode = 'preview'] = process.argv.slice(2);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const root = path.dirname(path.resolve(__filename));
  const photos = 'file://' + path.resolve(root, data.meta.photos_dir);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(root, 'template/card.html'));
  await page.evaluate(() => document.fonts.ready);
  const segs = segments(data);
  if (mode === 'preview') {
    for (const s of segs) {
      await page.evaluate(seg => window.setup(seg), { ...s, photos });
      await page.evaluate(t => window.render(t), 2.2);
      await page.screenshot({ path: path.join(outDir, s.name + '.png') });
    }
  } else if (mode === 'each') {
    for (const s of segs.filter(s => s.kind === 'card')) {
      await renderSegs(page, [s], path.join(outDir, `card_${s.name}_silent.mp4`), photos);
      console.log('ok', s.name);
    }
  } else {
    await renderSegs(page, segs, path.join(outDir, 'card_all_silent.mp4'), photos);
    console.log('ok all');
  }
  await b.close();
})();
