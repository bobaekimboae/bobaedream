#!/usr/bin/env bash
# 로컬 시험: 가짜 추출 일꾼 + SQLite + 동기 큐로 계약대로 응답하는지 확인. 사용: bash tests/smoke.sh (composer install 후)
set -u
cd "$(dirname "$0")/.."
mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app
export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)" APP_ENV=testing APP_DEBUG=false DB_CONNECTION=sqlite \
  DB_DATABASE="$PWD/database/smoke.sqlite" CACHE_STORE=array QUEUE_CONNECTION=sync LISTING_IMPORT_TOKEN=svc-secret \
  LISTING_IMPORT_WORKER="$PWD/tests/fake-worker.py" LISTING_IMPORT_SHEET_DRIVER=log
rm -f database/smoke.sqlite storage/app/sheet-rows.jsonl && touch database/smoke.sqlite
php artisan migrate --force -q || exit 1
php -S 127.0.0.1:8791 -t public public/index.php >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV' EXIT; sleep 1
H='http://127.0.0.1:8791/api'; A='Authorization: Bearer svc-secret'; pass=0; fail=0
t() { if [[ "$3" == *"$2"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $1 → $3"; fi; }
f() { if [[ "$3" != *"$2"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $1 → $3"; fi; }
req() { curl -s -o /tmp/li-smoke.out -w '%{http_code}' -X "$1" "$H$2" -H 'Accept: application/json' -H 'Content-Type: application/json' "${@:3}"; echo " $(cat /tmp/li-smoke.out)"; }
id() { python3 -c "import json;print(json.load(open('/tmp/li-smoke.out'))['data']['id'])"; }

t '상태' '"ok":true' "$(req GET /health)"
t '토큰 없음 401' '401' "$(req POST /listing-imports -d '{"url":"https://fem.encar.com/cars/detail/1","dealer_key":"d1"}')"
t '지원 안 하는 사이트 422' 'unsupported_site' "$(req POST /listing-imports -H "$A" -d '{"url":"https://www.kbchachacha.com/x","dealer_key":"d1"}')"
t '조합·매매단지 사이트 수' '"complex_sites":' "$(req GET /health)"
OUT=$(req POST /listing-imports -H "$A" -d '{"url":"https://www.djcar.org/car/car_detail.html?DemoNo=0261400761","dealer_key":"d9"}')
t '조합 사이트 접수 202' '202' "$OUT"; t '조합 사이트 이름' '"site":"대전카"' "$OUT"
t '로봇 금지 사이트 422' 'unsupported_site' "$(req POST /listing-imports -H "$A" -d '{"url":"http://ggauto.co.kr/x","dealer_key":"d1"}')"
t '링크 아님 422' '422' "$(req POST /listing-imports -H "$A" -d '{"url":"abc","dealer_key":"d1"}')"
OUT=$(req POST /listing-imports -H "$A" -d '{"url":"https://fem.encar.com/cars/detail/1?utm=x","dealer_key":"d1","dealer_name":"홍길동"}')
t '접수 202' '202' "$OUT"; I1=$(id)
OUT=$(req GET /listing-imports/$I1 -H "$A")
t '완료' '"status":"done"' "$OUT"
t '본인 매물' '"owner_check":"본인 매물"' "$OUT"
t '차량번호 가림' '00가****' "$OUT"; f '차량번호 원문 없음' '00가1234' "$OUT"
t '연락처 가림' '010-****-5678' "$OUT"
t '사진 저장' 'listing-imports' "$OUT"
t '시트 저장' '"sheet_synced":true' "$OUT"
t '같은 링크 한 줄' '"existing":true' "$(req POST /listing-imports -H "$A" -d '{"url":"https://fem.encar.com/cars/detail/1","dealer_key":"d1"}')"
OUT=$(req POST /listing-imports -H "$A" -d '{"url":"https://www.m-park.co.kr/buy/detail/2","dealer_key":"d1","dealer_name":"다른사람"}'); I2=$(id)
t '확인 필요' '"status":"needs_review"' "$(req GET /listing-imports/$I2 -H "$A")"
OUT=$(req GET /dealers/d1/listings -H "$A")
t '흩어진 매물 1대로 묶음' '"total_cars":1' "$OUT"
t '링크 2개' '"total_links":2' "$OUT"
t '가격 차이' '"price_gap_krw":490000' "$OUT"
OUT=$(req POST /listing-imports -H "$A" -d '{"url":"https://www.m-park.co.kr/buy/detail/fail","dealer_key":"d1"}'); I3=$(id)
t '추출 실패 기록' '"status":"failed"' "$(req GET /listing-imports/$I3 -H "$A")"
t '방금 확인 429' '429' "$(req POST /listing-imports/$I1/recheck -H "$A")"
t '없는 번호 404' '404' "$(req GET /listing-imports/00000000-0000-4000-8000-000000000000 -H "$A")"
t '시트 한 줄(확인 필요 제외)' '1' "$(wc -l < storage/app/sheet-rows.jsonl | tr -d ' ')"
echo "통과 $pass · 실패 $fail"; [ "$fail" = 0 ]
