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

export interface PipelineMetric {
  id: string;
  label: string;
  value: string;
  acceptance: string;
}

export interface CalloutMetric {
  id: string;
  label: string;
  value: string;
}

export const sunwoohyukLuxuryV1 = {
  id: "sunwoohyuk-luxury-v1",
  version: "1.1.0",
  title: "선우혁 딜러 럭셔리 워크어라운드",
  references: ["DfGej3AuYgN", "DfEqeIHBddZ", "De9Q_xaBLNR"],
  master: "1080 × 1920 · 30fps CFR · H.264 High · 30.0초",
  caption: "56px/700 · 최대 2줄 · 좌우 72px · 하단 384px 안전 영역",
  audio: "-15 LUFS ±1 · -1 dBTP 이하 · 내레이션 중 BGM 8dB 감쇠",
  beats: [
    { id: "hook", range: "0.0–2.2초", title: "차량 훅", shots: "전면 3/4 · 측면 실루엣 · 엠블럼", output: "제조사·모델과 핵심 차별점 1개" },
    { id: "exterior", range: "2.2–9.0초", title: "외관", shots: "정면 · 측면 · 후면 3/4", output: "외장색과 확인된 외장 패키지" },
    { id: "detail", range: "9.0–15.0초", title: "시그니처", shots: "엠블럼 · 그릴 · 램프 · 휠", output: "부품명과 구매자 효익" },
    { id: "option", range: "15.0–22.0초", title: "실내·옵션", shots: "운전석 · 시트 · 센터 컨트롤 · 오디오", output: "옵션 ID로 확인된 항목만 설명" },
    { id: "proof", range: "22.0–27.0초", title: "차량 증거", shots: "계기판 · 기록 · 대표 외관", output: "연식·주행거리·사고·보험 이력" },
    { id: "cta", range: "27.0–30.0초", title: "가격·문의", shots: "대표 외관 또는 측면", output: "가격·딜러명·승인된 연락 수단" },
  ] satisfies PipelineBeat[],
  technical: [
    { id: "video", label: "영상 인코딩", value: "1080×1920 · 30fps CFR · H.264 High@4.1 · yuv420p · 10Mbps", acceptance: "길이 30.0초 ±0.15초, 프레임 드롭 0, 검은 프레임 2프레임 이하" },
    { id: "audio", label: "오디오 인코딩", value: "AAC-LC · 48kHz · 192kbps · stereo", acceptance: "통합 -15 LUFS ±1, True Peak -1 dBTP 이하, 무음 공백 500ms 이하" },
    { id: "cuts", label: "컷 편집", value: "일반 0.8~1.8초 · 히어로 최대 2.2초 · 하드컷 80% 이상", acceptance: "동일 구도 연속 금지, 3프레임 미만 플래시 컷 금지, 비트 오차 ±2프레임" },
    { id: "caption", label: "자막", value: "Pretendard 56px/700 · 행간 1.18 · 최대 2줄 · 1~4어절", acceptance: "좌우 72px, 상단 180px, 하단 384px 침범 0, 핵심어 강조 1개 이하" },
    { id: "score", label: "장면 점수", value: "차량 식별 30% + 선명도 20% + 부위 완결 20% + 움직임 15% + 노출 10% - 중복 5%", acceptance: "대표 컷 0.75 이상, 일반 컷 0.62 이상, 미달 시 재촬영 요청" },
    { id: "facts", label: "사실 검증", value: "listing_id + option_id + stable shot_id 결합", acceptance: "confirmed만 판매 문구 허용, suspected/unknown은 노출 금지, 불일치 시 렌더 중단" },
    { id: "privacy", label: "개인정보", value: "번호판·얼굴 프레임별 마스킹 · 12px 확장", acceptance: "추적 신뢰도 0.90 이상, 1프레임이라도 누락되면 게시 차단" },
    { id: "render", label: "렌더 성능", value: "사진 12장·30초 기준 워커 1건 처리", acceptance: "p95 180초 이하, 실패 시 2회 지수 재시도, 같은 job_key 중복 렌더 0" },
  ] satisfies PipelineMetric[],
  callout: [
    { id: "anchor", label: "앵커", value: "24×24px 링 · 중심점 8px · 흰색 1px · 청색 글로우 12px" },
    { id: "leader", label: "연결선", value: "2px · 최소 48px · 최대 280px · 꺾임 1회 이하" },
    { id: "panel", label: "정보 패널", value: "300~420px · 패딩 24px · 반경 18px · perspective 800px · rotateY ±6°" },
    { id: "tracking", label: "부위 추적", value: "신뢰도 0.72 이상 · EMA α 0.25 · 화면 흔들림 8px 이하" },
    { id: "motion", label: "등장 모션", value: "180ms 인 · 1.6~3.2초 유지 · 140ms 아웃 · scale 0.96→1" },
    { id: "density", label: "화면 밀도", value: "동시 최대 2개 · 차량 bbox 중첩 10% 이하 · 자막과 24px 이상 이격" },
    { id: "fallback", label: "추적 실패", value: "4프레임 연속 미검출 시 140ms 페이드아웃 · 하단 정보바로 전환" },
    { id: "evidence", label: "노출 조건", value: "confirmed option_id와 visible part가 모두 있을 때만 3D 말풍선 사용" },
  ] satisfies CalloutMetric[],
  stages: [
    { id: "ingest", label: "매물 수집", owner: "Laravel", rule: "매물·판매자·사진·옵션의 정본 스냅샷을 만든다." },
    { id: "normalize", label: "미디어 정규화", owner: "미디어 워커", rule: "회전·코덱·노출·흔들림·중복·번호판을 측정한다." },
    { id: "classify", label: "차량 부위 분류", owner: "미디어 워커", rule: "전면·측면·후면·휠·실내 등 안정 shot ID를 부여한다." },
    { id: "ground", label: "사실 검증", owner: "Laravel", rule: "DB와 옵션 ID로 확인되지 않은 판매 문구를 제외한다." },
    { id: "storyboard", label: "스토리보드", owner: "미디어 워커", rule: "장면 점수와 사실을 30초 비트 배열로 변환한다." },
    { id: "voice", label: "대본·음성", owner: "미디어 워커", rule: "한 비트에 한 사실만 말하고 동의된 음성만 사용한다." },
    { id: "caption", label: "자막 정렬", owner: "미디어 워커", rule: "단어 타임스탬프를 1~4어절로 묶고 안전 영역에 배치한다." },
    { id: "compose", label: "편집 합성", owner: "미디어 워커", rule: "0.8~1.8초 컷, 절제된 타이틀과 BGM 감쇠를 적용한다." },
    { id: "callout", label: "3D 옵션 말풍선", owner: "미디어 워커", rule: "확인된 option_id를 보이는 차량 부위에 추적 고정하고, 좌표를 잃으면 즉시 숨긴다." },
    { id: "qc", label: "렌더·자동 QC", owner: "미디어 워커", rule: "사실·자막·음량·개인정보·라이선스를 검사한다." },
    { id: "review", label: "사람 승인", owner: "Nuxt", rule: "검수 영상과 QA 결과를 보여주고 승인 여부만 전달한다." },
    { id: "publish", label: "SNS 게시", owner: "Laravel", rule: "승인된 목적지만 멱등 게시하고 실패 목적지만 재시도한다." },
  ] satisfies PipelineStage[],
} as const;
