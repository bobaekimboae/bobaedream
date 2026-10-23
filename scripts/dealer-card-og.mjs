// 카카오톡 · 문자에 명함 링크를 보냈을 때 보이는 미리보기 카드(og 태그)를 만든다(2026-10-23 「명함 카톡 보내면 임베드 예쁘게」).
// GitHub Pages는 정적 호스팅이라 딜러마다 짧은 정적 페이지 public/c/<shop>-<emp>.html 을 두고,
// 그 페이지가 og 태그를 가진 뒤 실제 명함 화면(?profile=dealer&...&card=1)으로 바로 넘긴다.
// 미리보기 그림은 실사진이 있는 딜러만 딜러별(public/assets/dealer-card-og/<shop>-<emp>.jpg),
// 나머지는 단지별 공용 그림을 쓴다. 실행: node scripts/dealer-card-og.mjs (public 폴더를 4790 포트로 띄워 둔 상태).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "vite";
import { chromium } from "playwright";

const SITE = "https://bobaekimboae.github.io/bobaedream/";
const ASSET_HOST = "http://localhost:4790/";
const buildings = { "도이치오토월드": "deutsch-autoworld/header/building-bluehour-v01.png", "서울오토갤러리": "seoul-auto-gallery/header/building-bluehour-v01.png" };
const slug = { "도이치오토월드": "deutsch-autoworld", "서울오토갤러리": "seoul-auto-gallery", "SK V1 모터스": "sk-v1-motors" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const isRealPhoto = (photo) => !/dealer-avatar-as24|dealer-illustrations\//.test(photo);

const css = `*{box-sizing:border-box;margin:0;padding:0}html,body{width:800px;height:400px;overflow:hidden;font-family:"Pretendard Variable",Pretendard,sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:800px;height:400px;background:#306BD9;color:#fff;overflow:hidden}
.card::before{content:"";position:absolute;right:-120px;top:-160px;width:520px;height:520px;border-radius:50%;background:rgba(255,255,255,.07)}
.card::after{content:"";position:absolute;right:120px;bottom:-260px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.05)}
.brand{position:absolute;left:48px;top:40px;display:flex;align-items:center;gap:10px;font-size:22px;font-weight:700;letter-spacing:-.3px}
.brand i{display:block;width:30px;height:30px;border-radius:50%;background:#fff url(assets/bbm/favicon.svg) center/30px no-repeat}
.brand span{opacity:.75;font-weight:500;margin-left:2px}
.info{position:absolute;left:48px;top:118px;width:440px}
.name{font-size:64px;line-height:72px;font-weight:800;letter-spacing:-1.5px;white-space:nowrap}
.name small{font-size:32px;font-weight:600;opacity:.85;margin-left:10px;letter-spacing:-.5px}
.company{margin-top:10px;font-size:30px;line-height:40px;font-weight:600;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gallery{margin-top:6px;font-size:22px;line-height:32px;font-weight:500;opacity:.8}
.chips{position:absolute;left:48px;bottom:40px;display:flex;gap:10px}
.chips b{height:44px;padding:0 20px;border-radius:22px;background:#fff;color:#306BD9;font-size:20px;line-height:44px;font-weight:700;letter-spacing:-.3px}
.chips b.ghost{background:rgba(255,255,255,.16);color:#fff;font-weight:600}
.photo{position:absolute;right:56px;top:72px;width:256px;height:256px;border-radius:50%;border:8px solid #fff;background:#EEF0F2 center 20%/cover no-repeat;box-shadow:0 12px 32px rgba(0,0,0,.18)}
.bldg{position:absolute;right:0;top:0;width:360px;height:400px;background:center/cover no-repeat}
.bldg::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#306BD9 0%,rgba(48,107,217,.35) 45%,rgba(48,107,217,0) 100%)}`;

function imageHtml(d) {
  const role = d.role === "대표" ? "대표" : "딜러";
  const chips = [d.count ? `판매중 ${d.count}대` : "", "안심번호 상담"].filter(Boolean);
  const visual = d.photo ? `<div class="photo" style="background-image:url('assets/${esc(d.photo)}')"></div>` : d.building ? `<div class="bldg" style="background-image:url('assets/${esc(d.building)}')"></div>` : "";
  const info = d.name
    ? `<div class="name">${esc(d.name)}<small>${role}</small></div><div class="company">${esc(d.company)}</div><div class="gallery">${esc(d.gallery)}</div>`
    : `<div class="name" style="font-size:52px">${esc(d.gallery)}</div><div class="company">중고차 딜러 명함</div><div class="gallery">보배드림에서 딜러 정보를 확인하세요</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><base href="${ASSET_HOST}"><link rel="stylesheet" href="assets/fonts/pretendard/pretendard-guazi.css"><style>${css}</style></head><body><div class="card">${visual}<div class="brand"><i></i>보배드림<span>딜러 명함</span></div><div class="info">${info}</div><div class="chips">${chips.map((c, i) => `<b class="${i ? "ghost" : ""}">${esc(c)}</b>`).join("")}</div></div></body></html>`;
}

function pageHtml(d, image) {
  const role = d.role === "대표" ? "대표" : "딜러";
  const title = `${d.name} ${role} · ${d.company}`;
  const desc = `${d.gallery}${d.count ? ` · 판매중 ${d.count}대` : ""} · 안심번호로 바로 상담하고 판매 차량을 확인하세요.`;
  const target = `../?profile=dealer&shop=${encodeURIComponent(d.shop)}&emp=${encodeURIComponent(d.emp)}&card=1`;
  const url = `${SITE}c/${d.shop}-${d.emp}`;
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | 보배드림 딜러 명함</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="profile"><meta property="og:site_name" content="보배드림">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}assets/dealer-card-og/${image}">
<meta property="og:image:width" content="800"><meta property="og:image:height" content="400"><meta property="og:image:alt" content="${esc(title)} 명함">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(target)}+(location.search?"&"+location.search.slice(1):"")+location.hash)</script>
</head><body><a href="${esc(target)}">${esc(title)} 명함 보기</a></body></html>
`;
}

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const dealers = (await server.ssrLoadModule("/src/prototype/dealer-page/DealerPage.tsx")).dealerCardSummaries();
await server.close();

rmSync("public/c", { recursive: true, force: true });
rmSync("public/assets/dealer-card-og", { recursive: true, force: true });
mkdirSync("public/c", { recursive: true });
mkdirSync("public/assets/dealer-card-og", { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
const shoot = async (html, file) => {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/assets/dealer-card-og/${file}`, type: "jpeg", quality: 82 });
};
for (const gallery of new Set(dealers.map((d) => d.gallery))) await shoot(imageHtml({ gallery, building: buildings[gallery] }), `${slug[gallery]}.jpg`);
let personal = 0;
for (const d of dealers) {
  let image = `${slug[d.gallery]}.jpg`;
  if (isRealPhoto(d.photo)) { image = `${d.shop}-${d.emp}.jpg`; await shoot(imageHtml(d), image); personal++; }
  writeFileSync(`public/c/${d.shop}-${d.emp}.html`, pageHtml(d, image));
}
await browser.close();
console.log(`pages ${dealers.length}, personal images ${personal}`);
