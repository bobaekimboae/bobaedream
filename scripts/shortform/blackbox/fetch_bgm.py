#!/usr/bin/env python3
"""Openverse에서 블랙박스 릴스용 배경음 후보를 받는다 (CC0 · CC BY만, 상업 이용 가능).

- BY-NC · BY-SA · BY-ND 는 받지 않는다. CC BY 곡은 게시글에 표기 문구를 꼭 넣는다(credit 필드).
- 결과: <out>/<id>.mp3 + <out>/bgm_candidates.json(제목·작성자·라이선스·출처·표기 문구)
- 고른 뒤 귀로 한 번 듣고(목소리·가사 없음 확인) 원장 "bgm" 에 파일 경로를 적는다.

사용: python3 fetch_bgm.py --out work/bgm [--mood tension] [--per 6]
"""
import argparse, json, os, urllib.parse, urllib.request
API = 'https://api.openverse.org/v1/audio/'
MOODS = {  # 블랙박스 성격별 검색어
    'tension': ['suspense tension', 'dark ambient tension', 'news tension underscore'],
    'calm': ['calm ambient underscore', 'soft piano ambient'],
    'alert': ['urgent news bed', 'breaking news background'],
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'bobaedream-shortform/1.0'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--mood', default='tension'); ap.add_argument('--per', type=int, default=6)
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); seen = set(); meta = []
    for q in MOODS[a.mood]:
        qs = urllib.parse.urlencode({'q': q, 'license': 'cc0,by', 'category': 'music', 'page_size': 20})
        for r in json.loads(get(API + '?' + qs))['results']:
            if r['id'] in seen or not r.get('duration') or not (15000 <= r['duration'] <= 240000): continue
            if r['license'] not in ('cc0', 'by'): continue
            seen.add(r['id']); f = os.path.join(a.out, r['id'][:12] + '.mp3')
            try: open(f, 'wb').write(get(r['url']))
            except Exception as e: print('실패', r['title'], e); continue
            lic = 'CC0 1.0' if r['license'] == 'cc0' else f"CC BY {r['license_version']}"
            credit = '' if r['license'] == 'cc0' else f"Music: \"{r['title']}\" by {r['creator']} ({r['source']}), {lic}"
            meta.append({'file': os.path.basename(f), 'title': r['title'], 'creator': r['creator'], 'license': lic, 'license_url': r['license_url'],
                         'source': r['source'], 'page': r['foreign_landing_url'], 'duration_s': r['duration'] / 1000, 'query': q, 'credit': credit})
            print(lic, '|', r['title'], '|', r['creator'])
            if sum(m['query'] == q for m in meta) >= a.per: break
    json.dump(meta, open(os.path.join(a.out, 'bgm_candidates.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
