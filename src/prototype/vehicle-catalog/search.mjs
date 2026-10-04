const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const TYPE_ORDER = {
  MAKE: 0,
  MODEL_GROUP: 1,
  GENERATION: 2,
  BIKE_MODEL: 2,
  GRADE: 3,
  SUBGRADE: 4,
  FUEL_DRIVE: 5,
};

const CODE_PATH_HINTS = {
  g60: "5시리즈",
  g30: "5시리즈",
  f10: "5시리즈",
  e60: "5시리즈",
  g05: "x5",
  g20: "3시리즈",
  gn7: "그랜저",
  w214: "e클래스",
  mq4: "쏘렌토",
};

const QUERY_PREFERENCES = {
  "530ixdrive": "530ixdrivem스포츠",
  "아반떼n": "20n",
};

function applyAliases(value) {
  return value
    .replace(/비엠더블유|비엠/g, "bmw")
    .replace(/mercedesbenz|mercedes|benz/g, "벤츠")
    .replace(/쌍용/g, "kg모빌리티")
    .replace(/르노삼성|삼성/g, "르노코리아")
    .replace(/gm대우|지엠대우/g, "쉐보레gm대우")
    .replace(/x드라이브/g, "xdrive")
    .replace(/([357x])series/g, "$1시리즈");
}

export function normalizeVehicleSearch(value) {
  return applyAliases(String(value ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-_·/()]+/g, "")
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ+]/g, ""));
}

export function choseongOf(value) {
  let output = "";
  for (const char of String(value ?? "")) {
    const code = char.charCodeAt(0) - 0xac00;
    output += code >= 0 && code <= 11171 ? CHOSEONG[Math.floor(code / 588)] : char;
  }
  return normalizeVehicleSearch(output);
}

const isChoseongQuery = (value) => value.length > 0 && /^[ㄱ-ㅎ]+$/.test(value);

function recordTexts(record) {
  const name = normalizeVehicleSearch(record.name);
  const pathParts = record.path.map(normalizeVehicleSearch);
  const english = normalizeVehicleSearch(record.englishName ?? "");
  const code = normalizeVehicleSearch(record.generationCode ?? "");
  const combined = normalizeVehicleSearch(record.path.join(" "));
  return { name, pathParts, english, code, combined, initials: choseongOf(record.path.join(" ")) };
}

function scoreRecord(record, rawQuery) {
  const query = normalizeVehicleSearch(rawQuery);
  if (!query) return null;
  const texts = recordTexts(record);
  const tokens = String(rawQuery ?? "").trim().split(/[\s\-_]+/).map(normalizeVehicleSearch).filter(Boolean);
  const everyToken = tokens.length > 1 && tokens.every((token) => texts.combined.includes(token) || texts.code === token);
  let score = null;
  if (texts.name === query || texts.english === query || texts.code === query) score = 0;
  else if (texts.pathParts.some((part) => part === query)) score = 4;
  else if (everyToken) score = 8;
  else if (isChoseongQuery(query) && texts.initials === query) score = 8;
  else if (texts.name.startsWith(query) || texts.english.startsWith(query) || texts.code.startsWith(query)) score = 20;
  else if (isChoseongQuery(query) && texts.initials.startsWith(query)) score = 24;
  else if (texts.name.includes(query) || texts.english.includes(query) || texts.code.includes(query)) score = 40;
  else if (texts.combined.includes(query)) score = 52;
  else if (isChoseongQuery(query) && texts.initials.includes(query)) score = 56;
  const pathHint = CODE_PATH_HINTS[query];
  if (score === null && pathHint && record.type === "GENERATION" && texts.combined.includes(pathHint)) score = 12;
  if (score === null) return null;
  if (pathHint && texts.combined.includes(pathHint)) score -= 2;
  if (pathHint && texts.pathParts.includes(pathHint)) score -= 3;
  const preference = QUERY_PREFERENCES[query];
  if (preference && texts.name.startsWith(preference)) score -= 30;
  return score + (TYPE_ORDER[record.type] ?? 9) * 0.01;
}

export function searchVehicleCatalog(records, query, limit = 30) {
  const matches = [];
  for (const record of records) {
    const score = scoreRecord(record, query);
    if (score === null) continue;
    matches.push({ record, score });
  }
  matches.sort((left, right) => left.score - right.score
    || String(right.record.releaseYm ?? "").localeCompare(String(left.record.releaseYm ?? ""))
    || left.record.path.length - right.record.path.length
    || left.record.name.localeCompare(right.record.name, "ko"));
  return matches.slice(0, limit).map(({ record }) => record);
}
