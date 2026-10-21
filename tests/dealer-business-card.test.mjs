import test from "node:test";
import assert from "node:assert/strict";
import { cardContact, cardUrl, profileUrl, readCardStyle, cardVcf, defaultCardStyle, cardFieldHref, serializeCardStyle } from "../src/prototype/dealer-page/business-card.ts";

test("individual affiliations survive sharing and exports without replacing another dealer's defaults", () => {
  const contact = { name: "딜러", role: "대표", company: "투제이모터웍스", gallery: "서울오토갤러리", phone: "", address: "", photo: "" };
  const style = { ...defaultCardStyle, gallery: "SK V1 모터스", company: "e-조이모터스", title: "개인 브랜드" };
  const restored = readCardStyle(new URL(cardUrl("https://example.test/", "450554", "1", style)).hash);
  assert.deepEqual(restored, style);
  assert.equal(cardContact(contact, restored).gallery, "SK V1 모터스");
  assert.equal(cardContact(contact, restored).company, "e-조이모터스");
  assert.equal(cardContact(contact, defaultCardStyle).company, "투제이모터웍스");
  assert.equal(cardContact({ ...contact, gallery: undefined }, defaultCardStyle).gallery, "");
  assert.equal(cardContact(contact, { ...style, gallery: "" }).gallery, "");
  const vcf = cardVcf(contact, "https://example.test/", restored);
  assert.match(vcf, /ORG:e-조이모터스/);
  assert.match(vcf, /X-DEALER-COMPLEX:SK V1 모터스/);
  assert.doesNotMatch(vcf, /투제이모터웍스|서울오토갤러리|개인 브랜드/);
  assert.equal(readCardStyle("#company=" + "가".repeat(100)).company.length, 80);
});

test("shared links retain dealer identity and Korean customization on a different device", () => {
  const style = { ...defaultCardStyle, theme: "navy", intro: "서울에서 만나요 & 좋은 차 #친절한 상담 + 시승" };
  const shared = new URL(cardUrl("https://example.test/bobaedream/?pcauth=member&listing=777&tab=reviews#private", "450554", "5", style));
  assert.deepEqual([...shared.searchParams], [["profile", "dealer"], ["shop", "450554"], ["emp", "5"], ["card", "1"]]);
  assert.deepEqual(readCardStyle(shared.hash), style);
  assert.equal(profileUrl(shared.href, "450554", "5"), "https://example.test/bobaedream/?profile=dealer&shop=450554&emp=5");
});

test("unknown themes, control characters and oversized shared text are bounded", () => {
  const style = readCardStyle("#theme=javascript%3Aalert(1)&intro=" + encodeURIComponent("hello\n\r\u0000" + "가".repeat(200)));
  assert.equal(style.theme, "blue");
  assert.equal(style.intro.length, 60);
  assert.doesNotMatch(style.intro, /[\r\n\u0000]/);
  assert.equal(readCardStyle("#intro=").intro, "");
});

test("vCard escapes data, preserves UTF-8 Korean, and folds long physical lines", () => {
  const vcf = cardVcf({ name: "김;태,규", role: "대표\nTEL:fake", company: "보배\\드림", phone: "02-2059-5211", address: "서울 "+"한글 주소 ".repeat(20), photo: "" }, "https://example.test/?profile=dealer");
  assert.match(vcf, /FN:김\\;태\\,규\r\n/);
  assert.match(vcf, /TITLE:대표\\nTEL:fake\r\n/);
  assert.match(vcf, /ORG:보배\\\\드림\r\n/);
  assert.match(vcf, /TEL;TYPE=WORK,VOICE:02-2059-5211/);
  for (const line of vcf.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.equal(vcf.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"), true);
  assert.equal(vcf.endsWith("END:VCARD\r\n"), true);
});

test("missing business phone stays absent from contact export", () => {
  const vcf = cardVcf({ name: "딜러", role: "대표", company: "상사", phone: "", address: "서울", photo: "" }, "https://example.test/");
  assert.doesNotMatch(vcf, /TEL;/);
});

test("optional contacts, logo and title survive sharing; deselected data is omitted", () => {
  const style = { ...defaultCardStyle, title: "나의 모터스", logo: "data:image/webp;base64,UklGRg==", fields: { mobile: "010-0000-0000", instagram: "@sample_dealer", youtube: "https://www.youtube.com/@sample", tiktok: "@sample" } };
  const shared = new URL(cardUrl("https://example.test/?pcauth=member", "450554", "1", style));
  assert.deepEqual(readCardStyle(shared.hash), style);
  const next = { ...style, fields: { mobile: style.fields.mobile } };
  const params = new URLSearchParams(serializeCardStyle(next));
  for (const channel of ["instagram", "youtube", "tiktok"]) assert.equal(params.has(channel), false);
  assert.deepEqual(readCardStyle("#theme=blue&intro=안녕").fields, {});
});

test("SNS URLs use only the selected platform and secure, credential-free links", () => {
  assert.equal(cardFieldHref("instagram", "@sample_dealer"), "https://www.instagram.com/sample_dealer");
  assert.equal(cardFieldHref("youtube", "@sample"), "https://www.youtube.com/@sample");
  assert.equal(cardFieldHref("youtube", "@딜러채널"), "https://www.youtube.com/@" + encodeURIComponent("딜러채널"));
  assert.equal(cardFieldHref("tiktok", "@sample"), "https://www.tiktok.com/@sample");
  assert.equal(cardFieldHref("mobile", "010-0000-0000"), "tel:01000000000");
  for (const value of ["javascript:alert(1)", "https://instagram.com.evil.test/x", "https://instagram.com@evil.test", "http://instagram.com/a", "https://user:pass@instagram.com/a", "https://instagram.com:999/a"]) assert.equal(cardFieldHref("instagram", value), null, value);
  assert.equal(cardFieldHref("youtube", "https://www.instagram.com/sample"), null);
  assert.equal(cardFieldHref("mobile", "tel:123;ext=evil"), null);
  assert.equal(cardFieldHref("mobile", ""), null);
});

test("shared logos cannot embed SVG or remote tracking URLs", () => {
  for (const logo of ["https://example.test/logo.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/webp;base64," + "A".repeat(6000)]) assert.equal(readCardStyle("#logo=" + encodeURIComponent(logo)).logo, "");
});

test("contact export includes only valid selected mobile and social fields", () => {
  const contact = { name: "딜러", role: "대표", company: "상사", phone: "02-2059-5211", address: "서울", photo: "" };
  const style = { ...defaultCardStyle, fields: { mobile: "010-0000-0000", instagram: "@sample", youtube: "javascript:alert(1)" } };
  const vcf = cardVcf(contact, "https://example.test/", style);
  assert.match(vcf, /TEL;TYPE=CELL,VOICE:01000000000/);
  assert.match(vcf, /X-SOCIALPROFILE;TYPE=instagram:https:\/\/www.instagram.com\/sample/);
  assert.doesNotMatch(vcf, /TYPE=youtube/);
  assert.match(vcf, /TEL;TYPE=WORK,VOICE:02-2059-5211/);
});
