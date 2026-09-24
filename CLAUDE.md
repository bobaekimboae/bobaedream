@AGENTS.md
@docs/quick-filter-spec.md
@docs/보배드림_차량이미지_로고_에셋지침_v1.md
퀵필터 작업 보고는 reports/work-log.csv, 채팅 답변은 "브랜치 / 커밋 해시 / 상태"만.

배포 보고 형식(배포할 때마다):
- v 값 = 배포된 main 커밋 해시 7자리
- 모바일: https://bobaekimboae.github.io/bobaedream/?qf=guazi&category=%EC%A4%91%EA%B3%A0%EC%B0%A8&v=<v값>
- PC: https://bobaekimboae.github.io/bobaedream/?qf=guazi&category=%EC%A4%91%EA%B3%A0%EC%B0%A8&v=<v값>&pc=1
- 번들 파일명(dist/client/assets/index-*.js, 배포본 HTML에서 확인)
- 초톳·동처띠 모드를 바꾼 작업이면 해당 모드 링크도(qf=chotot / qf=dongchedi)

## 작업 보고
- 작업 중에 쓰는 모든 설명·진행 메시지·최종 보고는 한국어로 쓴다. 코드·파일명·명령어·브랜치명은 원래 표기 그대로 둔다.
- 쉬운 말로 쓴다. 기술 용어는 처음 나올 때 짧게 풀어쓴다(예: "computed style(화면에 실제 적용된 스타일 값)").
- 단계가 바뀔 때마다 맨 앞에 한 줄 진행 표시: `[현재 단계/전체 단계 · 약 N%] 지금 하는 일`. 보고가 아니므로 멈추지 않는다.
- 자동 대조를 반복할 때는 한 바퀴마다 영역별 차이 비율을 한 줄로(예: `[9/10 · 반복 2회차] PC 상단 패널 43% → 12%`). 사람 확인을 기다리지 않고, 최종 보고는 끝에 한 번.
