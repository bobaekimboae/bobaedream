#!/usr/bin/env bash
# 분석 결과(out/*.json)를 as24-analysis-results 브랜치에 올린다. 중간 저장·마지막 저장 모두 이 스크립트.
set -u
git fetch -q origin +refs/heads/as24-analysis-results:refs/remotes/origin/as24-analysis-results 2>/dev/null
D=/tmp/as24-results
if [ ! -d "$D" ]; then
  if git rev-parse --verify -q origin/as24-analysis-results >/dev/null; then
    git worktree add -q -B as24-analysis-results "$D" origin/as24-analysis-results
  else
    git worktree add -q --detach "$D"
    (cd "$D" && git checkout -q --orphan as24-analysis-results && git rm -rfq . >/dev/null 2>&1; find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +)
  fi
fi
mkdir -p "$D/reports/as24-analysis"
cp out/*.json "$D/reports/as24-analysis/" 2>/dev/null || exit 0
cd "$D" && git add reports && git commit -qm "data: AS24 shorts analysis ($(ls reports/as24-analysis | wc -l) files)" && git push -q origin as24-analysis-results || true
