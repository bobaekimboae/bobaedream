#!/usr/bin/env node
// 숏폼 제작기 실제 브라우저 점검: 사진 등록 → 순서 변경 → 통합 미리보기(자막·음성·음악) → 영상 생성(WebM) → 결과 재생 → 다운로드
// → 서버 렌더링(FFmpeg MP4) → 결과 재생 시도 → 다운로드 → ffprobe 규격 검증.   실행: node scripts/shortform-browser-check.mjs
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { server as renderServer } from "./shortform-render-server.mjs";

const ROOT = resolve("public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

const web = http.createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  const f = existsSync(p) && !p.endsWith("/") ? p : join(p, "index.html");
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[extname(f)] || "application/octet-stream" });
  createReadStream(f).pipe(res);
});
await new Promise((r) => web.listen(4567, r));
await new Promise((r) => renderServer.listen(8799, r));
const out = resolve("reports/shortform-e2e");
await mkdir(out, { recursive: true });
const probe = (file) => JSON.parse(spawnSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file], { encoding: "utf8" }).stdout || "{}");

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  // 테스트용 차량 사진(가로 1600×1000) 5장 생성
  const gen = await ctx.newPage();
  await gen.goto("http://localhost:4567/shortform/");
  const colors = ["#c0392b", "#2980b9", "#27ae60", "#8e44ad", "#f39c12"];
  const photos = [];
  for (let i = 0; i < colors.length; i++) {
    const b64 = await gen.evaluate(([c, n]) => { const k = document.createElement("canvas"); k.width = 1600; k.height = 1000; const g = k.getContext("2d"); const gr = g.createLinearGradient(0, 0, 1600, 1000); gr.addColorStop(0, c); gr.addColorStop(1, "#111"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 1000); g.fillStyle = "#fff"; g.font = "bold 160px sans-serif"; g.fillText("PHOTO " + n, 420, 540); g.fillRect(300, 700, 1000, 120); return k.toDataURL("image/jpeg", .9).split(",")[1]; }, [colors[i], i + 1]);
    photos.push({ name: `car-${i + 1}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from(b64, "base64") });
  }
  await gen.close();

  await page.goto("http://localhost:4567/shortform/");
  await page.fill("#model", "BMW X3 xDrive20d"); await page.fill("#price", "1,490만원"); await page.fill("#year", "2016년"); await page.fill("#mileage", "165,536km");
  await page.fill("#points", "네비게이션\n블랙 시트\n전자식 기어\n오토 공조");

  // 1) 사진 등록
  await page.setInputFiles("#file", photos);
  await page.waitForFunction(() => document.querySelectorAll(".thumb").length === 5);
  check("사진 등록", (await page.locator(".thumb").count()) === 5, "5장");

  // 2) 장면 순서 변경 (3번째를 앞으로 → ◀ 버튼, 드래그 이동도 확인)
  const names = () => page.evaluate(() => [...document.querySelectorAll(".thumb img")].map((i) => i.alt));
  const before = await page.evaluate(() => [...document.querySelectorAll(".thumb")].map((t) => t.querySelector("img").src));
  await page.locator('.thumb[data-i="2"] button[data-act="up"]').click();
  const after1 = await page.evaluate(() => [...document.querySelectorAll(".thumb")].map((t) => t.querySelector("img").src));
  check("순서 변경(◀ 버튼)", after1[1] === before[2] && after1[2] === before[1]);
  await page.locator('.thumb[data-i="0"]').dragTo(page.locator('.thumb[data-i="3"]'));
  const after2 = await page.evaluate(() => [...document.querySelectorAll(".thumb")].map((t) => t.querySelector("img").src));
  check("순서 변경(끌어서 이동)", after2[3] === after1[0] && after2[0] === after1[1], "0번 → 3번 자리");
  await page.screenshot({ path: join(out, "01-photos-reordered.png") });

  // 장면 자막 편집
  await page.locator("#sceneList .sub").nth(1).fill("전 차량 무사고 확인");
  check("장면 자막 편집", (await page.locator("#sceneList .sub").nth(1).inputValue()) === "전 차량 무사고 확인");

  // 3) 통합 미리보기: 화면 진행 + 자막 변경 + 음성 호출 + 음악 소리
  await page.selectOption("#bgmStyle", "bright");
  await page.click("#play");
  await page.waitForTimeout(3600);
  const play = await page.evaluate(() => ({ scene: window.__sf.scene, tts: window.__sf.ttsCalls, texts: window.__sf.ttsTexts.slice(), level: window.__sf.bgmLevel, ac: window.__sf.acState, voices: window.speechSynthesis ? speechSynthesis.getVoices().length : -1, time: document.querySelector("#time").textContent, speaking: window.speechSynthesis ? speechSynthesis.speaking || speechSynthesis.pending : null }));
  check("통합 미리보기 진행(장면 전환)", play.scene >= 1, `장면 ${play.scene + 1}, 시간 ${play.time}`);
  check("음악 재생(WebAudio 신호)", play.ac === "running" && play.level > 0.02, `AudioContext ${play.ac}, 파형 레벨 ${play.level.toFixed(3)}`);
  check("음성 호출(speechSynthesis)", play.tts >= 2 && play.texts[0].includes("BMW X3"), `호출 ${play.tts}회, 첫 문장 "${play.texts[0]}"`);
  check("음성 실제 발화(OS 음성 엔진)", play.voices > 0 || play.speaking, `한국어 포함 음성 ${play.voices}개 — 헤드리스에는 음성 엔진이 없어 소리는 확인 불가`);
  await page.screenshot({ path: join(out, "02-preview-playing.png") });
  await page.click("#play");

  // 4) 영상 생성(브라우저 WebM 임시) → 결과 재생 → 다운로드
  await page.click("#render");
  await page.waitForSelector("#resultCard", { state: "visible", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("#resultVideo").readyState >= 2, null, { timeout: 20000 });
  const vid = await page.evaluate(async () => { const v = document.querySelector("#resultVideo"); v.muted = true; await v.play(); await new Promise((r) => setTimeout(r, 1200)); return { t: v.currentTime, dur: v.duration, w: v.videoWidth, h: v.videoHeight, badge: document.querySelector("#resultBadge").textContent }; });
  check("결과 영상 재생(WebM)", vid.t > 0.5, `currentTime ${vid.t.toFixed(2)}s, ${vid.w}×${vid.h}, ${vid.badge}`);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#resultDl")]);
  const webmPath = join(out, dl.suggestedFilename());
  await dl.saveAs(webmPath);
  const pw = probe(webmPath);
  const wv = pw.streams?.find((s) => s.codec_type === "video"), wa = pw.streams?.find((s) => s.codec_type === "audio");
  check("WebM 다운로드", Boolean(wv) && webmPath.endsWith(".webm"), `${dl.suggestedFilename()} · ${wv?.codec_name} ${wv?.width}×${wv?.height}`);
  check("WebM에 음악 트랙 포함", Boolean(wa), wa ? `${wa.codec_name}` : "오디오 없음");
  await page.screenshot({ path: join(out, "03-webm-result.png") });

  // 5) 서버 렌더링(FFmpeg MP4)
  await page.fill("#srvUrl", "http://127.0.0.1:8799");
  await page.dispatchEvent("#srvUrl", "change");
  await page.waitForFunction(() => document.querySelector("#srvState").textContent.includes("연결됨"), null, { timeout: 8000 });
  check("렌더 서버 연결 표시", true, await page.textContent("#srvState"));
  await page.click("#srvRender");
  await page.waitForFunction(() => document.querySelector("#resultBadge").textContent.includes("MP4"), null, { timeout: 180000 });
  const mp4 = await page.evaluate(async () => { const v = document.querySelector("#resultVideo"); return { can: v.canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"'), info: document.querySelector("#resultInfo").textContent }; });
  const [dl2] = await Promise.all([page.waitForEvent("download"), page.click("#resultDl")]);
  const mp4Path = join(out, dl2.suggestedFilename());
  await dl2.saveAs(mp4Path);
  const pm = probe(mp4Path);
  const mv = pm.streams.find((s) => s.codec_type === "video"), ma = pm.streams.find((s) => s.codec_type === "audio");
  check("MP4 다운로드", mp4Path.endsWith(".mp4"), dl2.suggestedFilename());
  check("MP4 규격 9:16 1080×1920", mv.width === 1080 && mv.height === 1920, `${mv.width}×${mv.height}`);
  check("MP4 30fps", mv.r_frame_rate === "30/1", mv.r_frame_rate);
  check("MP4 H.264", mv.codec_name === "h264", `${mv.codec_name} ${mv.profile}`);
  check("MP4 AAC 음성 트랙", ma?.codec_name === "aac", `${ma?.codec_name} ${ma?.sample_rate}Hz`);
  check("MP4 컨테이너·길이", pm.format.format_name.includes("mp4") && Math.abs(Number(pm.format.duration) - 15) < 0.2, `${pm.format.format_name}, ${Number(pm.format.duration).toFixed(2)}s`);
  const decode = spawnSync("ffmpeg", ["-v", "error", "-i", mp4Path, "-f", "null", "-"], { encoding: "utf8" });
  check("MP4 끝까지 디코딩 오류 없음", decode.status === 0 && !decode.stderr.trim(), decode.stderr.trim().slice(0, 120));
  let played = null;
  if (mp4.can) {
    played = await page.evaluate(async () => { const v = document.querySelector("#resultVideo"); v.muted = true; try { await v.play(); await new Promise((r) => setTimeout(r, 1200)); return v.currentTime; } catch (e) { return String(e); } });
    check("결과 MP4 브라우저 재생", typeof played === "number" && played > 0.5, `currentTime ${played}`);
  } else {
    check("결과 MP4 브라우저 재생", false, "이 Chromium 빌드는 H.264 디코더가 없어 재생 불가(일반 Chrome·Safari·Edge는 재생). ffmpeg 디코딩으로 대체 확인");
  }
  await ffframe(mp4Path, join(out, "04-mp4-frame-2s.png"), 2);
  await page.screenshot({ path: join(out, "05-mp4-result.png") });
  check("페이지 오류 없음", errors.filter((e) => !/Failed to load resource/.test(e)).length === 0, errors.slice(0, 2).join(" | "));
} finally {
  await browser.close(); web.close(); renderServer.close();
}
function ffframe(f, o, t) { spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", f, "-frames:v", "1", o]); }
await writeFile(join(out, "result.json"), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과, 실패: ${failed.map((f) => f.name).join(", ") || "없음"}`);
process.exit(0);
