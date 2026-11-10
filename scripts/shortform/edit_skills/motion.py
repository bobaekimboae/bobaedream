"""움직임 곡선: 스킬이 나타나고 사라지는 모양.
원본 실측(2026-11-10 chipmeasure·capmeasure, AS24 NL·BE): 칩은 2프레임 안에 다 커지고(grow_med 2.0 @30fps),
말 자막은 튀어나오지 않고 바로 뜬다(pop 1.0). 그래서 pop 은 짧은 과장(1.08) 후 바로 제자리.
돌려주는 값: (scale, alpha, dx, dy) — dx·dy 는 픽셀
"""
import math

FPS = 30
IN = 2 / FPS      # 나타나는 시간(원본 칩 2프레임)
OUT = 3 / FPS     # 사라지는 시간


def _ease_out(x):
    return 1 - (1 - x) ** 3


def at(kind, t, dur):
    """t = 스킬 시작 후 경과(초)"""
    if t < 0 or t > dur:
        return None
    tail = dur - t
    a_out = min(1.0, tail / OUT)
    if kind == 'none':
        return 1.0, 1.0, 0, 0
    if kind == 'pop':
        if t < IN:
            x = t / IN
            return .72 + .36 * _ease_out(x), min(1, x * 1.5), 0, 0      # 0.72 → 1.08
        if t < IN + 2 / FPS:
            return 1.08 - .08 * ((t - IN) / (2 / FPS)), 1.0, 0, 0        # 1.08 → 1.00
        return 1.0, a_out, 0, 0
    if kind == 'slide':
        x = min(1, t / (5 / FPS))
        return 1.0, min(1, x * 2) * a_out, int((1 - _ease_out(x)) * -140), 0
    if kind == 'fade':
        return 1.0, min(1, t / .25) * a_out, 0, 0
    if kind == 'bob':
        return 1.0, min(1, t / .1) * a_out, int(math.sin(t * 2 * math.pi * 1.6) * 14), 0
    if kind in ('count', 'type', 'wipe'):
        return 1.0, a_out if kind != 'wipe' else 1.0, 0, 0
    return 1.0, 1.0, 0, 0
