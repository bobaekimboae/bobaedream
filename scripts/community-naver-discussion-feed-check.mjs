import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.BBM_PREVIEW_URL || "http://127.0.0.1:5173";
const url = `${baseUrl}/community/naver-cafe-list.html?view=naver-discussion`;
const widths = [360, 390, 412];
const browser = await chromium.launch({ headless: true });

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(".naverDiscussionMode").waitFor();

    const measurements = await page.evaluate(() => ({
      label: document.querySelector("#typeLabel")?.textContent?.trim(),
      tabs: document.querySelectorAll(".naverDiscussionTab").length,
      rooms: document.querySelectorAll(".naverDiscussionRoom").length,
      keywords: document.querySelectorAll(".naverDiscussionKeyword").length,
      cards: document.querySelectorAll(".naverDiscussionCard").length,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }));

    if (measurements.label !== "네이버 토론형") throw new Error(`${width}px: 보기 방식 라벨 불일치`);
    if (measurements.tabs !== 4) throw new Error(`${width}px: 상단 탭 개수 불일치`);
    if (measurements.rooms !== 5) throw new Error(`${width}px: 토론방 개수 불일치`);
    if (measurements.keywords !== 8) throw new Error(`${width}px: 키워드 개수 불일치`);
    if (measurements.cards < 1) throw new Error(`${width}px: 게시물 카드 없음`);
    if (measurements.overflow !== 0) throw new Error(`${width}px: 가로 넘침 ${measurements.overflow}px`);

    if (width === 390) {
      await mkdir("reports/naver-discussion-feed-1016", { recursive: true });
      await page.screenshot({ path: "reports/naver-discussion-feed-1016/implementation-390x844.png", fullPage: false });
    }

    await page.locator('[data-discussion-room="자동차"]').click();
    if ((await page.locator(".naverDiscussionCard").count()) < 1) throw new Error(`${width}px: 자동차 토론방 결과 없음`);

    await page.locator('[data-discussion-keyword="테슬라"]').click();
    if ((await page.locator(".naverDiscussionCard").count()) < 1) throw new Error(`${width}px: 테슬라 키워드 결과 없음`);

    await page.locator(".naverDiscussionSort").click();
    await page.locator('[data-discussion-sort="최신순"]').click();
    if ((await page.locator(".naverDiscussionSort").innerText()).trim() !== "최신순") throw new Error(`${width}px: 최신순 전환 실패`);

    const vote = page.locator('[data-discussion-vote="up"]').first();
    await vote.click();
    if ((await vote.getAttribute("aria-pressed")) !== "true") throw new Error(`${width}px: 버프 상태 전환 실패`);

    if (consoleErrors.length) throw new Error(`${width}px: 콘솔 오류\n${consoleErrors.join("\n")}`);
    console.log(`PASS ${width}px · cards ${measurements.cards} · overflow 0 · interactions OK`);
    await page.close();
  }
} finally {
  await browser.close();
}
