import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractFeedLinks,
  extractSitemapsFromRobots,
  fetchWithTimeout,
  normalizeUrl,
  robotsAllows,
  USER_AGENT,
} from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "data", "foreign-news", "sources.json");
const auditPath = path.join(root, "reports", "foreign-news-source-audit.json");
const registry = JSON.parse(await readFile(sourcePath, "utf8"));
const concurrency = Math.max(1, Number(process.env.FOREIGN_NEWS_DISCOVERY_CONCURRENCY || 6));
const limit = Math.max(0, Number(process.env.FOREIGN_NEWS_SOURCE_LIMIT || 0));
const sources = limit ? registry.sources.slice(0, limit) : registry.sources;

function candidateFeedUrls(homepageUrl, discovered) {
  const url = new URL(homepageUrl);
  const rootUrl = `${url.protocol}//${url.host}`;
  return [...new Set([
    ...discovered,
    `${rootUrl}/feed`,
    `${rootUrl}/feed/`,
    `${rootUrl}/rss`,
    `${rootUrl}/rss.xml`,
  ].map(normalizeUrl).filter(Boolean))].slice(0, 7);
}

async function readRobots(homepageUrl) {
  const rootUrl = new URL("/robots.txt", homepageUrl).toString();
  try {
    const response = await fetchWithTimeout(rootUrl, { timeoutMs: 8000, accept: "text/plain,*/*;q=0.2" });
    if (response.status === 404) return { status: "allowed", text: "", sitemaps: [] };
    if (response.status === 401 || response.status === 403) return { status: "blocked", text: "", sitemaps: [] };
    if (!response.ok) return { status: "unknown", text: "", sitemaps: [] };
    const text = await response.text();
    return {
      status: robotsAllows(text, homepageUrl, USER_AGENT) ? "allowed" : "blocked",
      text,
      sitemaps: extractSitemapsFromRobots(text, homepageUrl),
    };
  } catch (error) {
    return { status: "unknown", text: "", sitemaps: [], error: error.message };
  }
}

async function probeFeed(url, robotsText) {
  if (robotsText && !robotsAllows(robotsText, url, USER_AGENT)) return null;
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: 9000 });
    if (!response.ok) return null;
    const text = await response.text();
    if (!/<(?:rss|feed|rdf:RDF)\b/i.test(text.slice(0, 5000))) return null;
    return { url: normalizeUrl(response.url || url), type: /<feed\b/i.test(text.slice(0, 2000)) ? "atom" : "rss" };
  } catch {
    return null;
  }
}

async function probeSitemap(url, robotsText) {
  if (robotsText && !robotsAllows(robotsText, url, USER_AGENT)) return null;
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: 9000, accept: "application/xml,text/xml,*/*;q=0.2" });
    if (!response.ok) return null;
    const text = await response.text();
    return /<(?:urlset|sitemapindex)\b/i.test(text.slice(0, 5000)) ? normalizeUrl(response.url || url) : null;
  } catch {
    return null;
  }
}

async function discover(source) {
  const checkedAt = new Date().toISOString();
  const robots = await readRobots(source.homepageUrl);
  if (robots.status === "blocked") {
    return { ...source, robotsStatus: "blocked", fetchType: "blocked", status: "blocked", lastCheckedAt: checkedAt, notes: "robots.txt blocks the source homepage" };
  }

  let homepageHtml = "";
  let homepageUrl = source.homepageUrl;
  try {
    const response = await fetchWithTimeout(homepageUrl, { timeoutMs: 10000, accept: "text/html,application/xhtml+xml" });
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return { ...source, robotsStatus: robots.status, fetchType: "blocked", status: "blocked", lastCheckedAt: checkedAt, notes: `homepage returned HTTP ${response.status}` };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    homepageUrl = normalizeUrl(response.url || homepageUrl);
    homepageHtml = await response.text();
    if (/captcha|verify you are human|access denied|로봇이 아닙니다/i.test(homepageHtml.slice(0, 10000))) {
      return { ...source, homepageUrl, robotsStatus: robots.status, fetchType: "blocked", status: "blocked", lastCheckedAt: checkedAt, notes: "CAPTCHA or bot-block page detected" };
    }
  } catch (error) {
    return { ...source, robotsStatus: robots.status, fetchType: "error", status: "error", lastCheckedAt: checkedAt, notes: `homepage error: ${error.message}` };
  }

  const feedCandidates = candidateFeedUrls(homepageUrl, extractFeedLinks(homepageHtml, homepageUrl));
  for (const candidate of feedCandidates) {
    const feed = await probeFeed(candidate, robots.text);
    if (feed) {
      return { ...source, homepageUrl, feedUrl: feed.url, fetchType: feed.type, pollSeconds: 60, robotsStatus: robots.status, status: "active", lastCheckedAt: checkedAt, notes: "official feed discovered" };
    }
  }

  const sitemapCandidates = [...new Set([...robots.sitemaps, new URL("/sitemap.xml", homepageUrl).toString()])];
  for (const candidate of sitemapCandidates.slice(0, 4)) {
    const sitemap = await probeSitemap(candidate, robots.text);
    if (sitemap) {
      return { ...source, homepageUrl, feedUrl: sitemap, fetchType: "sitemap", pollSeconds: 300, robotsStatus: robots.status, status: "active", lastCheckedAt: checkedAt, notes: "sitemap discovered; article metadata adapter may be required" };
    }
  }

  return { ...source, homepageUrl, feedUrl: "", fetchType: "html", pollSeconds: 300, robotsStatus: robots.status, status: "review", lastCheckedAt: checkedAt, notes: "no machine-readable feed found; manual adapter review required" };
}

let cursor = 0;
const results = new Array(sources.length);
async function worker() {
  while (cursor < sources.length) {
    const index = cursor;
    cursor += 1;
    const source = sources[index];
    results[index] = await discover(source);
    console.log(`[${index + 1}/${sources.length}] ${source.nameKo}: ${results[index].status} ${results[index].fetchType}`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()));

const byId = new Map(results.map((source) => [source.id, source]));
const merged = registry.sources.map((source) => byId.get(source.id) || source);
const nextRegistry = { ...registry, discoveredAt: new Date().toISOString(), count: merged.length, sources: merged };
await writeFile(sourcePath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");

const statusCounts = merged.reduce((counts, source) => {
  counts[source.status] = (counts[source.status] || 0) + 1;
  return counts;
}, {});
const audit = {
  generatedAt: new Date().toISOString(),
  userAgent: USER_AGENT,
  total: merged.length,
  statusCounts,
  sources: merged.map(({ id, nameKo, country, homepageUrl, feedUrl, fetchType, robotsStatus, status, notes }) => ({ id, nameKo, country, homepageUrl, feedUrl, fetchType, robotsStatus, status, notes })),
};
await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(`Discovery complete: ${JSON.stringify(statusCounts)} -> ${path.relative(root, auditPath)}`);


