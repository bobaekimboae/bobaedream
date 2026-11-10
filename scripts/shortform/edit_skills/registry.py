"""스킬 번호 → 그리기 함수·자리·움직임·효과음 (편집 스킬 라이브러리의 실행 부분)

SPEC[skill_id] = dict(
  build=lambda p, t: Image   # p = 파라미터, t = 스킬 안 진행률 0~1(숫자 세기·타자처럼 움직이는 것만 씀)
  zone='top|middle|caption|bottom|center|full|anchor'  # 기본 자리(겹침 규칙 단위)
  cy=0.31                    # 세로 중심(화면 비율, 원본 실측 중간값 — library_v2.json 값이 있으면 그걸로 덮음)
  motion='pop|slide|fade|bob|count|type|wipe|none'
  dur=1.2                    # 기본 머무는 시간(초)
  sfx='pop|whoosh|ding|none'
  needs=[...]                # 필요한 파라미터
)
"""
from . import draw as D

SPEC = {
    'S001': dict(build=lambda p, t: D.box_label(p['text'], p.get('h', .03)), zone='top', cy=.31, motion='pop', dur=1.6, sfx='pop', needs=['text']),
    'S002': dict(build=lambda p, t: D.option_check(p['text'], p.get('h', .02)), zone='anchor', cy=.66, motion='pop', dur=1.4, sfx='none', needs=['text']),
    'S003': dict(build=lambda p, t: D.vstack([D.box_label(x, p.get('h', .026)) for x in p['lines'][:1 + int(t * len(p['lines']) * .999)]], gap=10, align='left'),
                 zone='top', cy=.3, motion='none', dur=2.4, sfx='pop', needs=['lines']),
    'S004': dict(build=lambda p, t: D.big_number(p['text'], p.get('h', .075)), zone='middle', cy=.45, motion='pop', dur=1.4, sfx='ding', needs=['text']),
    'S005': dict(build=lambda p, t: D.count_frame(p['start'], p['end'], t, p.get('fmt', '{:,.1f}'), p.get('unit', '')), zone='middle', cy=.45, motion='count', dur=1.6, sfx='none', needs=['start', 'end']),
    'S006': dict(build=lambda p, t: D.center_number_box(p['text']), zone='center', cy=.5, motion='pop', dur=1.4, sfx='pop', needs=['text']),
    'S007': dict(build=lambda p, t: D.box_label(p['text'], p.get('h', .024), fg=D.WHITE), zone='anchor', cy=.62, motion='pop', dur=1.4, sfx='none', needs=['text']),
    'S008': dict(build=lambda p, t: D.tape(p['text'], p.get('h', .028), mark=p.get('mark')), zone='anchor', cy=.6, motion='slide', dur=1.5, sfx='whoosh', needs=['text']),
    'S009': dict(build=lambda p, t: D.exclaim(p['text']), zone='center', cy=.42, motion='pop', dur=.9, sfx='pop', needs=['text']),
    'S010': dict(build=lambda p, t: D.red_x(p.get('size', 420)), zone='center', cy=.45, motion='pop', dur=1.0, sfx='buzz', needs=[]),
    'S011': dict(build=lambda p, t: D.price_fix(p['old'], p['new']), zone='middle', cy=.45, motion='pop', dur=2.0, sfx='ding', needs=['old', 'new']),
    'S012': dict(build=lambda p, t: D.speaker(p.get('n', 3)), zone='bottom', cy=.74, motion='bob', dur=2.0, sfx='none', needs=[]),
    'S013': dict(build=lambda p, t: D.emoji_tag(p['text'], p['emoji']), zone='top', cy=.31, motion='pop', dur=1.4, sfx='pop', needs=['text', 'emoji']),
    'S014': dict(build=lambda p, t: D.stat_chip(p['text'], p.get('up', True)), zone='anchor', cy=.55, motion='slide', dur=1.4, sfx='none', needs=['text']),
    'S015': dict(build=lambda p, t: D.dim_arrow(p['text'], p.get('length', 700)), zone='middle', cy=.5, motion='fade', dur=1.8, sfx='none', needs=['text']),
    'S016': dict(build=lambda p, t: D.arc_text(p['text']), zone='top', cy=.25, motion='pop', dur=1.4, sfx='pop', needs=['text']),
    'S017': dict(build=lambda p, t: D.typewriter(p['text'], t), zone='top', cy=.3, motion='type', dur=1.6, sfx='none', needs=['text']),
    'S018': dict(build=lambda p, t: D.polaroid(p['photo'], p['text']), zone='middle', cy=.45, motion='slide', dur=2.0, sfx='whoosh', needs=['photo', 'text']),
    'S019': dict(build=lambda p, t: D.phone(p['screen']), zone='middle', cy=.5, motion='slide', dur=2.4, sfx='whoosh', needs=['screen']),
    'S020': dict(build=lambda p, t: D.ring(p.get('size', 260)), zone='anchor', cy=.5, motion='pop', dur=1.2, sfx='none', needs=[]),
    'S021': dict(build=lambda p, t: D.listing_card(p['photo'], p['title'], p['price'], p['meta']), zone='middle', cy=.5, motion='slide', dur=2.4, sfx='whoosh', needs=['photo', 'title', 'price', 'meta']),
    'S022': dict(build=lambda p, t: D.web_window(p['screen']), zone='middle', cy=.5, motion='slide', dur=2.2, sfx='whoosh', needs=['screen']),
    'S023': dict(build=lambda p, t: D.split3(p['photos']), zone='full', cy=.5, motion='none', dur=2.0, sfx='whoosh', needs=['photos']),
    'S024': dict(build=lambda p, t: D.tape(p['texts'][min(len(p['texts']) - 1, int(t * len(p['texts'])))], p.get('h', .028), mark='✓'), zone='anchor', cy=.62, motion='none', dur=3.0, sfx='pop', needs=['texts']),
    'S025': dict(build=lambda p, t: D.quiz_title(p['line1'], p.get('line2', '')), zone='top', cy=.28, motion='pop', dur=2.4, sfx='pop', needs=['line1']),
    'S026': dict(build=lambda p, t: D.info_list(p['rows'], reveal=int(t * (len(p['rows']) + 1))), zone='bottom', cy=.72, motion='none', dur=3.0, sfx='pop', needs=['rows']),
    'S027': dict(build=lambda p, t: D.two_choice(p['a'], p['b'], p.get('chosen') if t > .6 else None), zone='center', cy=.45, motion='pop', dur=2.4, sfx='ding', needs=['a', 'b']),
    'S028': dict(build=lambda p, t: D.tape(p.get('text', '댓글로 알려 주세요!'), .03, mark='💬'), zone='bottom', cy=.7, motion='pop', dur=2.0, sfx='pop', needs=[]),
    'S029': dict(build=lambda p, t: D.box_label(p.get('text', '팔로우하고 매물 더 보기'), .026, fg=D.WHITE), zone='bottom', cy=.72, motion='slide', dur=2.0, sfx='none', needs=[]),
    'S030': dict(build=lambda p, t: D.logo_band(sub=p.get('sub', '중고차는 보배드림')), zone='center', cy=.48, motion='pop', dur=2.2, sfx='ding', needs=[]),
    'S031': dict(build=lambda p, t: D.sparkle(p.get('size', 120)), zone='anchor', cy=.3, motion='bob', dur=1.2, sfx='none', needs=[]),
    'S032': dict(build=lambda p, t: D.asmr_label(p['text']), zone='top', cy=.28, motion='pop', dur=2.0, sfx='none', needs=['text']),
    'S033': dict(build=lambda p, t: D.name_tag(p['name'], p.get('role', '')), zone='anchor', cy=.62, motion='slide', dur=2.2, sfx='none', needs=['name']),
    'S034': dict(build=lambda p, t: D.surprise_lines(), zone='anchor', cy=.25, motion='pop', dur=.8, sfx='pop', needs=[]),
    'S035': dict(build=lambda p, t: D.finger(p.get('dir', 'left'), p.get('size', 180)), zone='anchor', cy=.55, motion='bob', dur=1.6, sfx='none', needs=[]),
    'S036': dict(build=lambda p, t: D.option_check(p['text']), zone='anchor', cy=.66, motion='pop', dur=1.4, sfx='click', needs=['text']),
    'S037': dict(build=lambda p, t: D.quiz_title(p.get('line1', '공개합니다'), p.get('line2', '')), zone='top', cy=.28, motion='pop', dur=1.6, sfx='whoosh', needs=[]),
    'S038': dict(build=lambda p, t: D.caption_upper(p['words'], int(t * len(p['words']) * .999)), zone='caption', cy=.62, motion='none', dur=.8, sfx='none', needs=['words']),
    'S039': dict(build=lambda p, t: D.caption_sentence(p['text'], p.get('keyword', ''), box_kw=p.get('box', False)), zone='caption', cy=.62, motion='none', dur=1.6, sfx='none', needs=['text']),
    'S040': dict(build=lambda p, t: D.flag(p['code']), zone='anchor', cy=.28, motion='pop', dur=1.2, sfx='none', needs=['code']),
    'S041': dict(build=lambda p, t: D.official_title(p.get('prefix', '신형'), p['name']), zone='top', cy=.3, motion='fade', dur=2.0, sfx='none', needs=['name']),
    'S042': dict(build=lambda p, t: D.currency_tease(p.get('sym', '₩')), zone='center', cy=.45, motion='pop', dur=.9, sfx='pop', needs=[]),
    'S043': dict(build=lambda p, t: D.rank_number(p['n']), zone='center', cy=.42, motion='pop', dur=1.0, sfx='pop', needs=['n']),
    'S044': dict(build=lambda p, t: D.wipe_frame(t), zone='full', cy=.5, motion='wipe', dur=.5, sfx='whoosh', needs=[]),
    'S045': dict(build=lambda p, t: D.green_check_label(p['text']), zone='anchor', cy=.62, motion='pop', dur=1.4, sfx='ding', needs=['text']),
    'S046': dict(build=lambda p, t: D.place_chip(p['text']), zone='bottom', cy=.7, motion='slide', dur=1.4, sfx='none', needs=['text']),
    'S047': dict(build=lambda p, t: D.split2(p['photos']), zone='full', cy=.5, motion='none', dur=2.0, sfx='whoosh', needs=['photos']),
    'S048': dict(build=lambda p, t: D.explain_card(p.get('icon', '🤝'), p['text'], t), zone='middle', cy=.45, motion='pop', dur=2.0, sfx='ding', needs=['text']),
    'S049': dict(build=lambda p, t: D.brand_badge(p['logo']), zone='anchor', cy=.68, motion='pop', dur=1.4, sfx='none', needs=['logo']),
    'S050': dict(build=lambda p, t: D.slogan_card(p.get('text', '내 차 찾기는 보배드림')), zone='top', cy=.3, motion='fade', dur=1.8, sfx='none', needs=[]),
    # S051 단색 배경 진행자는 촬영 연출(그리는 요소 없음) — planner 가 건너뜀
}


def build(skill_id, params, t=1.0):
    s = SPEC[skill_id]
    miss = [k for k in s['needs'] if k not in params]
    if miss:
        raise ValueError(f'{skill_id} 파라미터 없음: {miss}')
    return s['build'](params, t)
