#!/usr/bin/env bash
# 로컬 시험: 가짜 원본(tests/fake-upstream.php) + SQLite 로 계약대로 응답하는지 확인한다.
# 사용: bash tests/smoke.sh  (composer install 후)
set -u
cd "$(dirname "$0")/.."
export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)" APP_ENV=testing APP_DEBUG=false DB_CONNECTION=sqlite \
  DB_DATABASE="$PWD/database/smoke.sqlite" CACHE_STORE=array SHORTS_ADMIN_TOKEN=admin-secret \
  SHORTS_UPSTREAM=http://127.0.0.1:8790 SHORTS_ORIGINS=http://localhost:5197
rm -f database/smoke.sqlite && touch database/smoke.sqlite
php artisan migrate --force -q || exit 1
php -S 127.0.0.1:8790 tests/fake-upstream.php >/dev/null 2>&1 & UP=$!
php -S 127.0.0.1:8789 -t public public/index.php >/dev/null 2>&1 & SRV=$!
trap 'kill $UP $SRV' EXIT; sleep 1
H='http://127.0.0.1:8789/api'; pass=0; fail=0
t() { if [[ "$3" == *"$2"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $1 → $3"; fi; }
f() { if [[ "$3" != *"$2"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $1 → $3"; fi; }
req() { curl -s -o /tmp/shorts-smoke.out -w '%{http_code}' -X "$1" "$H$2" -H 'Accept: application/json' -H 'Content-Type: application/json' "${@:3}"; echo " $(cat /tmp/shorts-smoke.out)"; }

t '상태' '"ok":true' "$(req GET /health)"
OUT=$(req GET /shorts)
t '피드 200' '200' "$OUT"
t '유튜브 영상' '"kind":"youtube","id":"TO1UNT8gaak"' "$OUT"
t '파일 영상' '"cccc3333"' "$OUT"
f '영상 없는 매물 뺌' 'bbbb2222' "$OUT"
t '안심번호 숫자만' '"phone":"050411112222"' "$OUT"
t '끝이면 next null' '"next":null' "$OUT"
t '한 개씩' '"next":"aaaa1111"' "$(req GET '/shorts?limit=1')"
t '다음 장(영상 없는 매물 건너뜀)' '"cccc3333"' "$(req GET '/shorts?after=aaaa1111&limit=1')"
t '마지막 뒤 빈 목록' '"data":[]' "$(req GET '/shorts?after=cccc3333')"
t '잘못된 limit 422' '422' "$(req GET '/shorts?limit=99')"
t '잘못된 id 422' '422' "$(req GET '/shorts/x..y')"
t '한 매물' '"previous":"bbbb2222"' "$(req GET /shorts/cccc3333)"
t '영상 없는 매물 404' '404' "$(req GET /shorts/bbbb2222)"
t '없는 매물 404' '404' "$(req GET /shorts/zzzz9999)"
t '로그인 없이 찜 401' '401' "$(req PUT /shorts/cccc3333/like)"
t '틀린 토큰 찜 401' '401' "$(req PUT /shorts/cccc3333/like -H 'Authorization: Bearer bad')"
t '찜' '"likes":2' "$(req PUT /shorts/cccc3333/like -H 'Authorization: Bearer good')"
t '찜 풀기' '"liked":false' "$(req DELETE /shorts/cccc3333/like -H 'Authorization: Bearer good')"
t '1초는 안 셈' '"counted":false' "$(req POST /shorts/cccc3333/views -d '{"watched":1}')"
t '3초 셈' '"counted":true' "$(req POST /shorts/cccc3333/views -d '{"watched":3}')"
t '30분 안 중복 안 셈' '"counted":false' "$(req POST /shorts/cccc3333/views -d '{"watched":9}')"
t '시청 값 없음 422' '422' "$(req POST /shorts/cccc3333/views -d '{}')"
CH='{"video_url":"https://file9.bobaedream.co.kr/v/x_714.mp4","chapters":[{"key":"tour-walk","from":0,"to":12},{"key":"tour-engine","from":12,"to":20}]}'
t '관리자 없이 부위 403' '403' "$(req PUT /shorts/cccc3333/chapters -d "$CH")"
t '부위 저장' '200' "$(req PUT /shorts/cccc3333/chapters -H 'X-Shorts-Admin: admin-secret' -d "$CH")"
t '피드에 부위' '"chapters":[{"key":"tour-walk","from":0,"to":12}' "$(req GET /shorts/cccc3333)"
t '모르는 부위 422' '422' "$(req PUT /shorts/cccc3333/chapters -H 'X-Shorts-Admin: admin-secret' -d '{"video_url":"https://a.b/c.mp4","chapters":[{"key":"wing","from":0,"to":3}]}')"
t '겹친 부위 422' '422' "$(req PUT /shorts/cccc3333/chapters -H 'X-Shorts-Admin: admin-secret' -d '{"video_url":"https://a.b/c.mp4","chapters":[{"key":"tour-walk","from":0,"to":9},{"key":"tour-seat","from":5,"to":12}]}')"
t '허락한 화면 CORS' 'Access-Control-Allow-Origin: http://localhost:5197' "$(curl -s -i -X OPTIONS "$H/shorts" -H 'Origin: http://localhost:5197' -H 'Access-Control-Request-Method: GET')"
t '모르는 화면 CORS 거절' '403' "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "$H/shorts" -H 'Origin: https://evil.example')"
echo "통과 $pass · 실패 $fail"; [ $fail -eq 0 ]
