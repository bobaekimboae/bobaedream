#!/bin/bash
# FFmpeg 9.0 정적 빌드(BtbN, GPL)를 /opt/ff9 에 설치하고 PATH 앞에 둔다. 세션이 새로 열릴 때마다 한 번 실행.
# 6.1 은 /usr/bin/ffmpeg 와 /usr/local/bin/ffmpeg6(샌드박스 실행기)로 남는다.
set -e
D=${FF9_DIR:-/opt/ff9}
URL=https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n9.0-latest-linux64-gpl-9.0.tar.xz
if ! "$D/ffmpeg" -hide_banner -version 2>/dev/null | head -1 | grep -q "version n9\."; then
  mkdir -p "$D"
  # 압축 파일을 디스크에 두지 않고 ffmpeg·ffprobe 두 개만 바로 푼다(디스크 여유 약 350MB 필요)
  curl -sfL "$URL" | tar xJ -C "$D" --strip-components=2 --wildcards '*/bin/ffmpeg' '*/bin/ffprobe'
fi
"$D/ffmpeg" -hide_banner -version | head -1 | grep -q "version n9\." || { echo "FFmpeg 9 설치 실패" >&2; exit 1; }
"$D/ffmpeg" -hide_banner -encoders 2>/dev/null | grep -q " libx264 " || { echo "libx264 없음" >&2; exit 1; }
# 모든 셸·스크립트가 쓰도록 /usr/local/bin 에 연결. 6.1 실행기는 ffmpeg6 로 남긴다(되돌리기: mv /usr/local/bin/ffmpeg6 /usr/local/bin/ffmpeg; rm /usr/local/bin/ffprobe)
if [ -w /usr/local/bin ]; then
  [ -e /usr/local/bin/ffmpeg6 ] || { [ -f /usr/local/bin/ffmpeg ] && [ ! -L /usr/local/bin/ffmpeg ] && mv /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg6; } || true
  ln -sf "$D/ffmpeg" /usr/local/bin/ffmpeg; ln -sf "$D/ffprobe" /usr/local/bin/ffprobe
fi
for f in ~/.bashrc ~/.profile; do grep -q "$D" $f 2>/dev/null || echo "export PATH=$D:\$PATH" >> $f; done
echo "$("$D/ffmpeg" -hide_banner -version | head -1)"
