# Chotot Icon Replacement Report

Date: 2026-10-11

Source DB: Notion "베트남 초톳 아이콘 전체" / site = 초톳

## Replaced

| 58 screen position | Chotot DB name | Local file |
|---|---|---|
| Uploaded thumbnail delete | 이미지 업로드_이미지 삭제 | `assets/chotot-icons/chotot-listing-register-image-upload-delete.svg` |
| Camera, preview, popup close | 창 닫기 | `assets/chotot-icons/chotot-listing-register-close-window.svg` |
| Photo/video upload box | 이미지 업로드 색상 변경용 | `assets/chotot-icons/chotot-listing-register-image-upload-color-change.svg` |
| Album entry | 이미지 | `assets/chotot-icons/chotot-common-image.svg` |
| Album entry secondary | 이미지 첨부_그레이 | `assets/chotot-icons/chotot-common-image-attach-gray.svg` |
| Angle complete / selected state | 체크 마크 | `assets/chotot-icons/chotot-listing-register-check-mark.svg` |
| Shooting rules / help | 인포 | `assets/chotot-icons/chotot-listing-register-info.svg` |
| Tip card expand/collapse | 드롭 다운 | `assets/chotot-icons/chotot-listing-register-dropdown.svg` |
| Caret direction fallback | 아래 화살표/캐럿 아이콘 | `assets/chotot-icons/chotot-listing-register-caret-down.svg` |
| Input clear | 텍스트 지우기 아이콘 / 필드 삭제 아이콘 | `assets/chotot-icons/chotot-listing-register-clear-text-delete-field-icon.svg` |
| Rule/detail explanation | 상세 정보 | `assets/chotot-icons/chotot-listing-register-detail-info.svg` |

## Temporary Placeholders

These remain as placeholder glyphs in the V2 mockup because the matched DB asset was not available locally or the DB item was not present in the requested set.

| UI position | Placeholder reason |
|---|---|
| Camera shutter | 신규 요청: 카메라 셔터 / 사진 촬영 |
| Video recording start/stop/pause/resume | 신규 요청: 영상 녹화 |
| Video flash | 신규 요청: 플래시 |
| Plate masking | 신규 요청: 번호판 가리기 |
| Mosaic brush | 신규 요청: 모자이크 브러시 |
| Rotate | 신규 요청: 회전 |
| Crop | 신규 요청: 크롭 |
| Undo / redo | 신규 요청: 실행 취소 / 다시 실행 |
| Draft box | 신규 요청: 임시저장 |
| Vehicle silhouette guide | 신규 요청: 각도 가이드 차량 실루엣 |
| Countdown | 신규 요청: 3-2-1 카운트다운 |
| Video play thumbnail | DB row exists, but local SVG was not available during this pass |
| Shorts muted | DB row exists, but local SVG was not available during this pass |
| Arrow right | DB row exists, but local SVG was not available during this pass; caret-down is rotated as a DB-based temporary replacement |

## Notes

- `listing-register-ai` was not used.
- PNG upload icons were not used for the upload box; the SVG `image-upload-color-change` is used instead.
- SVG color is normalized in CSS to the #222 family without editing path geometry or stroke thickness.
