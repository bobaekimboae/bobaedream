#!/bin/bash
# 카드 정보 숏폼 일괄 제작 v2: bash build.sh data/<차량>.json out/<폴더> [프리셋...]
# 프리셋을 안 주면 data.meta.presets 전부. 카드는 매물별 1장~여러 장(available:false 자동 생략).
set -e
D=$1; O=$2; shift 2; cd "$(dirname "$0")"; mkdir -p $O
if [ ! -f fonts/Pretendard-Black.woff2 ]; then
  mkdir -p fonts && (cd fonts && npm pack pretendard@1.3.9 --silent >/dev/null && tar xzf pretendard-1.3.9.tgz && cp package/dist/web/static/woff2/Pretendard-{Medium,Bold,ExtraBold,Black}.woff2 . && rm -rf package pretendard-1.3.9.tgz)
fi
PRESETS=${@:-$(python3 -c "import json;print(' '.join(json.load(open('$D'))['meta']['presets']))")}
node render.js $D $O preview full
for P in $PRESETS; do
  node render.js $D $O all $P
  python3 mux.py $O/card_${P}_silent.mp4 $O/card_${P}.mp4 $(cat $O/segments_${P}.txt)
done
node render.js $D $O each full
for f in $O/card_[0-9]*_silent.mp4; do python3 mux.py $f ${f/_silent/} 3.6; done
rm -f $O/*_silent.mp4
echo BUILD_DONE
