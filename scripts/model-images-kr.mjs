#!/usr/bin/env node
// QF-109 이후 사용하지 않음 — scripts/daangn-fetch.mjs → scripts/model-images-dg.mjs(코드 정렬 부품 scripts/image-normalize.mjs)로 대신한다. 기록용으로 남김
// QF-097: 과쯔 모드 모델·세부 모델 이미지와 화면용 데이터 만들기(카탈로그 스냅숏 src/prototype/data/model-catalog-kr.json 기준).
// 대상: 매물이 있는(count > 0) 모델의 매물이 있는 세부 모델. 이미지 우선순위
//  ① 카탈로그 image_url(file4.bobaedream.co.kr) — image 값에 확장자가 없거나 빈 파일이면 건너뜀
//  ② 당근 GraphQL(car.kr.karrotmarket.com) autoBeginsCompanies → autoBeginsSeries → autoBeginsSubseries.imageUrl
//     당근은 연식·코드를 주지 않아 이름만 같으면 다른 세대일 수 있다(예: 당근 "더 뉴그랜저"=GN7 부분변경, 보배드림 "더 뉴 그랜저"=IG).
//     그래서 아래 두 경우만 연결하고 나머지는 추측하지 않는다
//       코드 일치: 당근 이름에 세부 모델 코드가 들어 있고, 양쪽에서 코드를 뺀 이름이 같을 때(예: "더 뉴그랜저IG" ↔ "더 뉴 그랜저"·IG)
//       세대 일치: 당근 이름이 "모델(N세대)"이고 카탈로그 세대 값이 N 인 세부 모델이 그 모델에 하나뿐일 때(예: BMW "5시리즈(8세대)" ↔ 5시리즈 세대 8)
//       단일 일치: 모델(시리즈) 이름이 같고, 보배드림 세부 모델도 1개·당근 세부 모델도 1개이며 두 이름이 같을 때
//     당근 모델(시리즈) 찾기: 이름이 같거나("클래스" 유무 무시, 괄호 포함 이름도 비교), BMW X·M·i·Z 계열은 당근 "X시리즈" 등 묶음 안에서 찾는다
//  ③ 없음(화면은 점선 빈 칸)
// 처리: 흰 배경이 남은 파일은 거절(다음 순서로) → 알파 16 이하 여백 자르기 → 비율 유지로 168×84 안(키우지 않음) → PNG
// 출력: public/assets/models/kr/{maker_id}/{value}.png · public/assets/models/kr/manifest.json ·
//       reports/qf-097/contact-sheet.png → 끝에 scripts/model-catalog-data.mjs(화면용 데이터 · missing-images.csv)
// 사용: node scripts/model-images-kr.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUT = join("public", "assets", "models", "kr");
const snapshot = JSON.parse(readFileSync("src/prototype/data/model-catalog-kr.json", "utf8"));
const DAANGN = "https://car.kr.karrotmarket.com/graphql";
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;
const cutBracket = (label) => label.replace(/\s*\(.*$/, "").trim();
const norm = (text) => (text ?? "").toLowerCase().replace(/[\s\-·_]/g, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const gql = async (query) => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(DAANGN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
    if (response.ok) { const json = await response.json(); if (json.errors) throw new Error(json.errors[0].message); return json.data; }
    if (attempt >= 4) throw new Error(`당근 HTTP ${response.status}`);
    await sleep(3000 * attempt);
  }
};
const download = async (url) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error("빈 파일");
      return bytes;
    } catch (error) {
      if (attempt >= 3 || /빈 파일|HTTP 404/.test(error.message)) throw error;
      await sleep(2000 * attempt);
    }
  }
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");
// 흰 배경 판정: 가장자리 픽셀 중 불투명(알파 > 16)하고 거의 흰색(RGB 모두 235 이상)인 것이 40% 이상
const processImage = (bytes) => page.evaluate(async (b64) => {
  const bitmap = await createImageBitmap(await (await fetch(`data:application/octet-stream;base64,${b64}`)).blob());
  const w = bitmap.width; const h = bitmap.height;
  const source = new OffscreenCanvas(w, h);
  const sctx = source.getContext("2d");
  sctx.drawImage(bitmap, 0, 0);
  const { data } = sctx.getImageData(0, 0, w, h);
  let edge = 0; let edgeWhite = 0;
  const at = (x, y) => (y * w + x) * 4;
  const edgeCheck = (x, y) => { const i = at(x, y); edge += 1; if (data[i + 3] > 16 && data[i] >= 235 && data[i + 1] >= 235 && data[i + 2] >= 235) edgeWhite += 1; };
  for (let x = 0; x < w; x += 1) { edgeCheck(x, 0); edgeCheck(x, h - 1); }
  for (let y = 1; y < h - 1; y += 1) { edgeCheck(0, y); edgeCheck(w - 1, y); }
  if (edgeWhite / edge >= 0.4) return { error: `흰 배경(가장자리 ${Math.round((edgeWhite / edge) * 100)}% 흰색 불투명)` };
  let minX = w; let minY = h; let maxX = -1; let maxY = -1; let luma = 0; let lumaCount = 0;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const i = at(x, y);
    if (data[i + 3] > 16) {
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      luma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; lumaCount += 1;
    }
  }
  if (maxX < 0) return { error: "모두 투명" };
  const trimW = maxX - minX + 1; const trimH = maxY - minY + 1;
  const scale = Math.min(1, 168 / trimW, 84 / trimH);
  const outW = Math.max(1, Math.round(trimW * scale)); const outH = Math.max(1, Math.round(trimH * scale));
  const out = new OffscreenCanvas(outW, outH);
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = "high";
  octx.drawImage(source, minX, minY, trimW, trimH, 0, 0, outW, outH);
  const buffer = new Uint8Array(await (await out.convertToBlob({ type: "image/png" })).arrayBuffer());
  let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
  return { original: [w, h], trimmed: [trimW, trimH], final: [outW, outH], meanLuma: Math.round(luma / lumaCount), png: btoa(binary) };
}, bytes.toString("base64"));

