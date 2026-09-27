#!/usr/bin/env node
// QF-109: 과쯔 모드 모델·세부모델 이미지를 당근 이미지로 교체(QF-097 model-images-kr.mjs 를 대신한다)
// 입력: 카탈로그 스냅숏 src/prototype/data/model-catalog-kr.json · 당근 트리 tmp/daangn-cache/tree.json(node scripts/daangn-fetch.mjs)
// 1) 세대 맞춤표: 보배드림 세부모델(코드·세대·연식·부분변경 이름) ↔ 당근 subseries. 확실하지 않으면 연결하지 않는다(추측 금지)
//    규칙(위부터): 이름 일치 → 코드 일치 → 세대 번호 일치(번호 체계가 같을 때 높음 / 최신 세대 기준으로 밀어 맞추면 중간) → 단일 일치 → (세대 없는 이름 = 1세대, 중간)
//    보배드림 한 칸에 당근 여러 개 → 가장 최신 것 하나 · 당근 한 개에 보배드림 여러 칸 → 같은 이미지(shared 표시)
// 2) 이미지: 연결 → 당근 원본 · 연결 없음 → 보배드림 model_{번호}.png · 둘 다 없으면 빈 칸(점선). 모두 코드 정렬 부품(scripts/image-normalize.mjs)으로 228×120
// 출력: public/assets/models/kr/{maker_id}/{value}.png · manifest.json · CREDITS.md · src/prototype/data/model-image-match.json · reports/qf-109/match.csv ·
//       reports/qf-109/contact-sheet-{브랜드}.png(윗줄 지금 / 아랫줄 새 이미지) · reports/qf-109/stats.json → 끝에 scripts/model-catalog-data.mjs
// 사용: node scripts/model-images-dg.mjs
import { chromium } from "@playwright/test";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createNormalizer } from "./image-normalize.mjs";

const OUT = join("public", "assets", "models", "kr");
const OLD = join("tmp", "models-kr-before");
const BOBAE_CACHE = join("tmp", "bobae-cache");
const DG = join("tmp", "daangn-cache");
const REPORT = join("reports", "qf-109");
mkdirSync(REPORT, { recursive: true }); mkdirSync(BOBAE_CACHE, { recursive: true });
const snapshot = JSON.parse(readFileSync("src/prototype/data/model-catalog-kr.json", "utf8"));
const tree = JSON.parse(readFileSync(join(DG, "tree.json"), "utf8"));
// 지금 이미지(검수판 윗줄)를 한 번만 따로 둔다
if (!existsSync(OLD)) cpSync(OUT, OLD, { recursive: true });

