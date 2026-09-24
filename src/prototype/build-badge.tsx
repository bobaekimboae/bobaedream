// OP-011: 주소에 &debug=1 이 있을 때만 화면 오른쪽 아래에 "브랜치 @ 커밋 7자리 · 빌드 시각"을 작게 보여 준다.
// 값은 빌드할 때 scripts/build-info.mjs 가 넣는다(개발 서버에서는 "dev").
const env = import.meta.env as Record<string, string | undefined>;
export const buildInfo = { branch: env.VITE_BUILD_BRANCH ?? "dev", commit: env.VITE_BUILD_COMMIT ?? "dev", time: env.VITE_BUILD_TIME ?? "" };
const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

export function BuildBadge() {
  if (!debug) return null;
  return (
    <div className="build-badge" role="status" aria-label="빌드 버전" data-commit={buildInfo.commit}>
      {buildInfo.branch} @ {buildInfo.commit}{buildInfo.time ? ` · ${buildInfo.time}` : ""}
    </div>
  );
}