// 당근 제조사·모델 목록
const companies = (await gql("{ autoBeginsCompanies { id name } }")).autoBeginsCompanies;

const manifest = { generated: new Date().toISOString(), catalogFetchedAt: snapshot.fetchedAt, rule: "① 보배드림 image_url(확장자·빈 파일 확인) → ② 당근 코드 일치·단일 일치 → ③ 없음. 흰 배경 거절 → 알파 16 이하 여백 자르기 → 168×84 안(키우지 않음) → PNG", makers: {} };
const screen = [];
const sheetRows = [];
for (const { maker, makerId, groups } of snapshot.makers) {
  const dir = join(OUT, String(makerId));
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  const company = companies.find((item) => item.name === maker);
  const series = company ? (await gql(`{ autoBeginsSeries(companyId:"${company.id}") { id name } }`)).autoBeginsSeries : [];
  const makerEntry = { daangnCompany: company ? { id: company.id, name: company.name } : null, models: [] };
  const screenMaker = { maker, makerId, models: [] };
  for (const group of groups.filter((item) => item.count > 0)) {
    const groupName = cutBracket(group.label);
    const shown = group.models.filter((sub) => sub.count > 0);
    const seriesKey = (name) => norm(name).replace(/클래스$/, "");
    let matchedSeries = series.filter((item) => [groupName, group.label].some((name) => seriesKey(item.name) === seriesKey(name)));
    const family = maker === "BMW" && !matchedSeries.length ? groupName.match(/^([XMiZ])d|^(XM)$/) : null;
    if (family) matchedSeries = series.filter((item) => norm(item.name) === norm(`${family[1] ?? "X"}시리즈`));
    const daangnSeries = matchedSeries.length === 1 ? matchedSeries[0] : null;
    let subseries = [];
    if (daangnSeries) { subseries = (await gql(`{ autoBeginsSubseries(seriesId:"${daangnSeries.id}") { id name imageUrl } }`)).autoBeginsSubseries; await sleep(150); }
    const screenModel = { value: group.value, label: group.label, count: group.count, models: [] };
    for (const sub of shown) {
      const rejected = [];
      let chosen = null;
      // ① 보배드림
      if (!sub.image || !IMAGE_EXT.test(sub.image) || !sub.image_url) rejected.push({ source: "bobaedream", reason: sub.image ? `확장자 없음(${sub.image})` : "이미지 값 없음" });
      else {
        try {
          const result = await processImage(await download(sub.image_url));
          if (result.error) rejected.push({ source: "bobaedream", url: sub.image_url, reason: result.error });
          else chosen = { source: "bobaedream", url: sub.image_url, ...result };
        } catch (error) { rejected.push({ source: "bobaedream", url: sub.image_url, reason: `받기 실패: ${error.message}` }); }
      }
      // ② 당근(코드 일치 · 단일 일치만)
      let daangnMatch = null;
      if (!chosen && daangnSeries) {
        const codes = (sub.code ?? "").split(/[,/]/).map((code) => code.trim()).filter((code) => /^[A-Za-z0-9]{2,}$/.test(code));
        const byCode = subseries.filter((item) => codes.some((code) => {
          const name = norm(item.name); const c = norm(code);
          return name.includes(c) && name.replace(c, "") === norm(cutBracket(sub.label)).replace(c, "");
        }));
        const sameGeneration = sub.generation ? shown.filter((item) => item.generation === sub.generation) : [];
        const byGeneration = sameGeneration.length === 1 ? subseries.filter((item) => norm(item.name) === norm(`${groupName}(${sub.generation}세대)`) || (family && norm(item.name) === norm(`${groupName}(${sub.generation}세대)`))) : [];
        const bySingle = !family && shown.length === 1 && group.models.length === 1 && subseries.length === 1 && norm(subseries[0].name) === norm(cutBracket(sub.label)) ? subseries : [];
        if (byCode.length === 1) daangnMatch = { ...byCode[0], rule: "코드 일치" };
        else if (byCode.length > 1) rejected.push({ source: "daangn", reason: `코드 일치 후보 ${byCode.length}개(${byCode.map((item) => item.name).join(", ")}) — 연결 안 함` });
        else if (byGeneration.length === 1) daangnMatch = { ...byGeneration[0], rule: "세대 일치" };
        else if (bySingle.length === 1) daangnMatch = { ...bySingle[0], rule: "단일 일치" };
        else rejected.push({ source: "daangn", reason: "코드·세대·단일 일치 없음" });
        if (daangnMatch) {
          try {
            const result = await processImage(await download(daangnMatch.imageUrl));
            if (result.error) rejected.push({ source: "daangn", url: daangnMatch.imageUrl, reason: result.error });
            else chosen = { source: "daangn", url: daangnMatch.imageUrl, daangn: { id: daangnMatch.id, name: daangnMatch.name, rule: daangnMatch.rule }, ...result };
          } catch (error) { rejected.push({ source: "daangn", url: daangnMatch.imageUrl, reason: `받기 실패: ${error.message}` }); }
        }
      } else if (!chosen) rejected.push({ source: "daangn", reason: company ? `당근 모델 "${groupName}" 없음` : "당근 제조사 없음" });
      if (chosen) writeFileSync(join(dir, `${sub.value}.png`), Buffer.from(chosen.png, "base64"));
      const ratio = chosen ? Math.round((chosen.trimmed[0] / chosen.trimmed[1]) * 1000) / 1000 : null;
      makerEntry.models.push({
        group: group.label, value: sub.value, label: sub.label, code: sub.code, generation: sub.generation, relYear: sub.rel_year, count: sub.count,
        file: chosen ? `${makerId}/${sub.value}.png` : null, source: chosen?.source ?? null, url: chosen?.url ?? null, daangn: chosen?.daangn ?? null,
        originalSize: chosen?.original ?? null, trimmedSize: chosen?.trimmed ?? null, finalSize: chosen?.final ?? null, ratio, meanLuma: chosen?.meanLuma ?? null,
        rejected,
      });
      screenModel.models.push({ value: sub.value, label: sub.label, count: sub.count, relYear: sub.rel_year, code: sub.code, generation: sub.generation, ...(ratio ? { ratio } : {}) });
      sheetRows.push({ maker, group: groupName, label: sub.label, file: chosen ? join(dir, `${sub.value}.png`) : null, source: chosen?.source ?? null });
      console.log(`${maker} ${groupName} · ${sub.label} → ${chosen ? `${chosen.source}${chosen.daangn ? `(${chosen.daangn.rule})` : ""} ${chosen.final.join("×")}` : "없음"}`);
    }
    screenMaker.models.push(screenModel);
  }
  manifest.makers[maker] = makerEntry;
  screen.push(screenMaker);
}
writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
writeFileSync(join(OUT, "CREDITS.md"), `# 모델·세부 모델 이미지(과쯔 모드, QF-097)

- 카탈로그: 개발 시안 필터 카탈로그 스냅숏(src/prototype/data/model-catalog-kr.json, 받은 날짜 ${snapshot.fetchedAt})
- 이미지 출처 ① 보배드림 차종 이미지(file4.bobaedream.co.kr/car_model_img, 카탈로그 image_url) ② 당근 중고차 차종 이미지(img.kr.gcp-karroter.net, GraphQL autoBeginsSubseries.imageUrl — 코드·세대·단일 일치만)
- 처리: 흰 배경 거절 → 알파 16 이하 여백 자르기 → 168×84 안(키우지 않음) → PNG. 새로 그리거나 색을 바꾸지 않음
- 세부 모델별 출처 URL·연결 규칙·거절 이유: manifest.json
- 다시 만들기: node scripts/model-catalog-kr.mjs → node scripts/model-images-kr.mjs
`);

