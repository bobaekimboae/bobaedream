import { createHash } from "node:crypto";

export const USER_AGENT = "BobaedreamForeignNewsBot/1.0 (+https://bobaekimboae.github.io/bobaedream/community/)";

export function sha1(value) {
  return createHash("sha1").update(String(value)).digest("hex");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = String(text).replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

export function normalizeUrl(value) {
  try {
    const url = new URL(String(value).trim());
    url.hash = "";
    [...url.searchParams.keys()].forEach((key) => {
      if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
    });
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return "";
  }
}

export function decodeEntities(value) {
  const entities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, raw) => {
      const radix = raw[0].toLowerCase() === "x" ? 16 : 10;
      const number = Number.parseInt(radix === 16 ? raw.slice(1) : raw, radix);
      return Number.isFinite(number) ? String.fromCodePoint(number) : _;
    })
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

export function stripHtml(value, maxLength = 600) {
  const text = decodeEntities(value)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function tagValue(xml, names) {
  for (const name of names) {
    const pattern = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i");
    const match = String(xml).match(pattern);
    if (match) return decodeEntities(match[1]).trim();
  }
  return "";
}

function attributes(fragment) {
  const result = {};
  String(fragment).replace(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g, (_, name, _quote, value) => {
    result[name.toLowerCase()] = decodeEntities(value);
    return _;
  });
  return result;
}

function absoluteUrl(value, baseUrl) {
  try {
    const url = new URL(decodeEntities(value), baseUrl);
    return /^https?:$/.test(url.protocol) ? normalizeUrl(url.toString()) : "";
  } catch {
    return "";
  }
}

function feedItemLink(block, baseUrl) {
  const atomLinks = [...String(block).matchAll(/<link\b([^>]*)\/?\s*>/gi)];
  for (const match of atomLinks) {
    const attrs = attributes(match[1]);
    if (attrs.href && (!attrs.rel || attrs.rel === "alternate")) return absoluteUrl(attrs.href, baseUrl);
  }
  return absoluteUrl(tagValue(block, ["link", "guid"]), baseUrl);
}

function feedItemImage(block, summary, baseUrl) {
  const media = String(block).match(/<(?:media:content|media:thumbnail|enclosure)\b([^>]*)\/?\s*>/i);
  if (media) {
    const attrs = attributes(media[1]);
    if (attrs.url && (!attrs.type || attrs.type.startsWith("image/") || /media:(?:content|thumbnail)/i.test(media[0]))) {
      const url = absoluteUrl(attrs.url, baseUrl);
      if (url) return url;
    }
  }
  const image = String(summary).match(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i);
  return image ? absoluteUrl(image[2], baseUrl) : "";
}

export function parseFeed(xml, source) {
  const input = String(xml ?? "");
  const itemMatches = [...input.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  const entryMatches = [...input.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)];
  const blocks = (itemMatches.length ? itemMatches : entryMatches).map((match) => match[1]);
  return blocks.map((block) => {
    const rawSummary = tagValue(block, ["description", "summary", "content:encoded", "content"]);
    const originalTitle = stripHtml(tagValue(block, ["title"]), 240);
    const canonicalUrl = feedItemLink(block, source.feedUrl || source.homepageUrl);
    const publishedRaw = tagValue(block, ["pubDate", "published", "updated", "dc:date", "date"]);
    const publishedAt = Number.isNaN(Date.parse(publishedRaw)) ? "" : new Date(publishedRaw).toISOString();
    return {
      sourceId: source.id,
      source: source.nameKo,
      country: source.country,
      region: source.region,
      originalLanguage: source.language,
      originalTitle,
      titleKo: "",
      originalSummary: stripHtml(rawSummary, 600),
      summaryKo: "",
      canonicalUrl,
      publishedAt,
      imageUrl: feedItemImage(block, rawSummary, source.feedUrl || source.homepageUrl),
    };
  }).filter((article) => article.originalTitle && article.canonicalUrl);
}

export function extractFeedLinks(html, baseUrl) {
  const found = [];
  for (const match of String(html).matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if (!attrs.href || !/alternate/i.test(attrs.rel || "")) continue;
    if (!/(?:application|text)\/(?:rss\+xml|atom\+xml|xml)/i.test(attrs.type || "")) continue;
    const url = absoluteUrl(attrs.href, baseUrl);
    if (url) found.push(url);
  }
  return [...new Set(found)];
}

export function extractSitemapLinks(xml, baseUrl) {
  const links = [];
  for (const match of String(xml).matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)) {
    const url = absoluteUrl(match[1], baseUrl);
    if (url) links.push(url);
  }
  return [...new Set(links)];
}

export function extractSitemapsFromRobots(text, baseUrl) {
  const links = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^\s*sitemap\s*:\s*(.+?)\s*$/i);
    if (match) {
      const url = absoluteUrl(match[1], baseUrl);
      if (url) links.push(url);
    }
  }
  return [...new Set(links)];
}

