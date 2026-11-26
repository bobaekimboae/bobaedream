# card_info — 숏폼 카드 정보 기법 (card-info-v2)

매물 정보(성능점검·보험이력·옵션 등)를 독립 카드 컷으로 요약하는 렌더러. 매뉴얼: `docs/shortform/card-info-manual-v1.md`.

```bash
python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --out out/g400d            # 카드별 mp4
python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --montage --no-cards     # 한 편
```

- 규격: `card_spec.json` (값은 여기만 고친다) · 잠금 규칙 `../be_locked_rules.json` · 카드 효과음 `../photo_listing/option_visual_rules.json → layout.card_sfx`
- 새 매물: `samples/<id>/cards.json`과 사진만 만들면 된다. 형식은 `samples/g400d/cards.json` 참고(유형 12종)
- 필요: Playwright chromium · ffmpeg · rsvg-convert
- 아이콘: Tabler Icons(MIT) `icons/`, 샘플 사진: 차란차 공개 매물(내부 시안·검증용, 차대번호 라벨 사진 제외)

## 2차(v2): 순서 고정 · 타임라인 · 차량 편집에 끼우기

```bash
python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --max 1 --name edit_1card
python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --length 45s --name edit_4cards
```

카드 순서 `card_spec.card_order` · 고르기 `card_spec.selection` · 편집 `card_spec.edit`. 매뉴얼 10장.
