"""그림 ↔ 문장 점수(제로샷 분류) 공용 모듈. 2026-11-22 CLIP(2021) → SigLIP 2(2025, Apache-2.0) 교체.

  from vlm import ZeroShot
  zs = ZeroShot()                         # 기본 SigLIP 2 base. BBM_VLM=clip 이면 옛 CLIP(비교용)
  tf = zs.text(['a photo of a car wheel', ...])     # 정규화된 문장 특징
  imf = zs.image([PIL.Image, ...])                   # 정규화된 그림 특징
  p = zs.probs(imf, tf)                              # 문장들 사이 확률(softmax) — 그림마다 합 1

SigLIP 2는 문장마다 따로 맞는지 판단하도록 학습돼(sigmoid), 여러 문장 중 하나 고르기에는
logit_scale·logit_bias를 곱한 값에 softmax를 씌워 CLIP과 같은 방식으로 쓴다(최고점 부위 고르기용).
"""
import os

MODELS = {'siglip2': 'google/siglip2-base-patch16-224', 'clip': 'openai/clip-vit-base-patch32'}


class ZeroShot:
    def __init__(self, name=None):
        import torch
        from transformers import AutoModel, AutoProcessor
        self.torch = torch
        self.name = name or os.environ.get('BBM_VLM', 'clip')  # 2026-11-22 SigLIP 2 비교 시험 끝나기 전까지 기본은 CLIP
        self.m = AutoModel.from_pretrained(MODELS[self.name]).eval()
        self.p = AutoProcessor.from_pretrained(MODELS[self.name])

    def _feat(self, f):
        f = getattr(f, 'pooler_output', f)
        return f / f.norm(dim=-1, keepdim=True)

    def text(self, texts):
        with self.torch.no_grad():
            kw = dict(padding='max_length', max_length=64, truncation=True) if self.name == 'siglip2' else dict(padding=True)
            return self._feat(self.m.get_text_features(**self.p(text=texts, return_tensors='pt', **kw)))

    def image(self, imgs, batch=32):
        out = []
        with self.torch.no_grad():
            for i in range(0, len(imgs), batch):
                out.append(self._feat(self.m.get_image_features(**self.p(images=imgs[i:i + batch], return_tensors='pt'))))
        return self.torch.cat(out)

    def probs(self, imf, tf):
        with self.torch.no_grad():
            if self.name == 'siglip2':
                lg = imf @ tf.T * self.m.logit_scale.exp() + self.m.logit_bias
            else:
                lg = 100 * imf @ tf.T
            return lg.softmax(-1).numpy()
