"""카드 클립 1개~여러 개를 골라 차량 편집에 넣을 한 조각으로 잇기 — 카드 정보 v0.2 (2026-11-26 클로드 시안)

python3 compose_cards.py <클립 앞이름> <종류,종류,...> <출력.mp4>
  예) python3 compose_cards.py out/claude_sian_cardinfo_g400d_v2 report,insurance,timeline out/edit_insert_3cards.mp4
  - 종류 순서는 card_info_rules.json 의 order로 다시 맞춘다(사용자가 섞어 적어도 엔카 기본 순서 유지).
  - 1개만 주면 그 클립을 그대로 복사한다. 음량은 이은 뒤 -14 LUFS로 다시 맞춘다.
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from render_card_info import RULES, fix_loudness  # noqa: E402


def main(base, kinds, out):
    want = [k for k in RULES['order'] if k in kinds.split(',')]
    clips = [f'{base}_{k}.mp4' for k in want if os.path.exists(f'{base}_{k}.mp4')]
    if not clips:
        sys.exit('클립 없음: ' + kinds)
    ins = sum([['-i', c] for c in clips], [])
    fc = ''.join(f'[{i}:v][{i}:a]' for i in range(len(clips))) + f'concat=n={len(clips)}:v=1:a=1[v][a]'
    subprocess.run(['ffmpeg', '-y', '-v', 'error'] + ins + ['-filter_complex', fc, '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', out], check=True)
    print(json.dumps({'out': out, 'cards': want, 'lufs': fix_loudness(out)}, ensure_ascii=False))


if __name__ == '__main__':
    main(*sys.argv[1:4])
