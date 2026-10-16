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
      multiRails: document.querySelectorAll(".naverDiscussionMediaShell.is-multi").length,
      multiItems: document.querySelector(".naverDiscussionMediaShell.is-multi")?.querySelectorAll(".naverDiscussionMediaItem").length || 0,
      mediaRatios: new Set(Array.from(document.querySelectorAll(".naverDiscussionMediaItem[data-ratio]"), (item) => item.dataset.ratio)).size,
      videos: document.querySelectorAll(".naverDiscussionMediaItem[data-kind='video'] video").length,
      scrollSnap: getComputedStyle(document.querySelector(".naverDiscussionMediaShell.is-multi .naverDiscussionMediaRail")).scrollSnapType,
      scrollBehavior: getComputedStyle(document.querySelector(".naverDiscussionMediaShell.is-multi .naverDiscussionMediaRail")).scrollBehavior,
      snapStop: getComputedStyle(document.querySelector(".naverDiscussionMediaShell.is-multi .naverDiscussionMediaItem")).scrollSnapStop,
      pagination: document.querySelectorAll(".naverDiscussionMediaCount,.naverDiscussionMediaDots").length,
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
    if (measurements.multiRails < 1) throw new Error(`${width}px: 다중 사진 레일 없음`);
    if (measurements.multiItems < 2) throw new Error(`${width}px: 다중 사진 수 부족`);
    if (measurements.mediaRatios < 3) throw new Error(`${width}px: 사진 비율 다양성 부족`);
    if (measurements.videos < 1) throw new Error(`${width}px: 영상 카드 없음`);
    if (!measurements.scrollSnap.startsWith("x") || measurements.scrollSnap.includes("mandatory")) throw new Error(`${width}px: 가로 스냅이 부드러운 proximity가 아님 (${measurements.scrollSnap})`);
    if (measurements.scrollBehavior !== "auto") throw new Error(`${width}px: 네이티브 관성 스크롤이 아님 (${measurements.scrollBehavior})`);
    if (measurements.snapStop !== "normal") throw new Error(`${width}px: 카드마다 강제 정지가 남아 있음 (${measurements.snapStop})`);
    if (measurements.pagination !== 0) throw new Error(`${width}px: 페이지 번호 또는 도트가 남아 있음`);
    if (measurements.overflow !== 0) throw new Error(`${width}px: 가로 넘침 ${measurements.overflow}px`);

    if (width === 390) {
      await mkdir("reports/naver-discussion-feed-1016", { recursive: true });
      await page.screenshot({ path: "reports/naver-discussion-feed-1016/implementation-390x844.png", fullPage: false });
    }

    const rail = page.locator(".naverDiscussionMediaShell.is-multi .naverDiscussionMediaRail").first();
    await rail.evaluate((element) => {
      const items = element.querySelectorAll(".naverDiscussionMediaItem");
      const distance = items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
      element.style.scrollBehavior = "auto";
      element.scrollLeft = distance;
      element.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(250);
    const scrollState = await rail.evaluate((element) => {
      const item = element.querySelectorAll(".naverDiscussionMediaItem")[1];
      const railRect = element.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      return { scrollLeft: element.scrollLeft, leftDelta: Math.abs(itemRect.left - railRect.left) };
    });
    if (scrollState.scrollLeft <= 0 || scrollState.leftDelta > 2) throw new Error(`${width}px: 두 번째 미디어 스냅 실패`);

    const videoButton = page.locator("[data-discussion-video]").first();
    if (width === 390) {
      await videoButton.evaluate((button) => button.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(100);
      await page.screenshot({ path: "reports/naver-discussion-feed-1016/implementation-video-390x844.png", fullPage: false });
    }
    await videoButton.click();
    await page.waitForTimeout(300);
    const videoPaused = await page.locator(".naverDiscussionMediaItem[data-kind='video'] video").first().evaluate((video) => video.paused);
    if (videoPaused) throw new Error(`${width}px: 영상 재생 실패`);
    await page.locator(".naverDiscussionMediaItem[data-kind='video'] video").first().evaluate((video) => video.pause());

    const vote = page.locator('[data-discussion-vote="up"]').first();
    await vote.click();
    if ((await vote.getAttribute("aria-pressed")) !== "true") throw new Error(`${width}px: 버프 아이콘 선택 실패`);

    if (consoleErrors.length) throw new Error(`${width}px: 콘솔 오류\n${consoleErrors.join("\n")}`);
    console.log(`PASS ${width}px · cards ${measurements.cards} · multi rails ${measurements.multiRails} · ratios ${measurements.mediaRatios} · videos ${measurements.videos} · native momentum · proximity snap · pagination 0 · overflow 0`);
    await page.close();
  }
} finally {
  await browser.close();
}
