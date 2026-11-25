#!/bin/bash
# T11(순위표 6번) 워커 파이썬 3.13 → 3.12 나란히 비교 (클로드 마스터 2, 2026-11-25)
# 같은 코드 스냅샷·같은 FFmpeg(9.1)·같은 차 폴더로 파이썬만 바꿔 두 번 렌더 → 해시·SSIM·check_be·시간
# 사용: bash t11_py312_ab.sh <코드 스냅샷 scripts/shortform> <차 폴더> <출력 mp4 이름> <결과 폴더>
# 3.12 가상환경: uv venv -p /usr/bin/python3.12 + numpy 2.5.3 · pillow 12.3.0 · onnxruntime 1.32.0 (cv2 5.1은 abi3라 공용)
set -e
SF=$1; CAR=$2; OUTN=$3; R=$4; mkdir -p $R
PY312=${PY312:-/home/claude/tools/py312-venv/bin/python}
for V in py313 py312 py312_r2 py313_r2; do
  case $V in py313*) PY=python3; ENVX="";; *) PY=$PY312; ENVX="-u PYTHONPATH";; esac
  S=$(date +%s.%N); env $ENVX OMP_NUM_THREADS=2 $PY $SF/photo_listing/common.py $CAR > $R/$V.log 2>&1; E=$(date +%s.%N)
  cp $CAR/$OUTN $R/$V.mp4; echo "$V $(md5sum < $R/$V.mp4 | cut -c1-12) $(echo "$E - $S" | bc)초" | tee -a $R/times.txt
done
ffmpeg -i $R/py313.mp4 -i $R/py312.mp4 -lavfi ssim -f null - 2>&1 | grep -o "All:[0-9.]*" | tee $R/ssim.txt
for V in py313 py312; do python3 $SF/check_be.py $R/$V.mp4 > $R/check_$V.txt 2>&1 && echo "check_be $V 통과" || echo "check_be $V 실패"; done
