import { useEffect, useState } from "react";
// 촬영 부위 템플릿. 58 앱은 단계마다 「示例」 표시가 붙은 실사 예시 영상(차량 + 움직이는 주황 화살표)을 보여 준다.
// 58의 예시 영상은 58 저작물이라 쓰지 않고, 보배드림이 가진 실매물 사진(서울오토갤러리 BMW M3 스튜디오 촬영본)으로
// 같은 구성(예시 표시 · 실제 촬영 장면 순서 · 카메라 이동 방향 화살표)을 만든다.

export type VideoStage = "exterior" | "interior" | "engine" | "trunk" | "cluster" | "start" | "tyre" | "damage" | "feature" | "under";

const ORANGE = "#FF7A1A";
const base = typeof document === "undefined" ? "/" : new URL(".", document.baseURI).pathname;
const tpl = (n: string) => `${base}assets/shoot-templates/${n}.webp`;

/** 단계별 실사 장면(촬영 순서대로)과 카메라 이동 화살표, 촬영 안내 */
export const STAGE_GUIDE: Record<VideoStage, { frames: string[]; arrow: string; how: string; pan: "orbit" | "sweep" | "tilt" }> = {
  exterior: { frames: ["ext-1", "ext-2", "ext-3", "ext-4"], arrow: "M14 104 Q80 124 146 100", how: "차 앞에서 시작해 차 주위를 한 바퀴 천천히 돌며 찍어 주세요. 정면 → 좌측 앞 → 좌측 뒤 → 후면 순서예요.", pan: "orbit" },
  interior: { frames: ["int-1", "int-2", "int-3", "int-4"], arrow: "M18 108 Q80 92 142 108", how: "운전석 문을 열고 앞좌석 → 대시보드 → 계기판·핸들 → 뒷좌석 순서로 천천히 찍어 주세요.", pan: "sweep" },
  engine: { frames: ["eng-1"], arrow: "M18 100 Q80 116 142 100", how: "보닛을 끝까지 열고 엔진룸 왼쪽에서 오른쪽으로 천천히 훑어 주세요.", pan: "sweep" },
  trunk: { frames: ["trk-1"], arrow: "M80 14 Q92 60 80 106", how: "트렁크를 열고 위에서 아래로 바닥까지 다 보이게 찍어 주세요.", pan: "tilt" },
  // 추가 촬영(CARS24식 부위별 확장 시안, ?vstage=plus)
  cluster: { frames: ["opt-cluster"], arrow: "M30 60 Q80 48 130 60", how: "시동을 켜고 계기판을 3초 동안 움직이지 말고 찍어 주세요. 주행거리와 경고등이 보여야 해요.", pan: "sweep" },
  start: { frames: ["opt-start-1"], arrow: "M18 100 Q80 116 142 100", how: "보닛을 연 채로 녹화를 시작한 뒤 시동을 걸어 주세요. 시동 소리와 엔진 떨림이 담겨야 해요.", pan: "sweep" },
  tyre: { frames: ["opt-tyre"], arrow: "M40 30 Q130 60 40 100", how: "바퀴 4개를 차례로, 타이어 홈이 보이게 가까이 찍어 주세요.", pan: "orbit" },
  damage: { frames: ["opt-damage-1", "opt-damage-2"], arrow: "M14 104 Q80 124 146 100", how: "차 주위를 돌며 흠집·찍힘이 보이면 화면을 눌러 표시해 주세요. 누른 곳이 매물 화면에 점으로 보여요.", pan: "orbit" },
  feature: { frames: ["opt-feature-1", "opt-feature-2", "opt-feature-3"], arrow: "M18 108 Q80 92 142 108", how: "후방카메라 · 내비게이션 · 선루프처럼 자랑할 옵션을 켜서 작동하는 모습을 찍어 주세요.", pan: "sweep" },
  under: { frames: ["opt-under"], arrow: "M18 100 Q80 116 142 100", how: "차 아래와 머플러 쪽을 비스듬히 찍어 주세요. 기름이 샌 자국이 없는지 보여 주면 좋아요.", pan: "sweep" },
};

const FRAME_MS = 1400;

function Arrow({ d, id }: { d: string; id: string }) {
  // 화살표가 카메라 이동 방향을 따라 그려졌다 사라지기를 반복한다(58 예시 영상의 화살표 움직임).
  return (
    <svg className="shoot-tpl-overlay" viewBox="0 0 160 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id={`${id}-head`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill={ORANGE} />
        </marker>
      </defs>
      <path className="shoot-tpl-arrow" d={d} fill="none" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" markerEnd={`url(#${id}-head)`} />
    </svg>
  );
}

/** 실사 장면을 차례로 보여 주는 예시 영상(사진 전환 + 천천히 움직이는 카메라) */
/** 단계의 첫 예시 사진(추가 촬영 고르기 목록용) */
export const stageThumb = (stage: VideoStage) => tpl(STAGE_GUIDE[stage].frames[0]);

export function StageTemplate({ stage, large }: { stage: VideoStage; large?: boolean }) {
  const g = STAGE_GUIDE[stage];
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (g.frames.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = window.setInterval(() => setI((v) => (v + 1) % g.frames.length), FRAME_MS);
    return () => window.clearInterval(t);
  }, [stage, g.frames.length]);
  return (
    <span className={`shoot-tpl is-${g.pan} ${large ? "is-large" : ""}`} aria-hidden="true">
      {g.frames.map((f, k) => (
        <img key={f} src={tpl(f)} alt="" className={k === i ? "is-on" : ""} draggable={false} />
      ))}
      <Arrow d={g.arrow} id={`${stage}${large ? "-l" : ""}`} />
    </span>
  );
}

// 「촬영 규칙」 화면의 각도별 참고 사진(58은 실사 사진 9장). 같은 BMW M3 실매물 사진을 각도별로 잘라 쓴다.
export type RuleAngle = "frontLeft" | "side" | "rear" | "front" | "frontSeat" | "rearSeat" | "dash" | "cluster" | "engine";

export function RuleIllustration({ angle }: { angle: RuleAngle }) {
  return <img className="shoot-rule-img" src={tpl(`rule-${angle}`)} alt="" draggable={false} />;
}
