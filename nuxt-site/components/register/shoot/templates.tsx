// 리액트 src/prototype/register/shoot/templates.tsx 의 부품(StageTemplate · RuleIllustration · Arrow)을 옮김.
// 데이터(STAGE_GUIDE · stageThumb · VideoStage)는 공유 파일에서 불러 쓴다. tpl · ORANGE · FRAME_MS · RULE_FILE 은 export 되지 않아 복사(keep in sync).
import { reactish, useEffect, useState } from "./react-compat";
import { STAGE_GUIDE, type VideoStage } from "@proto/register/shoot/templates";

const ORANGE = "#FF7A1A";
const base = typeof document === "undefined" ? "/" : new URL(".", document.baseURI).pathname;
const tpl = (n: string) => `${base}assets/shoot-templates/${n}.webp`;

const FRAME_MS = 1400;

const Arrow = reactish("Arrow", function Arrow({ d, id }: { d: string; id: string }) {
  // 화살표가 카메라 이동 방향을 따라 그려졌다 사라지기를 반복한다(58 예시 영상의 화살표 움직임).
  return (
    <svg class="shoot-tpl-overlay" viewBox="0 0 160 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id={`${id}-head`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill={ORANGE} />
        </marker>
      </defs>
      <path class="shoot-tpl-arrow" d={d} fill="none" stroke={ORANGE} stroke-width="6" stroke-linecap="round" marker-end={`url(#${id}-head)`} />
    </svg>
  );
});

/** 실사 장면을 차례로 보여 주는 예시 영상(사진 전환 + 천천히 움직이는 카메라) */
export const StageTemplate = reactish("StageTemplate", function StageTemplate({ stage, large }: { stage: VideoStage; large?: boolean }) {
  const g = STAGE_GUIDE[stage];
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (g.frames.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = window.setInterval(() => setI((v) => (v + 1) % g.frames.length), FRAME_MS);
    return () => window.clearInterval(t);
  }, [stage, g.frames.length]);
  return (
    <span class={`shoot-tpl is-${g.pan} ${large ? "is-large" : ""}`} aria-hidden="true">
      {g.frames.map((f, k) => (
        <img key={f} src={tpl(f)} alt="" class={k === i ? "is-on" : ""} draggable={false} />
      ))}
      <Arrow d={g.arrow} id={`${stage}${large ? "-l" : ""}`} />
    </span>
  );
});

// 「촬영 규칙」 화면의 각도별 참고 사진(58은 실사 사진 9장). 같은 BMW M3 실매물 사진을 각도별로 잘라 쓴다.
// 어느 사진을 쓸지는 shoot-items.json 항목의 rule(·ruleFlip)이 정한다. 트렁크는 영상 예시 사진을 같이 쓴다.
type RuleAngle = string;
const RULE_FILE: Record<string, string> = { trunk: "trk-1" };

export const RuleIllustration = reactish("RuleIllustration", function RuleIllustration({ angle, flip }: { angle?: RuleAngle; flip?: boolean }) {
  if (!angle) return <span class="shoot-rule-img is-empty" aria-hidden="true" />;
  return <img class="shoot-rule-img" src={tpl(RULE_FILE[angle] ?? `rule-${angle}`)} alt="" draggable={false} style={flip ? { transform: "scaleX(-1)" } : undefined} />;
});
