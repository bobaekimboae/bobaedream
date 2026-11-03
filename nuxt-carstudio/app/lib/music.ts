// 배경 음악(원본 MUSIC: Presentation · Energetic · Cinematic · Relaxed · No music).
// 원본 음원은 쓰지 않는다. 저작권 걱정이 없게 보배드림이 코드로 만든 소리(드럼 · 베이스 · 화음)만 쓴다.
import type { MusicId } from "./types";

type Mood = { bpm: number; kick: number; hat: number[]; snare: number; pad: OscillatorType; padGain: number; cutoff: number; drums: boolean; prog: number[][] };

const C = { A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, Bb3: 233.08, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392 };

const MOODS: Record<Exclude<MusicId, "none">, Mood> = {
  presentation: { bpm: 100, kick: 0.6, hat: [0.5], snare: 0.2, pad: "sine", padGain: 0.08, cutoff: 2400, drums: true, prog: [[C.C3, C.E3, C.G3], [C.A2, C.C3, C.E3], [C.F3, C.A3, C.C4], [C.G3, C.B3, C.D4]] },
  energetic: { bpm: 128, kick: 0.95, hat: [0.25, 0.5, 0.75], snare: 0.38, pad: "sawtooth", padGain: 0.045, cutoff: 1500, drums: true, prog: [[C.D3, C.F3, C.A3], [C.D3, C.F3, C.A3], [C.C3, C.E3, C.G3], [C.Bb3 / 2, C.D3, C.F3]] },
  cinematic: { bpm: 76, kick: 0.7, hat: [], snare: 0, pad: "triangle", padGain: 0.11, cutoff: 1800, drums: false, prog: [[C.A2, C.E3, C.A3], [C.F3 / 2, C.C3, C.F3], [C.C3, C.G3, C.C4], [C.G3 / 2, C.D3, C.G3]] },
  relaxed: { bpm: 88, kick: 0.45, hat: [0.5], snare: 0.12, pad: "sine", padGain: 0.09, cutoff: 3000, drums: true, prog: [[C.F3, C.A3, C.C4], [C.E3, C.G3, C.B3], [C.D3, C.F3, C.A3], [C.C3, C.E3, C.G3]] },
};

export const MUSIC: { id: MusicId; label: string }[] = [
  { id: "presentation", label: "프레젠테이션" },
  { id: "energetic", label: "경쾌한" },
  { id: "cinematic", label: "시네마틱" },
  { id: "relaxed", label: "잔잔한" },
  { id: "none", label: "음악 없음" },
];

function noiseBuffer(ctx: BaseAudioContext) {
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return b;
}

/** 길이(초)만큼 음악을 만든다. 처음 0.6초는 키우고 끝 1.5초는 줄인다. */
export async function makeMusic(id: MusicId, seconds: number, volume = 0.5): Promise<AudioBuffer | null> {
  if (id === "none" || typeof OfflineAudioContext === "undefined") return null;
  const m = MOODS[id];
  const rate = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(volume, 0.6);
  master.gain.setValueAtTime(volume, Math.max(0.7, seconds - 1.5));
  master.gain.linearRampToValueAtTime(0.0001, seconds);
  master.connect(ctx.destination);
  const beat = 60 / m.bpm;
  const noise = noiseBuffer(ctx);
  const beats = Math.ceil(seconds / beat);
  for (let i = 0; i < beats; i += 1) {
    const t = i * beat;
    const chord = m.prog[Math.floor(i / 4) % m.prog.length]!;
    if (m.drums || i % 4 === 0) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
      g.gain.setValueAtTime(m.kick, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.3);
    }
    for (const off of m.hat) {
      const n = ctx.createBufferSource();
      n.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      const ht = t + beat * off;
      g.gain.setValueAtTime(0.09, ht);
      g.gain.exponentialRampToValueAtTime(0.001, ht + 0.05);
      n.connect(hp).connect(g).connect(master);
      n.start(ht);
      n.stop(ht + 0.06);
    }
    if (m.snare && (i % 4 === 1 || i % 4 === 3)) {
      const n = ctx.createBufferSource();
      n.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(m.snare, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      n.connect(bp).connect(g).connect(master);
      n.start(t);
      n.stop(t + 0.2);
    }
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.value = chord[0]! / 2;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.linearRampToValueAtTime(m.drums ? 0.26 : 0.16, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
    b.connect(bg).connect(master);
    b.start(t);
    b.stop(t + beat);
    if (i % 4 === 0) {
      for (const f of chord) {
        const o = ctx.createOscillator();
        o.type = m.pad;
        o.frequency.value = f;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = m.cutoff;
        const g = ctx.createGain();
        const len = beat * 4;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(m.padGain, t + (m.drums ? 0.08 : 0.6));
        g.gain.linearRampToValueAtTime(0.0001, t + len);
        o.connect(lp).connect(g).connect(master);
        o.start(t);
        o.stop(t + len);
      }
    }
  }
  return ctx.startRendering();
}

let playing: { ctx: AudioContext; src: AudioBufferSourceNode } | null = null;
/** 음악 칸의 ▶: 8초만 들려 준다. 다시 누르면 멈춘다. */
export async function previewMusic(id: MusicId, onEnd: () => void) {
  stopMusic();
  const buf = await makeMusic(id, 8, 0.6);
  if (!buf) return onEnd();
  const ctx = new AudioContext();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.onended = () => { if (playing?.src === src) { playing = null; void ctx.close(); onEnd(); } };
  src.start();
  playing = { ctx, src };
}
export function stopMusic() {
  if (!playing) return;
  const p = playing;
  playing = null;
  try { p.src.onended = null; p.src.stop(); } catch { /* 이미 멈춤 */ }
  void p.ctx.close();
}
