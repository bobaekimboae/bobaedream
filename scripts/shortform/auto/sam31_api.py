"""Meta Model API의 sam-3.1 연결(2026-11-25).

글자로 부위를 찾고(예: "car emblem", "steering wheel") 상자·마스크·프레임 간 같은 물체 번호를 받는다.
설치 없이 서버에서 돌린다(가중치 3.5GB를 받지 않음). 문서: https://dev.meta.ai/docs/sam/overview

키: 환경변수 MODEL_API_KEY 에서만 읽는다. 코드·깃·노션·채팅 기록에 적지 않는다.

python3 sam31_api.py 사진.jpg "car emblem"              # 이미지
python3 sam31_api.py 영상.mp4 "steering wheel" --conf    # 영상(파일 올린 뒤 file_id로 요청, 신뢰도 포함)
python3 sam31_api.py 영상.mp4 "badge" --out tracks_sam.json

결과 JSON: {"model","prompt","frames":{"0":[{"id","box":[x1,y1,x2,y2],"size":[w,h],"c","mask"}...]}, "empty": bool}
- 프레임 번호는 응답의 <Nf> 값(비어 있는 프레임은 줄이 없음). 물체 번호는 프레임이 바뀌어도 같은 물체면 같다.
- mask는 응답 원문 그대로(높이,너비,인코딩 표시+base85 본문). 풀기는 공식 클라이언트 규칙 확인 뒤 붙인다.
- 일치하는 물체가 없으면 빈 결과이며 오류가 아니다.
제한(문서): 영상 MP4/MOV · H.264/H.265/MPEG-4, 요청당 최대 15,000프레임, 물체 최대 16개, 영상은 프레임 단위 과금(최소 50프레임).
과금이 있으니 같은 요청을 재시도로 반복하지 않는다(실패하면 원인부터 본다).
"""
import argparse
import base64
import json
import mimetypes
import os
import re
import sys
import time

import requests

BASE = os.environ.get('MODEL_API_BASE', 'https://api.meta.ai/v1')
MODEL = 'sam-3.1'
REC = re.compile(r'(\d+)<\|box;([^|]*)\|><\|mask;([^|]*)\|>')


def _key():
    k = os.environ.get('MODEL_API_KEY', '').strip()
    if not k:
        raise SystemExit('⛔ MODEL_API_KEY 환경변수가 없습니다. Meta Model API 키를 환경변수로만 넣어 주세요(코드·채팅에 적지 않음).')
    return k


def _hdr(extra=None):
    h = {'Authorization': f'Bearer {_key()}'}
    h.update(extra or {})
    return h


def upload_video(path):
    """영상은 POST /v1/files(purpose=user_data)로 올려 file_id로 보낸다. faststart면 서버가 다시 묶지 않아 빠르다."""
    with open(path, 'rb') as f:
        r = requests.post(f'{BASE}/files', headers=_hdr(), data={'purpose': 'user_data'},
                          files={'file': (os.path.basename(path), f, mimetypes.guess_type(path)[0] or 'video/mp4')}, timeout=600)
    if r.status_code >= 300:
        raise SystemExit(f'⛔ 영상 올리기 실패 {r.status_code}: {r.text[:300]}')
    return r.json()['id']


def media_part(path):
    if path.startswith(('http://', 'https://')):
        kind = 'input_video' if path.lower().split('?')[0].endswith(('.mp4', '.mov')) else 'input_image'
        return {'type': kind, ('video_url' if kind == 'input_video' else 'image_url'): path}
    if path.lower().endswith(('.mp4', '.mov')):
        return {'type': 'input_video', 'file_id': upload_video(path)}
    mt = mimetypes.guess_type(path)[0] or 'image/jpeg'
    return {'type': 'input_image', 'image_url': f'data:{mt};base64,' + base64.b64encode(open(path, 'rb').read()).decode()}


