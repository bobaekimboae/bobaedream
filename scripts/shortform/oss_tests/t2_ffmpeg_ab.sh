#!/bin/bash
# T2 FFmpeg 6.1.1 → 9.0.2 나란히 비교. 렌더러는 PATH의 ffmpeg를 부르므로 PATH만 바꿔 같은 렌더를 두 번 돈다.
# 사용: bash t2_ffmpeg_ab.sh <이름> <렌더 명령 전체(따옴표)> <결과 mp4 경로>
#   예) bash t2_ffmpeg_ab.sh cha13 "python3 video_listing/g350_v8_render.py ..." /path/out.mp4
# 통과: SSIM ≥ 0.99 · check_be 둘 다 통과 · 길이 차 ≤ 1프레임 · 렌더 시간 기록. 교체는 사용자 승인 뒤.
set -e
W=${OSS_WORK:-/tmp/osst}; FF9=$W/ff9
if [ ! -x $FF9/ffmpeg ]; then
  mkdir -p $FF9 && cd $FF9
  curl -sL -o ff9.tar.xz https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n9.0-latest-linux64-gpl-9.0.tar.xz
  tar -xJf ff9.tar.xz --strip-components=2 --wildcards '*/bin/ffmpeg' '*/bin/ffprobe' && rm ff9.tar.xz
  cd - >/dev/null
fi
NAME=$1; CMD=$2; OUT=$3; R=$W/t2/$NAME; mkdir -p $R
for V in old new; do
  if [ $V = new ]; then P="$FF9:$PATH"; else P="$PATH"; fi
  S=$(date +%s.%N); PATH="$P" bash -c "$CMD" > $R/$V.log 2>&1; E=$(date +%s.%N)
  cp "$OUT" $R/$V.mp4; [ -f "$OUT.plan.json" ] && cp "$OUT.plan.json" $R/$V.mp4.plan.json; echo "$V $(PATH="$P" ffmpeg -version | head -1 | cut -d' ' -f3) $(echo "$E - $S" | bc)초" | tee -a $R/times.txt
done
ffmpeg -v error -i $R/old.mp4 -i $R/new.mp4 -lavfi "[0:v][1:v]ssim=stats_file=-" -f null - 2>&1 | tail -1 > $R/ssim_tail.txt || true
ffmpeg -i $R/old.mp4 -i $R/new.mp4 -lavfi ssim -f null - 2>&1 | grep -o "All:[0-9.]*" | tee $R/ssim.txt
for V in old new; do python3 "$(dirname "$0")/../check_be.py" $R/$V.mp4 > $R/check_$V.txt 2>&1 && echo "check_be $V 통과" || echo "check_be $V 실패"; done
