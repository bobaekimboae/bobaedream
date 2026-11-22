#!/usr/bin/env python3
"""효과음 후보를 '귀'로 채점한다 — CLAP(laion/larger_clap_general, Apache-2.0).

클로드는 소리를 못 들으므로, 소리와 설명 글의 닮은 정도(코사인)를 숫자로 잰다.
earshot(MIT)의 `match`와 같은 모델·같은 방식(z값)이다. earshot 패키지는 설치하지 않고 모델만 쓴다.

점수:
- sim  : 소리 ↔ 그 종류 설명 닮음
- z    : 같은 소리가 다른 종류 설명들과 비교해 얼마나 그 종류에 가까운지(표준점수). 1.0 이상이면 '맞음'.
- 고르기: z 높은 순 → 같은 점수면 sim. 종류마다 --keep 개.

사용: python3 score_clap.py <후보폴더(candidates.json 있는 곳)> [--keep 3]
결과: <폴더>/scores.json
"""
import argparse, json, os, subprocess, sys
import numpy as np

SR = 48000  # CLAP 입력 표본율


def load(path, sr=SR, max_s=6.0):
    """ffmpeg로 모노 float32로 읽는다(앞 max_s초)."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-t", str(max_s), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--keep", type=int, default=3)
    ap.add_argument("--model", default="laion/larger_clap_general")
    a = ap.parse_args()
    import torch
    from transformers import ClapModel, ClapProcessor
    torch.set_num_threads(max(1, min(4, (os.cpu_count() or 2) // 2)))
    meta = json.load(open(os.path.join(a.folder, "candidates.json")))
    model = ClapModel.from_pretrained(a.model).eval()
    proc = ClapProcessor.from_pretrained(a.model)

    kinds = sorted({m["kind"] for m in meta})
    descs = [next(m["desc"] for m in meta if m["kind"] == k) for k in kinds]
    with torch.no_grad():
        t = proc(text=descs, return_tensors="pt", padding=True)
        te = model.get_text_features(**t)
        te = torch.nn.functional.normalize(te if torch.is_tensor(te) else te.pooler_output, dim=-1)

    rows = []
    for m in meta:
        try:
            wav = load(os.path.join(a.folder, m["file"]))
        except Exception as e:
            print("읽기 실패", m["file"], e, file=sys.stderr)
            continue
        if wav.size < SR * 0.05 or float(np.abs(wav).max()) < 1e-3:
            continue  # 너무 짧거나 무음
        with torch.no_grad():
            x = proc(audio=[wav], sampling_rate=SR, return_tensors="pt")
            ae = model.get_audio_features(**x)
            ae = torch.nn.functional.normalize(ae if torch.is_tensor(ae) else ae.pooler_output, dim=-1)
            sims = (ae @ te.T)[0].numpy()
        i = kinds.index(m["kind"])
        z = float((sims[i] - sims.mean()) / (sims.std() + 1e-6))
        best = kinds[int(sims.argmax())]
        rows.append({**m, "sim": round(float(sims[i]), 4), "z": round(z, 3), "best_kind": best,
                     "verdict": "맞음" if z >= 1.0 else ("애매" if z >= 0.3 else "아님")})
        print(f"{m['kind']:15s} z={z:5.2f} sim={sims[i]:.3f} 가장닮음={best:14s} {m['title'][:40] if m.get('title') else ''}")

    chosen = []
    for k in kinds:
        cand = sorted([r for r in rows if r["kind"] == k and r["verdict"] != "아님"],
                      key=lambda r: (r["z"], r["sim"]), reverse=True)
        for r in cand[: a.keep]:
            r["chosen"] = True
            chosen.append(r)
    json.dump({"model": a.model, "rows": rows, "chosen": [r["id"] for r in chosen]},
              open(os.path.join(a.folder, "scores.json"), "w"), ensure_ascii=False, indent=1)
    print(f"고른 소리 {len(chosen)}개 / 후보 {len(rows)}개")


if __name__ == "__main__":
    main()
