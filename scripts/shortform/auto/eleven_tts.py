"""일레븐랩스 음성 자동 생성(사람 손 없이). 키는 서버 환경 변수 ELEVENLABS_API_KEY 에서만 읽는다(채팅·파일에 적지 않음).

python3 eleven_tts.py OUT_DIR      # OUT_DIR/tts.txt → OUT_DIR/voice.mp3 + words.json(낱말 시각)
SAG_VOICE_KEY=m_busan python3 eleven_tts.py OUT_DIR   # 목소리 캐릭터 10개 중 하나(auto_edit_rules.json voice.characters)
설정: auto_edit_rules.json 의 voice(모델·목소리·안정도). 시각은 일레븐랩스가 함께 주는 글자별 시각을 어절로 묶는다
(받아쓰기 오인식이 없다). 키가 없으면 멈추고, 연결 도구로 만든 음성을 voice.mp3로 넣으면 auto_edit.py가 faster-whisper로 시각을 잰다.
"""
import base64, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))['voice']


def voice_id(key=None):
    """목소리 캐릭터 고르기: SAG_VOICE_KEY(예: m_busan, f_senior) → characters.list, 없으면 기본 voice_id"""
    key = key or os.environ.get('SAG_VOICE_KEY')
    for c in V.get('characters', {}).get('list', []):
        if key and c['key'] == key:
            return c['voice_id']
    if key:
        raise SystemExit(f'목소리 캐릭터 {key} 가 없습니다: ' + ', '.join(c['key'] for c in V['characters']['list']))
    return V['voice_id']


def main(out):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        raise SystemExit('ELEVENLABS_API_KEY 환경 변수가 없습니다(서버에 직접 넣어 주세요).')
    text = open(os.path.join(out, 'tts.txt'), encoding='utf-8').read().strip()
    st = {k: v for k, v in V['settings'].items() if not k.startswith('_')}
    body = dict(text=text, model_id=V['model'], language_code='ko',
                voice_settings=dict(stability=st['stability'], similarity_boost=st['similarity']))
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id()}/with-timestamps",
                                 data=json.dumps(body).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    open(os.path.join(out, 'voice.mp3'), 'wb').write(base64.b64decode(d['audio_base64']))
    al = d.get('normalized_alignment') or d['alignment']
    chars, s0, s1 = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words, cur = [], None
    for c, a, b in zip(chars, s0, s1):
        if c.isspace():
            cur = None
            continue
        if cur is None:
            cur = dict(text='', start=a, end=b)
            words.append(cur)
        cur['text'] += c
        cur['end'] = b
    words = [w for w in words if not re.fullmatch(r'\[[^\]]*\]', w['text'])]  # 감정 태그는 낱말이 아님
    json.dump(words, open(os.path.join(out, 'words.json'), 'w'), ensure_ascii=False)
    print('voice.mp3 · words', len(words))


if __name__ == '__main__':
    main(sys.argv[1])
