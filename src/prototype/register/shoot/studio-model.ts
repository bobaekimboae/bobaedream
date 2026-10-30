export type VehicleProfile = "general" | "family" | "electric" | "convertible";
export type StudioMedia = {
  blob: Blob;
  url: string;
  duration: number;
  hasAudio: boolean;
};
export type StudioPart = {
  id: string;
  label: string;
  guide: string;
  caption: string;
  seconds: number;
  start: number;
  keepAudio: boolean;
  enabled: boolean;
  custom?: boolean;
  media?: StudioMedia;
};
export type StudioProject = {
  version: 1;
  vehicle: string;
  profile: VehicleProfile;
  target: number;
  parts: StudioPart[];
};
export type EditPart = {
  part: StudioPart;
  start: number;
  frames: number;
  seconds: number;
};
export const FPS = 30;
export const PART_LIMIT = 24;
export const PROFILES: { key: VehicleProfile; label: string }[] = [
  { key: "general", label: "일반 차량" },
  { key: "family", label: "패밀리·SUV" },
  { key: "electric", label: "전기차" },
  { key: "convertible", label: "오픈카" },
];
const part = (
  id: string,
  label: string,
  guide: string,
  seconds: number,
): StudioPart => ({
  id,
  label,
  guide,
  seconds,
  caption: "",
  start: 0,
  keepAudio: true,
  enabled: true,
});
export const PART_LIBRARY: StudioPart[] = [
  part("exterior", "외관", "앞 45도에서 시작해 옆으로 천천히 이동하세요.", 6),
  part(
    "interior",
    "대시보드",
    "조수석에서 핸들과 센터 디스플레이를 함께 담으세요.",
    5,
  ),
  part(
    "seat",
    "앞좌석 시트",
    "시트 전체를 찍고 가죽·봉제 디테일로 가까이 이동하세요.",
    4,
  ),
  part(
    "rear-seat",
    "뒷좌석 시트",
    "문 밖에서 좌석과 다리 공간이 함께 보이게 찍으세요.",
    4,
  ),
  part(
    "cluster",
    "계기판",
    "주행거리와 표시 정보가 읽히도록 고정해 찍으세요.",
    3,
  ),
  part(
    "feature",
    "주요 옵션 작동",
    "실제로 있는 옵션 하나를 선택해 작동 모습을 보여주세요.",
    5,
  ),
  part(
    "sunroof",
    "선루프",
    "차를 정차한 뒤 열리고 닫히는 모습을 실내에서 담으세요.",
    5,
  ),
  part(
    "comfort",
    "열선·통풍 시트",
    "장착 여부를 확인하고 버튼과 작동 표시를 함께 담으세요.",
    3,
  ),
  part("trunk", "트렁크", "열리는 모습과 적재 공간을 한 번에 보여주세요.", 5),
  part("wheel", "휠·타이어", "휠 전체와 타이어 상태를 가까이 담으세요.", 4),
  part(
    "engine",
    "엔진룸",
    "안전하게 정차한 상태에서 엔진룸 전체를 천천히 담으세요.",
    5,
  ),
  part(
    "exhaust",
    "배기음",
    "안전하게 정차한 차량 뒤에서 현장 소리를 담으세요.",
    5,
  ),
  part(
    "charge",
    "충전구·충전 정보",
    "충전구와 실제 화면에 표시된 충전 정보를 담으세요.",
    5,
  ),
  part(
    "roof",
    "오픈 지붕 작동",
    "정차 상태에서 주변을 확인하고 지붕 작동을 담으세요.",
    7,
  ),
  part(
    "damage",
    "흠집·사용감",
    "위치를 먼저 보여주고 가까이에서 상태를 담으세요.",
    4,
  ),
];
export const clampSeconds = (value: number) =>
  Math.max(1, Math.min(60, Math.round(Number.isFinite(value) ? value : 4)));
export function recommendedIds(profile: VehicleProfile): string[] {
  const common = ["exterior", "interior", "seat", "cluster"];
  return [
    ...common,
    ...(profile === "family"
      ? ["rear-seat", "trunk"]
      : profile === "electric"
        ? ["charge", "feature"]
        : profile === "convertible"
          ? ["roof", "feature"]
          : ["rear-seat", "feature"]),
  ];
}
export function newProject(): StudioProject {
  const ids = recommendedIds("general");
  return {
    version: 1,
    vehicle: "",
    profile: "general",
    target: 30,
    parts: ids.map((id) => ({ ...PART_LIBRARY.find((p) => p.id === id)! })),
  };
}
/** Recommendations never delete existing footage, custom parts, or the user's selection. */
export function addRecommendations(
  parts: StudioPart[],
  profile: VehicleProfile,
): StudioPart[] {
  const ids = new Set(parts.map((p) => p.id));
  return [
    ...parts,
    ...recommendedIds(profile)
      .filter((id) => !ids.has(id))
      .map((id) => ({ ...PART_LIBRARY.find((p) => p.id === id)! })),
  ].slice(0, PART_LIMIT);
}
/** Only real, enabled footage enters the edit. Never loop/freeze to invent missing seconds. */
export function makeEditPlan(parts: StudioPart[], target: number): EditPart[] {
  const ready = parts.filter(
    (p) => p.enabled && p.media && p.media.duration > p.start + 1 / FPS,
  );
  const entries = ready.map((p) => {
    const start = Math.max(0, Math.min(p.start, p.media!.duration - 1 / FPS));
    return {
      part: p,
      start,
      available: Math.max(
        1,
        Math.floor(
          Math.min(clampSeconds(p.seconds), p.media!.duration - start) * FPS +
            1e-6,
        ),
      ),
    };
  });
  const sum = entries.reduce((n, p) => n + p.available, 0);
  const budget = Math.min(
    sum,
    Math.max(entries.length, Math.round(target * FPS)),
  );
  let remaining = budget;
  let weight = sum;
  return entries.map((p, i) => {
    const frames =
      i === entries.length - 1
        ? remaining
        : Math.min(
            p.available,
            Math.max(
              1,
              Math.min(
                remaining - (entries.length - i - 1),
                Math.floor((remaining * p.available) / weight),
              ),
            ),
          );
    remaining -= frames;
    weight -= p.available;
    return { part: p.part, start: p.start, frames, seconds: frames / FPS };
  });
}
export function restoreProject(raw: unknown): StudioProject {
  const value = raw as Partial<StudioProject> | null;
  if (!value || value.version !== 1 || !Array.isArray(value.parts))
    return newProject();
  const ids = new Set<string>();
  const parts = value.parts
    .filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.label === "string" &&
        !ids.has(p.id) &&
        Boolean(ids.add(p.id)),
    )
    .slice(0, PART_LIMIT)
    .map((p) => ({
      ...p,
      label: p.label.slice(0, 32),
      guide: String(p.guide ?? "").slice(0, 180),
      caption: String(p.caption ?? "").slice(0, 60),
      start: Math.max(0, Number(p.start) || 0),
      seconds: clampSeconds(p.seconds),
      enabled: p.enabled !== false,
      keepAudio: p.keepAudio !== false,
      media:
        p.media?.blob instanceof Blob &&
        p.media.blob.size &&
        Number.isFinite(p.media.duration) &&
        p.media.duration > 0
          ? { ...p.media, url: URL.createObjectURL(p.media.blob) }
          : undefined,
    }));
  return {
    version: 1,
    vehicle: String(value.vehicle ?? "").slice(0, 60),
    profile: PROFILES.some((p) => p.key === value.profile)
      ? value.profile!
      : "general",
    target: [15, 30, 45, 60].includes(value.target!) ? value.target! : 30,
    parts,
  };
}