const cutBracket = (label) => label.replace(/\s*[([].*$/, "").trim();
const norm = (text) => (text ?? "").toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/[\s\-·_()]/g, "");
const baseKey = (text) => norm(cutBracket(text)).replace(/클래스$/, "");
// 두 자리 연도: 30 이하 = 2000년대, 그 위 = 1900년대("36~95년" = 1936)
const startYear = (rel) => { const m = (rel ?? "").match(/^(\d{2})/); if (!m) return 0; const y = Number(m[1]); return y <= 30 ? 2000 + y : 1900 + y; };
const parseDg = (name) => { const m = name.match(/^(.*?)\s*\((\d+)세대\)\s*$/); return m ? { base: m[1].trim(), gen: Number(m[2]) } : { base: name.trim(), gen: null }; };
const codesOf = (sub) => (sub.code ?? "").split(/[,/]/).map((code) => code.trim()).filter((code) => /^[A-Za-z0-9 ]{2,}$/.test(code));

// 당근 시리즈 찾기: 이름이 같거나("클래스" 유무·괄호 무시), BMW X·M·i·Z 계열은 묶음 시리즈 안에서
function findSeries(maker, group, companySeries) {
  const names = [cutBracket(group.label), group.label];
  let found = companySeries.filter((item) => names.some((name) => baseKey(item.name) === baseKey(name)));
  if (found.length) return { series: found, family: null };
  if (maker === "BMW") {
    const name = cutBracket(group.label);
    const family = /^X/.test(name) ? "X" : /^i/.test(name) ? "i" : /^(M\d|1M)/.test(name) ? "M" : /^Z/.test(name) ? "Z" : null;
    if (family) { found = companySeries.filter((item) => norm(item.name) === norm(`${family}시리즈`)); if (found.length) return { series: found, family }; }
  }
  // "마이바흐 S클래스" 같은 두 단어 모델: 당근 시리즈 이름이 모델 이름 안에 통째로 있고 하나뿐일 때
  const inside = companySeries.filter((item) => baseKey(item.name).length >= 2 && baseKey(cutBracket(group.label)).includes(baseKey(item.name)) && baseKey(item.name) !== baseKey(cutBracket(group.label)));
  if (inside.length === 1) return { series: inside, family: "inside" };
  return { series: [], family: null };
}

function matchGroup(maker, group, subsAll, dgSubs, family) {
  const groupName = cutBracket(group.label);
  // 묶음 시리즈(BMW X시리즈 등)·포함 시리즈는 이 모델 이름으로 시작하는 subseries 만
  const pool = family ? dgSubs.filter((item) => baseKey(parseDg(item.name).base) === baseKey(groupName) || norm(item.name).startsWith(norm(groupName))) : dgSubs;
  const genItems = pool.map((item) => ({ ...item, ...parseDg(item.name) })).filter((item) => item.gen !== null && baseKey(item.base) === baseKey(groupName));
  const bareItems = pool.filter((item) => parseDg(item.name).gen === null && baseKey(item.name) === baseKey(groupName));
  // 세대 번호: 이름이 모델 이름과 같은 세부모델만(파생형 "2시리즈 액티브 투어러"·"카이엔 일렉트릭" 등은 따로)
  const isMain = (sub) => baseKey(sub.label) === baseKey(groupName);
  const mainSubs = subsAll.filter(isMain);
  const catGens = mainSubs.map((sub) => Number(sub.generation)).filter((gen) => gen > 0);
  const maxCat = catGens.length ? Math.max(...catGens) : null;
  const maxDg = genItems.length ? Math.max(...genItems.map((item) => item.gen)) : null;
  // 세대 없는 이름 + (2세대)부터 있으면 세대 없는 것 = 1세대
  const bareAsFirst = bareItems.length === 1 && genItems.length && Math.min(...genItems.map((item) => item.gen)) === 2 ? bareItems[0] : null;
  const dgByGen = new Map(genItems.map((item) => [item.gen, item]));
  if (bareAsFirst && !dgByGen.has(1)) dgByGen.set(1, { ...bareAsFirst, gen: 1, bare: true });
  // 번호 체계: 보배 세대 번호가 당근에 모두 있으면 같은 체계(그대로), 아니면 최신 세대 기준으로 밀어 맞춤(중간)
  const direct = catGens.length > 0 && catGens.every((gen) => dgByGen.has(gen));
  const newestCat = [...mainSubs].sort((a, b) => startYear(b.rel_year) - startYear(a.rel_year))[0];
  const offset = !direct && maxCat !== null && maxDg !== null && newestCat && Number(newestCat.generation) === maxCat && /현재/.test(newestCat.rel_year ?? "") && catGens.every((gen) => dgByGen.has(gen - (maxCat - maxDg))) ? maxCat - maxDg : null;
  const results = new Map();
  for (const sub of subsAll) {
    const label = sub.label;
    const tries = [];
    // 코드 일치(먼저): 당근 이름에 코드가 있고, 코드를 뺀 이름이 같을 때(예 "더 뉴 그랜저"·IG ↔ "더 뉴그랜저IG")
    for (const code of codesOf(sub)) {
      const c = norm(code);
      // 보배 이름의 "N세대"는 빼고 비교(예 "더 뉴 K5 3세대"·DL3 ↔ "더 뉴K5(DL3)")
      const labelKey = norm(label.replace(/\s\d+세대/g, "")).replace(c, "");
      const byCode = pool.filter((item) => norm(item.name).includes(c) && norm(item.name).replace(c, "") === labelKey);
      if (byCode.length) tries.push({ item: byCode[0], rule: "코드 일치", confidence: "높음", reason: `당근 "${byCode[0].name}"에 코드 ${code}` });
    }
    // 이름 일치: 모델 안에서 이 이름이 하나뿐일 때만(같은 이름이 여러 세대면 이름으로 가를 수 없음)
    const sameLabel = subsAll.filter((other) => norm(other.label) === norm(label)).length;
    const byName = sameLabel === 1 ? pool.filter((item) => norm(item.name) === norm(label)) : [];
    if (byName.length) tries.push({ item: byName[0], rule: "이름 일치", confidence: "높음", reason: `당근 이름 "${byName[0].name}" = 보배 "${label}"` });
    // 세대 번호
    const gen = Number(sub.generation);
    if (gen > 0 && isMain(sub)) {
      if (direct) {
        const hit = dgByGen.get(gen);
        const newer = maxDg !== null && maxDg > maxCat;
        tries.push({ item: hit, rule: hit.bare ? "세대 없는 이름 = 1세대" : "세대 번호 일치", confidence: hit.bare || newer ? "중간" : "높음", reason: `보배 ${gen}세대 = 당근 "${hit.name}"${hit.bare ? `(당근은 ${genItems.map((item) => item.name).join(", ")} 외 세대 없는 이름)` : ""}${newer ? `(당근에 더 새 ${maxDg}세대 있음 — 번호 체계 같다고 봄)` : `(최신 세대 번호 양쪽 ${maxCat})`}` });
      } else if (offset !== null) {
        const hit = dgByGen.get(gen - offset);
        tries.push({ item: hit, rule: "세대 밀어 맞춤", confidence: "중간", reason: `보배 번호 ${gen} − ${offset} = 당근 "${hit.name}"(보배 번호가 당근에 없어 보배 최신 ${maxCat}세대 "~현재" ↔ 당근 최신 ${maxDg}세대로 맞춤)` });
      }
    }
    // 파생형 세대 일치: "2시리즈 액티브 투어러" 2세대 ↔ 당근 "액티브투어러(2세대)"
    if (gen > 0 && !isMain(sub)) {
      const hit = pool.map((item) => ({ ...item, ...parseDg(item.name) })).filter((item) => item.gen === gen && norm(item.base).length >= 3 && baseKey(item.base) !== baseKey(groupName) && norm(label).includes(norm(item.base)));
      if (hit.length === 1) tries.push({ item: hit[0], rule: "파생형 세대 일치", confidence: "높음", reason: `보배 "${label}" ${gen}세대 = 당근 "${hit[0].name}"` });
    }
    // 단일 일치: 보배 세부모델 1개 · 당근 subseries 1개(세대 없는 이름 = 모델 이름)
    if (subsAll.length === 1 && pool.length === 1 && baseKey(pool[0].name) === baseKey(groupName)) tries.push({ item: pool[0], rule: "단일 일치", confidence: "높음", reason: `양쪽 하나뿐 "${pool[0].name}"` });
    const best = tries[0] ?? null;
    results.set(sub.value, best ? { ...best, dg: { id: best.item.id, name: best.item.name } } : { rule: null, confidence: null, reason: pool.length ? `연결 근거 없음(당근 ${pool.map((item) => item.name).join(", ")})` : "당근 모델 없음", dg: null });
  }
  // 같은 당근 칸을 이름이 다른 보배 세부모델 여럿이 가져가면(예 "더 뉴 아반떼"·AD(13~15)와 "더 뉴 아반떼AD"(18~20) → "더 뉴아반떼AD")
  // 보배 이름(코드 포함)이 당근 이름과 정확히 같은 쪽만 남기고 나머지는 연결하지 않음. 정확히 같은 쪽이 없으면 모두 "중간"
  const labelOf = new Map(subsAll.map((sub) => [sub.value, sub]));
  const byDg = new Map();
  for (const [value, result] of results) if (result.dg) byDg.set(result.dg.id, [...(byDg.get(result.dg.id) ?? []), value]);
  for (const [id, values] of byDg) {
    const labels = new Set(values.map((value) => norm(labelOf.get(value).label)));
    if (labels.size < 2) continue;
    const dgName = norm(results.get(values[0]).dg.name);
    const exact = values.filter((value) => norm(labelOf.get(value).label) === dgName);
    for (const value of values) {
      const result = results.get(value);
      if (exact.length && !exact.includes(value)) results.set(value, { rule: null, confidence: null, dg: null, reason: `당근 "${result.dg.name}"은 이름이 정확히 같은 다른 세부모델(${exact.map((v) => labelOf.get(v).label).join(", ")}) 것 — 연결 안 함` });
      else if (!exact.length && result.confidence === "높음") { result.confidence = "중간"; result.reason += ` · 당근 한 칸을 이름이 다른 세부모델 ${values.length}개가 함께 씀`; }
    }
  }
  // 순서 확인: 당근 목록(최신 → 과거) 순서와 보배 연식 순서가 뒤집히면 둘 다 "중간"
  const order = (id) => pool.findIndex((item) => item.id === id);
  const linked = subsAll.filter((sub) => results.get(sub.value)?.dg && startYear(sub.rel_year));
  for (const a of linked) for (const b of linked) {
    const ra = results.get(a.value); const rb = results.get(b.value);
    if (ra.dg.id === rb.dg.id) continue;
    if (startYear(a.rel_year) > startYear(b.rel_year) && order(ra.dg.id) > order(rb.dg.id) && !(ra.gen || rb.gen)) {
      for (const r of [ra, rb]) if (r.confidence === "높음" && !/세대/.test(r.rule)) { r.confidence = "중간"; r.reason += " · 당근 목록 순서와 연식 순서가 반대(확인 필요)"; }
    }
  }
  return results;
}

const browser = await chromium.launch();
const normalizer = await createNormalizer({ browser });
const download = async (url) => {
  const file = join(BOBAE_CACHE, url.split("/").pop());
  if (existsSync(file)) return readFileSync(file);
  for (let attempt = 1; ; attempt += 1) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); const bytes = Buffer.from(await r.arrayBuffer()); if (!bytes.length) throw new Error("빈 파일"); writeFileSync(file, bytes); await new Promise((res) => setTimeout(res, 300)); return bytes; }
    catch (error) { if (attempt >= 3 || /빈 파일|HTTP 404/.test(error.message)) throw error; await new Promise((res) => setTimeout(res, 2000 * attempt)); }
  }
};
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

