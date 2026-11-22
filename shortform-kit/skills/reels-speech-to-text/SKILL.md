---
name: "reels-speech-to-text"
description: "인스타그램 릴스·중고차 숏폼 영상의 음성을 한국어 텍스트(자막·대본)로 뽑을 때 사용. 1개부터 500개 이상 대량까지, 이어 하기·병렬 처리·전화번호 가리기 포함."
---

# 릴스 음성 → 텍스트 추출 (1개 ~ 500개 대량)

중고차 딜러 릴스의 말(내레이션)을 글자로 뽑아 대본 분석·자막 학습·숏폼 엔진 규격 측정에 쓴다.
결과는 영상마다 `txt`(대본) · `srt`(자막) · `json`(낱말 시각)과 전체 요약 `summary.csv` 하나다.

## 0. 먼저 지킬 것
- 사용자는 명령어를 치지 않는다. 설치·실행은 모두 에이전트(Claude Code·코덱스)가 한다. 사용자에게는 결과와 쉬운 설명만 준다.
- **인스타그램을 우회해서 긁지 않는다.** 로봇을 막는 사이트를 쿠키·로그인 정보로 뚫지 않고, 사용자 비밀번호·쿠키를 받지 않는다. 영상은 아래 1번의 허락된 길로만 구한다.
- **전화번호·차량번호는 결과 파일에 남기지 않는다.** 3-4의 가리기를 반드시 거친다(보배드림 규칙).
- 파일 이름은 영문(ASCII)만 쓴다. 한글 파일 이름은 `reel_0001.mp4`처럼 바꾸고 원래 이름은 `summary.csv`에 적는다.
- 결과물은 사람이 쓴 글의 사본이다. 내부 분석용으로만 쓰고 그대로 다시 올리지 않는다.

## 1. 영상 구하는 길 (허락된 것만)
1. **이미 받아 둔 mp4 폴더**: 예) 시안 저장소 `public/assets/dealer-instagram/<딜러>/*.mp4`, 사용자가 준 폴더. 가장 먼저 쓴다.
2. **계정 주인이 허락한 경우 — 인스타그램 그래프 API**: 비즈니스·크리에이터 계정 주인(딜러 본인 또는 보배드림 공식 계정)이 발급한 토큰으로 자기 계정 영상만 받는다.
   - 토큰은 채팅으로 받지 않는다. 사용자가 직접 환경 변수 `IG_TOKEN`·`IG_USER_ID`에 넣게 안내한다.
   - `GET https://graph.facebook.com/v21.0/{IG_USER_ID}/media?fields=id,media_type,media_url,permalink,timestamp,caption&limit=50` 를 `paging.next`가 없을 때까지 돌고, `media_type == VIDEO`인 `media_url`만 받는다.
3. **사용자가 직접 내려받아 준 파일**(인스타 「내 정보 다운로드」 묶음 포함).
- 다른 사람 계정을 주소 목록만으로 긁어 달라는 요청이면 멈추고, 위 세 길 중 무엇이 가능한지 사용자에게 묻는다.

## 2. 준비 (처음 한 번)
- 필요한 것: Python 3.10 이상, `ffmpeg`, `faster-whisper`.
  - 윈도우: `winget install Gyan.FFmpeg` / `pip install faster-whisper`
  - 리눅스: `apt-get install -y ffmpeg` / `pip install faster-whisper` (필요하면 `--break-system-packages`)
- 모델 고르기:

| 모델 | 정확도 | CPU 속도(대략) | 쓰는 때 |
|---|---|---|---|
| `large-v3-turbo` (기본) | 높음 | 영상 길이의 0.3~0.6배 | 대부분 |
| `large-v3` | 가장 높음 | 영상 길이의 1~2배 | 소수 정밀 검수 |
| `small` | 낮음 | 매우 빠름 | 시험 돌리기 |

- GPU가 있으면 `--device cuda --compute float16`, 없으면 `--device cpu --compute int8`.
- 500개 × 약 57초 ≈ 8시간 분량이다. CPU(turbo, int8)로 노트북 한 대에서 약 3~5시간이다. 시작 전에 이 예상 시간을 사용자에게 알린다.

## 3. 실행

### 3-1. 스크립트
작업 폴더 밖(예: `tools/reels_stt.py`)에 아래를 저장한다.

