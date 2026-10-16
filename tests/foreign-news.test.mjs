import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  classifyTopic,
  normalizeUrl,
  parseCsv,
  parseFeed,
  robotsAllows,
  stableArticleId,
  titleSimilarity,
} from "../scripts/foreign-news/lib.mjs";

test("CSV parser keeps quoted commas and line breaks", () => {
  const rows = parseCsv('\uFEFFname,url,note\r\n"매체, A",https://example.com,"첫 줄\n둘째 줄"\r\n');
  assert.deepEqual(rows, [["name", "url", "note"], ["매체, A", "https://example.com", "첫 줄\n둘째 줄"]]);
});

test("URL normalization removes tracking without changing the article", () => {
  assert.equal(normalizeUrl("HTTPS://Example.COM/news//one/?utm_source=x&fbclid=y&id=3#top"), "https://example.com/news/one?id=3");
});

test("RSS items become canonical articles", () => {
  const xml = '<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item><title><![CDATA[New EV launch]]></title><link>https://example.com/a?utm_medium=rss</link><pubDate>Fri, 16 Oct 2026 09:00:00 GMT</pubDate><description><![CDATA[<p>Battery news</p>]]></description><media:content url="https://cdn.example.com/ev.jpg" type="image/jpeg" /></item></channel></rss>';
  const rows = parseFeed(xml, { id:"s1", nameKo:"예제", country:"미국", region:"북미", language:"en", feedUrl:"https://example.com/feed" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].originalTitle, "New EV launch");
  assert.equal(rows[0].canonicalUrl, "https://example.com/a");
  assert.equal(rows[0].originalSummary, "Battery news");
  assert.equal(rows[0].imageUrl, "https://cdn.example.com/ev.jpg");
});

test("generated board stores Reddit-style link preview metadata", async () => {
  const board = await readFile(new URL("../public/community/data/board-foreign-car-news.js", import.meta.url), "utf8");
  assert.match(board, /"defaultView": "naver-discussion"/);
  assert.match(board, /"embedTitle":/);
  assert.match(board, /"embedImage": "https:\/\//);
});

test("robots longest matching rule wins", () => {
  const robots = "User-agent: *\nDisallow: /news\nAllow: /news/public\n";
  assert.equal(robotsAllows(robots, "https://example.com/news/private"), false);
  assert.equal(robotsAllows(robots, "https://example.com/news/public/a"), true);
});

test("topic, duplicate similarity and IDs are deterministic", () => {
  assert.equal(classifyTopic({ originalTitle:"Brand launches new electric SUV", originalSummary:"battery charging" }), "전기차·하이브리드");
  assert.ok(titleSimilarity("Ferrari unveils new V12 supercar", "New Ferrari V12 supercar unveiled") >= 0.5);
  assert.equal(stableArticleId("https://example.com/a"), stableArticleId("https://example.com/a"));
});

test("community UI loads and exposes the overseas board", async () => {
  const [list, detail, navigation, profile, discussion] = await Promise.all([
    readFile(new URL("../public/community/naver-cafe-list.html", import.meta.url), "utf8"),
    readFile(new URL("../public/community/chzzk-detail.html", import.meta.url), "utf8"),
    readFile(new URL("../public/community/hupu-board-navigation.js", import.meta.url), "utf8"),
    readFile(new URL("../public/community/reddit-board-profile.js", import.meta.url), "utf8"),
    readFile(new URL("../public/community/naver-discussion-feed.js", import.meta.url), "utf8"),
  ]);
  assert.match(list, /board-foreign-car-news\.js/);
  assert.match(list, /해외 자동차뉴스는 자동 수집 게시판입니다/);
  assert.match(detail, /board-foreign-car-news\.js/);
  assert.match(navigation, /id:'foreign-car-news',displayName:'해외 자동차뉴스'/);
  assert.match(profile, /'해외 자동차뉴스':'해외 107개 매체 · 5분 간격 갱신'/);
  assert.match(discussion, /localPostMatches/);
  assert.match(discussion, /activeTable\.displayName/);
});
