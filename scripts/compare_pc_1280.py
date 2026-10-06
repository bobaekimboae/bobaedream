"""JOB-3 PC 1280 실개발 ↔ PR 시안 대조 진입점.

선택자와 판정 규칙의 정본은 compare_pc_1280.mjs 하나로 유지한다. Python
Playwright 설치 여부와 무관하게 같은 Node 검사를 실행하므로 두 파일의 결과가
갈라지지 않는다.
"""

import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parent.parent
raise SystemExit(
    subprocess.run(
        ["node", str(ROOT / "scripts" / "compare_pc_1280.mjs"), *sys.argv[1:]],
        cwd=ROOT,
        check=False,
    ).returncode
)
