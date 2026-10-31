// Framework-independent registration-month contract, shared by PC, mobile and Nuxt.
export type YearRange = { min: string; max: string; preset?: string };
type YearMonth = { year: number; month: number | null };
export type RegistrationSource = {
  registrationYearMonth?: string | null;
  filter?: { year: number; registrationMonth?: number | null };
  cardSpec?: string[];
  specs?: string[];
};

export function bbmToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric" }).formatToParts(now);
  return { year: Number(parts.find((part) => part.type === "year")!.value), month: Number(parts.find((part) => part.type === "month")!.value) };
}

export function bbmYearOptions(now = new Date()) {
  const { year } = bbmToday(now);
  return Array.from({ length: Math.max(0, year - 1979) }, (_, index) => `${year - index}년`);
}

function parseYearMonth(text: string): YearMonth | null {
  const match = text.trim().match(/^(\d{4}|\d{2})(?:년\s*(\d{1,2})월|-(\d{2})(?:-\d{2})?|\/(\d{1,2}))?(?:년(?:식|형)?)?(?:\s*\([^)]*\))?$/);
  if (!match) return null;
  const rawYear = Number(match[1]);
  const year = match[1].length === 2 ? (rawYear >= 50 ? 1900 : 2000) + rawYear : rawYear;
  const rawMonth = match[2] ?? match[3] ?? match[4];
  const month = rawMonth === undefined ? null : Number(rawMonth);
  return year >= 1900 && year <= 9999 && (month === null || (month >= 1 && month <= 12)) ? { year, month } : null;
}

export function bbmSingleYearLabel(text: string) {
  const date = parseYearMonth(text);
  return date ? `${date.year}년${date.month === null ? "" : ` ${date.month}월`}` : text;
}

export function bbmCurrentYearPreset(preset: string, now = new Date()): YearRange {
  const today = bbmToday(now);
  const text = (year: number) => `${year}년 ${today.month}월`;
  if (preset === "6년~") return { min: "", max: text(today.year - 6), preset };
  const match = preset.match(/^~([1-5])년$/);
  return match ? { min: text(today.year - Number(match[1])), max: text(today.year), preset } : { min: "", max: "" };
}

// YYYYMM, inclusive. A year-only lower/upper bound means January/December.
export function bbmYearBounds(range?: YearRange, now = new Date()) {
  const resolved = range?.preset && !range.min && !range.max ? bbmCurrentYearPreset(range.preset, now) : range;
  const from = resolved?.min ? parseYearMonth(resolved.min) : null;
  const to = resolved?.max ? parseYearMonth(resolved.max) : null;
  const min = from ? from.year * 100 + (from.month ?? 1) : null;
  const max = to ? to.year * 100 + (to.month ?? 12) : null;
  const invalidPreset = Boolean(range?.preset && !range.min && !range.max && !resolved?.min && !resolved?.max);
  const valid = !invalidPreset && !(resolved?.min && !from) && !(resolved?.max && !to) && !(min !== null && max !== null && min > max);
  return { min, max, valid };
}

export function bbmRegistrationDate(car: RegistrationSource): YearMonth | null {
  if (car.registrationYearMonth) return parseYearMonth(car.registrationYearMonth);
  const year = car.filter?.year;
  const month = car.filter?.registrationMonth;
  if (year && month != null) return parseYearMonth(`${year}-${String(month).padStart(2, "0")}`);
  // Explicit registration metadata wins over model-year and illustrative card months.
  for (const text of [...(car.cardSpec ?? []), ...(car.specs ?? [])]) {
    const parsed = parseYearMonth(text);
    if (parsed && parsed.month !== null) return parsed;
  }
  if (year) return parseYearMonth(String(year));
  for (const text of [...(car.cardSpec ?? []), ...(car.specs ?? [])]) {
    const parsed = parseYearMonth(text);
    if (parsed) return parsed;
  }
  return null;
}

export function matchesBbmYear(car: RegistrationSource, range?: YearRange, now = new Date()) {
  const { min, max, valid } = bbmYearBounds(range, now);
  if (!valid) return false;
  if (min === null && max === null) return true;
  const date = bbmRegistrationDate(car);
  if (!date) return false;
  // Unknown month is NOT invented. Include only if its entire possible year fits.
  const first = date.year * 100 + (date.month ?? 1);
  const last = date.year * 100 + (date.month ?? 12);
  return (min === null || first >= min) && (max === null || last <= max);
}
