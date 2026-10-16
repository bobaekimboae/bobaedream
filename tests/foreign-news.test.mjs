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
import { buildSheetRows, sheetHeaders } from "../scripts/foreign-news/sheet-lib.mjs";
import { pickIframelyPreview } from "../scripts/foreign-news/iframely.mjs";
import { translateArticlesWithOpenAI } from "../scripts/foreign-news/openai-translate.mjs";

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
  assert.doesNotMatch(board, /"originalTitle": "[^\"]+/);
  const descriptions = [...board.matchAll(/"embedDescription": "([^\"]+)"/g)].map((match) => JSON.parse(`"${match[1]}"`));
  assert.ok(descriptions.length > 0);
  assert.ok(descriptions.every((description) => description.split("\n").length === 3));
});

test("Google Sheet rows expose Korean display fields without an original-title column", () => {
  assert.deepEqual(sheetHeaders.slice(0, 8), ["기사 유형", "제조사", "모델", "인물", "국가", "출처", "제목", "기사 요약(3줄)"]);
  assert.equal(sheetHeaders.includes("원문 제목"), false);
  const rows = buildSheetRows({
    generatedAt: "2026-10-17T00:00:00.000Z",
    articles: [{
      id: "news-1",
      source: "테스트 매체",
      displayArticleTypeKo: "신차",
      displayMakesKo: ["포르쉐"],
      displayModelsKo: ["911"],
      displayPeopleKo: ["올리버 블루메"],
      displayTitleKo: "포르쉐 신차 관련 해외 보도",
      displaySummaryKo: "첫 줄\n둘째 줄\n셋째 줄",
      canonicalUrl: "https://example.com/news-1",
      relatedCount: 2,
    }],
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].slice(0, 7), ["신차", "포르쉐", "911", "올리버 블루메", "", "테스트 매체", "포르쉐 신차 관련 해외 보도"]);
  assert.equal(rows[0][7], "첫 줄\n둘째 줄\n셋째 줄");
  assert.equal(rows[0][13], "https://example.com/news-1");
});

test("Iframely contributes only publisher-approved preview assets", () => {
  assert.deepEqual(pickIframelyPreview({
    meta: { site: "Example News", title: "Original title must not be used" },
    links: {
      thumbnail: [{ href: "https://cdn.example.com/article.jpg" }],
      logo: [{ href: "https://cdn.example.com/logo.png" }],
    },
    access: { decision: { links: { allowed: true } } },
  }), {
    allowed: true,
    image: "https://cdn.example.com/article.jpg",
    logo: "https://cdn.example.com/logo.png",
    site: "Example News",
    status: "ready",
  });
  assert.equal(pickIframelyPreview({
    links: { thumbnail: [{ href: "https://cdn.example.com/blocked.jpg" }] },
    access: { decision: { links: { allowed: false } } },
  }).image, "");
});

test("OpenAI translation keeps a Korean title and exactly three summary lines", async () => {
  let request;
  const rows = await translateArticlesWithOpenAI([{
    id: "news-1",
    originalTitle: "A new electric sports car debuts",
    originalSummary: "The model arrives next spring with 500 km of range.",
    originalLanguage: "en",
    source: "Example",
    country: "미국",
    canonicalUrl: "https://example.com/news-1",
  }], "test-key", {
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return {
        ok: true,
        async json() {
          return { output_text: JSON.stringify({ articles: [{
            id: "news-1",
            titleKo: "전기 스포츠카 신형 공개",
            summaryLinesKo: ["신형 전기 스포츠카가 공개됐습니다.", "1회 충전 주행거리는 500km입니다.", "내년 봄 출시될 예정입니다."],
            articleTypeKo: "신차",
            makesKo: [], modelsKo: [], peopleKo: [],
          }] }) };
        },
      };
    },
  });
  assert.equal(request.store, false);
  assert.equal(request.text.format.type, "json_schema");
  assert.equal(rows[0].titleKo, "전기 스포츠카 신형 공개");
  assert.equal(rows[0].summaryKo.split("\n").length, 3);
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

test("community UI loads and exposes the overseas board as a Threads-style news feed", async () => {
  const [list, detail, navigation, profile, discussion, discussionCss, cardCss] = await Promise.all([
    readFile(new URL("../public/community/naver-cafe-list.html", import.meta.url), "utf8"),
    readFile(new URL("../public/community/chzzk-detail.html", import.meta.url), "utf8"),
    readFile(new URL("../public/community/hupu-board-navigation.js", import.meta.url), "utf8"),
    readFile(new URL("../public/community/reddit-board-profile.js", import.meta.url), "utf8"),
    readFile(new URL("../public/community/naver-discussion-feed.js", import.meta.url), "utf8"),
    readFile(new URL("../public/community/naver-discussion-feed.css", import.meta.url), "utf8"),
    readFile(new URL("../public/community/news-card.css", import.meta.url), "utf8"),
  ]);
  assert.match(list, /board-foreign-car-news\.js/);
  assert.match(list, /해외 자동차뉴스는 자동 수집 게시판입니다/);
  assert.match(detail, /board-foreign-car-news\.js/);
  assert.match(navigation, /id:'foreign-car-news',displayName:'해외 자동차뉴스'/);
  assert.match(profile, /'해외 자동차뉴스':'해외 107개 매체 · 5분 간격 갱신'/);
  assert.match(discussion, /localPostMatches/);
  assert.match(discussion, /activeTable\.displayName/);
  assert.match(discussion, /post\.body\.slice\(0,3\)\.join\('\\n'\)/);
  assert.match(discussion, /function threadNewsCard/);
  assert.match(discussion, /board==='car-news'\|\|board==='foreign-car-news'/);
  assert.match(discussion, /threadNewsCardFor\(post,index\)/);
  assert.match(discussion, />bobaebike</);
  assert.match(discussion, /data-thread-repost/);
  assert.match(discussion, /data-thread-share/);
  assert.match(discussionCss, /\.foreignThreadCard/);
  assert.match(discussionCss, /grid-template-columns:44px minmax\(0,1fr\)/);
  assert.match(discussionCss, /\.foreignThreadCard \.news-card-desc/);
  assert.match(cardCss, /aspect-ratio:1\.88\/1/);
  assert.match(cardCss, /grid-template-areas:"site" "title"/);
});
