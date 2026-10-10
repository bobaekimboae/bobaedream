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
  const vis = await page.evaluate(() => { const v = (q) => { const e = document.querySelector(q); return !!e && e.checkVisibility({ contentVisibilityAuto: true }); }; return { main: v("#renderMp4"), tpls: v("#tpls"), photos: v("#drop"), info: v("#model"), len: v("#len"), srv: v("#srvRender"), scene: v("#sceneList"), tts: v("#ttsOn"), btns: [...document.querySelectorAll("button")].filter((b) => b.checkVisibility({ contentVisibilityAuto: true }) && !b.closest(".tpls")).length }; });
  check("첫 화면 단순화(사진·템플릿·정보·큰 버튼만, 고급·장면목록 접힘)", vis.main && vis.tpls && vis.photos && vis.info && !vis.len && !vis.srv && !vis.scene && !vis.tts, `보이는 버튼 ${vis.btns}개`);
  await page.screenshot({ path: join(out, "00-first-screen.png"), fullPage: false });
  await page.evaluate(() => document.querySelectorAll("details.fold").forEach((d) => { d.open = true; }));
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

  // 번호판 가리기(수동 모자이크): ▦ → 끌어서 네모 → 적용
  await page.locator('.thumb[data-i="0"] button[data-act="blur"]').click();
  await page.waitForSelector("#blurModal.on");
  const box = await page.locator("#blurCv").boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.65);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.82, { steps: 8 }); await page.mouse.up();
  check("모자이크 네모 그리기", (await page.locator("#blurRects button").count()) === 1);
  await page.screenshot({ path: join(out, "00-blur-editor.png") });
  await page.click("#blurDone");
  const blurInfo = await page.evaluate(() => { const it = window.__sf.items()[0]; const w = it.orig.width, h = it.orig.height; const rd = (im) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return g.getImageData(Math.round(w * .3), Math.round(h * .65), Math.round(w * .4), Math.round(h * .17)).data; }; const a = rd(it.orig), b = rd(it.image); let diff = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) > 12) diff++; const out = rd(it.image).length; return { blurs: it.blurs.length, diff, same: it.image === it.orig, badge: document.querySelector('.thumb[data-i="0"] .bb')?.textContent }; });
  check("번호판 가리기 적용(모자이크 픽셀 변경)", blurInfo.blurs === 1 && !blurInfo.same && blurInfo.diff > 100 && blurInfo.badge?.includes("블러"), `변경 픽셀 ${blurInfo.diff}, 배지 ${blurInfo.badge}`);

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

  // 4-2) 브라우저 MP4(WebCodecs): 이 환경이 H.264/AAC를 못 하면 VP9/Opus MP4(규격 외)로 표시되어야 함
  await page.click("#renderMp4");
  await page.waitForFunction(() => /MP4/.test(document.querySelector("#resultBadge").textContent) && window.__sf.mp4, null, { timeout: 120000 });
  const bm = await page.evaluate(() => ({ ...window.__sf.mp4, badge: document.querySelector("#resultBadge").textContent, info: document.querySelector("#resultInfo").textContent }));
  const [dlb] = await Promise.all([page.waitForEvent("download"), page.click("#resultDl")]);
  const bmPath = join(out, dlb.suggestedFilename()); await dlb.saveAs(bmPath);
  const pb = probe(bmPath), bv = pb.streams.find((x) => x.codec_type === "video"), ba = pb.streams.find((x) => x.codec_type === "audio");
  check("브라우저 MP4 생성·다운로드", bmPath.endsWith(".mp4") && bv && ba, `${bv?.codec_name}+${ba?.codec_name} ${bv?.width}×${bv?.height} ${bv?.r_frame_rate} ${Number(pb.format.duration).toFixed(2)}s ${bm.badge}`);
  check("브라우저 MP4 1080×1920·30fps·15초", bv.width === 1080 && bv.height === 1920 && bv.r_frame_rate === "30/1" && Math.abs(Number(pb.format.duration) - 15) < 0.25);
  check("브라우저 MP4 코덱 표시 정확(규격 여부)", bm.spec ? (bv.codec_name === "h264" && ba.codec_name === "aac") : (!bm.badge.includes("서비스 규격")), `spec=${bm.spec} ${bv.codec_name}/${ba.codec_name}`);
  check("브라우저 MP4 음악 소리 있음", (spawnSync("ffmpeg", ["-v", "info", "-i", bmPath, "-af", "volumedetect", "-vn", "-f", "null", "-"], { encoding: "utf8" }).stderr.match(/mean_volume: (-?[\d.]+) dB/) || [0, -91])[1] > -60);
  const dec2 = spawnSync("ffmpeg", ["-v", "error", "-i", bmPath, "-f", "null", "-"], { encoding: "utf8" });
  check("브라우저 MP4 디코딩 오류 없음", dec2.status === 0 && !dec2.stderr.trim(), dec2.stderr.trim().slice(0, 100));
  const bmPlay = await page.evaluate(async () => { const v = document.querySelector("#resultVideo"); v.muted = true; try { await v.play(); await new Promise((r) => setTimeout(r, 1200)); return v.currentTime; } catch (e) { return String(e); } });
  check("브라우저 MP4 결과 재생", typeof bmPlay === "number" && bmPlay > 0.5, `currentTime ${bmPlay}`);

  // 5) 서버 렌더링(FFmpeg MP4)
  await page.fill("#srvUrl", "http://127.0.0.1:8799");
  await page.dispatchEvent("#srvUrl", "change");
  await page.waitForFunction(() => document.querySelector("#srvState").textContent.includes("연결됨"), null, { timeout: 8000 });
  check("렌더 서버 연결 표시", true, await page.textContent("#srvState"));
  await page.click("#srvRender");
  await page.waitForFunction(() => document.querySelector("#resultBadge").textContent.includes("서비스 규격") && !document.querySelector("#srvRender").disabled, null, { timeout: 180000 });
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
  // 6) 영상 길이 20초 → 서버 MP4 길이 확인
  await page.selectOption("#len", "20");
  const len20 = await page.evaluate(() => ({ total: window.__sf.total(), scenes: document.querySelectorAll("#sceneList .scene").length }));
  check("영상 길이 20초 선택", len20.total === 20 && len20.scenes === 6, `총 ${len20.total}초, 장면 ${len20.scenes}개(사진 5 + CTA)`);
  await page.fill("#cta", "전화 문의 환영");
  await page.click("#srvRender");
  await page.waitForFunction(() => /20s\.mp4/.test(document.querySelector("#resultDl").download) && !document.querySelector("#srvRender").disabled, null, { timeout: 180000 });
  const [dl3] = await Promise.all([page.waitForEvent("download"), page.click("#resultDl")]);
  const p20 = join(out, "len20-" + dl3.suggestedFilename()); await dl3.saveAs(p20);
  const q20 = probe(p20), v20 = q20.streams.find((x) => x.codec_type === "video");
  check("서버 MP4 20초·30fps·1080×1920", Math.abs(Number(q20.format.duration) - 20) < 0.25 && v20.r_frame_rate === "30/1" && v20.width === 1080, `${Number(q20.format.duration).toFixed(2)}s`);
  // 7) 템플릿 5종 + 샘플 채우기
  const tplNames = await page.locator(".tpl b").allTextContents();
  check("템플릿 5종 표시", tplNames.length === 5, tplNames.join(" · "));
  await page.click('.tpl[data-id="black"]');
  const tb = await page.evaluate(() => ({ len: window.__sf.total(), mode: document.querySelector(".mode.active").dataset.mode, cta: document.querySelector("#cta").value, bgm: document.querySelector("#bgmStyle").value, accent: window.__sf.theme.accent }));
  check("템플릿 적용(프리미엄 블랙: 20초·Full Fit·차분한 음악·CTA·골드)", tb.len === 20 && tb.mode === "fit" && tb.bgm === "calm" && tb.cta === "프라이빗 상담 예약" && tb.accent === "#e3c07a", JSON.stringify(tb));
  await page.click('.tpl[data-id="sale"]');
  await page.click("#tplSample");
  await page.waitForFunction(() => document.querySelectorAll(".thumb").length === 5 && document.querySelector("#model").value.includes("GLA"), null, { timeout: 15000 });
  const sm = await page.evaluate(() => { window.__sf.draw(window.__sf.total() - 1); const c = document.querySelector("#cv"), g = c.getContext("2d"), d = g.getImageData(40, 780, 300, 40).data; let hot = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 90 && d[i + 1] < 160 && d[i + 2] < 120) hot++; const h = g.getImageData(420, 34, 92, 32).data; let red = 0; for (let i = 0; i < h.length; i += 4) if (h[i] > 200 && h[i + 1] < 140) red++; window.__sf.draw(0); const h0 = g.getImageData(420, 34, 92, 32).data; let badge = 0; for (let i = 0; i < h0.length; i += 4) if (h0[i] > 200 && h0[i + 1] > 90 && h0[i + 1] < 160 && h0[i + 2] < 120) badge++; return { n: document.querySelectorAll(".thumb").length, model: document.querySelector("#model").value, len: window.__sf.total(), hot, badge, img: document.querySelector(".thumb img").src.split("/").pop() }; });
  check("샘플 채우기(사진 5장·정보)", sm.n === 5 && sm.model.includes("GLA 45") && sm.img.startsWith("sag-08"), `${sm.model}, ${sm.img}`);
  check("템플릿 스타일이 화면에 반영(특가 배지·주황 가격)", sm.badge > 500 && sm.hot > 200, `배지 픽셀 ${sm.badge}, 가격 색 픽셀 ${sm.hot}`);
  await page.screenshot({ path: join(out, "07-template-sale-sample.png") });
  await ffframe(p20, join(out, "06-mp4-20s-last.png"), 19);
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
