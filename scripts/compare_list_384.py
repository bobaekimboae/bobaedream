"""JOB-3 모바일 384 실개발 ↔ PR 시안 대조 진입점.

저장소의 Playwright(Node) 고정 의존성을 사용해 별도 Python 패키지 설치 없이
기존 compare_list_384.py 기준을 재현한다.
"""

import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parent.parent
raise SystemExit(
    subprocess.run(
        ["node", str(ROOT / "scripts" / "compare_list_384.mjs"), *sys.argv[1:]],
        cwd=ROOT,
        check=False,
    ).returncode
)
