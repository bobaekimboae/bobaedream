// 차 종류별 사진 칸(2026-10-31 「진행해라」, Motorway식): 2인승은 뒷좌석, 트럭은 트렁크 · 뒷좌석 칸이 없다.
// 고른 차 종류는 이 작업(임시저장 포함)에만 붙는다. 우선 4장은 어떤 차 종류에서도 빼지 않는다. 58 재현(&vstage=58)은 쓰지 않는다.
import { computed, ref } from "vue";
import { SHOOT, isRequiredItem, type BodyDef } from "./items";

export const BODIES: BodyDef[] = SHOOT.photo.bodies ?? [];
export const DEFAULT_BODY = BODIES[0]?.id ?? "car";
/** 지금 고른 차 종류(등록 화면 · 촬영 화면 · 규칙 화면이 같이 읽는다) */
export const body = ref<string>(DEFAULT_BODY);
export const bodyOf = (id: string) => BODIES.find((b) => b.id === id);
/** 지금 차 종류에서 뺄 칸(우선 칸은 빼지 않는다) */
export const hiddenSlots = computed(() => new Set((bodyOf(body.value)?.hide ?? []).filter((id) => !isRequiredItem(id))));
export const slotShown = (id: string) => !hiddenSlots.value.has(id);
export const setBody = (id: string | undefined) => (body.value = id && bodyOf(id) ? id : DEFAULT_BODY);
