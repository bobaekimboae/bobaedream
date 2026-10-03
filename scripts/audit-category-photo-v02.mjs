#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join("reports", "category-photo-v02");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const summary = { base, measuredAt: new Date().toISOString(), checks: [], views: {} };
const check = (name, ok, detail) => {
  summary.checks.push({ name, ok, detail });
  console.log(`${ok ? "O" : "X"} ${name} — ${detail}`);
};

async function inspect(mode) {
  const mobile = mode === "mobile";
  const context = await browser.newContext(mobile
    ? { viewport: { width: 384, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) => failures.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${base}?qf=guazi${mobile ? "" : "&pc=1"}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  await page.waitForTimeout(300);
  const scope = mobile ? ".bbm-m-quick-slot .bbm-category-menu" : ".bbm-content-head.is-chotot .bbm-category-menu";
  const values = await page.evaluate((scope) => {
    const root = document.querySelector(scope);
    const round = (value) => Math.round(value * 10) / 10;
    const items = [...root.querySelectorAll(".bbm-category-menu__button")].map((button) => {
      const item = button.closest(".bbm-category-menu__item");
      const photo = button.querySelector(".bbm-category-menu__icon-box.is-photo");
      const image = photo.querySelector("img");
      const label = button.querySelector(".bbm-category-menu__label");
      const br = button.getBoundingClientRect();
      const ir = item.getBoundingClientRect();
      const pr = photo.getBoundingClientRect();
      const imr = image.getBoundingClientRect();
      const lr = label.getBoundingClientRect();
      const ls = getComputedStyle(label);
      return {
        name: label.textContent.trim(),
        item: [round(ir.width), round(ir.height)],
        button: [round(br.width), round(br.height)],
        photo: [round(pr.width), round(pr.height)],
        image: [round(imr.width), round(imr.height)],
        photoTop: round(pr.top - br.top),
        labelGap: round(lr.top - pr.bottom),
        label: [round(lr.width), round(lr.height)],
        labelStyle: `${ls.fontSize}/${ls.lineHeight} ${ls.fontWeight} ${ls.color}`,
        transform: getComputedStyle(image).transform,
        src: image.getAttribute("src"),
        source: [image.naturalWidth, image.naturalHeight],
        loaded: image.complete && image.naturalWidth > 0,
      };
    });
    const lefts = [...root.querySelectorAll(".bbm-category-menu__item")].map((item) => item.getBoundingClientRect().left);
    return { items, pitch: round(lefts[1] - lefts[0]), scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
  }, scope);
  summary.views[mode] = { ...values, failures };
  if (mobile) {
    await page.screenshot({ path: join(outDir, "implementation-mobile-384.png"), clip: { x: 0, y: 0, width: 384, height: 330 } });
  } else {
    await page.locator(".bbm-content-head.is-chotot").screenshot({ path: join(outDir, "implementation-pc-1440.png") });
  }
  await context.close();
}

await inspect("pc");
await inspect("mobile");
const pc = summary.views.pc;
const mobile = summary.views.mobile;
check("실사 원본 7종 로드·640×400", [...pc.items, ...mobile.items].every((item) => item.loaded && item.source[0] === 640 && item.source[1] === 400), `${pc.items.length}/${mobile.items.length}`);
check("PC 칸 84×102·피치 92", pc.items.every((item) => item.button[0] === 84 && item.button[1] === 102) && pc.pitch === 92, `칸 ${pc.items[0].button.join("×")} · 피치 ${pc.pitch}`);
check("PC 실사 76×40·위 6·하단 정렬", pc.items.every((item) => item.photo[0] === 76 && item.photo[1] === 40 && item.image[0] === 76 && item.image[1] === 40 && item.photoTop === 6), `사진 ${pc.items[0].photo.join("×")} · 위 ${pc.items[0].photoTop}`);
check("PC 이름 간격 14·14/21 400 #595959", pc.items.every((item) => item.labelGap === 14 && item.label[0] === 76 && item.labelStyle === "14px/21px 400 rgb(89, 89, 89)"), `${pc.items[0].labelGap} · ${pc.items[0].labelStyle}`);
check("모바일 칸 64×78·피치 72", mobile.items.every((item) => item.button[0] === 64 && item.button[1] === 78) && mobile.pitch === 72, `칸 ${mobile.items[0].button.join("×")} · 피치 ${mobile.pitch}`);
check("모바일 실사 64×40·하단 정렬", mobile.items.every((item) => item.photo[0] === 64 && item.photo[1] === 40 && item.image[0] === 64 && item.image[1] === 40), `사진 ${mobile.items[0].photo.join("×")}`);
check("모바일 이름 간격 2·12/18 500 #595959", mobile.items.every((item) => item.labelGap === 2 && item.label[0] === 56 && item.labelStyle === "12px/18px 500 rgb(89, 89, 89)"), `${mobile.items[0].labelGap} · ${mobile.items[0].labelStyle}`);
check("차량 실사 7종 좌향 표시", [...pc.items, ...mobile.items].every((item) => item.transform === "matrix(-1, 0, 0, 1, 0, 0)"), `PC ${pc.items[0].transform} · 모바일 ${mobile.items[0].transform}`);
check("포터 탑차 v03·포드 머스탱 v02 연결", [...pc.items, ...mobile.items].filter((item) => item.name === "화물/특장").every((item) => item.src.includes("vehicle_type_cargo_truck_v03.png")) && [...pc.items, ...mobile.items].filter((item) => item.name === "올드카").every((item) => item.src.includes("vehicle_type_old_car_v02.png")), "화물/특장 v03·올드카 v02");
check("404·콘솔 오류 0", pc.failures.length === 0 && mobile.failures.length === 0, `PC ${pc.failures.length} · 모바일 ${mobile.failures.length}`);
writeFileSync(join(outDir, "measurement.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: ${summary.checks.length - failed}/${summary.checks.length} 통과`);
process.exitCode = failed ? 1 : 0;
