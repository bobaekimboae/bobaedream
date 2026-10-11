# 58 Video Flow Implementation Report

Date: 2026-10-11

## Implemented Scenario Matrix

| Flow | 58 behavior | V2 implementation |
|---|---|---|
| Entry layout | `车辆视频`, left X, right flash, pill `拍摄车辆外观`, corner frame, copy `请确保拍摄选项正确` | Implemented in `videoView()` |
| Step chips | 4 chips: `车辆外观`, `车内饰`, `发动机舱`, `后备箱`; current chip shows `示例` moving preview | Implemented with animated active chip background |
| Bottom controls | Red circular record button, tabs `拍摄` / `相册` | Implemented |
| Album tab | `我的相册`, orange banner `请选择一段车辆视频`, video-only list, duration, circular check, bottom `0/1` | Implemented with sample video album items |
| Recording | Button label `暂停`, top-right timer, current chip progress bar and red dot | Implemented |
| Pause | Button label `继续`, orange `下一步`, chip duration text | Implemented |
| Auto pause at 22s | Auto-pauses current stage; user must press continue | Implemented with 22-second timer threshold |
| Manual next | Short stages can pass | Implemented |
| Skip last stage | Preview can proceed after stage 3 without trunk | Implemented: after segment index 2, `下一步` opens preview |
| Close during recording | Popup `是否放弃实车拍摄` with `取消` / `放弃` | Implemented |
| Abandon | Return to main without video card | Implemented with `resetVideoDraft()` |
| Merged preview | `视频预览`, play button, recorded chips, `00:00/total`, `下一步` | Implemented |
| Cover selection | `选择视频封面`, frame strip, first frame checked, instruction, `完成` | Implemented |
| Main video card | 58 placeholder + trash, photo count card, upload two-card pair hidden once video exists | Implemented |

## Remaining Unknowns

| Item | Status |
|---|---|
| Camera permission denied native screen | Still requires real device permission path |
| Actual recording/shutter audio from 58 | Not verified in this implementation pass |
| Real video album select-to-complete behavior | Simulated from provided matrix |
| Final uploaded thumbnail appearance | Implemented as placeholder until confirmed capture exists |
