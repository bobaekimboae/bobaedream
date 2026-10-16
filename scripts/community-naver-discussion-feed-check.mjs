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
      sortRows: document.querySelectorAll(".naverDiscussionSortRow").length,
      cleanbots: document.querySelectorAll(".naverDiscussionCleanbot").length,
      hotModules: document.querySelectorAll(".naverDiscussionHot").length,
      votes: document.querySelectorAll("[data-discussion-vote]").length,
      visibleVoteLabels: Array.from(document.querySelectorAll("[data-discussion-vote]"))
        .filter((button) => /버프|너프/.test(button.textContent || "")).length,
      cards: document.querySelectorAll(".naverDiscussionCard").length,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }));

    if (measurements.label !== "네이버 토론형") throw new Error(`${width}px: 보기 방식 라벨 불일치`);
    if (measurements.tabs !== 0) throw new Error(`${width}px: 상단 탭이 남아 있음`);
    if (measurements.rooms !== 0) throw new Error(`${width}px: 토론방 선택이 남아 있음`);
    if (measurements.keywords !== 0) throw new Error(`${width}px: 키워드 영역이 남아 있음`);
    if (measurements.sortRows !== 0) throw new Error(`${width}px: 정렬 행이 남아 있음`);
    if (measurements.cleanbots !== 0) throw new Error(`${width}px: 클린봇 영역이 남아 있음`);
    if (measurements.hotModules !== 0) throw new Error(`${width}px: HOT 모듈이 남아 있음`);
    if (measurements.votes !== measurements.cards * 2) throw new Error(`${width}px: 버프·너프 아이콘 개수 불일치`);
    if (measurements.visibleVoteLabels !== 0) throw new Error(`${width}px: 버프·너프 텍스트가 노출됨`);
    if (measurements.cards < 1) throw new Error(`${width}px: 게시물 카드 없음`);
    if (measurements.overflow !== 0) throw new Error(`${width}px: 가로 넘침 ${measurements.overflow}px`);

    if (width === 390) {
      await mkdir("reports/naver-discussion-feed-1016", { recursive: true });
      await page.screenshot({ path: "reports/naver-discussion-feed-1016/implementation-390x844.png", fullPage: false });
    }

    const vote = page.locator('[data-discussion-vote="up"]').first();
    await vote.click();
    if ((await vote.getAttribute("aria-pressed")) !== "true") throw new Error(`${width}px: 버프 아이콘 선택 실패`);

    if (consoleErrors.length) throw new Error(`${width}px: 콘솔 오류\n${consoleErrors.join("\n")}`);
    console.log(`PASS ${width}px · feed-only cards ${measurements.cards} · icon votes ${measurements.votes} · labels 0 · overflow 0`);
    await page.close();
  }
} finally {
  await browser.close();
}
