import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import WebSocket from "ws";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = resolve("reports/chotot-list-match-1004");
const baseUrl = "http://127.0.0.1:4175/?qf=guazi&category=%ED%8A%B8%EB%9F%AD+%C2%B7+%ED%8A%B9%EC%9E%A5";

await mkdir(outputDir, { recursive: true });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function capture({ file, url, gallery = false, port }) {
  const profile = await mkdtemp(join(tmpdir(), "bbm-chotot-capture-"));
  const child = spawn(edge, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  let socket;
  try {
    let target;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const targets = await json(`http://127.0.0.1:${port}/json`);
        target = targets.find((item) => item.type === "page");
        if (target) break;
      } catch {}
      await delay(100);
    }
    if (!target) throw new Error(`Edge CDP target not found on ${port}`);

    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      socket.once("open", resolveOpen);
      socket.once("error", rejectOpen);
    });

    let nextId = 0;
    const pending = new Map();
    socket.on("message", (raw) => {
      const message = JSON.parse(String(raw));
      if (!message.id || !pending.has(message.id)) return;
      const { resolveMessage, rejectMessage } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectMessage(new Error(message.error.message));
      else resolveMessage(message.result);
    });
    const command = (method, params = {}) => new Promise((resolveMessage, rejectMessage) => {
      const id = ++nextId;
      pending.set(id, { resolveMessage, rejectMessage });
      socket.send(JSON.stringify({ id, method, params }));
    });

    await command("Emulation.setDeviceMetricsOverride", {
      width: 384,
      height: 832,
      deviceScaleFactor: 2.8125,
      mobile: true,
      screenWidth: 384,
      screenHeight: 832,
    });
    await command("Page.navigate", { url });
    await delay(url.startsWith("https://xe.chotot.com") ? 5000 : 1800);

    if (gallery) {
      await command("Runtime.evaluate", { expression: `document.querySelector('button[aria-label="보기 방식 선택"]')?.click()` });
      await delay(250);
      await command("Runtime.evaluate", { expression: `[...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === '갤러리로 보기')?.click()` });
      await delay(500);
    }

    const result = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(join(outputDir, file), Buffer.from(result.data, "base64"));
  } finally {
    if (socket?.readyState === WebSocket.OPEN) socket.close();
    child.kill();
    await Promise.race([
      new Promise((resolveExit) => child.once("exit", resolveExit)),
      delay(1500),
    ]);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

await capture({ file: "01-no-ref-list.png", url: baseUrl, port: 9231 });
await capture({ file: "02-no-ref-gallery.png", url: baseUrl, gallery: true, port: 9232 });
await capture({ file: "03-ref-list.png", url: `${baseUrl}&ref=chotot`, port: 9233 });
await capture({ file: "04-ref-gallery.png", url: `${baseUrl}&ref=chotot&view=gallery`, port: 9234 });
await capture({ file: "chotot-reference.png", url: "https://xe.chotot.com/mua-ban-xe-tai-xe-ben", port: 9235 });

console.log(outputDir);
