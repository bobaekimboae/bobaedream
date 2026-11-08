# ElevenLabs 한국어 내레이션

이 경로는 Codex·Claude 공용 GitHub 브랜치에서 승인된 **공개 대본** 한 건을 한국어 음성 WAV로 만듭니다. 실행은 저장소의 `ELEVENLABS_API_KEY`가 필요합니다. 비밀값은 Actions 내부에서만 주입합니다.

1. `automation/gemini-agent` 브랜치에서 이 폴더의 `request.json`을 업데이트합니다.
2. 새 요청 ID, 공개 가능 여부, 승인된 음색 ID와 300자 이하 대본을 입력합니다. 비공개 매물·고객정보·키는 넣지 않습니다.
3. 커밋과 동일한 Actions 실행의 `elevenlabs-narration` 아티팩트에서 WAV를 받습니다.

```json
{
  "public_input": true,
  "request_id": "sample-001",
  "voice_id": "JBFqnCBsd6RMkjVDRZzb",
  "text": "보배드림 한국어 음성 연결 시험입니다."
}
```

위 음색은 공식 API 문서의 시험용 예시이며 상용 음색 승인은 별도입니다. 한 요청은 ElevenLabs 합성 호출 한 건입니다. 응답이 불명확하면 크레딧 사용량 확인 후 재실행합니다. 실제 상용 매물의 승인 대본·타이밍·음원은 기존 비공개 Type3 제작 경로를 사용합니다.
