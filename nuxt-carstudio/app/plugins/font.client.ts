// 사이트 공용 Pretendard Variable 한국어 조각본(촬영 키트와 같은 파일)
import { defineNuxtPlugin } from "#app";
import { attachFont, loadGlyphs } from "@kit/fonts";

export default defineNuxtPlugin(() => {
  attachFont();
  void loadGlyphs("보배드림 0123456789:/·만원년식km");
});
