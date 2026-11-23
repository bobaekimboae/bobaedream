"""부위 추적기 선택 스위치 — 2026-11-24 「VitTrack → TAPNext++ 비교」.

BBM_TRACKER=vittrack|tapnext   (기본 vittrack, 비교 검사·사용자 승인 전에는 기본값을 바꾸지 않는다)

- vittrack: OpenCV Zoo VitTrack(models/vittrack_2023sep.onnx, Apache-2.0). 상자를 따라감. 없으면 CSRT.
- tapnext: 구글 딥마인드 TAPNext++(tapnet 저장소, 코드·체크포인트 Apache-2.0). 점 하나를 따라가고, 가려졌다 다시 나타나면 다시 찾음.
    BBM_TAPNET_DIR   tapnet 저장소를 받아 둔 폴더(파이썬 import 경로에 더함). recurrentgemma 등 추가 설치 없이 torch 판만 씀
    BBM_TAPNEXT_CKPT tapnextpp_ckpt.pt 경로(2.5GB, https://storage.googleapis.com/dm-tapnet/tapnextpp/tapnextpp_ckpt.pt)

공통 입력: 프레임 목록(BGR), 시작 프레임 번호, 시작 점(0~1 비율), 상자 크기(0~1 비율, vittrack만 씀)
공통 출력: 프레임마다 (x, y, 보임 여부) — x·y는 0~1 비율. 놓친 프레임은 마지막 위치를 유지하고 보임=False.
앞뒤 모두: 시작 프레임에서 앞으로 한 번, 뒤로 한 번 따라간다(기존 car_track.py와 같은 방식).
"""
import os
import sys
import time

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VIT = os.path.join(HERE, '..', 'models', 'vittrack_2023sep.onnx')
NAME = os.environ.get('BBM_TRACKER', 'vittrack')


def _vit():
    if hasattr(cv2, 'TrackerVit_create') and os.path.exists(VIT):
        p = cv2.TrackerVit_Params(); p.net = VIT
        return cv2.TrackerVit_create(p)
    return cv2.TrackerCSRT_create()


def _track_vit(frames, i0, pt, wh, score_min=0.2):
    H, W = frames[0].shape[:2]
    bw, bh = int(W * min(.6, max(.08, wh[0]))), int(H * min(.5, max(.05, wh[1])))
    box = (int(pt[0] * W - bw / 2), int(pt[1] * H - bh / 2), bw, bh)
    out = [None] * len(frames); out[i0] = (pt[0], pt[1], True)
    for seq in (range(i0 + 1, len(frames)), range(i0 - 1, -1, -1)):
        tr = _vit(); tr.init(frames[i0], box); last = pt
        for j in seq:
            ok, b = tr.update(frames[j])
            good = ok and (not hasattr(tr, 'getTrackingScore') or tr.getTrackingScore() >= score_min)
            if good:
                last = ((b[0] + b[2] / 2) / W, (b[1] + b[3] / 2) / H)
            out[j] = (last[0], last[1], bool(good))
    return out


_TN = None


def _tapnext_model():
    global _TN
    if _TN is None:
        d = os.environ.get('BBM_TAPNET_DIR')
        if d and d not in sys.path:
            sys.path.insert(0, d)
        import torch
        from tapnet.tapnextpp.votsp2026.model import TAPNextPP
        ck = os.environ.get('BBM_TAPNEXT_CKPT', 'tapnextpp_ckpt.pt')
        torch.set_num_threads(max(1, os.cpu_count() or 1))
        _TN = TAPNextPP.from_checkpoint(ck, device='cuda' if torch.cuda.is_available() else 'cpu')
    return _TN


def _track_tapnext(frames, i0, pt, wh=None):
    m = _tapnext_model()
    H, W = frames[0].shape[:2]
    q = np.array([[pt[0] * W, pt[1] * H]], np.float32)
    out = [None] * len(frames); out[i0] = (pt[0], pt[1], True)
    for seq in (list(range(i0 + 1, len(frames))), list(range(i0 - 1, -1, -1))):
        if not seq:
            continue
        _, _, st = m.track_frame(frames[i0], query_points_xy=q)
        last = pt
        for j in seq:
            p, vis, st = m.track_frame(frames[j], state=st)
            if vis[0]:
                last = (float(p[0, 0]) / W, float(p[0, 1]) / H)
            out[j] = (last[0], last[1], bool(vis[0]))
    return out


def track(frames, i0, pt, wh=(0.16, 0.09), name=None):
    """frames: BGR 프레임 목록, i0: 시작 프레임, pt: (x, y) 0~1, wh: 상자 (w, h) 0~1.
    돌려줌: (결과 목록 [(x, y, 보임)], 걸린 초)"""
    name = name or NAME
    t = time.time()
    if name == 'tapnext':
        r = _track_tapnext(frames, i0, pt, wh)
    elif name == 'vittrack':
        r = _track_vit(frames, i0, pt, wh)
    else:
        raise ValueError(f'BBM_TRACKER={name} — vittrack 또는 tapnext만 됨')
    return r, time.time() - t
