import test from "node:test";
import assert from "node:assert/strict";
import { cardUrl, profileUrl, readCardStyle, cardVcf } from "../src/prototype/dealer-page/business-card.ts";

test("shared links retain dealer identity and Korean customization on a different device", () => {
  const style = { theme: "navy", intro: "서울에서 만나요 & 좋은 차 #친절한 상담 + 시승" };
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