```python
#!/usr/bin/env python3
"""릴스 음성 → 텍스트. 사용: python reels_stt.py <입력폴더> <출력폴더> [--model large-v3-turbo] [--workers 2]"""
import argparse, csv, json, re, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

VIDEO = {".mp4", ".mov", ".webm", ".m4v", ".mkv"}
PHONE = re.compile(r"(0\d{1,2}|050\d)[\s.\-]?\d{3,4}[\s.\-]?\d{4}")
PLATE = re.compile(r"\b\d{2,3}\s?[가-힣]\s?\d{4}\b")

def mask(t: str) -> str:
    return PLATE.sub("[차량번호]", PHONE.sub("[전화번호]", t))

def srt_time(s: float) -> str:
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"

def has_audio(p: Path) -> bool:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return bool(r.stdout.strip())

_model = None
def work(args):
    src, out_dir, model_name, device, compute = args
    global _model
    stem = Path(src).stem
    done = Path(out_dir) / f"{stem}.json"
    if done.exists():
        return {"file": stem, "status": "skip"}
    if not has_audio(Path(src)):
        return {"file": stem, "status": "no_audio"}
    wav = Path(out_dir) / f"{stem}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", str(wav)], check=True)
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(model_name, device=device, compute_type=compute)
    t0 = time.time()
    segs, info = _model.transcribe(str(wav), language="ko", vad_filter=True, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    rows, words = [], []
    for s in segs:
        rows.append({"start": s.start, "end": s.end, "text": mask(s.text.strip())})
        for w in (s.words or []):
            words.append({"start": w.start, "end": w.end, "word": mask(w.word.strip()), "p": round(w.probability, 3)})
    wav.unlink(missing_ok=True)
    text = " ".join(r["text"] for r in rows).strip()
    base = Path(out_dir) / stem
    base.with_suffix(".txt").write_text(text + "\n", encoding="utf-8")
    with open(base.with_suffix(".srt"), "w", encoding="utf-8") as f:
        for i, r in enumerate(rows, 1):
            f.write(f"{i}\n{srt_time(r['start'])} --> {srt_time(r['end'])}\n{r['text']}\n\n")
    low = sum(1 for w in words if w["p"] < 0.5)
    meta = {"file": stem, "status": "ok", "duration": round(info.duration, 2), "speech_sec": round(sum(r['end'] - r['start'] for r in rows), 2),
            "chars": len(text), "words": len(words), "low_conf_words": low, "seconds_taken": round(time.time() - t0, 1)}
    done.write_text(json.dumps({**meta, "segments": rows, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    return meta

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--model", default="large-v3-turbo"); ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--device", default="cpu"); ap.add_argument("--compute", default="int8")
    a = ap.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in Path(a.src).rglob("*") if p.suffix.lower() in VIDEO)
    print(f"영상 {len(files)}개", flush=True)
    jobs = [(str(p), str(out), a.model, a.device, a.compute) for p in files]
    results = []
    with ProcessPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(work, j): j[0] for j in jobs}
        for n, f in enumerate(as_completed(futs), 1):
            try:
                r = f.result()
            except Exception as e:
                r = {"file": Path(futs[f]).stem, "status": f"error: {e}"}
            results.append(r)
            print(f"[{n}/{len(jobs)}] {r['file']} {r['status']}", flush=True)
    keys = ["file", "status", "duration", "speech_sec", "chars", "words", "low_conf_words", "seconds_taken"]
    with open(out / "summary.csv", "a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore")
        if f.tell() == 0: w.writeheader()
        w.writerows(r for r in results if r["status"] != "skip")

if __name__ == "__main__":
    sys.exit(main())
```

### 3-2. 한두 개로 먼저 시험
- 영상 3개만 다른 폴더에 복사해 `--model small`로 돌린다.
- `txt`를 열어 한국어로 제대로 나왔는지 사용자에게 보여 준다.

### 3-3. 대량(500개) 돌리기
- `python reels_stt.py <입력폴더> <출력폴더> --workers 2`
  - `--workers`는 CPU 코어 수의 절반 이하로 둔다(노트북 기본 2, 데스크톱 4).
- 오래 걸리므로 백그라운드로 돌리고, 50개마다 진행을 한 줄로 알린다(`[150/500 · 약 30%] 남은 시간 약 2시간`).
- **이어 하기**: 끊기면 같은 명령을 다시 돌린다. 이미 `json`이 있는 영상은 건너뛴다.
- 노트북이 잠들면 멈추므로 시작 전에 전원 연결과 「절전 안 함」을 사용자에게 안내한다.

### 3-4. 가리기 확인 (빠뜨리지 않기)
- 끝나면 출력 폴더 전체에서 전화번호·차량번호 꼴이 남았는지 다시 찾는다. 예: `010`, `0507`, `12가3456`.
- 남았으면 그 파일을 고친 뒤 보고한다. 말로 읽은 번호("공일공 일이삼사…")는 정규식이 못 잡으므로 `txt`에서 「공일공」「공오공」을 따로 찾는다.

## 4. 결과 보고
- 표로 보고한다: 전체 개수 · 성공 · 소리 없음 · 오류 · 총 분량 · 걸린 시간.
- 읽기 어려운 영상(`low_conf_words`가 낱말의 20% 이상)은 「확인 필요」 목록으로 따로 준다.
  - 음악이 크거나, 목소리가 AI 음성이거나, 외국어가 섞인 경우가 많다.
- 분석을 요청받으면 `json`의 낱말 시각으로 다음을 잰다.
  - 초당 글자 수(말 속도)
  - 첫 문장(훅)
  - 자주 쓰는 표현 상위 50개(예: 리스·승계·인수금·감가)
  - 마지막 문의 문장
- 결과 파일을 사용자에게 줄 때는 출력 폴더를 `reels_stt_YYYYMMDD.zip`으로 묶는다. 구글 시트로 정리하라면 `summary.csv`와 `txt` 첫 문장을 한 표로 만들어 xlsx로 준다.

## 5. 자주 나는 문제
| 증상 | 원인 | 고치기 |
|---|---|---|
| `ffmpeg`를 못 찾음 | 설치 뒤 새 창을 안 열었음 | 새 터미널에서 다시 실행 |
| 같은 말이 계속 반복됨 | 음악 구간을 말로 착각 | `vad_filter=True` 확인, 그래도 나면 `large-v3`로 그 영상만 다시 |
| 영어 차명이 한글로 엉터리 | 사전 낱말 부족 | `initial_prompt="벤츠 BMW 포르쉐 페라리 람보르기니 롤스로이스 벤틀리 리스 승계 인수금"` 추가 |
| 메모리 부족으로 멈춤 | `--workers`가 많음 | 1로 줄이기 |
| 소리 없음이 많음 | 원본에 소리 트랙이 없음(인스타 음악 저작권 제거 포함) | 정상, 「소리 없음」으로 보고 |