const manifest = { generated: new Date().toISOString(), catalogFetchedAt: snapshot.fetchedAt, daangnFetchedAt: tree.fetchedAt, rule: "당근 subseries(세대 맞춤표) → 없으면 보배드림 model 이미지 → 없으면 빈 칸. 모두 코드 정렬 부품 228×120(차 폭 224 · 바닥선 111 · 그림자 220×12)", makers: {} };
const matchOut = { generated: manifest.generated, makers: {} };
const csvRows = [["브랜드", "보배 모델", "보배 세부모델", "코드", "연식", "보배 세대", "value", "당근 시리즈", "당근 subseries", "판정", "확신도", "규칙", "이유", "당근 공유"].join(",")];
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const sheetData = {};
for (const { maker, makerId, groups } of snapshot.makers) {
  const company = tree.companies[maker];
  const dir = join(OUT, String(makerId));
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  const entry = { daangnCompany: company ? { id: company.id, name: company.name } : null, models: [] };
  matchOut.makers[maker] = {};
  sheetData[maker] = [];
  for (const group of groups.filter((item) => item.count > 0)) {
    const shown = group.models.filter((sub) => sub.count > 0);
    const { series, family } = company ? findSeries(maker, group, company.series) : { series: [], family: null };
    const dgSubs = series.flatMap((item) => item.subseries.map((sub) => ({ ...sub, series: item.name })));
    const results = matchGroup(maker, group, group.models, dgSubs, family);
    const sheetGroup = { model: cutBracket(group.label), subs: [] };
    for (const sub of shown) {
      const match = results.get(sub.value);
      let chosen = null; const notes = [];
      if (match.dg) {
        const file = join(DG, "img", `${match.dg.id}.webp`);
        if (existsSync(file)) { const r = await normalizer.normalize(readFileSync(file)); if (r.error) notes.push(`당근 이미지 ${r.error}`); else chosen = { source: "daangn", ...r }; }
        else notes.push("당근 이미지 받기 실패");
      }
      if (!chosen && sub.image && IMAGE_EXT.test(sub.image) && sub.image_url) {
        try { const r = await normalizer.normalize(await download(sub.image_url)); if (r.error) notes.push(`보배 이미지 ${r.error}`); else chosen = { source: "bobaedream", url: sub.image_url, ...r }; }
        catch (error) { notes.push(`보배 이미지 받기 실패 ${error.message}`); }
      }
      if (chosen) writeFileSync(join(dir, `${sub.value}.png`), Buffer.from(chosen.png, "base64"));
      const verdict = chosen?.source === "daangn" ? "연결" : chosen ? "보배 대체" : "빈 칸";
      const shared = match.dg ? shown.filter((other) => other.value !== sub.value && results.get(other.value)?.dg?.id === match.dg.id).map((other) => other.value) : [];
      const item = {
        group: group.label, value: sub.value, label: sub.label, code: sub.code, generation: sub.generation, relYear: sub.rel_year, count: sub.count,
        file: chosen ? `${makerId}/${sub.value}.png` : null, source: chosen?.source ?? null, url: chosen?.source === "bobaedream" ? chosen.url : null,
        daangn: match.dg && chosen?.source === "daangn" ? { id: match.dg.id, name: match.dg.name, series: dgSubs.find((d) => d.id === match.dg.id)?.series, rule: match.rule, confidence: match.confidence, shared } : null,
        originalSize: chosen?.original ?? null, trimmedSize: chosen?.trimmed ?? null, placed: chosen?.placed ?? null, scale: chosen?.scale ?? null,
        upscaleSkipped: chosen?.upscaleSkipped ?? false, heightCapped: chosen?.heightCapped ?? false, whiteBackground: chosen?.whiteBackground ?? false, notes, meanLuma: chosen?.meanLuma ?? null, meanSat: chosen?.meanSat ?? null,
      };
      entry.models.push(item);
      matchOut.makers[maker][sub.value] = { model: cutBracket(group.label), label: sub.label, code: sub.code, source: item.source, daangn: item.daangn ? { id: item.daangn.id, name: item.daangn.name, rule: item.daangn.rule, confidence: item.daangn.confidence } : null };
      csvRows.push([maker, cutBracket(group.label), sub.label, sub.code, sub.rel_year, sub.generation, sub.value, dgSubs.find((d) => d.id === match.dg?.id)?.series ?? series.map((s) => s.name).join("/"), match.dg?.name ?? "", verdict, chosen?.source === "daangn" ? match.confidence : "", match.rule ?? "", [match.reason, ...notes].join(" · "), shared.length ? `같은 이미지 ${shared.join(" ")}` : ""].map(csv).join(","));
      sheetGroup.subs.push({ value: sub.value, label: sub.label, code: sub.code, relYear: sub.rel_year, source: item.source, confidence: item.daangn?.confidence ?? null, upscale: item.upscaleSkipped, old: existsSync(join(OLD, String(makerId), `${sub.value}.png`)) ? join(OLD, String(makerId), `${sub.value}.png`) : null, now: item.file ? join(OUT, item.file) : null });
      console.log(`${maker} ${cutBracket(group.label)} · ${sub.label} ${sub.code ?? ""} → ${verdict}${item.daangn ? ` "${item.daangn.name}"(${item.daangn.rule}·${item.daangn.confidence})` : ""}${item.upscaleSkipped ? " · 확대 안 함" : ""}`);
    }
    sheetData[maker].push(sheetGroup);
  }
  manifest.makers[maker] = entry;
}
writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
writeFileSync(join("src", "prototype", "data", "model-image-match.json"), `${JSON.stringify(matchOut, null, 1)}\n`);
writeFileSync(join(REPORT, "match.csv"), `﻿${csvRows.join("\n")}\n`);
writeFileSync(join(OUT, "CREDITS.md"), `# 모델·세부 모델 이미지(과쯔 모드, QF-109)

- 카탈로그: 개발 시안 필터 카탈로그 스냅숏(src/prototype/data/model-catalog-kr.json, 받은 날짜 ${snapshot.fetchedAt})
- 이미지 출처 ① 당근 중고차 차종 이미지(img.kr.gcp-karroter.net, GraphQL autoBeginsSubseries.imageUrl, 받은 날짜 ${tree.fetchedAt}) — 세대 맞춤표(src/prototype/data/model-image-match.json, reports/qf-109/match.csv)로 연결된 것만
  ② 연결이 없으면 보배드림 차종 이미지(file4.bobaedream.co.kr/car_model_img, 카탈로그 image_url) ③ 둘 다 없으면 빈 칸(점선)
- 처리: 코드 정렬 부품(scripts/image-normalize.mjs, docs/model-image-spec.md) — 228×120 투명 PNG, 차 폭 224 · 바닥선 111 · 그림자 코드로. 새로 그리거나 색을 바꾸지 않음, 좌우 반전 없음
- 세부 모델별 출처·원본 크기·확대 여부: manifest.json
- 다시 만들기: node scripts/daangn-fetch.mjs → node scripts/model-images-dg.mjs
`);
await import("./model-catalog-data.mjs");

