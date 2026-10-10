# 도이치오토월드 Drive 사진 연결(내부 테스트용)

① 시트에 Drive 링크가 채워진 매물의 사진 5장을 Drive 공개 링크로 불러오는 장치를 넣었다. 지금은 26대가 새로 5장이 된다(기존 43대와 합쳐 69대).

② 과제 ID 미지정 · 브랜치 `feat/qf-deutsch-drive-1010` · 상태 병합·배포(v 값은 채팅 보고)

③ 한 일
- `scripts/deutsch-drive-links.py`: 시트에서 5장이 모두 Drive에 올라간 매물을 골라 `deutsch-autoworld-drive-v01.json`으로 저장.
- 앱: 이 매물은 첫 장은 흐림 처리한 대표 사진, 2~5장은 Drive 링크(`lh3.googleusercontent.com/d/ID=w720`)로 표시. 피드에서 5장을 넘겨 본다.
- Drive가 가끔 막히는 것을 대비해 실패한 사진은 2번까지 다시 부른다.

⑤ 검증: `npm run verify:qf` 통과 · Drive 사진 4장 로드 3/3회 확인(처음 한 번은 1장이 막혀 재시도 장치를 넣음)

⑥ 다르게 남긴 것: Drive 원본은 번호판·전화번호 흐림 처리 전이라 내부 테스트 전용. 업로드가 계속되면 스크립트를 다시 돌려 늘린다.

⑧ 확인 링크: `?qf=guazi&view=feed&category=도이치오토월드`(배포본은 `&v=<커밋>`)
