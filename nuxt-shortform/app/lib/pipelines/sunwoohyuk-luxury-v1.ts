export interface PipelineBeat {
  id: string;
  range: string;
  title: string;
  shots: string;
  output: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  owner: "Laravel" | "미디어 워커" | "Nuxt";
  rule: string;
}

export const sunwoohyukLuxuryV1 = {
  id: "sunwoohyuk-luxury-v1",
  version: "1.0.0",
  title: "선우혁 딜러 럭셔리 워크어라운드",
  references: ["DfGej3AuYgN", "DfEqeIHBddZ", "De9Q_xaBLNR"],
  master: "1080 × 1920 · 30fps · 30초",
  caption: "1~4어절 · 흰색 굵은 글자 · 검정 외곽선 · 핵심어 1개만 적색 강조",
  audio: "클래식 재즈·라운지 · 내레이션 중 BGM 약 8dB 감쇠",
  beats: [
    { id: "hook", range: "0.0–2.2초", title: "차량 훅", shots: "전면 3/4 · 측면 실루엣 · 엠블럼", output: "제조사·모델과 핵심 차별점 1개" },
    { id: "exterior", range: "2.2–9.0초", title: "외관", shots: "정면 · 측면 · 후면 3/4", output: "외장색과 확인된 외장 패키지" },
    { id: "detail", range: "9.0–15.0초", title: "시그니처", shots: "엠블럼 · 그릴 · 램프 · 휠", output: "부품명과 구매자 효익" },
    { id: "option", range: "15.0–22.0초", title: "실내·옵션", shots: "운전석 · 시트 · 센터 컨트롤 · 오디오", output: "옵션 ID로 확인된 항목만 설명" },
    { id: "proof", range: "22.0–27.0초", title: "차량 증거", shots: "계기판 · 기록 · 대표 외관", output: "연식·주행거리·사고·보험 이력" },
    { id: "cta", range: "27.0–30.0초", title: "가격·문의", shots: "대표 외관 또는 측면", output: "가격·딜러명·승인된 연락 수단" },
  ] satisfies PipelineBeat[],
  stages: [
    { id: "ingest", label: "매물 수집", owner: "Laravel", rule: "매물·판매자·사진·옵션의 정본 스냅샷을 만든다." },
    { id: "normalize", label: "미디어 정규화", owner: "미디어 워커", rule: "회전·코덱·노출·흔들림·중복·번호판을 측정한다." },
    { id: "classify", label: "차량 부위 분류", owner: "미디어 워커", rule: "전면·측면·후면·휠·실내 등 안정 shot ID를 부여한다." },
    { id: "ground", label: "사실 검증", owner: "Laravel", rule: "DB와 옵션 ID로 확인되지 않은 판매 문구를 제외한다." },
    { id: "storyboard", label: "스토리보드", owner: "미디어 워커", rule: "장면 점수와 사실을 30초 비트 배열로 변환한다." },
    { id: "voice", label: "대본·음성", owner: "미디어 워커", rule: "한 비트에 한 사실만 말하고 동의된 음성만 사용한다." },
    { id: "caption", label: "자막 정렬", owner: "미디어 워커", rule: "단어 타임스탬프를 1~4어절로 묶고 안전 영역에 배치한다." },
    { id: "compose", label: "편집 합성", owner: "미디어 워커", rule: "0.8~1.8초 컷, 절제된 타이틀과 BGM 감쇠를 적용한다." },
    { id: "qc", label: "렌더·자동 QC", owner: "미디어 워커", rule: "사실·자막·음량·개인정보·라이선스를 검사한다." },
    { id: "review", label: "사람 승인", owner: "Nuxt", rule: "검수 영상과 QA 결과를 보여주고 승인 여부만 전달한다." },
    { id: "publish", label: "SNS 게시", owner: "Laravel", rule: "승인된 목적지만 멱등 게시하고 실패 목적지만 재시도한다." },
  ] satisfies PipelineStage[],
} as const;
