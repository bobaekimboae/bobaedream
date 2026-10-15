import { chromium } from "playwright";

const baseUrl = process.env.COMMUNITY_NOTION_WRITE_URL || "http://127.0.0.1:4174/community/notion-write.html";
const browser = await chromium.launch({ headless: true });

async function expect(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.removeItem("bbm.notion-write.v1");
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase("bbm-notion-write-media");
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(await page.getByTestId("notion-write-page").isVisible(), "전용 글쓰기 페이지가 보이지 않습니다.");
  const estimateButton = page.getByTestId("car-estimate-button");
  await expect(await estimateButton.isVisible(), "내 차 시세 무료 견적 버튼이 보이지 않습니다.");
  await expect((await estimateButton.getAttribute("href")) === "https://app.notion.com/p/1-701ee9c4b60683d0ae0801d3de2248fb?source=copy_link", "무료 견적 버튼 주소가 일치하지 않습니다.");
  await expect((await estimateButton.getAttribute("target")) === "_blank", "무료 견적 버튼이 새 창으로 열리지 않습니다.");
  await page.getByTestId("notion-title").fill("퇴근길에 만난 멋진 자동차");
  await page.getByTestId("notion-editor").click();
  await page.keyboard.type("사진과 동영상을 한 페이지에서 정리했습니다.");

  await page.evaluate(() => {
    const paragraph = document.querySelector("#blockEditor p");
    const text = paragraph.firstChild;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 3);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.querySelector("#blockEditor").dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Shift" }));
  });
  await page.waitForTimeout(50);
  const toolbarDebug = await page.evaluate(() => ({ selected: window.getSelection()?.toString(), hidden: document.querySelector("#textToolbar").hidden }));
  await expect(await page.getByTestId("text-toolbar").isVisible(), `텍스트 선택 도구막대가 보이지 않습니다: ${JSON.stringify(toolbarDebug)}`);
  await page.locator('#textToolbar [data-format="bold"]').click();
  await expect(await page.locator("#blockEditor strong, #blockEditor b").first().isVisible(), "굵게 서식이 적용되지 않았습니다.");

  await page.evaluate(() => {
    const paragraph = document.querySelector("#blockEditor p");
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const text = walker.nextNode();
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, Math.min(3, text.textContent.length));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.querySelector("#blockEditor").dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Shift" }));
  });
  await page.locator('#textToolbar [data-format="link"]').click();
  await page.locator("#textLinkUrl").fill("https://www.bobaedream.co.kr/");
  await page.locator("#saveTextLinkButton").click();
  await expect((await page.locator('#blockEditor a[href="https://www.bobaedream.co.kr/"]').getAttribute("target")) === "_blank", "텍스트 링크가 적용되지 않았습니다.");

  await page.locator('[data-action="add-image"]').click();
  await expect(await page.locator("#mediaDialog").isVisible(), "이미지 추가 창이 열리지 않습니다.");
  await page.locator("#imageInput").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  const imageBlock = page.locator('.media-block[data-kind="image"]');
  await imageBlock.waitFor();
  await imageBlock.locator(".media-surface").click();
  await imageBlock.locator('[data-media-action="width"]').selectOption("small");
  await imageBlock.locator(".media-caption").fill("자동차 전면 사진");
  await imageBlock.locator('[data-media-action="alt"]').click();
  await page.locator("#altText").fill("주차장에 세워진 검은색 세단");
  await page.locator("#saveAltButton").click();
  await expect(await imageBlock.locator(".alt-chip").isVisible(), "대체 텍스트 표시가 없습니다.");

  await page.locator('[data-action="add-video"]').click();
  await page.locator("#linkTab").click();
  await page.locator("#mediaUrl").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.locator("#embedButton").click();
  const videoBlock = page.locator('.media-block[data-kind="video"]');
  await videoBlock.waitFor();
  await expect((await videoBlock.locator("iframe").getAttribute("src"))?.includes("youtube-nocookie.com/embed/"), "YouTube 동영상 링크가 임베드로 변환되지 않았습니다.");

  await page.locator('[data-action="add-embed"]').click();
  await expect(await page.locator("#embedDialog").isVisible(), "임베드 추가 창이 열리지 않습니다.");
  await page.locator("#embedUrl").fill("https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl");
  await page.locator("#insertEmbedButton").click();
  const embedBlock = page.locator('.media-block[data-kind="embed"]').first();
  await embedBlock.waitFor();
  await expect((await embedBlock.locator("iframe").getAttribute("src"))?.includes("open.spotify.com/embed/track/"), "Spotify 주소가 임베드로 변환되지 않았습니다.");
  await embedBlock.locator(".media-surface").click();
  await embedBlock.locator('[data-media-action="height"]').selectOption("compact");
  await embedBlock.locator('[data-media-action="replace"]').click();
  await page.locator("#embedUrl").fill("https://codepen.io/team/codepen/pen/PNaGbb");
  await page.locator("#insertEmbedButton").click();
  const replacedEmbedSrc = await page.locator('.media-block[data-kind="embed"] iframe').first().getAttribute("src");
  await expect(replacedEmbedSrc?.includes("codepen.io/team/codepen/embed/PNaGbb"), `임베드 교체가 적용되지 않았습니다: ${replacedEmbedSrc}`);

  await page.locator('[data-action="add-embed"]').click();
  await page.locator("#embedUrl").fill("https://example.com/article");
  await page.locator("#insertEmbedButton").click();
  const bookmarkBlock = page.locator('.media-block[data-kind="embed"][data-embed-render="bookmark"]');
  await expect(await bookmarkBlock.locator(".embed-card").isVisible(), "미지원 사이트가 링크 카드로 대체되지 않았습니다.");
  await bookmarkBlock.locator(".media-surface").click();
  await bookmarkBlock.locator('[data-media-action="delete"]').click();

  const tailParagraph = page.getByTestId("notion-editor").locator("p").last();
  await tailParagraph.click();
  await page.keyboard.type("/");
  await page.locator('[data-command="heading2"]').click();
  await page.keyboard.type("차량 상태");
  const headingCreated = await page.locator("#blockEditor h2", { hasText: "차량 상태" }).isVisible().catch(() => false);
  await expect(headingCreated, `제목 2 블록이 생성되지 않았습니다: ${await page.locator("#blockEditor").innerHTML()}`);
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await page.locator('[data-command="todo"]').click();
  const todo = page.locator("#blockEditor .todo-block").last();
  await todo.locator("span").fill("보험 이력 확인");
  await todo.locator('input[type="checkbox"]').check();
  await expect(await todo.evaluate((node) => node.classList.contains("is-done")), "할 일 완료 상태가 적용되지 않았습니다.");
  await todo.locator("span").press("Enter");
  const emptyTodo = page.locator("#blockEditor .todo-block").last();
  await emptyTodo.locator("span").press("Enter");
  await page.keyboard.type("/");
  await page.locator('[data-command="code"]').click();
  await page.keyboard.type("const car = 'ready';");
  await expect(await page.locator("#blockEditor pre", { hasText: "const car" }).isVisible(), "코드 블록이 생성되지 않았습니다.");
  await page.keyboard.press("Control+Enter");
  await page.keyboard.type("## ");
  await page.keyboard.type("빠른 입력 제목");
  await expect(await page.locator("#blockEditor h2", { hasText: "빠른 입력 제목" }).isVisible(), "마크다운 제목 단축키가 동작하지 않았습니다.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await page.locator('[data-command="numbered-list"]').click();
  await page.keyboard.type("점검 완료");
  await expect(await page.locator("#blockEditor ol li", { hasText: "점검 완료" }).isVisible(), "번호 목록이 생성되지 않았습니다.");

  await page.getByTestId("notion-editor").locator("p").last().click();
  await page.keyboard.type("/");
  await expect(await page.getByTestId("block-menu").isVisible(), "슬래시 블록 메뉴가 열리지 않습니다.");
  await expect(await page.locator('[data-command="embed"]').isVisible(), "슬래시 메뉴에 임베드 명령이 없습니다.");
  await page.locator('[data-command="divider"]').click();

  await page.locator('[data-action="preview"]').click();
  await expect(await page.locator("#previewDialog").isVisible(), "미리보기 창이 열리지 않습니다.");
  await expect((await page.locator("#previewTitle").textContent()) === "퇴근길에 만난 멋진 자동차", "미리보기 제목이 일치하지 않습니다.");
  await page.locator('[data-action="close-preview"]').click();

  await page.waitForTimeout(850);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect((await page.getByTestId("notion-title").inputValue()) === "퇴근길에 만난 멋진 자동차", "제목 자동 저장이 복원되지 않았습니다.");
  await expect(await page.locator('.media-block[data-kind="image"] img').getAttribute("src"), "업로드 이미지가 복원되지 않았습니다.");
  await expect(await page.locator('.media-block[data-kind="video"] iframe').getAttribute("src"), "링크 동영상이 복원되지 않았습니다.");
  await expect((await page.locator('.media-block[data-kind="embed"] iframe').getAttribute("src"))?.includes("codepen.io/team/codepen/embed/PNaGbb"), "임베드 블록이 복원되지 않았습니다.");
  await expect(await page.locator("#blockEditor .todo-block.is-done").isVisible(), "할 일 완료 상태가 복원되지 않았습니다.");
  await expect(await page.locator("#blockEditor pre", { hasText: "const car" }).isVisible(), "코드 블록이 복원되지 않았습니다.");
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await expect(await mobilePage.getByTestId("notion-title").isVisible(), "모바일 제목 입력란이 보이지 않습니다.");
  await expect(await mobilePage.locator("#blockAddButton").isVisible(), "모바일 블록 추가 버튼이 보이지 않습니다.");
  await mobilePage.locator('[data-action="add-image"]').click();
  const mobileMediaDialog = mobilePage.locator("#mediaDialog");
  await expect(await mobileMediaDialog.isVisible(), "모바일 이미지 첨부 화면이 열리지 않습니다.");
  const mobileDialogBox = await mobileMediaDialog.evaluate((dialog) => {
    const rect = dialog.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  await expect(mobileDialogBox.width >= 389 && mobileDialogBox.height >= 843, `모바일 이미지 첨부 화면이 전체 화면이 아닙니다: ${JSON.stringify(mobileDialogBox)}`);
  await expect(await mobilePage.getByTestId("mobile-image-picker").isVisible(), "Notion형 모바일 이미지 선택 목록이 보이지 않습니다.");
  await expect(await mobileMediaDialog.getByText("사진 보관함", { exact: true }).isVisible(), "사진 보관함 선택지가 없습니다.");
  await expect(await mobileMediaDialog.getByText("사진 또는 비디오 찍기", { exact: true }).isVisible(), "카메라 선택지가 없습니다.");
  await expect(await mobileMediaDialog.getByText("파일 선택", { exact: true }).isVisible(), "파일 선택지가 없습니다.");
  await mobileMediaDialog.getByRole("button", { name: "닫기" }).click();
  const hasHorizontalOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await expect(!hasHorizontalOverflow, "모바일 화면에 가로 스크롤이 생겼습니다.");
  await mobileContext.close();

  console.log("Notion write check passed: rich text, blocks, media, embeds, persistence, and mobile layout.");
} finally {
  await browser.close();
}
