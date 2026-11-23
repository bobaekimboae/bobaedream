// 차량번호 → 매물 원장 채우기(시안 단계).
// 1) 공개 매물 정보로 원장을 먼저 채우고(listingLedger)
// 2) 국토부·카히스토리 통합 API 응답이 오면 같은 키를 덮어쓴다(normalizeVehicleLookup → mergeLedger).
// 기관 키는 서버에만 둔다. 차량번호·차대번호는 화면·GitHub에 남기지 않는다(원장 내부 전용 칸만, 가린 값).
import MAP from "./vehicle-ledger-map.json";

export type Source = "매물 DB" | "딜러 입력" | "국토부" | "카히스토리" | "계산";
export type Verify = "확인됨" | "미확인" | "서로 다름";
export type Cell = { value: string | number | null; source: Source | null; verify: Verify; other?: string | number };
export type Ledger = { listing_id: string; checked_at: string; cells: Record<string, Cell> };

/** 시험 서버 응답 모양(public/vehicle-history 계약). 모르는 칸은 그대로 무시한다 */
export type VehicleHistoryResponse = {
  vehicle?: Record<string, unknown>;
  registration?: Record<string, unknown>;
  insurance?: Record<string, unknown>;
  sourceStatus?: unknown;
  queriedAt?: string;
};
export type LookupError = { code: string; message: string };

const API_URL_DEFAULT = "https://staging.bbmuseum.co.kr/v1/test/vehicle-history";
const DEALER_PURPOSE = { purpose: "USED_CAR_DEALER_LISTING_CHECK", molitLookupType: "SALE_VEHICLE_OR_OWNER_UNCONSENTED" } as const;

const pick = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};
const toYyyymm = (v: unknown): string | null => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}` : null;
};
export const normFuel = (v: unknown): string | null => {
  const s = String(v ?? "").replace(/\s/g, "");
  return s ? ((MAP.fuel as Record<string, string>)[s] ?? s) : null;
};
export const normGear = (v: unknown): string | null => {
  const s = String(v ?? "").replace(/\s/g, "");
  return s ? ((MAP.gear as Record<string, string>)[s] ?? s) : null;
};
const cast = (type: string | undefined, v: unknown): string | number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (type === "int") return toInt(v);
  if (type === "yyyymm") return toYyyymm(v);
  if (type === "fuel") return normFuel(v);
  if (type === "gear") return normGear(v);
  const s = String(v).trim();
  return s || null;
};

/** 공개 매물 정보(사이트 글자) → 원장. 출처는 「매물 DB」, 확인 상태는 「미확인」(기관 대조 전) */
export function listingLedger(listingId: string, facts: Record<string, string | number | null | undefined>, checkedAt: string): Ledger {
  const cells: Record<string, Cell> = {};
  for (const [k, raw] of Object.entries(facts)) {
    const v = k === "fuel" ? normFuel(raw) : k === "transmission" ? normGear(raw) : raw ?? null;
    cells[k] = { value: v === "" ? null : (v as string | number | null), source: v == null || v === "" ? null : "매물 DB", verify: "미확인" };
  }
  return { listing_id: listingId, checked_at: checkedAt, cells };
}

/** 기관 응답 → 원장 칸. 값이 없는 칸은 만들지 않는다(지어내지 않음) */
export function normalizeVehicleLookup(resp: VehicleHistoryResponse): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  for (const m of MAP.api_to_ledger as { api: string; key: string; source: Source; type?: string; fallback?: string }[]) {
    let v = cast(m.type, pick(resp, m.api));
    if (v == null && m.fallback) v = cast(m.type, pick(resp, m.fallback));
    if (v == null) continue;
    out[m.key] = { value: v, source: m.source, verify: "확인됨" };
  }
  for (const m of MAP.internal_only as { api: string; key: string }[]) {
    const v = pick(resp, m.api);
    if (typeof v === "string" && v) out[m.key] = { value: v, source: "국토부", verify: "확인됨" };
  }
  return out;
}

/** 매물 값과 기관 값을 합친다. 둘 다 있는데 다르면 기관 값을 쓰고 「서로 다름」 + 매물 값을 other에 남긴다 */
export function mergeLedger(base: Ledger, api: Record<string, Cell>, checkedAt: string): Ledger {
  const cells = { ...base.cells };
  for (const [k, c] of Object.entries(api)) {
    const prev = cells[k];
    const same = prev?.value != null && String(prev.value).replace(/\s/g, "") === String(c.value).replace(/\s/g, "");
    if (prev?.value != null && !same) cells[k] = { ...c, verify: "서로 다름", other: prev.value };
    else cells[k] = c;
  }
  return { ...base, checked_at: checkedAt, cells };
}

/** 등록폼 칸 이름으로 바꾼다(LOCK_ON_LOOKUP 칸만 잠그는 건 화면 쪽 일) */
export function toFormValues(l: Ledger): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [lk, fk] of Object.entries(MAP.form_keys as Record<string, string>)) {
    const v = l.cells[lk]?.value;
    if (v == null) continue;
    out[fk] = lk === "displacement_cc" ? Number(v).toLocaleString("ko-KR") : String(v);
  }
  return out;
}

/** 시험 서버 호출. 실패는 throw 하지 않고 코드로 돌려준다(화면에서 「직접 입력」 안내) */
export async function requestVehicleLookup(plate: string, apiUrl = API_URL_DEFAULT): Promise<{ ok: true; data: VehicleHistoryResponse } | { ok: false; error: LookupError }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate, consentId: crypto.randomUUID(), ...DEALER_PURPOSE }),
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: { code: String(body?.code ?? res.status), message: String(body?.message ?? "") } };
    return { ok: true, data: body as VehicleHistoryResponse };
  } catch {
    return { ok: false, error: { code: "PROVIDER_UNAVAILABLE", message: "" } };
  } finally {
    clearTimeout(timer);
  }
}

/** 실패 코드 → 화면 안내 문구 */
export function lookupErrorText(code: string): string {
  if (code === "INVALID_PLATE") return "차량번호 형식을 확인해 주세요";
  if (code === "INVALID_OWNER") return "국토부 조회 서버가 아직 번호판 단독 조회를 받지 않아요. 직접 입력해 주세요";
  if (code === "OWNER_MISMATCH") return "소유자 정보가 맞지 않아요";
  return "지금은 차량 정보를 불러오지 못했어요. 직접 입력해 주세요";
}
