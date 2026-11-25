#!/bin/bash
# FFmpeg 9.1 「Gauss」(2026-11-20) 빌드 — BtbN 정적판에는 아직 9.1이 없어 공식 원본으로 직접 만든다.
# 결과: /home/claude/tools/ffmpeg-9.1/bin/{ffmpeg,ffprobe} (약 104MB) + 실패 시 6.1.1로 넘어가는 감싸기 /home/claude/tools/bin
set -e
P=/home/claude/tools/ffmpeg-9.1; W=${1:-/home/claude/work/osst/ff91}
mkdir -p $W && cd $W
chmod 1777 /tmp                      # 재시작 뒤 /tmp 권한이 755가 되어 apt가 실패한 적 있음
apt-get update -qq && apt-get install -y -qq libx264-dev libmp3lame-dev nasm >/dev/null
curl -sSLO https://ffmpeg.org/releases/ffmpeg-9.1.tar.xz && curl -sSLO https://ffmpeg.org/releases/ffmpeg-9.1.tar.xz.asc
curl -sSL https://ffmpeg.org/ffmpeg-devel.asc | gpg --quiet --import
gpg --verify ffmpeg-9.1.tar.xz.asc ffmpeg-9.1.tar.xz   # 지문 FCF9 86EA 15E6 E293 A564 4F10 B432 2F04 D676 58D8
tar -xJf ffmpeg-9.1.tar.xz && rm ffmpeg-9.1.tar.xz && cd ffmpeg-9.1
./configure --prefix=$P --enable-gpl --enable-libx264 --enable-libmp3lame --disable-doc --disable-debug --disable-ffplay
make -j$(nproc) && make install
$P/bin/ffmpeg -version | head -1
