// 원본 dealer-page/shortform/ShortformStudio.tsx · SnsPublish.tsx 의 형식(화면 없이 형식 · 글 만들기만 옮김).
import type { ShortformAspect, ShortformTemplate } from "./render";

export type MadeShortform = { id: string; url: string; poster: string; carId: number; title: string; template: ShortformTemplate; seconds: number; aspect: ShortformAspect };

// 내 SNS 계정에 올리기(2026-10-22) 플랫폼
export type PlatformId = "instagram" | "tiktok" | "facebook" | "youtube";

export function captionFor(input: { title: string; price: string; specs: string[]; dealerName: string; company: string; phone: string; maker: string; model: string }) {
  const tag = (text: string) => `#${text.replace(/[^\p{L}\p{N}]/gu, "")}`;
  return [
    `${input.title}${input.price ? ` ${input.price}` : ""}`,
    input.specs.join(" · "),
    `${input.dealerName} 딜러 · ${input.company} · 안심번호 ${input.phone}`,
    "",
    [tag("보배드림"), tag("중고차"), tag(input.maker), tag(`${input.maker}${input.model}`), tag(input.company), "#Shorts"].filter((item) => item.length > 1).join(" "),
  ].join("\n");
}

// 촬영 영상으로 쇼츠 만들기(원본 shoot-kit/ShortsMaker.tsx 의 입력 형식)
import type { Highlight } from "./shorts";
import type { VideoStage } from "./stages";
export type ShortsInput = { segs: (string | null)[]; durations: number[]; stages: VideoStage[]; labels: string[]; hl: Highlight[] };