// 화면용 데이터(0대 포함 전체 · 이미지 비율)와 이미지 없는 목록 CSV: scripts/model-catalog-data.mjs(이미지를 다시 받지 않고도 만들 수 있게 분리)
await import("./model-catalog-data.mjs");

// 검수용 한 장: 제조사별 줄, #F7F8FC 80×72 카드 안 56×28 자리(위 7) · 아래 이름 · 출처 표시(보=보배드림, 당=당근, 없음=점선)
const images = Object.fromEntries(sheetRows.filter((row) => row.file).map((row) => [row.file, `data:image/png;base64,${readFileSync(row.file).toString("base64")}`]));
const sheet = await page.evaluate(async ([rows, images]) => {
  const cols = 14; const cw = 80; const ch = 72; const gap = 8; const label = 30;
  const rowsCount = Math.ceil(rows.length / cols);
  const canvas = new OffscreenCanvas(cols * (cw + gap) + gap, rowsCount * (ch + label + gap) + gap);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const x = gap + (i % cols) * (cw + gap); const y = gap + Math.floor(i / cols) * (ch + label + gap);
    ctx.fillStyle = "#F7F8FC"; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 8); ctx.fill();
    const slotX = x + 12; const slotY = y + 7;
    if (row.file) {
      const bitmap = await createImageBitmap(await (await fetch(images[row.file])).blob());
      const ratio = bitmap.width / bitmap.height;
      let w = 56; let h = 56 / ratio;
      if (h > 28) { h = 28; w = 28 * ratio; }
      ctx.drawImage(bitmap, slotX + (56 - w) / 2, slotY + 28 - h, w, h);
    } else {
      ctx.strokeStyle = "#C5CAD3"; ctx.setLineDash([3, 2]); ctx.strokeRect(slotX + 0.5, slotY + 0.5, 55, 27); ctx.setLineDash([]);
    }
    ctx.fillStyle = row.source === "daangn" ? "#FF6F0F" : row.source ? "#1B5BD8" : "#98A0AD";
    ctx.font = "bold 9px sans-serif"; ctx.fillText(row.source === "daangn" ? "당" : row.source ? "보" : "없음", x + 4, y + 66);
    ctx.fillStyle = "#1A1F27"; ctx.font = "10px sans-serif";
    const text = `${row.maker} ${row.group}`; ctx.fillText(text.length > 12 ? `${text.slice(0, 12)}…` : text, x, y + ch + 12);
    ctx.fillStyle = "#65707F"; ctx.fillText(row.label.length > 12 ? `${row.label.slice(0, 12)}…` : row.label, x, y + ch + 24);
  }
  const buffer = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
  let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
  return btoa(binary);
}, [sheetRows, images]);
mkdirSync(join("reports", "qf-097"), { recursive: true });
writeFileSync(join("reports", "qf-097", "contact-sheet.png"), Buffer.from(sheet, "base64"));
await browser.close();

const all = Object.values(manifest.makers).flatMap((entry) => entry.models);
const tally = (list) => ({ total: list.length, bobaedream: list.filter((item) => item.source === "bobaedream").length, daangn: list.filter((item) => item.source === "daangn").length, none: list.filter((item) => !item.source).length });
for (const [maker, entry] of Object.entries(manifest.makers)) console.log(maker, JSON.stringify(tally(entry.models)));
console.log("합계", JSON.stringify(tally(all)));
