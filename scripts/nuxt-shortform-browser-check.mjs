#!/usr/bin/env node
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve("public");
const PORT = 4579;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }
  const pathname = decodeURIComponent(url.pathname).replace(/^\/bobaedream\//, "/");
  let file = join(ROOT, pathname);
  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    return createReadStream(file).pipe(res);
  }
  file = join(file, "index.html");
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  createReadStream(file).pipe(res);
});
await new Promise((resolveListen) => server.listen(PORT, resolveListen));

const executablePath = process.env.CHROMIUM_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
const browser = await chromium.launch({ executablePath, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  const base = `http://127.0.0.1:${PORT}/bobaedream/nuxt-shortform/`;
  await page.goto(base);
  await page.getByRole("button", { name: "Google로 로그인" }).click();
  await page.getByRole("button", { name: /새 영상/ }).first().click();
  await page.locator("#f-maker").fill("현대");
  await page.locator("#f-model").fill("그랜저 GN7");
  await page.locator("#f-year").fill("2024");
  await page.waitForTimeout(500);
  await page.reload();
  check("작성 중인 차량 정보 자동 복원", (await page.locator("#f-maker").inputValue()) === "현대" && (await page.locator("#f-model").inputValue()) === "그랜저 GN7");
  await page.getByRole("button", { name: /다음: 사진 올리기/ }).click();

  const gen = await context.newPage();
  await gen.goto(base);
  const colors = ["#1e3a8a", "#0f766e", "#9a3412", "#4c1d95"];
  const photos = [];
  for (let i = 0; i < colors.length; i += 1) {
    const data = await gen.evaluate(([color, index]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "700 86px sans-serif";
      ctx.fillText(`CAR ${index}`, 300, 350);
      return canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    }, [colors[i], i + 1]);
    photos.push({ name: `car-${i + 1}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from(data, "base64") });
  }
  await gen.close();
  await page.locator('input[type="file"][multiple]').setInputFiles(photos);
  await page.waitForFunction(() => document.querySelectorAll(".sf-thumb").length === 4);
  check("사진 4장 등록", (await page.locator(".sf-thumb").count()) === 4);
  const before = await page.locator(".sf-thumb img").evaluateAll((images) => images.map((image) => image.src));
  await page.locator(".sf-thumb").nth(1).getByRole("button", { name: /앞으로/ }).click();
  const after = await page.locator(".sf-thumb img").evaluateAll((images) => images.map((image) => image.src));
  check("사진 순서 앞뒤 조정", after[0] === before[1] && after[1] === before[0]);
  await page.getByRole("button", { name: "주문 보내기(1크레딧)" }).click();
  await page.waitForSelector("video", { timeout: 120_000 });
  const video = await page.locator("video").evaluate((element) => ({ duration: element.duration, width: element.videoWidth, height: element.videoHeight }));
  check("세로 MP4 자동 생성", video.duration > 10 && video.height > video.width, `${video.width}×${video.height}, ${video.duration.toFixed(1)}초`);
  check("브라우저 오류 없음", errors.length === 0, errors.slice(0, 2).join(" | "));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