export function robotsAllows(text, targetUrl, userAgent = USER_AGENT) {
  const groups = [];
  let current = null;
  for (const sourceLine of String(text).split(/\r?\n/)) {
    const line = sourceLine.replace(/\s*#.*$/, "").trim();
    if (!line) continue;
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    if (key === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current) {
      current.rules.push({ type: key, path: value });
    }
  }
  const agent = userAgent.toLowerCase();
  const matching = groups.filter((group) => group.agents.some((value) => value === "*" || agent.includes(value)));
  if (!matching.length) return true;
  const specific = matching.filter((group) => group.agents.some((value) => value !== "*" && agent.includes(value)));
  const rules = (specific.length ? specific : matching).flatMap((group) => group.rules);
  const path = new URL(targetUrl).pathname || "/";
  const matched = rules.filter((rule) => rule.path && path.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length);
  if (!matched.length) return true;
  return matched[0].type === "allow";
}

export function classifyTopic(article) {
  const text = `${article.originalTitle} ${article.originalSummary}`.toLowerCase();
  const groups = [
    ["리콜·안전", /recall|safety|crash|defect|리콜|안전|결함|衝突|安全|召回/],
    ["모터스포츠", /formula 1|f1\b|motorsport|racing|nascar|rally|모터스포츠|레이싱|レース|赛车/],
    ["전기차·하이브리드", /\bev\b|electric|battery|charging|hybrid|전기차|배터리|충전|하이브리드|電気|电动|新能源/],
    ["산업·정책", /policy|regulation|tariff|factory|sales|market|industry|정책|규제|관세|공장|판매|산업|市場|政策|销量/],
    ["시승·리뷰", /review|road test|first drive|comparison|시승|리뷰|비교|試乗|レビュー|评测/],
    ["기술·부품", /technology|software|autonomous|engine|platform|기술|소프트웨어|자율주행|엔진|部品|技术|自动驾驶/],
    ["튜닝·클래식", /classic|restomod|tuning|custom|collector|클래식|올드카|튜닝|改装|经典/],
    ["상용차", /truck|bus|van|commercial vehicle|트럭|버스|상용차|卡车|商用车/],
    ["바이크", /motorcycle|motorbike|scooter|바이크|오토바이|二輪|摩托车/],
    ["신차", /new model|debut|launch|unveil|facelift|신차|공개|출시|モデル|発売|新车|发布/],
  ];
  return groups.find(([, pattern]) => pattern.test(text))?.[0] || "해외소식";
}

const makes = [
  "현대", "hyundai", "기아", "kia", "genesis", "제네시스", "tesla", "테슬라", "toyota", "토요타", "トヨタ",
  "honda", "혼다", "ホンダ", "nissan", "닛산", "日産", "mazda", "마쓰다", "subaru", "스바루", "suzuki", "스즈키",
  "bmw", "mercedes", "벤츠", "audi", "아우디", "volkswagen", "폭스바겐", "porsche", "포르쉐", "ferrari", "페라리",
  "lamborghini", "람보르기니", "volvo", "볼보", "ford", "포드", "chevrolet", "쉐보레", "jeep", "지프", "renault", "르노",
  "peugeot", "푸조", "citroen", "시트로엥", "byd", "비야디", "nio", "샤오펑", "xpeng", "geely", "지리", "rivian", "lucid",
];

export function extractMakes(article) {
  const text = `${article.originalTitle} ${article.originalSummary}`.toLowerCase();
  return [...new Set(makes.filter((make) => text.includes(make.toLowerCase())))].slice(0, 8);
}

export function titleTokens(title) {
  return String(title ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .filter((token) => !new Set(["the", "and", "for", "with", "from", "this", "that", "new", "car", "cars"]).has(token));
}

export function titleSimilarity(left, right) {
  const a = new Set(titleTokens(left));
  const b = new Set(titleTokens(right));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((token) => { if (b.has(token)) intersection += 1; });
  return intersection / (a.size + b.size - intersection);
}

export function stableArticleId(url) {
  const number = Number.parseInt(sha1(url).slice(0, 12), 16) % 90000000;
  return String(920000000 + number);
}

export async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = 12000, accept, headers = {}, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...requestOptions,
      headers: {
        "accept": accept || "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.2",
        "user-agent": USER_AGENT,
        ...headers,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function languageForCountry(country) {
  const map = {
    "미국": "en", "영국": "en", "호주": "en", "남아공": "en", "싱가폴": "en", "인도": "en", "필리핀": "en",
    "일본": "ja", "중국": "zh-CN", "홍콩": "zh-HK", "대만": "zh-TW", "독일": "de", "프랑스": "fr", "스페인": "es",
    "이탈리아": "it", "러시아": "ru", "브라질": "pt-BR", "아르헨티나": "es", "네덜란드": "nl", "폴란드": "pl",
    "노르웨이": "no", "덴마크": "da", "스웨덴": "sv", "핀란드": "fi", "그리스": "el", "헝가리": "hu",
    "불가리아": "bg", "체코": "cs", "터키": "tr", "말레이시아": "ms", "태국": "th", "인도네시아": "id",
  };
  return map[country] || "und";
}


