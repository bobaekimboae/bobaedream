export const sheetHeaders = [
  "기사 유형",
  "제조사",
  "모델",
  "인물",
  "국가",
  "출처",
  "제목",
  "기사 요약(3줄)",
  "등록상태",
  "기사ID",
  "발행일",
  "수집일",
  "대표이미지 URL",
  "원문 URL",
  "원문언어",
  "번역상태",
  "관련기사수",
];

function summaryParts(value) {
  const lines = String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (lines.length < 3) lines.push("");
  return lines;
}

export function buildSheetRows(payload) {
  return (payload.articles || []).map((article) => {
    const [summary1, summary2, summary3] = summaryParts(article.displaySummaryKo);
    return [
      article.displayArticleTypeKo || article.topic || "",
      (article.displayMakesKo || []).join(" · "),
      (article.displayModelsKo || []).join(" · "),
      (article.displayPeopleKo || []).join(" · "),
      article.country || "",
      article.source || "",
      article.displayTitleKo || "",
      [summary1, summary2, summary3].join("\n"),
      "자동등록",
      article.id || "",
      article.publishedAt || "",
      article.collectedAt || payload.generatedAt || "",
      article.previewImageUrl || article.imageUrl || "",
      article.canonicalUrl || "",
      article.originalLanguage || "",
      article.displayTranslationStatus || "",
      Number(article.relatedCount || 0),
    ];
  });
}
