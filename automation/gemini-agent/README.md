# Codex·Claude 공용 Gemini 실행

이 브랜치의 GitHub Actions가 저장소 비밀값 GEMINI_API_KEY를 읽어 Google Gemini를 호출합니다. 두 에이전트는 저장소에 대한 자기 GitHub 권한으로 요청하고 결과를 읽습니다. 키 원문을 받거나 복사할 필요가 없습니다.

1. GitHub에서 `automation/gemini-agent` 브랜치의 `automation/gemini-agent/request.json`을 엽니다.
2. 공개해도 되는 데이터인지 확인하고, 새 `request_id`와 모드를 지정합니다. 수정에는 저장소 쓰기 권한이 필요합니다. GitHub MCP를 쓰면 현재 파일 SHA를 먼저 조회한 뒤 이 브랜치에만 저장합니다.
3. 커밋이 실행을 시작합니다. 이 저장소의 Actions에서 커밋과 같은 실행의 `gemini-result` 아티팩트를 내려받습니다. 승인된 GitHub CLI로도 가능합니다.
4. 결과는 검수할 초안입니다. 게시나 차량 사실 변경을 실행하지 않습니다.

| mode | 추가 필드 | 기능 |
| --- | --- | --- |
| ping | 없음 | 작은 연결 시험 1회 |
| video | youtube_id | 승인된 공개 YouTube 영상 한 편의 편집 관찰 |
| draft | facts | 공개 가능한 확정 사실(1~3000자)로 한국어 대본 초안 |

공개 저장소이므로 입력이 커밋 기록에 남고 결과 파일도 공개 범위에 들어갑니다. 비공개 매물, 고객정보, 번호판, 내부 문서, 비밀값은 보내지 않습니다. 실행 한 건은 Gemini 요청 한 건이며 사용량이 발생할 수 있습니다. 불명확한 실패는 Google 사용량을 먼저 확인한 뒤 재실행합니다. 영상 내레이션은 별도 ElevenLabs 파이프라인을 사용합니다.

```powershell
gh run list --repo bobaekimboae/bobaedream --branch automation/gemini-agent --workflow gemini-agent.yml
gh run download <RUN_ID> --repo bobaekimboae/bobaedream --name gemini-result
```
