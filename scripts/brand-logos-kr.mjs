#!/usr/bin/env node
// QF-114: 트럭 제조사 타타대우 · 만(MAN) 추가(당근 제조사 이미지)
// QF-096: 과쯔 모드 제조사 로고 준비 — 원본 받기 → 알파 16 이하 여백 자르기 → 192×112 안에 비율 유지(키우지 않음) → PNG.
// 출력: public/assets/brand/kr/{slug}.png · manifest.json · CREDITS.md, 검수용 reports/qf-096/contact-sheet.png
// 새 패키지 없이 Playwright 크로미움 캔버스로 디코딩·자르기·축소한다. 다시 돌리면 같은 결과로 덮어쓴다.
// 사용: node scripts/brand-logos-kr.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join("public", "assets", "brand", "kr");
const SHEET_DIR = join("reports", "qf-096");
mkdirSync(OUT, { recursive: true });
mkdirSync(SHEET_DIR, { recursive: true });

const DAANGN = "당근";
const AUTOHOME = "오토홈";
// 좌측 필터 이름(src/prototype/listing/pc-bbmuseum.tsx) · slug · 출처 · 원본 URL — QF-096 지시 표 그대로
const TABLE = `국산	현대	hyundai	당근	https://assetstorage.krrt.io/1584808088326110608/2accf014-d825-4de4-a935-a22a7381cd28/width_360_height_240.webp
국산	제네시스	genesis	당근	https://assetstorage.krrt.io/1584808088326110608/4dadc64a-e9ec-450f-8fbb-21ec861b23be/width_360_height_240.webp
국산	기아	kia	당근	https://assetstorage.krrt.io/1584808088326110608/806980d2-2ab0-4b44-8c3a-377306f3f595/width_360_height_240.webp
국산	쉐보레(국산)	chevrolet	당근	https://assetstorage.krrt.io/1584808088326110608/ed8a8bf1-4ef6-4906-a1eb-5e88ce2fec19/width_360_height_240.webp
국산	르노코리아(삼성)	renault	오토홈	https://car3.autoimg.cn/cardfs/series/g6/M10/85/BF/autohomecar__Chxkj2DukI-AKWplAAASndx3lLE835.png
국산	KG모빌리티(쌍용)	kgm	당근	https://assetstorage.krrt.io/1584808088326110608/5b72bca9-ca86-48b8-80b1-c3950ca3581d/width_360_height_240.webp
국산	어울림모터스	eoullim	당근	https://assetstorage.krrt.io/1584808088326110608/be965c69-dd8c-4c40-be30-d66c29286dbc/width_360_height_240.webp
수입	BMW	bmw	당근	https://assetstorage.krrt.io/1584808088326110608/1917dcaa-b707-499d-b306-395fe7cd7d5a/width_360_height_240.webp
수입	BYD	byd	오토홈	https://car2.autoimg.cn/cardfs/series/g27/M0B/39/7F/autohomecar__CjIFVWTLOcOAIopLAABKh3_XoY8154.png
수입	DS	ds	당근	https://assetstorage.krrt.io/1584808088326110608/9283cd32-0d20-47e6-85ff-4a01cd0e0ef2/width_360_height_240.webp
수입	GMC	gmc	당근	https://assetstorage.krrt.io/1584808088326110608/b3e7c265-ceda-40bc-8e7d-3f302982653d/width_360_height_240.webp
수입	닛산	nissan	당근	https://assetstorage.krrt.io/1584808088326110608/72f8297a-ea1c-4893-8e8d-fa9dff4af04f/width_360_height_240.webp
수입	다이하쓰	daihatsu	당근	https://assetstorage.krrt.io/1584808088326110608/6e723783-281a-457d-80b4-6f38ad94d70b/width_360_height_240.webp
수입	닷지	dodge	당근	https://assetstorage.krrt.io/1584808088326110608/7beed1ac-cb04-42c1-9fac-c04cbb7e14c6/width_360_height_240.webp
수입	동펑	dfsk	당근	https://assetstorage.krrt.io/1584808088326110608/03319bb3-f983-4c43-91d4-1e298175d36d/width_360_height_240.webp
수입	란치아	lancia	당근	https://assetstorage.krrt.io/1584808088326110608/cb22606c-4b0a-4548-9b0b-656997c641bd/width_360_height_240.webp
수입	람보르기니	lamborghini	오토홈	https://car3.autoimg.cn/cardfs/series/g32/M01/53/D2/autohomecar__ChxkPWb094SAHi7wAAFPgIT9lfo199.png
수입	랜드로버	land-rover	당근	https://assetstorage.krrt.io/1584808088326110608/94536325-2f9b-4705-816c-95338706bcee/width_360_height_240.webp
수입	렉서스	lexus	당근	https://assetstorage.krrt.io/1584808088326110608/0aa05d33-d5c2-40cc-9786-6198af137da3/width_360_height_240.webp
수입	로버	mg-rover	당근	https://assetstorage.krrt.io/1584808088326110608/3e58cdc6-2e1c-4695-962a-cb057b17b885/width_360_height_240.webp
수입	로터스	lotus	당근	https://assetstorage.krrt.io/1584808088326110608/82515018-869b-459b-9880-b616fdd058d3/width_360_height_240.webp
수입	롤스로이스	rolls-royce	당근	https://assetstorage.krrt.io/1584808088326110608/ebaa0451-59ec-4d0a-9dbd-01bbc57a6625/width_360_height_240.webp
수입	르노	renault	오토홈	https://car3.autoimg.cn/cardfs/series/g6/M10/85/BF/autohomecar__Chxkj2DukI-AKWplAAASndx3lLE835.png
수입	링컨	lincoln	당근	https://assetstorage.krrt.io/1584808088326110608/21005e27-6a54-4e2f-a939-18c67f7765bd/width_360_height_240.webp
수입	마세라티	maserati	당근	https://assetstorage.krrt.io/1584808088326110608/8ac10cb1-1ce9-4656-ac45-89af24d5f105/width_360_height_240.webp
수입	마이바흐	maybach	오토홈	https://car3.autoimg.cn/cardfs/series/g26/M04/10/B6/autohomecar__ChtlxWUNeQ6AHwRZAAGD7tbdbac971.png
수입	마쯔다	mazda	오토홈	https://car3.autoimg.cn/cardfs/series/g33/M05/9A/21/autohomecar__ChxpVWnxyuWAfnTzAAB2Yh5JnZU141.png
수입	맥라렌	mclaren	당근	https://assetstorage.krrt.io/1584808088326110608/82f2f738-d518-406a-9e85-c00fe5a177e9/width_360_height_240.webp
수입	머큐리	mercury	당근	https://assetstorage.krrt.io/1584808088326110608/f5e0a5cc-5ceb-4faa-a661-36cf493b8010/width_360_height_240.webp
수입	미니	mini	당근	https://assetstorage.krrt.io/1584808088326110608/4eb04474-5fd7-410b-84f4-c3debce37dcf/width_360_height_240.webp
수입	미쓰비시	mitsubishi	당근	https://assetstorage.krrt.io/1584808088326110608/491477e4-156d-4318-a152-3189f260c270/width_360_height_240.webp
수입	미쯔오카	mitsuoka	당근	https://assetstorage.krrt.io/1584808088326110608/280fe70a-1c89-47ad-8836-09c91d60b2ff/width_360_height_240.webp
수입	벤츠	mercedes-benz	당근	https://assetstorage.krrt.io/1584808088326110608/d4aab2c7-ead1-4ec5-9de7-27e009af084d/width_360_height_240.webp
수입	벤틀리	bentley	당근	https://assetstorage.krrt.io/1584808088326110608/569e9cf9-cbe3-44ef-bfe6-7ef21851b064/width_360_height_240.webp
수입	볼보	volvo	당근	https://assetstorage.krrt.io/1584808088326110608/62cd7418-809d-4906-b62f-dcc938dab6e6/width_360_height_240.webp
수입	부가티	bugatti	당근	https://assetstorage.krrt.io/1584808088326110608/4cccf143-496f-49d7-8120-60c53fccdb32/width_360_height_240.webp
수입	북기은상	baic-yinxiang	당근	https://assetstorage.krrt.io/1584808088326110608/92cab266-2ca1-4541-9889-5fed1d92721e/width_360_height_240.webp
수입	뷰익	buick	당근	https://assetstorage.krrt.io/1584808088326110608/ad919c46-6b7b-4539-8f57-14b4196d9cae/width_360_height_240.webp
수입	사브	saab	당근	https://assetstorage.krrt.io/1584808088326110608/2c77bfc2-aac9-4770-9d7d-16757c07fbd5/width_360_height_240.webp
수입	새턴	saturn	당근	https://assetstorage.krrt.io/1584808088326110608/1dd867b5-54c4-42f0-a9a8-086b96a3b2bf/width_360_height_240.webp
수입	선롱	sunlong	당근	https://assetstorage.krrt.io/1584808088326110608/0b111746-4198-4c2d-8e75-b44384f116f4/width_360_height_240.webp
수입	쉐보레	chevrolet	당근	https://assetstorage.krrt.io/1584808088326110608/ed8a8bf1-4ef6-4906-a1eb-5e88ce2fec19/width_360_height_240.webp
수입	스마트	smart	오토홈	https://car2.autoimg.cn/cardfs/series/g24/M09/4D/31/autohomecar__Chtk3WTLPFiADme1AABSunYlMPQ531.png
수입	스바루	subaru	오토홈	https://car2.autoimg.cn/cardfs/series/g27/M0B/5F/69/autohomecar__ChxkmWS-PU-AMzmzAAJv9eajRO0786.png
수입	스즈키	suzuki	당근	https://assetstorage.krrt.io/1584808088326110608/3ab59003-b42e-432f-ada1-f0de0ed70e35/width_360_height_240.webp
수입	스카니아	scania	당근	https://assetstorage.krrt.io/1584808088326110608/a4fcdf5f-a5b1-4d15-add4-c678a68d7923/width_360_height_240.webp
수입	시트로엥	citroen	당근	https://assetstorage.krrt.io/1584808088326110608/a5a53a87-e1cc-445d-81ee-8b14f065e7b1/width_360_height_240.webp
수입	아우디	audi	당근	https://assetstorage.krrt.io/1584808088326110608/d820b6b4-cebe-4852-ba89-350182f95c88/width_360_height_240.webp
수입	알파로메오	alfa-romeo	당근	https://assetstorage.krrt.io/1584808088326110608/d1e2bb61-333d-4c0f-9878-cea2e97b8290/width_360_height_240.webp
수입	애스턴마틴	aston-martin	당근	https://assetstorage.krrt.io/1584808088326110608/45d7f0bf-ff0a-4923-ac2e-35d640fbd0af/width_360_height_240.webp
수입	오펠	opel	당근	https://assetstorage.krrt.io/1584808088326110608/c3d20b38-898a-4ebe-ab42-7f23f1d4dcdd/width_360_height_240.webp
수입	올즈모빌	oldsmobile	당근	https://assetstorage.krrt.io/1584808088326110608/74348671-fb55-4100-9487-44a37cf708f4/width_360_height_240.webp
수입	이베코	iveco	당근	https://assetstorage.krrt.io/1584808088326110608/69bd0dde-caec-466a-b578-759415c12369/width_360_height_240.webp
국산	타타대우	tata-daewoo	당근	https://assetstorage.krrt.io/1584808088326110608/5518b962-f7a7-46c9-b64a-a88a3db6bdbd/width_360_height_240.webp
수입	만(MAN)	man	당근	https://assetstorage.krrt.io/1584808088326110608/8f297dfc-13d5-4d69-9abd-0ffcf2d07679/width_360_height_240.webp
수입	이스즈	isuzu	당근	https://assetstorage.krrt.io/1584808088326110608/673407c7-7f7e-40fd-a978-94bee1496528/width_360_height_240.webp
수입	인피니티	infiniti	당근	https://assetstorage.krrt.io/1584808088326110608/ad881355-aebd-49c2-ab7a-ace016e269ef/width_360_height_240.webp
수입	재규어	jaguar	당근	https://assetstorage.krrt.io/1584808088326110608/fade6361-8103-4640-95fe-88f81e7b7fe7/width_360_height_240.webp
수입	지프	jeep	당근	https://assetstorage.krrt.io/1584808088326110608/45e8090d-f769-4c1b-8eed-fe767db9e4d7/width_360_height_240.webp
수입	캐딜락	cadillac	오토홈	https://car3.autoimg.cn/cardfs/series/g24/M06/68/22/autohomecar__Chxky2TIooeAbfRIAABmwXa1Tbc408.png
수입	코닉세크	koenigsegg	당근	https://assetstorage.krrt.io/1584808088326110608/31014aac-f57f-4248-86c0-018d22c2375d/width_360_height_240.webp
수입	크라이슬러	chrysler	오토홈	https://car3.autoimg.cn/cardfs/series/g24/M02/A2/50/autohomecar__CjIFWGTCBsGAANQrAAC2du8Zeoo213.png
수입	테슬라	tesla	당근	https://assetstorage.krrt.io/1584808088326110608/e03a285d-075f-4599-ad40-8e2864ffd902/width_360_height_240.webp
수입	토요타	toyota	당근	https://assetstorage.krrt.io/1584808088326110608/e4820209-7256-4eac-bddf-9f7a356d8adb/width_360_height_240.webp
수입	파가니	pagani	당근	https://assetstorage.krrt.io/1584808088326110608/a9284f8b-e56f-4a4e-bed6-acb72e02cd54/width_360_height_240.webp
수입	페라리	ferrari	당근	https://assetstorage.krrt.io/1584808088326110608/7d8416d9-20b7-4e26-9156-34c7119e0ad1/width_360_height_240.webp
수입	포드	ford	당근	https://assetstorage.krrt.io/1584808088326110608/b5d05603-f68b-4869-8366-6ea6c851ef4e/width_360_height_240.webp
수입	포르쉐	porsche	당근	https://assetstorage.krrt.io/1584808088326110608/188f97bf-7ea5-4ede-93f8-e69d519b0acd/width_360_height_240.webp
수입	포톤	foton	당근	https://assetstorage.krrt.io/1584808088326110608/e3daba62-3989-45e0-8570-94c9c07e9a3a/width_360_height_240.webp
수입	폭스바겐	volkswagen	당근	https://assetstorage.krrt.io/1584808088326110608/355f53a1-fc2a-4070-98e5-12d67b44ff03/width_360_height_240.webp
수입	폰티악	pontiac	당근	https://assetstorage.krrt.io/1584808088326110608/fb853762-80a0-47dd-981e-00d1f2061a60/width_360_height_240.webp
수입	폴스타	polestar	당근	https://assetstorage.krrt.io/1584808088326110608/1c814dac-53b9-48de-8ee5-17fe44e70713/width_360_height_240.webp
수입	푸조	peugeot	당근	https://assetstorage.krrt.io/1584808088326110608/6ca074fc-709b-4e0d-8a57-6a9db2190d4b/width_360_height_240.webp
수입	피아트	fiat	당근	https://assetstorage.krrt.io/1584808088326110608/b2666dc0-1faf-43ce-83f0-69154f886a3a/width_360_height_240.webp
수입	허머	hummer	당근	https://assetstorage.krrt.io/1584808088326110608/ddb970a8-71ab-4a98-a544-a31a1911d7d2/width_360_height_240.webp
수입	혼다	honda	당근	https://assetstorage.krrt.io/1584808088326110608/d72bbfcc-1956-48c4-8899-2a69d180832b/width_360_height_240.webp
수입	히노	hino	당근	https://assetstorage.krrt.io/1584808088326110608/c733016a-ac4d-40ae-aa3d-bdf3c90ef6cb/width_360_height_240.webp`;
// 로고 없음(파일을 만들지 않고 화면에서 빈칸)
const NO_LOGO = ["GM대우", "기타 국산차", "모건", "비이스만", "스파이커", "알핀", "어큐라", "오스틴", "웨스트필드", "이네오스", "피스커", "홀덴", "기타 수입차"];
// 공식 파일이 오면 같은 이름으로 교체할 임시 파일
// QF-096 보완 2: 구형 로고 교체 — 위키백과 정보 상자 로고 파일(위키미디어 공용 SVG 는 공용 서버의 PNG 렌더). 원본 파일만 쓰고 다시 그리지 않는다.
// 출처 우선순위 ① 브랜드 공식 보도자료·자료실 ② 위키백과 정보 상자 로고 파일 ③ 없으면 교체하지 않음. 연도를 확인한 것만 교체
const WIKI = "위키백과 정보 상자(위키미디어)";
const REFRESH = {
  kgm: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/KG_Mobility_brand_logo.svg/1280px-KG_Mobility_brand_logo.svg.png", page: "https://commons.wikimedia.org/wiki/File:KG_Mobility_brand_logo.svg", year: 2023, yearNote: "2023년 3월 KG모빌리티 사명 변경·새 브랜딩(en.wikipedia KG Mobility), 파일 날짜 2024-01-01", official: false, license: "Public domain" },
  citroen: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Citroen_2022.svg/1280px-Citroen_2022.svg.png", page: "https://commons.wikimedia.org/wiki/File:Citroen_2022.svg", year: 2022, yearNote: "위키백과 정보 상자 \"Logo since 2022\", 파일 날짜 2022-09-27", official: false, license: "Public domain" },
  jaguar: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jaguar_2024.svg/1280px-Jaguar_2024.svg.png", page: "https://commons.wikimedia.org/wiki/File:Jaguar_2024.svg", year: 2024, yearNote: "2024-11-19 새 로고·브랜딩 공개(en.wikipedia Jaguar Cars)", official: false, license: "Public domain" },
  renault: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Renault_2021.svg/1280px-Renault_2021.svg.png", page: "https://commons.wikimedia.org/wiki/File:Renault_2021.svg", year: 2021, yearNote: "공용 파일 설명 \"Renault logo since 2021\"(로장주), 원본 954×1255", official: false, license: "Public domain" },
  lancia: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/en/7/78/Lancia_logo_2022.png", page: "https://en.wikipedia.org/wiki/File:Lancia_logo_2022.png", year: 2022, yearNote: "위키백과 정보 상자 Lancia_logo_2022.png, 파일 날짜 2022-12-05", official: false, license: "Fair use(영문 위키백과 로컬 파일)" },
  hino: { source: WIKI, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Hino_Motors_logo_2026.svg/1280px-Hino_Motors_logo_2026.svg.png", page: "https://commons.wikimedia.org/wiki/File:Hino_Motors_logo_2026.svg", year: 2026, yearNote: "공용 파일 설명 \"used since April, 2026\"", official: false, license: "Public domain" },
};
// 확인했지만 교체하지 않은 것(이유)
const KEPT = { bentley: "2025 새 날개 B 로고 파일을 공식 자료·위키백과에서 찾지 못함 — 위키백과 정보 상자는 2021 파일(Bentley logo 2.svg)이라 연도 확인 불가, 그대로 둠" };
const TEMPORARY = new Set([]);

const rows = TABLE.split("\n").map((line) => { const [group, name, slug, source, url] = line.split("\t"); return { group, name, slug, source, url }; });
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

const browser = await chromium.launch();
const page = await browser.newPage();
const processed = new Map(); // slug → 처리 결과(같은 slug 는 파일 하나)
const problems = [];

for (const row of rows) {
  if (processed.has(row.slug)) continue;
  let bytes;
  try {
    const refresh = REFRESH[row.slug];
    // 위키미디어는 요청이 몰리면 429 — 잠시 기다렸다 다시 받는다
    let response;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await fetch(refresh?.url ?? row.url, { headers: refresh ? { "User-Agent": "bobaedream-prototype-logo-check/1.0" } : row.source === AUTOHOME ? { Referer: "https://www.autohome.com.cn/" } : {} });
      if (response.status !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error("빈 파일");
  } catch (error) {
    problems.push({ name: row.name, slug: row.slug, reason: `받기 실패: ${error.message}` });
    processed.set(row.slug, null);
    continue;
  }
  const mime = (REFRESH[row.slug]?.url ?? row.url).endsWith(".webp") ? "image/webp" : "image/png";
  const result = await page.evaluate(async ([b64, mime]) => {
    const blob = await (await fetch(`data:${mime};base64,${b64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const source = new OffscreenCanvas(bitmap.width, bitmap.height);
    const sctx = source.getContext("2d");
    sctx.drawImage(bitmap, 0, 0);
    const { data } = sctx.getImageData(0, 0, bitmap.width, bitmap.height);
    let transparentPixels = 0; let minX = bitmap.width; let minY = bitmap.height; let maxX = -1; let maxY = -1;
    for (let y = 0; y < bitmap.height; y += 1) for (let x = 0; x < bitmap.width; x += 1) {
      const alpha = data[(y * bitmap.width + x) * 4 + 3];
      if (alpha < 255) transparentPixels += 1;
      if (alpha > 16) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxX < 0) return { error: "로고 없음(모두 투명)" };
    const trimW = maxX - minX + 1; const trimH = maxY - minY + 1;
    const scale = Math.min(1, 192 / trimW, 112 / trimH);
    const outW = Math.max(1, Math.round(trimW * scale)); const outH = Math.max(1, Math.round(trimH * scale));
    const out = new OffscreenCanvas(outW, outH);
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = "high";
    octx.drawImage(source, minX, minY, trimW, trimH, 0, 0, outW, outH);
    const png = await out.convertToBlob({ type: "image/png" });
    const buffer = new Uint8Array(await png.arrayBuffer());
    let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
    return { original: [bitmap.width, bitmap.height], trimmed: [trimW, trimH], final: [outW, outH], transparent: transparentPixels > 0, png: btoa(binary) };
  }, [bytes.toString("base64"), mime]);
  if (result.error) { problems.push({ name: row.name, slug: row.slug, reason: result.error }); processed.set(row.slug, null); continue; }
  if (!result.transparent) problems.push({ name: row.name, slug: row.slug, reason: "투명 아님(알파 없음)" });
  writeFileSync(join(OUT, `${row.slug}.png`), Buffer.from(result.png, "base64"));
  processed.set(row.slug, { ...result, png: undefined, source: REFRESH[row.slug]?.source ?? row.source, url: REFRESH[row.slug]?.url ?? row.url });
  console.log(`${row.slug.padEnd(14)} 원본 ${result.original.join("×")} → 로고 ${result.trimmed.join("×")} → ${result.final.join("×")} 비율 ${(result.trimmed[0] / result.trimmed[1]).toFixed(2)}${result.transparent ? "" : " [투명 아님]"}`);
}

// manifest: 좌측 필터 이름 → slug · 출처 · 원본 URL · 크기 · 비율
const manifest = {
  generated: today,
  rule: "알파 16 이하 여백 자르기 → 비율 유지로 192×112 안(키우지 않음) → PNG",
  brands: Object.fromEntries(rows.map((row) => {
    const item = processed.get(row.slug);
    return [row.name, item ? {
      group: row.group, slug: row.slug, file: `${row.slug}.png`, source: item.source, url: item.url,
      ...(REFRESH[row.slug] ? { sourcePage: REFRESH[row.slug].page, logoYear: REFRESH[row.slug].year, logoYearNote: REFRESH[row.slug].yearNote, official: REFRESH[row.slug].official, license: REFRESH[row.slug].license, refreshed: "QF-096 보완 2" } : {}),
      ...(KEPT[row.slug] ? { keptReason: KEPT[row.slug] } : {}),
      originalSize: item.original, trimmedSize: item.trimmed, finalSize: item.final,
      ratio: Math.round((item.trimmed[0] / item.trimmed[1]) * 1000) / 1000,
      replaceWithOfficial: TEMPORARY.has(row.slug),
    } : { group: row.group, slug: row.slug, file: null, source: row.source, url: row.url, error: problems.find((p) => p.slug === row.slug)?.reason }];
  })),
  noLogo: NO_LOGO,
};
writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(OUT, "CREDITS.md"), `# 제조사 로고(과쯔 모드, QF-096)

- 출처: 당근 중고차 필터 제조사 로고(assetstorage.krrt.io), 오토홈 브랜드 페이지 로고(car2/car3.autoimg.cn — Referer https://www.autohome.com.cn/ 필요)
- 받은 날짜: ${today}
- 처리: 알파 16 이하 여백 자르기 → 비율 유지로 192×112 안(원본보다 키우지 않음) → PNG. 같은 slug(chevrolet·renault)는 파일 하나
- 이름·원본 URL·크기·비율: manifest.json
- QF-096 보완 2 교체(위키백과 정보 상자 원본 파일 · 위키미디어, 브랜드 공식 배포본 아님 → manifest "official": false):
${Object.entries(REFRESH).map(([slug, r]) => `  - ${slug}.png: ${r.year}(${r.yearNote}) · ${r.license} · ${r.url}`).join("\n")}
- 교체하지 않음: ${Object.entries(KEPT).map(([slug, reason]) => `${slug}.png — ${reason}`).join(" / ")}
- 로고 없음(파일 없음, 화면 빈칸): ${NO_LOGO.join(", ")}
- 다시 만들기: node scripts/brand-logos-kr.mjs
`);

// 검수용 한 장: #F4F5F7 80×72 칸 안 48×28 자리(칸 위 7), 아래 이름. 표 순서, 한 줄 10칸
const cells = rows.map((row) => ({ name: row.name, file: processed.get(row.slug) ? `${row.slug}.png` : null }));
const images = Object.fromEntries([...new Set(cells.filter((c) => c.file).map((c) => c.file))].map((file) => [file, `data:image/png;base64,${readFileSync(join(OUT, file)).toString("base64")}`]));
const sheet = await page.evaluate(async ([cells, images]) => {
  const cols = 10; const cw = 80; const ch = 72; const gap = 8; const label = 18;
  const rowsCount = Math.ceil(cells.length / cols);
  const canvas = new OffscreenCanvas(cols * (cw + gap) + gap, rowsCount * (ch + label + gap) + gap);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < cells.length; i += 1) {
    const x = gap + (i % cols) * (cw + gap); const y = gap + Math.floor(i / cols) * (ch + label + gap);
    ctx.fillStyle = "#F4F5F7"; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 8); ctx.fill();
    const slotX = x + (cw - 48) / 2; const slotY = y + 7;
    if (cells[i].file) {
      const bitmap = await createImageBitmap(await (await fetch(images[cells[i].file])).blob());
      const scale = Math.min(48 / bitmap.width, 28 / bitmap.height);
      const w = bitmap.width * scale; const h = bitmap.height * scale;
      ctx.drawImage(bitmap, slotX + (48 - w) / 2, slotY + (28 - h) / 2, w, h);
    } else { ctx.strokeStyle = "#D0D5DD"; ctx.setLineDash([3, 3]); ctx.strokeRect(slotX + 0.5, slotY + 0.5, 47, 27); ctx.setLineDash([]); }
    ctx.fillStyle = "#222"; ctx.font = "500 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(cells[i].name.length > 9 ? `${cells[i].name.slice(0, 8)}…` : cells[i].name, x + cw / 2, y + ch + 13);
  }
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const buffer = new Uint8Array(await blob.arrayBuffer()); let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
  return btoa(binary);
}, [cells, images]);
writeFileSync(join(SHEET_DIR, "contact-sheet.png"), Buffer.from(sheet, "base64"));
await browser.close();

const files = [...processed.values()].filter(Boolean).length;
console.log(`\n로고 파일 ${files}개(고유 slug ${processed.size}) · 문제 ${problems.length}건`);
for (const problem of problems) console.log(`  문제: ${problem.name}(${problem.slug}) — ${problem.reason}`);
writeFileSync(join(SHEET_DIR, "logo-problems.json"), `${JSON.stringify(problems, null, 2)}\n`);

// 화면용 데이터(코드에서 읽는 비율): src/prototype/listing/brand-logos-kr.generated.ts — 좌측 필터 이름 → slug · 잘라낸 로고 비율
const entries = rows.filter((row) => processed.get(row.slug)).map((row) => { const item = processed.get(row.slug); return `  ${JSON.stringify(row.name)}: { slug: ${JSON.stringify(row.slug)}, ratio: ${Math.round((item.trimmed[0] / item.trimmed[1]) * 1000) / 1000} },`; });
writeFileSync(join("src", "prototype", "listing", "brand-logos-kr.generated.ts"), `// QF-096: scripts/brand-logos-kr.mjs 가 만든 파일 — 손으로 고치지 말고 스크립트를 다시 돌린다.
// 좌측 필터 이름(pc-bbmuseum.tsx bbCatalog) → public/assets/brand/kr/{slug}.png, ratio = 잘라낸 로고 폭÷높이(manifest.json)
export const krBrandLogos: Record<string, { slug: string; ratio: number }> = {
${entries.join("\n")}
};
// 로고 없음(빈칸 유지)
export const krBrandNoLogo = ${JSON.stringify(NO_LOGO)};
`);
