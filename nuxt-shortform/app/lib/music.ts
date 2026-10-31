// 배경 음악(2026-10-31): 저작권 걱정이 없도록 보배드림이 코드로 직접 만든 소리(드럼 · 베이스 · 화음)만 쓴다.
// 박자(BPM)를 알려 주면 영상 컷 길이를 박자에 맞춘다(한 컷 = 4박).
import type { MusicId } from "./store";

export const MUSIC: { id: MusicId; label: string; desc: string; bpm: number }[] = [
  { id: "drive", label: "경쾌한", desc: "밝은 드라이브 리듬", bpm: 120 },
  { id: "calm", label: "잔잔한", desc: "고급차 · 차분한 화음", bpm: 96 },
  { id: "punch", label: "강렬한", desc: "스포츠카 · 빠른 비트", bpm: 128 },
  { id: "none", label: "음악 없음", desc: "올릴 때 앱에서 고를게요", bpm: 120 },
];
export const bpmOf = (id: MusicId) => MUSIC.find((m) => m.id === id)?.bpm ?? 120;

// 화음 진행(근음 주파수). 한 마디 = 4박
const PROG: Record<Exclude<MusicId, "none">, number[][]> = {
  drive: [[220, 277.18, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]],
  calm: [[196, 246.94, 293.66], [164.81, 196, 246.94], [174.61, 220, 261.63], [196, 246.94, 293.66]],
  punch: [[146.83, 174.61, 220], [146.83, 174.61, 220], [130.81, 164.81, 196], [116.54, 146.83, 174.61]],
};

function noiseBuffer(ctx: BaseAudioContext) {
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return b;
}

/** 길이(초)만큼 음악을 만든다. 끝 1.5초는 소리를 줄인다. */
export async function makeMusic(id: MusicId, seconds: number): Promise<AudioBuffer | null> {
  if (id === "none" || typeof OfflineAudioContext === "undefined") return null;
  const rate = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(0.55, 0.4);
  master.gain.setValueAtTime(0.55, Math.max(0.5, seconds - 1.5));
  master.gain.linearRampToValueAtTime(0.0001, seconds);
  master.connect(ctx.destination);
  const bpm = bpmOf(id);
  const beat = 60 / bpm;
  const prog = PROG[id];
  const noise = noiseBuffer(ctx);
  const beats = Math.ceil(seconds / beat);
  for (let i = 0; i < beats; i += 1) {
    const t = i * beat;
    const chord = prog[Math.floor(i / 4) % prog.length]!;
    // 킥: 낮은 음이 빠르게 떨어진다
    if (id !== "calm" || i % 2 === 0) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(id === "punch" ? 150 : 120, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      g.gain.setValueAtTime(id === "calm" ? 0.5 : 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.3);
    }
    // 하이햇: 반 박마다
    for (const off of id === "punch" ? [0.5, 0.25, 0.75] : [0.5]) {
      const n = ctx.createBufferSource();
      n.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      const ht = t + beat * off;
      g.gain.setValueAtTime(id === "calm" ? 0.05 : 0.12, ht);
      g.gain.exponentialRampToValueAtTime(0.001, ht + 0.05);
      n.connect(hp).connect(g).connect(master);
      n.start(ht);
      n.stop(ht + 0.06);
    }
    // 스네어: 2 · 4박
    if (i % 4 === 1 || i % 4 === 3) {
      if (id !== "calm") {
        const n = ctx.createBufferSource();
        n.buffer = noise;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        n.connect(bp).connect(g).connect(master);
        n.start(t);
        n.stop(t + 0.2);
      }
    }
    // 베이스: 박마다 근음 한 옥타브 아래
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.value = chord[0]! / 2;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.linearRampToValueAtTime(0.28, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
    b.connect(bg).connect(master);
    b.start(t);
    b.stop(t + beat);
    // 화음: 마디 첫 박에 길게
    if (i % 4 === 0) {
      for (const f of chord) {
        const o = ctx.createOscillator();
        o.type = id === "punch" ? "sawtooth" : "sine";
        o.frequency.value = f;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = id === "punch" ? 1400 : 2400;
        const g = ctx.createGain();
        const len = beat * 4;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(id === "punch" ? 0.05 : 0.08, t + 0.08);
        g.gain.linearRampToValueAtTime(0.0001, t + len);
        o.connect(lp).connect(g).connect(master);
        o.start(t);
        o.stop(t + len);
      }
    }
  }
  return ctx.startRendering();
}
