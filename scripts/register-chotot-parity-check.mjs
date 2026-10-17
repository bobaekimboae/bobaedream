import { chromium } from "playwright";
import path from "node:path";

const url = process.env.REGISTER_URL || "http://172.30.1.200:4174/?register";
const capturePath = process.env.REGISTER_CAPTURE;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const chooseOption = async (fieldId, option, capture = false) => {
  await page.locator(`#${fieldId}`).click();
  const picker = page.getByRole("dialog", { name: /\uC120\uD0DD$/ });
  await picker.waitFor();
  if (capture && capturePath) {
    await page.waitForTimeout(220);
    await page.screenshot({ path: capturePath });
  }
  await picker.getByRole("radio", { name: option, exact: true }).click();
};

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("main", { name: "자동차 매물 등록" }).waitFor();

  const actionLabels = await page.locator(".ct-register-actions button").allTextContents();
  if (actionLabels.join("|") !== "미리보기|임시저장|등록하기") throw new Error(`하단 액션 불일치: ${actionLabels.join("|")}`);

  const initialMediaCount = await page.locator(".ct-media-thumb").count();
  if (initialMediaCount !== 1) throw new Error(`초기 미디어 수 불일치: ${initialMediaCount}`);

  await page.locator(".ct-native-file").first().setInputFiles(path.resolve("public/assets/cars/supercar-sheet-v01/sc-019.jpg"));
  if (await page.locator(".ct-media-thumb").count() !== 2) throw new Error("이미지 추가 실패");

  await page.locator("#ct-price").fill("3500");
  await chooseOption("ct-address", "서울특별시");
  await chooseOption("ct-category", "자동차 / SUV", true);
  await chooseOption("ct-transmission", "자동");
  await chooseOption("ct-fuel", "가솔린");

  if (await page.locator(".ct-field-button select").count()) throw new Error("모바일 네이티브 select가 남아 있음");
  if ((await page.locator("#ct-category").innerText()).trim() !== "자동차 / SUV") throw new Error("선택값 반영 실패");
  await page.locator("#ct-category").click();
  await page.getByRole("dialog", { name: "카테고리 선택" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "카테고리 선택" }).waitFor({ state: "hidden" });
  if (await page.evaluate(() => document.body.style.overflow)) throw new Error("선택창 종료 후 스크롤 잠금 해제 실패");

  await page.getByRole("button", { name: "미리보기" }).click();
  await page.getByRole("dialog", { name: "매물 미리보기" }).waitFor();
  await page.getByRole("button", { name: "미리보기 닫기" }).click();

  await page.getByRole("button", { name: "임시저장" }).click();
  const draft = await page.evaluate(() => localStorage.getItem("bbm-register-draft"));
  if (!draft) throw new Error("임시저장 실패");

  await page.getByRole("button", { name: "등록하기" }).click();
  await page.getByRole("status").filter({ hasText: "등록 전 최종 확인이 완료되었습니다." }).waitFor();

  const layout = await page.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    fieldColumns: getComputedStyle(document.querySelector(".ct-detail-grid")).gridTemplateColumns,
  }));
  if (layout.scrollWidth > layout.innerWidth) throw new Error(`가로 넘침: ${JSON.stringify(layout)}`);
  if (!layout.fieldColumns.includes("px")) throw new Error(`상세 2열 실패: ${layout.fieldColumns}`);
  if (consoleErrors.length) throw new Error(`콘솔 오류: ${consoleErrors.join(" | ")}`);

  console.log(JSON.stringify({ ok: true, url, actionLabels, initialMediaCount, finalMediaCount: 2, layout, consoleErrors }, null, 2));
} finally {
  await browser.close();
}
