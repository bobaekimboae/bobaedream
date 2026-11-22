---
name: "sheet-shorts-to-drive"
description: "구글 시트에 적힌 유튜브 쇼츠·릴스 URL을 일괄 다운로드해 구글 드라이브 폴더에 저장하고, 각 행에 드라이브 링크를 다시 써넣을 때 사용."
---

# 시트 → 쇼츠 일괄 다운로드 → 구글 드라이브 → 링크 기입

## 언제 쓰나
- 「SNS 레퍼런스」 같은 시트 탭(예: 오토스카우트_네덜란드)의 영상 URL을 한 번에 받아 드라이브에 모으고, 시트에서 바로 열 수 있게 링크를 걸고 싶을 때.

## 전제 (이 사용자 환경에서 검증된 경로)
- 클라우드 작업공간에서는 YouTube가 봇 확인으로 다운로드를 막는다 → **반드시 사용자 PC(연결된 Windows 기기)에서 yt-dlp 실행**.
- PC Python: `C:\Users\Thinkbook\AppData\Local\Programs\Python\Python312\python.exe`, yt-dlp는 `python -m yt_dlp`로 실행(없으면 `-m pip install -U yt-dlp`).
- ffmpeg: `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\...\bin` 에서 찾아 `--ffmpeg-location` 으로 넘긴다.
- 구글 드라이브 데스크톱 동기화 경로: `G:\내 드라이브\`. 여기에 파일을 넣으면 드라이브에 자동 업로드된다.
- 사용자는 명령어 입력에 익숙하지 않다 → 모든 실행은 에이전트가 직접 한다.

## 절차
1. **시트 읽기**: Google Sheets 커넥터로 대상 탭 전체를 읽는다. 헤더에서 URL 열(예: 'URL')과 제목 열을 찾는다. 이미 링크가 있는 행은 건너뛴다(재실행 안전).
2. **링크 열 정하기**: 기존에 '원본 영상 드라이브 링크' 열이 없으면 헤더 끝 다음 빈 열에 만든다. 기존 다른 열(예: '음성 변경된 구글 드라이브 url')은 덮어쓰지 않는다.
3. **드라이브 폴더**: `G:\내 드라이브\SNS레퍼런스_원본영상\<탭이름>\` 를 만든다.
4. **다운로드 (PC)**: desktop-commander로 PowerShell 실행. 파일명은 ASCII(영상 ID)로 저장해 한글 깨짐을 피한다.
   - `python -m yt_dlp --ffmpeg-location <ffmpeg폴더> -f "bv*[height<=1920][ext=mp4]+ba[ext=m4a]/b" --merge-output-format mp4 -o "%(id)s.%(ext)s" --no-progress --download-archive archive.txt <URL들>`
   - 다운로드 받은 파일을 위 드라이브 폴더로 복사. 한 번에 15~20개씩 나눠 실행하고 실패 URL은 기록.
5. **드라이브 ID 확보**: 동기화 후(수십 초~수 분) Google Drive 커넥터 `search_files`로 `title contains '<영상ID>'` 검색 → 파일 ID로 `https://drive.google.com/file/d/<ID>/view` 링크 생성. 아직 안 보이면 잠시 후 재검색(최대 3회).
6. **시트 기입**: Sheets `update_values`로 각 행의 링크 열에 써넣는다. 실패 행은 '다운로드 실패: 사유'로 표시.
7. **보고**: 성공/실패 개수, 드라이브 폴더 링크, 실패 URL 목록을 짧게 알린다.

## 주의
- 저작권: 받은 영상은 내부 분석·레퍼런스용으로만 쓰고 재게시하지 않는다.
- AV1 코덱으로 받아지는 경우가 많다. 분석용으로 OpenCV가 필요하면 별도로 H.264 변환본을 만든다(드라이브 원본은 그대로 둔다).
- 인스타 릴스 URL은 yt-dlp가 로그인 쿠키를 요구할 수 있다 → 실패 시 Instaloader 또는 사용자에게 알림.