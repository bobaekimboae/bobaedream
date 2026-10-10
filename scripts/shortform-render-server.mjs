#!/usr/bin/env node
// 보배 AI 숏폼 — FFmpeg 서버 렌더러 (서비스용 MP4: 1080×1920 · 30fps · H.264 · AAC)
// 실행: npm run shortform:render-server   (필요: ffmpeg 6+, Node 20+)
// 브라우저(public/shortform)는 장면별 bg/fg/ov 이미지를 보내고, 이 서버가 FFmpeg로 합성·인코딩한다.
// 선택: TTS_COMMAND=/path/to/tts  → `tts <텍스트파일> <출력.wav>` 형식으로 장면마다 호출(미설정이면 음성 없음).
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm, stat, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

const PORT = Number(process.env.PORT || 8787);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const TTS_COMMAND = process.env.TTS_COMMAND || "";
const CORS = process.env.SHORTFORM_CORS_ORIGIN || "*";
const MAX_BODY = Number(process.env.SHORTFORM_MAX_BODY_MB || 300) * 1024 * 1024;
const JOB_TTL_MS = 30 * 60 * 1000;
const OUT = { width: 1080, height: 1920, fps: 30 };
const jobs = new Map();

const run = (cmd, args, { input } = {}) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
  let out = "", err = "";
  p.stdout.on("data", (d) => { out += d; });
  p.stderr.on("data", (d) => { err = (err + d).slice(-4000); });
  p.on("error", reject);
  p.on("close", (code) => code === 0 ? resolve(out) : reject(new Error(`${cmd} 종료 코드 ${code}\n${err}`)));
  p.stdin.end(input || "");
});

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Access-Control-Allow-Origin": CORS, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", ...headers });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
const json = (res, status, body) => send(res, status, body, { "Content-Type": "application/json; charset=utf-8" });

function validate(spec, files) {
  if (!spec || !Array.isArray(spec.scenes) || spec.scenes.length < 1 || spec.scenes.length > 21) throw new Error("scenes는 1~21개여야 합니다.");
  let total = 0;
  spec.scenes.forEach((s, i) => {
    const d = Number(s.duration);
    if (!(d >= 0.5 && d <= 10)) throw new Error(`장면 ${i + 1}: 길이는 0.5~10초`);
    total += d;
    for (const k of ["bg", "ov"]) if (!files.get(`${k}_${i}`)) throw new Error(`장면 ${i + 1}: ${k} 이미지 없음`);
    if (s.fg && !files.get(`fg_${i}`)) throw new Error(`장면 ${i + 1}: fg 이미지 없음`);
  });
  if (total > 60) throw new Error("전체 길이는 60초 이하여야 합니다.");
  return total;
}

