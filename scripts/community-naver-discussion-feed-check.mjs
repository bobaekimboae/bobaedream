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
      singleRails: document.querySelectorAll(".naverDiscussionMediaShell:not(.is-multi)").length,
      multiItems: document.querySelector(".naverDiscussionMediaShell.is-multi")?.querySelectorAll(".naverDiscussionMediaItem").length || 0,
      mediaLinks: document.querySelectorAll(".naverDiscussionMediaLink").length,
      mediaRatios: new Set(Array.from(document.querySelectorAll(".naverDiscussionMediaItem[data-ratio]"), (item) => item.dataset.ratio)).size,
      videos: document.querySelectorAll(".naverDiscussionMediaItem[data-kind='video'] video").length,
      videoButtons: document.querySelectorAll("[data-discussion-video]").length,
      brokenImages: Array.from(document.querySelectorAll(".naverDiscussionMediaItem img")).filter((image) => image.complete && image.naturalWidth === 0).length,
      eagerImages: document.querySelectorAll(".naverDiscussionMediaItem img[fetchpriority='high']").length,
      lazyImages: document.querySelectorAll(".naverDiscussionMediaItem img[loading='lazy']").length,
      validDetailLinks: Array.from(document.querySelectorAll(".naverDiscussionCard")).every((card) => {
        const id = card.dataset.discussionPost;
        const links = card.querySelectorAll(".naverDiscussionTitle,.naverDiscussionMediaLink");
        return Array.from(links).every((link) => new URL(link.href).searchParams.get("id") === id);
      }),
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
    if (measurements.singleRails < 1) throw new Error(`${width}px: 단일 사진 카드 없음`);
    if (measurements.multiItems < 2) throw new Error(`${width}px: 다중 사진 수 부족`);
    if (measurements.mediaLinks < 1) throw new Error(`${width}px: 사진 상세 링크 없음`);
    if (measurements.mediaRatios < 3) throw new Error(`${width}px: 사진 비율 다양성 부족`);
    if (measurements.videos < 1) throw new Error(`${width}px: 영상 카드 없음`);
    if (measurements.videoButtons !== measurements.videos) throw new Error(`${width}px: 영상 재생 버튼 수 불일치`);
    if (measurements.brokenImages !== 0) throw new Error(`${width}px: 깨진 미디어 이미지 ${measurements.brokenImages}개`);
    if (measurements.eagerImages !== 1) throw new Error(`${width}px: 첫 이미지 우선 로딩 수 불일치 (${measurements.eagerImages})`);
    if (measurements.lazyImages < 1) throw new Error(`${width}px: 후속 이미지 지연 로딩 없음`);
    if (!measurements.validDetailLinks) throw new Error(`${width}px: 제목 또는 사진의 상세 ID 연결 오류`);
    if (measurements.scrollSnap !== "none") throw new Error(`${width}px: 가변 폭 미디어의 강제 스냅이 남아 있음 (${measurements.scrollSnap})`);
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
      element.scrollLeft = 63;
      element.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(250);
    const scrollLeft = await rail.evaluate((element) => element.scrollLeft);
    if (Math.abs(scrollLeft - 63) > 1) throw new Error(`${width}px: 자유 스크롤 위치가 강제 보정됨 (${scrollLeft}px)`);

    const videoButton = page.locator("[data-discussion-video]").first();
    if (width === 390) {
      await videoButton.evaluate((button) => button.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(100);
      await page.screenshot({ path: "reports/naver-discussion-feed-1016/implementation-video-390x844.png", fullPage: false });
    }
    await videoButton.click();
    await page.waitForTimeout(300);
    const firstVideo = page.locator(".naverDiscussionMediaItem[data-kind='video'] video").first();
    const firstVideoState = await firstVideo.evaluate((video) => ({ paused: video.paused, controls: video.controls }));
    if (firstVideoState.paused || !firstVideoState.controls) throw new Error(`${width}px: 첫 영상 재생 또는 컨트롤 노출 실패`);
    if ((await videoButton.getAttribute("aria-label")) !== "영상 일시정지") throw new Error(`${width}px: 영상 재생 상태 접근성 문구 불일치`);

    const secondVideoButton = page.locator("[data-discussion-video]").nth(1);
    await secondVideoButton.click();
    await page.waitForTimeout(300);
    const videoSwitchState = await page.locator(".naverDiscussionMediaItem[data-kind='video'] video").evaluateAll((videos) => ({ firstPaused: videos[0].paused, secondPaused: videos[1].paused }));
    if (!videoSwitchState.firstPaused || videoSwitchState.secondPaused) throw new Error(`${width}px: 영상 전환 시 이전 영상 자동 정지 실패`);
    await page.locator(".naverDiscussionMediaItem[data-kind='video'] video").nth(1).evaluate((video) => video.pause());

    const voteCard = page.locator(".naverDiscussionCard").first();
    const upVote = voteCard.locator('[data-discussion-vote="up"]');
    const downVote = voteCard.locator('[data-discussion-vote="down"]');
    await upVote.click();
    if ((await upVote.getAttribute("aria-pressed")) !== "true") throw new Error(`${width}px: 버프 아이콘 선택 실패`);
    await downVote.click();
    if ((await upVote.getAttribute("aria-pressed")) !== "false" || (await downVote.getAttribute("aria-pressed")) !== "true") throw new Error(`${width}px: 버프·너프 상호 배타 선택 실패`);
    await downVote.click();
    if ((await downVote.getAttribute("aria-pressed")) !== "false") throw new Error(`${width}px: 너프 재선택 해제 실패`);

    if (consoleErrors.length) throw new Error(`${width}px: 콘솔 오류\n${consoleErrors.join("\n")}`);
    const commentButton = voteCard.locator("[data-discussion-comment]");
    const commentId = await commentButton.getAttribute("data-discussion-comment");
    await Promise.all([
      page.waitForURL((target) => target.pathname.endsWith("/community/chzzk-detail.html")),
      commentButton.click(),
    ]);
    const commentUrl = new URL(page.url());
    if (commentUrl.searchParams.get("id") !== commentId || commentUrl.hash !== "#comments") throw new Error(`${width}px: 댓글 상세 이동 실패`);

    console.log(`PASS ${width}px · 18 scenarios · cards ${measurements.cards} · single/multi ${measurements.singleRails}/${measurements.multiRails} · ratios ${measurements.mediaRatios} · videos ${measurements.videos} · free native scroll · pagination 0 · overflow 0`);
    await page.close();
  }
} finally {
  await browser.close();
}
