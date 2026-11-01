#!/usr/bin/env bash
# 로컬 시험: SQLite로 표를 만들고 PHP 내장 서버를 띄워 계약대로 응답하는지 확인한다.
# 사용: bash tests/smoke.sh  (composer install 후)
set -u
cd "$(dirname "$0")/.."
export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)" APP_ENV=testing APP_DEBUG=${APP_DEBUG:-false} DB_CONNECTION=sqlite DB_DATABASE="$PWD/database/smoke.sqlite" COMMUNITY_ORIGINS=http://localhost:5195 CACHE_STORE=array
rm -f database/smoke.sqlite && touch database/smoke.sqlite
php artisan migrate --force -q && php artisan db:seed --force -q || exit 1
A=$(php tests/make-user.php 글쓴이); B=$(php tests/make-user.php 다른사람)
php -S 127.0.0.1:8787 -t public >/dev/null 2>&1 & SRV=$!; trap 'kill $SRV' EXIT; sleep 1
H='http://127.0.0.1:8787/api/community'; pass=0; fail=0
t() { local name=$1 want=$2 got=$3; if [[ "$got" == *"$want"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $name → $got"; fi; }
req() { curl -s -o /tmp/smoke.out -w '%{http_code}' -X "$1" "$H$2" -H 'Accept: application/json' -H 'Content-Type: application/json' ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}; echo " $(cat /tmp/smoke.out)"; }
EV=$(php -r '$m=json_decode(file_get_contents("database/data/vehicle-models.json"),true);foreach($m as $x)if($x["powertrain"]==="ev"){echo $x["id"];break;}')
ICE=$(php -r '$m=json_decode(file_get_contents("database/data/vehicle-models.json"),true);foreach($m as $x)if($x["powertrain"]==="ice"){echo $x["id"];break;}')
BODY='"출퇴근과 주말 장거리에서 함께 운행했습니다. 차체가 안정적이고 조향 반응이 자연스러워요."'
R6='{"exterior":4.5,"interior":4,"space":4,"features":3.5,"power":4,"fuel":3}'

t '게스트 me' '"id":null' "$(req GET /me)"
t '게스트 권한 없음' '"post":false' "$(req GET /me)"
t '로그인 me' '"post":true' "$(req GET /me "$A")"
t '로그인 없이 등록 401' '401 {"ok":false' "$(req POST /review/posts '' "{}")"
t '빈 리뷰 422 + fields' '"fields":["model_id"' "$(req POST /review/posts "$A" '{}')"
t '30자 미만 422' '"body"' "$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":false,\"ratings\":$R6,\"body\":\"짧아요\"}")"
t '0.5 단위 아님 422' 'ratings.fuel' "$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":false,\"ratings\":{\"exterior\":4.5,\"interior\":4,\"space\":4,\"features\":3.5,\"power\":4,\"fuel\":3.3},\"body\":$BODY}")"
t '내연차에 range 422' 'ratings.range' "$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":false,\"ratings\":{\"exterior\":4.5,\"interior\":4,\"space\":4,\"features\":3.5,\"power\":4,\"fuel\":3,\"range\":4},\"body\":$BODY}")"
t '필수 항목 빠짐 422' 'ratings.fuel' "$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":false,\"ratings\":{\"exterior\":4.5},\"body\":$BODY}")"
t '오너인데 구매정보 없음 422' 'purchase' "$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":true,\"ratings\":$R6,\"body\":$BODY}")"
OUT=$(req POST /review/posts "$A" "{\"model_id\":\"$ICE\",\"owner\":true,\"purchase\":{\"month\":\"2026.05\",\"city\":\"서울\",\"price\":7800,\"metric\":9.4},\"ratings\":$R6,\"body\":$BODY}")
t '리뷰 등록 201' '201' "$OUT"; t '평균 계산' '"rating":3.83' "$OUT"; t '실측 단위' '"metric":"9.4km/L"' "$OUT"; t '작성자 권한' '"delete":true' "$OUT"
RID=$(echo "$OUT" | sed -E 's/^[0-9]+ //' | php -r 'echo json_decode(stream_get_contents(STDIN),true)["data"]["id"];')
t '목록에 보임 · 다른 사람 권한' '"report":true' "$(req GET /review/posts "$B")"
t '남의 글 삭제 403' '403 {"ok":false' "$(req DELETE /review/posts/$RID "$B")"
t '공감' '204' "$(req PUT /review/posts/$RID/reactions/like "$B")"
t '비공감으로 바꾸면 공감 0' '"likes":0' "$(req PUT /review/posts/$RID/reactions/dislike "$B" >/dev/null; req GET /review/posts)"
t '연비 비공감 없음 404' '404' "$(req PUT /fuel/posts/$RID/reactions/dislike "$B")"
C=$(req POST /review/posts/$RID/comments "$B" '{"body":"연비는 어느 정도 나오나요?"}')
t '댓글 201' '201' "$C"; CID=$(echo "$C" | sed -E 's/^[0-9]+ //' | php -r 'echo json_decode(stream_get_contents(STDIN),true)["data"]["id"];')
t '댓글 수 1' '"comments":1' "$(req GET /review/posts)"
t '남의 댓글 삭제 403' '403' "$(req DELETE /review/posts/$RID/comments/$CID "$A")"
t '내 댓글 삭제 204' '204' "$(req DELETE /review/posts/$RID/comments/$CID "$B")"
t '임시저장 없음' '{"data":null}' "$(req GET /fuel/draft "$A")"
t '임시저장 저장' '"model_name":"아이오닉"' "$(req PUT /fuel/draft "$A" "{\"model_id\":\"$EV\",\"model_name\":\"아이오닉\",\"payload\":{\"body\":\"쓰는 중\"}}")"
t '임시저장 읽기' '"payload":{"body":"쓰는 중"}' "$(req GET /fuel/draft "$A")"
t '내연차 연비에 전비 422' 'energy_km_per_kwh' "$(req POST /fuel/posts "$A" "{\"model_id\":\"$ICE\",\"body\":\"고속도로 위주\",\"city\":\"서울\",\"energy_km_per_kwh\":5}")"
t '없는 지역 422' '"city"' "$(req POST /fuel/posts "$A" "{\"model_id\":\"$EV\",\"body\":\"출퇴근\",\"city\":\"서울시\"}")"
F=$(req POST /fuel/posts "$A" "{\"model_id\":\"$EV\",\"body\":\"출퇴근 위주로 탔어요\",\"city\":\"경기\",\"odometer_km\":12000,\"energy_km_per_kwh\":5,\"full_charge_km\":410,\"temperature_c\":15}")
t '연비 등록 201' '201' "$F"; t '전비 화면 단위(kWh/100km)' '"energy":20' "$F"; t '온도' '"temperature":15' "$F"
t '등록 후 임시저장 지움' '{"data":null}' "$(req GET /fuel/draft "$A")"
t '내 글 삭제 204' '204' "$(req DELETE /review/posts/$RID "$A")"
t '삭제 뒤 목록에서 빠짐' '"total":0' "$(req GET /review/posts)"
t 'CORS 허용 주소' 'Access-Control-Allow-Origin: http://localhost:5195' "$(curl -s -i -X OPTIONS "$H/me" -H 'Origin: http://localhost:5195' | tr -d '\r')"
t 'CORS 막힌 주소 403' '403' "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "$H/me" -H 'Origin: https://evil.example')"
echo "통과 $pass 실패 $fail"; rm -f database/smoke.sqlite; [ $fail -eq 0 ]
