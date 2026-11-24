"""보배드림 숏폼 배경음 찾기 MCP 서버 (오픈소스 음원, 2026-11-24 사용자 「음원 mcp 오픈소스 연결해라」).

음원 출처: Openverse API(WordPress 재단, 오픈소스 · 무료) — Jamendo · ccMixter · Freesound · Wikimedia의
크리에이티브 커먼즈 음악을 한 번에 찾는다. 상업 이용이 되는 CC0 · CC BY만 돌려준다
(BY-NC 비상업 · BY-SA 동일조건 · BY-ND 변경금지는 숏폼 편집·광고에 못 써서 뺌).
CC BY는 영상 설명·README에 저작자 표시(attribution 글)를 꼭 붙인다.

도구
- search_music(query, min_seconds, max_seconds, limit): 음악 찾기
- download_music(audio_id, out_dir): 받아서 mp3로 저장 + 출처 json
- search_sfx(query, max_seconds, limit, cc0_only): 효과음 찾기(기본 CC0만)
- score_music(paths, description): earshot(MIT, CLAP)으로 「경쾌한」 같은 설명에 얼마나 맞는지 + 노래(보컬) 여부 숫자로

실행: python3 server.py  (stdio MCP) · 설정: 저장소 루트 .mcp.json 의 bobae-music
"""
import json, os, subprocess, urllib.parse
try:   # mcp 2.x는 MCPServer, 1.x는 FastMCP
    from mcp.server.mcpserver import MCPServer as FastMCP
except ImportError:
    from mcp.server.fastmcp import FastMCP

API = 'https://api.openverse.org/v1/audio/'
UA = 'bobaedream-shortform/1.0 (+https://github.com/bobaekimboae/bobaedream)'
OK_LICENSES = 'cc0,by'
EARSHOT = os.environ.get('EARSHOT_BIN', os.path.expanduser('~/.venv-earshot/bin/earshot'))
mcp = FastMCP('bobae-music')


def _get(url, tries=4):
    """Openverse 익명 이용은 분당 요청 수 제한이 있어 가끔 500·빈 응답 → 잠깐 쉬고 다시"""
    import time
    for i in range(tries):
        out = subprocess.run(['curl', '-s', '-m', '25', '-A', UA, url], capture_output=True, text=True).stdout
        try:
            return json.loads(out)
        except ValueError:
            time.sleep(6 * (i + 1))
    return {}


@mcp.tool()
def search_music(query: str, min_seconds: int = 55, max_seconds: int = 300, limit: int = 20) -> list:
    """상업 이용 가능한(CC0·CC BY) 음악을 Openverse에서 찾는다. query 예: 'upbeat', 'happy energetic', 'funky'."""
    u = API + '?' + urllib.parse.urlencode({'q': query, 'license': OK_LICENSES, 'category': 'music', 'page_size': 20})
    d = _get(u)
    out = []
    for r in d.get('results', []):
        sec = (r.get('duration') or 0) / 1000
        if min_seconds <= sec <= max_seconds:
            out.append({'id': r['id'], 'title': r['title'], 'creator': r['creator'], 'seconds': round(sec),
                        'license': f"CC {r['license'].upper()} {r.get('license_version') or ''}".strip(),
                        'source': r['source'], 'page': r.get('foreign_landing_url'), 'attribution': r.get('attribution')})
    return out[:limit]


@mcp.tool()
def download_music(audio_id: str, out_dir: str) -> dict:
    """search_music 결과의 id로 음원을 받아 out_dir/<영문이름>.mp3 와 출처 json(.license.json)을 저장한다."""
    r = _get(API + audio_id + '/')
    if r.get('license') not in ('cc0', 'by'):
        return {'error': f"상업 이용 불가 라이선스: {r.get('license')}"}
    os.makedirs(out_dir, exist_ok=True)
    slug = ''.join(c if c.isalnum() else '_' for c in f"{r['creator']}_{r['title']}".lower())[:60].strip('_')
    mp3 = os.path.join(out_dir, slug + '.mp3')
    subprocess.run(['curl', '-sL', '-m', '120', '-A', 'Mozilla/5.0', '-o', mp3, r['url']], check=True)
    meta = {k: r.get(k) for k in ('id', 'title', 'creator', 'license', 'license_version', 'license_url',
                                  'foreign_landing_url', 'source', 'duration', 'attribution')}
    json.dump(meta, open(mp3[:-4] + '.license.json', 'w'), ensure_ascii=False, indent=1)
    return {'file': mp3, **meta}


@mcp.tool()
def score_music(paths: list, description: str = 'upbeat cheerful energetic instrumental pop music') -> str:
    """earshot으로 각 파일이 설명에 얼마나 맞는지(strong z≥3) + 노래 목소리가 있는지 숫자로 판정. 클로드는 소리를 못 들으므로 이것으로 고른다."""
    clips = []
    for p in paths:   # 곡 가운데 20초만 들어 빠르게
        c = p + '.mid20.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '30', '-t', '20', '-i', p, '-ac', '1', '-ar', '48000', c], check=True)
        clips.append(c)
    a = subprocess.run([EARSHOT, 'rank', description, *clips, '--top', '20'], capture_output=True, text=True).stdout
    b = subprocess.run([EARSHOT, 'rank', 'a person singing vocals', *clips, '--top', '20'], capture_output=True, text=True).stdout
    return a + '\n--- 보컬 ---\n' + b


@mcp.tool()
def search_sfx(query: str, max_seconds: float = 4.0, limit: int = 15, cc0_only: bool = True) -> list:
    """효과음(sound effect)을 Openverse에서 찾는다(주로 Freesound). 기본은 CC0(저작자 표시 의무 없음)만. query 예: 'gear shift', 'page flip'."""
    u = API + '?' + urllib.parse.urlencode({'q': query, 'license': 'cc0' if cc0_only else OK_LICENSES,
                                            'page_size': 20})   # Freesound 소리는 category가 비어 있어 거르지 않음
    d = _get(u)
    out = []
    for r in d.get('results', []):
        sec = (r.get('duration') or 0) / 1000
        if 0 < sec <= max_seconds:
            out.append({'id': r['id'], 'title': r['title'], 'creator': r['creator'], 'seconds': round(sec, 2),
                        'license': f"CC {r['license'].upper()} {r.get('license_version') or ''}".strip(),
                        'source': r['source'], 'page': r.get('foreign_landing_url')})
    return out[:limit]


if __name__ == '__main__':
    mcp.run()
