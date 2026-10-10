# 보배 AI 숏폼 영상 제작기 인수인계

최종 정리: 2026-10-10 (KST, v4) · 소스: `public/shortform/index.html` (단일 파일, 배포 주소 `/shortform/`)

> 이 문서는 새로 만들었다(작업 지시에 「docs/SHORTFORM_AI_HANDOFF.md를 읽어라」가 있었지만 저장소 어느 브랜치에도 없었다). 이전 인수인계 내용이 따로 있으면 여기에 합쳐 달라.

## 1. 경로 구분

| 경로 | 역할 |
|---|---|
| `public/shortform/index.html` | **이 문서의 대상** — 사진+자막+음성+음악 → 9:16 영상 제작기 |
| `scripts/shortform-render-server.mjs` | FFmpeg 서버 렌더러(서비스용 MP4) |
| `scripts/shortform-browser-check.mjs` | 실제 브라우저 종단 점검(`npm run check:shortform`) |
| `public/shortform-upload/`, `public/shortform-uploader/` | **다른 제품**(촬영 업로더). 별도 요청 없이 수정하지 않는다 |

## 2. 최종 출력 목표 (서비스용)

9:16 · 1080×1920 · 30fps · H.264(High, yuv420p) · AAC(48kHz) · MP4(`+faststart`). **이 규격은 FFmpeg 서버 렌더링으로만 만든다.** 브라우저 MediaRecorder WebM(VP8/VP9+Opus)은 임시 폴백이다.

## 3. 기능 상태 (구현 상태를 섞어 쓰지 않는다)

| 기능 | 상태 | 비고 |
|---|---|---|
| 사진 업로드(3~20장, 앞 10장이 장면) · 순서 변경(◀▶·끌어놓기) · 삭제 | **실제 동작(브라우저)** | |
| 9:16 미리보기 CapCut / TikTok / Full Fit, Canvas 장면 구성, 장면별 자막 편집 | **실제 동작(브라우저)** | 기존 기능 유지 |
| 통합 미리보기(화면+자막+음성+음악) | **임시(브라우저)** | 음성은 `speechSynthesis` — OS 한국어 음성이 있어야 들림 |
| 음악 | **임시(브라우저)** | WebAudio 합성음 2종 또는 내 음악 파일. 저장 WebM에 포함됨 |
| 번호판·얼굴 수동 모자이크(▦: 끌어서 네모), 영상 길이 15/20/30초, CTA 문구 편집 | **실제 동작(브라우저)** | 모자이크는 미리보기·WebM·MP4·서버 렌더링 모두에 반영(자동 인식은 미구현) |
| 브라우저 MP4 생성(WebCodecs + `vendor/mp4-muxer.js`, 프레임 정확 30fps, 음악 오프라인 믹스) | **실제 동작(브라우저)** — 코덱은 브라우저에 따라 다름 | Chrome·Edge·Safari: H.264+AAC(서비스 규격)로 만들도록 구현, **이 저장소 테스트 환경에는 H.264/AAC 인코더가 없어 그 경로는 미검증**. 인코더가 없으면 VP9+Opus MP4(「규격 외」 표시)로 대체, 그것도 없으면 WebM 폴백 |
| 영상 생성 → 결과 재생 → 다운로드(WebM) | **임시(브라우저)** | 규격 아님(VP9/Opus). **음성은 저장 영상에 안 들어감**(브라우저가 TTS 소리를 녹음하게 두지 않음) |
| 서버 렌더링 MP4 | **실제 동작(서버 스크립트, 로컬 검증)** | GitHub Pages에는 서버가 없어 **공개 사이트에서는 미연결** 표시 |
| 서버 MP4의 배경음악 | 부분 | **내 음악 파일만** 들어감. 브라우저 합성음은 서버로 보내지 않음 |
| 서버 MP4의 음성(TTS) | **미구현(엔진 필요)** | `TTS_COMMAND` 환경변수로 외부 엔진을 연결하는 자리만 있음. 엔진 없으면 음성 없이 무음 AAC 트랙 |
| 번호판 블러, SNS 게시, 보배 DB 매물 불러오기, 작업 큐·인증·저장소 | **미구현(백엔드 필요)** | |

- 서드파티: `public/shortform/vendor/mp4-muxer.js`(mp4-muxer 5.2.2, MIT, 라이선스 `mp4-muxer.LICENSE.txt`).

## 4. 서버 렌더링 구조

1. 브라우저가 장면마다 3장을 만든다(1080×1920 기준 2배 배율): `bg_i`(블러 배경+프레임, JPEG), `fg_i`(둥근 모서리 사진, 투명 PNG, 프레임 크기만), `ov_i`(자막·배지, 투명 PNG).
2. `POST /api/shortform/render`(multipart: `spec` JSON + 파일 + 선택 `bgm`) → `202 {jobId}`.
3. 서버가 장면별 FFmpeg로 합성(`fg`는 `scale eval=frame`으로 천천히 줌) → `concat` → 음악·음성 믹스 → AAC → `ffprobe`로 규격 확인.
4. `GET /api/shortform/jobs/:id`(진행률) · `/jobs/:id/video.mp4`(다운로드). 작업은 30분 뒤 삭제.
5. 한글 자막은 서버에 폰트가 없어도 되도록 브라우저가 그려서 보낸다(`drawtext` 미사용).

실행: `npm run shortform:render-server` (환경변수 `PORT`=8787, `TTS_COMMAND`, `SHORTFORM_CORS_ORIGIN`, `SHORTFORM_MAX_BODY_MB`=300). 필요: ffmpeg 6+.
화면에서 「렌더 서버 주소」에 서버 주소를 넣거나 `?render=https://서버` 로 연다.

## 5. 검증

- `npm run check:shortform` — 실제 Chromium으로 사진 등록·순서 변경·번호판 모자이크·미리보기·음악·WebM 생성·브라우저 MP4 생성·재생·다운로드·서버 MP4(15초·20초) 생성·ffprobe 규격 검증(31항목). 결과는 `reports/shortform-e2e/result.json`.
- 헤드리스 환경의 한계: ① OS 음성 엔진이 없어 TTS **소리**는 확인 불가(호출·문장만 확인), ② Playwright Chromium은 H.264를 디코딩하지 못해 MP4의 **브라우저 재생**은 확인 불가(ffmpeg 디코딩으로 대체). 실기기(Chrome·Safari)에서 확인해야 한다.

## 6. 다음에 할 일 (우선순위)

1. 서버 배포(컨테이너/VM) + 인증 + 작업 큐, 업로드 크기 제한 점검.
2. 서버 TTS 엔진 연결(예: Piper·클라우드 TTS) 후 `TTS_COMMAND` 검증, 음성 길이에 맞춘 장면 길이 조정.
3. 실기기(Chrome·Edge·Safari)에서 브라우저 MP4가 H.264/AAC로 만들어지는지 확인 → 확인 전에는 「규격 충족」으로 단정하지 않는다.
4. 서버 BGM 라이브러리(저작권 확보된 곡) 선택 + 합성음 대체.
5. 번호판 자동 인식(현재는 수동 모자이크만)(사진 업로드 단계), 보배 매물 DB 연동.