async function renderJob(job, spec, files) {
  const dir = job.dir;
  const set = (step, progress) => { job.step = step; job.progress = progress; };
  try {
    job.status = "running";
    const total = validate(spec, files);
    const n = spec.scenes.length;
    const segs = [];
    for (let i = 0; i < n; i++) {
      set(`장면 ${i + 1}/${n} 합성`, Math.round((i / n) * 70));
      const s = spec.scenes[i];
      const d = Number(s.duration);
      const frames = Math.round(d * OUT.fps);
      const write = async (k, f) => { const p = join(dir, `${k}_${i}${f.type === "image/png" ? ".png" : ".jpg"}`); await writeFile(p, Buffer.from(await f.arrayBuffer())); return p; };
      const bg = await write("bg", files.get(`bg_${i}`));
      const ov = await write("ov", files.get(`ov_${i}`));
      const args = ["-y", "-hide_banner", "-loglevel", "error", "-loop", "1", "-framerate", String(OUT.fps), "-t", String(d), "-i", bg];
      let filter;
      if (s.fg) {
        const fg = await write("fg", files.get(`fg_${i}`));
        const z = Math.min(0.08, Math.max(0, Number(s.fg.zoom ?? 0.03)));
        const cx = Math.round(Number(s.fg.x) + Number(s.fg.w) / 2), cy = Math.round(Number(s.fg.y) + Number(s.fg.h) / 2);
        args.push("-loop", "1", "-framerate", String(OUT.fps), "-t", String(d), "-i", fg);
        args.push("-loop", "1", "-framerate", String(OUT.fps), "-t", String(d), "-i", ov);
        filter = `[1:v]format=rgba,scale=w='trunc(iw*(1+${z}*t/${d})/2)*2':h='trunc(ih*(1+${z}*t/${d})/2)*2':eval=frame[f];[0:v][f]overlay=x='${cx}-w/2':y='${cy}-h/2':eval=frame:format=auto[a];[a][2:v]overlay=0:0:format=auto,format=yuv420p[v]`;
      } else {
        args.push("-loop", "1", "-framerate", String(OUT.fps), "-t", String(d), "-i", ov);
        filter = "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]";
      }
      const seg = join(dir, `seg_${i}.mp4`);
      args.push("-filter_complex", filter, "-map", "[v]", "-frames:v", String(frames), "-r", String(OUT.fps), "-c:v", "libx264", "-profile:v", "high", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-an", seg);
      await run(FFMPEG, args);
      segs.push(seg);
    }
    set("장면 이어 붙이기", 72);
    await writeFile(join(dir, "list.txt"), segs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
    const video = join(dir, "video.mp4");
    await run(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"), "-c", "copy", video]);

    // 음성(TTS): 서버에 TTS_COMMAND 가 있을 때만. 장면 시작 시각에 맞춰 붙인다.
    const narr = [];
    if (spec.voice?.enabled && TTS_COMMAND) {
      let at = 0;
      for (let i = 0; i < n; i++) {
        const text = String(spec.scenes[i].narration || "").slice(0, 300);
        if (text) {
          set(`음성 ${i + 1}/${n} 생성`, 74 + Math.round((i / n) * 8));
          const txt = join(dir, `tts_${i}.txt`), wav = join(dir, `tts_${i}.wav`);
          await writeFile(txt, text);
          await run(TTS_COMMAND, [txt, wav]);
          narr.push({ wav, at });
        }
        at += Number(spec.scenes[i].duration);
      }
    }
    job.tts = narr.length ? "applied" : spec.voice?.enabled ? (TTS_COMMAND ? "empty" : "no-engine") : "off";

    set("음성·음악 믹스, MP4 인코딩", 85);
    const final = join(dir, "final.mp4");
    const args = ["-y", "-hide_banner", "-loglevel", "error", "-i", video];
    const labels = [];
    const chains = [];
    let idx = 1;
    const bgmFile = files.get("bgm");
    if (bgmFile) {
      const p = join(dir, "bgm.bin"); await writeFile(p, Buffer.from(await bgmFile.arrayBuffer()));
      args.push("-stream_loop", "-1", "-i", p);
      const vol = Math.min(1, Math.max(0, Number(spec.bgm?.volume ?? 0.35)));
      chains.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${total},volume=${vol},afade=t=out:st=${Math.max(0, total - 1.5)}:d=1.5[bgm]`);
      labels.push("[bgm]"); idx++;
    }
    for (const [k, nr] of narr.entries()) {
      args.push("-i", nr.wav);
      const ms = Math.round(nr.at * 1000);
      chains.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[n${k}]`);
      labels.push(`[n${k}]`); idx++;
    }
    if (!labels.length) {
      args.push("-f", "lavfi", "-t", String(total), "-i", "anullsrc=r=48000:cl=stereo");
      chains.push(`[${idx}:a]anull[mix]`);
    } else {
      chains.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${total},apad=whole_dur=${total}[mix]`);
    }
    args.push("-filter_complex", chains.join(";"), "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", String(total), "-movflags", "+faststart", final);
    await run(FFMPEG, args);

    set("검증", 95);
    const probe = JSON.parse(await run(FFPROBE, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", final]));
    const v = probe.streams.find((s) => s.codec_type === "video"), a = probe.streams.find((s) => s.codec_type === "audio");
    job.probe = { container: probe.format.format_name, duration: Number(probe.format.duration), video: { codec: v?.codec_name, width: v?.width, height: v?.height, fps: v?.r_frame_rate, pix_fmt: v?.pix_fmt }, audio: { codec: a?.codec_name, sample_rate: a?.sample_rate } };
    job.file = final;
    job.size = (await stat(final)).size;
    set("완료", 100);
    job.status = "done";
  } catch (e) {
    job.status = "error";
    job.error = String(e.message || e).slice(0, 1500);
  } finally {
    setTimeout(() => { jobs.delete(job.id); rm(dir, { recursive: true, force: true }).catch(() => {}); }, JOB_TTL_MS).unref();
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (req.method === "GET" && url.pathname === "/api/shortform/health") {
      let ver = "";
      try { ver = (await run(FFMPEG, ["-version"])).split("\n")[0]; } catch { /* ffmpeg 없음 */ }
      return json(res, 200, { ok: Boolean(ver), ffmpeg: ver, tts: TTS_COMMAND ? "TTS_COMMAND 설정됨" : "미연결", output: OUT });
    }
    if (req.method === "POST" && url.pathname === "/api/shortform/render") {
      const len = Number(req.headers["content-length"] || 0);
      if (!len || len > MAX_BODY) return json(res, 413, { error: `본문은 ${MAX_BODY / 1048576}MB 이하여야 합니다.` });
      const form = await new Request("http://x/", { method: "POST", headers: { "content-type": req.headers["content-type"] || "" }, body: Readable.toWeb(req), duplex: "half" }).formData();
      let spec;
      try { spec = JSON.parse(String(form.get("spec"))); } catch { return json(res, 400, { error: "spec JSON이 올바르지 않습니다." }); }
      const files = new Map();
      for (const [k, v] of form.entries()) if (typeof v !== "string" && /^(bg|fg|ov)_\d+$|^bgm$/.test(k)) files.set(k, v);
      try { validate(spec, files); } catch (e) { return json(res, 400, { error: e.message }); }
      const id = randomUUID();
      const job = { id, status: "queued", step: "대기", progress: 0, dir: await mkdtemp(join(tmpdir(), "shortform-")), createdAt: Date.now() };
      jobs.set(id, job);
      renderJob(job, spec, files);
      return json(res, 202, { jobId: id });
    }
    const m = url.pathname.match(/^\/api\/shortform\/jobs\/([\w-]+)(\/video\.mp4)?$/);
    if (req.method === "GET" && m) {
      const job = jobs.get(m[1]);
      if (!job) return json(res, 404, { error: "작업을 찾을 수 없습니다(30분 후 삭제)." });
      if (!m[2]) return json(res, 200, { id: job.id, status: job.status, step: job.step, progress: job.progress, error: job.error, size: job.size, probe: job.probe, tts: job.tts });
      if (job.status !== "done") return json(res, 409, { error: "아직 완료되지 않았습니다." });
      res.writeHead(200, { "Access-Control-Allow-Origin": CORS, "Content-Type": "video/mp4", "Content-Length": job.size, "Content-Disposition": 'attachment; filename="bobae-shortform.mp4"' });
      return createReadStream(job.file).pipe(res);
    }
    json(res, 404, { error: "없는 경로" });
  } catch (e) {
    json(res, 500, { error: String(e.message || e).slice(0, 500) });
  }
});

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  server.listen(PORT, () => console.log(`shortform render server http://localhost:${PORT}  (TTS: ${TTS_COMMAND || "미연결"})`));
}
export { server };
