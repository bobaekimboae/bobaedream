// 사진 촬영 + 앨범(PhotoCapture.vue)에서 쓰는 형식 · 값. 원본: src/prototype/register/shoot-kit/ShootRegister.tsx · guides.tsx
import type { Photo } from "./core";
import { query } from "./site";

/** 사진 촬영 창 한 번 동안의 상태: 찍은 사진 · 고른 사진 id · 휴대폰에서 불러온 사진 */
export type CamSession = { shots: Photo[]; picked: string[]; imported: Photo[] };

/** 윤곽선 안내 시안(2026-10-24): ?guide=on 에서만 켠다(원본 guides.tsx GUIDE_ON) */
export const GUIDE_ON = typeof window !== "undefined" && query().get("guide") === "on";
