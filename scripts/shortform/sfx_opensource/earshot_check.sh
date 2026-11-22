#!/usr/bin/env bash
# 효과음을 earshot(MIT)의 '귀'로 점검한다 — 클로드는 소리를 못 들으므로 숫자로 판정.
#   strong(z ≥ 3.0) 만 기본 후보, plausible·weak 은 예비, no match 는 넣지 않는다.
# 설치(한 번): python3 -m venv --system-site-packages .venv-earshot
#              .venv-earshot/bin/pip install "earshot[listen,mcp] @ git+https://github.com/Leonxlnx/earshot"
# 사용: earshot_check.sh "a fast whoosh" 파일1.wav 파일2.wav ...
#       earshot_check.sh --describe 파일.wav        # 무엇처럼 들리는지
#       earshot_check.sh --timeline 영상.mp4         # 영상 소리를 시간별로 설명(효과음 위치 확인)
set -euo pipefail
E="${EARSHOT_BIN:-earshot}"
command -v "$E" >/dev/null || { echo "earshot 없음: 위 설치 줄을 실행하거나 EARSHOT_BIN 지정" >&2; exit 2; }
export EARSHOT_THREADS="${EARSHOT_THREADS:-3}"
case "${1:-}" in
  --describe) shift; exec "$E" describe "$@" ;;
  --timeline) shift; exec "$E" timeline "$@" ;;
  "") echo "사용: $0 \"설명\" 파일..." >&2; exit 2 ;;
  *) q="$1"; shift; exec "$E" rank "$q" "$@" --top 20 ;;
esac
