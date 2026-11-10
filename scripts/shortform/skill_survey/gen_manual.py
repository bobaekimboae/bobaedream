"""library_v2.json → 노션 매뉴얼 본문(노션 마크다운)
python3 gen_manual.py LIBRARY_JSON OUT_MD
숫자는 모두 라이브러리에서 읽는다(손으로 적지 않음).
"""
import json, sys

MODE_NAME = {'① 내레이션형': '사람 없이 사진·영상 + 목소리', '② 사람 등장형': '딜러·진행자가 직접 나온다', '③ 손가락 아이콘형': '사람 손 대신 손가락 아이콘·노랑 원이 부위를 짚는다'}
SCENE_KO = dict(intro='첫 소개', spec='제원 숫자', option='옵션', sound='소리', price='가격', ending='끝', quiz_hook='퀴즈 첫 화면', hint='힌트',
                reveal='정답 공개', comment='댓글 유도', count_reveal='숫자 세며 공개', price_reveal='가격 공개', budget_hook='예산 질문', listing='매물 소개',
                compare_hook='비교 질문', compare='비교', choice='선택', tip_hook='팁 첫 화면', point='부위 짚기', fact_hook='상식 첫 화면', story='이야기',
                list_hook='리스트 첫 화면', rank='순번', asmr_hook='소리 첫 화면', interview_hook='인터뷰 첫 화면', answer='대답', question_hook='질문',
                sold_hook='판매 완료', cta='행동 유도', service_hook='서비스 첫 화면', explain='설명', news_hook='뉴스 첫 화면', why_hook='이유 첫 화면',
                price_tease='가격 예고', app='앱 화면', point_m3='손가락 짚기(③)')


def esc(s):
    return str(s).replace('|', '/').replace('\n', ' ')


