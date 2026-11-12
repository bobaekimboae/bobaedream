#!/usr/bin/env bash
# 원본 영상 화질 보정(10차): 블록 노이즈 약하게 풀기 → 잡티 줄이기 → 선명하게(CAS). 위치·크기는 그대로라 트래킹 값이 바뀌지 않는다.
# 사용: enhance_source.sh <원본.mp4> <출력.mp4>
ffmpeg -y -v error -i "$1" -vf "deblock=filter=weak:block=8,hqdn3d=1.2:1.2:2:2,cas=0.55" \
  -c:v libx264 -preset medium -crf 12 -pix_fmt yuv420p -c:a copy -movflags +faststart "$2"
