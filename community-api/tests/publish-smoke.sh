#!/usr/bin/env bash
# 글쓰기 키트(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가) 로컬 시험. SQLite + PHP 내장 서버.
# 사용: bash tests/publish-smoke.sh  (composer install 후)
set -u
cd "$(dirname "$0")/.."
export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)" APP_ENV=testing APP_DEBUG=${APP_DEBUG:-false} DB_CONNECTION=sqlite DB_DATABASE="$PWD/database/pub-smoke.sqlite" COMMUNITY_ORIGINS=http://localhost:5195 CACHE_STORE=array APP_URL=http://127.0.0.1:8788 FILESYSTEM_DISK=local
rm -f database/pub-smoke.sqlite && touch database/pub-smoke.sqlite
# PostgreSQL 로 시험: SMOKE_PG="host db user password" bash tests/publish-smoke.sh
if [ -n "${SMOKE_PG:-}" ]; then read -r h d u pw <<<"$SMOKE_PG"; export DB_CONNECTION=pgsql DB_HOST=$h DB_DATABASE=$d DB_USERNAME=$u DB_PASSWORD=$pw; php artisan migrate:fresh --force -q || exit 1; fi
php artisan migrate --force -q && php artisan db:seed --force -q || exit 1
mkdir -p storage/app/public && ln -sfn ../storage/app/public public/storage
A=$(php tests/make-user.php 글쓴이); B=$(php tests/make-user.php 다른사람)
php -S 127.0.0.1:8788 -t public >/dev/null 2>&1 & SRV=$!; trap 'kill $SRV; rm -f public/storage' EXIT; sleep 1
H='http://127.0.0.1:8788/api/community'; pass=0; fail=0; T=$(mktemp -d)
t() { local name=$1 want=$2 got=$3; if [[ "$got" == *"$want"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $name → ${got:0:300}"; fi; }
nt() { local name=$1 bad=$2 got=$3; if [[ "$got" != *"$bad"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "실패: $name → ${got:0:300}"; fi; }
req() { curl -s -o $T/out -w '%{http_code}' -X "$1" "$H$2" -H 'Accept: application/json' -H 'Content-Type: application/json' ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}; echo " $(cat $T/out)"; }
up() { curl -s -o $T/out -w '%{http_code}' -X POST "$H/uploads" -H 'Accept: application/json' -H "Authorization: Bearer $1" "${@:2}"; echo " $(cat $T/out)"; }
idof() { echo "$1" | sed -E 's/^[0-9]+ //' | php -r '$j=json_decode(stream_get_contents(STDIN),true); echo $j["data"]["id"] ?? "";'; }
# 시험 파일: 위치(GPS) 정보가 든 JPEG · PNG · 짧은 mp4 머리
php -r '$i=imagecreatetruecolor(3000,2000); imagefill($i,0,0,imagecolorallocate($i,40,90,200)); imagejpeg($i,"'$T'/a.jpg"); $p=imagecreatetruecolor(400,300); imagepng($p,"'$T'/b.png");'
printf 'Exif\0\0GPSLatitude=37.5' > $T/gps.txt; cat $T/a.jpg > $T/gps.jpg
printf '\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free' > $T/v.mp4; head -c 4000 /dev/urandom >> $T/v.mp4
ICE=$(php -r '$m=json_decode(file_get_contents("database/data/vehicle-models.json"),true);foreach($m as $x)if($x["powertrain"]==="ice"){echo $x["id"];break;}')

t '로그인 없이 업로드 401' '401' "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$H/uploads" -H 'Accept: application/json' -F file=@$T/a.jpg)"
U1=$(up "$A" -F file=@$T/a.jpg); t '사진 업로드 201' '201' "$U1"; t '긴 변 2560으로 줄임' '"width":2560' "$U1"; t '공개 주소' '/storage/community/' "$U1"
I1=$(idof "$U1"); I2=$(idof "$(up "$A" -F file=@$T/b.png)"); I3=$(idof "$(up "$A" -F file=@$T/a.jpg)")
t '올린 사진이 열린다' '200' "$(curl -s -o /dev/null -w '%{http_code}' "$(echo "$U1" | sed -E 's/^[0-9]+ //' | php -r 'echo json_decode(stream_get_contents(STDIN),true)["data"]["url"];')")"
t '글이 아닌 파일 422' '422' "$(up "$A" -F file=@$T/gps.txt)"
UV=$(up "$A" -F file=@$T/v.mp4 -F cover=@$T/b.png -F duration=12.5); t '영상 업로드' '"kind":"video"' "$UV"; t '영상 길이' '"duration":12.5' "$UV"; t '영상 표지' '"cover_url"' "$UV"; V1=$(idof "$UV")
R1=$(idof "$(up "$A" -F file=@$T/b.png -F purpose=receipt)")
t '영수증은 공개 주소 없음' 'null' "$(up "$A" -F file=@$T/b.png -F purpose=receipt | grep -o '"url":[^,]*' || echo null)"

# 일상
t '일상 빈 글 422' '"body"' "$(req POST /dynamic/posts "$A" '{}')"
t '일상에 영상 422' '"media"' "$(req POST /dynamic/posts "$A" "{\"media\":[\"$V1\"]}")"
t '남의 사진 422' 'media.0' "$(req POST /dynamic/posts "$B" "{\"media\":[\"$I1\"]}")"
t '없는 성격 표시 422' '"claim"' "$(req POST /dynamic/posts "$A" '{"body":"안녕하세요","claim":"아무거나"}')"
t '투표 선택지 1개 422' 'vote.options' "$(req POST /dynamic/posts "$A" '{"body":"골라 주세요","vote":{"title":"색상","options":["흰색"],"ends_in_days":3}}')"
D=$(req POST /dynamic/posts "$A" "{\"title\":\"첫 세차\",\"body\":\"오늘 세차했어요\",\"media\":[\"$I2\",\"$I1\"],\"topic\":\"출고 인증\",\"claim\":\"표시 필요 없음\",\"city\":\"서울\",\"vote\":{\"title\":\"어떤 색이 나아요?\",\"multi\":false,\"options\":[\"흰색\",\"검정\"],\"ends_in_days\":3},\"owner_price\":{\"model_id\":\"$ICE\",\"month\":\"2026.10\",\"list_price\":4200.5,\"paid_price\":3980}}")
t '일상 등록 201' '201' "$D"; t '사진 순서 유지(첫 장 = png)' '"media":[{"kind":"image","src":"http://127.0.0.1:8788/storage/community' "$D"
t '투표 마감 표시' '마감' "$D"; t '구매가 카드' '"nake":"4200.5"' "$D"; t '종류' '"kind":"dynamic"' "$D"; t '작성자 권한' '"delete":true' "$D"
DID=$(idof "$D")
t '같은 사진 다시 쓰기 422' 'media.0' "$(req POST /dynamic/posts "$A" "{\"media\":[\"$I1\"]}")"
t '투표하기' '"counts":[0,1]' "$(req PUT /dynamic/posts/$DID/vote "$B" '{"choices":[1]}')"
t '한 개만 고르는 투표에 두 개 422' '422' "$(req PUT /dynamic/posts/$DID/vote "$B" '{"choices":[0,1]}')"
t '다시 투표하면 바뀜' '"counts":[1,0]' "$(req PUT /dynamic/posts/$DID/vote "$B" '{"choices":[0]}')"
t '상세 · 내 투표' '"mine":[0]' "$(req GET /dynamic/posts/$DID "$B")"
t '상세 조회 수' '"views":2' "$(req GET /dynamic/posts/$DID)"
t '목록' '"total":1' "$(req GET /dynamic/posts)"
t '일상 공감' '204' "$(req PUT /dynamic/posts/$DID/reactions/like "$B")"
t '일상 비공감 없음 404' '404' "$(req PUT /dynamic/posts/$DID/reactions/dislike "$B")"
t '일상 댓글' '201' "$(req POST /dynamic/posts/$DID/comments "$B" '{"body":"멋져요"}')"

# 질문
t '질문 5자 미만 422' '"body"' "$(req POST /ask/posts "$A" '{"body":"뭐죠"}')"
t '질문 사진+영상 422' '"media"' "$(req POST /ask/posts "$A" "{\"body\":\"이 소리 뭘까요?\",\"media\":[\"$I3\",\"$V1\"]}")"
t '질문 등록' '201' "$(req POST /ask/posts "$A" '{"body":"겨울 타이어 언제 바꾸세요?","circle":"투싼"}')"
# 영상
t '영상 제목 없음 422' '"title"' "$(req POST /video/posts "$A" "{\"media\":[\"$V1\"]}")"
t '영상에 사진 422' '"media"' "$(req POST /video/posts "$A" "{\"title\":\"주행 영상\",\"media\":[\"$I3\"]}")"
VP=$(req POST /video/posts "$A" "{\"title\":\"주행 영상\",\"body\":\"고속도로\",\"media\":[\"$V1\"]}")
t '영상 등록' '201' "$VP"; t '영상 표지 · 길이' '"cover":"http' "$VP"
# 긴 글
t '긴 글 제목 없음 422' '"title"' "$(req POST /long/posts "$A" '{"body":"본문"}')"
t '없는 부품 종류 422' 'parts.0.type' "$(req POST /long/posts "$A" '{"title":"휠 교체기","body":"교체했어요","parts":[{"type":"엔진","brand":"BBS"}]}')"
t '긴 글 등록 · 부품 카드' '"parts":[{"type":"휠","brand":"BBS LM"' "$(req POST /long/posts "$A" "{\"title\":\"휠 교체기\",\"body\":\"19인치로 바꿨어요\",\"media\":[\"$I3\"],\"parts\":[{\"type\":\"휠\",\"brand\":\"BBS LM\",\"metric\":\"19 / 8.5J / ET35\",\"price\":\"420만원\"}]}")"
# 내 차 팔기
SI=$(idof "$(up "$A" -F file=@$T/a.jpg)")
t '내 차 팔기 사진 없음 422' '"media"' "$(req POST /sell/posts "$A" "{\"model_id\":\"$ICE\",\"sell\":{\"reg_month\":\"2021.03\",\"odometer_km\":45000,\"color\":\"흰색\",\"owner_changes\":1,\"price_manwon\":2350}}")"
t '내 차 팔기 차종 없음 422' '"model_id"' "$(req POST /sell/posts "$A" "{\"media\":[\"$SI\"],\"sell\":{\"reg_month\":\"2021.03\",\"odometer_km\":45000,\"color\":\"흰색\",\"owner_changes\":1,\"price_manwon\":2350}}")"
t '없는 색 422' 'sell.color' "$(req POST /sell/posts "$A" "{\"model_id\":\"$ICE\",\"media\":[\"$SI\"],\"sell\":{\"reg_month\":\"2021.03\",\"odometer_km\":45000,\"color\":\"분홍\",\"owner_changes\":1,\"price_manwon\":2350}}")"
t '미래 등록 연월 422' 'sell.reg_month' "$(req POST /sell/posts "$A" "{\"model_id\":\"$ICE\",\"media\":[\"$SI\"],\"sell\":{\"reg_month\":\"2099.01\",\"odometer_km\":45000,\"color\":\"흰색\",\"owner_changes\":1,\"price_manwon\":2350}}")"
S=$(req POST /sell/posts "$A" "{\"model_id\":\"$ICE\",\"media\":[\"$SI\"],\"city\":\"경기\",\"body\":\"직접 타던 차예요\",\"sell\":{\"reg_month\":\"2021.03\",\"odometer_km\":45000,\"color\":\"흰색\",\"owner_changes\":1,\"price_manwon\":2350}}")
t '내 차 팔기 등록' '201' "$S"; t '자동 제목' '팝니다' "$S"; t '화면 한 줄(주행거리)' '"주행거리":"4.5만km"' "$S"; t '희망 판매가' '"희망 판매가":"2,350만원"' "$S"; t '차종 카드' '"car":{"id"' "$S"
# 구매가
t '구매가 50% 미만 422' 'price.paid_price' "$(req POST /price/posts "$A" "{\"model_id\":\"$ICE\",\"price\":{\"list_price\":4000,\"paid_price\":1500,\"purchase_month\":\"2026.09\",\"city\":\"서울\"}}")"
t '소수 셋째 자리 422' 'price.list_price' "$(req POST /price/posts "$A" "{\"model_id\":\"$ICE\",\"price\":{\"list_price\":4000.123,\"paid_price\":3900,\"purchase_month\":\"2026.09\",\"city\":\"서울\"}}")"
t '남의 영수증 422' 'receipt_upload_id' "$(req POST /price/posts "$B" "{\"model_id\":\"$ICE\",\"price\":{\"list_price\":4000,\"paid_price\":3900,\"purchase_month\":\"2026.09\",\"city\":\"서울\",\"receipt_upload_id\":\"$R1\"}}")"
P=$(req POST /price/posts "$A" "{\"model_id\":\"$ICE\",\"body\":\"탁송비 포함\",\"price\":{\"list_price\":4000,\"paid_price\":3870.55,\"purchase_month\":\"2026.09\",\"city\":\"서울\",\"pay\":\"loan\",\"dealer\":\"강남 대리점\",\"receipt_upload_id\":\"$R1\"}}")
t '구매가 등록' '201' "$P"; t '실구매가 표시' '"total":"3870.55"' "$P"; t '결제 방식' '"결제 방식":"할부"' "$P"; t '영수증 비공개 표시' '심사용' "$P"; nt '영수증 주소 안 내려감' "$R1" "$P"
# 임시저장(차종 없이)
t '일상 임시저장(차종 없음)' '"board":"dynamic"' "$(req PUT /dynamic/draft "$A" '{"payload":{"title":"쓰는 중","media":[]}}')"
t '리뷰 임시저장은 차종 필수 422' '"model_id"' "$(req PUT /review/draft "$A" '{"payload":{"body":"x"}}')"
t '임시저장함 전부' '"board":"dynamic"' "$(req GET /drafts "$A")"
t '일상 등록 뒤 임시저장 지움' '{"data":[]}' "$(req POST /dynamic/posts "$A" '{"body":"짧은 일상"}' >/dev/null; req GET /drafts "$A")"
# 내 글만 · 삭제
t '내 글만' '"total":0' "$(req GET '/dynamic/posts?mine=1' "$B")"
t '남의 글 삭제 403' '403' "$(req DELETE /dynamic/posts/$DID "$B")"
t '내 글 삭제' '204' "$(req DELETE /dynamic/posts/$DID "$A")"
t '지운 글 상세 404' '404' "$(req GET /dynamic/posts/$DID)"
t '리뷰 경로로 일상 등록 안 됨' '422' "$(req POST /review/posts "$A" '{"body":"x"}')"
t '없는 게시판 404' '404' "$(req GET /nope/posts)"
# 오래된 업로드 정리
OLD=$(idof "$(up "$A" -F file=@$T/b.png)")
php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); App\Models\Upload::whereKey("'$OLD'")->update(["created_at"=>now()->subDays(2)]);'
t '붙지 않은 오래된 파일 정리' '지운 파일 1개' "$(php artisan community:prune-uploads)"
echo "통과 $pass 실패 $fail"; rm -rf database/pub-smoke.sqlite $T storage/app/public/community storage/app/private/community; [ $fail -eq 0 ]
