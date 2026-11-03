// 사이트 공용 Pretendard Variable 한국어 조각본(화면에 보이는 글자 조각만 받는다)
import { defineNuxtPlugin } from "#app";
import { sitePath } from "~/lib/site";

export default defineNuxtPlugin(() => {
  if (document.getElementById("bbm-pretendard")) return;
  const link = document.createElement("link");
  link.id = "bbm-pretendard";
  link.rel = "stylesheet";
  link.href = sitePath("assets", "fonts", "pretendard", "pretendard-guazi.css");
  document.head.appendChild(link);
});
