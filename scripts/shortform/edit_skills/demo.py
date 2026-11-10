"""샘플: 서울오토갤러리 레인지로버(매물 24번) 사진 17장으로 패턴·방식별 편집 영상 만들기
python3 -m edit_skills.demo OUTDIR [--mode 1|3] [--pattern P02]
사실은 매물 데이터(seoul-autogallery-v01.ts 24번)에 있는 값만 쓴다. 옵션 표가 없는 매물이라 옵션 칩은 넣지 않는다.
"""
import argparse, glob, json, os
from PIL import Image
from .planner import plan
from .check import check
from .render import render
from .library import LIB

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PHOTOS = sorted(glob.glob(os.path.join(REPO, 'public/assets/cars/seoul-autogallery-v01/rr/rr-*.jpg')))
CAR = dict(name='레인지로버 SV', price='가격 상담', year='2019', km='5.2만km', fuel='가솔린', company='투제이모터웍스')


def script(mode, pattern):
    ph = [Image.open(p) for p in PHOTOS]
    beats = []
    t = 0.0

    def add(scene, d, **facts):
        nonlocal t
        b = dict(start=t, dur=d, scene=scene, facts=facts.pop('facts', {}), photo=facts.pop('photo', None))
        b.update(facts)
        beats.append(b)
        t += d
    if pattern == 'P02':
        add('intro', 3.4, photo=1, facts=dict(text='레인지로버 SV', prefix='제 뒤에'))
        add('spec', 3.2, photo=2, facts=dict(number='2019'))
        add('spec', 3.2, photo=6, facts=dict(number='5.2만km'))
        add('point', 3.6, photo=5, facts=dict(text='5.0 V8 슈퍼차저'), anchor=[.42, .52])
        add('cta', 3.0, photo=3, facts=dict(place='투제이모터웍스'))
        add('ending', 3.4, photo=1, facts=dict(slogan='내 차 찾기는 보배드림'))
    elif pattern == 'P03':
        add('quiz_hook', 3.0, photo=9, facts=dict(line1='이 차 이름은?', line2='댓글로 맞혀 보세요'))
        add('hint', 3.0, photo=7, facts=dict(text='영국 브랜드'), anchor=[.5, .5])
        add('hint', 3.0, photo=5, facts=dict(text='5.0 V8'), anchor=[.42, .52])
        add('reveal', 3.2, photo=1, facts=dict(text='레인지로버 SV'))
        add('comment', 2.6, photo=2)
        add('ending', 3.2, photo=4, facts=dict(slogan='내 차 찾기는 보배드림'))
    elif pattern == 'P13':
        # 대담형: 코너 첫 화면 → 질문 → 인용 → 끝. 인용은 촬영한 실제 대답만 넣는다(여기는 자리 표시)
        add('interview_hook', 3.0, photo=1, facts=dict(series='보배드림 딜러 토크', episode='EP.1'))
        add('question_hook', 3.0, photo=2, facts=dict(line1='이 차 왜 샀어요?', line2='오너에게 물었습니다'))
        add('answer', 3.6, photo=6, facts=dict(quote='(실제 대답이 들어갈 자리)', person='차주'))
        add('point', 3.4, photo=5, facts=dict(text='5.0 V8 슈퍼차저'), anchor=[.42, .52])
        add('ending', 3.2, photo=4, facts=dict(slogan='내 차 찾기는 보배드림'))
    return dict(mode=mode, pattern=pattern, duration=round(t, 2), car=CAR, beats=beats), ph


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--mode', type=int, default=1)
    ap.add_argument('--pattern', default='P02')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    s, ph = script(a.mode, a.pattern)
    p = plan(s)
    rep = check(p['timeline'], p['duration'])
    name = f'{a.pattern}_m{a.mode}'
    json.dump(dict(plan=[{k: v for k, v in e.items() if k != 'params'} | dict(text=e['params'].get('text') or e['params'].get('name') or e['params'].get('line1'))
                         for e in p['timeline']], check=rep), open(os.path.join(a.out, name + '.json'), 'w'), ensure_ascii=False, indent=1)
    track = [(b['start'], b['dur'], PHOTOS[(b['photo'] or 1) - 1]) for b in s['beats']]
    render(p, os.path.join(a.out, name + '.mp4'), track=track)
    print(name, rep)


if __name__ == '__main__':
    main()