def main(lib_path, out):
    L = json.load(open(lib_path, encoding='utf-8'))
    S = {s['id']: s for s in L['skills']}
    P = L['patterns']
    total = sum(p['n'] for p in P.values())
    nl = sum(p['nl'] for p in P.values())
    be = sum(p['be'] for p in P.values())
    o = []
    w = o.append
    w(f'오토스카우트24(AS24) 네덜란드 {nl}개 · 벨기에 {be}개, 합계 **{total}개 쇼츠**를 끝까지 보고 찾은 편집 기법을 「편집 스킬 N」 번호로 묶고, 자동 편집 프로그램이 그 스킬을 골라 쓰게 만든 기록이다. 스킬 카드는 아래 DB, 프로그램은 저장소 `scripts/shortform/edit_skills/`에 있다.')
    w('')
    w('<callout icon="📌" color="gray_bg">\n\t원본 영상·캡처는 내부 참고용이다. 남의 로고·그래픽·캐릭터는 가져오지 않고 우리 자산(노션 원본 칠, Pretendard, Noto 이모지, 보배드림 로고)만 쓴다. 번호판은 가리지 않는다. 숫자·옵션은 매물 정보에 있는 것만 쓴다.\n</callout>')
    w('')
    w('## 1. 한눈에')
    w('')
    w('<table header-row="true">')
    w('<tr><td>항목</td><td>값</td></tr>')
    w(f'<tr><td>조사한 영상</td><td>{total}개 (네덜란드 {nl} · 벨기에 {be})</td></tr>')
    w(f'<tr><td>편집 스킬</td><td>{len(S)}개 (S001~S{len(S):03d})</td></tr>')
    w(f'<tr><td>영상 패턴</td><td>{len([k for k in P if k != "P00"])}종 (P01~P18, 못 나눈 영상은 P00)</td></tr>')
    w('<tr><td>쓰는 방식</td><td>3가지 (① 내레이션형 · ② 사람 등장형 · ③ 손가락 아이콘형)</td></tr>')
    t = L['timing']
    w(f'<tr><td>요소 사이 간격</td><td>중간값 {t["gap_between_overlays"]}초 (4분의 1 지점 {t["gap_q25"]}초 · 4분의 3 지점 {t["gap_q75"]}초)</td></tr>')
    w(f'<tr><td>효과음</td><td>요소 {L["sfx"]["every_n_overlays"]}개 중 1개꼴, 많아도 {int(L["sfx"]["max_ratio"]*100)}%</td></tr>')
    w('</table>')
    w('')
    w('## 2. 전체 흐름')
    w('')
    w('```mermaid\nflowchart LR\n  A["매물 정보\\n(사진·영상·옵션표)"] --> B["패턴 고르기\\nP01~P18"]\n  B --> C["장면 순서\\n(패턴 흐름)"]\n  C --> D["장면마다 스킬\\n(레시피)"]\n  D --> E["사실 채우기\\n없으면 건너뜀"]\n  E --> F["자동 점검\\n겹침·간격·효과음"]\n  F --> G["영상 만들기\\nmp4"]\n```')
    w('')
    w('## 3. 쓰는 방식 3가지')
    w('')
    w('<table header-row="true">')
    w('<tr><td>방식</td><td>모습</td><td>규칙</td></tr>')
    for k, v in L['mode_rules'].items():
        w(f'<tr><td>{k}</td><td>{MODE_NAME.get(k, "")}</td><td>{esc(v)}</td></tr>')
    w('</table>')
    w('')
    w(f'## 4. 영상 패턴 {len([p for p in L["patterns"] if p != "P00"])}종')
    w('')
    w('패턴은 영상 하나의 큰 줄거리다. 제목·말·화면 요소로 자동 분류했다(첫 번째로 맞는 규칙). 숫자는 그 패턴 영상들의 중간값이다.')
    w('')
    w('<table header-row="true">')
    w('<tr><td>번호</td><td>패턴</td><td>영상 수 (네·벨)</td><td>길이</td><td>컷/초</td><td>요소/10초</td><td>끝 로고</td><td>많이 쓴 스킬</td></tr>')
    sub2id = {'boxlabel': 'S001', 'bigtext': 'S004', 'tape': 'S008', 'logo': 'S030', 'insert': 'S018', 'icon': 'S013', 'capword': 'S038'}
    for k in sorted(P):
        p = P[k]
        top = ', '.join(f'{sub2id.get(s, s)} {v:.1f}' for s, v in list(p['top_subs'].items())[:3])
        w(f'<tr><td>{k}</td><td>{esc(p["name"])}</td><td>{p["n"]} ({p["nl"]}·{p["be"]})</td><td>{p["dur_med"]}초</td><td>{p["cuts_per_s"]}</td>'
          f'<td>{p["overlays_per_10s"]}</td><td>{int((p["end_logo_rate"] or 0) * 100)}%</td><td>{top}</td></tr>')
    w('</table>')
    w('')
    w('### 패턴별 장면 순서와 예시')
    w('')
    for k in sorted(P):
        if k == 'P00':
            continue
        p = P[k]
        flow = L['pattern_flows'].get(k, [])
        w(f'<details>\n<summary>{k} {esc(p["name"])} — {p["n"]}개</summary>')
        w(f'\t장면 순서: {" → ".join(SCENE_KO.get(s, s) for s in flow)}')
        extra = []
        if p.get('person_rate') is not None:
            extra.append(f'사람 나오는 영상 {int(p["person_rate"] * 100)}%')
        if p.get('words_per_s'):
            extra.append(f'말 속도 초당 {p["words_per_s"]}단어')
        if extra:
            w('\t' + ' · '.join(extra))
        f3 = ', '.join(f'{sub2id.get(s, s)} {int(v * 100)}%' for s, v in list(p['first3s'].items())[:3])
        l4 = ', '.join(f'{sub2id.get(s, s)} {int(v * 100)}%' for s, v in list(p['last4s'].items())[:3])
        w(f'\t첫 3초에 나오는 것: {f3 or "-"} / 끝 4초: {l4 or "-"}')
        for u in p.get('examples', [])[:3]:
            w(f'\t- [{u}]({u})')
        w('</details>')
    w('')
    w('## 5. 장면 레시피')
    w('')
    w('장면 이름마다 쓸 스킬 순서다. 앞의 스킬부터 고르고, 사실이 없으면 그 스킬은 건너뛴다. ③ 방식에서는 옵션·부위·힌트 장면에 손가락(S035)과 노랑 원(S020)을 먼저 둔다.')
    w('')
    w('<table header-row="true">')
    w('<tr><td>장면</td><td>스킬</td></tr>')
    for k, ids in L['recipes'].items():
        w(f'<tr><td>{SCENE_KO.get(k, k)} ({k})</td><td>{", ".join(f"{i} {esc(S[i].get("note", ""))}" for i in ids if i in S)}</td></tr>')
    w('</table>')
    w('')
    w(f'## 6. 편집 스킬 {len(L["skills"])}개')
    w('')
    w('카드 하나하나의 크기·위치·시간·원본 예시·대표 캡처는 아래 DB에 있다. 이름은 아직 정하지 않아 「편집 스킬 N — 명칭 미정」으로 둔다.')
    w('')
    w('<table header-row="true">')
    w('<tr><td>번호</td><td>모습</td><td>유형</td><td>쓰는 상황</td><td>등장 영상</td><td>방식</td></tr>')
    for sid, s in S.items():
        modes = ''.join(m[0] for m in s.get('modes', []))
        w(f'<tr><td>{sid}</td><td>{esc(s.get("note", ""))}</td><td>{esc(s.get("type", ""))}</td><td>{esc(s.get("when", ""))}</td><td>{s.get("video_count") or "-"}</td><td>{modes}</td></tr>')
    w('</table>')
    w('')
    w('## 7. 규칙 (원본에서 잰 값)')
    w('')
    c = L['collision']
    k = L['korean']
    w(f'- **겹침**: 같은 자리(위 {c["zones"]["top"]}, 가운데 {c["zones"]["middle"]}, 자막 {c["zones"]["caption"]}, 화면 높이 비율)에 요소는 하나만. 새 요소는 1초에 {c["max_new_overlays_per_sec"]}개까지. 말 자막 둘레 {c["caption_clear_px"]}px는 비운다.')
    w(f'- **쇼츠 안전 영역**: 화면 위 {int(c["shorts_safe"]["top_px_ratio"]*100)}% · 아래 {100 - int(c["shorts_safe"]["bottom_ratio"]*100)}% · 오른쪽 {100 - int(c["shorts_safe"]["right_ratio"]*100)}%에는 두지 않는다(유튜브·인스타 버튼 자리).')
    w(f'- **한국어 길이**: 이름표 {k["label_max_chars"]}자, 큰 낱말 {k["bigword_max_chars"]}자까지. 말 자막은 {k["chunk_words"][0]}~{k["chunk_words"][1]}어절씩.')
    w(f'- **타이밍**: 첫 요소는 장면 시작 {t["first_overlay_delay"]}초 뒤, 요소 사이 기본 {t["gap_between_overlays"]}초. 칩은 2프레임(30fps) 안에 다 커진다(원본 실측).')
    w(f'- **효과음**: {esc(L["sfx"]["_note"])} 첫 요소·가격 숫자·퀴즈 첫 화면·끝 로고에는 붙인다. 소리는 우리 자체 소리(팝·딩·휙·딸깍)만.')
    w('- **자동 점검 항목**: ' + ' / '.join(L['auto_check']))
    w('')
    w('## 8. 프로그램 사용법')
    w('')
    w('저장소 `scripts/shortform/edit_skills/` (README.md에 같은 내용).')
    w('')
    w('<table header-row="true">')
    w('<tr><td>파일</td><td>하는 일</td></tr>')
    for f, d in [('library_v2.json', '스킬·패턴·흐름·레시피·규칙 데이터'), ('draw.py', '스킬 그리기(이름표·띠 칩·큰 숫자·카드·손가락·로고 등)'),
                 ('registry.py', '스킬 번호 → 그리기 함수·자리·움직임·효과음'), ('motion.py', '나타나고 사라지는 움직임'),
                 ('planner.py', '대본 + 방식 + 패턴 → 스킬 타임라인'), ('check.py', '타임라인 자동 점검'), ('render.py', '타임라인 → mp4(사진·영상 바탕 + 효과음)'),
                 ('demo.py', '레인지로버 매물 사진으로 샘플')]:
        w(f'<tr><td>`{f}`</td><td>{d}</td></tr>')
    w('</table>')
    w('')
    w('```bash\ncd scripts/shortform\npython3 -m edit_skills.demo OUT --mode 3 --pattern P02   # 샘플\npython3 -m edit_skills.planner script.json plan.json      # 대본 → 계획\npython3 -m edit_skills.check plan.json                    # 점검\n```')
    w('')
    w('대본 한 장면은 `{"start": 9.9, "dur": 3.6, "scene": "point", "facts": {"text": "5.0 V8 슈퍼차저"}, "anchor": [0.42, 0.52]}` 꼴이다. `facts`에 없는 값은 그리지 않는다. `anchor`는 부위 위치(화면 비율)이고 ③ 방식의 손가락이 여기를 가리킨다.')
    w('')
    w('## 9. 관찰만 하고 쓰지 않는 것')
    w('')
    for x in L['observed_only']:
        w(f'- **{x["name"]}**: {esc(x["why"])}')
    w('')
    w('## 10. 다시 만들기')
    w('')
    w('```bash\npython3 skill_survey/patterns.py SKILLDIR        # 영상 패턴 분류\npython3 skill_survey/build_skills2.py SKILLDIR   # library_v2.json\npython3 skill_survey/gen_manual.py edit_skills/library_v2.json manual.md   # 이 문서 본문\n```')
    open(out, 'w', encoding='utf-8').write('\n'.join(o))
    print(out, len('\n'.join(o)))


if __name__ == '__main__':
    main(*sys.argv[1:3])
