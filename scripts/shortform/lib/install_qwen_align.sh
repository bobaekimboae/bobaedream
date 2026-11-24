#!/bin/bash
# Qwen3-ForcedAligner-0.6B 별도 가상환경(2026-11-25) — qwen-asr 0.0.6이 transformers 4.57.6을 고정 요구(작업공간은 5.x)
# torch는 작업공간 것을 같이 씀(--system-site-packages). 결과는 voice_a_words.json으로만 넘긴다.
set -e
V=${QWEN_ALIGN_VENV:-/opt/qwen-align}
[ -x $V/bin/python ] && $V/bin/python -c "import qwen_asr" 2>/dev/null && exit 0
python3 -m venv --system-site-packages $V
$V/bin/pip install -q "qwen-asr==0.0.6" "transformers==4.57.6"
$V/bin/python -c "import qwen_asr, transformers; print('qwen-asr ok · transformers', transformers.__version__)"
