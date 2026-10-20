// 매물 설명 AI 초안(2026-10-20 「초톳 AI 이미지처럼 이미지 넣으면 자동으로 설명 문구」).
// 초톳 등록폼(ia_version=3)은 사진 주소 + 카테고리 + 이미 쓴 글을 서버(generate_description)로 보내고
// 설명 글 한 덩어리를 돌려받는다. 시안은 서버가 없어 같은 입력·출력 모양의 가짜 응답을 쓴다.
// 실제 서버를 붙일 때는 generateBikeDescription 안의 fakeDraft 호출만 fetch로 바꾸면 된다.
// 원칙: 사진·선택값으로 알 수 없는 사실(사고 없음, 정비 이력 등)은 쓰지 않는다. 번호판·전화번호는 쓰지 않는다.

export type AiDescriptionInput = {
  category: "bike";
  imageUris: string[];
  description: string;
  maker?: string;
  model?: string;
  year?: string;
  type?: string;
  mileage?: string;
  ccBand?: string;
  condition?: string;
  seller?: string;
  sessionId?: string;
};

export type AiDescriptionResult = { description: string; sessionId: string };

export const AI_DESCRIPTION_LIMIT = 3;

const typeLine: Record<string, string> = {
  스쿠터: "출퇴근과 시내 이동에 편한 스쿠터입니다.",
  네이키드: "가볍게 타기 좋은 네이키드 바이크입니다.",
  스포츠: "달리는 재미가 좋은 스포츠 바이크입니다.",
  크루저: "편안한 자세로 오래 타기 좋은 크루저입니다.",
  투어러: "장거리 투어에 알맞은 투어러입니다.",
  멀티퍼퍼스: "도로와 비포장 모두 다니기 좋은 멀티퍼퍼스 바이크입니다.",
  클래식: "클래식한 디자인이 매력인 바이크입니다.",
  오프로드: "비포장 주행용 오프로드 바이크입니다.",
};

function fakeDraft(input: AiDescriptionInput, attempt: number) {
  const name = [input.maker, input.model].filter(Boolean).join(" ") || "바이크";
  const head = [input.year, name].filter(Boolean).join(" ");
  const facts = [
    input.year ? `연식: ${input.year}` : "",
    input.mileage ? `주행거리: ${Number(input.mileage.replace(/\D/g, "")).toLocaleString("ko-KR")}km` : "",
    input.ccBand ? `배기량: ${input.ccBand}` : "",
    input.condition ? `상태: ${input.condition}` : "",
  ].filter(Boolean);
  const openers = [
    `${head} 판매합니다.`,
    `${head} 정리합니다.`,
    `아끼던 ${head} 내놓습니다.`,
  ];
  const lines = [
    openers[attempt % openers.length],
    input.type && typeLine[input.type] ? typeLine[input.type] : "",
    "",
    ...facts.map((fact) => `· ${fact}`),
    facts.length ? "" : "",
    `사진 ${input.imageUris.length}장으로 외관 상태를 확인하실 수 있습니다.`,
    "사고·정비 이력과 튜닝 내역은 아래에 직접 적어 주세요.",
    "",
    input.seller === "바이크샵" ? "방문 전 연락 주시면 바로 보실 수 있게 준비해 두겠습니다." : "직거래 가능하며, 보러 오시기 전 연락 부탁드립니다.",
  ];
  const draft = lines.filter((line, index, all) => !(line === "" && all[index - 1] === "")).join("\n").trim();
  // 이미 쓴 글이 있으면 지우지 않고 그 아래에 정리한 글을 붙인다(초톳 「AI Sửa giúp」 = 고쳐 써 줘요)
  return input.description.trim() ? `${input.description.trim()}\n\n${draft}` : draft;
}

export async function generateBikeDescription(input: AiDescriptionInput, attempt: number): Promise<AiDescriptionResult> {
  if (!input.imageUris.length) throw Object.assign(new Error("missing_image"), { errorCode: "missing_image" });
  await new Promise((resolve) => window.setTimeout(resolve, 1500));
  return { description: fakeDraft(input, attempt).slice(0, 1500), sessionId: input.sessionId || `demo-${Date.now()}` };
}
