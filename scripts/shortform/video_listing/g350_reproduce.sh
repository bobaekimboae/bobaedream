#!/usr/bin/env bash
# 기준 영상 G350 v13을 같은 코드·같은 입력으로 다시 만든다(30회 재현 시험).
# 2026-11-23 2회차에서 v13과 화소 차이 0을 확인한 절차. 단계마다 걸린 초를 times.txt에 남긴다.
#
# 입력(저장소): samples/g350_work/{words5,words_clean,tracks,plan_auto}.json · samples/g350_edit.json · samples/g350_input.json
# 입력(저장소 밖):
#   src.mp4    딜러 원본 영상(구글 드라이브 src_drive.mp4, 65MB)
#   voice5.wav 일레븐랩스 생성 기록 flow OGXUwSfSnIWfz1JO99MI / generation 9S0YbSP1A9876EPztDQn
#              (eleven_v4, voice HvCQYI15cbdFVC9pSBfb, 2026-11-21, 68.75초) — 다시 생성하지 말고 기록에서 내려받는다
#
# 사용: G350_DIR=/작업폴더/ ROUND=03 bash g350_reproduce.sh   (작업폴더 끝에 / 필수, src.mp4·voice_src.mp3를 미리 넣어 둠)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SH="$(dirname "$HERE")"
G="${G350_DIR:?G350_DIR 필요}"; R="${ROUND:-02}"; OUT="bobae_g350_r${R}.mp4"
cd "$G"; : > times.txt
t(){ local s=$(date +%s.%N); "$@"; echo "$1 $(echo "$(date +%s.%N)-$s"|bc)" >> times.txt; }
step_voice(){ ffmpeg -v error -y -i voice_src.mp3 -ac 1 -ar 44100 voice5.wav; ffmpeg -v error -y -i voice_src.mp3 -ac 1 -ar 16000 -f f32le v5.raw; }
step_words(){ if [ "${REUSE_WORDS:-1}" = 1 ]; then cp "$HERE/samples/g350_work/words5.json" .; else python3 - <<'EOF'
import json,numpy as np
from faster_whisper import WhisperModel
a=np.fromfile('v5.raw',dtype=np.float32)
m=WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo',device='cpu',compute_type='int8')
segs,_=m.transcribe(a,language='ko',word_timestamps=True,beam_size=5)
json.dump([[w.word.strip(),round(w.start,3),round(w.end,3)] for s in segs for w in s.words],open('words5.json','w'),ensure_ascii=False)
EOF
fi; }
step_clean(){ (cd "$HERE" && G350_DIR="$G" DUMPWS=1 python3 g350_v8_render.py); }
step_track(){ (cd "$HERE" && G350_DIR="$G" python3 g350_track.py >/dev/null); }
step_plan(){ (cd "$HERE" && python3 feature_edit_planner.py samples/g350_input.json --out "$G/plan_auto.json" >/dev/null); }
step_render(){ (cd "$HERE" && G350_DIR="$G" G350_OUT="$OUT" python3 g350_v8_render.py); }
step_check(){ python3 "$SH/check_be.py" "$G$OUT"; }
step_gate(){ (cd "$SH" && python3 edit_gate.py post "$G$OUT" --plates) || true; }
for s in step_voice step_words step_clean step_track step_plan step_render step_check step_gate; do t $s; done
cat times.txt