def _kv(s):
    out = {}
    for part in s.split(';'):
        if '=' in part:
            k, v = part.split('=', 1)
            out[k] = v
    return out


def parse(text):
    """output_text 원문 → {프레임: [물체...]}. 줄은 <Nf>로 시작, 레코드는 쉼표로 이어짐."""
    frames = {}
    for line in text.splitlines():
        m = re.match(r'<(\d+)f>(.*)', line.strip())
        if not m:
            continue
        fi, body = m.group(1), m.group(2)
        objs = []
        for oid, box, mask in REC.findall(body):
            b = _kv(box)
            mk = _kv(mask)
            o = {'id': int(oid), 'box': [int(b['x1']), int(b['y1']), int(b['x2']), int(b['y2'])], 'size': [int(b['w']), int(b['h'])],
                 'mask': mk.get('data', '')}
            if 'c' in b:
                o['c'] = float(b['c'])
            objs.append(o)
        frames[fi] = objs
    return frames


def segment(media, prompt, conf=False, direction=None):
    """prompt: 짧은 명사구 하나(요청당 개념 1개). 상자·점 프롬프트 토큰(<0f>1<|box;...|>)도 그대로 넣을 수 있다."""
    _key()   # 키가 없으면 영상을 올리기 전에 멈춤
    body = {'model': MODEL, 'stream': True,
            'input': [{'type': 'message', 'role': 'user', 'content': [{'type': 'input_text', 'text': prompt}, media_part(media)]}]}
    meta = {}
    if conf:
        meta['include_confidence'] = 'true'
    if direction:
        meta['propagation_direction'] = direction
    if meta:
        body['metadata'] = meta
    t0 = time.time()
    r = requests.post(f'{BASE}/responses', headers=_hdr({'Content-Type': 'application/json', 'Accept': 'text/event-stream'}),
                      json=body, stream=True, timeout=1800)
    if r.status_code >= 300:
        raise SystemExit(f'⛔ sam-3.1 요청 실패 {r.status_code}: {r.text[:400]}')
    buf, done, err = [], False, None
    for raw in r.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith('data:'):
            continue
        d = raw[5:].strip()
        if d == '[DONE]':
            break
        try:
            ev = json.loads(d)
        except ValueError:
            continue
        t = ev.get('type', '')
        if t == 'response.output_text.delta':
            buf.append(ev.get('delta', ''))
        elif t == 'response.completed':
            done = True
        elif t in ('error', 'response.failed'):
            err = ev
    if err:
        raise SystemExit(f'⛔ sam-3.1 처리 오류: {json.dumps(err, ensure_ascii=False)[:400]}')
    text = ''.join(buf)
    frames = parse(text)
    return {'model': MODEL, 'prompt': prompt, 'media': os.path.basename(media), 'completed': done,
            'seconds': round(time.time() - t0, 2), 'empty': not frames, 'frames': frames}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('media')
    ap.add_argument('prompt')
    ap.add_argument('--out')
    ap.add_argument('--conf', action='store_true', help='상자·마스크에 신뢰도 포함')
    ap.add_argument('--direction', choices=['both', 'forward', 'backward'])
    a = ap.parse_args()
    res = segment(a.media, a.prompt, a.conf, a.direction)
    n = sum(len(v) for v in res['frames'].values())
    ids = sorted({o['id'] for v in res['frames'].values() for o in v})
    print(f"[sam-3.1] '{a.prompt}' 프레임 {len(res['frames'])}개 · 물체 기록 {n}개 · 물체 번호 {ids} · {res['seconds']}초" + (' · 일치 없음' if res['empty'] else ''))
    if a.out:
        json.dump(res, open(a.out, 'w'), ensure_ascii=False, indent=1)
        print('저장:', a.out)
    else:
        for fi in list(res['frames'])[:3]:
            print(fi, [(o['id'], o['box'], o.get('c')) for o in res['frames'][fi]])


if __name__ == '__main__':
    sys.exit(main())
