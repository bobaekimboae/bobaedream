#!/bin/bash
# 카드 정보 숏폼 일괄 제작: bash build.sh data/<차량>.json out/<폴더>
set -e
D=$1; O=$2; cd "$(dirname "$0")"; mkdir -p $O
if [ ! -f fonts/Pretendard-Black.woff2 ]; then
  mkdir -p fonts && (cd fonts && npm pack pretendard@1.3.9 --silent >/dev/null && tar xzf pretendard-1.3.9.tgz && cp package/dist/web/static/woff2/Pretendard-{Medium,Bold,ExtraBold,Black}.woff2 . && rm -rf package pretendard-1.3.9.tgz)
fi
node render.js $D $O preview
node render.js $D $O all
N=$(python3 -c "import json;print(len(json.load(open('$D'))['cards']))")
DUR="3.0$(for i in $(seq $N); do printf ',3.6'; done),3.0"
python3 mux.py $O/card_all_silent.mp4 $O/card_all.mp4 $DUR
node render.js $D $O each
for f in $O/card_[0-9]*_silent.mp4; do python3 mux.py $f ${f/_silent/} 3.6; done
rm -f $O/*_silent.mp4
echo BUILD_DONE