// 검수판: 브랜드마다 한 장. 모델 줄 한 줄 + 모델마다 세부모델 줄 한 줄. 줄마다 윗줄 지금(56×28 칸) / 아랫줄 새 이미지(76×40 칸), 칸 아래 출처
const page = await browser.newPage();
const b64 = (file) => (file && existsSync(file) ? `data:image/png;base64,${readFileSync(file).toString("base64")}` : null);
const stats = {};
for (const [maker, groupsData] of Object.entries(sheetData)) {
  const makerId = snapshot.makers.find((entry) => entry.maker === maker).makerId;
  // 모델 줄: 지금 = 매물이 가장 많은 세부모델 이미지, 새 = 최신 세부모델 중 당근(없으면 최신 이미지)
  const modelRow = groupsData.map((group) => {
    const withOld = [...group.subs].filter((sub) => sub.old);
    const catalogGroup = snapshot.makers.find((entry) => entry.maker === maker).groups.find((g) => cutBracket(g.label) === group.model);
    const counts = new Map(catalogGroup.models.map((sub) => [sub.value, sub.count]));
    const oldTop = withOld.sort((a, b) => (counts.get(b.value) ?? 0) - (counts.get(a.value) ?? 0))[0];
    const byNew = [...group.subs].sort((a, b) => startYear(b.relYear) - startYear(a.relYear));
    const newTop = byNew.find((sub) => sub.source === "daangn") ?? byNew.find((sub) => sub.now);
    return { label: group.model, sub: "", old: oldTop?.old ?? null, now: newTop?.now ?? null, source: newTop?.source ?? null, confidence: newTop?.confidence ?? null, upscale: newTop?.upscale };
  });
  const rows = [{ title: `${maker} 모델 줄`, cells: modelRow }, ...groupsData.map((group) => ({ title: `${group.model} 세부모델 줄`, cells: group.subs.map((sub) => ({ label: sub.code || sub.label, sub: (sub.relYear ?? "").replace(/년~현재$/, "~현재"), old: sub.old, now: sub.now, source: sub.source, confidence: sub.confidence, upscale: sub.upscale })) }))];
  const payload = rows.map((row) => ({ ...row, cells: row.cells.map((cell) => ({ ...cell, old: b64(cell.old), now: b64(cell.now) })) }));
  const png = await page.evaluate(async (rows) => {
    const cw = 84; const gap = 8; const titleW = 150; const rowH = 44 + 60 + 40; const cols = Math.max(...rows.map((row) => row.cells.length));
    const canvas = new OffscreenCanvas(titleW + cols * (cw + gap) + gap, rows.length * (rowH + 10) + 10);
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const load = async (src) => (src ? createImageBitmap(await (await fetch(src)).blob()) : null);
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r]; const y = 10 + r * (rowH + 10);
      ctx.fillStyle = "#222"; ctx.font = "bold 12px sans-serif"; ctx.fillText(row.title.length > 14 ? `${row.title.slice(0, 14)}…` : row.title, 8, y + 16);
      ctx.fillStyle = "#8c8c8c"; ctx.font = "10px sans-serif"; ctx.fillText("윗줄 지금", 8, y + 34); ctx.fillText("아랫줄 새 이미지", 8, y + 80);
      if (r > 0) { ctx.strokeStyle = "#eee"; ctx.beginPath(); ctx.moveTo(0, y - 5); ctx.lineTo(canvas.width, y - 5); ctx.stroke(); }
      for (let c = 0; c < row.cells.length; c += 1) {
        const cell = row.cells[c]; const x = titleW + gap + c * (cw + gap);
        // 지금: 56×28 칸(칸 위 6), 비율 유지 · 바닥 정렬
        const old = await load(cell.old);
        if (old) { const ratio = old.width / old.height; let w = 56; let h = 56 / ratio; if (h > 28) { h = 28; w = 28 * ratio; } ctx.drawImage(old, x + 14 + (56 - w) / 2, y + 6 + 28 - h, w, h); }
        else { ctx.strokeStyle = "#c5cad3"; ctx.setLineDash([3, 2]); ctx.strokeRect(x + 14.5, y + 6.5, 55, 27); ctx.setLineDash([]); }
        // 새: 76×40 칸(228×120 을 1/3)
        const ny = y + 44;
        const now = await load(cell.now);
        if (now) ctx.drawImage(now, x + 4, ny + 6, 76, 40);
        else { ctx.strokeStyle = "#dadada"; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.roundRect(x + 4.5, ny + 6.5, 75, 39, 6); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = "#222"; ctx.font = "600 12px sans-serif"; const label = cell.label.length > 10 ? `${cell.label.slice(0, 10)}…` : cell.label; ctx.fillText(label, x + 42 - ctx.measureText(label).width / 2, ny + 62);
        if (cell.sub) { ctx.fillStyle = "#8c8c8c"; ctx.font = "10px sans-serif"; ctx.fillText(cell.sub, x + 42 - ctx.measureText(cell.sub).width / 2, ny + 75); }
        const tag = cell.source === "daangn" ? `당근${cell.confidence === "중간" ? "·중간" : ""}` : cell.source === "bobaedream" ? "보배" : "빈 칸";
        ctx.fillStyle = cell.source === "daangn" ? (cell.confidence === "중간" ? "#d97706" : "#ff6f0f") : cell.source ? "#1b5bd8" : "#98a0ad";
        ctx.font = "bold 10px sans-serif"; const t = `${tag}${cell.upscale ? "·원본크기" : ""}`; ctx.fillText(t, x + 42 - ctx.measureText(t).width / 2, ny + 90);
      }
    }
    const buffer = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
    let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
    return btoa(binary);
  }, payload);
  writeFileSync(join(REPORT, `contact-sheet-${maker}.png`), Buffer.from(png, "base64"));
  // 통계
  const subs = groupsData.flatMap((group) => group.subs);
  const tally = (list) => ({ total: list.length, daangn: list.filter((s) => s.source === "daangn").length, bobaedream: list.filter((s) => s.source === "bobaedream").length, none: list.filter((s) => !s.source).length, medium: list.filter((s) => s.confidence === "중간").length, upscaleSkipped: list.filter((s) => s.upscale).length });
  stats[maker] = { makerId, models: tally(modelRow), subModels: tally(subs), mixedRows: groupsData.map((group) => ({ row: `${group.model} 세부모델 줄`, ...tally(group.subs) })).filter((row) => row.bobaedream && row.daangn) };
}
writeFileSync(join(REPORT, "stats.json"), JSON.stringify(stats, null, 1));
await normalizer.close(); await browser.close();
for (const [maker, s] of Object.entries(stats)) console.log(`${maker} 모델 ${JSON.stringify(s.models)} · 세부모델 ${JSON.stringify(s.subModels)}`);
