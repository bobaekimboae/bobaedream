# 로마 스파이더 레이브 v5 작업 보고

① 한 줄 요약: 손 닿는 부위를 SAM 2.1로 따서 나세르처럼 색을 바꾸고(손끝 노랑 원 제거), 인트로 차 윤곽을 로마만 정확히 따고, 파이프라인 기술스택 문서를 추가했다.

② 브랜치 `work/roma-rave-v5` · 커밋 b0180cae · PR #1231 (https://github.com/bobaekimboae/bobaedream/pull/1231) · 상태: 푸시 완료, main 병합·배포 대기(사용자 승인 필요)

③ 한 일
- 손 닿는 9개 부위(그릴·휠·탑·배기구·레터링·디플렉터·패들·조수석 디스플레이·엔진)를 SAM 2.1로 1.4초 추적
- 질감은 두고 색만 흰색/부위색으로 바꾸고 얇은 흰 테두리·빛 쓸기(OpenCV LAB + skia), 손가락은 늘 효과 앞
- 손끝 노랑 링(tap_fx) 제거, 콜아웃 점은 작은 흰 점으로
- 타공 그릴은 손끝에서 퍼지는 구멍 파동
- 인트로: 옆·뒤 차까지 잡히던 rembg 윤곽 → SAM 2.1(이 차만) × IS-Net(가장자리), 실루엣 흰 빛
- 기술스택 문서 `docs/shortform/roma-rave-pipeline-stack-v1.md`, 샘플 페이지 `public/shortform-samples/roma-spider-rave-v6/`

④ 비교: `reports/work-roma-rave-v5/v5_touch_recolor.png`(휠·탑·엔진·배기구·디스플레이), `v4_parts_intro.png`(인트로·나머지 부위), `intro_matte.png`(차 윤곽)

⑤ 검증
- `npm run verify` 통과
- `check_be.py` 통과
- `edit_gate.py post --plates`: ✗ 렌더러 비표준(나세르 효과용 별도 렌더러, 의도) · ✗ 번호판 겹침 2건(255L은 트렁크 안 제원 스티커, 77.5kg·m는 번호판이 숫자 아래 그대로 보임 → 오탐)
- 음성↔자막 950ms 경고는 인트로 0.95초 밀림 → 검사용 `voice_intro.wav`를 plan에 기록해 해결
- 사실 대조: 620마력·77.5kg·m·3.4초·탑 13.5초(시속 60km)·255L·등받이 일체형 윈드 디플렉터·3단 스포일러·20인치 일치, 「다섯 겹」은 미확인

⑥ 원본과 다르게 남긴 것: 표준 렌더러(g350_v8_render.py)가 아닌 별도 렌더러 사용

⑦ 다음에 할 것: GPU 서버에서 BiRefNet으로 인트로 가장자리 교체, 부위 점 자동 찾기(OWLv2), 표준 렌더러로 합치기, JATO로 「다섯 겹」 확인

⑧ 확인 링크(병합·배포 후): https://bobaekimboae.github.io/bobaedream/shortform-samples/roma-spider-rave-v5/


## v6 추가 (2026-11-24)
- 부위 칩: 흰 꺾인 선 → 스카우트식 짧은 노랑 화살표(부위가 화면 위쪽이면 칩이 아래로 가고 화살표가 위를 가리킴)
- 인트로: 3/4 측면 → 정면 샷(원본 0~2초), 몽타주 첫 컷도 정면
- check_be 통과
- 확인 링크(병합·배포 후): https://bobaekimboae.github.io/bobaedream/shortform-samples/roma-spider-rave-v6/
