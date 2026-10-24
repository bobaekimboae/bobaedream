import type { ReactElement } from "react";
// 촬영 부위 템플릿 그림. 58 앱은 단계마다 「示例」 표시가 붙은 실사 예시 영상(흰색 SUV + 움직이는 주황 화살표)을 보여 준다.
// 그 사진·영상은 58의 저작물이라 쓰지 않고, 같은 구성(예시 표시 · 촬영 대상 · 카메라 이동 방향 화살표 애니메이션)을 직접 그린다.

export type VideoStage = "exterior" | "interior" | "engine" | "trunk";

const ORANGE = "#FF7A1A";

function Arrow({ d, id }: { d: string; id: string }) {
  // 화살표가 카메라 이동 방향을 따라 그려졌다 사라지기를 반복한다(58 예시 영상의 화살표 움직임).
  return (
    <g>
      <defs>
        <marker id={`${id}-head`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill={ORANGE} />
        </marker>
      </defs>
      <path className="shoot-tpl-arrow" d={d} fill="none" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" markerEnd={`url(#${id}-head)`} pathLength={100} />
    </g>
  );
}

function Exterior() {
  return (
    <>
      <rect width="160" height="120" fill="url(#tpl-sky)" />
      <rect y="78" width="160" height="42" fill="#8E9499" />
      <ellipse cx="80" cy="86" rx="62" ry="7" fill="#000" opacity=".18" />
      <g className="shoot-tpl-car">
        <path d="M22 80 L24 64 Q26 58 36 56 L56 44 Q62 40 72 40 L104 40 Q114 40 120 46 L132 56 Q140 58 140 66 L140 80 Z" fill="#F4F5F6" stroke="#C9CDD1" strokeWidth="1.2" />
        <path d="M58 47 L72 43 L86 43 L86 56 L50 56 Z M90 43 L104 43 Q110 43 114 48 L122 56 L90 56 Z" fill="#71818A" />
        <circle cx="46" cy="81" r="10" fill="#24292F" /><circle cx="46" cy="81" r="4.5" fill="#B7BDC2" />
        <circle cx="116" cy="81" r="10" fill="#24292F" /><circle cx="116" cy="81" r="4.5" fill="#B7BDC2" />
      </g>
      <Arrow id="ext" d="M20 104 Q80 118 142 98" />
    </>
  );
}

function Interior() {
  return (
    <>
      <rect width="160" height="120" fill="#3A3F44" />
      <path d="M0 0 H160 V40 Q80 26 0 40 Z" fill="#C9D4DC" opacity=".85" />
      <path d="M0 52 Q80 34 160 52 V78 H0 Z" fill="#24292F" />
      <rect x="66" y="52" width="30" height="16" rx="2" fill="#71818A" />
      <circle cx="42" cy="74" r="20" fill="none" stroke="#101214" strokeWidth="6" />
      <circle cx="42" cy="74" r="6" fill="#101214" />
      <path d="M0 96 Q40 84 70 92 L70 120 H0 Z M160 96 Q120 84 92 92 L92 120 H160 Z" fill="#8A5A3C" />
      <Arrow id="int" d="M18 112 Q80 96 142 112" />
    </>
  );
}

function Engine() {
  return (
    <>
      <rect width="160" height="120" fill="#2B2F33" />
      <path d="M0 0 H160 L148 26 H12 Z" fill="#E6E8EA" />
      <rect x="34" y="40" width="92" height="44" rx="6" fill="#4A5056" />
      <rect x="44" y="34" width="72" height="14" rx="4" fill="#B7BDC2" />
      <circle cx="56" cy="62" r="7" fill="#24292F" /><circle cx="80" cy="62" r="7" fill="#24292F" /><circle cx="104" cy="62" r="7" fill="#24292F" />
      <rect x="12" y="46" width="18" height="30" rx="3" fill="#101214" />
      <rect x="130" y="50" width="18" height="24" rx="3" fill="#F2C94C" opacity=".85" />
      <Arrow id="eng" d="M146 108 Q80 120 18 98" />
    </>
  );
}

function Trunk() {
  return (
    <>
      <rect width="160" height="120" fill="url(#tpl-sky)" />
      <rect y="86" width="160" height="34" fill="#8E9499" />
      <path d="M24 30 L136 30 L130 92 L30 92 Z" fill="#F4F5F6" stroke="#C9CDD1" strokeWidth="1.2" />
      <path d="M34 8 L126 8 L136 30 L24 30 Z" fill="#E1E4E7" />
      <path d="M36 40 H124 L120 84 H40 Z" fill="#24292F" />
      <path d="M44 70 H116 L114 84 H46 Z" fill="#3A3F44" />
      <rect x="30" y="34" width="10" height="6" rx="2" fill="#D64545" /><rect x="120" y="34" width="10" height="6" rx="2" fill="#D64545" />
      <Arrow id="trk" d="M146 110 Q100 120 40 104" />
    </>
  );
}

const SCENES: Record<VideoStage, () => ReactElement> = { exterior: Exterior, interior: Interior, engine: Engine, trunk: Trunk };

export function StageTemplate({ stage }: { stage: VideoStage }) {
  const Scene = SCENES[stage];
  return (
    <svg className="shoot-tpl" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="tpl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFD9EE" />
          <stop offset="1" stopColor="#E8EEF2" />
        </linearGradient>
      </defs>
      <Scene />
    </svg>
  );
}

// 「촬영 규칙」 화면의 각도별 참고 그림(58은 실사 사진 9장). 보배드림 이미지 지침의 무채색 팔레트로 그린다.
export type RuleAngle = "frontLeft" | "side" | "rear" | "front" | "frontSeat" | "rearSeat" | "dash" | "cluster" | "engine";

function CarFrontLeft() {
  return (
    <g>
      <path d="M18 84 L22 62 Q26 54 40 52 L62 40 Q70 36 84 38 L118 44 Q132 48 138 60 L142 82 Z" fill="#F4F5F6" stroke="#C9CDD1" />
      <path d="M64 44 L86 41 L84 54 L52 56 Z M90 42 L114 47 L124 58 L88 56 Z" fill="#71818A" />
      <rect x="18" y="66" width="26" height="8" rx="2" fill="#D9DDE1" />
      <circle cx="40" cy="86" r="10" fill="#24292F" /><circle cx="118" cy="86" r="10" fill="#24292F" />
    </g>
  );
}
function CarSide() {
  return (
    <g>
      <path d="M16 82 L18 66 Q20 60 32 58 L54 44 Q60 40 72 40 L106 40 Q116 40 122 46 L136 58 Q144 60 144 68 L144 82 Z" fill="#F4F5F6" stroke="#C9CDD1" />
      <path d="M56 47 L72 43 L88 43 L88 57 L48 57 Z M92 43 L106 43 Q112 43 116 48 L124 57 L92 57 Z" fill="#71818A" />
      <circle cx="42" cy="84" r="10" fill="#24292F" /><circle cx="118" cy="84" r="10" fill="#24292F" />
    </g>
  );
}
function CarRear() {
  return (
    <g>
      <path d="M34 86 L36 50 Q40 36 56 34 L104 34 Q120 36 124 50 L126 86 Z" fill="#F4F5F6" stroke="#C9CDD1" />
      <path d="M46 40 H114 L118 56 H42 Z" fill="#71818A" />
      <rect x="38" y="60" width="16" height="7" rx="2" fill="#D64545" /><rect x="106" y="60" width="16" height="7" rx="2" fill="#D64545" />
      <rect x="66" y="70" width="28" height="9" rx="1.5" fill="#fff" stroke="#9AA1A8" />
      <rect x="34" y="84" width="14" height="10" rx="2" fill="#24292F" /><rect x="112" y="84" width="14" height="10" rx="2" fill="#24292F" />
    </g>
  );
}
function CarFront() {
  return (
    <g>
      <path d="M34 86 L36 52 Q40 38 56 36 L104 36 Q120 38 124 52 L126 86 Z" fill="#F4F5F6" stroke="#C9CDD1" />
      <path d="M46 42 H114 L118 56 H42 Z" fill="#71818A" />
      <rect x="38" y="60" width="18" height="7" rx="2" fill="#E1E4E7" stroke="#9AA1A8" /><rect x="104" y="60" width="18" height="7" rx="2" fill="#E1E4E7" stroke="#9AA1A8" />
      <rect x="60" y="62" width="40" height="8" rx="2" fill="#24292F" />
      <rect x="66" y="74" width="28" height="9" rx="1.5" fill="#fff" stroke="#9AA1A8" />
      <rect x="34" y="84" width="14" height="10" rx="2" fill="#24292F" /><rect x="112" y="84" width="14" height="10" rx="2" fill="#24292F" />
    </g>
  );
}
function Seats({ rear }: { rear?: boolean }) {
  return (
    <g>
      <rect width="160" height="120" fill="#3A3F44" />
      {rear ? (
        <path d="M20 100 L26 46 Q28 38 40 38 H120 Q132 38 134 46 L140 100 Z" fill="#8A5A3C" />
      ) : (
        <>
          <path d="M22 104 L30 40 Q32 30 44 30 H62 Q72 30 72 40 L70 104 Z" fill="#8A5A3C" />
          <path d="M90 104 L88 40 Q88 30 98 30 H116 Q128 30 130 40 L138 104 Z" fill="#8A5A3C" />
        </>
      )}
    </g>
  );
}
function Dash() {
  return (
    <g>
      <rect width="160" height="120" fill="#3A3F44" />
      <path d="M0 0 H160 V44 Q80 30 0 44 Z" fill="#C9D4DC" opacity=".85" />
      <path d="M0 54 Q80 36 160 54 V86 H0 Z" fill="#24292F" />
      <rect x="64" y="54" width="32" height="18" rx="2" fill="#71818A" />
      <circle cx="40" cy="82" r="22" fill="none" stroke="#101214" strokeWidth="6" />
    </g>
  );
}
function Cluster() {
  return (
    <g>
      <rect width="160" height="120" fill="#101214" />
      <circle cx="52" cy="62" r="30" fill="none" stroke="#B7BDC2" strokeWidth="3" />
      <circle cx="108" cy="62" r="30" fill="none" stroke="#B7BDC2" strokeWidth="3" />
      <path d="M52 62 L70 46 M108 62 L90 48" stroke="#FF7A1A" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}
function EngineBay() {
  return (
    <g>
      <rect width="160" height="120" fill="#2B2F33" />
      <rect x="30" y="36" width="100" height="50" rx="6" fill="#4A5056" />
      <rect x="42" y="30" width="76" height="14" rx="4" fill="#B7BDC2" />
      <circle cx="58" cy="62" r="8" fill="#24292F" /><circle cx="80" cy="62" r="8" fill="#24292F" /><circle cx="102" cy="62" r="8" fill="#24292F" />
    </g>
  );
}

export function RuleIllustration({ angle }: { angle: RuleAngle }) {
  const outdoor = ["frontLeft", "side", "rear", "front"].includes(angle);
  return (
    <svg className="shoot-rule-img" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {outdoor ? (
        <>
          <rect width="160" height="120" fill="#E8EEF2" />
          <rect y="88" width="160" height="32" fill="#B9BEC3" />
        </>
      ) : null}
      {angle === "frontLeft" && <CarFrontLeft />}
      {angle === "side" && <CarSide />}
      {angle === "rear" && <CarRear />}
      {angle === "front" && <CarFront />}
      {angle === "frontSeat" && <Seats />}
      {angle === "rearSeat" && <Seats rear />}
      {angle === "dash" && <Dash />}
      {angle === "cluster" && <Cluster />}
      {angle === "engine" && <EngineBay />}
    </svg>
  );
}
