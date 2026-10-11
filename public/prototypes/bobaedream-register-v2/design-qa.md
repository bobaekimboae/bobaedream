# 58.com Media Registration Design QA

## Scope

- Source register: `C:\Users\bobae\AppData\Local\Temp\58-media-registration-audit\outputs\58-capture-register\screen-register.md`
- Source order video: `C:\Users\bobae\AppData\Local\Temp\58-media-registration-audit\outputs\58-capture-register\58_source_core_flow.mp4`
- Prototype checks: `C:\Users\bobae\AppData\Local\Temp\58-media-registration-audit\outputs\58-capture-register\prototype-checks`

## Verified Screens

| Source No. | Prototype Screenshot | Result |
|---:|---|---|
| 03 | `03_proto_photo_camera_empty_final.png` | passed |
| 07 | `07_proto_photo_after_shot_final.png` | passed |
| 14 | `14_proto_video_exterior_final.png` | passed |
| 15 | `15_proto_video_interior_final.png` | passed |
| 16 | `16_proto_video_engine_final.png` | passed |
| 17 | `17_proto_video_trunk_final.png` | passed |
| 19 | `19_proto_video_exit_modal_final.png` | passed |

## Current Fixes

- 2026-10-11 update: default seed photos were removed so the first screen no longer shows two pre-selected images.
- 2026-10-11 update: the phone frame no longer forces `844px` height; camera and video screens now fit the actual browser/phone viewport without bottom controls being cut off.
- 2026-10-11 update: photo and video capture screens now use responsive grid rows for header, live preview, slot/segment rail, controls, tabs, and Android navigation.
- 2026-10-11 update: photo album mode now follows a select-then-confirm flow with selected count, visible check state, and bottom 완료 action.
- 2026-10-11 update: shutter sound was changed from a two-tone beep to a short camera-click noise burst.
- 2026-10-11 update: missing video template image paths were replaced with available vehicle sample images so the segment example cards no longer load as 404 placeholders.
- Photo shutter now opens a real mobile camera input (`accept=image/*`, `capture=environment`) and stores the captured file as the slot thumbnail.
- Album mode now opens a real image picker and adds selected images to the next empty slots.
- Video record now opens a real mobile video capture input (`accept=video/*`, `capture=environment`) and marks video registration complete after selection.
- Cross-check update: the native file inputs are now placed directly inside the visible shutter, album, and record controls instead of relying only on a hidden input `.click()` call.
- Typography has been tuned to the source: Pretendard remains the font, but title/body weights now use softer 850/820/760/620 levels instead of blanket 900 weights.
- Capture and video screens now use smaller source-like topbar titles, guide pill labels, slot labels, and control labels.
- Photo capture now uses the source-like black device chrome, gray camera preview, floating guide pill, horizontal angle slot rail, shutter/count/finish controls, and Android navigation bar.
- The shutter flow adds a captured thumbnail, advances to the next slot, updates the count, and keeps the slot delete affordance visible.
- Video capture now uses a four-step template: exterior, interior, engine room, trunk. Each step shows a gray camera preview, white guide frame, active example card, inactive gray cards, red record control, capture/album tabs, and Android navigation bar.
- Recording exit now shows the source-like centered confirmation modal over the dimmed video capture surface.
- Pretendard remains the active Korean UI font.

## Remaining Notes

- This is a Bobaedream-localized implementation, so visible copy is Korean rather than the original Chinese source labels.
- Source app icons are approximated with local inline icons; exact source app vector assets are not available.
- Vehicle thumbnails use sample raster images until production upload/camera blobs are wired.

final result: passed
